# OLT Manager - Huawei

Serviço FastAPI para gerenciamento completo de OLTs (Optical Line Terminal) da Huawei. Suporta operações via CLI SSH e SNMP, com arquitetura robusta e otimizada para produção.

## ✨ Recursos Principais

- **40 endpoints REST** para gerenciamento completo de OLTs
- **Connection pooling SSH** para performance otimizada (80-90% melhoria)
- **Parsing robusto** com suporte a múltiplas versões de firmware
- **Trap listener SNMP** para eventos em tempo real
- **Publicação RabbitMQ** com retry automático
- **Logging centralizado** e estruturado
- **Validação de dados** robusta
- **Suporte a múltiplos modelos** (MA5600T, MA5800)
- **Configuração avançada** (GPON password, thresholds ópticos)
- **Gerenciamento de VLANs** completo
- **Gerenciamento de usuários** da OLT
- **Backup e restore** de configuração

## 🎨 Arquitetura

```
FastAPI App
│
├── Connection Pool Manager (SSH)
│   ├── Pool por OLT (max 3 conexões)
│   ├── Health checks automáticos
│   └── Cleanup de conexões idle
│
├── Robust Parser
│   ├── Múltiplas regras por comando
│   ├── Fallback automático
│   └── Suporte a diferentes firmwares
│
├── SNMP Manager
│   ├── OIDs por modelo/versão
│   ├── Conversores robustos
│   └── Validação de ranges
│
└── Trap Listener
    ├── OIDs configuráveis
    ├── Detecção de modelo
    └── Retry RabbitMQ
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

## 📁 Estrutura do Projeto

```
src/
├── core/                    # Módulos fundamentais
│   ├── config.py            # Configurações centralizadas
│   ├── logging.py           # Sistema de logging
│   ├── exceptions.py        # Exceções customizadas
│   ├── validators.py        # Validações de entrada
│   ├── parsers.py           # Parsing robusto CLI/SNMP
│   ├── oid_mappings.py      # Mapeamento de OIDs SNMP
│   └── trap_oids.py         # Configuração de traps
│
├── services/               # Camada de serviços
│   ├── olt_service.py       # Lógica de negócio principal
│   ├── connection_manager.py # Gerenciador de conexão SSH
│   └── connection_pool.py   # Pool de conexões otimizado
│
├── commands/               # Comandos CLI e SNMP
│   ├── get_*_cli.py         # Comandos CLI padronizados
│   ├── get_*_snmp.py        # Comandos SNMP padronizados
│   └── base_command.py      # Classe base para comandos
│
├── schemas/                # Modelos Pydantic
│   └── *.py                 # Schemas de request/response
│
├── trap_listener/          # Listener de traps SNMP
│   └── listener.py          # Processamento de traps
│
├── main.py                 # Aplicação FastAPI
└── rabbitmq_publisher.py   # Publicador RabbitMQ
```

## 📚 Endpoints da API (40 endpoints)

### Port Management (4 endpoints)
- `POST /api/v1/olts/{olt_id}/ports/{port}/shutdown` - Desligar porta PON
- `POST /api/v1/olts/{olt_id}/ports/{port}/enable` - Ligar porta PON
- `GET /api/v1/olts/{olt_id}/ports/{port}/state` - Estado da porta PON
- `PUT /api/v1/olts/{olt_id}/ports/{port}/mode` - Modo da porta PON

### ONT Management (16 endpoints)
- `GET /api/v1/olts/{olt_id}/onts?serial_number=` - Info por SN
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/all` - Todas ONTs na porta
- `POST /api/v1/olts/{olt_id}/onts` - Provisionar ONT
- `POST /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/reboot` - Reboot ONT
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/optical-info` - Info óptica
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/traffic` - Tráfego
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/port-states` - Estados das portas
- `GET /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/mac-addresses` - MACs aprendidos
- `GET /api/v1/olts/{olt_id}/ports/{port}/autofind-onts` - ONTs em auto-find
- `POST /api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/confirm` - Confirmar ONT
- E mais 6 endpoints para atributos, estatísticas, etc.

### Profiles (4 endpoints)
- `POST /api/v1/olts/{olt_id}/dba-profiles` - Criar perfil DBA
- `POST /api/v1/olts/{olt_id}/ont-line-profiles` - Criar perfil de linha
- `POST /api/v1/olts/{olt_id}/ont-srv-profiles` - Criar perfil de serviço
- `POST /api/v1/olts/{olt_id}/gpon-alarm-profiles` - Criar perfil de alarme

### Advanced Configuration (4 endpoints) 🆕
- `POST /api/v1/olts/{olt_id}/interfaces/gpon/password` - Configurar senha GPON
- `POST /api/v1/olts/{olt_id}/interfaces/optical/thresholds` - Configurar thresholds ópticos
- `DELETE /api/v1/olts/{olt_id}/interfaces/{frame}/{slot}/{port}/optical/thresholds` - Remover thresholds
- `GET /api/v1/olts/{olt_id}/configuration` - Obter configuração completa

### VLAN Management (3 endpoints) 🆕
- `POST /api/v1/olts/{olt_id}/vlans` - Criar VLAN
- `DELETE /api/v1/olts/{olt_id}/vlans/{vlan_id}` - Remover VLAN
- `POST /api/v1/olts/{olt_id}/vlans/assign-port` - Associar porta à VLAN

### User Management (3 endpoints) 🆕
- `POST /api/v1/olts/{olt_id}/users` - Criar usuário
- `DELETE /api/v1/olts/{olt_id}/users/{username}` - Remover usuário
- `PUT /api/v1/olts/{olt_id}/users/{username}/password` - Alterar senha

### Backup & Restore (2 endpoints) 🆕
- `POST /api/v1/olts/{olt_id}/backup` - Fazer backup da configuração
- `POST /api/v1/olts/{olt_id}/restore` - Restaurar configuração

### Monitoring (4 endpoints)
- `GET /api/v1/olts/{olt_id}/board-info` - Info das placas
- `GET /api/v1/olts/{olt_id}/version` - Versão da OLT
- `GET /health` - Health check
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

⚙️ **Desenvolvido para produção** com foco em performance, confiabilidade e manutenibilidade.
