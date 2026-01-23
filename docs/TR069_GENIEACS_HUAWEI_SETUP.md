# TR-069 (GenieACS) - Huawei EG8145X6-10 (passo a passo)

Este documento resume o que fizemos para colocar uma ONU Huawei no GenieACS e habilitar o **Connection Request (Summon)**.

## Contexto

- OLT: Huawei MA5800 (X2/X7/X15)
- ONU: Huawei EG8145X6-10 (SN 48575443AB97AEAE)
- VLAN de gerencia TR-069: **307** (DHCP)
- Host ACS (Windows): **192.168.7.96**
- IP da ONU (IPHost): **192.168.7.98**
- GenieACS (CWMP): **http://192.168.7.96:7547**

## 1) Criar o profile TR-069 na OLT

**Criar profile:**
```
ont tr069-server-profile add profile-id 2 profile-name "GenieACS" url "http://192.168.7.96:7547" user "useracsrj" "acspasswordrj"
```

**Aplicar na ONU (gpon 0/5/2 ont-id 29):**
```
interface gpon 0/5
ont tr069-server-config 2 29 profile-id 2
ont ipconfig 2 29 dhcp vlan 307 priority 2
```

**Criar service-port para VLAN 307 (exemplo):**
```
service-port 5015 vlan 307 gpon 0/5/2 ont 29 gemport 2 multi-service user-vlan 307 tag-transform translate
```

**Verificar IP da ONU:**
```
display ont ipconfig 2 29
```

## 2) Validar registro no GenieACS

- A ONU passou a aparecer em **Devices**.
- O Inform chega normalmente (log do cwmp).

## 3) Habilitar debug no GenieACS

**Admin > Config**
- `cwmp.debug` com filtro para o device ID:
```
DeviceID.ID == "00259E-EG8145X6%2D10-48575443AB97AEAE"
```

**Variaveis de ambiente (GenieACS):**
```
GENIEACS_DEBUG_FILE=/var/log/genieacs/genieacs-debug.yaml
GENIEACS_DEBUG_FORMAT=yaml
```

## 4) Problema: Summon falhando (401)

- Connection Request dava **401 Unauthorized (Digest)**.
- O ACS nao conseguia chamar a ONU inicialmente por falta de rota.

## 5) Corrigir reachability (rota no Windows)

```
route add 192.168.7.98 mask 255.255.255.255 192.168.7.1 metric 1 if 11
```

Depois disso:
- `ping 192.168.7.98` passou a responder.
- `Test-NetConnection 192.168.7.98 -Port 7547` deu **True**.

## 6) Connection Request ainda 401 (senha nao vazia)

Teste com Digest mostrou **401** mesmo com senha vazia:
```
curl.exe --digest -u "smartolt:" -v "http://192.168.7.98:7547/<token>"
```

Conclusao: a senha real do Connection Request nao era vazia (apesar de aparecer em branco no TR-069).

## 7) Setar usuario/senha de Connection Request via TR-069

Criamos uma task no NBI para setar **ConnectionRequestUsername/Password** (sem connection_request). Isso roda no proximo Inform.

**Windows (PowerShell):**
```
$payload = @{
  name = "setParameterValues"
  parameterValues = @(
    @("InternetGatewayDevice.ManagementServer.ConnectionRequestUsername","cruser","xsd:string"),
    @("InternetGatewayDevice.ManagementServer.ConnectionRequestPassword","crpass","xsd:string")
  )
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:7557/devices/00259E-EG8145X6%252D10-48575443AB97AEAE/tasks" `
  -ContentType "application/json" `
  -Body $payload
```

**Obs:** o device ID no path usa `%252D`.

**Confirmacao:** a task desapareceu da lista apos o Inform (aplicado).

## 8) Configurar o GenieACS para o Connection Request

**Admin > Config**
- `cwmp.connectionRequestAuth`:
```
AUTH("cruser","crpass")
```

(opcional) Filter:
```
DeviceID.ID == "00259E-EG8145X6%2D10-48575443AB97AEAE"
```

## 9) Teste final (Digest)

```
curl.exe --digest -u "cruser:crpass" -v "http://192.168.7.98:7547/cc863f6caaa2d0fc1e9c4dec400c923b"
```

Resultado: **200 OK**.

## 10) Summon funcionando

- Devices > ONU > **Summon** OK.
- O Inform chega imediatamente apos o connection request.

## Notas importantes

- **CPE -> ACS** (Inform) usa `useracsrj/acspasswordrj` do profile TR-069 na OLT.
- **ACS -> CPE** (Summon/Connection Request) usa `ConnectionRequestUsername/Password` da ONU.
- Se o Summon voltar a falhar, valide reachability e o Digest (curl.exe).
