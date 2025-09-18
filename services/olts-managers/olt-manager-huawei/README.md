# OLT Manager - Huawei

Microsserviço FastAPI para gerenciamento completo de OLTs (Optical Line Terminal) da Huawei. Arquitetura baseada em **Domain-Driven Design (DDD)** com separação clara entre gestão de equipamentos (OLT) e clientes (ONT). Suporta operações via CLI SSH e SNMP, otimizado para produção.

## ✨ Recursos Principais

### 🏗️ **Arquitetura DDD**
- **Separação de domínios** clara entre OLT (equipamento) e ONT (clientes)
- **40+ endpoints REST** organizados por domínio e funcionalidade
- **Rotas especializadas** por área de responsabilidade

### ⚡ **Performance & Escalabilidade**
- **Connection pooling SSH** otimizado (80-90% melhoria de performance)
- **Parsing robusto** com suporte a múltiplas versões de firmware
- **SNMP operations** para consultas rápidas de dados

### 📡 **Eventos em Tempo Real**
- **Trap listener SNMP** para eventos de ONTs
- **Publicação RabbitMQ** com retry automático
- **Notificações automáticas** de mudanças de estado

### 🔧 **Gestão Completa**
- **Provisionamento automatizado** de ONTs
- **Configuração avançada** (GPON password, thresholds ópticos)
- **Gerenciamento de VLANs** e service-ports
- **Gestão de usuários** administrativos
- **Backup e restore** de configurações

### 🛡️ **Confiabilidade**
- **Logging centralizado** e estruturado
- **Validação robusta** de dados de entrada
- **Suporte a múltiplos modelos** (MA5600T, MA5800)
- **Health checks** e monitoramento integrado

## 🎨 Arquitetura Domain-Driven Design

```
FastAPI App (Domain-Separated Architecture)
│
├── 🏗️ OLT Domain (Equipment Management)
│   ├── /api/v1/olts/* - Equipment endpoints
│   ├── commands/olt/ - Equipment commands
│   ├── schemas/olt/ - Equipment data models
│   └── Features:
│       ├── Port management (PON ports)
│       ├── VLAN configuration
│       ├── User administration
│       ├── Backup & restore
│       └── Hardware monitoring
│
├── 👥 ONT Domain (Customer Management)
│   ├── /api/v1/olts/*/onts/* - Customer endpoints
│   ├── commands/ont/ - Customer commands
│   ├── schemas/ont/ - Customer data models
│   └── Features:
│       ├── ONT provisioning
│       ├── Autofind & confirmation
│       ├── Optical monitoring
│       ├── Traffic statistics
│       └── Service-port management
│
├── 📊 Health Domain (Monitoring)
│   ├── /health - Service health checks
│   ├── /pool-stats - Connection statistics
│   └── System monitoring
│
├── 🔧 Infrastructure Layer
│   ├── Connection Pool Manager (SSH)
│   │   ├── Pool por OLT (max 3 conexões)
│   │   ├── Health checks automáticos
│   │   └── Cleanup de conexões idle
│   │
│   ├── Robust Parser Engine
│   │   ├── Multiple rules per command
│   │   ├── Automatic fallback
│   │   └── Multi-firmware support
│   │
│   ├── SNMP Manager
│   │   ├── OIDs por modelo/versão
│   │   ├── Robust converters
│   │   └── Range validation
│   │
│   └── Event Processing
│       ├── SNMP Trap Listener
│       ├── RabbitMQ Publisher
│       └── Real-time notifications
```

## 🚀 Instalação e Configuração

### Dependências

```bash
pip install -r requirements.txt
```

### Configuração

Crie o arquivo `olt_config.yaml` com suas OLTs:

```yaml
olts:
  - id: 1
    host: 192.168.1.100
    username: admin
    password: admin123
    snmp_community: public
  - id: 2
    host: 192.168.1.101
    username: admin
    password: admin123
    snmp_community: private
```

### Variáveis de Ambiente

```bash
# Backend API
BACKEND_API_URL=http://backend-api:8000

# SNMP Trap Listener
TRAP_LISTENER_HOST=0.0.0.0
TRAP_LISTENER_PORT=162
SNMP_COMMUNITY=public

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672

# Connection Pool SSH
SSH_POOL_MAX_SIZE=3
SSH_POOL_IDLE_TIMEOUT=300
SSH_POOL_CONNECTION_TIMEOUT=30

# Debug
NETMIKO_SESSION_LOG=false
```

