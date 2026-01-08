# Módulo de Relatório de Rota (Queda por LOS) — Huawei OLT via SNMP

## Contexto e objetivo

Hoje o processo operacional está **manual** e gera gargalo:

1. Abrir o SmartOLT  
2. Acessar cada rota/porta GPON individualmente  
3. Copiar lista de clientes afetados  
4. Colar/formatar em Excel  
5. Encaminhar ao setor operacional

**Objetivo do módulo:** automatizar a geração do relatório de “queda de rota” identificando **ONUs em LOS** e exportando para **XLSX** (preferencial) ou **XML**, contendo:

- Nome do cliente (via *DB/CRM* ou “description” na OLT)
- Serial/SN do equipamento (ONT)
- Último sinal (Rx power)
- SLOT e PON
- (Opcional) last down time / last down cause

---

## Definição prática de “Queda de rota”

Para o operacional, podemos categorizar como **queda/parcial de rota** quando uma mesma porta PON possui um volume de ONUs com **LOS ativo** (Loss Of Signal).

Exemplo de regra:

- **Queda de rota:** `ONUs em LOS >= X` (ex.: 10, 15, 20)  
- **Parcial:** `1 <= ONUs em LOS < X`

> Esses thresholds devem ser configuráveis por OLT/área/rota.

---

## Fonte dos dados (SNMP)

### 1) Detecção de LOS por ONU (base do relatório)

A forma mais direta e rápida é usar a **tabela de estado de alarme por ONT** no `HUAWEI-XPON-MIB`, em especial:

- **LOS por ONU:** `hwGponDeviceOntAlarmLOSi`  
  - OID: `1.3.6.1.4.1.2011.6.128.1.1.2.50.1.4`
  - Fica dentro da tabela: `hwGponDeviceOntAlarmStateInfoTable` (`…2.50`)
  - Indexação: **IF-MIB::ifIndex (porta/PON)** + **hwGponDeviceOntIndex (ONT/ONU index)**

✅ **Por que isso resolve:** basta **listar essa tabela**, filtrar entradas com LOS=1, e **agrupar por ifIndex** (porta GPON/PON).

### 2) Dados de inventário e telemetria por ONU

Para cada ONU afetada (LOS=1), buscamos:

- **Serial/SN (Equipment SN):** `hwGponDeviceOntEquipmentSn`  
  - OID: `1.3.6.1.4.1.2011.6.128.1.1.2.45.1.9`

- **Serial/SN “atual/real”:** `hwGponDeviceOntControlActualSn`  
  - OID: `1.3.6.1.4.1.2011.6.128.1.1.2.46.1.30`

- **Rx power (último sinal óptico) — DDM:** `hwGponOntOpticalDdmRxPower`  
  - OID: `1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4`

- **Last down time:** `hwGponDeviceOntControlLastDownTime`  
  - OID: `1.3.6.1.4.1.2011.6.128.1.1.2.46.1.23`

- **Last down cause:** `hwGponDeviceOntControlLastDownCause`  
  - OID: `1.3.6.1.4.1.2011.6.128.1.1.2.46.1.24`

> Observação: Rx power geralmente vem “escalado” (inteiro). Validar o fator comparando 1 ONU no SmartOLT vs SNMP e fixar a conversão.

---

## Mapear ifIndex → SLOT/PON (rota)

As tabelas do `HUAWEI-XPON-MIB` usam **ifIndex** como “chave” da porta GPON/PON. Para traduzir isso em “SLOT/PON”, usamos `IF-MIB`:

- **ifName:** `1.3.6.1.2.1.31.1.1.1.1`  
- **ifDescr:** `1.3.6.1.2.1.2.2.1.2`

Na prática:

1. Fazer um `walk` em `ifName` (ou `ifDescr`)
2. Filtrar interfaces GPON (normalmente nomes como `gpon 0/5/2`, `GPON 0/5/2`, etc.)
3. Construir um mapa: `ifIndex → "gpon 0/5/2"`  
4. **Parsear** o texto para extrair `frame/slot/pon` (ou `slot/pon` conforme padrão da sua rede)

> Importante: em SNMP, **ifIndex pode mudar** após reboot/upgrade em alguns ambientes; por isso, o sistema deve sempre **reconstruir o mapa** `ifIndex→ifName` na inicialização do coletor e/ou manter cache com expiração.

---

## Estratégia de coleta (eficiência e robustez)

### Modelo “on-demand” (gerar relatório agora)

Entrada:
- `olt_id` (ou `olt_ip`)
- `slot`, `pon` (ou `ifIndex` direto)

Passos:

1. `GETBULK/WALK` em `hwGponDeviceOntAlarmLOSi`  
2. Filtrar apenas índices do `ifIndex` correspondente à porta alvo  
3. Obter lista de `ontIndex` com LOS=1  
4. Para esses índices, coletar em lote:
   - SN (EquipmentSn e/ou ActualSn)
   - Rx power
   - LastDownTime/LastDownCause
