# RJChronos Backend - FastAPI

Backend moderno em Python com FastAPI para o sistema RJChronos.

## 🚀 Tecnologias

- **FastAPI 0.104.1** - Framework web moderno e rápido
- **Uvicorn** - Servidor ASGI de alta performance
- **Pydantic 2.5** - Validação de dados com type hints
- **SQLAlchemy 2.0** - ORM moderno com async support
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Celery** - Tarefas assíncronas
- **Alembic** - Migrações de banco
- **Prometheus** - Métricas e monitoramento

## 📦 Instalação

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Executar servidor de desenvolvimento
python main.py
```

## 🔗 Endpoints Disponíveis

### Autenticação
- `GET /api/auth/user` - Dados do usuário atual

### Dispositivos
- `GET /api/devices/cpes` - Lista de CPEs
- `GET /api/devices/onus` - Lista de ONUs  
- `GET /api/devices/olts` - Lista de OLTs

### Alertas
- `GET /api/alerts` - Lista de alertas

### Dashboard
- `GET /api/dashboard/metrics` - Métricas do dashboard

## 🏗️ Estrutura Planejada

```
backend/
├── app/
│   ├── api/              # Rotas da API
│   ├── core/             # Configurações e segurança
│   ├── db/               # Modelos e conexão com BD
│   ├── services/         # Lógica de negócio
│   └── utils/            # Utilitários
├── alembic/              # Migrações
├── tests/                # Testes
└── requirements.txt      # Dependências
```

## 🔮 Próximas Implementações

- [ ] Autenticação JWT completa
- [ ] Integração com PostgreSQL
- [ ] Modelos SQLAlchemy
- [ ] Integração GenieACS (TR-069)
- [ ] WebSocket para tempo real
- [ ] Sistema de cache Redis
- [ ] Tarefas Celery
- [ ] Testes automatizados
- [ ] Docker containerization
