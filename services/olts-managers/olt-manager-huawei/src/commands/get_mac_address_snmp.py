from pysnmp.hlapi import (
    nextCmd, SnmpEngine, CommunityData, UdpTransportTarget, ContextData, ObjectType, ObjectIdentity, lexicographicMode
)
from .base_command import OLTCommand
from typing import List, Dict, Any

class GetMacAddressSnmpCommand(OLTCommand):
    """
    Command to get MAC addresses learned on an ONT's ports via SNMP WALK.
    This command walks the dot1qTpFdbTable to find MAC addresses associated with a specific ONT.
    """

    # OID for the Forwarding Database (FDB) table that maps MACs to ports.
    # This is a standard bridge MIB OID: .1.3.6.1.2.1.17.4.3
    OID_Q_BRIDGE_FDB_TABLE = '1.3.6.1.2.1.17.4.3.1.1' # dot1qTpFdbAddress
    OID_Q_BRIDGE_FDB_PORT = '1.3.6.1.2.1.17.4.3.1.2'  # dot1qTpFdbPort

    def __init__(self, host: str, community_string: str, port: str, ont_id: int):
        self.host = host
        self.community = community_string
        self.port_str = port
        self.ont_id = ont_id

    def execute(self, connection_manager=None, olt_version: str = None) -> List[Dict[str, Any]]:
        """
        Executes the SNMP WALK to find MAC addresses.
        """
        mac_list = []
        fdb_table = {}

        # Step 1: Walk the entire FDB table to get MAC addresses and their associated bridge port index.
        for (error_indication, error_status, error_index, var_binds) in nextCmd(
            SnmpEngine(),
            CommunityData(self.community, mpModel=0),
            UdpTransportTarget((self.host, 161)),
            ContextData(),
            ObjectType(ObjectIdentity(self.OID_Q_BRIDGE_FDB_TABLE)),
            ObjectType(ObjectIdentity(self.OID_Q_BRIDGE_FDB_PORT)),
            lexicographicMode=True
        ):
            if error_indication:
                print(f"[SNMP Error] {error_indication}")
                break
            elif error_status:
                print(f"[SNMP Error] {error_status.prettyPrint()} at {error_index and var_binds[int(error_index) - 1][0] or '??'}")
                break
            else:
                for var_bind in var_binds:
                    oid, value = var_bind
                    oid_str = str(oid)
                    
                    # The index of this table is the VLAN ID and the MAC address
                    vlan_and_mac_index = oid_str.split(self.OID_Q_BRIDGE_FDB_TABLE)[-1].strip('.')
                    if not vlan_and_mac_index:
                        continue

                    if oid_str.startswith(self.OID_Q_BRIDGE_FDB_TABLE):
                        mac_address = ":".join([f"{c:02x}" for c in value.asNumbers()])
                        fdb_table[vlan_and_mac_index] = {"mac_address": mac_address}
                    elif oid_str.startswith(self.OID_Q_BRIDGE_FDB_PORT):
                        if vlan_and_mac_index in fdb_table:
                            fdb_table[vlan_and_mac_index]["bridge_port_index"] = int(value)

        # Step 2: Filter the results to find MACs on the ports of our specific ONT.
        # We need to know the ifIndex for each ethernet port of the ONT.
        for eth_port_id in range(1, 5): # Assuming 4 ethernet ports
            try:
                ont_if_index = self._calculate_if_index(eth_port_id)
            except ValueError as e:
                print(f"[Error] {e}")
                continue

            # Now, find all entries in the FDB table that match this ifIndex.
            # Note: The bridge_port_index from the FDB table should correspond to an ifIndex.
            # This mapping can be complex. A common scenario is that they are the same.
            for entry in fdb_table.values():
                if entry.get("bridge_port_index") == ont_if_index:
                    mac_list.append({
                        "mac_address": entry["mac_address"],
                        "port": f"{self.port_str}/{self.ont_id}/eth/{eth_port_id}"
                    })

        return mac_list

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

    def _parse_output(self, raw_output: str, olt_version: str) -> List[Dict[str, Any]]:
        # Not used for SNMP commands
        pass
