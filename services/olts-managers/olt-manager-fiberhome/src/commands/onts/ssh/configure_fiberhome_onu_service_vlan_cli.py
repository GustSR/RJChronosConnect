from typing import Any, Dict, List, Optional

from ...base_command import OLTCommand


class ConfigureFiberhomeOnuServiceVlanCliCommand(OLTCommand):
    """Configure ONU service VLAN via CLI."""

    def __init__(
        self,
        slot: int,
        link: int,
        onu_id: int,
        port: int,
        service_number: int,
        vlan_id: int,
        vlan_mode: str = "tag",
        tpid: str = "0x8100",
        pvid: Optional[int] = None,
        traffic_type: str = "unicast",
    ):
        self.slot = slot
        self.link = link
        self.onu_id = onu_id
        self.port = port
        self.service_number = service_number
        self.vlan_id = vlan_id
        self.vlan_mode = vlan_mode
        self.tpid = tpid
        self.pvid = pvid
        self.traffic_type = traffic_type

    def execute(self, connection_manager, olt_version: str) -> Dict[str, Any]:
        if not (1 <= self.vlan_id <= 4094):
            raise ValueError("vlan_id must be between 1 and 4094")
        if self.service_number < 1:
            raise ValueError("service_number must be >= 1")

        commands: List[str] = [
            (
                "set epon slot {slot} link {link} onu {onu_id} "
                "port {port} service number {service_number}"
            ).format(
                slot=self.slot,
                link=self.link,
                onu_id=self.onu_id,
                port=self.port,
                service_number=self.service_number,
            ),
            (
                "set epon slot {slot} link {link} onu {onu_id} port {port} "
                "service {service_number} vlan_mode {vlan_mode} 0 {tpid} {vlan_id}"
            ).format(
                slot=self.slot,
                link=self.link,
                onu_id=self.onu_id,
                port=self.port,
                service_number=self.service_number,
                vlan_mode=self.vlan_mode,
                tpid=self.tpid,
                vlan_id=self.vlan_id,
            ),
        ]

        if self.pvid is not None:
            commands.append(
                (
                    "set epon slot {slot} link {link} onu {onu_id} port {port} "
                    "service {service_number} pvlan 0 {pvid}"
                ).format(
                    slot=self.slot,
                    link=self.link,
                    onu_id=self.onu_id,
                    port=self.port,
                    service_number=self.service_number,
                    pvid=self.pvid,
                )
            )

        if self.traffic_type:
            commands.append(
                (
                    "set epon slot {slot} link {link} onu {onu_id} port {port} "
                    "service {service_number} type {traffic_type}"
                ).format(
                    slot=self.slot,
                    link=self.link,
                    onu_id=self.onu_id,
                    port=self.port,
                    service_number=self.service_number,
                    traffic_type=self.traffic_type,
                )
            )

        commands.append(f"apply onu {self.slot} {self.link} {self.onu_id} vlan")

        outputs = []
        for command in commands:
            raw_output = connection_manager.send_command(command)
            outputs.append({"command": command, "output": raw_output})

        return self._parse_output(outputs, olt_version)

    def _parse_output(self, raw_output: List[Dict[str, str]], olt_version: str) -> Dict[str, Any]:
        status = "success"
        for entry in raw_output:
            output = entry.get("output", "").lower()
            if "fail" in output or "error" in output:
                status = "failure"
                break
            if "success" not in output:
                status = "unknown"

        return {
            "status": status,
            "outputs": raw_output,
            "slot": self.slot,
            "link": self.link,
            "onu_id": self.onu_id,
            "port": self.port,
            "service_number": self.service_number,
            "vlan_id": self.vlan_id,
            "vlan_mode": self.vlan_mode,
            "tpid": self.tpid,
            "pvid": self.pvid,
            "traffic_type": self.traffic_type,
        }
