import asyncio
from pysnmp.hlapi import v3arch
from ..base_command import OLTCommand
from typing import Dict, Any

class GetOntPortAttributeSnmpCommand(OLTCommand):
    """
    Command to get attributes of a specific ONT Ethernet port via SNMP GET.
    This retrieves details like speed, duplex status, and operational state.
    """

    # OIDs from the standard IF-MIB
    OID_IF_SPEED = '1.3.6.1.2.1.2.2.1.5'          # Speed in bits per second
    OID_IF_OPER_STATUS = '1.3.6.1.2.1.2.2.1.8'     # Operational status (1=up, 2=down, ...)
    OID_IF_ADMIN_STATUS = '1.3.6.1.2.1.2.2.1.7'    # Admin status (1=up, 2=down, 3=testing)
    # Duplex status is often in a vendor-specific MIB, but we can try a standard one.
    OID_DOT3_STATS_DUPLEX_STATUS = '1.3.6.1.2.1.10.7.2.1.19' # from EtherLike-MIB

    def __init__(self, host: str, community_string: str, port: str, ont_id: int, eth_port_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id
        self.eth_port_id = eth_port_id

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        """
        Executes the SNMP GET commands to retrieve attributes for the specified port.
        """
        async def _execute_async() -> Dict[str, Any]:
            attributes = {}
            try:
                if_index = self._calculate_if_index(self.eth_port_id)
            except ValueError as e:
                print(f"[Error] {e}")
                return {"error": str(e)}

            oids_to_get = [
                f"{self.OID_IF_SPEED}.{if_index}",
                f"{self.OID_IF_OPER_STATUS}.{if_index}",
                f"{self.OID_IF_ADMIN_STATUS}.{if_index}",
                f"{self.OID_DOT3_STATS_DUPLEX_STATUS}.{if_index}"
            ]

            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=0)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            error_indication, error_status, error_index, var_binds = await v3arch.get_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                *[v3arch.ObjectType(v3arch.ObjectIdentity(oid)) for oid in oids_to_get]
            )

            if error_indication:
                print(f"[SNMP Error] {error_indication}")
                return {"error": str(error_indication)}
            elif error_status:
                # It's common for some OIDs (like duplex) not to exist, so we handle this gracefully.
                # We can check the error message if needed, but for now, we just proceed.
                pass

            # Parse the results
            status_map = {1: 'up', 2: 'down', 3: 'testing'}
            duplex_map = {1: 'unknown', 2: 'halfDuplex', 3: 'fullDuplex'}

            for var_bind in var_binds:
                oid, value = var_bind
                oid_str = str(oid)
                
                if value is None or 'noSuchObject' in str(value) or 'noSuchInstance' in str(value):
                    continue

                value_int = int(value)

                if oid_str.startswith(self.OID_IF_SPEED):
                    attributes['speed_mbps'] = value_int / 1000000 # Convert bps to Mbps
                elif oid_str.startswith(self.OID_IF_OPER_STATUS):
                    attributes['operational_status'] = status_map.get(value_int, 'unknown')
                elif oid_str.startswith(self.OID_IF_ADMIN_STATUS):
                    attributes['admin_status'] = status_map.get(value_int, 'unknown')
                elif oid_str.startswith(self.OID_DOT3_STATS_DUPLEX_STATUS):
                    attributes['duplex_status'] = duplex_map.get(value_int, 'unknown')

            return attributes

        return asyncio.run(_execute_async())

    def _calculate_if_index(self, eth_port_index: int) -> int:
        """ Calculates the SNMP ifIndex for a specific ONT Ethernet port. """
        try:
            _, slot, pon_port = map(int, self.port_str.split('/'))
        except (ValueError, IndexError):
            raise ValueError(f"Invalid port format: {self.port_str}. Expected 'frame/slot/port'.")

        slot_multiplier = 33554432
        pon_multiplier = 2097152
        ont_multiplier = 65536
        port_type_multiplier = 4096
        ont_port_type = 1

        if_index = (slot * slot_multiplier) + \
                   (pon_port * pon_multiplier) + \
                   (self.ont_id * ont_multiplier) + \
                   (ont_port_type * port_type_multiplier) + \
                   eth_port_index
        return if_index

    def _parse_output(self, raw_output: str, olt_version: str) -> Dict[str, Any]:
        # Not used for SNMP commands
        pass
