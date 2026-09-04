import os
import queue
import requests
import time
import threading
from dotenv import set_key, find_dotenv
from config import config
from models import AgentRegistration, AttackEvent
from utils import logger


class Reporter:
    def __init__(self):
        self.base_url = config.BACKEND_URL
        self.agent_id = config.AGENT_ID
        self.running = False

        # Async attack event queue — prevents blocking the detection loop
        self._event_queue: queue.Queue = queue.Queue(maxsize=200)
        self._sender_thread = None
        self.heartbeat_thread = None

    def _auth_headers(self) -> dict:
        """Build per-agent auth headers from current config (token may update after registration)."""
        return {
            "X-Agent-Id": config.AGENT_ID,
            "X-Agent-Token": config.AGENT_TOKEN,
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------ #
    #  Registration                                                        #
    # ------------------------------------------------------------------ #

    def register(self) -> bool:
        """
        Register the agent with the backend.

        On the very first run AGENT_TOKEN is empty.  The backend generates a
        per-agent token, returns it in the response, and we write it back to
        .env so every subsequent call is authenticated.
        """
        logger.info(f"Registering agent {self.agent_id} with ARCDIS backend...")
        reg_data = AgentRegistration(
            agent_id=self.agent_id,
            hostname=config.HOSTNAME,
            os_info=config.OS_INFO,
            version=config.AGENT_VERSION
        )

        # On first run the token is empty — use USER_ID header just for registration.
        reg_headers = {
            "X-Agent-Id": config.AGENT_ID,
            "X-Agent-Token": config.AGENT_TOKEN,
            "X-User-Id": config.USER_ID,
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/agents/register",
                headers=reg_headers,
                json=reg_data.to_dict(),
                timeout=10
            )
            if response.status_code == 201:
                data = response.json()
                token = data.get("agent_token")
                if token:
                    self._persist_token(token)
                    logger.info("Agent registered. Per-agent token stored.")
                else:
                    logger.warning("Registration response missing agent_token field.")
                return True
            elif response.status_code == 400:
                # Already registered — token must already be in .env
                logger.info("Agent already registered.")
                return True
            else:
                logger.error(f"Registration failed: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Registration request failed: {e}")
            return False

    def _persist_token(self, token: str) -> None:
        """Write AGENT_TOKEN back to the .env file and update live config."""
        try:
            env_path = find_dotenv(usecwd=True)
            if not env_path:
                # Fall back to a .env next to this script
                env_path = os.path.join(os.path.dirname(__file__), ".env")
            set_key(env_path, "AGENT_TOKEN", token)
            config.AGENT_TOKEN = token  # update in-memory immediately
            logger.info("AGENT_TOKEN written to .env.")
        except Exception as e:
            logger.error(f"Failed to persist AGENT_TOKEN to .env: {e}")
            # Still update in-memory so this run works even if file write fails
            config.AGENT_TOKEN = token

    # ------------------------------------------------------------------ #
    #  Attack event reporting — non-blocking                              #
    # ------------------------------------------------------------------ #

    def send_attack_event(self, event: AttackEvent):
        """Enqueue an attack event for background sending (non-blocking)."""
        try:
            self._event_queue.put_nowait(event)
        except queue.Full:
            logger.warning("Attack event queue full — dropping event to avoid blocking monitor.")

    def _sender_loop(self):
        """Background thread: drains the event queue and POSTs events to the backend."""
        while self.running:
            try:
                event = self._event_queue.get(timeout=1.0)
            except queue.Empty:
                continue
            try:
                response = requests.post(
                    f"{self.base_url}/api/attacks",
                    headers=self._auth_headers(),
                    json=event.to_dict(),
                    timeout=5
                )
                if response.status_code == 201:
                    logger.info("Attack event reported to backend successfully.")
                else:
                    logger.error(f"Failed to report attack event: {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to send attack event (network error): {e}")
            finally:
                self._event_queue.task_done()

    # ------------------------------------------------------------------ #
    #  Heartbeat                                                           #
    # ------------------------------------------------------------------ #

    def _heartbeat_loop(self):
        """Background loop to send periodic heartbeats."""
        while self.running:
            try:
                # Send optional status body so the backend knows if eBPF is unavailable.
                # self._ebpf_available is set by the agent before starting the heartbeat.
                heartbeat_status = "online" if getattr(self, "_ebpf_available", True) else "degraded"
                response = requests.patch(
                    f"{self.base_url}/api/agents/{self.agent_id}/heartbeat",
                    headers=self._auth_headers(),
                    json={"status": heartbeat_status},
                    timeout=5
                )
                if response.status_code != 200:
                    logger.warning(f"Heartbeat failed: {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                logger.debug(f"Heartbeat network error: {e}")

            time.sleep(config.HEARTBEAT_INTERVAL)

    def start_heartbeat(self):
        """Start the background heartbeat and event-sender threads."""
        self.running = True

        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()
        logger.info(f"Heartbeat thread started ({config.HEARTBEAT_INTERVAL}s interval).")

        self._sender_thread = threading.Thread(target=self._sender_loop, daemon=True)
        self._sender_thread.start()
        logger.info("Attack event sender thread started.")

    def stop_heartbeat(self):
        self.running = False
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=2)
        if self._sender_thread:
            self._sender_thread.join(timeout=3)
