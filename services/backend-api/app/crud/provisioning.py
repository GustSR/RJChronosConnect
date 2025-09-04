from typing import Dict
from ..schemas.provisioning import ProvisionedDevice

# In-memory database for provisioned devices (to be replaced by a real DB)
provisioned_devices_db: Dict[str, ProvisionedDevice] = {}
