from abc import ABC, abstractmethod

class OLTCommand(ABC):
    """Abstract Base Class for all OLT commands."""

    @abstractmethod
    def execute(self, connection_manager, olt_version: str):
        """
        Executes the command and returns structured data.

        Args:
            connection_manager: An instance of ConnectionManager.
            olt_version (str): The detected version of the OLT firmware.
        """
        pass
