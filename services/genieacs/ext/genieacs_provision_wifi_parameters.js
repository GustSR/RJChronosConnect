/**
 * GenieACS Provision Script - WiFi Parameters Auto-Refresh
 * Este script força o refresh automático de parâmetros WiFi essenciais
 * Para aplicar: Admin → Provisions → Create → Cole este código
 */

// 1. Forçar refresh do IP externo
declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress", {value: 1}, {value: Date.now()});

// 2. Forçar refresh de parâmetros WiFi essenciais
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: 1}, {value: Date.now()});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable", {value: 1}, {value: Date.now()});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType", {value: 1}, {value: Date.now()});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel", {value: 1}, {value: Date.now()});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSIDAdvertisementEnabled", {value: 1}, {value: Date.now()});

// 3. Alternativas para IP em diferentes modelos
declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ExternalIPAddress", {value: 1}, {value: Date.now()});
declare("Device.IP.Interface.1.IPv4Address.1.IPAddress", {value: 1}, {value: Date.now()});

// 4. Para dispositivos Huawei - parâmetros específicos
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_HUAWEI_PowerValue", {value: 1}, {value: Date.now()});

log("WiFi Parameters Provision: Refreshing essential parameters");