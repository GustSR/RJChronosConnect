import asyncio
from pysnmp.hlapi import v3arch
from ..base_command import OLTCommand
from typing import List, Dict, Any

class GetOntPortStateSnmpCommand(OLTCommand):
    """
    Command to get ONT Ethernet port states via SNMP WALK.
    This command retrieves the operational status of all Ethernet ports for a given ONT.
    """

    # OID for ONT Ethernet Port Operational State
    # This OID is from the HUAWEI-GPON-MIB
    OID_HW_GPON_ONT_ETH_PORT_STATE = '1.3.6.1.4.1.2011.6.128.1.1.2.62.1.22'

    def __init__(self, host: str, community_string: str, port: str, ont_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        """
        Executes the SNMP WALK command to get all ethernet port states for an ONT.
        """
        async def _execute_async() -> List[Dict[str, Any]]:
            port_states = []
            
            try:
                ont_index = self._calculate_ont_index()
            except ValueError as e:
                print(f"[Error] {e}")
                return []

            # The full OID to walk will be the base OID plus the calculated ONT index
            oid_to_walk = f"{self.OID_HW_GPON_ONT_ETH_PORT_STATE}.{ont_index}"
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
                lexicographicMode=True  # Use lexicographicMode for walking a subtree
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
                        
                        # Ensure the returned OID is still within the subtree we are walking
                        if not str(oid).startswith(oid_to_walk):
                            return port_states

                        # The port index is the last part of the OID
                        port_index_str = str(oid).split('.')[-1]
                        
                        port_states.append({
                            "port_index": int(port_index_str),
                            "status": "up" if int(value) == 1 else "down"  # 1=up, 2=down
                        })
            
            return port_states

        return asyncio.run(_execute_async())

    def _calculate_ont_index(self) -> int:
        """
        Calculates the proprietary SNMP index for an ONT based on its location.
        Formula for MA5600T/MA5608T: 4194304000 + (slot * 8192) + (pon_port * 256)
        The ONT ID is then used as a sub-index in the OID.
        """
        try:
            _, slot, pon_port = map(int, self.port_str.split('/'))
        except (ValueError, IndexError):
            raise ValueError(f"Invalid port format: {self.port_str}. Expected 'frame/slot/port'.")

        # This formula is based on community findings for MA5600T series.
        # It might need adjustments for other models.
        base_index = 4194304000
        slot_multiplier = 8192  # 256 * 32
        pon_multiplier = 256

        ont_index = base_index + (slot * slot_multiplier) + (pon_port * pon_multiplier) + self.ont_id
        return ont_index

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # This method is not used for SNMP commands as parsing is done directly in the execute method.
        pass
