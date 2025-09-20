# 📋 Índice do Projeto RJChronosConnect

## 🎯 O que tem neste projeto?

### 📱 **Sistema Principal**
- `services/frontend/` - Interface do usuário (React)
- `services/backend-api/` - API principal (FastAPI) - **Login aqui**
- `services/genieacs/` - Gerenciamento TR-069

### 🛠️ **Gerenciamento de OLTs**
- `services/olts-managers/olt-manager-huawei/` - Comandos para OLTs Huawei

### 📊 **Sistema de Logging** (NOVO - implementado agora)
- `shared/logging/` - Biblioteca para registrar ações
- `services/log-consumer-postgresql/` - Guarda logs importantes
- `services/log-consumer-clickhouse/` - Guarda logs operacionais
- `services/log-monitor/` - Monitora se tudo está funcionando

### ⚙️ **Infraestrutura**
- `infrastructure/` - Configurações de bancos e filas
- `docker-compose.yml` - Orquestração de todos os serviços

### 📚 **Documentação**
- `docs/LOGGING_SYSTEM.md` - Documentação técnica completa
- `README_LOGGING.md` - Explicação simples do sistema de logging
- `CLAUDE.md` - Diretrizes para desenvolvimento

### 🔧 **Scripts**
- `scripts/setup_logging_system.sh` - Instala sistema de logging

## 🚀 Como começar?

### 1. **Sistema básico** (já existia):
```bash
docker-compose up frontend backend genieacs
```

### 2. **Com sistema de logging** (novo):
```bash
./scripts/setup_logging_system.sh
```

## 📞 Ajuda rápida:

- **Dúvida sobre logging?** → Leia `README_LOGGING.md`
- **Documentação técnica?** → Veja `docs/LOGGING_SYSTEM.md`
- **Problema na instalação?** → Execute `scripts/setup_logging_system.sh`
- **Sistema não funciona?** → Verifique http://localhost:8080/health

---
**Última atualização**: Sistema de logging implementado para compliance LGPD/ANATEL