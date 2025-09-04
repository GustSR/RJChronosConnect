# 📡 API Endpoints para Implementação Backend

> **Documentação para migração dos dados mockados para endpoints reais**  
> Gerada a partir da refatoração Fake API Frontend-First

---

## 🎯 **Objetivo desta Documentação**

Este documento lista **todos os endpoints** que o frontend está consumindo via **Fake API** e que precisam ser implementados no **backend FastAPI** para substituir os dados mockados.

Cada endpoint inclui:
- ✅ **Método HTTP** e **rota**
- ✅ **Parâmetros** de entrada
- ✅ **Exemplo de resposta** (JSON)
- ✅ **Prioridade** de implementação

---

## 🏗️ **ENDPOINTS POR CATEGORIA**

## **1. 📊 DASHBOARD & MÉTRICAS**

### **GET `/api/dashboard/metrics`**
**Descrição:** Retorna métricas consolidadas do dashboard principal  
**Parâmetros:** Nenhum  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
{
  "total_devices": 156,
  "online_devices": 142,
  "offline_devices": 14,
  "alerts_count": 3,
  "traffic_stats": {
    "total_bandwidth": 8547.3,
    "upload": 2341.2,
    "download": 6206.1
  },
  "olt_stats": {
    "total_olts": 4,
    "online_olts": 4,
    "total_onus": 156,
    "online_onus": 142,
    "average_rx_power": -18.5
  },
  "connection_stats": {
    "pppoe_connections": 98,
    "dhcp_connections": 44,
    "static_connections": 14
  },
  "wifi_stats": {
    "total_wifi_enabled": 134,
    "unique_ssids": 89,
    "security_types": {
      "WPA2-PSK": 112,
      "WPA-PSK": 18,
      "Open": 4
    }
  }
}
```

---

## **2. 📱 DISPOSITIVOS (ONUs/CPEs/OLTs)**

### **GET `/api/devices/onus`**
**Descrição:** Lista todas as ONUs provisionadas  
**Parâmetros:** Query opcional (`status`, `model`)  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
[
  {
    "id": "1",
    "serial_number": "GPON12345678",
    "model": "Huawei HG8245H",
    "status": "online",
    "last_inform": "2024-01-15T14:30:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "olt_id": "olt-central-01",
    "pon_port": "1/1/1",
    "rx_power": -15.2,
    "customer_name": "João da Silva Santos",
    "customer_address": "Rua das Flores, 123",
    "external_ip": "200.123.45.67",
    "lan_ip": "192.168.1.1",
    "voip_enabled": true
  }
]
```

### **GET `/api/devices/onus/{id}`**
**Descrição:** Busca ONU específica por ID  
**Parâmetros:** `id` (path parameter)  
**Prioridade:** 🟡 **MÉDIA**

### **GET `/api/devices/cpes`**
**Descrição:** Lista todos os CPEs  
**Parâmetros:** Query opcional (`status`, `model`)  
**Prioridade:** 🟡 **MÉDIA**

**Exemplo de Resposta:**
```json
[
  {
    "id": "1",
    "serial_number": "CPE12345678", 
    "model": "Intelbras Action R1200",
    "status": "online",
    "created_at": "2024-01-01T00:00:00Z",
    "wifi_enabled": true,
    "wifi_ssid": "RJChronos_123456",
    "customer_name": "Maria Silva"
  }
]
```

### **GET `/api/devices/olts`**
**Descrição:** Lista todas as OLTs  
**Parâmetros:** Query opcional (`status`, `model`)  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
[
  {
    "id": "olt-001",
    "serial_number": "OLT12345678",
    "model": "Huawei MA5608T", 
    "status": "online",
    "created_at": "2024-01-01T00:00:00Z",
    "location": "Central - Rio de Janeiro",
    "pon_ports": 16,
    "active_onus": 142,
    "uptime": 1318800,
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "temperature": 42.1
  }
]
```

### **GET `/api/devices/olts/{olt_id}/stats`**
**Descrição:** Estatísticas de ONUs por OLT  
**Parâmetros:** `olt_id` (path parameter)  
**Prioridade:** 🟡 **MÉDIA**

**Exemplo de Resposta:**
```json
{
  "total": 324,
  "online": 298, 
  "offline": 26
}
```

---

## **3. 🚨 ALERTAS**

### **GET `/api/alerts`**
**Descrição:** Lista alertas do sistema  
**Parâmetros:** Query opcional (`severity`, `acknowledged`)  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
[
  {
    "id": "1",
    "device_id": "1", 
    "severity": "warning",
    "title": "Sinal Baixo",
    "description": "ONU com sinal abaixo do ideal (-25 dBm)",
    "acknowledged": false,
    "created_at": "2024-01-15T10:30:00Z",
    "fault_code": "LOW_SIGNAL"
  }
]
```

### **PUT `/api/alerts/{alert_id}/acknowledge`**
**Descrição:** Marcar alerta como reconhecido  
**Parâmetros:** `alert_id` (path parameter)  
**Prioridade:** 🟡 **MÉDIA**

