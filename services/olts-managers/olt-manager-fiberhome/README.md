# OLT Manager - Fiberhome

Microsservico dedicado para operacao de OLTs Fiberhome (ex.: AN5116).

Este modulo e independente do OLT Manager Huawei e possui sua propria base de comandos SNMP e SSH.

## Estrutura

```
src/
├── api/                 # Rotas FastAPI
├── core/                # Infraestrutura basica (logging, config)
├── commands/
│   ├── base_command.py  # Interface base para comandos
│   ├── olts/            # Comandos de OLT
│   │   ├── snmp/
│   │   └── ssh/
│   └── onts/            # Comandos de ONT
│       ├── snmp/
│       └── ssh/
├── main.py              # App FastAPI
```

## Endpoints iniciais

- `GET /health`
- `GET /api/v1/olts/commands`
- `GET /api/v1/onts/commands`
- `GET /api/v1/olts/{olt_id}/system-info`
- `GET /api/v1/olts/{olt_id}/auth-onu-count`
- `GET /api/v1/olts/{olt_id}/power-consumption`
- `GET /api/v1/olts/{olt_id}/uplink-optical-power`
- `GET /api/v1/olts/{olt_id}/traffic/interfaces`
- `GET /api/v1/olts/{olt_id}/port-status?port=1:1`
- `GET /api/v1/olts/{olt_id}/slot-status`
- `GET /api/v1/olts/{olt_id}/card-status`
- `GET /api/v1/olts/{olt_id}/version`
- `GET /api/v1/olts/{olt_id}/ip-info`
- `POST /api/v1/olts/{olt_id}/vlans`
- `DELETE /api/v1/olts/{olt_id}/vlans/{vlan_id}`
- `GET /api/v1/olts/{olt_id}/vlans`
- `GET /api/v1/olts/{olt_id}/onts/info`
- `GET /api/v1/olts/{olt_id}/onts/status`
- `GET /api/v1/olts/{olt_id}/onts/optical-power`
- `POST /api/v1/olts/{olt_id}/onts/reboot`
- `POST /api/v1/olts/{olt_id}/onts/deauthorize`
- `GET /api/v1/olts/{olt_id}/onts/discovery`
- `GET /api/v1/olts/{olt_id}/onts/online`
- `POST /api/v1/olts/{olt_id}/onts/whitelist`
- `POST /api/v1/olts/{olt_id}/onts/whitelist/remove`
- `POST /api/v1/olts/{olt_id}/onts/service-vlan`
- `POST /api/v1/olts/{olt_id}/onts/tr069/enable`
- `POST /api/v1/olts/{olt_id}/onts/tr069/disable`

## Como rodar (Docker)

Dev:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up olt-manager-fiberhome
```

Prod:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up olt-manager-fiberhome
```

## Configuracao local (fallback)

Crie `olt_config.yaml` com credenciais para testes locais:

```yaml
olts:
  - id: 1
    host: 192.168.1.200
    username: admin
    password: admin123
    snmp_community: public
    device_type: fiberhome
    port: 22
```

## Pendencias detalhadas (a implementar)

- **Provisionamento e servicos de ONU**: leitura/consulta de configuracao atual da ONU (service-info), suporte a multiplos services por porta, modos advanced (transparent, translate, QinQ), associacao de VLAN em uplink/PON quando exigido, alteracao/remocao de serviços e flows.
- **Monitoramento avancado**: traps SNMP para online/offline, coleta de alarmes ativos/historico, mapeamento ifIndex -> porta/ONU para trafego por ONU, conversao/escala de potencia optica (dBm) e validacao de unidade por firmware, thresholds e alertas.
- **TR-069**: configuracao de VLAN de gerencia/VEIP/iphost para acesso ao ACS, validacao de suporte por modelo (HGU/SFU), consulta de status TR-069 e leitura de parametros configurados.
- **Multi-modelo e compatibilidade**: deteccao automatica de modelo da OLT, ajustes de limites/capacidades por modelo, validacao do device_type Netmiko, fallback Telnet quando necessario, suporte SNMPv3.
- **Eventos e integracao**: publicacao de eventos/telemetria no RabbitMQ e padronizacao de payloads.
- **Confiabilidade e observabilidade**: retries/backoff, tratamento de timeouts, logs estruturados e correlacao de requisicoes.
- **Qualidade**: testes automatizados (SNMP/SSH com fixtures), mocks para dispositivos e validacao de parsing de CLI.

## TODO

- Validar o device_type correto do Netmiko para Fiberhome nos ambientes alvo.
- Integrar publicacao de eventos (RabbitMQ) quando necessario.
- Manter startup/shutdown usando FastAPI lifespan (evitar @app.on_event).
- Adicionar testes automatizados e fixtures de dispositivos.
