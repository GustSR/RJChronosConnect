# Configuração WiFi 2.4GHz e 5GHz no GenieACS

## Objetivo
Este documento explica como configurar o GenieACS para suportar configurações separadas das redes WiFi 2.4GHz e 5GHz, permitindo que o RJChronos gerencie cada banda independentemente.

## 1. Estrutura de Parâmetros TR-069 para WiFi

### 2.4GHz (Radio 1)
```javascript
// Parâmetros típicos para interface 2.4GHz
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Standard
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSIDAdvertisementEnabled
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.RadioEnabled
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.TransmitPower
InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase
```

### 5GHz (Radio 2)
```javascript
// Parâmetros típicos para interface 5GHz
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSID
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.BeaconType
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.Standard
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.Channel
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSIDAdvertisementEnabled
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.RadioEnabled
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.TransmitPower
InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.KeyPassphrase
```

## 2. Presets GenieACS

### Preset para WiFi 2.4GHz
```javascript
// Preset: wifi_24ghz_config
const declare = (name, path, value) => {
  return {name, path, value};
};

// Parâmetros WiFi 2.4GHz
declare("SSID_24", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: args.ssid});
declare("Password_24", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", {value: args.password});
declare("RadioEnabled_24", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.RadioEnabled", {value: args.enabled});
declare("Channel_24", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel", {value: args.channel});
declare("TransmitPower_24", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.TransmitPower", {value: args.power});
declare("SSIDHidden_24", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSIDAdvertisementEnabled", {value: !args.hidden});
```

### Preset para WiFi 5GHz
```javascript
// Preset: wifi_5ghz_config
const declare = (name, path, value) => {
  return {name, path, value};
};

// Parâmetros WiFi 5GHz
declare("SSID_5G", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSID", {value: args.ssid});
declare("Password_5G", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.KeyPassphrase", {value: args.password});
declare("RadioEnabled_5G", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.RadioEnabled", {value: args.enabled});
declare("Channel_5G", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.Channel", {value: args.channel});
declare("TransmitPower_5G", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.TransmitPower", {value: args.power});
declare("SSIDHidden_5G", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSIDAdvertisementEnabled", {value: !args.hidden});
```

## 3. Configuração do Backend

### Endpoints Necessários

#### GET `/api/wifi/configs/{deviceId}?band=2.4GHz`
- Retorna configuração WiFi da banda 2.4GHz
- Busca parâmetros da `WLANConfiguration.1`

#### GET `/api/wifi/configs/{deviceId}?band=5GHz`  
- Retorna configuração WiFi da banda 5GHz
- Busca parâmetros da `WLANConfiguration.2`

#### PUT `/api/wifi/configs/{deviceId}?band=2.4GHz`
- Atualiza configuração WiFi da banda 2.4GHz
- Aplica preset `wifi_24ghz_config`

#### PUT `/api/wifi/configs/{deviceId}?band=5GHz`
- Atualiza configuração WiFi da banda 5GHz  
- Aplica preset `wifi_5ghz_config`

## 4. Implementação no Backend Python

```python
@app.get("/api/wifi/configs/{device_id}/{band}")
async def get_wifi_config_by_band(device_id: str, band: str):
    """Buscar configuração WiFi por banda específica"""
    
    # Determinar qual WLANConfiguration usar
    wlan_index = "1" if band == "2.4GHz" else "2"
    
    # Buscar parâmetros específicos da banda
    wifi_params = await genieacs_client.get_device_parameters(
        device_id, 
        f"InternetGatewayDevice.LANDevice.1.WLANConfiguration.{wlan_index}"
    )
    
    return {
        "device_id": device_id,
        "band": band,
        "ssid": wifi_params.get("SSID", ""),
        "enabled": wifi_params.get("RadioEnabled", True),
        "password": wifi_params.get("KeyPassphrase", ""),
        "channel": wifi_params.get("Channel", "auto"),
        "power": wifi_params.get("TransmitPower", 75),
        "hidden": not wifi_params.get("SSIDAdvertisementEnabled", True)
    }

@app.put("/api/wifi/configs/{device_id}/{band}")
async def update_wifi_config_by_band(device_id: str, band: str, config: WiFiConfigUpdate):
    """Atualizar configuração WiFi por banda específica"""
    
    # Escolher preset baseado na banda
    preset_name = "wifi_24ghz_config" if band == "2.4GHz" else "wifi_5ghz_config"
    
    # Aplicar preset com parâmetros
    result = await genieacs_client.apply_preset(
        device_id,
        preset_name,
        {
            "ssid": config.ssid,
            "password": config.password,
            "enabled": config.enabled,
            "channel": config.channel,
            "power": config.power,
            "hidden": config.hidden
        }
    )
    
    return result
```

## 5. Visualização no GenieACS UI

### Adicionar Virtual Parameters

```javascript
// Virtual Parameter: wifi_24_summary
`${InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID} (${InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.RadioEnabled ? 'ON' : 'OFF'})`

// Virtual Parameter: wifi_5g_summary  
`${InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSID} (${InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.RadioEnabled ? 'ON' : 'OFF'})`
```

### Configurar Overview Page

```javascript
// Adicionar na página de overview do dispositivo
{
  "label": "WiFi 2.4GHz",
  "parameter": "VirtualParameters.wifi_24_summary"
},
{
  "label": "WiFi 5GHz", 
  "parameter": "VirtualParameters.wifi_5g_summary"
}
```

## 6. Testes

### Teste 1: Verificar Separação das Bandas
1. Configure SSID diferente para 2.4GHz e 5GHz
2. Desabilite apenas a 5GHz
3. Verifique se a 2.4GHz permanece ativa

### Teste 2: Canais Independentes
1. Configure canal 6 para 2.4GHz
2. Configure canal 36 para 5GHz  
3. Verifique se cada banda usa o canal correto

### Teste 3: Senhas Diferentes
1. Configure senhas diferentes para cada banda
2. Teste conectividade em ambas as redes

## 7. Monitoramento

### Logs a Verificar
- Aplicação correta dos presets
- Sincronização dos parâmetros TR-069
- Status individual de cada radio

### Dashboard Metrics
- Status separado das duas bandas
- Número de clientes conectados por banda
- Potência de transmissão individual

## Conclusão

Com esta configuração, o GenieACS suportará o gerenciamento independente das redes WiFi 2.4GHz e 5GHz, permitindo:

✅ SSIDs diferentes para cada banda
✅ Habilitação/desabilitação independente  
✅ Configuração de canais específicos
✅ Potências de transmissão separadas
✅ Senhas independentes
✅ Visibilidade separada no GenieACS UI

Isso resolve completamente o problema de alteração simultânea das duas redes.
