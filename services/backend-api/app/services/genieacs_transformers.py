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
        
        # IP Address externo - tentar múltiplos caminhos
        external_ip = None
        
        # Lista de possíveis caminhos para IP externo
        ip_paths = [
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress._value",
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress._value", 
            "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.2.WANIPConnection.1.ExternalIPAddress._value",
            "InternetGatewayDevice.Services.X_HUAWEI_WANRemoteAccess.IPAddress2._value",  # IP público do Huawei
            "InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress._value"  # IP LAN como fallback
        ]
        
        # Tentar cada caminho até encontrar um IP válido
        for ip_path in ip_paths:
            ip_candidate = safe_get_nested(device_data, ip_path)
            if ip_candidate and ip_candidate.strip() and ip_candidate != "0.0.0.0":
                external_ip = ip_candidate.strip()
                logger.info(f"✅ IP encontrado para {cpe_id}: {external_ip} (via {ip_path})")
                break
        
        if not external_ip:
            logger.warning(f"⚠️ Nenhum IP válido encontrado para dispositivo {cpe_id}")
        
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

def extract_wifi_config_from_device(device_data: Dict[str, Any], band: str = "2.4GHz") -> Dict[str, Any]:
    """
    Extrai configurações WiFi de um dispositivo GenieACS
    
    Args:
        device_data: Dados raw do dispositivo do GenieACS
        band: Banda WiFi ("2.4GHz" ou "5GHz")
        
    Returns:
        Configurações WiFi formatadas
    """
    try:
        device_id = device_data.get("_id", "unknown")
        
        # Determinar qual WLANConfiguration usar baseado na banda
        wlan_config_id = "1" if band == "2.4GHz" else "2"
        base_path = f"InternetGatewayDevice.LANDevice.1.WLANConfiguration.{wlan_config_id}"
        
        # Extrair configurações WiFi
        wifi_enabled = safe_get_nested(
            device_data,
            f"{base_path}.Enable._value",
            True  # Default para True se não conseguir ler o valor
        )
        
        ssid = safe_get_nested(
            device_data,
            f"{base_path}.SSID._value",
            ""
        )
        
        # Tipo de segurança baseado no BeaconType
        beacon_type = safe_get_nested(
            device_data,
            f"{base_path}.BeaconType._value",
            "None"
        )
        
        # Mapear BeaconType para tipo de segurança
        security_map = {
            "None": "Open",
            "Basic": "WEP", 
            "WPA": "WPA",
            "11i": "WPA2",
            "WPAand11i": "WPA2"
        }
        security = security_map.get(beacon_type, "WPA2")
        
        # Canal WiFi
        channel = safe_get_nested(
            device_data,
            f"{base_path}.Channel._value",
            "Auto"
        )
        
        # Auto channel enable
        auto_channel = safe_get_nested(
            device_data,
            f"{base_path}.AutoChannelEnable._value",
            False
        )
        
        if auto_channel:
            channel = "Auto"
        
        # SSID Advertisement (para determinar se é hidden)
        ssid_broadcast = safe_get_nested(
            device_data,
            f"{base_path}.SSIDAdvertisementEnabled._value",
            True
        )
        
        # Senha WiFi (KeyPassphrase para WPA/WPA2) - Tentar diferentes caminhos
        # Baseado em pesquisa de modelos Huawei específicos
        password_paths = [
            # Padrão mais comum
            f"{base_path}.PreSharedKey.1.KeyPassphrase._value",
            f"{base_path}.PreSharedKey.KeyPassphrase._value",
            
            # Variações encontradas em diferentes modelos Huawei
            f"{base_path}.PreSharedKey.1PreSharedKey._value",  # EG8141A5
            f"{base_path}.KeyPassphrase._value",               # HG8145V5
            
            # Específicos Huawei
            f"{base_path}.X_HUAWEI_PreSharedKey._value",
            f"{base_path}.X_HUAWEI_WpaPassphrase._value",
            
            # WPA específico
            f"{base_path}.WPA.PreSharedKey.1.KeyPassphrase._value",
            f"{base_path}.WPA.KeyPassphrase._value",
            
            # WEP fallback
            f"{base_path}.WEP.Keys.1.WEPKey._value",
            
            # Outras variações encontradas em equipamentos similares
            f"{base_path}.Security.PreSharedKey._value",
            f"{base_path}.Security.WPA.PreSharedKey._value"
        ]
        
        password = ""
        logger.info(f"🔍 BUSCANDO SENHA WiFi para {device_id} (banda {band}):")
        for password_path in password_paths:
            password_candidate = safe_get_nested(device_data, password_path, "")
            logger.info(f"  🔍 {password_path}: '{password_candidate}'")
            if password_candidate and password_candidate.strip():
                password = password_candidate
                logger.info(f"🔑 ✅ SENHA ENCONTRADA: '{password}' via {password_path}")
                break
        
        if not password:
            logger.info(f"🔒 Senha não disponível para leitura - campo será deixado em branco para nova senha")
            # DEBUG: Mostrar estrutura disponível apenas no log
            wlan_data = safe_get_nested(device_data, base_path, {})
            if isinstance(wlan_data, dict):
                logger.debug(f"📊 Estrutura disponível em {base_path}:")
                for key in sorted(wlan_data.keys()):
                    if 'key' in key.lower() or 'pass' in key.lower() or 'security' in key.lower():
                        logger.debug(f"    🔑 {key}: {safe_get_nested(wlan_data, key)}")
        
        
        # Potência de transmissão (alguns modelos Huawei)
        power = safe_get_nested(
            device_data,
            f"{base_path}.X_HUAWEI_PowerValue._value",
            100
        )
        
        # Intensidade do sinal WiFi (para dispositivos que reportam)
        # Tentar diferentes parâmetros TR-069 para obter sinal WiFi
        signal_strength = None
        signal_paths = [
            # Dispositivos associados (onde fica o sinal real)
            f"{base_path}.AssociatedDevice.1.AssociatedDeviceRSSI._value",
            f"{base_path}.AssociatedDevice.1.X_HUAWEI_RSSI._value",
            f"{base_path}.AssociatedDevice.1.SignalStrength._value",
            f"{base_path}.AssociatedDevice.1.X_HUAWEI_SignalStrength._value",
            
            # Stats do próprio roteador
            f"{base_path}.Stats.X_HUAWEI_RSSI._value",
            f"{base_path}.Stats.SignalStrength._value",
            f"{base_path}.Stats.NoiseFloor._value",
            
            # Parâmetros específicos do fabricante
            f"{base_path}.X_HUAWEI_SignalStrength._value",
            f"{base_path}.X_BROADCOM_SignalStrength._value",
            f"{base_path}.X_HUAWEI_RSSI._value",
            
            # Paths alternativos
            f"InternetGatewayDevice.LANDevice.1.WLANConfiguration.{wlan_config_id}.AssociatedDevice.1.X_HUAWEI_RSSI._value",
            f"InternetGatewayDevice.Device.WiFi.Radio.{wlan_config_id}.Stats.NoiseFloor._value"
        ]
        
        # Tentar obter sinal WiFi real (se disponível)
        for signal_path in signal_paths:
            signal_candidate = safe_get_nested(device_data, signal_path)
            if signal_candidate and isinstance(signal_candidate, (int, float)):
                # Se o valor parece ser RSSI (negativo entre -100 e 0)
                if -100 <= signal_candidate <= 0:
                    signal_strength = float(signal_candidate)
                    logger.info(f"📶 Sinal WiFi encontrado para {device_id}: {signal_strength}dBm (via {signal_path})")
                    break
        
        # Se não conseguiu obter sinal real, usar valor simulado mais realista
        if signal_strength is None:
            if wifi_enabled:
                import random
                # Simular sinal WiFi realista baseado na banda
                if band == "5GHz":
                    # 5GHz tem alcance menor, sinal um pouco mais fraco
                    signal_strength = round(random.uniform(-60, -40), 1)
                else:
                    # 2.4GHz tem melhor alcance
                    signal_strength = round(random.uniform(-55, -35), 1)
                logger.info(f"📶 Sinal WiFi simulado para {device_id} (banda {band}): {signal_strength}dBm")
            else:
                signal_strength = None
        
        # Informações do dispositivo
        manufacturer, model = extract_manufacturer_model(device_data)
        
        wifi_config = {
            "device_id": device_id,
            "device_name": f"{manufacturer} {model}",
            "device_model": model,
            "ssid": ssid,
            "password": password,  # Senha WiFi atual
            "security": security,
            "band": band,
            "channel": str(channel),
            "power": int(power) if power else 100,
            "hidden": not bool(ssid_broadcast),
            "enabled": bool(wifi_enabled),
            "beacon_type": beacon_type,
            "auto_channel": bool(auto_channel),
            "signal_strength": signal_strength,  # Sinal WiFi real ou simulado
            "wlan_config_id": wlan_config_id,  # ID da configuração WLAN (1 ou 2)
            
            # Metadados para debug
            "_genieacs_metadata": {
                "raw_beacon_type": beacon_type,
                "raw_channel": channel,
                "raw_power": power,
                "raw_ssid_broadcast": ssid_broadcast,
                "raw_signal_strength": signal_strength,
                "device_parameters_available": bool(ssid),  # Se conseguiu ler parâmetros
                "wlan_config_path": base_path
            }
        }
        
        return wifi_config
        
    except Exception as e:
        logger.error(f"Erro ao extrair configuração WiFi do dispositivo: {e}")
        return None

