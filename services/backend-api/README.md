# RJChronosConnect - Backend API

[![CI](https://github.com/Gustavo-RJ/RJChronosConnect/actions/workflows/ci.yml/badge.svg)](https://github.com/Gustavo-RJ/RJChronosConnect/actions/workflows/ci.yml)

## 1. Visão Geral

Este é o serviço de backend para a plataforma **RJChronosConnect**. Construído com Python e FastAPI, ele atua como o cérebro do sistema, responsável por:

-   Orquestrar a comunicação com o servidor de provisionamento **GenieACS (TR-069)**.
-   Processar e transformar dados brutos de dispositivos em informações úteis.
-   Expor uma API RESTful segura e documentada para o frontend.
-   Gerenciar a lógica de negócio e a persistência de dados.

---

## 2. Estado Atual do Projeto

**Banco de Dados Implementado (Schema V2)**

O backend agora conta com um schema de banco de dados PostgreSQL robusto e normalizado, gerenciado por **Alembic**. A estrutura de tabelas v2 está implementada, incluindo relacionamentos e tipos de dados específicos para a aplicação.

A lógica de negócio no `main.py` ainda não está conectada ao banco de dados, mas a fundação para as operações CRUD (Create, Read, Update, Delete) está pronta.

---

## 3. Estrutura de Pastas

A organização do projeto foi atualizada para refletir a implementação do banco de dados:

```
.
├── alembic/              # Scripts de migração de banco de dados (Alembic).
│   └── versions/         # Arquivos de migração específicos.
├── app/                  # Contém todo o código fonte da aplicação.
│   ├── main.py           # Ponto de entrada da API.
│   ├── api/              # Módulos de rotas da API (endpoints).
│   ├── core/             # Configurações globais e middlewares.
│   ├── crud/             # Funções de interação com o banco (CRUD).
│   ├── database/         # Configuração da conexão com o banco e a Base do SQLAlchemy.
│   ├── models/           # Modelos de tabelas do banco (SQLAlchemy).
│   ├── schemas/          # Modelos de validação de dados (Pydantic).
│   ├── services/         # Lógica de negócio e clientes para serviços externos.
│   └── utils/            # Funções utilitárias.
├── tests/                # Testes unitários e de integração.
├── alembic.ini           # Arquivo de configuração do Alembic.
├── Dockerfile            # Instruções para construir a imagem de produção.
├── requirements.txt      # Dependências Python do projeto.
└── README.md             # Esta documentação.
```

---

## 4. Schema do Banco de Dados (v2)

O schema foi projetado para ser normalizado e eficiente, separando responsabilidades em tabelas distintas.

### Tabelas Principais

| Tabela | Propósito |
| :--- | :--- |
| `users` | Armazena as contas dos administradores e técnicos que acessam o sistema. |
| `subscribers` | Contém as informações dos clientes finais (assinantes dos serviços). |
| `olts` | Cadastra as OLTs (Optical Line Terminals) gerenciadas pelo sistema. |
| `olt_ports` | Mapeia as portas físicas de cada OLT, representando a infraestrutura de rede. |
| `devices` | Tabela central que representa as ONUs/ONTs (os dispositivos na casa do cliente). |
| `tasks` | Registra tarefas assíncronas executadas nos dispositivos (ex: reboot, reprovisionamento). |
| `activity_logs` | Funciona como uma trilha de auditoria, registrando todas as ações importantes no sistema. |

### Tabelas de Lookup (Normalização)

Estas tabelas armazenam valores fixos para garantir a consistência dos dados em todo o sistema.

| Tabela | Propósito | Exemplos de Valores |
| :--- | :--- | :--- |
| `device_statuses` | Define os possíveis status de um dispositivo. | `ativo`, `offline`, `em manutenção` |
| `task_statuses` | Define os estados de uma tarefa assíncrona. | `pendente`, `em andamento`, `concluída` |
| `task_types` | Categoriza os tipos de tarefas que podem ser executadas. | `reprovisionar`, `resetar_wifi`, `buscar_parametros` |
| `log_levels` | Define os níveis de severidade para os logs de atividade. | `info`, `warning`, `error`, `critical` |

---

## 5. Como Executar Localmente

### Pré-requisitos
- Python 3.10+
- Docker e Docker Compose
- Um arquivo `.env` na raiz do projeto (baseado no `.env.example`).

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Gustavo-RJ/RJChronosConnect.git
    cd RJChronosConnect
    ```

2.  **Configure as variáveis de ambiente:**
    Copie o arquivo `.env.example` para `.env` e preencha as credenciais necessárias.

3.  **Suba os contêineres com Docker Compose:**
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```
    Este comando irá construir as imagens e iniciar todos os serviços, incluindo o backend, o banco de dados e o GenieACS.

4.  **Acesse a API:**
    O servidor estará disponível em `http://127.0.0.1:8000`.

---

## 6. Documentação da API (Automática)

Com o servidor em execução, acesse a documentação interativa gerada pelo FastAPI:

-   **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
-   **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 7. Roadmap de Desenvolvimento

-   [x] **Fase 1: Integração Core e Schema DB**
    -   [x] Conexão com a API do GenieACS.
    -   [x] Leitura de dispositivos e parâmetros (Wi-Fi, Alertas).
    -   [x] Implementação do Schema V2 do banco de dados com Alembic.
    -   [x] Criação dos modelos SQLAlchemy para todas as tabelas.

-   [ ] **Fase 2: Conexão da Lógica ao Banco**
    -   [ ] Ativar a sessão do banco de dados no `main.py`.
    -   [ ] Desenvolver as funções `crud` para cada modelo.
    -   [ ] Substituir os dados mock de OLTs e ONUs por chamadas ao banco.
    -   [ ] Implementar sistema de autenticação completo com JWT, lendo usuários do banco.
    -   [ ] Proteger os endpoints que exigem autenticação.

-   [ ] **Fase 3: Funcionalidades Avançadas**
    -   [ ] Implementar sistema de cache com Redis.
    -   [ ] Desenvolver sistema de tarefas assíncronas com Celery e RabbitMQ.
    -   [ ] Expandir a cobertura de testes para a camada de banco de dados.
