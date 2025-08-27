/**
 * Exemplos de Presets para GenieACS - RJChronosConnect
 * 
 * Estes presets podem ser copiados e colados na interface do GenieACS
 * em Admin → Presets para automatizar configurações dos roteadores
 */

// ========================================
// PRESET 1: Configuração Inicial Básica
// ========================================
// Nome: "RJChronos_Initial_Setup"
// Descrição: Configuração inicial básica para todos os dispositivos

const now = Date.now();

// Configurar informações básicas do gerenciamento
declare("InternetGatewayDevice.ManagementServer.PeriodicInformEnable", {value: now}, {value: true});
declare("InternetGatewayDevice.ManagementServer.PeriodicInformInterval", {value: now}, {value: 300}); // 5 minutos

// Configurar NTP
declare("InternetGatewayDevice.Time.NTPServer1", {value: now}, {value: "pool.ntp.br"});
declare("InternetGatewayDevice.Time.Enable", {value: now}, {value: true});

// Log básico
log("RJChronos: Configuração inicial aplicada");

// ========================================
// PRESET 2: Configuração WiFi Padrão
// ========================================
// Nome: "RJChronos_WiFi_Config"
// Descrição: Configuração padrão do WiFi com segurança WPA2

const now = Date.now();
const deviceId = declare("DeviceID.ID", {value: 1}).value[0];
const serialNumber = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6); // Últimos 6 caracteres

// Configurar SSID baseado no serial
const wifiSSID = `RJChronos_${serialNumber}`;
const wifiPassword = `rjchronos${serialNumber}`;

// Aplicar configurações WiFi
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable", {value: now}, {value: true});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: now}, {value: wifiSSID});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType", {value: now}, {value: "11i"});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.IEEE11iEncryptionModes", {value: now}, {value: "AES"});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.IEEE11iAuthenticationMode", {value: now}, {value: "PSKAuthentication"});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase", {value: now}, {value: wifiPassword});

// Configurar canal automático
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.AutoChannelEnable", {value: now}, {value: true});

log(`RJChronos WiFi configurado: SSID=${wifiSSID}, Password=${wifiPassword}`);

// ========================================
// PRESET 3: Configuração de Segurança
// ========================================
// Nome: "RJChronos_Security_Config"
// Descrição: Configurações de segurança básicas

const now = Date.now();

// Desabilitar WPS (mais seguro)
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.WPS.Enable", {value: now}, {value: false});

// Configurar firewall básico
declare("InternetGatewayDevice.X_*_Firewall.Level", {value: now}, {value: "High"});

// Desabilitar serviços desnecessários
declare("InternetGatewayDevice.UserInterface.RemoteAccess.Enable", {value: now}, {value: false});

// Configurar timeout de sessão
declare("InternetGatewayDevice.UserInterface.AutoLogoffTime", {value: now}, {value: 300}); // 5 minutos

log("RJChronos: Configurações de segurança aplicadas");

// ========================================
// PRESET 4: Configuração DHCP
// ========================================
// Nome: "RJChronos_DHCP_Config"
// Descrição: Configuração do servidor DHCP interno

const now = Date.now();

// Configurar DHCP
declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DHCPServerEnable", {value: now}, {value: true});
declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MinAddress", {value: now}, {value: "192.168.1.100"});
declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.MaxAddress", {value: now}, {value: "192.168.1.200"});
declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DHCPLeaseTime", {value: now}, {value: 86400}); // 24 horas

// DNS servers
declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.DNSServers", {value: now}, {value: "8.8.8.8,8.8.4.4"});

log("RJChronos: Configuração DHCP aplicada");

// ========================================
// PRESET 5: Monitoramento e Logs
// ========================================
// Nome: "RJChronos_Monitoring_Config"
// Descrição: Configuração de monitoramento e logs

const now = Date.now();

// Habilitar logs
declare("InternetGatewayDevice.X_*_Logging.Enable", {value: now}, {value: true});
declare("InternetGatewayDevice.X_*_Logging.LogLevel", {value: now}, {value: "Warning"});

// Configurar SNMP se disponível
declare("InternetGatewayDevice.ManagementServer.STUNEnable", {value: now}, {value: false});

// Configurar estatísticas
declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.EthernetBytesReceived", {value: now});
declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Stats.EthernetBytesSent", {value: now});

log("RJChronos: Configuração de monitoramento aplicada");

// ========================================
// PRESET 6: Configuração por Modelo
// ========================================
// Nome: "RJChronos_Model_Specific"
// Descrição: Configurações específicas por modelo de dispositivo

const now = Date.now();
const deviceInfo = declare("InternetGatewayDevice.DeviceInfo.ModelName", {value: 1}).value[0];

// Configurações específicas por modelo
if (deviceInfo && deviceInfo.includes("Huawei")) {
    // Configurações específicas para Huawei
    declare("InternetGatewayDevice.X_HUAWEI_PowerValue", {value: now}, {value: "100"});
    log("RJChronos: Configurações específicas Huawei aplicadas");
    
} else if (deviceInfo && deviceInfo.includes("TP-Link")) {
    // Configurações específicas para TP-Link
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_*_TxPower", {value: now}, {value: "100"});
    log("RJChronos: Configurações específicas TP-Link aplicadas");
    
} else if (deviceInfo && deviceInfo.includes("Intelbras")) {
    // Configurações específicas para Intelbras
    declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_*_TxPower", {value: now}, {value: "100"});
    log("RJChronos: Configurações específicas Intelbras aplicadas");
    
} else {
    // Configurações genéricas
    log(`RJChronos: Configurações genéricas aplicadas para modelo: ${deviceInfo}`);
}

// ========================================
// PRESET 7: Reset de Configurações
// ========================================
// Nome: "RJChronos_Factory_Reset"
// Descrição: Reset para configurações de fábrica (USE COM CUIDADO!)

const now = Date.now();

// ATENÇÃO: Este preset fará reset completo do dispositivo
// Descomente apenas se necessário

// declare("InternetGatewayDevice.X_*_FactoryReset", {value: now}, {value: true});
// log("RJChronos: ATENÇÃO - Reset de fábrica executado!");

// Versão mais segura - apenas reset de configurações específicas
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: now}, {value: "RJChronos_Default"});
declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase", {value: now}, {value: "rjchronos2025"});

log("RJChronos: Configurações WiFi resetadas para padrão");

/**
 * INSTRUÇÕES DE USO:
 * 
 * 1. Acesse GenieACS UI: http://192.168.7.119:3000
 * 2. Vá em Admin → Presets
 * 3. Clique em "+" para criar novo preset
 * 4. Copie e cole o código do preset desejado
 * 5. Defina nome e peso (prioridade)
 * 6. Salve o preset
 * 
 * APLICAÇÃO AUTOMÁTICA:
 * - Weight 0: Aplica imediatamente em todos os dispositivos
 * - Weight > 0: Aplica apenas quando condições específicas são atendidas
 * 
 * CONDIÇÕES (Preconditions):
 * Exemplo para aplicar apenas em modelos específicos:
 * 
 * DeviceID.ProductClass = "BM632w"
 * 
 * Ou para aplicar baseado em parâmetros:
 * 
 * InternetGatewayDevice.DeviceInfo.ModelName = "Huawei*"
 * 
 */