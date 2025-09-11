from netmiko import ConnectHandler
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)

class ConnectionManager:
    def __init__(self, host, username, password, device_type='huawei'):
        """
        Initializes the ConnectionManager with dynamic credentials for a specific OLT.

        Args:
            host (str): The IP address or hostname of the OLT.
            username (str): The SSH username.
            password (str): The SSH password.
        """
        self.connection = None
        self.device_params = {
            'device_type': device_type,
            'host': host,
            'username': username,
            'password': password,
            'port': 22,  # Default SSH port
        }
        if settings.netmiko_session_log:
            self.device_params['session_log'] = f'netmiko_session_{host}.log'

    def connect(self):
        """Establishes an SSH connection to the OLT."""
        if self.connection and self.connection.is_alive():
            logger.debug(f"Conexão com {self.device_params['host']} já estabelecida.")
            return
        
        try:
            logger.info(f"Conectando a {self.device_params['host']}...")
            self.connection = ConnectHandler(**self.device_params)
            logger.info(f"Conexão com {self.device_params['host']} bem-sucedida.")
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

    def send_command(self, command_string):
        """Sends a command to the OLT and returns the output."""
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Não conectado à OLT {self.device_params['host']}.")
        
        try:
            output = self.connection.send_command(command_string)
            return output
        except Exception as e:
            logger.error(f"Falha ao enviar comando '{command_string}' para {self.device_params['host']}: {e}")
            raise

    # Context manager support for automatic connection handling
    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