5. Enriquecer “cliente” via:
   - **DB/CRM (preferível)**: join pelo SN/LOID
   - fallback: descrição/nome provisionado na OLT (se disponível no seu ambiente)
6. Exportar XLSX/XML
7. Retornar download

### Modelo “automático” (detectar queda e gerar evidência)

Um job periódico (ex.: 60–120s) faz:

1. Poll rápido (apenas LOS) em todas as portas GPON
2. Agrega por porta
3. Se exceder threshold, cria incidente “Queda de rota”
4. Gera snapshot (XLSX) e salva no histórico

---

## Output do relatório

### XLSX (recomendado)

**Aba 1 — Resumo por rota**
- OLT
- SLOT
- PON
- ifIndex
- Quantidade de ONUs em LOS
- Classificação (queda/parcial)
- Data/hora da coleta

**Aba 2 — Clientes afetados**
- Cliente (DB/CRM)
- Contrato/Login (DB/CRM)
- SN
- SLOT
- PON
- ifIndex
- ontIndex
- Rx Power (último sinal)
- Last Down Time
- Last Down Cause
- Observações

### XML (alternativo)

Estrutura sugerida:

```xml
<routeReport generatedAt="2026-01-07T16:00:00-03:00" olt="OLT-Principal">
  <route slot="5" pon="2" ifIndex="12345" losCount="20" classification="route-down">
    <onu>
      <customerName>...</customerName>
      <contract>...</contract>
      <sn>...</sn>
      <ontIndex>...</ontIndex>
      <rxPower>-23.1</rxPower>
      <lastDownTime>...</lastDownTime>
      <lastDownCause>...</lastDownCause>
    </onu>
  </route>
</routeReport>
```

---

## Design do módulo (backend + frontend)

### Backend (Python)

Componentes:

1. **SNMP Client (async)**
   - operações: walk/getbulk/get
   - retries e timeouts configuráveis
   - limite de concorrência por OLT

2. **Service: RouteReportService**
   - `build_ifindex_map(olt)` → `{ifIndex: ifName}`
   - `list_los_onus(olt, ifIndex)` → `[ontIndex...]`
   - `fetch_onu_details(olt, ifIndex, ontIndex[])` → dados por ONU
   - `enrich_with_customer_db(onus)` → adiciona dados do cliente
   - `export_xlsx(data)` / `export_xml(data)`

3. **Persistência (opcional porém recomendado)**
   - histórico de incidentes
   - snapshots gerados

Endpoints sugeridos:

- `POST /api/reports/route`
  - body: `{ oltId, slot, pon, format: "xlsx"|"xml" }`
  - response: arquivo (download) ou `{reportId, downloadUrl}`

- `GET /api/reports/route/history?oltId=...&from=...&to=...`
  - lista de relatórios anteriores

### Frontend (React)

- Tela “Relatório de Rota”
  - selecionar OLT
  - selecionar SLOT/PON
  - exibir preview: `losCount`, top clientes, timestamp
  - botão “Gerar XLSX” / “Gerar XML”

---

## Observabilidade e segurança

- **Credenciais SNMP**: armazenar criptografado (ideal SNMPv3 quando possível)
- Logs:
  - tempo de coleta por OLT
  - quantidade de varBinds por request
  - timeouts/retries
- Métricas:
  - taxa de sucesso por OLT
  - latência SNMP por operação
  - incidentes por dia/rota

---

## (Opcional) Alarme global / histórico via HUAWEI-ALARM-MIB

Se for necessário **histórico de alarmes** ou lista de “alarmes ativos” (não só o estado atual), existe o `HUAWEI-ALARM-MIB`, com:

- `hwAlarmActiveTable` (alarme ativo)  
  - OID base: `1.3.6.1.4.1.2011.5.25.180.1.8`

Ponto de atenção: normalmente é preciso interpretar os campos de parâmetros para obter “qual ONU/porta”, então para o caso de “lista de clientes afetados por rota”, o caminho via `hwGponDeviceOntAlarmLOSi` tende a ser mais direto.

---

## Plano de validação (com o operacional)

1. Escolher uma rota (ex.: SLOT 05 / PON 02)  
2. Gerar:
   - relatório manual (SmartOLT)
   - relatório SNMP (novo módulo)
3. Comparar:
   - número de ONUs em LOS
   - SNs presentes
   - Rx power / last down (quando aplicável)
4. Ajustar conversão de Rx power
5. Definir thresholds (X) por tipo de rede (urbana/rural)

---

## Fontes (para referência técnica)

- `HUAWEI-XPON-MIB` (objetos GPON/EPON; inclui LOS por ONU, SN e Rx power):  
  - Observium MIB Browser e MIB Browser Online
- `IF-MIB` (ifName/ifDescr/ifIndex) e descrição de objetos  
- `HUAWEI-ALARM-MIB` (hwAlarmActiveTable)
