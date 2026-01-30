# Procedimento: Colocar ONT online na VLAN 307 (Huawei OLT)

Este passo a passo documenta o que foi feito para colocar uma ONT (SN `HWTCEA8E81AC`) online na VLAN 307 na OLT Huawei.

## Contexto

- Porta PON: **0/5/2** (slot 5, portid 2).
- ONT apareceu em **autofind** e foi **autorizada pelo sistema** (frontend).
- Line profile usado: **ID 1** (`SMARTOLT_FLEXIBLE_GPON`).
- Service profile usado: **ID 1** (`EG8145X6-10`).
- TR069 profile do GenieACS: **ID 3** (`GenieACS-96`).
- VLAN de servico: **307**.

> Observacao: a OLT exibe o SN em **hex**. Ex.: `48575443EA8E81AC` = `HWTC-EA8E81AC`.

---

## 1) Verificar ONT em autofind

No modo `config-if-gpon-0/5`:

```text
interface gpon 0/5
display ont autofind 2
```

Confirmar que o SN aparece na porta **0/5/2**.

---

## 2) Autorizar/provisionar a ONT

- A autorizacao foi feita **pelo sistema (frontend)**.
- Depois disso, a ONU apareceu na lista de provisionadas.

Verificar a ONT na porta:

```text
display ont info 2 all
```

Resultado confirmado:
- **ONT ID 28**
- **SN 48575443EA8E81AC (HWTC-EA8E81AC)**
- **Estado: online / normal / match**

---

## 3) Verificar line/srv profile

```text
display ont info 2 28
```

Confirmado:
- **Line profile ID 1** (`SMARTOLT_FLEXIBLE_GPON`)
- **Service profile ID 1** (`EG8145X6-10`)

---

## 4) Aplicar TR069 profile do GenieACS

No modo `config-if-gpon-0/5`:

```text
ont tr069-server-config 2 28 profile-id 3
```

Verificar o bind (fora do modo gpon):

```text
quit
display ont tr069-server-profile bound-info profile-id 3
```

Resultado esperado:
- `0/5/2  28-29`

---

## 5) Criar service-port para VLAN 307 (novo ID)

Criamos um **novo** service-port (sem reaproveitar o antigo):

```text
service-port 5016 vlan 307 gpon 0/5/2 ont 28 gemport 2 multi-service user-vlan 307 tag-transform translate
```

> Dica: antes, conferir se o ID esta livre:
> `display service-port 5016`

---

## 6) Verificar VLAN 307 aplicada

```text
display service-port port 0/5/2 ont 28
```

Ou:

```text
display service-port vlan 307
```

---

## Resultado

- ONT **online**
- TR069 profile do GenieACS aplicado
- **VLAN 307 ativa** via service-port

---

## (Opcional) IP via VLAN 307

Se sua operacao usa DHCP na VLAN 307:

```text
interface gpon 0/5
ont ipconfig 2 28 dhcp vlan 307 priority 2
```
