# 📚 Documentação Completa da API - OLT Manager Huawei

Esta documentação detalha todos os 40 endpoints REST disponíveis na API do OLT Manager Huawei, incluindo exemplos de uso, parâmetros, respostas e casos de uso para integração com frontend.

## 🌟 Visão Geral

- **Base URL:** `http://localhost:8000`
- **Versão da API:** `v1`
- **Formato:** JSON
- **Autenticação:** Não requerida (uso interno)
- **Total de Endpoints:** 40
- **Grupos de Funcionalidades:** 8

---

## 📑 Índice

1. [Port Management (4 endpoints)](#port-management)
2. [ONT Management (16 endpoints)](#ont-management)
3. [Profiles (4 endpoints)](#profiles)
4. [Advanced Configuration (4 endpoints)](#advanced-configuration)
5. [VLAN Management (3 endpoints)](#vlan-management)
6. [User Management (3 endpoints)](#user-management)
7. [Backup & Restore (2 endpoints)](#backup--restore)
8. [Monitoring (4 endpoints)](#monitoring)

---

## 🔌 Port Management

Gerenciamento de portas PON da OLT.

### 1. POST `/api/v1/olts/{olt_id}/ports/{port}/shutdown`
**Desliga uma porta PON específica**

**Parâmetros:**
- `olt_id` (int): ID da OLT (1-9999)
- `port` (str): Porta no formato "frame/slot/port" (ex: "0/1/0")

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/ports/0/1/0/shutdown"
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Porta 0/1/0 desligada com sucesso",
  "port": "0/1/0",
  "action": "shutdown"
}
```

### 2. POST `/api/v1/olts/{olt_id}/ports/{port}/enable`
**Liga uma porta PON específica**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta no formato "frame/slot/port"

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/ports/0/1/0/enable"
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Porta 0/1/0 habilitada com sucesso",
  "port": "0/1/0",
  "action": "enable"
}
```

### 3. GET `/api/v1/olts/{olt_id}/ports/{port}/state`
**Obtém estado de uma porta PON**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta no formato "frame/slot/port"

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/ports/0/1/0/state"
```

**Resposta:**
```json
{
  "port_id": "0/1/0",
  "admin_state": "up",
  "oper_state": "up",
  "auto_find": "enabled"
}
```

### 4. PUT `/api/v1/olts/{olt_id}/ports/{port}/mode`
**Configura modo de uma porta PON**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta no formato "frame/slot/port"

**Body:**
```json
{
  "mode": "gpon"
}
```

**Exemplo de Requisição:**
```bash
curl -X PUT "http://localhost:8000/api/v1/olts/1/ports/0/1/0/mode" \
  -H "Content-Type: application/json" \
  -d '{"mode": "gpon"}'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Modo da porta configurado com sucesso",
  "port": "0/1/0",
  "mode": "gpon"
}
```

---

## 🏠 ONT Management

Gerenciamento completo de ONTs/ONUs.

### 5. GET `/api/v1/olts/{olt_id}/onts`
**Busca ONT por serial number**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `serial_number` (query string): Serial da ONT

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/onts?serial_number=HWTC12345678"
```

**Resposta:**
```json
[
  {
    "ont_id": 1,
    "serial_number": "HWTC12345678",
    "port": "0/1/0",
    "run_state": "online",
    "config_state": "normal",
    "match_state": "match",
    "distance": 1234
  }
]
```

### 6. GET `/api/v1/olts/{olt_id}/ports/{port}/onts/all`
**Lista todas ONTs em uma porta**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta no formato "frame/slot/port"

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/all"
```

**Resposta:**
```json
[
  {
    "ont_id": 0,
    "serial_number": "HWTC12345678",
    "run_state": "online",
    "config_state": "normal"
  },
  {
    "ont_id": 1,
    "serial_number": "HWTC87654321",
    "run_state": "offline",
    "config_state": "normal"
  }
]
```

### 7. POST `/api/v1/olts/{olt_id}/onts`
**Provisiona uma nova ONT**

**Parâmetros:**
- `olt_id` (int): ID da OLT

**Body:**
```json
{
  "port": "0/1/0",
  "ont_id": 1,
  "serial_number": "HWTC12345678",
  "ont_line_profile_name": "profile_100M",
  "ont_srv_profile_name": "service_residential"
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/onts" \
  -H "Content-Type: application/json" \
  -d '{
    "port": "0/1/0",
    "ont_id": 1,
    "serial_number": "HWTC12345678",
    "ont_line_profile_name": "profile_100M",
    "ont_srv_profile_name": "service_residential"
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "ONT provisionada com sucesso",
  "ont_id": 1,
  "port": "0/1/0",
  "serial_number": "HWTC12345678"
}
```

### 8. POST `/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/reboot`
**Reinicia uma ONT específica**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta da ONT
- `ont_id_on_port` (int): ID da ONT na porta

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/1/reboot"
```

**Resposta:**
```json
{
  "status": "success",
  "message": "ONT reiniciada com sucesso",
  "ont_id": 1,
  "port": "0/1/0"
}
```

### 9. GET `/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/optical-info`
**Obtém informações ópticas da ONT**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta da ONT
- `ont_id_on_port` (int): ID da ONT na porta

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/1/optical-info"
```

**Resposta:**
```json
{
  "rx_power": -13.11,
  "tx_power": 2.34,
  "temperature": 45.2,
  "voltage": 3.3,
  "bias_current": 25.6,
  "distance": 1234
}
```

### 10. GET `/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/traffic`
**Obtém informações de tráfego da ONT**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `port` (str): Porta da ONT
- `ont_id_on_port` (int): ID da ONT na porta

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/1/traffic"
```

**Resposta:**
```json
[
  {
    "port_id": 1,
    "ingress_bytes": 1234567890,
    "egress_bytes": 987654321,
    "ingress_packets": 123456,
    "egress_packets": 98765
  }
]
```

### 11. GET `/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/port-states`
**Obtém estado das portas ethernet da ONT**

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/1/port-states"
```

**Resposta:**
```json
[
  {
    "port_id": 1,
    "admin_state": "up",
    "oper_state": "up",
    "speed": "1000M",
    "duplex": "full"
  },
  {
    "port_id": 2,
    "admin_state": "up",
    "oper_state": "down",
    "speed": "auto",
    "duplex": "auto"
  }
]
```

### 12. GET `/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id_on_port}/mac-addresses`
**Obtém endereços MAC aprendidos pela ONT**

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/1/mac-addresses"
```

**Resposta:**
```json
[
  {
    "mac_address": "00:1A:2B:3C:4D:5E",
    "vlan_id": 100,
    "port_id": 1,
    "learned_time": "2024-01-15 10:30:00"
  }
]
```

### 13-20. Demais endpoints de ONT Management
Os demais endpoints seguem padrão similar para:
- Atributos de porta ethernet
- Estatísticas de porta ethernet
- ONTs em autofind
- Confirmação de ONT
- Portas de serviço
- Registro de informações
- ONTs com falha

---

## 📊 Profiles

Gerenciamento de perfis DBA, linha e serviço.

### 21. POST `/api/v1/olts/{olt_id}/dba-profiles`
**Cria perfil DBA (Dynamic Bandwidth Allocation)**

**Body:**
```json
{
  "profile_name": "dba_100M",
  "type": "type3",
  "assure_bandwidth": 10240,
  "max_bandwidth": 102400
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/dba-profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_name": "dba_100M",
    "type": "type3",
    "assure_bandwidth": 10240,
    "max_bandwidth": 102400
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Perfil DBA criado com sucesso",
  "profile_name": "dba_100M",
  "max_bandwidth": 102400
}
```

### 22. POST `/api/v1/olts/{olt_id}/ont-line-profiles`
**Cria perfil de linha ONT**

**Body:**
```json
{
  "profile_name": "line_profile_residential",
  "tconts": [
    {
      "tcont_id": 1,
      "dba_profile_name": "dba_100M"
    }
  ],
  "gem_ports": [
    {
      "gem_port_id": 1,
      "tcont_id": 1,
      "direction": "bidirectional"
    }
  ]
}
```

### 23. POST `/api/v1/olts/{olt_id}/ont-srv-profiles`
**Cria perfil de serviço ONT**

### 24. POST `/api/v1/olts/{olt_id}/gpon-alarm-profiles`
**Cria perfil de alarme GPON**

---

## ⚙️ Advanced Configuration

Configurações avançadas da OLT.

### 25. POST `/api/v1/olts/{olt_id}/interfaces/gpon/password`
**Configura senha de autenticação GPON**

**Body:**
```json
{
  "frame": 0,
  "slot": 1,
  "password": "12345678"
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/interfaces/gpon/password" \
  -H "Content-Type: application/json" \
  -d '{
    "frame": 0,
    "slot": 1,
    "password": "12345678"
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Senha GPON configurada com sucesso para interface 0/1",
  "interface": "0/1",
  "password_length": 8
}
```

### 26. POST `/api/v1/olts/{olt_id}/interfaces/optical/thresholds`
**Configura thresholds de alarme óptico**

**Body:**
```json
{
  "frame": 0,
  "slot": 1,
  "port": 0,
  "parameter": "rx-power",
  "limit_type": "lower-limit",
  "value": -28.0
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/interfaces/optical/thresholds" \
  -H "Content-Type: application/json" \
  -d '{
    "frame": 0,
    "slot": 1,
    "port": 0,
    "parameter": "rx-power",
    "limit_type": "lower-limit",
    "value": -28.0
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Threshold rx-power lower-limit configurado com sucesso",
  "interface": "0/1/0",
  "parameter": "rx-power",
  "value": -28.0,
  "unit": "dBm"
}
```

### 27. DELETE `/api/v1/olts/{olt_id}/interfaces/{frame}/{slot}/{port}/optical/thresholds`
**Remove todos os thresholds ópticos**

**Exemplo de Requisição:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/olts/1/interfaces/0/1/0/optical/thresholds"
```

### 28. GET `/api/v1/olts/{olt_id}/configuration`
**Obtém configuração completa da OLT**

**Parâmetros Query:**
- `section` (opcional): Seção específica ("interface", "ont-lineprofile", etc.)
- `save_to_file` (opcional): Salvar para backup (true/false)

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/configuration?section=interface"
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Configuração atual obtida com sucesso",
  "total_lines": 1523,
  "configuration": {
    "version": "V800R018C10",
    "sysname": "OLT-HUAWEI-01",
    "sections": [...],
    "profiles": {...},
    "interfaces": {...}
  },
  "summary": {
    "profiles_count": {
      "dba_profiles": 5,
      "ont_line_profiles": 3,
      "ont_srv_profiles": 2
    },
    "interfaces_count": {
      "gpon": 16,
      "ethernet": 4
    }
  }
}
```

---

## 🌐 VLAN Management

Gerenciamento completo de VLANs.

### 29. POST `/api/v1/olts/{olt_id}/vlans`
**Cria uma VLAN na OLT**

**Body:**
```json
{
  "vlan_id": 100,
  "description": "VLAN para Internet",
  "vlan_type": "smart"
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/vlans" \
  -H "Content-Type: application/json" \
  -d '{
    "vlan_id": 100,
    "description": "VLAN para Internet",
    "vlan_type": "smart"
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "VLAN 100 criada com sucesso",
  "vlan_id": 100,
  "description": "VLAN para Internet",
  "type": "smart"
}
```

### 30. DELETE `/api/v1/olts/{olt_id}/vlans/{vlan_id}`
**Remove uma VLAN da OLT**

**Parâmetros:**
- `olt_id` (int): ID da OLT
- `vlan_id` (int): ID da VLAN (1-4094)

**Exemplo de Requisição:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/olts/1/vlans/100"
```

**Resposta:**
```json
{
  "status": "success",
  "message": "VLAN 100 removida com sucesso",
  "vlan_id": 100
}
```

### 31. POST `/api/v1/olts/{olt_id}/vlans/assign-port`
**Associa uma porta a uma VLAN**

**Body:**
```json
{
  "vlan_id": 100,
  "frame": 0,
  "slot": 10,
  "port": 0
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/vlans/assign-port" \
  -H "Content-Type: application/json" \
  -d '{
    "vlan_id": 100,
    "frame": 0,
    "slot": 10,
    "port": 0
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Porta 0/10/0 associada à VLAN 100 com sucesso",
  "vlan_id": 100,
  "port": "0/10/0"
}
```

---

## 👥 User Management

Gerenciamento de usuários da OLT.

### 32. POST `/api/v1/olts/{olt_id}/users`
**Cria um usuário na OLT**

**Body:**
```json
{
  "username": "operador",
  "password": "senhaSegura123",
  "service_type": "ssh",
  "privilege_level": 10
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operador",
    "password": "senhaSegura123",
    "service_type": "ssh",
    "privilege_level": 10
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Usuário operador criado com sucesso",
  "username": "operador",
  "service_type": "ssh",
  "privilege_level": 10
}
```

### 33. DELETE `/api/v1/olts/{olt_id}/users/{username}`
**Remove um usuário da OLT**

**Exemplo de Requisição:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/olts/1/users/operador"
```

### 34. PUT `/api/v1/olts/{olt_id}/users/{username}/password`
**Altera senha de um usuário**

**Body:**
```json
{
  "new_password": "novaSenhaSegura456"
}
```

**Exemplo de Requisição:**
```bash
curl -X PUT "http://localhost:8000/api/v1/olts/1/users/operador/password" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "novaSenhaSegura456"}'
```

---

## 💾 Backup & Restore

Sistema completo de backup e restore.

### 35. POST `/api/v1/olts/{olt_id}/backup`
**Faz backup da configuração da OLT**

**Body:**
```json
{
  "backup_type": "full",
  "include_passwords": false
}
```

**Tipos de backup disponíveis:**
- `"full"`: Backup completo (padrão)
- `"profiles"`: Apenas perfis (DBA, linha, serviço)
- `"interfaces"`: Apenas interfaces

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/backup" \
  -H "Content-Type: application/json" \
  -d '{
    "backup_type": "full",
    "include_passwords": false
  }'
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Backup full realizado com sucesso",
  "backup_data": {
    "backup_info": {
      "timestamp": "20241201_143022",
      "type": "full",
      "olt_version": "V800R018C10",
      "include_passwords": false
    },
    "configuration": {
      "system": {...},
      "profiles": {...},
      "interfaces": {...},
      "vlans": [...],
      "users": [...]
    }
  },
  "backup_size": 245760,
  "timestamp": "20241201_143022"
}
```

### 36. POST `/api/v1/olts/{olt_id}/restore`
**Restaura configuração da OLT**

**Body:**
```json
{
  "backup_data": {
    "backup_info": {
      "timestamp": "20241201_143022",
      "type": "full"
    },
    "configuration": {...}
  },
  "restore_type": "full"
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "http://localhost:8000/api/v1/olts/1/restore" \
  -H "Content-Type: application/json" \
  -d @backup_file.json
```

**Resposta:**
```json
{
  "status": "success",
  "message": "Restore full realizado com sucesso",
  "restore_results": {
    "profiles": {
      "restored": 8,
      "errors": 0,
      "details": [...]
    },
    "interfaces": {
      "restored": 12,
      "errors": 0,
      "details": [...]
    }
  },
  "backup_timestamp": "20241201_143022"
}
```

---

## 📊 Monitoring

Endpoints para monitoramento e observabilidade.

### 37. GET `/api/v1/olts/{olt_id}/board-info`
**Obtém informações das placas da OLT**

**Parâmetros:**
- `frame_id` (query): ID do frame específico

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/board-info?frame_id=0"
```

**Resposta:**
```json
[
  {
    "board_id": 1,
    "board_type": "H801GICF",
    "status": "Normal",
    "sub_type": "GPON",
    "online": "Present"
  },
  {
    "board_id": 2,
    "board_type": "H801X2CA",
    "status": "Normal", 
    "sub_type": "Uplink",
    "online": "Present"
  }
]
```

### 38. GET `/api/v1/olts/{olt_id}/version`
**Obtém versão da OLT**

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/api/v1/olts/1/version"
```

**Resposta:**
```json
{
  "version": "V800R018C10"
}
```

### 39. GET `/health`
**Health check da API**

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/health"
```

**Resposta:**
```json
{
  "status": "ok",
  "service": "olt-manager-huawei",
  "version": "0.5.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 40. GET `/pool-stats`
**Estatísticas do connection pool SSH**

**Exemplo de Requisição:**
```bash
curl "http://localhost:8000/pool-stats"
```

**Resposta:**
```json
{
  "status": "ok",
  "pools": [
    {
      "host": "192.168.1.100",
      "total_connections": 2,
      "in_use": 1,
      "available": 1,
      "alive": 2,
      "max_size": 3
    }
  ],
  "total_pools": 1
}
```

---

## 🛠️ Códigos de Status

A API utiliza códigos de status HTTP padrão:

- **200 OK**: Sucesso
- **400 Bad Request**: Parâmetros inválidos
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno

## 🔧 Tratamento de Erros

Todas as respostas de erro seguem o padrão:

```json
{
  "message": "Descrição do erro em português",
  "details": {
    "error_code": "OLT_CONNECTION_FAILED",
    "olt_id": 1
  }
}
```

## 📚 Schemas de Dados

### Formato de Porta
```
"frame/slot/port" - ex: "0/1/0"
```

### IDs de ONT
```
ont_id_on_port - ID da ONT na porta específica (0-127)
```

### VLANs
```
vlan_id - ID da VLAN (1-4094)
```

### Usuários
```
Privilege levels: 0-15 (15 = admin completo)
Service types: "ssh", "telnet", "ftp", "web"
```

---

## 💡 Casos de Uso para Frontend

### 1. **Dashboard de Monitoramento**
- Use `/health` e `/pool-stats` para status geral
- Use `/api/v1/olts/{id}/board-info` para status de hardware
- Use `/api/v1/olts/{id}/ports/{port}/state` para status de portas

### 2. **Gerenciamento de ONTs**
- Use `/api/v1/olts/{id}/ports/{port}/onts/all` para listar ONTs
- Use `/api/v1/olts/{id}/onts?serial_number=` para buscar ONT específica
- Use `/api/v1/olts/{id}/ports/{port}/onts/{id}/optical-info` para diagnóstico

### 3. **Provisionamento**
- Use `/api/v1/olts/{id}/onts` POST para provisionar
- Use `/api/v1/olts/{id}/dba-profiles` POST para criar perfis
- Use `/api/v1/olts/{id}/vlans` POST para configurar VLANs

### 4. **Administração**
- Use `/api/v1/olts/{id}/backup` POST para backups automáticos
- Use `/api/v1/olts/{id}/users` para gerenciar usuários
- Use `/api/v1/olts/{id}/configuration` para auditoria

### 5. **Troubleshooting**
- Use `/api/v1/olts/{id}/ports/{port}/onts/{id}/reboot` para resolver problemas
- Use `/api/v1/olts/{id}/ports/{port}/shutdown` e `enable` para reset de portas

---

## 🚀 Performance

- **Connection Pooling**: 80-90% redução no tempo de resposta
- **Parsing Robusto**: Suporte a múltiplas versões de firmware
- **Validação**: Parâmetros validados antes do envio para OLT
- **Logs Estruturados**: Rastreabilidade completa de operações

---

Esta documentação cobre todos os 40 endpoints disponíveis na API do OLT Manager Huawei, fornecendo exemplos práticos para integração com interfaces frontend e automação via botões na interface do usuário.