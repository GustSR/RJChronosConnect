
# 📡 Huawei OLT — ONT Troubleshooting & Provisionamento (Cheat Sheet)

---

## 1) Verificação de Status da ONT

| Comando | Onde executar | O que faz | Exemplo |
|---|---|---|---|
| `display ont info portid ont-id` | `interface gpon 0/5` ou `config` | Status completo (online, config state, match state, IP, temperatura, etc.) | `display ont info 2 28` |
| `display ont ipconfig portid ont-id` | `interface gpon 0/5` ou `config` | IP de gerenciamento, máscara, gateway, DNS, VLAN e índice IP host | `display ont ipconfig 2 28` |
| `display service-port port F/S/P ont ont-id` | `config` (fora da interface) | Lista service-ports da ONT (VLAN, gemport, up/down) | `display service-port port 0/5/2 ont 28` |
| `diagnose` → `display ont failed-configuration F/S/P ont-id` → `quit` | `diagnose` | Mostra exatamente o que falhou e o motivo (*ONU return error*, etc.) | `display ont failed-configuration 0/5/2 28` |
| `display ont version portid ont-id` | `interface gpon 0/5` ou `config` | Firmware, modelo e infos de hardware/software | `display ont version 2 28` |

---

## 2) TR-069 / GenieACS

| Comando | Onde executar | O que faz | Exemplo |
|---|---|---|---|
| `display ont tr069-server-profile all` | `config` | Lista todos os perfis TR-069 | `display ont tr069-server-profile all` |
| `display ont tr069-server-profile profile-id X` | `config` | Detalhes do perfil (URL, user, realm, etc.) | `display ont tr069-server-profile profile-id 2` |
| `display ont tr069-server-profile bound-info profile-id X` | `config` | ONTs vinculadas ao perfil | `display ont tr069-server-profile bound-info profile-id 3` |
| `ont tr069-server-profile add ...` | `config` | Cria perfil TR-069 apontando para o GenieACS | `ont tr069-server-profile add profile-id 3 profile-name "MIN_TEST" url "http://10.200.7.253:7547" user "acs1" "acs123"` |
| `ont tr069-server-config portid ont-id profile-id X` | `interface gpon 0/5` | Vincula ONT ao perfil TR-069 | `ont tr069-server-config 2 28 profile-id 3` |
| `undo ont tr069-server-config portid ont-id` | `interface gpon 0/5` | Remove o binding TR-069 | `undo ont tr069-server-config 2 28` |

---

## 3) Provisionamento e Configuração de Serviço

| Comando | Onde executar | O que faz | Exemplo |
|---|---|---|---|
| `service-port ID vlan X gpon F/S/P ont ont-id gemport Y ...` | `config` (fora da interface) | Cria service-port (internet/gerência, VLAN, gemport, bridge/router) | `service-port 5016 vlan 307 gpon 0/5/2 ont 28 gemport 2 multi-service user-vlan 307 tag-transform translate` |
| `ont ipconfig portid ont-id ip-index 0 dhcp vlan X priority Y` | `interface gpon 0/5` | Configura IP de gerenciamento (**ip-index 0 obrigatório p/ TR-069**) | `ont ipconfig 2 28 ip-index 0 dhcp vlan 200 priority 2` |

---

## 4) Reset e Manutenção da ONT

| Comando | Onde executar | O que faz | Exemplo |
|---|---|---|---|
| `ont reset portid ont-id` | `interface gpon 0/5` | Reinicia a ONT (soft reset) | `ont reset 2 28` |
| `ont reset portid ont-id factory` | `interface gpon 0/5` | Reset de fábrica (apaga configs internas) | `ont reset 2 28 factory` |

---

## 🔁 Fluxo Operacional Mais Usado

```bash
# 1. Status completo
display ont info 2 28

# 2. IP de gerenciamento
display ont ipconfig 2 28

# 3. Motivo da falha
diagnose
display ont failed-configuration 0/5/2 28
quit

# 4. Service-port
display service-port port 0/5/2 ont 28

# 5. Criar perfil TR-069 (config)
ont tr069-server-profile add ...

# 6. Bindar TR-069 (interface)
ont tr069-server-config 2 28 profile-id X

# 7. Criar service-port (config)
service-port ...

# 8. IP de gerenciamento (interface)
ont ipconfig 2 28 ip-index 0 dhcp vlan ...

# 9. Reset
ont reset 2 28
# ou
ont reset 2 28 factory
```