---

## **4. 🔧 PROVISIONAMENTO**

### **GET `/api/provisioning/pending`**
**Descrição:** ONUs pendentes de autorização  
**Parâmetros:** Nenhum  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
[
  {
    "id": "pending-demo-1",
    "serial_number": "PENDING001",
    "olt_name": "OLT-Central-01",
    "board": 1,
    "port": 1,
    "discovered_at": "2024-01-15T14:15:00Z",
    "distance": 1.2,
    "onu_type": "Huawei HG8310M",
    "status": "pending",
    "rx_power": -18.5,
    "temperature": 42.1
  }
]
```

### **POST `/api/provisioning/{onu_id}/authorize`**
**Descrição:** Autorizar uma ONU pendente  
**Parâmetros:** `onu_id` (path), dados do cliente (body)  
**Prioridade:** 🔴 **ALTA**

**Body da Requisição:**
```json
{
  "client_name": "João Silva",
  "client_address": "Rua das Flores, 123",
  "service_profile": "internet_100mb",
  "vlan_id": 100,
  "wan_mode": "pppoe",
  "comment": "Cliente residencial"
}
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "message": "ONU pending-demo-1 autorizada com sucesso",
  "client_name": "João Silva",
  "onu_id": "pending-demo-1",
  "authorized_at": "2024-01-15T14:30:00Z"
}
```

### **DELETE `/api/provisioning/{onu_id}/reject`**
**Descrição:** Rejeitar uma ONU pendente  
**Parâmetros:** `onu_id` (path), `reason` (query opcional)  
**Prioridade:** 🟡 **MÉDIA**

### **GET `/api/provisioning/clients`**
**Descrição:** Listar ONUs provisionadas (clientes)  
**Parâmetros:** Query opcional (`status`, `model`)  
**Prioridade:** 🔴 **ALTA**

---

## **5. 📡 CONFIGURAÇÃO WiFi**

### **GET `/api/wifi/configs`**
**Descrição:** Todas as configurações WiFi  
**Parâmetros:** Nenhum  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
[
  {
    "device_id": "1",
    "band": "2.4GHz",
    "ssid": "RJChronos_Cliente1_2.4G",
    "enabled": true,
    "security_mode": "WPA2-PSK",
    "password": "cliente123",
    "channel": 1,
    "tx_power": 20,
    "last_updated": "2024-01-15T14:30:00Z"
  }
]
```

### **GET `/api/wifi/configs/{device_id}`**
**Descrição:** Configuração WiFi de um dispositivo por banda  
**Parâmetros:** `device_id` (path), `band` (query: "2.4GHz" ou "5GHz")  
**Prioridade:** 🔴 **ALTA**

### **PUT `/api/wifi/configs/{device_id}`**
**Descrição:** Atualizar configuração WiFi por banda  
**Parâmetros:** `device_id` (path), `band` (query), dados WiFi (body)  
**Prioridade:** 🔴 **ALTA**

**Body da Requisição:**
```json
{
  "ssid": "NovoSSID_2.4G",
  "enabled": true,
  "security_mode": "WPA2-PSK", 
  "password": "novasenha123",
  "channel": 6,
  "tx_power": 18
}
```

### **POST `/api/device/refresh-wifi`**
**Descrição:** Forçar refresh das configurações WiFi  
**Parâmetros:** `device_id` (query)  
**Prioridade:** 🟡 **MÉDIA**

### **POST `/api/wifi/refresh-ip/{device_id}`**
**Descrição:** Refresh do IP do dispositivo  
**Parâmetros:** `device_id` (path)  
**Prioridade:** 🟢 **BAIXA**

---

## **6. 📊 ANALYTICS & PERFORMANCE**

### **GET `/api/analytics/bandwidth`**
**Descrição:** Dados históricos de largura de banda  
**Parâmetros:** `period` (query: "24h", "7d", "30d")  
**Prioridade:** 🟡 **MÉDIA**

**Exemplo de Resposta:**
```json
{
  "current_download": 847.3,
  "current_upload": 432.1,
  "peak_download": 920.5,
  "peak_upload": 456.8,
  "average_download": 789.2,
  "average_upload": 421.6,
  "data_points": [
    {
      "timestamp": "2024-01-15T13:00:00Z",
      "download_mbps": 847.3,
      "upload_mbps": 432.1,
      "total_mbps": 1279.4
    }
  ]
}
```

### **GET `/api/analytics/traffic-sources`**
**Descrição:** Principais fontes de tráfego  
**Parâmetros:** Nenhum  
**Prioridade:** 🟢 **BAIXA**

### **GET `/api/analytics/olt-performance`**
**Descrição:** Dados de performance das OLTs  
**Parâmetros:** Nenhum  
**Prioridade:** 🟢 **BAIXA**

---

## **7. 📋 HISTÓRICO DE ATIVIDADES**