## 📁 Estrutura do Projeto (Domain-Driven Design)

```
src/
├── 🔧 core/                    # Infraestrutura compartilhada
│   ├── config.py            # Configurações centralizadas
│   ├── logging.py           # Sistema de logging
│   ├── exceptions.py        # Exceções customizadas
│   ├── validators.py        # Validações de entrada
│   ├── parsers.py           # Parsing robusto CLI/SNMP
│   ├── oid_mappings.py      # Mapeamento de OIDs SNMP
│   └── trap_oids.py         # Configuração de traps
│
├── 🌐 api/                     # Camada de apresentação (por domínio)
│   ├── olt_routes.py        # 🏗️ Endpoints de gestão de equipamentos
│   ├── ont_routes.py        # 👥 Endpoints de gestão de clientes
│   └── health_routes.py     # 📊 Endpoints de monitoramento
│
├── 💼 services/               # Camada de aplicação
│   ├── olt_service.py       # Lógica de negócio principal
│   ├── connection_manager.py # Gerenciador de conexão SSH
│   └── connection_pool.py   # Pool de conexões otimizado
│
├── 📦 commands/               # Comandos organizados por domínio
│   ├── base_command.py      # Interface base para comandos
│   ├── olt/                 # 🏗️ Comandos de equipamento
│   │   ├── get_board_cli.py
│   │   ├── manage_vlan.py
│   │   ├── backup_restore.py
│   │   └── ... (12 comandos OLT)
│   └── ont/                 # 👥 Comandos de clientes
│       ├── add_ont.py
│       ├── get_ont_info_*.py
│       ├── ont_confirm.py
│       └── ... (17 comandos ONT)
│
├── 📋 schemas/               # Modelos de dados por domínio
│   ├── olt/                 # 🏗️ Schemas de equipamento
│   │   ├── board_info.py
│   │   ├── port_state.py
│   │   ├── vlan_request.py
│   │   └── ... (12 schemas OLT)
│   ├── ont/                 # 👥 Schemas de clientes
│   │   ├── ont.py
│   │   ├── ont_add_request.py
│   │   ├── ont_optical_info.py
│   │   └── ... (13 schemas ONT)
│   └── 📄 shared/            # Schemas compartilhados
│       ├── command_response.py
│       ├── service_port.py
│       └── mac_address_info.py
│
├── 📡 trap_listener/          # Processamento de eventos
│   └── listener.py          # Listener de traps SNMP
│
├── 🧪 tests/                  # Testes organizados
│   ├── integration/         # Testes de integração
│   └── utils/              # Utilitários de teste
│
├── 📜 scripts/               # Scripts de utilidade
│   └── update_class_names.py
│
├── main.py                 # 🚀 Aplicação FastAPI principal
└── rabbitmq_publisher.py   # Publicador de eventos
```

## 📚 API Endpoints Organizados por Domínio (40+ endpoints)

### 🏗️ **OLT Domain - Equipment Management**

#### **Port Management** (4 endpoints)
- `POST /api/v1/olts/{olt_id}/ports/{port}/shutdown` - Desligar porta PON
- `POST /api/v1/olts/{olt_id}/ports/{port}/enable` - Ligar porta PON
- `GET /api/v1/olts/{olt_id}/ports/{port}/state` - Estado da porta PON
- `PUT /api/v1/olts/{olt_id}/ports/{port}/mode` - Configurar modo da porta

#### **Hardware Monitoring** (3 endpoints)
- `GET /api/v1/olts/{olt_id}/board-info` - Informações das placas
- `GET /api/v1/olts/{olt_id}/version` - Versão da OLT
- `GET /api/v1/olts/{olt_id}/configuration` - Configuração completa

#### **Profile Management** (2 endpoints)
- `POST /api/v1/olts/{olt_id}/dba-profiles` - Criar perfil DBA
- `POST /api/v1/olts/{olt_id}/gpon-alarm-profiles` - Criar perfil de alarme GPON

