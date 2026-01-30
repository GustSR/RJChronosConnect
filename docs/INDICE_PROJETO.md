# Indice do Projeto RJChronosConnect

## O que tem neste projeto?

### Sistema principal
- `services/edge/` - Gateway publico (Bun + Elysia + Better Auth)
- `services/frontend/` - Interface do usuario (React + Vite)
- `services/backend-api/` - API principal (FastAPI)
- `services/genieacs/` - Gerenciamento TR-069 (GenieACS)
- `services/works/` - Worker para tarefas assincronas

### Gerenciamento de OLTs
- `services/olts-managers/olt-manager-huawei/` - OLT Huawei
- `services/olts-managers/olt-manager-fiberhome/` - OLT FiberHome

### Sistema de logging
- `shared/logging/` - Biblioteca para registrar acoes
- `services/log-consumer-postgresql/` - Guarda logs criticos
- `services/log-consumer-clickhouse/` - Guarda logs operacionais
- `services/log-monitor/` - Monitora o pipeline de logs

### Infraestrutura
- `infrastructure/` - Configuracoes de bancos e filas
- `docker-compose.yml` - Base do ambiente
- `docker-compose.dev.yml` - Overrides para desenvolvimento

### Scripts
- `scripts/setup_logging_system.sh` - Instala sistema de logging
- `scripts/genieacs-config.sh` - Helper de configuracao do GenieACS

## Como comecar?

### 1. Ambiente dev completo (Docker)
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 2. Para parar
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Ajuda rapida
- Duvida sobre logging? Leia `docs/README_LOGGING.md`
- Documentacao tecnica? Veja `docs/LOGGING_SYSTEM.md`
- Problema na instalacao? Execute `scripts/setup_logging_system.sh`
- Sistema nao funciona? Verifique http://localhost:8083/health
