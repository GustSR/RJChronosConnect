from pysnmp.hlapi import (
    getCmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity
)
from .base_command import OLTCommand
from typing import List, Dict, Any

class GetOntTrafficSnmpCommand(OLTCommand):
    """
    Command to get ONT traffic (ingress/egress bytes) via SNMP GET.
    This command retrieves the total bytes transferred for all Ethernet ports of a given ONT.
    """

    # OIDs from IF-MIB for interface counters
    OID_IF_IN_OCTETS = '1.3.6.1.2.1.2.2.1.10'  # Ingress bytes
    OID_IF_OUT_OCTETS = '1.3.6.1.2.1.2.2.1.16' # Egress bytes

    def __init__(self, host: str, community_string: str, port: str, ont_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id
        # Assuming a fixed number of Ethernet ports for now. This could be made dynamic.
        self.eth_port_count = 4 

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        """
        Executes the SNMP GET commands to retrieve traffic stats for each ethernet port.
        """
        traffic_stats = []

        for eth_port_index in range(1, self.eth_port_count + 1):
            try:
                if_index = self._calculate_if_index(eth_port_index)
            except ValueError as e:
                print(f"[Error] {e}")
                continue

            oid_in = f"{self.OID_IF_IN_OCTETS}.{if_index}"
            oid_out = f"{self.OID_IF_OUT_OCTETS}.{if_index}"

            error_indication, error_status, error_index, var_binds = next(
                getCmd(
                    SnmpEngine(),
                    CommunityData(self.community, mpModel=0),
                    UdpTransportTarget((self.host, 161)),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid_in)),
                    ObjectType(ObjectIdentity(oid_out))
                )
            )

            if error_indication:
                print(f"[SNMP Error for port {eth_port_index}] {error_indication}")
                continue
            elif error_status:
                print(f"[SNMP Error for port {eth_port_index}] {error_status.prettyPrint()} at {error_index and var_binds[int(error_index) - 1][0] or '??'}")
                continue
            
            ingress_bytes = 0
            egress_bytes = 0
            for var_bind in var_binds:
                oid, value = var_bind
                if str(oid).startswith(self.OID_IF_IN_OCTETS):
                    ingress_bytes = int(value)
                elif str(oid).startswith(self.OID_IF_OUT_OCTETS):
                    egress_bytes = int(value)

            traffic_stats.append({
                "port_index": eth_port_index,
                "ingress_bytes": ingress_bytes,
                "egress_bytes": egress_bytes
            })
            
        return traffic_stats

    def _calculate_if_index(self, eth_port_index: int) -> int:
        """
        Calculates the SNMP ifIndex for a specific ONT Ethernet port.
        This formula is highly proprietary and based on reverse-engineering and community findings.
        Formula for MA5600T/MA5608T:
        Index = (Slot * 2^25) + (PON Port * 2^21) + (ONT ID * 2^16) + (ONT Port Type * 2^12) + (ONT Port ID)
        - ONT Port Type for ETH is often 1.
        - ONT Port ID is the 1-based index of the ethernet port.
        """
        try:
            _, slot, pon_port = map(int, self.port_str.split('/'))
        except (ValueError, IndexError):
            raise ValueError(f"Invalid port format: {self.port_str}. Expected 'frame/slot/port'.")

        # Constants based on Huawei MIB structure
        slot_multiplier = 33554432  # 2^25
        pon_multiplier = 2097152   # 2^21
        ont_multiplier = 65536       # 2^16
        port_type_multiplier = 4096 # 2^12
        
        ont_port_type = 1 # 1 for Ethernet port

        if_index = (slot * slot_multiplier) + \
                   (pon_port * pon_multiplier) + \
                   (self.ont_id * ont_multiplier) + \
                   (ont_port_type * port_type_multiplier) + \
                   eth_port_index
                   
        return if_index

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # Not used for SNMP commands
        pass
