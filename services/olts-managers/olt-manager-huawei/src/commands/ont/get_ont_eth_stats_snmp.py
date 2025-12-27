import asyncio
from pysnmp.hlapi import v3arch
from ..base_command import OLTCommand
from typing import Dict, Any

class GetOntEthStatsSnmpCommand(OLTCommand):
    """
    Command to get ONT Ethernet port statistics via SNMP GET.
    Retrieves packet and error counts for a specific Ethernet port on an ONT.
    """

    # OIDs from HUAWEI-GPON-MIB and standard IF-MIB for Ethernet statistics
    # Note: Specific OIDs for errors/discards can vary. These are common ones.
    OID_IF_IN_UCAST_PKTS = '1.3.6.1.2.1.2.2.1.11'  # Ingress unicast packets
    OID_IF_IN_ERRORS = '1.3.6.1.2.1.2.2.1.14'      # Ingress errors
    OID_IF_IN_DISCARDS = '1.3.6.1.2.1.2.2.1.13'    # Ingress discards
    OID_IF_OUT_UCAST_PKTS = '1.3.6.1.2.1.2.2.1.17' # Egress unicast packets
    OID_IF_OUT_ERRORS = '1.3.6.1.2.1.2.2.1.20'     # Egress errors
    OID_IF_OUT_DISCARDS = '1.3.6.1.2.1.2.2.1.19'   # Egress discards

    def __init__(self, host: str, community_string: str, port: str, ont_id: int, eth_port_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id
        self.eth_port_id = eth_port_id

    def execute(self, connection_manager=None, olt_version: str = None) -> Dict[str, Any]:
        """
        Executes the SNMP GET commands to retrieve statistics for the specified port.
        """
        async def _execute_async() -> Dict[str, Any]:
            stats = {}
            try:
                if_index = self._calculate_if_index(self.eth_port_id)
            except ValueError as e:
                print(f"[Error] {e}")
                return {"error": str(e)}

            oids_to_get = [
                f"{self.OID_IF_IN_UCAST_PKTS}.{if_index}",
                f"{self.OID_IF_IN_ERRORS}.{if_index}",
                f"{self.OID_IF_IN_DISCARDS}.{if_index}",
                f"{self.OID_IF_OUT_UCAST_PKTS}.{if_index}",
                f"{self.OID_IF_OUT_ERRORS}.{if_index}",
                f"{self.OID_IF_OUT_DISCARDS}.{if_index}",
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
                error_status_text = error_status.prettyPrint() if hasattr(error_status, "prettyPrint") else str(error_status)
                error_msg = f"{error_status_text} at {error_index and var_binds[int(error_index) - 1][0] or '??'}"
                print(f"[SNMP Error] {error_msg}")
                return {"error": error_msg}

            # Parse the results
            for var_bind in var_binds:
                oid, value = var_bind
                oid_str = str(oid)
                value_int = int(value)

                if oid_str.startswith(self.OID_IF_IN_UCAST_PKTS):
                    stats['ingress_packets'] = value_int
                elif oid_str.startswith(self.OID_IF_IN_ERRORS):
                    stats['ingress_errors'] = value_int
                elif oid_str.startswith(self.OID_IF_IN_DISCARDS):
                    stats['ingress_discards'] = value_int
                elif oid_str.startswith(self.OID_IF_OUT_UCAST_PKTS):
                    stats['egress_packets'] = value_int
                elif oid_str.startswith(self.OID_IF_OUT_ERRORS):
                    stats['egress_errors'] = value_int
                elif oid_str.startswith(self.OID_IF_OUT_DISCARDS):
                    stats['egress_discards'] = value_int

            return stats

        return asyncio.run(_execute_async())

    def _calculate_if_index(self, eth_port_index: int) -> int:
        """
        Calculates the SNMP ifIndex for a specific ONT Ethernet port.
        This reuses the same logic as the traffic command.
        """
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
