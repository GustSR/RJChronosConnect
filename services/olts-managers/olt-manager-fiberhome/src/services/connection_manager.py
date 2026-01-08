from netmiko import ConnectHandler

from ..core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self, host: str, username: str, password: str, device_type: str = "fiberhome", port: int = 22):
        self.connection = None
        self.device_params = {
            "device_type": device_type,
            "host": host,
            "username": username,
            "password": password,
            "port": port,
        }

    def connect(self) -> None:
        if self.connection and self.connection.is_alive():
            logger.debug("SSH connection already established.")
            return

        logger.info("Connecting to %s...", self.device_params["host"])
        self.connection = ConnectHandler(**self.device_params)
        logger.info("Connected to %s.", self.device_params["host"])

    def disconnect(self) -> None:
        if self.connection:
            self.connection.disconnect()
            logger.info("Disconnected from %s.", self.device_params["host"])
            self.connection = None

    def send_command(self, command_string: str) -> str:
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Not connected to OLT {self.device_params['host']}.")
        return self.connection.send_command(command_string)

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
