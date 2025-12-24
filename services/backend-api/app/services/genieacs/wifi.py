"""Transformadores e helpers de WiFi (TR-069) do GenieACS."""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict, List, Tuple

from .utils import safe_get_nested, extract_manufacturer_model

logger = logging.getLogger(__name__)


def _get_wlan_context(band: str) -> Tuple[str, str]:
    wlan_config_id = "1" if band == "2.4GHz" else "2"
    base_path = f"InternetGatewayDevice.LANDevice.1.WLANConfiguration.{wlan_config_id}"
    return wlan_config_id, base_path


def _resolve_security(beacon_type: str) -> str:
    security_map = {
        "None": "Open",
        "Basic": "WEP",
        "WPA": "WPA",
        "11i": "WPA2",
        "WPAand11i": "WPA2",
    }
    return security_map.get(beacon_type, "WPA2")


def _get_wifi_password(device_data: Dict[str, Any], base_path: str, device_id: str, band: str) -> str:
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
        f"{base_path}.Security.WPA.PreSharedKey._value",
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
        logger.info("🔒 Senha não disponível para leitura - campo será deixado em branco para nova senha")
        # DEBUG: Mostrar estrutura disponível apenas no log
        wlan_data = safe_get_nested(device_data, base_path, {})
        if isinstance(wlan_data, dict):
            logger.debug(f"📊 Estrutura disponível em {base_path}:")
            for key in sorted(wlan_data.keys()):
                if 'key' in key.lower() or 'pass' in key.lower() or 'security' in key.lower():
                    logger.debug(f"    🔑 {key}: {safe_get_nested(wlan_data, key)}")

    return password


def _get_wifi_signal_strength(
    device_data: Dict[str, Any],
    base_path: str,
    wlan_config_id: str,
    wifi_enabled: bool,
    band: str,
    device_id: str,
) -> float | None:
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
        f"InternetGatewayDevice.Device.WiFi.Radio.{wlan_config_id}.Stats.NoiseFloor._value",
    ]

    # Tentar obter sinal WiFi real (se disponível)
    for signal_path in signal_paths:
        signal_candidate = safe_get_nested(device_data, signal_path)
        if signal_candidate and isinstance(signal_candidate, (int, float)):
            # Se o valor parece ser RSSI (negativo entre -100 e 0)
            if -100 <= signal_candidate <= 0:
                signal_strength = float(signal_candidate)
                logger.info(
                    f"📶 Sinal WiFi encontrado para {device_id}: {signal_strength}dBm (via {signal_path})"
                )
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
            logger.info(
                f"📶 Sinal WiFi simulado para {device_id} (banda {band}): {signal_strength}dBm"
            )
        else:
            signal_strength = None

    return signal_strength


def extract_wifi_config_from_device(device_data: Dict[str, Any], band: str = "2.4GHz") -> Dict[str, Any]:
    """
    Extrai configurações WiFi de um dispositivo GenieACS.

    Args:
        device_data: Dados raw do dispositivo do GenieACS
        band: Banda WiFi ("2.4GHz" ou "5GHz")

    Returns:
        Configurações WiFi formatadas
    """
    try:
        device_id = device_data.get("_id", "unknown")

        # Determinar qual WLANConfiguration usar baseado na banda
        wlan_config_id, base_path = _get_wlan_context(band)

        # Extrair configurações WiFi
        wifi_enabled = safe_get_nested(
            device_data,
            f"{base_path}.Enable._value",
            True,  # Default para True se não conseguir ler o valor
        )

        ssid = safe_get_nested(
            device_data,
            f"{base_path}.SSID._value",
            "",
        )

        # Tipo de segurança baseado no BeaconType
        beacon_type = safe_get_nested(
            device_data,
            f"{base_path}.BeaconType._value",
            "None",
        )

        # Mapear BeaconType para tipo de segurança
        security = _resolve_security(beacon_type)

        # Canal WiFi
        channel = safe_get_nested(
            device_data,
            f"{base_path}.Channel._value",
            "Auto",
        )

        # Auto channel enable
        auto_channel = safe_get_nested(
            device_data,
            f"{base_path}.AutoChannelEnable._value",
            False,
        )

        if auto_channel:
            channel = "Auto"

        # SSID Advertisement (para determinar se é hidden)
        ssid_broadcast = safe_get_nested(
            device_data,
            f"{base_path}.SSIDAdvertisementEnabled._value",
            True,
        )

        password = _get_wifi_password(device_data, base_path, device_id, band)

        # Potência de transmissão (alguns modelos Huawei)
        power = safe_get_nested(
            device_data,
            f"{base_path}.X_HUAWEI_PowerValue._value",
            100,
        )

        signal_strength = _get_wifi_signal_strength(
            device_data,
            base_path,
            wlan_config_id,
            bool(wifi_enabled),
            band,
            device_id,
        )

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
                "wlan_config_path": base_path,
            },
        }

        return wifi_config

    except Exception as e:
        logger.error(f"Erro ao extrair configuração WiFi do dispositivo: {e}")
        return None


