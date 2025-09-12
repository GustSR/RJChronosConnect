### **Visão Geral: Construindo um Especialista em OLT**

Nosso objetivo principal é construir o microsserviço `olt-manager-huawei` como um **especialista** em se comunicar com OLTs da Huawei. Ele deve ser capaz de executar comandos, obter informações e reagir a eventos, abstraindo toda a complexidade da comunicação direta com o hardware.

### **O Que Foi Feito Até Agora (Com o "Por Quê" e as Estratégias)**

1.  **Fundação do Microsserviço (`olt-manager-huawei`):**
    *   **O quê:** Criamos o esqueleto do serviço (estrutura de pastas, `main.py`, `olt_service.py`, `schemas/`, `commands/`).
    *   **Por quê:** Para isolar a complexidade de comunicação com a OLT em um serviço dedicado, seguindo o padrão de microsserviços. Isso permite desenvolvimento, deploy e escalabilidade independentes.
    *   **Estratégia Principal:** **Separação de Responsabilidades (SoC)** e **Baixo Acoplamento**.

2.  **Arquitetura de Comandos (Command Pattern):**
    *   **O quê:** Implementamos o padrão de projeto Command, com uma classe base `OLTCommand` e classes concretas para cada comando da OLT.
    *   **Por quê:** Para encapsular a lógica de execução e parsing de cada comando da OLT, tornando o código modular, testável e extensível.
    *   **Estratégia Principal:** **Command Pattern**, **Extensibilidade**, **Manutenibilidade**, **Testabilidade**.

3.  **Suporte a Múltiplos Modelos/Versões de OLT:**
    *   **O quê:** Refinamos a arquitetura de Comandos para que cada comando possa adaptar sua execução e parsing com base na versão do firmware da OLT (`display version`).
    *   **Por quê:** Para lidar com as variações de comandos e saídas entre diferentes modelos e versões de firmware da Huawei.
    *   **Estratégia Principal:** **Strategy Pattern** (implícito), **Robustez**, **Flexibilidade**.

4.  **Implementação de Comandos CLI (SSH):**
    *   **O quê:** Implementamos diversos comandos que se comunicam via SSH:
        *   `display ont info` (leitura geral de ONT)
        *   `ont add` (provisionamento de ONT)
        *   `ont reboot` (reinício de ONT)
        *   `display service-port` (diagnóstico de portas de serviço)
        *   `dba-profile add` (configuração de perfil de banda)
        *   `ont-lineprofile gpon` (configuração de perfil de linha)
        *   `ont-srvprofile gpon` (configuração de perfil de serviço)
    *   **Por quê:** Para fornecer funcionalidades essenciais de gerenciamento e provisionamento.
    *   **Estratégia Principal:** Utilizar **CLI (SSH)** para comandos de **configuração** e **ações complexas**, devido ao seu poder e acesso total às funcionalidades da OLT.

5.  **Implementação da Estratégia Híbrida (CLI + SNMP):**
    *   **O quê:** Refatoramos o comando `display ont optical-info` para que ele utilize **SNMP** em vez de CLI.
    *   **Por quê:** Para otimizar a performance na leitura de dados de status e métricas, que são mais eficientes via SNMP.
    *   **Estratégia Principal:** **Abordagem Híbrida**. Usar **SNMP** para **leitura de status/métricas** (mais rápido e leve) e **CLI (SSH)** para **configuração e comandos complexos** (mais poderoso).

### **O Que Falta Fazer (Com o "Por Quê" e as Estratégias)**

Nosso `olt-manager` já é funcional, mas ainda há um roadmap claro para torná-lo mais completo e eficiente.

1.  **Finalizar a Migração de Comandos de Leitura para SNMP:**
    *   **O quê:** Continuar migrando outros comandos de "display" para usar SNMP. (Ex: `display ont port state` - *estamos fazendo agora*).
    *   **Por quê:** Para maximizar a performance e eficiência na coleta de dados de monitoramento, seguindo a estratégia híbrida.
    *   **Estratégia Principal:** **Otimização via SNMP**.

2.  **Implementar Comandos de Configuração/Manutenção Restantes (CLI/SSH):**
    *   **O quê:** Adicionar os comandos de configuração e manutenção que ainda não foram implementados do seu documento. (Ex: `ont confirm`, `display mac-address`, `shutdown`).
    *   **Por quê:** Para completar o conjunto de funcionalidades de gerenciamento da OLT e cobrir todos os casos de uso.
    *   **Estratégia Principal:** **Cobertura de Funcionalidades**, **CLI (SSH)** para comandos de ação.

3.  **Implementar o Fluxo de Descoberta Automática (`autofind`):**
    *   **O quê:** Implementar os comandos `display ont autofind` e `ont confirm`.
    *   **Por quê:** Para fornecer uma alternativa ao provisionamento manual, permitindo a descoberta e confirmação de ONTs não configuradas.
    *   **Estratégia Principal:** **Automação de Descoberta**.

4.  **O Grande Próximo Passo: Arquitetura Orientada a Eventos (ÉPICO 2):**
    *   **O quê:** Implementar o "Listener" de SNMP Traps no `olt-manager-huawei`.
    *   **Por quê:** Para permitir que o sistema receba notificações em tempo real da OLT (ex: ONT offline/online), em vez de precisar perguntar (polling).
    *   **Estratégia Principal:** **Arquitetura Orientada a Eventos**, **SNMP Traps** para notificações assíncronas.

5.  **Integração com o `backend-api` Principal (Credenciais Dinâmicas):**
    *   **O quê:** Implementar o endpoint no `backend-api` para fornecer as credenciais dinâmicas da OLT (SSH e SNMP) para o `olt-manager`.
    *   **Por quê:** Para que o `olt-manager` possa se conectar a qualquer OLT cadastrada pelo usuário, sem ter credenciais estáticas em seu código.
    *   **Estratégia Principal:** **Segurança**, **Flexibilidade de Credenciais**.
