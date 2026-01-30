# Documentacao Docker

Este guia descreve como o ambiente Docker do RJChronosConnect esta organizado e como subir os stacks.

## Arquivos principais

- `docker-compose.yml`: definicoes base (comum a todos os ambientes).
- `docker-compose.dev.yml`: override para desenvolvimento (Dockerfile.dev, volumes, portas).
- `docker-compose.prod.yml`: override para producao (restart, healthcheck, volumes).

## Configuracao inicial

1) Copie `.env.example` para `.env`.
2) Ajuste credenciais e variaveis essenciais.

## Subir ambiente de desenvolvimento

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Para parar:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Subir ambiente de producao

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Portas principais (dev)

- Edge: 8081
- Frontend (Vite): 3000
- Backend: 8000
- RabbitMQ UI: 15672
- GenieACS MCP: 8082
- PostgreSQL: 5432
- Redis: 6379

## Volumes e persistencia

- Postgres: `postgres_app_data_*`
- Mongo (GenieACS): `mongo_acs_data_*`
- RabbitMQ: `rabbitmq_data_*`
- Redis: `redis_data_*`
- ClickHouse: `clickhouse_data` e `clickhouse_logs`

## Rede

- Todos os servicos usam a rede `rjchronos-net`.

## Observacoes importantes

- O GenieACS usa `network_mode: host` no compose base.
- O compose de dev sobrescreve imagens para live-reload.
- Mantenha o `.env` fora do git.
