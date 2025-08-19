"""
GenieACS Data Transformers
Transformadores para converter dados TR-069 do GenieACS em estruturas compatíveis com o frontend
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

def safe_get_nested(data: Dict[str, Any], path: str, default: Any = None) -> Any:
    """
    Busca um valor aninhado de forma segura usando notação de ponto
    
    Args:
        data: Dicionário com os dados
        path: Caminho usando pontos (ex: "InternetGatewayDevice.DeviceInfo.HardwareVersion._value")
        default: Valor padrão se não encontrado
        
    Returns:
        Valor encontrado ou default
    """
    try:
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default
                
        return current
    except Exception as e:
        logger.warning(f"Erro ao buscar caminho {path}: {e}")
        return default

def determine_device_status(last_inform: str, threshold_minutes: int = 10) -> str:
    """
    Determina o status do dispositivo baseado no último inform
    
    Args:
        last_inform: Data/hora do último inform (ISO string)
        threshold_minutes: Minutos de tolerância para considerar online
        
    Returns:
        "online" ou "offline"
    """
    try:
        if not last_inform:
            return "offline"
            
        last_inform_dt = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
        now = datetime.now(last_inform_dt.tzinfo)
        
        time_diff = now - last_inform_dt
        
        if time_diff <= timedelta(minutes=threshold_minutes):
            return "online"
        else:
            return "offline"
            
    except Exception as e:
        logger.warning(f"Erro ao determinar status do dispositivo: {e}")
        return "offline"

def extract_manufacturer_model(device_data: Dict[str, Any]) -> tuple[str, str]:
    """
    Extrai fabricante e modelo do dispositivo
    
    Args:
        device_data: Dados do dispositivo do GenieACS
        
    Returns:
        Tupla (manufacturer, model)
    """
    device_id = device_data.get("_deviceId", {})
    
    manufacturer = device_id.get("_Manufacturer", "Unknown")
    product_class = device_id.get("_ProductClass", "Unknown")
    
    # Mapear product classes conhecidos para nomes mais amigáveis
    model_mappings = {
        "BM632w": "Huawei BM632w",
        "HG8310M": "Huawei HG8310M", 
        "F601": "ZTE F601",
        "IWR3000N": "Intelbras IWR 3000N",
        "ArcherC6": "TP-Link Archer C6"
    }
    
    model = model_mappings.get(product_class, product_class)
    
    return manufacturer, model

def transform_genieacs_to_cpe(device_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma dados do GenieACS em estrutura CPE compatível com o frontend
    
    Args:
        device_data: Dados raw do dispositivo do GenieACS
        
    Returns:
        Dados do CPE formatados
    """
    try:
        device_id = device_data.get("_deviceId", {})
        
        # Dados básicos
        serial_number = device_id.get("_SerialNumber", "Unknown")
        oui = device_id.get("_OUI", "")
        
        # ID único combinando OUI, ProductClass e SerialNumber
        cpe_id = device_data.get("_id", f"{oui}-{device_id.get('_ProductClass', '')}-{serial_number}")
        
        # Manufacturer e modelo
        manufacturer, model = extract_manufacturer_model(device_data)
        
        # Status baseado no último inform
        last_inform = device_data.get("_lastInform")
        status = determine_device_status(last_inform)
        
        # IP Address externo
        external_ip = safe_get_nested(
            device_data, 
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress._value"
        )
        
        # WiFi SSID
        wifi_ssid = safe_get_nested(
            device_data,
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value"
        )
        
        # WiFi Enable status
        wifi_enabled = safe_get_nested(
            device_data,
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable._value",
            True
        )
        
        # Hardware e Software version para informações extras
        hw_version = safe_get_nested(
            device_data,
            "InternetGatewayDevice.DeviceInfo.HardwareVersion._value"
        )
        
        sw_version = safe_get_nested(
            device_data,
            "InternetGatewayDevice.DeviceInfo.SoftwareVersion._value"
        )
        
        # Signal strength (simulado baseado no status)
        signal_strength = -45.0 if status == "online" else None
        
        # Timestamps
        last_seen_dt = None
        created_at_dt = datetime.now()
        
        if last_inform:
            try:
                last_seen_dt = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
            except:
                pass
                
        # Montar estrutura CPE
        cpe_data = {
            "id": cpe_id,
            "serial_number": serial_number,
            "model": model,
            "status": status,
            "ip_address": external_ip,
            "last_seen": last_seen_dt.isoformat() if last_seen_dt else None,
            "created_at": created_at_dt.isoformat(),
            "wifi_enabled": bool(wifi_enabled),
            "wifi_ssid": wifi_ssid,
            "signal_strength": signal_strength,
            "customer_name": f"Cliente {serial_number[-3:]}",  # Simulado
            
            # Campos extras para debug/informação
            "_genieacs_metadata": {
                "manufacturer": manufacturer,
                "hardware_version": hw_version,
                "software_version": sw_version,
                "oui": oui,
                "product_class": device_id.get("_ProductClass"),
                "last_inform_raw": last_inform
            }
        }
        
        return cpe_data
        
    except Exception as e:
        logger.error(f"Erro ao transformar dispositivo GenieACS em CPE: {e}")
        logger.error(f"Dados do dispositivo: {device_data}")
        return None

