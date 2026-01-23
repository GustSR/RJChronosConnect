# Checklist Operacional - TR-069 (GenieACS) Huawei

Use este checklist para repetir o processo de onboarding e garantir **Connection Request (Summon)** funcional.

## A) Preparacao (OLT)

- [ ] Criar profile TR-069 apontando para o ACS
  - URL: `http://<ACS_IP>:7547`
  - User/Senha (CPE -> ACS): `useracsrj / acspasswordrj`
- [ ] Aplicar profile na ONU
- [ ] Configurar IPHost via DHCP na VLAN 307
- [ ] Criar `service-port` para VLAN 307
- [ ] Verificar que a ONU recebeu IP

## B) Validacao basica (GenieACS)

- [ ] ONU aparece em **Devices**
- [ ] Inform chega sem falhas
- [ ] Debug habilitado (se necessario)

## C) Reachability (ACS -> ONU)

- [ ] ACS/Windows consegue pingar o IPHost da ONU
- [ ] `Test-NetConnection <IP_HOST> -Port 7547` retorna `True`
- [ ] Se necessario, adicionar rota:
  - `route add <IP_HOST> mask 255.255.255.255 <GW_VLAN> metric 1 if <IF>`

## D) Connection Request (Credenciais)

- [ ] Teste Digest com o usuario atual:
  - `curl.exe --digest -u "<user>:<pass>" http://<IP_HOST>:7547/<token>`
- [ ] Se 401:
  - definir `ConnectionRequestUsername/Password` na ONU **ou** via TR-069 (passo E)

## E) Setar Connection Request via TR-069 (recomendado)

- [ ] Enfileirar task no NBI (sem `connection_request`):
  - `setParameterValues` para:
    - `InternetGatewayDevice.ManagementServer.ConnectionRequestUsername`
    - `InternetGatewayDevice.ManagementServer.ConnectionRequestPassword`
- [ ] Aguardar o proximo Inform (ou re-register na OLT)
- [ ] Confirmar que a task sumiu (aplicada)

## F) Configurar GenieACS (Summon)

- [ ] `cwmp.connectionRequestAuth = AUTH("<user>","<pass>")`
- [ ] (Opcional) Filter por device ID
- [ ] Testar Summon na UI

## G) Validacao final

- [ ] Summon gera Inform imediato
- [ ] Device aparece Online
- [ ] (Opcional) limpar faults antigos

## Comandos rapidos (referencia)

**Task TR-069 (PowerShell):**
```
$payload = @{
  name = "setParameterValues"
  parameterValues = @(
    @("InternetGatewayDevice.ManagementServer.ConnectionRequestUsername","cruser","xsd:string"),
    @("InternetGatewayDevice.ManagementServer.ConnectionRequestPassword","crpass","xsd:string")
  )
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:7557/devices/<DEVICE_ID_ENCODED>/tasks" `
  -ContentType "application/json" `
  -Body $payload
```

**Testar Digest:**
```
curl.exe --digest -u "cruser:crpass" -v "http://<IP_HOST>:7547/<token>"
```
