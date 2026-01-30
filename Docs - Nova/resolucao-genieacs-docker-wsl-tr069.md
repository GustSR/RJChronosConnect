# Resumo da resolução — ONT Huawei não aparecia no CWMP (GenieACS no Docker/WSL)

## Sintoma inicial
- A ONT tinha IP de gerenciamento (VLAN 307) e o ACS (GenieACS) estava rodando em **Docker dentro do WSL2**.
- Quando o GenieACS rodava **direto no Windows**, a ONT “achava” o ACS e aparecia no GenieACS.
- Quando o GenieACS rodava no **container**, a ONT **não aparecia no CWMP** e não havia logs de conexão.

## Linha de investigação e o que confirmamos

### 1) Rede/porta do GenieACS no container
- Confirmamos que o container expunha corretamente as portas (principalmente a **7547/TCP**, CWMP):
  - `0.0.0.0:7547->7547/tcp` (no `docker ps`).

### 2) Expor serviço do WSL2 para a LAN
Como o WSL2 funciona como uma VM com IP próprio (NAT), **não é garantido** que a LAN consiga alcançar diretamente serviços no WSL2.  
Usamos `netsh interface portproxy` no Windows para encaminhar **Windows:7547 → WSL:7547** (modelo recomendado pela Microsoft para acesso via LAN).

**Comandos (PowerShell como Admin):**
```powershell
# Descobrir IP do WSL
wsl hostname -I

# Criar portproxy (exemplo usando o IP do WSL descoberto)
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=7547 connectaddress=172.18.217.177 connectport=7547

# Liberar a porta no firewall
New-NetFirewallRule -DisplayName "GenieACS CWMP 7547 -> WSL" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7547

# Conferir
netsh interface portproxy show all
```

### 3) Teste “certo” de reachability do CWMP
- Da rede (outra máquina), rodamos `curl` no endpoint do CWMP e recebemos **405 Method Not Allowed**.
  - Isso é esperado: CWMP/TR-069 usa **HTTP POST**, então um **GET** retorna 405.
- No WSL, `tcpdump` mostrou o tráfego chegando na 7547 quando fizemos o `curl`.

**Conclusão:** o caminho **LAN → Windows → WSL → container** estava OK.

## O “pulo do gato”: não era rede, era OMCI/TR-069 na OLT/ONT

### 4) A ONT não gerava tráfego CWMP nem após reboot
- Ao reiniciar a ONT, **não aparecia nada** no `tcpdump`.
- Isso indicava que a ONT **não estava iniciando TR-069** (não estava tentando Inform).

### 5) Diagnóstico na Huawei OLT
- `display ont info 2 28` mostrou:
  - `TR069 management: Enable`
  - `TR069 IP index: 0`
  - `TR069 server profile ID: 3`
  - **Config state: failed**
- `diagnose` → `display ont failed-configuration 0/5/2 28` mostrou a causa real:
  - **Config item:** ONU TR069 server parameters (`ont tr069-server-config`)
  - **Failed cause:** `ONU return error`

**Interpretação:** a OLT tentou empurrar os parâmetros TR-069 via OMCI e a ONT **rejeitou** (“return error”), então ela não tinha ACS válido para contatar.

## O que tentamos e o que funcionou (solução final)

### 6) Tentativa com profile “completo” (realm/senha forte)
- Criamos um novo TR-069 server profile com `auth-realm "auth"`, mas a ONT continuou retornando erro.

### 7) SOLUÇÃO: usar um TR-069 server profile minimalista
Criamos um profile **mais simples** (sem `auth-realm`, sem “/” final na URL e com credenciais curtas/alfa-numéricas).  
Depois, removemos e reaplicamos a configuração TR-069 na ONT.

**Comandos (OLT, uma linha):**
```text
ont tr069-server-profile add profile-id 6 profile-name "GenieACS-MIN" url "http://192.168.7.96:7547" user "acs" "acs123456"
```

**Aplicar na ONT (porta 2, ont 28):**
```text
interface gpon 0/5
undo ont tr069-server-config 2 28
ont tr069-server-config 2 28 profile-id 6
ont reset 2 28
quit
```

### 8) Validação
- `diagnose` → `display ont failed-configuration 0/5/2 28` deixou de apontar falha no item TR-069.
- Após o reset, começou a aparecer tráfego CWMP no `tcpdump` e a ONT passou a registrar no GenieACS.

## Checklist rápido (para repetir em outras ONTs)
1) **Container**: `docker ps` deve mostrar `0.0.0.0:7547->7547/tcp`.
2) **WSL2/LAN**: configurar `netsh interface portproxy` + regra no firewall.
3) **Teste**: `curl http://<IP_WINDOWS>:7547/` retornar **405** indica CWMP alcançável (normal).
4) **OLT diagnose**: se ONT não gera tráfego no reboot, checar:
   - `diagnose` → `display ont failed-configuration <F/S/P> <ontid>`
5) Se falhar com `ONU return error` em `ont tr069-server-config`:
   - criar profile minimalista (sem realm) e reaplicar.

## Referências úteis
- Microsoft WSL — *Accessing network applications with WSL* (portproxy / acesso pela LAN):  
  https://learn.microsoft.com/en-us/windows/wsl/networking
- GenieACS Forum — 405 “Method Not Allowed” no CWMP é normal (CWMP usa POST):  
  https://forum.genieacs.com/t/genieacs-installation-recording/1775  
  https://forum.genieacs.com/t/405-method-not-allowed/302
- Huawei CLI (exemplo de sintaxe do `ont tr069-server-profile add`):  
  https://forum.huawei.com/enterprise/en/how-to-remotely-configure-the-onts-via-cli-form-the-olt/thread/457505-100181

---

## Correção adicional — dispositivo ficava offline e “Summon” retornava 401

### Sintoma
- A ONT aparecia online por um tempo e depois ficava offline no GenieACS.
- Ao clicar em **Summon/Refresh** no UI, o GenieACS retornava:
  - `Connection request error: Unexpected status code 401`

### Causa
- O erro **401** no *Summon* é, na prática, falha de autenticação do **Connection Request** (ACS → CPE),
  que é independente das credenciais de **ACS URL/ACS user/ACS password** usadas no CWMP (CPE → ACS).

### Solução aplicada (funcionou)
No **GenieACS → Admin → Config**, setamos:

- `cwmp.connectionRequestAllowBasicAuth = True`
- `cwmp.connectionRequestAuth = AUTH(username, password)`

> Observação: `AUTH(username, password)` referencia automaticamente os valores do próprio device
> (`InternetGatewayDevice.ManagementServer.ConnectionRequestUsername` e `...ConnectionRequestPassword`).
> Se esses parâmetros estiverem vazios no CPE, o *Summon* continuará falhando.

### Referências
- GenieACS Forum — exemplos de configuração para corrigir erro 401 no Connection Request:  
  https://forum.genieacs.com/t/problem-with-connection-request-username-and-password/1171  
- GenieACS Forum — `cwmp.connectionRequestAuth` suporta `AUTH(username, password)` (valor padrão/expressão recomendada):  
  https://forum.genieacs.com/t/incorrect-connection-request-credentials-v1-2/240?page=2  
  https://forum.genieacs.com/t/connection-request-error-onu-gm620/4122
