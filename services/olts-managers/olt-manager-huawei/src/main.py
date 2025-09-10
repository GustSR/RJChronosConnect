from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional, Dict, Any

from .services import olt_service
from .trap_listener.listener import TrapListener
from .schemas import (
    ont as ont_schema,
    ont_summary as ont_summary_schema,
    ont_register_info as ont_register_info_schema,
    ont_port_attribute as ont_port_attribute_schema,
    ont_eth_stats as ont_eth_stats_schema,
    ont_traffic as ont_traffic_schema,
    olt_version as olt_version_schema,
    gpon_alarm_profile_add_request as gpon_alarm_profile_add_request_schema,
    board_info as board_info_schema,
    port_state as port_state_schema,
    ont_failed as ont_failed_schema,

app = FastAPI(
    title="OLT Manager - Huawei",
    description="A microservice to interact with Huawei OLTs via SSH.",
    version="0.5.0"
)

# --- Trap Listener Lifecycle ---

trap_listener = TrapListener()

@app.on_event("startup")
def startup_event():
    """Inicia o listener de traps quando a aplicação FastAPI inicia."""
    try:
        trap_listener.iniciar()
    except Exception as e:
        # Se o listener falhar ao iniciar, a aplicação ainda pode funcionar,
        # mas vamos logar o erro crítico.
        print(f"[ERRO CRÍTICO] O listener de traps SNMP falhou ao iniciar: {e}")

@app.on_event("shutdown")
def shutdown_event():
    """Para o listener de traps quando a aplicação FastAPI é encerrada."""
    trap_listener.parar()

# --- ONT Endpoints ---

# --- Port Management Endpoints ---

@app.post("/api/v1/olts/{olt_id}/ports/{port}/shutdown", response_model=command_response.CommandResponse, summary="Shutdown PON Port", tags=["Port Management"])
def shutdown_pon_port(olt_id: int, port: str):
    try:
        result = olt_service.shutdown_pon_port(olt_id, port)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/ports/{port}/enable", response_model=command_response.CommandResponse, summary="Enable PON Port", tags=["Port Management"])
def enable_pon_port(olt_id: int, port: str):
    try:
        result = olt_service.enable_pon_port(olt_id, port)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/state", response_model=port_state_schema.PortState, summary="Get PON Port State", tags=["Port Management"])
def get_port_state(olt_id: int, port: str):
    try:
        return olt_service.get_port_state(olt_id, port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/olts/{olt_id}/ports/{port}/mode", response_model=command_response.CommandResponse, summary="Set PON Port Mode", tags=["Port Management"])
def set_port_mode(olt_id: int, port: str, port_mode_request: port_mode_set_request_schema.PortModeSetRequest):
    try:
        result = olt_service.set_port_mode(olt_id, port, port_mode_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/olts/{olt_id}/onts", response_model=List[ont_schema.ONT], summary="Get ONT info by SN", tags=["ONTs"])
def get_ont_info(olt_id: int, serial_number: str = Query(..., description="ONT SN")):
    try:
        return olt_service.get_ont_info_by_sn(olt_id, serial_number)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/all", response_model=List[ont_summary_schema.ONTSummary], summary="Get all ONTs on a port", tags=["ONTs"])
def get_all_onts_on_port(olt_id: int, port: str):
    try:
        return olt_service.get_onts_on_port(olt_id, port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/register-info", response_model=List[ont_register_info_schema.OntRegisterInfo], summary="Get ONT register info for a port", tags=["ONTs"])
def get_ont_register_info(olt_id: int, port: str):
    try:
        return olt_service.get_ont_register_info(olt_id, port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/onts", response_model=command_response.CommandResponse, summary="Provision ONT", tags=["ONTs"])
def provision_new_ont(olt_id: int, ont_request: ont_add_request.ONTAddRequest):
    try:
        result = olt_service.provision_ont(olt_id, ont_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/optical-info", response_model=optical_schema.ONTOpticalInfo, summary="Get ONT optical info", tags=["ONTs"])
def get_ont_optical_info(olt_id: int, port: str, ont_id_on_port: int):
    try:
        return olt_service.get_ont_optical_info(olt_id, port, ont_id_on_port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/eth-ports/{eth_port_id}/attributes", response_model=ont_port_attribute_schema.OntPortAttribute, summary="Get ONT port attributes", tags=["ONTs"])
def get_ont_port_attribute(olt_id: int, port: str, ont_id_on_port: int, eth_port_id: int):
    try:
        return olt_service.get_ont_port_attribute(olt_id, port, ont_id_on_port, eth_port_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/eth-ports/{eth_port_id}/statistics", response_model=ont_eth_stats_schema.OntEthStats, summary="Get ONT ethernet port statistics", tags=["ONTs"])
def get_ont_eth_stats(olt_id: int, port: str, ont_id_on_port: int, eth_port_id: int):
    try:
        return olt_service.get_ont_eth_stats(olt_id, port, ont_id_on_port, eth_port_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/traffic", response_model=List[ont_traffic_schema.OntTraffic], summary="Get ONT traffic", tags=["ONTs"])
def get_ont_traffic(olt_id: int, port: str, ont_id_on_port: int):
    try:
        return olt_service.get_ont_traffic(olt_id, port, ont_id_on_port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/reboot", response_model=command_response.CommandResponse, summary="Reboot ONT", tags=["ONTs"])
def reboot_specific_ont(olt_id: int, port: str, ont_id_on_port: int):
    try:
        result = olt_service.reboot_ont(olt_id, port, ont_id_on_port)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/service-ports", response_model=List[service_port_schema.ServicePort], summary="Get ONT service-ports", tags=["ONTs"])
def get_service_ports(olt_id: int, port: str, ont_id_on_port: int):
    try:
        return olt_service.get_service_ports_for_ont(olt_id, port, ont_id_on_port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/service-ports", response_model=command_response.CommandResponse, summary="Add a new service port", tags=["ONTs"])
def add_service_port(olt_id: int, service_port_request: service_port_add_request_schema.ServicePortAddRequest):
    try:
        result = olt_service.add_service_port(olt_id, service_port_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/port-states", response_model=List[ont_port_state_schema.ONTPortState], summary="Get ONT port states", tags=["ONTs"])
def get_ont_port_states(olt_id: int, port: str, ont_id_on_port: int):
    try:
        return olt_service.get_ont_port_state(olt_id, port, ont_id_on_port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/mac-addresses", response_model=List[mac_address_schema.MacAddressInfo], summary="Get ONT MAC addresses", tags=["ONTs"])
def get_mac_addresses(olt_id: int, port: str, ont_id_on_port: int):
    try:
        return olt_service.get_mac_address_for_ont(olt_id, port, ont_id_on_port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/ports/{port}/autofind-onts", response_model=List[ont_autofind_schema.OntAutofindInfo], summary="Get autofind ONTs", tags=["ONTs"])
def get_autofind_onts(olt_id: int, port: str):
    try:
        return olt_service.get_autofind_onts(olt_id, port)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/confirm", response_model=command_response.CommandResponse, summary="Confirm an autofind ONT", tags=["ONTs"])
def confirm_ont(olt_id: int, port: str, ont_id_on_port: int, confirm_request: ont_confirm_schema.OntConfirmRequest):
    try:
        result = olt_service.confirm_ont(olt_id, port, ont_id_on_port, confirm_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Profile Endpoints ---

@app.post("/api/v1/olts/{olt_id}/gpon-alarm-profiles", response_model=command_response.CommandResponse, summary="Add GPON Alarm Profile", tags=["Profiles"])
def add_new_gpon_alarm_profile(olt_id: int, alarm_profile_request: gpon_alarm_profile_add_request_schema.GponAlarmProfileAddRequest):
    try:
        result = olt_service.add_gpon_alarm_profile(olt_id, alarm_profile_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/dba-profiles", response_model=command_response.CommandResponse, summary="Add DBA Profile", tags=["Profiles"])
def add_new_dba_profile(olt_id: int, dba_profile_request: dba_profile_add_request.DbaProfileAddRequest):
    try:
        result = olt_service.add_dba_profile(olt_id, dba_profile_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/ont-line-profiles", response_model=command_response.CommandResponse, summary="Add ONT Line Profile", tags=["Profiles"])
def add_new_ont_line_profile(olt_id: int, line_profile_request: ont_line_profile_add_request.OntLineProfileAddRequest):
    try:
        result = olt_service.add_ont_line_profile(olt_id, line_profile_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/olts/{olt_id}/ont-srv-profiles", response_model=command_response.CommandResponse, summary="Add ONT Service Profile", tags=["Profiles"])
def add_new_ont_srv_profile(olt_id: int, srv_profile_request: ont_srv_profile_add_request.OntSrvProfileAddRequest):
    try:
        result = olt_service.add_ont_srv_profile(olt_id, srv_profile_request)
        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get('message'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Monitoring ---

@app.get("/health", summary="Health Check", tags=["Monitoring"])
def health_check():
    return {"status": "ok"}ng"])
def get_board_info(olt_id: int, frame_id: int):
    try:
        return olt_service.get_board_info(olt_id, frame_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/olts/{olt_id}/version", response_model=olt_version_schema.OltVersion, summary="Get OLT version", tags=["Monitoring"])
def get_olt_version(olt_id: int):
    try:
        return olt_service.get_olt_version(olt_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", summary="Health Check", tags=["Monitoring"])
def health_check():
    return {"status": "ok"}