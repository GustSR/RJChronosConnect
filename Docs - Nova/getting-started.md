# Getting Started - RJChronosConnect

Este guia ajuda voce a subir o ambiente de desenvolvimento local do RJChronosConnect.

## 1. Pre-requisitos

- Docker (inclui Docker Compose)
- Acesso ao repositorio do projeto

## 2. Estrutura do Projeto (visao rapida)

Principais servicos em `services/`:
- `services/edge` (gateway Bun/Elysia)
- `services/frontend` (React/Vite)
- `services/backend-api` (FastAPI)
- `services/works` (worker)
- `services/genieacs` (ACS)
- `services/olts-managers` (microservicos de OLT)

Outros diretorios relevantes:
- `shared/` (codigo compartilhado)
- `infrastructure/` (Nginx e afins)
- `config/` (configuracoes)
- `docs/` (documentacao)
- `scripts/` (automacoes)

## 3. Configuracao inicial

1) Copie o arquivo `.env.example` para `.env` e ajuste as variaveis necessarias, especialmente as credenciais do PostgreSQL.

2) Suba o ambiente completo (modo desenvolvimento) na raiz do projeto:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Para parar o ambiente:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## 4. Acessos principais (DEV)

- Aplicacao principal: http://localhost:8081
- API do backend: http://localhost:8081/api
- UI do GenieACS: http://localhost:8081/ui
- RabbitMQ UI: http://localhost:15672 (usuario/senha: guest/guest)
- GenieACS-MCP: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## 5. Fluxo rapido para contribuicao local

Se voce precisar rodar servicos fora do Docker, use os comandos do servico especifico.
Exemplos:

- Frontend: em `services/frontend`
  - `bun run dev`
  - `bun run build`
  - `bun run lint`
  - `bun run test`

- Edge: em `services/edge`
  - `bun run dev`
  - `bun run start`

## 6. Problemas comuns

- Variaveis de ambiente: confirme o `.env` antes de subir o stack.
- Portas ocupadas: verifique se as portas 8081, 8080, 15672, 5432 e 6379 estao livres.
- Build lento: rode o build novamente com o cache do Docker limpo, se necessario.
