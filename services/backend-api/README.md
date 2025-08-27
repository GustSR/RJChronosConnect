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

**Híbrido (Desenvolvimento Ativo)**

Atualmente, o backend opera em um modo híbrido:

-   **Funcionalidades Reais (via GenieACS):** A consulta de dispositivos CPE, a leitura de falhas (alertas), o cálculo de métricas para o dashboard e a configuração de parâmetros Wi-Fi já estão **integrados com o GenieACS**. Essas funcionalidades operam com dados reais dos equipamentos.
-   **Funcionalidades Mock:** A gestão de dispositivos OLT, ONU e a autenticação de usuários ainda utilizam **dados mock**. Isso foi feito para acelerar o desenvolvimento do frontend enquanto a lógica de negócio e a integração com o banco de dados para essas áreas são finalizadas.

A fundação para o uso do banco de dados com **PostgreSQL** e migrações com **Alembic** já está implementada, mas ainda não foi conectada à lógica principal da aplicação no `main.py`.

---

## 3. Estrutura de Pastas

A organização do projeto segue as melhores práticas para aplicações FastAPI, visando a separação de responsabilidades.

```
.
├── alembic/              # Scripts de migração de banco de dados (Alembic).
├── app/                  # Contém todo o código fonte da aplicação.
│   ├── main.py           # Ponto de entrada da API, onde os endpoints são definidos.
│   ├── api/              # (Planejado) Módulos de rotas, para organizar os endpoints.
│   ├── core/             # (Planejado) Configurações globais, segurança e middlewares.
│   ├── crud/             # (Planejado) Funções de interação com o banco (Create, Read, Update, Delete).
│   ├── database/         # (Planejado) Configuração da conexão com o banco de dados.
│   ├── models/           # (Planejado) Modelos de tabelas do banco (SQLAlchemy).
│   ├── schemas/          # (Planejado) Modelos de validação de dados (Pydantic).
│   ├── services/         # Lógica de negócio e clientes para serviços externos (ex: genieacs_client.py).
│   └── utils/            # Funções utilitárias.
├── tests/                # Testes unitários e de integração.
├── Dockerfile            # Instruções para construir a imagem de produção.
├── requirements.txt      # Dependências Python do projeto.
└── README.md             # Esta documentação.
```

---

## 4. Como Executar Localmente

### Pré-requisitos
- Python 3.10+
- Um servidor PostgreSQL em execução.
- Um servidor GenieACS em execução (para funcionalidades completas).

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Gustavo-RJ/RJChronosConnect.git
    cd RJChronosConnect/services/backend-api
    ```

2.  **Crie e ative um ambiente virtual:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # No Linux/macOS
    # venv\Scripts\activate    # No Windows
    ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure as variáveis de ambiente:**
    Copie o arquivo `.env.example` na raiz do projeto para um novo arquivo `.env` e preencha com as URLs e credenciais do seu banco de dados e do GenieACS.

5.  **Execute o servidor de desenvolvimento:**
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    O servidor estará disponível em `http://127.0.0.1:8000`.

---

## 5. Documentação da API (Automática)

Com o servidor em execução, você pode acessar a documentação interativa gerada automaticamente pelo FastAPI:

-   **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
-   **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

A interface do Swagger permite visualizar e **testar cada endpoint diretamente do navegador**.

---

## 6. Roadmap de Desenvolvimento

-   [x] **Fase 1: Integração Core**
    -   [x] Conexão com a API do GenieACS.
    -   [x] Leitura de dispositivos (CPEs).
    -   [x] Leitura de falhas e transformação em alertas.
    -   [x] Modificação de parâmetros (Wi-Fi).

-   [ ] **Fase 2: Persistência e Autenticação**
    -   [ ] Ativar a conexão com o banco de dados PostgreSQL.
    -   [ ] Criar modelos (`models`) e schemas (`schemas`) para Usuários, OLTs, ONUs.
    -   [ ] Substituir os dados mock de OLTs e ONUs por consultas ao banco.
    -   [ ] Implementar sistema de autenticação completo com JWT (tokens).
    -   [ ] Proteger os endpoints que exigem autenticação.

-   [ ] **Fase 3: Funcionalidades Avançadas**
    -   [ ] Implementar sistema de cache com Redis para otimizar consultas frequentes.
    -   [ ] Desenvolver sistema de tarefas assíncronas (Celery) para operações demoradas (ex: reports, updates em massa).
    -   [ ] Expandir a cobertura de testes.
    -   [ ] Adicionar métricas para monitoramento com Prometheus.