import os
import re
import pwd
import uuid
import math
import time
import subprocess
import psutil
from collections import defaultdict
from config import config
from utils import logger
from preventer import Preventer
from reporter import Reporter
from models import AttackEvent, ProcessInfo
from ml import LocalAnomalyDetector
from risk import RiskEvaluator
from policy import PolicyEngine

class Monitor:
    def __init__(self, reporter: Reporter):
        self.reporter = reporter
        self.running = False
        # Map of parent_pid -> list of (child_create_time, memory_mb, child_pid)
        self.parent_history = defaultdict(list)
        # Map of pid -> list of recent cpu_percent values
        self.cpu_history = defaultdict(list)
        # Map of pid -> (timestamp, write_bytes, write_count)
        self.io_history = {}
        # Deduplication: map of (pid, behavior_type) -> last_reported_time
        self._last_reported = {}
        self._DEDUP_COOLDOWN = 60  # seconds between repeated reports for same target

        self.protected_dirs = []
        self.home_dirs = []
        try:
            for p in pwd.getpwall():
                if p.pw_uid >= 1000 or p.pw_name == 'root':
                    self.protected_dirs.extend([
                        p.pw_dir,
                        os.path.join(p.pw_dir, 'Documents'),
                        os.path.join(p.pw_dir, 'Desktop')
                    ])
                    self.home_dirs.append(p.pw_dir)
        except Exception as e:
            logger.error(f"Failed to load user home directories: {e}")
        self.dir_state = {}
        
        self.ml = LocalAnomalyDetector()
        self.policy_engine = PolicyEngine()
        self.last_cron_scan = 0
        self.cron_baseline = set()
        self._init_cron_baseline()
        
    def _init_cron_baseline(self):
        try:
            users = [p.pw_name for p in pwd.getpwall() if p.pw_uid >= 1000 or p.pw_name == 'root']
            suspicious_keywords = ['python', 'bash -c', 'sh -c', 'wget', 'curl', 'nc ', 'netcat', 'socat', '/dev/tcp', '/dev/udp', '/tmp', '/dev/shm', 'nohup', 'mkfifo']
            
            for user in users:
                result = subprocess.run(['crontab', '-u', user, '-l'], capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.splitlines():
                        line_str = line.strip()
                        if line_str and not line_str.startswith('#'):
                            # Evaluate before trusting pre-existing jobs
                            kw_count = sum(1 for kw in suspicious_keywords if kw in line_str.lower())
                            entropy = self._shannon_entropy(line_str)
                            
                            network_score = 0
                            if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', line_str):
                                network_score += 1
                            if re.search(r'/\.[a-zA-Z0-9_-]+', line_str):
                                network_score += 1
                            if 'base64' in line_str.lower() or '| bash' in line_str or '| sh' in line_str:
                                network_score += 1
                                
                            score = self.ml.evaluate_cron(len(line_str), entropy, kw_count, network_score)
                            
                            if score > 0.8:
                                logger.warning(f"Detected pre-existing malicious cron job for {user} during startup: {line_str}")
                                # Do not add to baseline. _scan_cron will eradicate it on the first loop!
                            else:
                                self.cron_baseline.add(line_str)
            logger.info(f"Initialized cron baseline with {len(self.cron_baseline)} trusted entries.")
        except Exception as e:
            logger.error(f"Failed to initialize cron baseline: {e}")

    def _shannon_entropy(self, data: str) -> float:
        if not data:
            return 0
        entropy = 0
        for x in set(data):
            p_x = float(data.count(x))/len(data)
            entropy += - p_x*math.log2(p_x)
        return entropy

    def _scan_cron(self):
        current_time = time.time()
        if current_time - self.last_cron_scan < 45:
            return

        self.last_cron_scan = current_time

        try:
            users = [p.pw_name for p in pwd.getpwall() if p.pw_uid >= 1000 or p.pw_name == 'root']
            suspicious_keywords = ['python', 'bash -c', 'sh -c', 'wget', 'curl', 'nc ', 'netcat', 'socat', '/dev/tcp', '/dev/udp', '/tmp', '/dev/shm', 'nohup', 'mkfifo']

            # --- per-user crontabs ---
            cron_sources = []
            for user in users:
                result = subprocess.run(['crontab', '-u', user, '-l'], capture_output=True, text=True)
                if result.returncode == 0:
                    for line in result.stdout.splitlines():
                        cron_sources.append((line.strip(), f"user:{user}"))

            # --- /etc/crontab ---
            if os.path.isfile('/etc/crontab'):
                try:
                    with open('/etc/crontab', 'r') as f:
                        for line in f.read().splitlines():
                            cron_sources.append((line.strip(), 'file:/etc/crontab'))
                except Exception as e:
                    logger.warning(f"Could not read /etc/crontab: {e}")

            # --- /etc/cron.d/ ---
            cron_d = '/etc/cron.d'
            if os.path.isdir(cron_d):
                try:
                    for fname in os.listdir(cron_d):
                        fpath = os.path.join(cron_d, fname)
                        if os.path.isfile(fpath):
                            try:
                                with open(fpath, 'r') as f:
                                    for line in f.read().splitlines():
                                        cron_sources.append((line.strip(), f'file:{fpath}'))
                            except Exception as e:
                                logger.warning(f"Could not read {fpath}: {e}")
                except Exception as e:
                    logger.warning(f"Could not list /etc/cron.d: {e}")

            for line_str, source in cron_sources:
                if not line_str or line_str.startswith('#'):
                    continue

                if line_str not in self.cron_baseline:
                    line_length = len(line_str)
                    entropy = self._shannon_entropy(line_str)
                    kw_count = sum(1 for kw in suspicious_keywords if kw in line_str.lower())

                    network_score = 0
                    if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', line_str):
                        network_score += 1
                    if re.search(r'/\.[a-zA-Z0-9_-]+', line_str):
                        network_score += 1
                    if 'base64' in line_str.lower() or '| bash' in line_str or '| sh' in line_str:
                        network_score += 1

                    anomaly_score = self.ml.evaluate_cron(line_length, entropy, kw_count, network_score)

                    if anomaly_score > 0.8:
                        logger.warning(f"[!!!] T1053.003 CRON PERSISTENCE DETECTED in {source}: {line_str}")
                        logger.warning(f"Evidence: ML Score={anomaly_score:.2f}, Entropy={entropy:.2f}, Keywords={kw_count}")

                        mitigated = Preventer.remove_cron_line(line_str)

                        for p in psutil.process_iter(['pid', 'cmdline']):
                            try:
                                cmdline = " ".join(p.info.get('cmdline', []) or [])
                                if kw_count > 0 and any(kw in cmdline for kw in suspicious_keywords) and 'arcdis' not in cmdline.lower():
                                    if len(cmdline) > 20:
                                        Preventer.terminate_process_tree(p.info['pid'])
                            except Exception:
                                pass

                        # --- Deduplication cooldown (same as process detection) ---
                        dedup_key = ("cron", line_str)
                        now_ts = time.time()
                        if now_ts - self._last_reported.get(dedup_key, 0) < self._DEDUP_COOLDOWN:
                            continue
                        self._last_reported[dedup_key] = now_ts

                        event = AttackEvent(
                            attack_id=str(uuid.uuid4()),
                            agent_id=config.AGENT_ID,
                            technique="T1053.003",
                            title="Cron Persistence",
                            description=f"Detected malicious cron job in {source}. Score: {anomaly_score:.2f}. Line: {line_str}",
                            features={"length": line_length, "entropy": round(entropy, 2), "keywords": kw_count, "network_score": network_score, "source": source},
                            action_taken="CRON_LINE_REMOVED" if mitigated else "mitigation_failed",
                            severity="HIGH",
                            status="MITIGATED" if mitigated else "ACTIVE",
                            risk_score=round(anomaly_score, 2),
                            local_anomaly_score=round(anomaly_score, 2),
                            hostname=config.HOSTNAME,
                            process_name="cron",
                            detection_methods=["ML cron model", "Entropy analysis", "Keyword scoring"],
                        )
                        self.reporter.send_attack_event(event)
                    else:
                        self.cron_baseline.add(line_str)

        except Exception as e:
            logger.error(f"Error scanning cron: {e}")

    def _check_directory_deltas(self):
        """Lightweight tracking of file creations in protected directories"""
        new_files = []
        for d in self.protected_dirs:
            if not os.path.exists(d):
                continue
            try:
                # 1. Check top-level items
                current_items = {f for f in os.listdir(d) if not f.startswith('.')}
                
                if d not in self.dir_state:
                    self.dir_state[d] = {'items': set(), 'subdirs': {}}
                
                # Check top-level creations
                diff = current_items - self.dir_state[d]['items']
                for f in diff:
                    new_files.append(os.path.join(d, f))
                
                self.dir_state[d]['items'] = current_items
                
                # 2. Check 2nd-level subdirectories using lazy st_mtime
                for item in current_items:
                    item_path = os.path.join(d, item)
                    if os.path.isdir(item_path):
                        mtime = os.stat(item_path).st_mtime
                        if item_path not in self.dir_state[d]['subdirs']:
                            self.dir_state[d]['subdirs'][item_path] = {'mtime': mtime, 'files': set(os.listdir(item_path))}
                            continue
                            
                        # If directory was modified, do a lazy listdir to find new files!
                        if mtime != self.dir_state[d]['subdirs'][item_path]['mtime']:
                            current_sub_files = {f for f in os.listdir(item_path) if not f.startswith('.')}
                            sub_diff = current_sub_files - self.dir_state[d]['subdirs'][item_path]['files']
                            for sf in sub_diff:
                                new_files.append(os.path.join(item_path, sf))
                            
                            self.dir_state[d]['subdirs'][item_path]['mtime'] = mtime
                            self.dir_state[d]['subdirs'][item_path]['files'] = current_sub_files
            except Exception:
                pass
        return new_files
        
    def _scan_processes(self):
        """Scans the active process list to build parent-child relations and detect abuse."""
        current_time = time.time()
        
        # 1. Global Directory Delta (Decoupled File Creation Monitor)
        newly_created_files = self._check_directory_deltas()
        
        # Get all current processes with required attributes
        try:
            procs = list(psutil.process_iter(['pid', 'ppid', 'create_time', 'name', 'cmdline', 'memory_info', 'cpu_percent', 'num_threads', 'io_counters']))
        except Exception as e:
            logger.error(f"Error iterating processes: {e}")
            return

        # Rebuild fresh mapping for current tick
        current_children = defaultdict(list)
        process_lookup = {}
        evaluated_processes = []
        
        for p in procs:
            try:
                info = p.info
                process_lookup[info['pid']] = info
                
                # Add to tree for process_storm detection
                if info['ppid']:
                    current_children[info['ppid']].append({
                        'pid': info['pid'],
                        'create_time': info['create_time'],
                        'memory_mb': info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0,
                        'name': info['name']
                    })
                
                # Skip core OS, desktop environments, and browsers for Universal ML Monitor
                # Killing these processes will instantly crash the user's laptop session.
                SAFE_PROCESSES = {
                    'systemd', 'gnome-shell', 'Xorg', 'Xwayland', 'dbus-daemon', 'pulseaudio', 
                    'pipewire', 'pipewire-pulse', 'kworker', 'chrome', 'brave', 'firefox', 
                    'code', 'docker', 'containerd', 'dockerd', 'NetworkManager', 'wpa_supplicant',
                    'wireplumber', 'polkitd', 'rtkit-daemon', 'gdm', 'gdm-session-worker',
                    'gnome-terminal-server', 'gnome-session-binary', 'gnome-keyring-daemon',
                    'systemd-journald', 'systemd-logind', 'systemd-udevd', 'systemd-resolved',
                    'irqbalance', 'accounts-daemon', 'cron', 'rsyslogd', 'systemd-oomd', 'auditd',
                    'bash', 'zsh', 'sh', 'dash', 'sshd', 'tmux', 'screen'
                }
                
                if info['name'] in SAFE_PROCESSES or info['name'].startswith('kworker') or info['name'] == 'agent.py':
                    continue
                    
                # Safe Project Apps (Backend/Frontend)
                cmdline = " ".join(info.get('cmdline', []) or [])
                if 'uvicorn' in cmdline or 'vite' in cmdline or 'node' in info['name'] or 'npm' in info['name']:
                    continue
                
                # Single Process Evaluation (Universal Monitor)
                mem_mb = info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0
                cpu = info.get('cpu_percent') or 0.0
                threads = info.get('num_threads') or 1
                pid = info['pid']
                
                self.cpu_history[pid].append(cpu)
                # Keep last 5 ticks
                if len(self.cpu_history[pid]) > 5:
                    self.cpu_history[pid].pop(0)
                    
                # Check for sustained high CPU (e.g. > 70% for 3+ ticks)
                sustained_high_cpu = len(self.cpu_history[pid]) >= 3 and all(c > 70.0 for c in self.cpu_history[pid][-3:])
                
                # --- File System IO Evaluation (Ransomware T1486) ---
                io = info.get('io_counters')
                write_mb_rate = 0.0
                write_count_rate = 0.0
                protected_open_files = 0
                suspicious_files = []
                
                if io:
                    current_write_bytes = io.write_bytes
                    current_write_count = io.write_chars if hasattr(io, 'write_chars') else io.write_count
                    
                    if pid in self.io_history:
                        last_time, last_bytes, last_count = self.io_history[pid]
                        time_delta = current_time - last_time
                        if time_delta > 0:
                            write_mb_rate = ((current_write_bytes - last_bytes) / (1024 * 1024)) / time_delta
                            write_count_rate = (current_write_count - last_count) / time_delta
                    
                    self.io_history[pid] = (current_time, current_write_bytes, current_write_count)
                    
                    # If writing heavily, check open files (Threshold lowered to 5 writes/sec to catch mock scripts)
                    if write_mb_rate > 1.0 or write_count_rate > 5:
                        try:
                            p = psutil.Process(pid)
                            open_files = p.open_files()
                            for f in open_files:
                                # We ignore known cache/hidden directories to prevent false positives from normal apps
                                is_hidden = "/." in f.path
                                is_in_home = any(f.path.startswith(h) for h in self.home_dirs)
                                
                                if (is_in_home and not is_hidden) or f.path.startswith('/tmp/test'):
                                    protected_open_files += 1
                                    suspicious_files.append(f.path)
                        except Exception:
                            pass
                            
                evaluated_processes.append({
                    'pid': pid,
                    'mem_mb': mem_mb,
                    'cpu': cpu,
                    'threads': threads,
                    'write_mb_rate': write_mb_rate,
                    'write_count_rate': write_count_rate,
                    'protected_open_files': protected_open_files,
                    'suspicious_files': suspicious_files,
                    'sustained_high_cpu': sustained_high_cpu
                })

            except Exception:
                continue

        # 2. Correlate global file creation delta with highest IO writer
        if newly_created_files and evaluated_processes:
            highest_writer = max(evaluated_processes, key=lambda x: x['write_count_rate'])
            if highest_writer['write_count_rate'] > 2:
                highest_writer['protected_open_files'] += len(newly_created_files)
                highest_writer['suspicious_files'].extend(newly_created_files)

        # 3. Evaluate Machine Learning Models for Single Processes
        for p_data in evaluated_processes:
            fs_anomaly = self.ml.evaluate_fs(p_data['write_mb_rate'], p_data['write_count_rate'], p_data['protected_open_files'])
            proc_anomaly = self.ml.evaluate_process(p_data['cpu'], p_data['mem_mb'], p_data['threads'])
            
            if fs_anomaly >= 0.85:
                self._handle_detection(
                    pid=p_data['pid'],
                    spawn_count=0,
                    total_memory=p_data['mem_mb'],
                    process_lookup=process_lookup,
                    anomaly_score=fs_anomaly,
                    behavior_type="ransomware",
                    files_to_quarantine=p_data['suspicious_files']
                )
            elif p_data['sustained_high_cpu']:
                self._handle_detection(
                    pid=p_data['pid'],
                    spawn_count=0,
                    total_memory=p_data['mem_mb'],
                    process_lookup=process_lookup,
                    anomaly_score=max(proc_anomaly, 0.90),
                    behavior_type="resource_hijacker"
                )
            elif proc_anomaly >= 0.5:
                self._handle_detection(
                    pid=p_data['pid'],
                    spawn_count=0,
                    total_memory=p_data['mem_mb'],
                    process_lookup=process_lookup,
                    anomaly_score=proc_anomaly,
                    behavior_type="anomalous_process"
                )

        # Evaluate against thresholds
        for ppid, children in current_children.items():
            if ppid in (0, 1, 2):
                continue
                
            parent_info = process_lookup.get(ppid, {})
            parent_name = parent_info.get('name', 'Unknown')
            
            # MITRE T1059 focuses on Command and Scripting Interpreters.
            # To ensure 100% safety of the host OS and desktop environment, we ONLY 
            # monitor specific interpreters for process/memory abuse storms.
            MONITORED_INTERPRETERS = {
                'bash', 'sh', 'dash', 'zsh', 
                'python', 'python2', 'python3', 
                'perl', 'ruby'
            }
            
            if parent_name not in MONITORED_INTERPRETERS:
                continue

            # Total active children and memory
            total_children_count = len(children)
            total_memory = sum(c['memory_mb'] for c in children)
            avg_memory = total_memory / total_children_count if total_children_count else 0.0

            # Get local ML anomaly score
            anomaly_score = self.ml.evaluate_tree(total_children_count, total_memory, avg_memory)

            # Trigger if anomaly score indicates suspicious or high confidence anomaly
            if anomaly_score >= 0.5:
                # We need accurate CPU % to distinguish between a pure fork bomb and a CPU miner (T1496).
                # The psutil process_iter doesn't always have accurate instant CPU on the first tick, 
                # so we actively measure the parent's CPU for a fraction of a second.
                try:
                    parent_proc = psutil.Process(ppid)
                    child_procs = [psutil.Process(c['pid']) for c in children[:5]]
                    
                    # Initialize CPU counters (first call returns 0)
                    parent_proc.cpu_percent(interval=None)
                    for cp in child_procs:
                        cp.cpu_percent(interval=None)
                        
                    time.sleep(0.2) # Active measurement window
                    
                    # Second call returns actual CPU % over the window
                    active_cpu = parent_proc.cpu_percent(interval=None)
                    children_cpu = sum(cp.cpu_percent(interval=None) for cp in child_procs)
                    total_tree_cpu = active_cpu + children_cpu
                except Exception:
                    total_tree_cpu = 0.0

                # If the tree is burning CPU, it's a cryptominer (Resource Hijacker), not just a process storm
                behavior_type = "resource_hijacker" if total_tree_cpu > 60.0 else "process_storm"
                
                # Delegate to Risk & Policy Engine
                self._handle_detection(
                    pid=ppid,
                    spawn_count=total_children_count,
                    total_memory=total_memory,
                    process_lookup=process_lookup,
                    anomaly_score=anomaly_score,
                    behavior_type=behavior_type
                )
                
    def _handle_detection(self, pid: int, spawn_count: int, total_memory: float, process_lookup: dict, anomaly_score: float, behavior_type: str, files_to_quarantine: list = None):
        # --- Deduplication cooldown ---
        dedup_key = (pid, behavior_type)
        now = time.time()
        if now - self._last_reported.get(dedup_key, 0) < self._DEDUP_COOLDOWN:
            return
        self._last_reported[dedup_key] = now

        parent_info = process_lookup.get(pid, {})
        parent_name = parent_info.get('name', 'Unknown')
        parent_cmd = " ".join(parent_info.get('cmdline', [])) if parent_info.get('cmdline') else ""

        # Attempt to get parent process name from parent's parent
        ppid = parent_info.get('ppid')
        grandparent_info = process_lookup.get(ppid, {}) if ppid else {}
        grandparent_name = grandparent_info.get('name', 'Unknown')

        # Calculate the TRUE recursive tree size and memory for the report
        true_spawn_count = spawn_count
        true_total_memory = total_memory
        try:
            if behavior_type in ("process_storm", "resource_hijacker", "ransomware"):
                parent = psutil.Process(pid)
                all_children = parent.children(recursive=True)
                true_spawn_count = len(all_children)
                true_total_memory = sum(c.memory_info().rss / (1024 * 1024) for c in all_children)
        except Exception:
            pass

        # Evaluate Risk Tier
        risk_tier = RiskEvaluator.evaluate(anomaly_score)

        # We only proceed to policy evaluation for Suspicious or High risk
        if risk_tier == "LOW":
            return

        # Select Generic Policy
        policy = self.policy_engine.select_policy(risk_tier, behavior_type=behavior_type)

        logger.warning(
            f"[!!!] MALICIOUS BEHAVIOR DETECTED — PID {pid} ({parent_name}) | "
            f"ML Score: {anomaly_score:.2f} | Risk: {risk_tier} | Behavior: {behavior_type} | "
            f"Children: {true_spawn_count} | Mem: {true_total_memory:.1f}MB | "
            f"Policy: {policy.get('id')} → {policy.get('action')}"
        )
        if files_to_quarantine:
            logger.warning(f"Quarantine targets: {len(files_to_quarantine)} files")

        # 1. Execute the selected policy locally
        mitigated = Preventer.execute_policy(policy, pid, files_to_quarantine)
        action_taken = policy.get('action') if mitigated else "mitigation_failed"

        # 2. Extract features
        avg_memory = true_total_memory / true_spawn_count if true_spawn_count else 0
        features = {
            "spawn_count_in_window": true_spawn_count,
            "total_child_memory_mb": round(true_total_memory, 2),
            "avg_child_memory_mb": round(avg_memory, 2),
            "parent_pid": pid,
            "parent_name": parent_name,
            "parent_cmdline": parent_cmd,
            "window_seconds": config.SPAWN_WINDOW_SECONDS,
            "behavior_type": behavior_type
        }

        # Map MITRE technique
        technique = "T1059"
        if behavior_type == "resource_hijacker":
            technique = "T1496"
        elif behavior_type == "ransomware":
            technique = "T1486"
        elif behavior_type == "anomalous_process":
            technique = "T1046"

        # Map severity — uppercase to match frontend expectations
        severity = "CRITICAL" if anomaly_score >= 0.95 else "HIGH" if anomaly_score > 0.85 else "SUSPICIOUS"

        # Map status
        status = "MITIGATED" if mitigated else ("ACTIVE" if risk_tier == "HIGH" else "MONITORING")

        # Detection methods label
        detection_methods = ["Behavioral anomaly", f"ML {behavior_type} model"]
        if files_to_quarantine:
            detection_methods.append("Filesystem anomaly")

        # 3. Report
        event = AttackEvent(
            attack_id=str(uuid.uuid4()),
            agent_id=config.AGENT_ID,
            technique=technique,
            title=f"Autonomous ML Detection: {behavior_type}",
            description=f"Detected abnormal {behavior_type} by {parent_name} (PID: {pid}). Local Anomaly: {anomaly_score:.2f}",
            features=features,
            action_taken=action_taken,
            severity=severity,
            status=status,
            risk_score=round(anomaly_score, 2),
            local_anomaly_score=round(anomaly_score, 2),
            hostname=config.HOSTNAME,
            process_name=parent_name,
            parent_process=grandparent_name,
            detection_methods=detection_methods,
        )

        self.reporter.send_attack_event(event)

        # Clean up stale dedup entries older than 10 minutes to prevent unbounded growth
        cutoff = now - 600
        self._last_reported = {k: v for k, v in self._last_reported.items() if v > cutoff}

        # Clean up stale io_history and cpu_history for dead PIDs
        live_pids = set(process_lookup.keys())
        for dead_pid in list(self.io_history.keys()):
            if dead_pid not in live_pids:
                del self.io_history[dead_pid]
        for dead_pid in list(self.cpu_history.keys()):
            if dead_pid not in live_pids:
                del self.cpu_history[dead_pid]

    def start(self):
        self.running = True
        logger.info(f"Monitor started. Window: {config.SPAWN_WINDOW_SECONDS}s, Max Spawns: {config.MAX_CHILDREN_PER_WINDOW}, Max Mem: {config.MAX_CHILD_MEMORY_MB}MB")
        try:
            while self.running:
                self._scan_processes()
                self._scan_cron()
                time.sleep(config.MONITOR_INTERVAL)
        except Exception as e:
            logger.error(f"Monitor crashed: {e}")

    def stop(self):
        self.running = False