### **GET `/api/activity/logs`**
**Descrição:** Logs de atividade básicos  
**Parâmetros:** `limit`, `page` (query opcional)  
**Prioridade:** 🟡 **MÉDIA**

### **GET `/api/activity-history`**
**Descrição:** Histórico detalhado de atividades  
**Parâmetros:** Múltiplos filtros (query opcional)  
**Prioridade:** 🟡 **MÉDIA**

**Exemplo de Resposta:**
```json
[
  {
    "id": "1",
    "action": "Provisionou ONT",
    "description": "Cliente: Maria Santos - ONT: ZTE-F670L",
    "user_name": "João Silva",
    "status": "success", 
    "created_at": "2024-01-15T14:15:00Z",
    "task_name": "provision_ont",
    "device_id": "1"
  }
]
```

### **GET `/api/activity-history/{activity_id}`**
**Descrição:** Buscar atividade específica por ID  
**Parâmetros:** `activity_id` (path)  
**Prioridade:** 🟢 **BAIXA**

### **GET `/api/activity-history/device/{device_id}`**
**Descrição:** Atividades de um dispositivo específico  
**Parâmetros:** `device_id` (path)  
**Prioridade:** 🟢 **BAIXA**

### **POST `/api/activity-history`**
**Descrição:** Criar nova entrada no histórico  
**Parâmetros:** Dados da atividade (body)  
**Prioridade:** 🟡 **MÉDIA**

### **GET `/api/activity-history/stats`**
**Descrição:** Estatísticas do histórico de atividades  
**Parâmetros:** Nenhum  
**Prioridade:** 🟢 **BAIXA**

---

## **8. 🔧 TR-069 OPERATIONS**

### **POST `/api/tr069/connection-request/{device_id}`**
**Descrição:** Executar connection request TR-069  
**Parâmetros:** `device_id` (path)  
**Prioridade:** 🟡 **MÉDIA**

### **POST `/api/tr069/get-parameters/{device_id}`**
**Descrição:** Obter parâmetros específicos via TR-069  
**Parâmetros:** `device_id` (path), lista de parâmetros (body)  
**Prioridade:** 🟡 **MÉDIA**

### **POST `/api/tr069/set-parameters/{device_id}`**
**Descrição:** Definir parâmetros via TR-069  
**Parâmetros:** `device_id` (path), parâmetros (body)  
**Prioridade:** 🟡 **MÉDIA**

### **POST `/api/tr069/factory-reset/{device_id}`**
**Descrição:** Factory reset via TR-069  
**Parâmetros:** `device_id` (path)  
**Prioridade:** 🟢 **BAIXA**

### **POST `/api/tr069/reboot/{device_id}`**
**Descrição:** Reboot dispositivo via TR-069  
**Parâmetros:** `device_id` (path)  
**Prioridade:** 🟡 **MÉDIA**

---

## **9. 👤 CLIENTES**

### **GET `/api/clients/{onu_id}`**
**Descrição:** Configuração de um cliente provisionado  
**Parâmetros:** `onu_id` (path)  
**Prioridade:** 🟡 **MÉDIA**

### **PUT `/api/clients/{onu_id}`**
**Descrição:** Atualizar configuração de cliente  
**Parâmetros:** `onu_id` (path), atualizações (body)  
**Prioridade:** 🟡 **MÉDIA**

---

## **10. ⚡ HEALTH CHECK**

### **GET `/api/`**
**Descrição:** Verificar status da API  
**Parâmetros:** Nenhum  
**Prioridade:** 🔴 **ALTA**

**Exemplo de Resposta:**
```json
{
  "status": "ok", 
  "message": "RJChronos API v2.0.0 - Online"
}
```

---

## **📋 RESUMO DE PRIORIDADES**

### **🔴 ALTA PRIORIDADE (Implementar Primeiro):**
1. `GET /api/dashboard/metrics`
2. `GET /api/devices/onus`
3. `GET /api/devices/olts`
4. `GET /api/alerts`
5. `GET /api/provisioning/pending`
6. `POST /api/provisioning/{onu_id}/authorize`
7. `GET /api/provisioning/clients`
8. `GET /api/wifi/configs`
9. `GET /api/wifi/configs/{device_id}`
10. `PUT /api/wifi/configs/{device_id}`
11. `GET /api/`

### **🟡 MÉDIA PRIORIDADE:**
- Estatísticas de dispositivos
- Analytics de bandwidth
- Histórico de atividades
- Operações TR-069 básicas

### **🟢 BAIXA PRIORIDADE:**
- Analytics avançados
- Operações TR-069 avançadas
- Funcionalidades administrativas

---

## **🎯 PRÓXIMOS PASSOS**

1. **Implementar endpoints de ALTA prioridade**
2. **Testar com frontend usando dados reais**
3. **Configurar `REACT_APP_USE_MOCK=false`**  
4. **Implementar demais endpoints conforme necessidade**

---

**📌 Esta documentação serve como contrato entre Frontend e Backend para substituição completa dos dados mockados por endpoints funcionais.**