def create_wifi_parameter_updates(device_id: str, updates: Dict[str, Any], band: str = "2.4GHz") -> List[Dict[str, Any]]:
    """
    Cria lista de parâmetros para atualizar configurações WiFi via GenieACS
    
    Args:
        device_id: ID do dispositivo
        updates: Dicionário com atualizações a serem feitas
        band: Banda WiFi ("2.4GHz" ou "5GHz")
        
    Returns:
        Lista de tasks para o GenieACS
    """
    try:
        logger.info(f"🔄 CRIANDO TASKS WiFi para dispositivo {device_id} (banda: {band})")
        logger.info(f"   Updates recebidos: {updates}")
        
        tasks = []
        # Determinar qual WLANConfiguration usar baseado na banda
        wlan_config_id = "1" if band == "2.4GHz" else "2"
        base_path = f"InternetGatewayDevice.LANDevice.1.WLANConfiguration.{wlan_config_id}"
        
        # Mapeamento de campos para parâmetros TR-069
        parameter_map = {
            "ssid": f"{base_path}.SSID",
            "enabled": f"{base_path}.Enable",
            "channel": f"{base_path}.Channel",
            "hidden": f"{base_path}.SSIDAdvertisementEnabled",  # Invertido: hidden=True -> SSIDAdvertisement=False
            "power": f"{base_path}.X_HUAWEI_PowerValue"  # Específico Huawei
        }
        
        # Mapeamento especial para segurança
        security_map = {
            "Open": "None",
            "WEP": "Basic",
            "WPA": "WPA", 
            "WPA2": "11i",
            "WPA3": "11i"  # Fallback para WPA2 se WPA3 não suportado
        }
        
        logger.info(f"📋 Mapeamento de parâmetros: {parameter_map}")
        
        # Processar cada atualização
        for field, value in updates.items():
            logger.info(f"🔍 Processando field: {field} = {value}")
            if value is None:
                continue
                
            # Campos que têm tratamento especial (não estão no parameter_map)
            if field == "security":
                # Atualizar BeaconType
                beacon_value = security_map.get(value, "11i")
                tasks.append({
                    "name": "setParameterValues",
                    "parameterValues": [[f"{base_path}.BeaconType", beacon_value]]
                })
                logger.info(f"🔒 Alteração de segurança WiFi: {value} -> BeaconType: {beacon_value}")
                
                # Para WPA2/WPA3, pode ser necessário configurar adicionais
                if value in ["WPA2", "WPA3"]:
                    # Configurar algoritmo de criptografia para WPA2/WPA3
                    tasks.append({
                        "name": "setParameterValues",
                        "parameterValues": [[f"{base_path}.WPAEncryptionModes", "AESEncryption"]]
                    })
                    
                    # Para WPA2/WPA3, configurar também AuthenticationMode
                    auth_mode = "WPA2-PSK" if value == "WPA2" else "WPA3-PSK"
                    tasks.append({
                        "name": "setParameterValues", 
                        "parameterValues": [[f"{base_path}.WPAAuthenticationMode", "PSKAuthentication"]]
                    })
                elif value == "Open":
                    # Para rede aberta, desabilitar criptografia
                    tasks.append({
                        "name": "setParameterValues",
                        "parameterValues": [[f"{base_path}.WEPKeyIndex", "1"]]
                    })
                continue
            
            # Campos com mapeamento direto no parameter_map
            if field in parameter_map:
                parameter_name = parameter_map[field]
                
                # Tratamento especial para cada tipo de parâmetro
                if field == "hidden":
                    # hidden=True significa SSIDAdvertisement=False
                    parameter_value = not bool(value)
                elif field == "channel":
                    # Se channel for "Auto", habilitar AutoChannelEnable
                    if str(value).lower() == "auto":
                        tasks.append({
                            "name": "setParameterValues", 
                            "parameterValues": [[f"{base_path}.AutoChannelEnable", True]]
                        })
                        continue
                    else:
                        # Desabilitar auto channel e definir canal específico
                        tasks.append({
                            "name": "setParameterValues",
                            "parameterValues": [[f"{base_path}.AutoChannelEnable", False]]
                        })
                        parameter_value = int(value)
                else:
                    parameter_value = value
                
                # Adicionar task para este parâmetro
                tasks.append({
                    "name": "setParameterValues",
                    "parameterValues": [[parameter_name, parameter_value]]
                })
        
        # Se há mudança de senha e security != Open
        if "password" in updates and updates.get("security", "WPA2") != "Open":
            password = updates["password"]
            if password:
                # Para WPA/WPA2, usar PreSharedKey
                tasks.append({
                    "name": "setParameterValues",
                    "parameterValues": [[f"{base_path}.PreSharedKey.1.KeyPassphrase", password]]
                })
                logger.info(f"✅ Adicionada task de senha WiFi: {password}")
        
        logger.info(f"✅ TASKS CRIADAS: {len(tasks)} tasks para dispositivo {device_id}")
        for i, task in enumerate(tasks):
            logger.info(f"   Task {i+1}: {task}")
        return tasks
        
    except Exception as e:
        logger.error(f"Erro ao criar tasks de atualização WiFi: {e}")
        return []

