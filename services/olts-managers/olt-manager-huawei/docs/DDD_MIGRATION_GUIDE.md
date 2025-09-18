# Guia de Migração para Domain-Driven Design

Este documento detalha o processo de migração do OLT Manager Huawei de uma arquitetura monolítica para Domain-Driven Design, incluindo benefícios, mudanças implementadas e guia para desenvolvedores.

## 📋 Resumo da Migração

### **Antes (Arquitetura Monolítica):**
- Todos os comandos em `/commands/` (29 arquivos misturados)
- Todos os schemas em `/schemas/` (25 arquivos misturados)
- Rotas misturadas em arquivo único
- Responsabilidades misturadas

### **Depois (Domain-Driven Design):**
- **3 domínios** bem definidos com responsabilidades claras
- **Comandos organizados** por contexto de negócio
- **Schemas categorizados** por domínio
- **Rotas especializadas** por área funcional
- **API intuitiva** organizada por domínio

## 🔄 Mudanças Implementadas

### **1. Reorganização de Comandos**

#### **Antes:**
```
src/commands/
├── add_ont.py                    # 😕 Misturado
├── get_board_cli.py              # 😕 Misturado
├── manage_vlan.py                # 😕 Misturado
├── reboot_ont.py                 # 😕 Misturado
└── ... (29 arquivos misturados)
```

#### **Depois:**
```
src/commands/
├── base_command.py               # ✅ Interface comum
├── olt/                          # 🏗️ Equipamento
│   ├── get_board_cli.py
│   ├── manage_vlan.py
│   ├── backup_restore.py
│   └── ... (12 comandos OLT)
└── ont/                          # 👥 Clientes
    ├── add_ont.py
    ├── reboot_ont.py
    ├── get_ont_info_*.py
    └── ... (17 comandos ONT)
```

### **2. Reorganização de Schemas**

#### **Antes:**
```
src/schemas/
├── ont.py                        # 😕 Misturado
├── board_info.py                 # 😕 Misturado
├── vlan_request.py               # 😕 Misturado
└── ... (25 arquivos misturados)
```

#### **Depois:**
```
src/schemas/
├── olt/                          # 🏗️ Equipamento
│   ├── board_info.py
│   ├── vlan_request.py
│   ├── port_state.py
│   └── ... (12 schemas OLT)
├── ont/                          # 👥 Clientes
│   ├── ont.py
│   ├── ont_add_request.py
│   ├── ont_optical_info.py
│   └── ... (13 schemas ONT)
└── shared/                       # 📄 Compartilhados
    ├── command_response.py
    ├── service_port.py
    └── mac_address_info.py
```

### **3. Especialização de Rotas**

#### **Antes:**
```
src/
├── main.py                       # 😕 350+ linhas, todas as rotas
```

#### **Depois:**
```
src/
├── main.py                       # ✅ 150 linhas, limpo
└── api/                          # 🌐 Rotas especializadas
    ├── olt_routes.py             # 🏗️ 18 endpoints equipamento
    ├── ont_routes.py             # 👥 22 endpoints clientes
    └── health_routes.py          # 📊 2 endpoints monitoramento
```

### **4. Imports Organizados**

#### **Antes:**
```python
# 😕 Imports confusos e misturados
from ..commands.add_ont import AddOntCommand
from ..commands.get_board_cli import GetBoardCliCommand
from ..commands.manage_vlan import CreateVlanCommand
```

#### **Depois:**
```python
# ✅ Imports organizados por domínio
# ONT Domain (Customer Management)
from ..commands.ont.add_ont import AddOntCommand
from ..commands.ont.reboot_ont import RebootOntCommand

# OLT Domain (Equipment Management)
from ..commands.olt.get_board_cli import GetBoardCliCommand
from ..commands.olt.manage_vlan import CreateVlanCommand
```

## 🎯 Benefícios Alcançados

### **1. Clareza de Responsabilidades**
- **Antes**: Desenvolvedores precisavam navegar por 29 comandos misturados
- **Depois**: Cada domínio tem contexto claro e bem definido

### **2. Manutenibilidade**
- **Antes**: Mudanças em ONT poderiam afetar funcionalidades de OLT
- **Depois**: Domínios isolados, mudanças localizadas

### **3. Desenvolvimento em Equipe**
- **Antes**: Conflitos frequentes em arquivos grandes
- **Depois**: Equipes podem trabalhar em domínios específicos

### **4. APIs Intuitivas**
- **Antes**: Endpoints misturados em ordem aleatória
- **Depois**: APIs organizadas por área funcional

### **5. Testabilidade**
- **Antes**: Testes misturados sem contexto claro
- **Depois**: Testes organizados por domínio de negócio

## 🔧 Guia para Desenvolvedores

### **Como Encontrar Funcionalidades**

#### **Funcionalidades de Equipamento (OLT):**
```bash
# Comandos relacionados ao equipamento OLT
src/commands/olt/
├── get_board_cli.py              # Informações de hardware
├── manage_vlan.py                # Gestão de VLANs
├── manage_users.py               # Usuários administrativos
├── backup_restore.py             # Backup/restore
└── set_*.py                      # Configurações avançadas

# Schemas relacionados ao equipamento
src/schemas/olt/
├── board_info.py                 # Informações de placas
├── vlan_request.py               # Requisições de VLAN
└── user_request.py               # Gestão de usuários

# API de equipamento
src/api/olt_routes.py             # 18 endpoints organizados
```

