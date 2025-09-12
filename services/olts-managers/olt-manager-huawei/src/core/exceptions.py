class OLTException(Exception):
    """Base exception for OLT-related errors."""
    def __init__(self, message: str, **kwargs):
        self.message = message
        self.extra = kwargs
        super().__init__(self.message)

class OLTConnectionError(OLTException):
    """Raised when there is an error connecting to the OLT."""
    pass

class OLTAuthenticationError(OLTException):
    """Raised when there is an authentication error with the OLT."""
    pass

class OLTCommandError(OLTException):
    """Raised when a command fails to execute on the OLT."""
    pass

class OLTObjectNotFound(OLTException):
    """Raised when an object is not found on the OLT."""
    pass