def format_wifi_configs_for_frontend(wifi_configs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Formata configurações WiFi para o frontend
    
    Args:
        wifi_configs: Lista de configurações WiFi dos dispositivos
        
    Returns:
        Dados formatados para o frontend
    """
    try:
        # Estatísticas gerais
        total_devices = len(wifi_configs)
        enabled_devices = len([w for w in wifi_configs if w.get("enabled", False)])
        
        # Agrupar por SSID
        ssid_groups = {}
        for config in wifi_configs:
            ssid = config.get("ssid", "Unknown")
            if ssid not in ssid_groups:
                ssid_groups[ssid] = []
            ssid_groups[ssid].append(config)
        
        # Criar perfis baseados nos SSIDs
        profiles = []
        for ssid, devices in ssid_groups.items():
            if not ssid or ssid == "Unknown":
                continue
                
            # Usar configuração do primeiro dispositivo como base
            base_config = devices[0]
            
            profile = {
                "id": f"profile-{ssid.replace(' ', '-').lower()}",
                "name": f"Perfil {ssid}",
                "ssid": ssid,
                "security": base_config.get("security", "WPA2"),
                "band": base_config.get("band", "2.4GHz"),
                "channel": base_config.get("channel", "Auto"),
                "power": base_config.get("power", 100),
                "hidden": base_config.get("hidden", False),
                "enabled": base_config.get("enabled", True),
                "status": "active" if any(d.get("enabled") for d in devices) else "inactive",
                "applied_devices": len(devices),
                "devices": devices
            }
            profiles.append(profile)
        
        # Dispositivos individuais
        devices = []
        for config in wifi_configs:
            device = {
                "id": config.get("device_id", "unknown"),
                "name": config.get("device_name", "Unknown Device"),
                "model": config.get("device_model", "Unknown"),
                "ssid": config.get("ssid", ""),
                "security": config.get("security", "Unknown"),
                "signal_strength": config.get("signal_strength", -45),  # Sinal WiFi real ou simulado
                "status": "online" if config.get("enabled") else "offline",
                "connected_devices": 0,  # Placeholder - seria obtido de estatísticas
                "last_update": datetime.now().isoformat(),
                "wifi_config": config
            }
            devices.append(device)
        
        # Estatísticas
        stats = {
            "total_profiles": len(profiles),
            "active_profiles": len([p for p in profiles if p["status"] == "active"]),
            "total_devices": total_devices,
            "online_devices": enabled_devices,
            "avg_signal": -45.0,  # Placeholder
            "total_connections": 0  # Placeholder
        }
        
        return {
            "profiles": profiles,
            "devices": devices,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Erro ao formatar configurações WiFi para frontend: {e}")
        return {
            "profiles": [],
            "devices": [],
            "stats": {
                "total_profiles": 0,
                "active_profiles": 0,
                "total_devices": 0,
                "online_devices": 0,
                "avg_signal": -50.0,
                "total_connections": 0
            }
        }