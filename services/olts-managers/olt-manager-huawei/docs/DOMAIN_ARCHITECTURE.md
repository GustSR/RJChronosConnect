# Arquitetura de Domínios - OLT Manager Huawei

Este documento descreve a implementação da arquitetura **Domain-Driven Design (DDD)** no microsserviço OLT Manager Huawei, explicando a organização por domínios, separação de responsabilidades e benefícios da abordagem adotada.

## 📋 Visão Geral

O OLT Manager Huawei foi refatorado para seguir os princípios de Domain-Driven Design, organizando o código em domínios bem definidos que refletem as áreas de negócio das operadoras de telecomunicações.

### **Domínios Identificados:**

1. **🏗️ OLT Domain** - Gestão de Equipamentos
2. **👥 ONT Domain** - Gestão de Clientes
3. **📊 Health Domain** - Monitoramento de Sistema

## 🏗️ OLT Domain - Equipment Management

### **Responsabilidades:**
- Gestão de hardware da OLT
- Configuração de portas PON
- Administração de VLANs
- Gerenciamento de usuários administrativos
- Backup e restore de configurações
- Configurações avançadas (GPON password, thresholds ópticos)

### **Estrutura:**
```
src/
├── api/olt_routes.py              # 18 endpoints de equipamento
├── commands/olts/                 # Comandos organizados por protocolo
│   ├── snmp/
│   │   ├── get_olt_snmp_info.py
│   │   └── snmp_walk.py
│   └── ssh/
│       ├── add_dba_profile.py
│       ├── add_gpon_alarm_profile.py
│       ├── backup_restore.py
│       ├── get_board_cli.py
│       ├── get_current_configuration_cli.py
│       ├── get_port_state_cli.py
│       ├── manage_users.py
│       ├── manage_vlan.py
│       ├── set_gpon_password.py
│       ├── set_laser_state.py
│       ├── set_optical_threshold.py
│       └── set_port_mode.py
└── schemas/olt/                   # 12 schemas de dados
    ├── backup_request.py
    ├── board_info.py
    ├── dba_profile_add_request.py
    ├── gpon_alarm_profile_add_request.py
    ├── gpon_password_request.py
    ├── laser_state_set_request.py
    ├── olt_version.py
    ├── optical_threshold_request.py
    ├── port_mode_set_request.py
    ├── port_state.py
    ├── user_request.py
    └── vlan_request.py
```

### **Endpoints Principais:**
- **Port Management**: Controle de portas PON (shutdown, enable, state, mode)
- **Hardware Monitoring**: Informações de placas, versão, configuração
- **VLAN Management**: Criação, remoção e associação de VLANs
- **User Management**: Gestão de usuários administrativos
- **Backup & Restore**: Backup e restauração de configurações
- **Advanced Config**: Senhas GPON, thresholds ópticos

## 👥 ONT Domain - Customer Management

### **Responsabilidades:**
- Provisionamento de ONTs/ONUs
- Monitoramento de clientes
- Descoberta automática (autofind)
- Diagnósticos de performance
- Gestão de service-ports
- Coleta de estatísticas de tráfego

### **Estrutura:**
```
src/
├── api/ont_routes.py              # 22 endpoints de clientes
├── commands/onts/                 # Comandos organizados por protocolo
│   ├── snmp/
│   │   ├── get_ont_autofind_snmp.py
│   │   ├── get_ont_eth_stats_snmp.py
│   │   ├── get_ont_info_snmp.py
│   │   ├── get_ont_optical_info_snmp.py
│   │   ├── get_ont_port_attribute_snmp.py
│   │   ├── get_ont_port_state_snmp.py
│   │   ├── get_ont_register_info_snmp.py
│   │   └── get_ont_traffic_snmp.py
│   └── ssh/
│       ├── add_ont.py
│       ├── add_ont_line_profile.py
│       ├── add_ont_srv_profile.py
│       ├── add_service_port.py
│       ├── get_all_autofind_onts.py
│       ├── get_mac_address_cli.py
│       ├── get_ont_autofind_cli.py
│       ├── get_ont_eth_stats_cli.py
│       ├── get_ont_failed_cli.py
│       ├── get_ont_info_cli.py
│       ├── get_ont_port_attribute_cli.py
│       ├── get_ont_register_info_cli.py
│       ├── get_ont_traffic_cli.py
│       ├── get_service_port_cli.py
│       ├── ont_confirm.py
│       ├── pon_port_control.py
│       └── reboot_ont.py
└── schemas/ont/                   # 13 schemas de dados
    ├── ont.py
    ├── ont_add_request.py
    ├── ont_autofind_info.py
    ├── ont_confirm_request.py
    ├── ont_eth_stats.py
    ├── ont_failed.py
    ├── ont_line_profile_add_request.py
    ├── ont_optical_info.py
    ├── ont_port_attribute.py
    ├── ont_port_state.py
    ├── ont_register_info.py
    ├── ont_srv_profile_add_request.py
    ├── ont_summary.py
    └── ont_traffic.py
```

### **Endpoints Principais:**
- **ONT Information**: Busca por serial, listagem, informações de registro
- **ONT Operations**: Provisionamento, reboot
- **Monitoring**: Informações ópticas, tráfego, estados das portas
- **Auto-Discovery**: Autofind, confirmação de ONTs
- **Advanced Features**: Service-ports, MACs aprendidos, ONTs com falha
- **Profile Management**: Perfis de linha e serviço