#### **Funcionalidades de Clientes (ONT):**
```bash
# Comandos relacionados a clientes
src/commands/ont/
├── add_ont.py                    # Provisionamento
├── get_ont_info_*.py             # Informações de ONT
├── get_ont_optical_info_*.py     # Dados ópticos
└── ont_confirm.py                # Confirmação autofind

# Schemas relacionados a clientes
src/schemas/ont/
├── ont.py                        # Dados da ONT
├── ont_add_request.py            # Provisionamento
└── ont_optical_info.py           # Informações ópticas

# API de clientes
src/api/ont_routes.py             # 22 endpoints organizados
```

### **Como Adicionar Novas Funcionalidades**

#### **1. Para Equipamento (OLT):**
```python
# 1. Criar comando em src/commands/olt/
class NewOltFeatureCommand(OLTCommand):
    def execute(self, connection_manager, olt_version: str, **kwargs):
        # Implementação específica do equipamento
        pass

# 2. Criar schema em src/schemas/olt/
class NewOltFeatureRequest(BaseModel):
    # Definir campos específicos do equipamento
    pass

# 3. Adicionar endpoint em src/api/olt_routes.py
@router.post("/olts/{olt_id}/new-feature")
def new_olt_feature(olt_id: int, request: NewOltFeatureRequest):
    # Implementação do endpoint
    pass
```

#### **2. Para Clientes (ONT):**
```python
# 1. Criar comando em src/commands/ont/
class NewOntFeatureCommand(OLTCommand):
    def execute(self, connection_manager, olt_version: str, **kwargs):
        # Implementação específica do cliente
        pass

# 2. Criar schema em src/schemas/ont/
class NewOntFeatureRequest(BaseModel):
    # Definir campos específicos do cliente
    pass

# 3. Adicionar endpoint em src/api/ont_routes.py
@router.post("/olts/{olt_id}/onts/{ont_id}/new-feature")
def new_ont_feature(olt_id: int, ont_id: int, request: NewOntFeatureRequest):
    # Implementação do endpoint
    pass
```

### **Padrões de Nomenclatura**

#### **Comandos:**
- **OLT**: `get_board_cli.py`, `manage_vlan.py`, `set_gpon_password.py`
- **ONT**: `add_ont.py`, `get_ont_info_snmp.py`, `reboot_ont.py`

#### **Schemas:**
- **OLT**: `board_info.py`, `vlan_request.py`, `olt_version.py`
- **ONT**: `ont.py`, `ont_add_request.py`, `ont_optical_info.py`

#### **Endpoints:**
- **OLT**: `/api/v1/olts/{olt_id}/ports/{port}/...`
- **ONT**: `/api/v1/olts/{olt_id}/ports/{port}/onts/{ont_id}/...`

## 📊 Estatísticas da Migração

### **Arquivos Reorganizados:**
- **29 comandos** movidos para domínios específicos
- **25 schemas** categorizados por contexto
- **1 arquivo** de rotas dividido em 3 especializados
- **40+ endpoints** organizados por domínio

### **Estrutura de Código:**
- **Antes**: 1 diretório `/commands/` com 29 arquivos
- **Depois**: 2 diretórios especializados (`/olt/`, `/ont/`) + base comum

### **Linhas de Código:**
- **main.py**: Reduzido de 350+ para 150 linhas
- **Imports**: Organizados por domínio com comentários claros
- **Documentação**: Atualizada para refletir nova arquitetura

## 🧪 Impacto nos Testes

### **Organização de Testes:**
```bash
tests/
├── integration/                  # Testes de integração por domínio
│   ├── test_olt_domain.py        # Testes de equipamento
│   ├── test_ont_domain.py        # Testes de clientes
│   └── test_health_domain.py     # Testes de monitoramento
├── unit/                         # Testes unitários
│   ├── olt/                      # Comandos de equipamento
│   ├── ont/                      # Comandos de clientes
│   └── core/                     # Infraestrutura
└── utils/                        # Utilitários de teste
```

### **Estratégia de Testes:**
- **Testes por Domínio**: Contexto específico e focado
- **Testes de Integração**: Verificação de colaboração entre domínios
- **Mocks Específicos**: Simulação de comportamento por contexto

## 🚀 Próximos Passos

### **Fase 2 - Melhorias Planejadas:**
1. **Testes Automatizados**: Implementar testes por domínio
2. **Métricas Específicas**: Monitoramento por contexto
3. **Cache Inteligente**: Cache especializado por domínio
4. **Documentação Interativa**: API docs com separação por domínio

### **Fase 3 - Evolução Futura:**
1. **Event Sourcing**: Auditoria de eventos por domínio
2. **CQRS**: Separação de commands e queries
3. **Microsserviços**: Possível separação em serviços independentes

## 🎉 Conclusão

A migração para Domain-Driven Design transformou o OLT Manager Huawei em um sistema mais:

- **🏗️ Organizando**: Código estruturado por contexto de negócio
- **🔧 Manutenível**: Mudanças localizadas e impacto controlado
- **👥 Colaborativo**: Desenvolvimento em equipe mais eficiente
- **📈 Escalável**: Base sólida para crescimento futuro
- **🎯 Focado**: APIs intuitivas organizadas por domínio

Esta base permite evolução contínua mantendo qualidade e alinhamento com necessidades de negócio das operadoras de telecomunicações.