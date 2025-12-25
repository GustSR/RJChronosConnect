# Better Auth - Migracoes

Este diretório guarda o SQL gerado pelo Better Auth para criar as tabelas de autenticacao.

## Como aplicar

1. Suba o banco local (ex.: via Docker Compose).
2. Aplique o SQL no Postgres:

```bash
psql -h localhost -p 5432 -U <user> -d <db> -f services/edge/migrations/better-auth.sql
```

Se estiver usando o container do Docker:

```bash
cat services/edge/migrations/better-auth.sql | \
  docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db-app \
  psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

Ajuste os caminhos conforme o ambiente.