## 📊 Health Domain - System Monitoring

### **Responsabilidades:**
- Health checks do serviço
- Monitoramento de performance
- Estatísticas de connection pool
- Métricas de sistema

### **Estrutura:**
```
src/
├── api/health_routes.py           # 2 endpoints de monitoramento
└── services/connection_pool.py    # Estatísticas do pool
```

### **Endpoints:**
- `GET /health` - Status do serviço
- `GET /pool-stats` - Estatísticas de conexões SSH

## 🔧 Infraestrutura Compartilhada

### **Core Components:**
```
src/
├── core/                          # Componentes fundamentais
│   ├── config.py                  # Configurações
│   ├── logging.py                 # Sistema de logs
│   ├── exceptions.py              # Exceções customizadas
│   ├── validators.py              # Validações
│   ├── parsers.py                 # Parsing CLI/SNMP
│   ├── oid_mappings.py            # Mapeamento SNMP
│   └── trap_oids.py               # Configuração de traps
├── services/                      # Camada de aplicação
│   ├── olt_service.py             # Orquestração de comandos
│   ├── connection_manager.py      # Gestão de conexões SSH
│   └── connection_pool.py         # Pool de conexões
├── commands/base_command.py       # Interface base para comandos
├── schemas/                       # Schemas compartilhados
│   ├── command_response.py
│   ├── service_port.py
│   ├── mac_address_info.py
│   └── service_port_add_request.py
└── trap_listener/                 # Processamento de eventos
    └── listener.py
```

## 🚀 Benefícios da Arquitetura DDD

### **1. Separação de Responsabilidades**
- **Clareza**: Cada domínio tem responsabilidades bem definidas
- **Manutenibilidade**: Mudanças em um domínio não afetam outros
- **Testabilidade**: Testes organizados por contexto de negócio

### **2. Escalabilidade**
- **Evolução Independente**: Domínios podem evoluir separadamente
- **Desenvolvimento Paralelo**: Diferentes equipes podem trabalhar em domínios específicos
- **Deploy Independente**: Possibilidade futura de separar em microsserviços

### **3. Alinhamento com Negócio**
- **Linguagem Ubíqua**: Código reflete terminologia do negócio
- **Gestão vs Clientes**: Separação clara entre gestão de equipamentos e clientes
- **APIs Intuitivas**: Endpoints organizados por área funcional

### **4. Flexibilidade Técnica**
- **Tecnologias Específicas**: Cada domínio pode usar tecnologias mais adequadas
- **Otimizações Focadas**: Performance otimizada por contexto
- **Refatoração Segura**: Mudanças isoladas reduzem riscos

## 📊 Métricas da Implementação

### **Distribuição por Domínio:**
- **OLT Domain**: 18 endpoints, 12 comandos, 12 schemas
- **ONT Domain**: 22 endpoints, 17 comandos, 13 schemas
- **Health Domain**: 2 endpoints, monitoramento integrado
- **Shared Components**: 4 schemas, infraestrutura comum

### **Cobertura Funcional:**
- **100%** dos comandos organizados por domínio
- **100%** dos schemas categorizados
- **100%** das rotas especializadas
- **0** dependências circulares entre domínios

## 🔄 Padrões de Interação

### **Fluxo de Requisição:**
```
1. Cliente → API Routes (Domínio específico)
2. Routes → OLT Service (Orquestração)
3. OLT Service → Commands (Domínio específico)
4. Commands → Connection Pool → OLT
5. Response → Schemas → Cliente
```

### **Comunicação entre Domínios:**
- **Evitada**: Domínios não se comunicam diretamente
- **Orquestração**: OLT Service coordena operações cross-domain
- **Eventos**: Trap Listener publica eventos para ambos os domínios

## 🧪 Estratégia de Testes

### **Testes por Domínio:**
```
tests/
├── integration/                   # Testes de integração
│   ├── test_olt_domain.py         # Testes do domínio OLT
│   ├── test_ont_domain.py         # Testes do domínio ONT
│   └── test_health_domain.py      # Testes de monitoramento
├── unit/                          # Testes unitários
│   ├── olt/                       # Testes de comandos OLT
│   ├── ont/                       # Testes de comandos ONT
│   └── core/                      # Testes de infraestrutura
└── utils/                         # Utilitários de teste
```

## 📈 Roadmap de Evolução

### **Fase 1 - Implementada ✅**
- Separação de domínios
- Reorganização de comandos e schemas
- Rotas especializadas
- Documentação atualizada

### **Fase 2 - Planejada**
- Testes automatizados por domínio
- Métricas específicas por domínio
- Cache especializado por contexto

### **Fase 3 - Futura**
- Microsserviços separados (opcional)
- Event sourcing para auditoria
- CQRS para otimização de queries

## 🎯 Conclusão

A implementação de Domain-Driven Design no OLT Manager Huawei resultou em:

- **Arquitetura mais limpa** e organizizada
- **Manutenibilidade aprimorada** com responsabilidades claras
- **Escalabilidade preparada** para crescimento futuro
- **Desenvolvimento mais eficiente** com contextos bem definidos
- **APIs mais intuitivas** organizadas por área de negócio

Esta base sólida permite evolução contínua do microsserviço, mantendo qualidade de código e alinhamento com necessidades de negócio das operadoras de telecomunicações.
