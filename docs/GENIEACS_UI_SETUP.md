# Configuração do GenieACS UI para Mostrar IP dos Dispositivos

## 🎯 Objetivo
Configurar o GenieACS UI para mostrar o IP address dos dispositivos na interface web.

## 📋 Passos para Configuração

### 1. Aplicar Preset de UI (Via Interface Web)

1. **Acesse o GenieACS UI:**
   ```
   http://localhost:3000
   ```

2. **Vá para Admin → Presets:**
   - Clique em "Admin" no menu superior
   - Selecione "Presets" 

3. **Criar Novo Preset:**
   - Clique em "+" para adicionar novo preset
   - **Name:** `UI_Display_Parameters`
   - **Channel:** `default` 
   - **Weight:** `100`
   - **Precondition:** Deixe vazio (aplicar para todos os dispositivos)

4. **Copie o conteúdo do arquivo `genieacs_ui_preset.js`:**
   ```javascript
   const now = Date.now();

   // Declarar parâmetros importantes que queremos sempre visíveis
   declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress", {value: 1}, {value: now});
   declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress", {value: 1}, {value: now});
   declare("InternetGatewayDevice.Services.X_HUAWEI_WANRemoteAccess.IPAddress2", {value: 1}, {value: now});
   declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress", {value: 1}, {value: now});

   // Parâmetros WiFi
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: 1}, {value: now});
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable", {value: 1}, {value: now});
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType", {value: 1}, {value: now});
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel", {value: 1}, {value: now});

   // Informações do dispositivo
   declare("InternetGatewayDevice.DeviceInfo.HardwareVersion", {value: 1}, {value: now});
   declare("InternetGatewayDevice.DeviceInfo.SoftwareVersion", {value: 1}, {value: now});
   declare("InternetGatewayDevice.DeviceInfo.Description", {value: 1}, {value: now});

   log("UI Preset: Parâmetros importantes declarados para visualização");
   ```

5. **Salvar o preset:**
   - Clique em "Save"

### 2. Configurar Colunas Personalizadas (Via Interface Web)

1. **Vá para Admin → Config:**
   - Clique em "Admin" 
   - Selecione "Config"

2. **Adicionar configurações de UI:**
   - Clique em "+" para adicionar nova configuração
   - **Key:** `ui.device.0.type`
   - **Value:** `parameter`

3. **Adicionar coluna de IP WAN:**
   - **Key:** `ui.device.0.label`
   - **Value:** `WAN IP`
   - **Key:** `ui.device.0.parameter`
   - **Value:** `InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress`

4. **Adicionar coluna de IP LAN:**
   - **Key:** `ui.device.1.type`
   - **Value:** `parameter`
   - **Key:** `ui.device.1.label`
   - **Value:** `LAN IP`
   - **Key:** `ui.device.1.parameter`
   - **Value:** `InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress`

5. **Adicionar coluna de WiFi SSID:**
   - **Key:** `ui.device.2.type`
   - **Value:** `parameter`
   - **Key:** `ui.device.2.label`  
   - **Value:** `WiFi SSID`
   - **Key:** `ui.device.2.parameter`
   - **Value:** `InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID`

### 3. Atualizar Dispositivos

1. **Vá para Devices:**
   - Clique em "Devices" no menu principal
   - Você deve ver seu dispositivo Huawei AX2: `00E0FC-Huawei-VMXQU23809603041`

2. **Forçar atualização:**
   - Clique no dispositivo
   - Clique no botão "Refresh" ou "Summon" 
   - Aguarde alguns segundos

3. **Verificar colunas:**
   - Volte para a lista de dispositivos
   - As novas colunas devem aparecer com os valores de IP

### 4. Método Alternativo via Arquivo de Configuração

Se preferir usar arquivo de configuração:

1. **Criar arquivo de configuração:**
   ```bash
   # No container GenieACS, criar arquivo config.json
   docker-compose exec genieacs sh -c 'cat > /opt/genieacs/config.json << EOF
   {
     "ui": {
       "device": {
         "0": {
           "type": "parameter",
           "label": "WAN IP", 
           "parameter": "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress"
         },
         "1": {
           "type": "parameter",
           "label": "LAN IP",
           "parameter": "InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress"  
         },
         "2": {
           "type": "parameter", 
           "label": "WiFi SSID",
           "parameter": "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID"
         }
       }
     }
   }
   EOF'
   ```

2. **Reiniciar GenieACS:**
   ```bash
   docker-compose restart genieacs
   ```

## ✅ Resultado Esperado

Após aplicar essas configurações, você deve ver na interface do GenieACS:

- **Dispositivo:** `00E0FC-Huawei-VMXQU23809603041`
- **WAN IP:** `192.168.7.88`
- **LAN IP:** `192.168.8.130` 
- **WiFi SSID:** `PepeGamer`

## 🔍 Troubleshooting

### Se os IPs não aparecerem:

1. **Force um refresh completo:**
   ```bash
   curl -X POST "http://localhost:7557/devices/00E0FC-Huawei-VMXQU23809603041/tasks?connection_request" \
        -H "Content-Type: application/json" \
        -d '{"name":"refreshObject","objectName":"InternetGatewayDevice.WANDevice.1."}'
   ```

2. **Verifique se os parâmetros existem:**
   - No GenieACS UI, clique no dispositivo
   - Navegue pela árvore de parâmetros
   - Procure por `InternetGatewayDevice → WANDevice → 1 → WANConnectionDevice → 1 → WANIPConnection`

3. **Use parâmetros alternativos:**
   - Se `WANIPConnection.2` não existir, use `WANIPConnection.1`
   - Para Huawei, também tente: `Services.X_HUAWEI_WANRemoteAccess.IPAddress2`

## 🚀 Dicas Avançadas

### Para mostrar status online/offline baseado em timestamp:

```javascript
// No preset, adicione:
const fiveMinutesAgo = now - (5 * 60 * 1000);
declare("_lastInform", {value: 1}, {value: now});

// Na configuração UI:
ui.device.3.type = "timestamp"
ui.device.3.label = "Last Seen"  
ui.device.3.parameter = "_lastInform"
```

### Para filtros personalizados:

1. Use a busca avançada no GenieACS
2. Exemplos de filtros:
   - Dispositivos online: `_lastInform > (now() - 300000)`
   - Com WiFi habilitado: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable = true`
   - Com IP WAN: `InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress != ""`