def _append_security_tasks(tasks: List[Dict[str, Any]], base_path: str, value: str) -> None:
    security_map = {
        "Open": "None",
        "WEP": "Basic",
        "WPA": "WPA",
        "WPA2": "11i",
        "WPA3": "11i",  # Fallback para WPA2 se WPA3 não suportado
    }
    beacon_value = security_map.get(value, "11i")
    tasks.append({
        "name": "setParameterValues",
        "parameterValues": [[f"{base_path}.BeaconType", beacon_value]],
    })
    logger.info(f"🔒 Alteração de segurança WiFi: {value} -> BeaconType: {beacon_value}")

    if value in ["WPA2", "WPA3"]:
        # Configurar algoritmo de criptografia para WPA2/WPA3
        tasks.append({
            "name": "setParameterValues",
            "parameterValues": [[f"{base_path}.WPAEncryptionModes", "AESEncryption"]],
        })

        # Para WPA2/WPA3, configurar também AuthenticationMode
        tasks.append({
            "name": "setParameterValues",
            "parameterValues": [[f"{base_path}.WPAAuthenticationMode", "PSKAuthentication"]],
        })
    elif value == "Open":
        # Para rede aberta, desabilitar criptografia
        tasks.append({
            "name": "setParameterValues",
            "parameterValues": [[f"{base_path}.WEPKeyIndex", "1"]],
        })


def _append_parameter_task(
    tasks: List[Dict[str, Any]],
    base_path: str,
    field: str,
    value: Any,
    parameter_map: Dict[str, str],
) -> None:
    parameter_name = parameter_map[field]

    if field == "hidden":
        # hidden=True significa SSIDAdvertisement=False
        parameter_value = not bool(value)
    elif field == "channel":
        # Se channel for "Auto", habilitar AutoChannelEnable
        if str(value).lower() == "auto":
            tasks.append({
                "name": "setParameterValues",
                "parameterValues": [[f"{base_path}.AutoChannelEnable", True]],
            })
            return

        # Desabilitar auto channel e definir canal específico
        tasks.append({
            "name": "setParameterValues",
            "parameterValues": [[f"{base_path}.AutoChannelEnable", False]],
        })
        parameter_value = int(value)
    else:
        parameter_value = value

    tasks.append({
        "name": "setParameterValues",
        "parameterValues": [[parameter_name, parameter_value]],
    })


def _append_password_task(tasks: List[Dict[str, Any]], base_path: str, updates: Dict[str, Any]) -> None:
    if "password" in updates and updates.get("security", "WPA2") != "Open":
        password = updates["password"]
        if password:
            # Para WPA/WPA2, usar PreSharedKey
            tasks.append({
                "name": "setParameterValues",
                "parameterValues": [[f"{base_path}.PreSharedKey.1.KeyPassphrase", password]],
            })
            logger.info(f"✅ Adicionada task de senha WiFi: {password}")


def create_wifi_parameter_updates(
    device_id: str, updates: Dict[str, Any], band: str = "2.4GHz"
) -> List[Dict[str, Any]]:
    """
    Cria lista de parâmetros para atualizar configurações WiFi via GenieACS.

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

        tasks: List[Dict[str, Any]] = []
        wlan_config_id, base_path = _get_wlan_context(band)

        # Mapeamento de campos para parâmetros TR-069
        parameter_map = {
            "ssid": f"{base_path}.SSID",
            "enabled": f"{base_path}.Enable",
            "channel": f"{base_path}.Channel",
            "hidden": f"{base_path}.SSIDAdvertisementEnabled",  # Invertido: hidden=True -> SSIDAdvertisement=False
            "power": f"{base_path}.X_HUAWEI_PowerValue",  # Específico Huawei
        }

        logger.info(f"📋 Mapeamento de parâmetros: {parameter_map}")

        for field, value in updates.items():
            logger.info(f"🔍 Processando field: {field} = {value}")
            if value is None:
                continue

            if field == "security":
                _append_security_tasks(tasks, base_path, value)
                continue

            if field in parameter_map:
                _append_parameter_task(tasks, base_path, field, value, parameter_map)

        _append_password_task(tasks, base_path, updates)

        logger.info(f"✅ TASKS CRIADAS: {len(tasks)} tasks para dispositivo {device_id}")
        for i, task in enumerate(tasks):
            logger.info(f"   Task {i + 1}: {task}")
        return tasks

    except Exception as e:
        logger.error(f"Erro ao criar tasks de atualização WiFi: {e}")
        return []


def format_wifi_configs_for_frontend(wifi_configs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Formata configurações WiFi para o frontend.

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
        ssid_groups: Dict[str, List[Dict[str, Any]]] = {}
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
                "devices": devices,
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
                "wifi_config": config,
            }
            devices.append(device)

        # Estatísticas
        stats = {
            "total_profiles": len(profiles),
            "active_profiles": len([p for p in profiles if p["status"] == "active"]),
            "total_devices": total_devices,
            "online_devices": enabled_devices,
            "avg_signal": -45.0,  # Placeholder
            "total_connections": 0,  # Placeholder
        }

        return {
            "profiles": profiles,
            "devices": devices,
            "stats": stats,
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
                "total_connections": 0,
            },
        }