#### **Advanced Configuration** (3 endpoints)
- `POST /api/v1/olts/{olt_id}/interfaces/gpon/password` - Configurar senha GPON
- `POST /api/v1/olts/{olt_id}/interfaces/optical/thresholds` - Configurar thresholds ópticos
- `DELETE /api/v1/olts/{olt_id}/interfaces/{frame}/{slot}/{port}/optical/thresholds` - Remover thresholds

#### **VLAN Management** (3 endpoints)
- `POST /api/v1/olts/{olt_id}/vlans` - Criar VLAN
- `DELETE /api/v1/olts/{olt_id}/vlans/{vlan_id}` - Remover VLAN
- `POST /api/v1/olts/{olt_id}/vlans/assign-port` - Associar porta à VLAN

#### **User Management** (3 endpoints)
- `POST /api/v1/olts/{olt_id}/users` - Criar usuário administrativo
- `DELETE /api/v1/olts/{olt_id}/users/{username}` - Remover usuário
- `PUT /api/v1/olts/{olt_id}/users/{username}/password` - Alterar senha

#### **Backup & Restore** (2 endpoints)
- `POST /api/v1/olts/{olt_id}/backup` - Backup da configuração
- `POST /api/v1/olts/{olt_id}/restore` - Restaurar configuração

---

### 👥 **ONT Domain - Customer Management**

#### **ONT Information** (3 endpoints)
- `GET /api/v1/olts/{olt_id}/onts?serial_number=` - Buscar ONT por serial
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/all` - Todas ONTs na porta
- `GET /api/v1/olts/{olt_id}/ports/{port}/register-info` - Info de registro

#### **ONT Operations** (2 endpoints)
- `POST /api/v1/olts/{olt_id}/onts` - Provisionar nova ONT
- `POST /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/reboot` - Reiniciar ONT

#### **Monitoring & Diagnostics** (5 endpoints)
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/optical-info` - Informações ópticas
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/traffic` - Estatísticas de tráfego
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/port-states` - Estados das portas
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/eth-ports/{eth_port}/attributes` - Atributos ethernet
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/eth-ports/{eth_port}/statistics` - Estatísticas ethernet

#### **Auto-Discovery** (3 endpoints)
- `GET /api/v1/olts/{olt_id}/autofind-onts` - ONTs descobertas automaticamente
- `GET /api/v1/olts/{olt_id}/ports/{port}/autofind` - Autofind em porta específica
- `POST /api/v1/olts/{olt_id}/onts/confirm` - Confirmar ONT autofind

#### **Advanced Features** (4 endpoints)
- `GET /api/v1/olts/{olt_id}/ports/{port}/failed-onts` - ONTs com falha
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/service-ports` - Service-ports da ONT
- `POST /api/v1/olts/{olt_id}/service-ports` - Adicionar service-port
- `GET /api/v1/olts/{olt_id}/ports/{port}/mac-addresses` - Endereços MAC aprendidos

#### **Profile Management** (2 endpoints)
- `POST /api/v1/olts/{olt_id}/ont-line-profiles` - Criar perfil de linha ONT
- `POST /api/v1/olts/{olt_id}/ont-srv-profiles` - Criar perfil de serviço ONT

---

### 📊 **Health Domain - System Monitoring**

#### **Service Health** (2 endpoints)
- `GET /health` - Health check do serviço
- `GET /pool-stats` - Estatísticas do connection pool

## 🔍 Uso

### Executar o Serviço

```bash
# Desenvolvimento
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Produção
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Exemplo de Uso

```python
import requests

# Obter info de uma ONT por serial number
response = requests.get(
    "http://localhost:8000/api/v1/olts/1/onts?serial_number=HWTC12345678"
)
ont_info = response.json()

# Reboot de uma ONT
response = requests.post(
    "http://localhost:8000/api/v1/olts/1/ports/0/1/0/onts/1/reboot"
)
result = response.json()
```

## 📊 Monitoramento

### Logs

O serviço gera logs estruturados em diferentes níveis:

```python
# Exemplos de logs
[INFO] Conectado com sucesso ao RabbitMQ
[DEBUG] Reutilizando conexão existente para 192.168.1.100
[WARNING] Parsing fallback usado para comando display_board
[ERROR] Falha na conexão SSH para 192.168.1.101: Connection timeout
```

