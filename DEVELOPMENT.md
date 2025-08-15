# Ambiente de Desenvolvimento Local com Docker

Este documento descreve como configurar e executar o ambiente de desenvolvimento completo do RJChronosConnect usando Docker e Docker Compose.

O ambiente foi projetado para espelhar a arquitetura de produção, garantindo consistência e minimizando surpresas no deploy.

## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados e em execução na sua máquina:

- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Iniciando o Ambiente

Com os pré-requisitos instalados, iniciar todo o ecossistema de microsserviços é um processo de um único comando.

1. **Clone o repositório** (caso ainda não o tenha feito).

2. **Navegue até a raiz do projeto** pelo seu terminal.

3. **Execute o seguinte comando:**
   ```bash
   docker-compose up --build
   ```
   - O argumento `--build` é necessário na primeira vez para construir as imagens customizadas (`frontend`, `backend`, `genieacs`) a partir dos seus `Dockerfiles`.
   - Nas próximas vezes, você pode usar apenas `docker-compose up`.

O terminal exibirá os logs de todos os 7 contêineres sendo iniciados. Este processo pode levar alguns minutos na primeira execução.

## Acessando os Serviços

Após a inicialização, os serviços estarão disponíveis nos seguintes endereços:

| Serviço | URL de Acesso | Descrição |
| :--- | :--- | :--- |
| **Aplicação Principal** | `http://localhost` | Ponto de entrada principal. O Nginx direcionará para o frontend. |
| API do Backend | `http://localhost/api/...` | Endpoints da sua API Python/FastAPI. |
| UI do GenieACS | `http://localhost:7567` | Interface de administração nativa do GenieACS (útil para debug). |

## Arquitetura dos Contêineres

O `docker-compose.yml` orquestra os seguintes serviços:

- `reverse-proxy`: Contêiner Nginx que atua como o único ponto de entrada, roteando o tráfego.
- `frontend`: A aplicação React (Vite) com hot-reloading.
- `backend`: A API Python (FastAPI) com hot-reloading.
- `genieacs`: O servidor ACS, construído a partir do código-fonte local.
- `db-app`: Banco de dados PostgreSQL para o serviço de `backend`.
- `db-acs`: Banco de dados MongoDB para o serviço `genieacs`.
- `redis`: Instância Redis usada pelo `genieacs`.

## Fluxo de Trabalho

O ambiente suporta **Hot-Reloading** para os serviços `frontend` e `backend`.

- Qualquer alteração nos arquivos dentro da pasta `frontend/src` ou `backend/` será detectada automaticamente, e o servidor de desenvolvimento correspondente será recarregado instantaneamente, sem a necessidade de reiniciar os contêineres.

## Comandos Úteis do Docker Compose

- **Iniciar o ambiente em background:**
  ```bash
  docker-compose up -d
  ```

- **Ver os logs de todos os serviços:**
  ```bash
  docker-compose logs -f
  ```

- **Ver os logs de um serviço específico (ex: backend):**
  ```bash
  docker-compose logs -f backend
  ```

- **Parar e remover os contêineres:**
  ```bash
  docker-compose down
  ```

- **Parar e remover contêineres E os volumes de dados (começar do zero):**
  ```bash
  docker-compose down -v
  ```

- **Acessar o terminal de um contêiner em execução (ex: backend):**
  ```bash
  docker-compose exec backend bash
  ```
