import asyncio
from pysnmp.hlapi import v3arch
from ..base_command import OLTCommand
from typing import List, Dict, Any

class GetOntRegisterInfoSnmpCommand(OLTCommand):
    """
    Command to get ONT registration history for a specific PON port via SNMP WALK.
    This walks the proprietary HUAWEI-GPON-MIB to get details about ONTs that have tried to register.
    """

    # OID for the ONT registration history table
    OID_ONT_REGISTER_INFO_TABLE = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9' # hwGponDeviceOntRegisterInfo

    def __init__(self, host: str, community_string: str, port: str):
        self.host = host
        self.community = community_string
        self.port_str = port

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        """
        Executes the SNMP WALK to get ONT registration history.
        """
        async def _execute_async() -> List[Dict[str, Any]]:
            register_info_list = []
            
            try:
                port_index = self._calculate_port_index()
            except ValueError as e:
                print(f"[Error] {e}")
                return []

            # We walk the entire table and then filter by the port index
            oid_to_walk = self.OID_ONT_REGISTER_INFO_TABLE
            snmp_engine = v3arch.SnmpEngine()
            auth = v3arch.CommunityData(self.community, mpModel=0)
            transport = await v3arch.UdpTransportTarget.create((self.host, 161))
            context = v3arch.ContextData()

            async for (error_indication, error_status, error_index, var_binds) in v3arch.walk_cmd(
                snmp_engine,
                auth,
                transport,
                context,
                v3arch.ObjectType(v3arch.ObjectIdentity(oid_to_walk)),
                lexicographicMode=True
            ):
                if error_indication:
                    print(f"[SNMP Error] {error_indication}")
                    break
                elif error_status:
                    error_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                    print(f"[SNMP Error] {error_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}")
                    break
                else:
                    for var_bind in var_binds:
                        oid, value = var_bind
                        oid_str = str(oid)

                        if not oid_str.startswith(oid_to_walk):
                            # We have walked past the relevant table
                            return register_info_list

                        # The index of this OID typically includes the port index and ONT ID.
                        # Example OID: .1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9.1.2.4194304256.1
                        # We need to extract the port index from the OID to filter.
                        try:
                            oid_parts = oid_str.split('.')
                            # This parsing is based on observed structure and might need adjustment
                            current_port_index = int(oid_parts[-2]) 
                            ont_id = int(oid_parts[-1])

                            if current_port_index == port_index:
                                # This entry belongs to the port we are interested in.
                                # The value itself is often a structured string or requires MIB knowledge to parse.
                                # For now, we will return the raw value.
                                register_info_list.append({
                                    'ont_id': ont_id,
                                    'port': self.port_str,
                                    'register_info': str(value) # Or value.prettyPrint()
                                })

                        except (IndexError, ValueError):
                            # OID format is not as expected, skip this entry
                            continue
            
            return register_info_list

        return asyncio.run(_execute_async())

    def _calculate_port_index(self) -> int:
        """
        Calculates the proprietary SNMP index for a PON port.
        Formula for MA5600T/MA5608T: 4194304000 + (slot * 8192) + (pon_port * 256)
        """
        try:
            _, slot, pon_port = map(int, self.port_str.split('/'))
        except (ValueError, IndexError):
            raise ValueError(f"Invalid port format: {self.port_str}. Expected 'frame/slot/port'.")

        base_index = 4194304000
        slot_multiplier = 8192
        pon_multiplier = 256

        port_index = base_index + (slot * slot_multiplier) + (pon_port * pon_multiplier)
        return port_index

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # Not used for SNMP commands
        pass