def transform_genieacs_to_onu(device_data: Dict[str, Any], olt_mapping: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Transforma dados do GenieACS em estrutura ONU
    
    Args:
        device_data: Dados raw do dispositivo do GenieACS
        olt_mapping: Mapeamento de dispositivos para OLTs
        
    Returns:
        Dados da ONU formatados
    """
    try:
        device_id = device_data.get("_deviceId", {})
        serial_number = device_id.get("_SerialNumber", "Unknown")
        oui = device_id.get("_OUI", "")
        
        onu_id = device_data.get("_id", f"{oui}-{device_id.get('_ProductClass', '')}-{serial_number}")
        
        manufacturer, model = extract_manufacturer_model(device_data)
        
        last_inform = device_data.get("_lastInform")
        status = determine_device_status(last_inform)
        
        # Para ONUs, podemos tentar extrair informações de PON
        # Isso dependeria do modelo específico e parâmetros TR-069 disponíveis
        olt_id = "olt-001"  # Simulado - seria mapeado baseado na rede
        pon_port = "1/1"    # Simulado - extraído de parâmetros específicos
        
        # Potências RX/TX (simuladas - dependem do modelo)
        rx_power = -18.5 if status == "online" else None
        tx_power = 2.5 if status == "online" else None
        distance = 1.2 if status == "online" else None
        
        last_seen_dt = None
        if last_inform:
            try:
                last_seen_dt = datetime.fromisoformat(last_inform.replace('Z', '+00:00'))
            except:
                pass
        
        onu_data = {
            "id": onu_id,
            "serial_number": serial_number,
            "model": model,
            "status": status,
            "olt_id": olt_id,
            "pon_port": pon_port,
            "rx_power": rx_power,
            "tx_power": tx_power,
            "distance": distance,
            "last_seen": last_seen_dt.isoformat() if last_seen_dt else None,
            "created_at": datetime.now().isoformat(),
            
            "_genieacs_metadata": {
                "manufacturer": manufacturer,
                "oui": oui,
                "product_class": device_id.get("_ProductClass"),
                "last_inform_raw": last_inform
            }
        }
        
        return onu_data
        
    except Exception as e:
        logger.error(f"Erro ao transformar dispositivo GenieACS em ONU: {e}")
        return None

def transform_genieacs_fault_to_alert(fault_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma fault do GenieACS em alerta do sistema
    
    Args:
        fault_data: Dados do fault do GenieACS
        
    Returns:
        Dados do alerta formatados
    """
    try:
        fault_id = fault_data.get("_id", "unknown")
        device_id = fault_data.get("device", "unknown")
        
        # Mapear tipos de fault para severidade
        fault_code = fault_data.get("code", "")
        severity_map = {
            "9001": "critical",  # Invalid parameter name
            "9002": "warning",   # Invalid parameter type
            "9003": "warning",   # Invalid parameter value
            "9004": "critical",  # Attempt to set non-writable parameter
            "9005": "info",      # Notification request rejected
            "8001": "critical",  # Method not supported
            "8002": "critical",  # Request denied
            "8003": "critical",  # Internal error
        }
        
        severity = severity_map.get(str(fault_code), "warning")
        
        # Título e descrição baseados no fault
        title = fault_data.get("detail", {}).get("faultString", f"Fault {fault_code}")
        description = f"Device: {device_id} - Code: {fault_code} - {title}"
        
        # Timestamp
        timestamp = fault_data.get("timestamp")
        created_at = datetime.now()
        
        if timestamp:
            try:
                created_at = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except:
                pass
        
        alert_data = {
            "id": f"fault-{fault_id}",
            "device_id": device_id,
            "severity": severity,
            "title": title,
            "description": description,
            "acknowledged": False,
            "created_at": created_at.isoformat(),
            
            "_genieacs_metadata": {
                "fault_code": fault_code,
                "fault_raw": fault_data
            }
        }
        
        return alert_data
        
    except Exception as e:
        logger.error(f"Erro ao transformar fault GenieACS em alerta: {e}")
        return None

def calculate_dashboard_metrics(devices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula métricas do dashboard baseado nos dispositivos
    
    Args:
        devices: Lista de dispositivos processados
        
    Returns:
        Métricas do dashboard
    """
    try:
        total_devices = len(devices)
        online_devices = len([d for d in devices if d.get("status") == "online"])
        offline_devices = total_devices - online_devices
        
        # Calcular média de signal strength dos dispositivos online
        signal_strengths = [
            d.get("signal_strength") for d in devices 
            if d.get("signal_strength") is not None and d.get("status") == "online"
        ]
        
        avg_signal_strength = sum(signal_strengths) / len(signal_strengths) if signal_strengths else -50.0
        
        # Calcular uptime percentage
        uptime_percentage = (online_devices / total_devices * 100) if total_devices > 0 else 100.0
        
        # SLA compliance baseado no uptime
        sla_compliance = min(uptime_percentage, 100.0)
        
        return {
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": offline_devices,
            "critical_alerts": 0,  # Será calculado separadamente com faults
            "uptime_percentage": round(uptime_percentage, 1),
            "avg_signal_strength": round(avg_signal_strength, 1),
            "avg_latency": 15.2,  # Simulado - requer medições específicas
            "sla_compliance": round(sla_compliance, 1)
        }
        
    except Exception as e:
        logger.error(f"Erro ao calcular métricas do dashboard: {e}")
        return {
            "total_devices": 0,
            "online_devices": 0,
            "offline_devices": 0,
            "critical_alerts": 0,
            "uptime_percentage": 0.0,
            "avg_signal_strength": -50.0,
            "avg_latency": 0.0,
            "sla_compliance": 0.0
        }