### Métricas do Connection Pool

```bash
# Verificar estatísticas do pool
curl http://localhost:8000/pool-stats

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

## ⚙️ Configurações Avançadas

### Modelos Suportados

- **MA5600T Series**: MA5603T, MA5608T, MA5680T, MA5683T
- **MA5800 Series**: MA5800-X2, MA5800-X7, MA5800-X15, MA5800-X17

### Versões de Firmware

- **V800R008C02** a **V800R019C10** (MA5600T)
- **V100R016C00** a **V100R024C00** (MA5800)

### Personalização de OIDs

```python
# Adicionar suporte a novo modelo
from src.core.oid_mappings import oid_manager
from src.core.oid_mappings import OIDMapping

# Configurar OIDs específicos para um modelo
oid_manager.add_oid_mapping(
    model="MA5900",
    category="ont_optical",
    metric="rx_power",
    mapping=OIDMapping(
        oid_base="1.3.6.1.4.1.2011.6.128.1.2.2.51.1.4",
        scaling_factor=1000.0,
        unit="dBm"
    )
)
```

## 🛠️ Troubleshooting

### Connection Pool

```bash
# Problema: Muitas conexões em uso
# Solução: Aumentar SSH_POOL_MAX_SIZE
export SSH_POOL_MAX_SIZE=5

# Problema: Conexões ficando idle muito tempo
# Solução: Diminuir SSH_POOL_IDLE_TIMEOUT
export SSH_POOL_IDLE_TIMEOUT=180
```

### Parsing

```bash
# Problema: Comando falhando em nova versão firmware
# Solução: Adicionar nova regra de parsing em parsers.py
```

### SNMP

```bash
# Problema: Valores ópticos incorretos
# Solução: Verificar scaling_factor em oid_mappings.py
```

## 📝 Logs e Debugging

```bash
# Habilitar logs de sessão Netmiko
export NETMIKO_SESSION_LOG=true

# Verificar logs do serviço
tail -f logs/olt-manager.log

# Debug de conexões SSH
curl http://localhost:8000/pool-stats
```

## 🔄 Integração

### RabbitMQ Events

O serviço publica eventos no exchange `olt_events`:

```json
// Mudança de estado ONT
{
  "event_type": "ont.state.change",
  "olt_ip": "192.168.1.100",
  "port": "0/1/0",
  "serial_number": "HWTC12345678",
  "status": "online"
}

// Alarme ONT
{
  "event_type": "ont.alarm",
  "olt_ip": "192.168.1.100",
  "port": "0/1/0",
  "alarm_id": "1",
  "alarm_status": "active"
}
```

### Backend Integration

O serviço busca credenciais do backend-api automaticamente:

```http
GET /api/v1/olts/{olt_id}/credentials
```

## 💬 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do serviço
2. Consulte a documentação de comandos em `docs/Document_comands.md`
3. Verifique configurações de rede e credenciais
4. Consulte estatísticas do connection pool

---

⚙️ **Desenvolvido para produção** com arquitetura **Domain-Driven Design**, focando em separação clara de responsabilidades, performance otimizada e manutenibilidade de código.

## 🏛️ Arquitetura Domain-Driven Design

### **Benefícios da Separação de Domínios:**

1. **🔒 Responsabilidades Claras**: Cada domínio tem responsabilidades bem definidas
2. **🚀 Evolução Independente**: Domínios podem evoluir sem afetar outros
3. **👥 Desenvolvimento em Equipe**: Diferentes desenvolvedores podem trabalhar em domínios específicos
4. **🧪 Testes Focados**: Testes organizados por contexto de negócio
5. **📖 Documentação Intuitiva**: API organizada por área funcional

### **Domínios Implementados:**

- **🏗️ OLT Domain**: Gestão de hardware, configurações de rede, administração
- **👥 ONT Domain**: Provisioning de clientes, monitoramento, diagnósticos
- **📊 Health Domain**: Monitoramento de sistema, métricas, health checks

Esta arquitetura garante que o microsserviço seja escalável, manutenível e alinhado com as necessidades de negócio de operadoras de telecomunicações.
