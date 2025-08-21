/**
 * GenieACS UI Preset - Device Parameters Display
 * Preset para garantir que parâmetros importantes sejam sempre visíveis
 */

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