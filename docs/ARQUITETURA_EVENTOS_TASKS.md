# Plano de Implementação: Arquitetura Orientada a Eventos

Este documento detalha as tarefas necessárias para implementar a arquitetura orientada a eventos para o monitoramento de status de dispositivos em tempo real. As tarefas estão agrupadas por Épicos e formatadas para fácil importação em uma ferramenta de gerenciamento de projetos.

---

### **ÉPICO 1: [EPIC] Implementação do Serviço de Gerenciamento da OLT (`olt-manager-huawei`)**

**Objetivo:** Construir a fundação do serviço, permitindo a comunicação básica e a execução de comandos na OLT Huawei.

---

#### **Tarefa 1.1**

-   **Título:** [BACKEND] `feat(olt-manager): Configurar Base do Projeto e Cliente de Conexão SSH`
-   **Descrição:** Para que o serviço possa interagir com a OLT, é necessário estabelecer uma camada de conexão SSH robusta, utilizando bibliotecas padrão de mercado e gerenciando as credenciais de forma segura.
-   **Critérios de Aceite (AC):**
    -   `[ ]` A biblioteca `netmiko` está adicionada ao `requirements.txt`.
    -   `[ ]` Um módulo de configuração carrega o IP, usuário e senha da OLT a partir de variáveis de ambiente.
    -   `[ ]` Uma classe ou módulo `ConnectionManager` é capaz de estabelecer, manter e encerrar uma conexão SSH com a OLT de forma confiável.

#### **Tarefa 1.2**

-   **Título:** [BACKEND] `feat(olt-manager): Implementar Execução e "Parsing" de Comandos da OLT`
-   **Descrição:** O serviço precisa ser capaz de executar comandos na OLT (ex: `display ont info`) e, mais importante, traduzir a saída de texto puro em um formato de dados estruturado (JSON), que possa ser utilizado por outros serviços.
-   **Critérios de Aceite (AC):**
    -   `[ ]` Existe uma função que executa um comando específico (ex: `display ont info`) na OLT através do `ConnectionManager`.
    -   `[ ]` Existe uma função "parser" que recebe a saída de texto do comando e a converte em uma lista de objetos JSON.
    -   `[ ]` A lógica lida corretamente com possíveis erros na execução do comando.

#### **Tarefa 1.3**

-   **Título:** [BACKEND] `feat(olt-manager): Expor Dados da OLT via API Interna`
-   **Descrição:** Para que outros serviços (como o `backend-api` principal) possam consumir as informações da OLT, o `olt-manager` precisa expor esses dados através de uma API REST interna.
-   **Critérios de Aceite (AC):**
    -   `[ ]` Um endpoint (ex: `GET /api/v1/onts`) foi criado no `olt-manager` usando FastAPI.
    -   `[ ]` O endpoint utiliza as funções de comando e parsing para buscar e formatar os dados da OLT.
    -   `[ ]` O endpoint retorna os dados estruturados em JSON com sucesso.

---

### **ÉPICO 2: [EPIC] Habilitação da Arquitetura Orientada a Eventos para Status em Tempo Real**

**Objetivo:** Implementar o fluxo de eventos completo, desde a detecção na OLT até a disponibilização para o frontend, permitindo atualizações de status em tempo real.

---

#### **Tarefa 2.1**

-   **Título:** [BACKEND] `feat(olt-manager): Implementar Produtor de Eventos de Status via SNMP`
-   **Descrição:** O `olt-manager` deve ser capaz de detectar mudanças de status das ONUs (online/offline) em tempo real, ouvindo notificações (Traps) enviadas pela OLT via SNMP, e publicar esses eventos no nosso barramento de mensagens.
-   **Critérios de Aceite (AC):**
    -   `[ ]` As bibliotecas `pysnmp` e `pika` estão adicionadas ao `requirements.txt`.
    -   `[ ]` Um serviço "ouvinte" de SNMP Traps está implementado e ativo.
    -   `[ ]` Ao receber um trap, o serviço consegue identificar a ONU afetada e traduzir o evento para um formato JSON padronizado (incluindo a busca do Serial Number no DB).
    -   `[ ]` O evento padronizado é publicado com sucesso na `exchange` correta do RabbitMQ.

#### **Tarefa 2.2**

-   **Título:** [BACKEND] `feat(works): Implementar Consumidor de Eventos para Atualização de Estado`
-   **Descrição:** O serviço `works` deve assinar a fila de eventos de status de dispositivo e, ao receber um evento, atualizar o estado do nosso sistema (cache e banco de dados persistente) para refletir a realidade.
-   **Critérios de Aceite (AC):**
    -   `[ ]` O serviço `works` se conecta ao RabbitMQ e consome mensagens da fila de status de dispositivos.
    -   `[ ]` Ao receber um evento, o status do dispositivo é atualizado corretamente na chave correspondente no **Redis**.
    -   `[ ]` O status do dispositivo é também atualizado na tabela `devices` do **PostgreSQL**.

#### **Tarefa 2.3**

-   **Título:** [BACKEND] `feat(backend-api): Criar Endpoint de Leitura Rápida de Status`
-   **Descrição:** Para permitir que o frontend faça um polling eficiente e de baixo custo, o `backend-api` principal precisa de um novo endpoint que leia o status do dispositivo diretamente do cache em Redis.
-   **Critérios de Aceite (AC):**
    -   `[ ]` Um novo endpoint `GET /api/v1/devices/{serial_number}/status` foi criado.
    -   `[ ]` O endpoint busca e retorna com sucesso o status do dispositivo a partir do Redis.
    -   `[ ]` O endpoint implementa um fallback para o PostgreSQL caso a chave não seja encontrada no Redis.

#### **Tarefa 2.4**

-   **Título:** [INFRA] `chore(infra): Configurar Ambiente para Fluxo de Eventos`
-   **Descrição:** Tarefa de infraestrutura/DevOps para garantir que o ambiente de hardware e software esteja preparado para suportar a nova arquitetura de eventos.
-   **Critérios de Aceite (AC):**
    -   `[ ]` A OLT Huawei está configurada para enviar SNMP Traps para o endereço IP do serviço `olt-manager-huawei`.
    -   `[ ]` Todos os serviços (`olt-manager`, `works`, `backend-api`) possuem as variáveis de ambiente necessárias para se conectar ao RabbitMQ, Redis e PostgreSQL.