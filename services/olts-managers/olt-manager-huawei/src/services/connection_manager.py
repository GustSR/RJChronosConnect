from netmiko import ConnectHandler

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
            'session_log': f'netmiko_session_{host}.log'
        }

    def connect(self):
        """Establishes an SSH connection to the OLT."""
        if self.connection and self.connection.is_alive():
            # print("Connection already established.")
            return
        
        try:
            # print(f"Connecting to {self.device_params['host']}...")
            self.connection = ConnectHandler(**self.device_params)
            # print("Connection successful.")
        except Exception as e:
            # print(f"Failed to connect to {self.device_params['host']}: {e}")
            self.connection = None
            raise  # Re-raise the exception to be handled by the caller

    def disconnect(self):
        """Disconnects from the OLT."""
        if self.connection:
            self.connection.disconnect()
            # print(f"Connection to {self.device_params['host']} disconnected.")
            self.connection = None

    def send_command(self, command_string):
        """Sends a command to the OLT and returns the output."""
        if not self.connection or not self.connection.is_alive():
            # This check is good, but the caller should manage the connection state.
            raise ConnectionError(f"Not connected to the OLT {self.device_params['host']}.")
        
        try:
            output = self.connection.send_command(command_string)
            return output
        except Exception as e:
            # print(f"Failed to send command '{command_string}' to {self.device_params['host']}: {e}")
            raise

    # Context manager support for automatic connection handling
    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
