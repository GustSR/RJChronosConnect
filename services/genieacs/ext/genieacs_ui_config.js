/**
 * GenieACS UI Configuration
 * Customização para mostrar IP address dos dispositivos
 */

// Configuração personalizada para a tabela de dispositivos
const config = {
  // Adicionar colunas personalizadas à visualização de dispositivos
  "device-list": {
    columns: [
      {
        id: "SerialNumber",
        label: "Serial Number",
        parameter: "_deviceId._SerialNumber",
        type: "parameter"
      },
      {
        id: "ProductClass", 
        label: "Model",
        parameter: "_deviceId._ProductClass",
        type: "parameter"
      },
      {
        id: "LastInform",
        label: "Last Inform", 
        parameter: "_lastInform",
        type: "timestamp"
      },
      {
        id: "ExternalIP",
        label: "WAN IP",
        parameter: [
          "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress",
          "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress",
          "InternetGatewayDevice.Services.X_HUAWEI_WANRemoteAccess.IPAddress2"
        ],
        type: "parameter"
      },
      {
        id: "LANIP",
        label: "LAN IP", 
        parameter: "InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress",
        type: "parameter"
      },
      {
        id: "WiFiSSID",
        label: "WiFi SSID",
        parameter: "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", 
        type: "parameter"
      },
      {
        id: "WiFiEnabled",
        label: "WiFi Status",
        parameter: "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable",
        type: "parameter",
        render: function(value) {
          return value ? "Enabled" : "Disabled";
        }
      }
    ]
  }
};

// Função para aplicar configuração personalizada
function customizeUI() {
  // Esta configuração seria aplicada pelo GenieACS
  return config;
}

// Configuração de filtros personalizados
const customFilters = {
  "online-devices": {
    label: "Online Devices",
    filter: "DATE_NOW() - _lastInform <= 300000" // 5 minutos
  },
  "wifi-enabled": {
    label: "WiFi Enabled",
    filter: "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable = true"
  },
  "has-wan-ip": {
    label: "Has WAN IP",
    filter: "InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.2.ExternalIPAddress IS NOT NULL"
  }
};

// Exportar configuração
if (typeof module !== 'undefined') {
  module.exports = { config, customFilters };
}