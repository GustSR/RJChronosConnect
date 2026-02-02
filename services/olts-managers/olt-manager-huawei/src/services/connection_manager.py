import re
from netmiko import ConnectHandler
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)


def _resolve_device_type(protocol: str) -> str:
    if protocol == "telnet":
        return "huawei_telnet"
    return "huawei"


def _prompt_core(raw_prompt: str) -> str:
    if not raw_prompt:
        return ""
    prompt = raw_prompt.strip()
    if prompt.startswith("<") or prompt.startswith("["):
        prompt = prompt[1:]
    prompt = re.sub(r"[>\]#]+$", "", prompt).strip()
    if "(" in prompt:
        prompt = prompt.split("(", 1)[0].rstrip()
    prompt = re.sub(r"[>\]#]+$", "", prompt).strip()
    return prompt


def _prompt_regex(base_prompt: str) -> str:
    core = _prompt_core(base_prompt)
    escaped = re.escape(core or base_prompt.strip())
    if core and core[0].isdigit():
        escaped = rf"0*{escaped}"
    return rf"(?:<|\[)?{escaped}[^>\]#]*?(?:>|\]|#)\s*$"


class ConnectionManager:
    def __init__(self, host, username, password, protocol: str = "ssh", port: int = None, device_type: str = None):
        """
        Initializes the ConnectionManager with dynamic credentials for a specific OLT.

        Args:
            host (str): The IP address or hostname of the OLT.
            username (str): The SSH username.
            password (str): The SSH password.
            protocol (str): Protocolo de acesso (ssh ou telnet).
            port (int): Porta de acesso.
            device_type (str): Tipo de dispositivo Netmiko (opcional).
        """
        self.connection = None
        resolved_protocol = (protocol or "ssh").lower()
        resolved_device_type = device_type or _resolve_device_type(resolved_protocol)
        resolved_port = port or (23 if resolved_protocol == "telnet" else 22)
        self.protocol = resolved_protocol
        self.device_params = {
            'device_type': resolved_device_type,
            'host': host,
            'username': username,
            'password': password,
            'port': resolved_port,
        }
        self.prompt = None
        if resolved_protocol == "telnet":
            self.device_params.update({
                "global_cmd_verify": False,
                "fast_cli": False,
            })
        if settings.netmiko_session_log:
            self.device_params['session_log'] = f'netmiko_session_{host}.log'

    def _is_user_view(self, prompt: str | None) -> bool:
        if not prompt:
            return False
        return prompt.rstrip().endswith(">")

    def _ensure_enable_mode(self):
        if not self.connection or not self.connection.is_alive():
            return
        try:
            prompt = self.connection.find_prompt()
        except Exception:
            prompt = None

        if not self._is_user_view(prompt):
            return

        logger.info("Entrando em modo enable...")
        output = self.connection.send_command_timing(
            "enable",
            strip_prompt=False,
            strip_command=False,
            cmd_verify=False,
        )
        if re.search(r"password", output, re.IGNORECASE):
            secret = self.device_params.get("password")
            if secret:
                output += self.connection.send_command_timing(
                    secret,
                    strip_prompt=False,
                    strip_command=False,
                    cmd_verify=False,
                )

        try:
            self.prompt = self.connection.find_prompt()
        except Exception:
            self.prompt = None

        if self._is_user_view(self.prompt):
            logger.warning("Nao foi possivel entrar em modo enable; prompt permanece em user-view.")

    def connect(self):
        """Establishes an SSH connection to the OLT."""
        if self.connection and self.connection.is_alive():
            logger.debug(f"Conexão com {self.device_params['host']} já estabelecida.")
            return
        
        try:
            logger.info(f"Conectando a {self.device_params['host']} ({self.device_params['device_type']})...")
            self.connection = ConnectHandler(**self.device_params)
            logger.info(f"Conexão com {self.device_params['host']} bem-sucedida.")
            try:
                self.prompt = self.connection.find_prompt()
            except Exception:
                self.prompt = None
            try:
                self.connection.disable_paging(
                    command="screen-length 0 temporary",
                    cmd_verify=False,
                )
            except Exception as exc:
                logger.debug(
                    "Nao foi possivel desativar paginacao para %s: %s",
                    self.device_params["host"],
                    exc,
                )
        except Exception as e:
            logger.error(f"Falha ao conectar a {self.device_params['host']}: {e}")
            self.connection = None
            raise

    def disconnect(self):
        """Disconnects from the OLT."""
        if self.connection:
            self.connection.disconnect()
            logger.info(f"Conexão com {self.device_params['host']} desconectada.")
            self.connection = None

    def send_command(self, command_string, **kwargs):
        """Sends a command to the OLT and returns the output."""
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Não conectado à OLT {self.device_params['host']}.")

        cmd = command_string.strip().lower()
        if cmd in {"config", "system-view"}:
            self._ensure_enable_mode()

        try:
            if self.protocol == "telnet":
                self.connection.clear_buffer()
                telnet_kwargs = {
                    "strip_prompt": False,
                    "strip_command": False,
                    "cmd_verify": False,
                }
                telnet_kwargs.update(kwargs)
                use_timing = telnet_kwargs.pop("use_timing", False)
                if not use_timing:
                    if "expect_string" not in telnet_kwargs:
                        base_prompt = self.prompt or getattr(self.connection, "base_prompt", None)
                        if base_prompt:
                            telnet_kwargs["expect_string"] = _prompt_regex(base_prompt)
                    telnet_kwargs.setdefault("read_timeout", 30.0)
                    output = self.connection.send_command(command_string, **telnet_kwargs)
                else:
                    output = self.connection.send_command_timing(command_string, **telnet_kwargs)
                return output
            output = self.connection.send_command(command_string, **kwargs)
            return output
        except Exception as e:
            logger.error(f"Falha ao enviar comando '{command_string}' para {self.device_params['host']}: {e}")
            raise

    def send_command_timing(self, command_string, **kwargs):
        """Sends a command using timing-based reads (useful for Telnet)."""
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Não conectado à OLT {self.device_params['host']}.")

        timing_kwargs = {
            "strip_prompt": False,
            "strip_command": False,
            "cmd_verify": False,
        }
        timing_kwargs.update(kwargs)
        return self.connection.send_command_timing(command_string, **timing_kwargs)

    def get_password(self) -> str | None:
        """Returns the login password used for the current connection."""
        return self.device_params.get("password")

    # Context manager support for automatic connection handling
    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
