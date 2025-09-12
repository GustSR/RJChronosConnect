# Documento de Comandos para OLT Huawei: Gerenciamento de ONT e ONU

Este documento compila comandos específicos para gerenciamento de Optical Network Terminals (ONT) e Optical Network Units (ONU) em Optical Line Terminals (OLT) da Huawei, focando em redes GPON/EPON. Os comandos são baseados em documentações oficiais e guias comuns para séries como MA5600T, MA5680T e MA5800. Eles são semelhantes entre versões, mas verifique a documentação específica do seu modelo (ex.: V800Rxxx para MA5600).

Os comandos estão organizados em seções: **Configuração e Adição de ONT/ONU**, **Exibição de Informações**, **Gerenciamento de Interfaces PON**, **Troubleshooting e Reset**, e **Outros Comandos Úteis**. Cada comando inclui sintaxe e uma explicação breve do que faz.

**Nota:** 
- Acesse o modo de configuração com `enable` e `config`.
- Para interfaces GPON: Use `interface gpon frame/slot` (ex.: `interface gpon 0/1` para frame 0, slot 1).
- Substitua parâmetros como `frame/slot/port` (F/S/P), `ontid`, `sn` por valores reais.
- ONT e ONU são termos intercambiáveis aqui, referindo-se a terminais ópticos.

## 1. Configuração e Adição de ONT/ONU

Esses comandos configuram perfis e adicionam ONTs/ONUs à OLT.

| Comando | Sintaxe | Explicação |
|---------|---------|------------|
| dba-profile add | `dba-profile add profile-name <nome> type3 assure <kbps> max <kbps>` | Cria um perfil de DBA (Dynamic Bandwidth Allocation) para alocação de banda em GPON. Exemplo: `dba-profile add profile-name fttd_dba type3 assure 8192 max 20480` (assegura 8 Mbps, máximo 20 Mbps). Usado para bind em perfis de linha. |
| ont-lineprofile gpon | `ont-lineprofile gpon profile-name <nome>`<br>`tcont <id> dba-profile-name <nome_dba>`<br>`gem add <id> eth tcont <tcont_id>`<br>`commit`<br>`quit` | Cria e configura um perfil de linha GPON para ONT. Bind T-CONT ao DBA, adiciona GEM ports para serviços (ex.: eth para Ethernet). Exemplo: Adiciona GEM 11-14 para gerenciamento, voz, vídeo e internet. |
| ont-srvprofile gpon | `ont-srvprofile gpon profile-name <nome>`<br>`ont-port vdsl <qtd> pots <qtd>`<br>`commit`<br>`quit` | Cria um perfil de serviço GPON para ONT, definindo portas (ex.: 1 VDSL e 2 POTS para voz). Bind a perfis de linha durante adição. |
| ont add | `interface gpon <frame/slot>`<br>`ont add <port> <ontid> password-auth <senha> once-on no-aging omci ont-lineprofile-name <nome> ont-srvprofile-name <nome>` | Adiciona uma ONT offline manualmente, usando SN ou senha. Exemplo: `ont add 0 1 password-auth 0100000001 once-on no-aging omci ont-lineprofile-name fttd ont-srvprofile-name fttd`. Descoberta: `once-on` ativa uma vez. |
| port ont-auto-find enable | `interface gpon <frame/slot>`<br>`port ont-auto-find enable`<br>`display ont autofind <port>`<br>`ont confirm <port> ontid <id> password-auth <senha> ...` | Ativa descoberta automática de ONTs. Exibe lista de ONTs descobertas e confirma/adiciona uma específica. Útil quando SN/senha desconhecidos. |
| gpon alarm-profile add | `gpon alarm-profile add` | Cria um perfil de alarme GPON para monitoramento de performance da linha ONT (padrão é perfil 1). |

## 2. Exibição de Informações

Comandos para visualizar status, histórico e detalhes de ONTs/ONUs.

| Comando | Sintaxe | Explicação |
|---------|---------|------------|
| display ont info by-sn | `display ont info by-sn <SN>` | Exibe informações de uma ONT por número de série (SN). Mostra F/S/P, ONT-ID, estado (online/offline), DBA, distância, autenticação, tempos de up/down. Exemplo: Identifica localização e causa de down (ex.: dying-gasp). |
| display ont info | `display ont info <frame> <slot> <port> all` | Exibe status de todas as ONTs em uma porta PON específica. Inclui ONT-ID, SN, flags de controle, estados de execução/configuração. |
| display ont register-info | `interface gpon <frame/slot>`<br>`display ont register-info <frame> <slot>` | Mostra histórico de registro de ONTs na porta, incluindo auth-type, SN, tipo, up/down times e causas de falha. |
| display ont optical-info | `display ont optical-info <frame> <slot> <port> <ontid>` | Exibe informações ópticas da ONT, como potência Rx/Tx, temperatura e thresholds de alarme. |
| display service-port | `display service-port <id>` ou `display service-port port <frame/slot/port> ont <ontid>` | Mostra detalhes de portas de serviço associadas a uma ONT, incluindo VLANs e bindings. |
| display mac-address | `display mac-address port <frame/slot/port> ont <ontid>`<br>`display mac-address vlan <vlan>`<br>`display mac-address service-port <id>` | Lista endereços MAC aprendidos por porta/ONT/VLAN/serviço. Útil para troubleshooting de conectividade. |
| display ont port state | `display ont port state <frame> <slot> <port> eth-port all` | Exibe estado (up/down) de portas Ethernet da ONT. |
| display ont port attribute | `display ont port attribute <frame> <slot> <port> eth <port_id>` | Mostra atributos de uma porta específica da ONT (ex.: velocidade, duplex). |
| display ont traffic | `display ont traffic <frame> <slot> <port> <ontid>` | Exibe tráfego atual (ingress/egress) para portas da ONT. |
| display statistics ont-eth | `display statistics ont-eth <frame> <slot> <port> ont-port <id>` | Mostra estatísticas de pacotes/erros para porta Ethernet da ONT. |

## 3. Gerenciamento de Interfaces PON

Comandos para configuração de interfaces PON relacionadas a ONTs/ONUs.

| Comando | Sintaxe | Explicação |
|---------|---------|------------|
| interface pon | `interface pon <interface-number>` ou `interface pon <interface-number>.subinterface-number` | Entra na view de interface PON para configuração de sub-interfaces GPON/EPON. |
| port mode | `port mode {adapt \| gpon \| epon}` | Configura modo de operação da porta PON: auto (adapt), GPON ou EPON. |
| laser | `laser {auto \| off \| on [time-value]}` | Controla o laser da interface PON: auto-detecta, desliga ou liga por tempo específico. |
| gpon-password | `gpon-password cipher <senha>` | Configura senha de autenticação para interface GPON (usada em ont add). |
| epon-password | `epon-password cipher <senha>` (para EPON) | Configura senha para autenticação EPON. |
| epon-loid | `epon-loid <loid>` | Configura LOID (Logical Identifier) para autenticação lógica em EPON. |
| epon-mac-address | `epon-mac-address <mac-address>` | Configura MAC para autenticação em EPON. |
| display gpon-info interface pon | `display gpon-info interface pon <interface-number>` | Exibe info da interface GPON: ONT-ID, SN, senha, status de link/registro. |
| display epon-info interface pon | `display epon-info interface pon <interface-number>` | Exibe info da interface EPON: modo laser, LLID, criptografia, autenticação. |
| display pon-statistic interface pon | `display pon-statistic interface pon <interface-number>` | Mostra estatísticas de tráfego (frames, bytes) na interface PON. |
| reset pon-statistic interface pon | `reset pon-statistic interface pon <interface-number>` | Limpa estatísticas de tráfego para reinício de coleta. |
| optical-module threshold | `optical-module threshold <rx-power \| tx-power \| bias \| temperature \| voltage> {lower-limit \| upper-limit} <valor>` | Define thresholds de alarme para módulo óptico (potência Rx/Tx, bias, temp, volt). Exemplo: `optical-module threshold rx-power lower-limit -28`. |
| undo optical-module threshold | `undo optical-module threshold` | Remove todos os thresholds de alarme do módulo óptico. |

## 4. Troubleshooting e Reset

Comandos para diagnóstico e manutenção.

| Comando | Sintaxe | Explicação |
|---------|---------|------------|
| ont reset | `interface gpon <frame/slot>`<br>`ont reset <port> <ontid>` | Reinicia uma ONT específica, útil para resolver falhas de conexão. |
| display board | `display board <frame>` ou `display board <frame/slot>` | Exibe status de boards/placas na OLT, incluindo GPON boards que gerenciam ONTs. |
| display port state | `interface gpon <frame/slot>`<br>`display port state all` ou `display port state <port_id>` | Mostra estado de portas PON (up/down, shutdown). |
| shutdown / undo shutdown | `shutdown <port_id>`<br>`undo shutdown <port_id>` | Desliga ou liga uma porta PON específica (afeta todas as ONTs conectadas). |
| display ont failed | `diagnose`<br>`display ont failed` | (Em modo diagnose) Lista ONTs com falhas de registro ou autenticação. |

## 5. Outros Comandos Úteis

| Comando | Sintaxe | Explicação |
|---------|---------|------------|
| display sysuptime | `display sysuptime` | Mostra tempo de atividade da OLT (útil para contexto geral de ONTs). |
| display version | `display version` ou `display version <frame/slot>` | Exibe versão de software/hardware da OLT/board GPON. |
| display current-configuration | `display current-configuration` | Mostra configuração atual da OLT, incluindo perfis de ONT. |

## Considerações Finais
- **Versões de OLT:** Esses comandos aplicam-se principalmente a séries MA560x/MA580x com firmware V800R+ (ex.: V800R010 para MA5608T). Para EPON, use equivalentes como `epon-` prefixos.
- **Segurança:** Sempre use autenticação (SN/password) ao adicionar ONTs para evitar acessos não autorizados.
- **Fontes:** Baseado em documentação Huawei e guias práticos.
- Para comandos completos, consulte o manual oficial da Huawei para sua versão específica (disponível em support.huawei.com).

Se precisar de mais detalhes ou exemplos para um modelo específico, forneça mais informações!



# Mapeamento de Comandos CLI e Informações SNMP para OLT Huawei: Gerenciamento de ONT/ONU

Este documento unifica todas as informações anteriores sobre comandos CLI para OLT Huawei (foco em ONT/ONU) e SNMP, criando um mapeamento prático. Para cada comando CLI principal, listo:
- **Descrição e Sintaxe:** O que o comando faz.
- **Informações Gerenciadas:** Dados que o comando acessa ou configura.
- **Equivalentes SNMP:** OIDs/MIBs correspondentes para polling (GET), traps ou SET (quando aplicável). SNMP permite monitorar os resultados dos comandos CLI, mas não substitui configuração completa (use CLI para adds/resets). Mapeamentos baseados em MIBs como HUAWEI-GPON-MIB, HUAWEI-ONU-MIB e HUAWEI-XPON-MIB.

Organizei em seções temáticas para facilitar. Todos os comandos CLI aplicam-se a séries MA5600T/MA5800 com firmwares V800R/V100R+ (ver lista de modelos no final). SNMPv2c/v3 é suportado; configure communities/traps na OLT.

**Notas Gerais:**
- **Mapeamento:** CLI é para configuração/ação; SNMP para monitoramento remoto (ex.: via NMS como eSight). Após um `ont add` CLI, use SNMP para query status.
- **Índices SNMP:** Use frame/slot/port/ONT-ID como índices (ex.: port 4194305792 = frame 0/slot 1/port 0).
- **Traps:** Muitos comandos geram traps (ex.: ONT offline após reset).
- **Fontes:** Documentação Huawei; verifique MIBs por firmware.

## 1. Configuração e Adição de ONT/ONU

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Equivalentes SNMP (OIDs/MIBs) |
|-------------|---------------------|--------------------------|-------------------------------|
| dba-profile add | `dba-profile add profile-name <nome> type3 assure <kbps> max <kbps>`<br>Ex.: `dba-profile add profile-name fttd_dba type3 assure 8192 max 20480` | Cria perfil DBA para alocação de banda (assegura/máx Mbps). Bind a T-CONTs. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.3 (hwGponOntLineProfileDbaProfileName) – Nome do perfil DBA associado.<br>- Trap: hwGponDeviceOntLineProfileChangeTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.1) para mudanças. |
| ont-lineprofile gpon | `ont-lineprofile gpon profile-name <nome>`<br>`tcont <id> dba-profile-name <nome_dba>`<br>`gem add <id> eth tcont <tcont_id>`<br>`commit` | Cria perfil de linha GPON: bind T-CONT/DBA, adiciona GEM ports para serviços (eth/voz/vídeo). | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.4 (hwGponOntLineProfileTcontList) – Lista de T-CONTs/GEMs.<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.3 (hwGponOntLineProfileName) – Nome do perfil.<br>- Trap: hwGponDeviceOntLineProfileChangeTrap. |
| ont-srvprofile gpon | `ont-srvprofile gpon profile-name <nome>`<br>`ont-port vdsl <qtd> pots <qtd>`<br>`commit` | Cria perfil de serviço: define portas (VDSL/POTS para voz/internet). | - MIB: HUAWEI-ONU-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.4 (hwGponOntSrvProfilePortType) – Tipos de portas (POTS/VDSL).<br>- Trap: hwGponDeviceOntSrvProfileChangeTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.2). |
| ont add | `interface gpon <frame/slot>`<br>`ont add <port> <ontid> password-auth <senha> once-on no-aging omci ont-lineprofile-name <nome> ont-srvprofile-name <nome>` | Adiciona ONT manualmente (SN/senha, perfis). Ativa descoberta uma vez. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1 (hwGponOntSerialNum) – SN da ONT adicionada.<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9 (hwGponDeviceOntDescription) – Detalhes de adição (ID, perfis).<br>- Trap: hwGponDeviceOntAddTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.3) para sucesso/falha. |
| port ont-auto-find enable | `interface gpon <frame/slot>`<br>`port ont-auto-find enable`<br>`display ont autofind <port>`<br>`ont confirm <port> ontid <id> password-auth <senha>` | Ativa auto-descoberta; exibe/confirma ONTs encontradas. | - MIB: HUAWEI-XPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.1.1 (hwXponDeviceAutoFindOntAge) – Tempo de envelhecimento de ONTs auto-found.<br>- Trap: hwGponDeviceOntAutoFindTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.4). |
| gpon alarm-profile add | `gpon alarm-profile add` | Cria perfil de alarme para performance ONT (thresholds). | - MIB: HUAWEI-ONU-MIB<br>- OID: hwOntAlarmProfile (1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1) – Perfil de thresholds (potência/temp).<br>- Trap: hwGponDeviceOntAlarmTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.5). |

## 2. Exibição de Informações

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Equivalentes SNMP (OIDs/MIBs) |
|-------------|---------------------|--------------------------|-------------------------------|
| display ont info by-sn | `display ont info by-sn <SN>` | Info por SN: F/S/P, ONT-ID, estado (online/offline), DBA, distância, auth, up/down times. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1 (hwGponOntSerialNum).<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9 (hwGponDeviceOntOnlineState=1/2).<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.46.1.20 (hwGponDeviceOntControlRanging – distância). |
| display ont info | `display ont info <frame> <slot> <port> all` | Status de todas ONTs em PON: ID, SN, flags, estados. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.21.1.10 (hwGponDeviceOltControlStatus).<br>- Trap: hwGponDeviceOntStateChangeTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.6). |
| display ont register-info | `interface gpon <frame/slot>`<br>`display ont register-info <frame> <slot>` | Histórico de registro: auth-type, SN, tipo, up/down, falhas. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9 (hwGponDeviceOntRegisterInfo).<br>- Trap: hwGponDeviceOntRegisterFailTrap. |
| display ont optical-info | `display ont optical-info <frame> <slot> <port> <ontid>` | Info óptica: RX/TX power, temp, thresholds. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4 (RX Power ONT).<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.51.1.3 (TX Power).<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.51.1.7 (CATV RX). |
| display service-port | `display service-port <id>` ou `display service-port port <frame/slot/port> ont <ontid>` | Portas de serviço: VLANs, bindings. | - MIB: HUAWEI-ONU-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.62.1.1 (hwGponDeviceOntServicePortVlan).<br>- Trap: hwGponDeviceOntServicePortChangeTrap. |
| display mac-address | `display mac-address port <frame/slot/port> ont <ontid>`<br>`display mac-address vlan <vlan>`<br>`display mac-address service-port <id>` | MACs aprendidos por porta/ONT/VLAN/serviço. | - MIB: IF-MIB + HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.2.1.4.22.1.2 (ifTable – MACs em portas).<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.62.1.1 (hwGponDeviceOntEthernetMac). |
| display ont port state | `display ont port state <frame> <slot> <port> eth-port all` | Estado portas ETH (up/down). | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.62.1.22 (hwGponDeviceOntEthernetOnlineState). |
| display ont port attribute | `display ont port attribute <frame> <slot> <port> eth <port_id>` | Atributos porta ETH (velocidade/duplex). | - MIB: IF-MIB<br>- OID: 1.3.6.1.2.1.2.2.1.5 (ifSpeed – velocidade). |
| display ont traffic | `display ont traffic <frame> <slot> <port> <ontid>` | Tráfego atual (ingress/egress) portas ONT. | - MIB: IF-MIB<br>- OID: 1.3.6.1.2.1.2.2.1.10 (ifInOctets/ifOutOctets). |
| display statistics ont-eth | `display statistics ont-eth <frame> <slot> <port> ont-port <id>` | Estatísticas pacotes/erros porta ETH. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.62.1.1 (hwGponDeviceOntEthernetStatistics). |

## 3. Gerenciamento de Interfaces PON

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Equivalentes SNMP (OIDs/MIBs) |
|-------------|---------------------|--------------------------|-------------------------------|
| interface pon | `interface pon <interface-number>` | Entra view interface PON para config sub-interfaces. | - MIB: HUAWEI-XPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.1.1 (hwXponDevicePonIfIndex). |
| port mode | `port mode {adapt \| gpon \| epon}` | Config modo PON (GPON/EPON/auto). | - MIB: HUAWEI-XPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.1.2 (hwXponDevicePonMode). |
| laser | `laser {auto \| off \| on [time-value]}` | Controla laser PON. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.21.1.1 (hwGponDeviceOltLaserState).<br>- Trap: hwGponDevicePonLaserChangeTrap. |
| gpon-password | `gpon-password cipher <senha>` | Senha auth GPON. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.2 (hwGponOntPassword). |
| epon-password / epon-loid / epon-mac-address | `epon-password cipher <senha>`<br>`epon-loid <loid>`<br>`epon-mac-address <mac>` | Auth EPON (senha/LOID/MAC). | - MIB: HUAWEI-XPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.1.3 (hwXponDeviceEponAuthParams). |
| display gpon-info interface pon | `display gpon-info interface pon <interface-number>` | Info GPON: ONT-ID, SN, senha, status. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.21.1.10 (hwGponDeviceOltControlStatus). |
| display epon-info interface pon | `display epon-info interface pon <interface-number>` | Info EPON: laser, LLID, cripto, auth. | - MIB: HUAWEI-XPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.1.4 (hwXponDeviceEponLlid). |
| display pon-statistic interface pon | `display pon-statistic interface pon <interface-number>` | Estatísticas tráfego PON (frames/bytes). | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.51.1 (PON Statistics). |
| reset pon-statistic interface pon | `reset pon-statistic interface pon <interface-number>` | Limpa estatísticas PON. | - MIB: SNMP-MIB<br>- OID: 1.3.6.1.2.1.11.1 (snmpInPkts – reset indireto via SET). |
| optical-module threshold | `optical-module threshold <rx-power ...> {lower-limit \| upper-limit} <valor>` | Define thresholds módulo óptico. | - MIB: HUAWEI-ONU-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1 (hwOntAlarmProfileThresholds).<br>- Trap: hwGponDeviceOpticalAlarmTrap. |
| undo optical-module threshold | `undo optical-module threshold` | Remove thresholds. | - MIB: HUAWEI-ONU-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1 (SET para default). |

## 4. Troubleshooting e Reset

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Equivalentes SNMP (OIDs/MIBs) |
|-------------|---------------------|--------------------------|-------------------------------|
| ont reset | `interface gpon <frame/slot>`<br>`ont reset <port> <ontid>` | Reinicia ONT. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9 (hwGponDeviceOntControlReset).<br>- Trap: hwGponDeviceOntResetTrap (1.3.6.1.4.1.2011.6.128.1.1.2.0.7). |
| display board | `display board <frame>` | Status boards (incl. GPON). | - MIB: HUAWEI-DEVICE-MIB<br>- OID: 1.3.6.1.4.1.2011.6.3.27 (hwDeviceBoardStatus). |
| display port state | `interface gpon <frame/slot>`<br>`display port state all` | Estado portas PON. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.21.1.10 (hwGponDeviceOltPortState). |
| shutdown / undo shutdown | `shutdown <port_id>` / `undo shutdown <port_id>` | Liga/desliga porta PON. | - MIB: IF-MIB<br>- OID: 1.3.6.1.2.1.2.2.1.7 (ifAdminStatus – SET 1/2). |
| display ont failed | `diagnose`<br>`display ont failed` | ONTs com falhas. | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9 (hwGponDeviceOntFailReason).<br>- Trap: hwGponDeviceOntFailTrap. |

## 5. Outros Comandos Úteis

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Equivalentes SNMP (OIDs/MIBs) |
|-------------|---------------------|--------------------------|-------------------------------|
| display sysuptime | `display sysuptime` | Tempo de atividade OLT. | - MIB: SNMP-MIB<br>- OID: 1.3.6.1.2.1.25.1.1.0 (sysUpTimeInstance). |
| display version | `display version` | Versão software/hardware. | - MIB: HUAWEI-DEVICE-MIB<br>- OID: 1.3.6.1.4.1.2011.6.3.27 (hwDeviceVersion). |
| display current-configuration | `display current-configuration` | Config atual (incl. perfis ONT). | - MIB: HUAWEI-GPON-MIB<br>- OID: 1.3.6.1.4.1.2011.6.128.1.1.2.43.1.3 (hwGponOntLineProfileName – perfis). |

## Lista de Modelos e Firmwares (Resumo Integrado)

Para compatibilidade: Todos os comandos/SNMP acima funcionam em firmwares listados; diferenças mínimas (ex.: V100R+ adiciona OIDs para 10G PON).

| Série/Modelo | Firmwares Disponíveis | Suporte Específico (CLI/SNMP) |
|--------------|-----------------------|-------------------------------|
| MA5600T (MA5603T, MA5608T, MA5680T, MA5683T) | V800R008C02 a V800R019C10 | CLI completo; SNMP MIBs básicas + traps para GPON. R015+ suporta mais OIDs ópticos. |
| MA5800 (X2, X7, X15, X17) | V100R016C00 a V100R024C00 | CLI estendida para 50G; SNMP com OIDs avançados (ex.: VR/QoS). Todos traps granulares. |

## Considerações Finais
- **Integração CLI-SNMP:** Use CLI para setup inicial; SNMP para monitoramento contínuo (polling a cada 5-60s). Ex.: Após `ont add`, poll OID status para confirmar.
- **Ferramentas:** Para NMS, integre via eSight (sincroniza CLI/SNMP). SNMP SET possível para alguns (ex.: thresholds), mas CLI é preferido para segurança.
- **Segurança:** Ative traps com `snmp-agent trap enable gpon`; use v3 para auth.

Se quiser exportar como PDF ou expandir um mapeamento, avise!



# Mapeamento de Comandos CLI e Informações via Telnet para OLT Huawei: Gerenciamento de ONT/ONU

Este documento complementa os anteriores, detalhando como o protocolo **Telnet** é usado para gerenciar ONTs/ONUs em OLTs Huawei (séries MA5600T/MA5800) e mapeando os comandos CLI (já listados) com as informações acessíveis via Telnet. O Telnet é um protocolo de acesso remoto que permite executar comandos CLI diretamente na OLT, oferecendo controle total de configuração e monitoramento, ao contrário do SNMP, que é mais voltado para monitoramento e traps. Aqui, explico como o Telnet se integra ao gerenciamento de ONT/ONU, as informações que ele gerencia, e como os comandos CLI se relacionam com a interface Telnet.

**Notas Gerais:**
- **Telnet vs. SNMP:** Telnet executa comandos CLI completos (configuração, display, reset) via conexão TCP (porta 23), enquanto SNMP usa UDP (porta 161) para polling/traps, com menos capacidade de configuração. Telnet é ideal para administração direta; SNMP, para automação em NMS.
- **Acesso Telnet:** 
  - Ative com `telnet server enable` na OLT.
  - Configure usuário/senha: `aaa` > `local-user <nome> password cipher <senha> service-type telnet`.
  - Exemplo de conexão: `telnet <IP_OLT>` (ex.: `telnet 192.168.1.1`), login com usuário/senha.
  - Segurança: Use ACLs (`acl number <id>` > `rule permit source <IP_NMS>`) e, preferencialmente, SSH (mais seguro) em vez de Telnet em redes externas.
- **Informações Gerenciadas:** Telnet dá acesso a **todos** os comandos CLI listados anteriormente, permitindo configuração, exibição de status, troubleshooting e reset de ONTs/ONUs. Diferentemente do SNMP, que lê/monitora via OIDs, Telnet executa ações diretamente (ex.: `ont add`, `ont reset`).
- **Versões/Firmwares:** Comandos aplicam-se a MA5600T (V800R008C02–V800R019C10) e MA5800 (V100R016C00–V100R024C00). Telnet é suportado universalmente; diferenças estão nos comandos CLI disponíveis por firmware (detalhado abaixo).
- **Fontes:** Baseado em documentação Huawei e guias práticos.

## Mapeamento de Comandos CLI e Informações via Telnet

Abaixo, listo os principais comandos CLI (organizados como nos documentos anteriores) com:
- **Descrição e Sintaxe:** Função do comando.
- **Informações Gerenciadas:** Dados configurados/exibidos.
- **Uso via Telnet:** Como o comando é executado e o que Telnet retorna (saída textual). Telnet retorna o mesmo output da CLI local (console serial), mas requer conexão remota estável.

### 1. Configuração e Adição de ONT/ONU

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Uso via Telnet |
|-------------|---------------------|--------------------------|----------------|
| dba-profile add | `dba-profile add profile-name <nome> type3 assure <kbps> max <kbps>` | Cria perfil DBA para banda (ex.: 8 Mbps assegurado, 20 Mbps máx). | Via Telnet, execute: `telnet <IP_OLT>`, login, entre em modo config (`enable`, `config`), digite comando. Retorna: `DBA profile <nome> added successfully`. |
| ont-lineprofile gpon | `ont-lineprofile gpon profile-name <nome>`<br>`tcont <id> dba-profile-name <nome_dba>`<br>`gem add <id> eth tcont <tcont_id>`<br>`commit` | Configura perfil de linha (T-CONT, GEM ports). | Telnet: Após login, entre em modo config, execute. Saída: `Profile <nome> committed`. Use `display ont-lineprofile gpon` para verificar. |
| ont-srvprofile gpon | `ont-srvprofile gpon profile-name <nome>`<br>`ont-port vdsl <qtd> pots <qtd>`<br>`commit` | Define portas de serviço (VDSL/POTS). | Telnet: Executa em modo config. Retorna: `Service profile <nome> created`. Verifique com `display ont-srvprofile gpon`. |
| ont add | `interface gpon <frame/slot>`<br>`ont add <port> <ontid> password-auth <senha> once-on no-aging omci ont-lineprofile-name <nome> ont-srvprofile-name <nome>` | Adiciona ONT (SN/senha, perfis). | Telnet: Entre em `interface gpon <F/S>`, execute. Saída: `ONT <ontid> added successfully`. Confirme com `display ont info`. |
| port ont-auto-find enable | `interface gpon <frame/slot>`<br>`port ont-auto-find enable`<br>`display ont autofind <port>`<br>`ont confirm <port> ontid <id> password-auth <senha>` | Ativa auto-descoberta; confirma ONTs. | Telnet: Ative auto-find, use `display ont autofind` para listar. Saída: Tabela com SNs. Execute `ont confirm` para adicionar. |
| gpon alarm-profile add | `gpon alarm-profile add` | Cria perfil de alarme para ONT. | Telnet: Execute em modo config. Retorna: `Alarm profile added`. Verifique com `display gpon alarm-profile`. |

**Telnet Específico:** Comandos de configuração exigem privilégios admin (`enable`). Telnet retorna saídas textuais idênticas ao console, mas falhas (ex.: SN duplicado) são exibidas como erros (ex.: `Error: SN already exists`).

### 2. Exibição de Informações

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Uso via Telnet |
|-------------|---------------------|--------------------------|----------------|
| display ont info by-sn | `display ont info by-sn <SN>` | Info por SN: F/S/P, ONT-ID, estado, DBA, distância, auth. | Telnet: Execute após login. Saída: Tabela com ONT-ID, estado (Online/Offline), potência, etc. Ex.: `State: Online, Distance: 1234m`. |
| display ont info | `display ont info <frame> <slot> <port> all` | Status todas ONTs em porta PON. | Telnet: Saída é tabela com ONT-IDs, SNs, estados. Ex.: `ONT-ID 0, SN: 48575443, State: Online`. |
| display ont register-info | `interface gpon <frame/slot>`<br>`display ont register-info <frame> <slot>` | Histórico de registro: auth, SN, falhas. | Telnet: Executa em interface gpon. Retorna: Tabela com timestamps, causas de falha (ex.: `LOS`, `Dying-gasp`). |
| display ont optical-info | `display ont optical-info <frame> <slot> <port> <ontid>` | RX/TX power, temp, thresholds. | Telnet: Saída detalha: `RX Power: -13.11 dBm, Temp: 45C`. Útil para diagnose remota. |
| display service-port | `display service-port <id>` ou `display service-port port <frame/slot/port> ont <ontid>` | Portas de serviço: VLANs, bindings. | Telnet: Retorna tabela com VLAN-ID, GEM port, tipo de serviço. Ex.: `Service-port 1, VLAN 100, Type: Internet`. |
| display mac-address | `display mac-address port <frame/slot/port> ont <ontid>` | MACs aprendidos por porta/ONT/VLAN. | Telnet: Lista MACs. Ex.: `MAC: 00:1A:2B:3C:4D:5E, Port: 0/1/0/0`. |
| display ont port state | `display ont port state <frame> <slot> <port> eth-port all` | Estado portas ETH (up/down). | Telnet: Saída: `ETH Port 1: Up, Port 2: Down`. |
| display ont port attribute | `display ont port attribute <frame> <slot> <port> eth <port_id>` | Atributos porta ETH (velocidade/duplex). | Telnet: Ex.: `Port 1: 1000Mbps, Full-duplex`. |
| display ont traffic | `display ont traffic <frame> <slot> <port> <ontid>` | Tráfego ingress/egress. | Telnet: Retorna: `Ingress: 123456 bytes, Egress: 654321 bytes`. |
| display statistics ont-eth | `display statistics ont-eth <frame> <slot> <port> ont-port <id>` | Pacotes/erros porta ETH. | Telnet: Tabela com `Packets: 1000, Errors: 0`. |

**Telnet Específico:** Comandos `display` são ideais para monitoramento remoto via Telnet, pois retornam saídas formatadas (tabelas ou texto). Use `scroll` em sessões Telnet para pausar outputs longos.

### 3. Gerenciamento de Interfaces PON

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Uso via Telnet |
|-------------|---------------------|--------------------------|----------------|
| interface pon | `interface pon <interface-number>` | Entra view PON para sub-interfaces. | Telnet: Após login, execute para entrar no modo PON. Saída: Prompt muda para `<OLT>(pon-<interface>)`. |
| port mode | `port mode {adapt \| gpon \| epon}` | Config modo PON (GPON/EPON). | Telnet: Executa em modo PON. Retorna: `Port mode set to GPON`. |
| laser | `laser {auto \| off \| on [time-value]}` | Controla laser PON. | Telnet: Saída: `Laser state changed to ON`. Verifique com `display port state`. |
| gpon-password | `gpon-password cipher <senha>` | Senha auth GPON. | Telnet: Configura em modo PON. Retorna: `Password set successfully`. |
| epon-password / epon-loid / epon-mac-address | `epon-password cipher <senha>`<br>`epon-loid <loid>`<br>`epon-mac-address <mac>` | Auth EPON (senha/LOID/MAC). | Telnet: Executa em modo PON. Saída: `EPON authentication configured`. |
| display gpon-info interface pon | `display gpon-info interface pon <interface-number>` | Info GPON: ONT-ID, SN, status. | Telnet: Tabela com ONT-IDs, estados, SNs. Ex.: `Port 0/1/0, ONTs: 5, Online: 4`. |
| display epon-info interface pon | `display epon-info interface pon <interface-number>` | Info EPON: laser, LLID, cripto. | Telnet: Ex.: `LLID: 1234, Encryption: Enabled`. |
| display pon-statistic interface pon | `display pon-statistic interface pon <interface-number>` | Tráfego PON (frames/bytes). | Telnet: Ex.: `Frames: 100000, Bytes: 123456789`. |
| reset pon-statistic interface pon | `reset pon-statistic interface pon <interface-number>` | Limpa estatísticas PON. | Telnet: Retorna: `Statistics reset successfully`. |
| optical-module threshold | `optical-module threshold <rx-power ...> {lower-limit \| upper-limit} <valor>` | Define thresholds ópticos. | Telnet: Saída: `Threshold set: RX Power Lower -28 dBm`. |
| undo optical-module threshold | `undo optical-module threshold` | Remove thresholds. | Telnet: `Thresholds cleared`. |

**Telnet Específico:** Configurações de interface PON são críticas; Telnet permite ajustes em tempo real, mas conexão instável pode interromper comandos. Use `commit` para salvar.

### 4. Troubleshooting e Reset

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Uso via Telnet |
|-------------|---------------------|--------------------------|----------------|
| ont reset | `interface gpon <frame/slot>`<br>`ont reset <port> <ontid>` | Reinicia ONT. | Telnet: Executa em modo gpon. Saída: `ONT <ontid> reset successfully`. Confirme com `display ont info`. |
| display board | `display board <frame>` | Status boards GPON. | Telnet: Tabela com slots, estados (ex.: `Slot 1: GPON, Active`). |
| display port state | `interface gpon <frame/slot>`<br>`display port state all` | Estado portas PON. | Telnet: Ex.: `Port 0: Up, Port 1: Down`. |
| shutdown / undo shutdown | `shutdown <port_id>` / `undo shutdown <port_id>` | Liga/desliga porta PON. | Telnet: Saída: `Port <port_id> shutdown` ou `Port enabled`. |
| display ont failed | `diagnose`<br>`display ont failed` | ONTs com falhas. | Telnet: Em modo diagnose, lista falhas. Ex.: `ONT-ID 0, Fail Reason: LOS`. |

**Telnet Específico:** Modo `diagnose` via Telnet é útil para troubleshooting remoto, mas exige privilégios elevados.

### 5. Outros Comandos Úteis

| Comando CLI | Descrição e Sintaxe | Informações Gerenciadas | Uso via Telnet |
|-------------|---------------------|--------------------------|----------------|
| display sysuptime | `display sysuptime` | Tempo de atividade OLT. | Telnet: Ex.: `System Up Time: 123 days, 04:56:12`. |
| display version | `display version` | Versão software/hardware. | Telnet: Ex.: `Version: V800R018C10, Board: H801GICF`. |
| display current-configuration | `display current-configuration` | Config atual (perfis ONT). | Telnet: Retorna config completa (longa). Use `scroll` para navegar. |

**Telnet Específico:** `display current-configuration` pode gerar saídas extensas; use ferramentas como PuTTY com logging para capturar.

## Comparação Telnet vs. SNMP

| Aspecto | Telnet | SNMP |
|---------|--------|------|
| **Função** | Executa todos os comandos CLI (config, display, reset). | Monitora via OIDs (GET), configura via SET (limitado), recebe traps. |
| **Acesso** | Conexão TCP (porta 23); login com usuário/senha. | UDP (161 para GET/SET, 162 para traps); usa community (v2c) ou auth (v3). |
| **Informações** | Tudo: status ONT, potência, tráfego, config, reset, históricos. | Status, potência, tráfego, alarmes; limitado a OIDs disponíveis (ex.: 1.3.6.1.4.1.2011.6.128). |
| **Uso Típico** | Administração manual, mudanças em tempo real. | Monitoramento automatizado, integração com NMS (eSight/Zabbix). |
| **Segurança** | Inseguro (texto puro); prefira SSH. | SNMPv3 seguro; v2c usa community simples. |
| **Exemplo** | `telnet 192.168.1.1`, `ont reset 0/1/0 0` → `ONT reset successfully`. | `snmpwalk -v 2c -c public 192.168.1.1 1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4` → `RX Power: -1311`. |

## Modelos e Firmwares Suportados

| Série/Modelo | Firmwares Disponíveis | Suporte Telnet |
|--------------|-----------------------|----------------|
| MA5600T (MA5603T, MA5608T, MA5680T, MA5683T) | V800R008C02–V800R019C10 | Telnet universal; todos comandos CLI suportados. R015+ inclui mais comandos (ex.: 1:128 split). |
| MA5800 (X2, X7, X15, X17) | V100R016C00–V100R024C00 | Telnet completo; R022+ adiciona comandos para 50G PON e ONT third-party. |

## Considerações Finais
- **Telnet em Produção:** Use com cuidado; conexões instáveis podem interromper comandos críticos. Prefira SSH (`ssh server enable`) para segurança.
- **Integração CLI-Telnet:** Telnet é apenas o transporte; comandos CLI são idênticos ao console local. Saídas podem ser capturadas via logging (ex.: PuTTY).
- **Telnet vs. SNMP:** Telnet para configuração/troubleshooting; SNMP para monitoramento em larga escala. Ex.: Use Telnet para `ont add`, SNMP para monitorar `RX Power`.
- **Fontes:** Documentação Huawei (support.huawei.com), guias práticos.

Se precisar de exemplos de scripts Telnet (ex.: via Python `telnetlib`) ou exportar como PDF, é só pedir!

# Guia Completo de Configuração de OLT Huawei: Foco em PON, VLAN Upstream e Configurações Importantes

Este documento resume as configurações mais importantes para uma OLT Huawei (séries MA5600T e MA5800), com ênfase em PON (GPON/EPON), VLANs no upstream (uplink ports para links de VLAN) e binding de serviços. Baseado em documentações oficiais da Huawei e guias práticos, cubro comandos CLI, passos essenciais, considerações por modelo/firmware e acesso via SSH, Telnet e SNMP.

As configurações mais importantes para uma OLT incluem:
1. **Setup Inicial:** Configurar IP de gerenciamento em VLAN (ex.: VLAN 10), habilitar portas upstream como trunk para múltiplas VLANs.
2. **Configuração PON:** Habilitar portas PON, criar perfis DBA (banda), line (T-CONT/GEM) e service (portas ETH/POTS), adicionar ONTs/ONUs via SN ou auto-find.
3. **Configuração VLAN:** Criar VLANs smart (para tagging), adicionar portas upstream (uplink, ex.: GE0/10GE) como trunk, configurar native VLAN em portas ONT para upstream, e bind service-ports a GEM ports com VLANs específicas.
4. **Binding de Serviços:** Criar service-ports para mapear VLANs de ONT a uplink, garantindo tráfego upstream (ex.: internet via VLAN 100).
5. **Segurança e Acesso:** Habilitar SSH/Telnet para CLI remota, SNMP para monitoramento.
6. **Troubleshooting:** Display de status PON/VLAN, reset se necessário.

**Notas Gerais:**
- **Upstream VLAN Links:** Portas uplink (ex.: 0/10/0) devem ser trunk para permitir múltiplas VLANs. Use `port vlan <id> <port>` para adicionar VLANs. Em ONTs, `ont port native-vlan` define VLAN default para upstream.
- **Compatibilidade:** Comandos são semelhantes entre firmwares, mas V100R+ (MA5800) suporta 10G/50G PON e mais VLANs (até 4096). Verifique HedEx Huawei para sua versão.
- **Acesso CLI:** Use `enable` > `config` para modo configuração. Salve com `save` ou `commit`.
- **Fontes:** Documentação Huawei, guias GPON Solution.

## Modelos de OLT e Firmwares Suportados

| Série/Modelo | Firmwares Disponíveis | Suporte Específico |
|--------------|-----------------------|--------------------|
| MA5600T (MA5603T, MA5608T, MA5680T, MA5683T) | V800R008C02 a V800R019C10 | PON GPON/EPON até 1:128; VLAN trunk em uplink (GE/10GE); SNMPv3 completo. V800R015+ suporta multi-VLAN upstream avançado e FEC obrigatório. |
| MA5800 (X2, X7, X15, X17) | V100R016C00 a V100R024C00 | Suporte 10G/50G PON; VLANIF para roteamento upstream; integra com eSight. V100R022+ adiciona QoS DBA para VLANs e traps SNMP para VLAN changes. |

## Configurações Importantes e Comandos CLI

### 1. Setup Inicial (IP Gerenciamento e Uplink)

Essencial para acesso remoto. Configure VLAN de gerenciamento (ex.: 10) e uplink como trunk.

| Passo | Comando | Explicação |
|-------|---------|------------|
| Criar VLAN Gerenciamento | `vlan 10 smart`<br>`vlan desc 10 "Management"` | Cria VLAN smart (suporta tagging). |
| Adicionar Uplink Port à VLAN | `port vlan 10 0/8 0` (ex.: slot 8, port 0)<br>`interface giu 0/8`<br>`network-role 0 uplink` | Adiciona porta upstream (ex.: GE0/8) como trunk para VLAN 10. Uplink deve ser trunk no switch conectado. |
| Configurar IP VLANIF | `interface vlanif 10`<br>`ip address 192.168.10.2 255.255.255.0`<br>`quit`<br>`ip route-static 0.0.0.0 0.0.0.0 192.168.10.1` | Atribui IP à VLANIF para gerenciamento remoto. Default: 10.11.104.2/24. |
| Habilitar Porta ETH Local | `interface meth 0`<br>`ip address 1.1.1.2 255.255.255.0` | Para console local (não upstream). |
| Salvar Config | `save` | Persiste mudanças. |

**Exemplo para Upstream Multi-VLAN:** Para VLANs 100 (internet), 200 (voz): `port vlan 100 0/10 0`, `port vlan 200 0/10 0`. Uplink porta deve permitir tagged/untagged.

### 2. Configuração PON (Habilitar Portas e Perfis)

Habilite PON ports, crie perfis para banda e serviços.

| Passo | Comando | Explicação |
|-------|---------|------------|
| Habilitar PON Port | `interface gpon 0/3` (ex.: frame 0, slot 3)<br>`port 0 ont-auto-find enable`<br>`laser on`<br>`undo shutdown` | Entra modo PON, ativa auto-find ONTs, liga laser. Para EPON: `interface epon 0/3`. |
| Criar DBA Profile | `dba-profile add profile-id 10 profile-name "maxbw" type4 max 9535488` | Define banda upstream (type4: máx 1Gbps). Bind a T-CONT. |
| Criar Line Profile | `ont-lineprofile gpon profile-id 1 profile-name "ont"`<br>`tcont 1 dba-profile-id 10`<br>`gem add 1 eth tcont 1`<br>`gem mapping 1 0 vlan 100` (ex.: VLAN 100 upstream)<br>`commit`<br>`quit` | Bind T-CONT/DBA, GEM port para ETH, mapeia VLAN para upstream. |
| Criar Service Profile | `ont-srvprofile gpon profile-id 1 profile-name "wan"`<br>`ont-port pots adaptive 32 eth adaptive 8`<br>`port vlan eth 1 transparent`<br>`commit`<br>`quit` | Define portas ONT (ETH/POTS), transparent para VLAN tag. |
| Adicionar ONT | `display ont autofind all`<br>`ont add 0 0 sn-auth <SN> omci ont-lineprofile-id 1 ont-srvprofile-id 1`<br>`ont fec 0 0 enable`<br>`ont port native-vlan 0 0 eth 1 vlan 100 priority 0` | Auto-find SN, adiciona ONT, habilita FEC, define native VLAN para upstream (ex.: 100). |
| Verificar PON | `display port state 0/3 all`<br>`display ont info 0 3 0 all` | Estado portas/ONTs. |

**Considerações por Firmware:** Em V800R, type3 DBA para assured bandwidth; V100R+ suporta type5 para 10G PON.

### 3. Configuração VLAN Upstream e Binding de Serviços

Para links VLAN upstream: Bind service-ports a GEM para tráfego de ONT fluir para uplink.

| Passo | Comando | Explicação |
|-------|---------|------------|
| Criar VLAN Serviço | `vlan 100 smart`<br>`vlan desc 100 "Internet"` | VLAN para upstream (ex.: 100). |
| Adicionar Uplink à VLAN Serviço | `port vlan 100 0/10 0` (ex.: uplink slot 10, port 0) | Adiciona uplink como trunk para VLAN 100. |
| Criar Service-Port | `service-port 0 vlan 100 gpon 0/3/0 ont 0 gemport 1 multi-service user-vlan 100 tag-transform transparent`<br>`service-port vlan 100 second-vlan 200` (opcional para QinQ) | Bind VLAN 100 de ONT a GEM port, transparent tag para upstream. Para multi-VLAN: Use trunk em ONT (`ont port native-vlan` + `ont port vlan` para adicionais). |
| QinQ para Upstream | `vlan 200 smart`<br>`qinq vlan 100 mapping 200` (ex.: outer 100, inner 200) | Para stacking VLANs em upstream. |
| Verificar VLAN | `display vlan all`<br>`display service-port 0`<br>`display mac-address vlan 100` | Lista VLANs, service-ports, MACs por VLAN. |

**Upstream Específico:** Uplink ports (ex.: GIU board) conectam OLT a core switch. Configure como trunk: `port link-type trunk`, `port trunk allow-pass vlan 100 200`. Para native untagged: `port trunk pvid vlan 100`.

### 4. Outras Configurações Importantes

- **Link-Aggregation Upstream:** Para redundância: `link-aggregation eth-trunk 1`, `interface giu 0/10`, `eth-trunk 1`, `port link-type trunk`, `port trunk allow-pass vlan all`.
- **QoS/DBA Upstream:** Bind DBA a VLAN em service-port.
- **Multicast (BTV/VoIP):** `btv enable`, `igmp user add service-port 1`, `multicast-vlan 1000`.
- **Save e Backup:** `display current-configuration`, `backup configuration tftp <IP> <file>`.

## Acesso via SSH, Telnet e SNMP

### SSH (Seguro, Porta 22)
- **Habilitar:** `ssh server enable`<br>`stelnet server enable` (para secure Telnet via SSH).<br>`aaa local-user admin password cipher <senha> service-type ssh`.
- **Acesso:** `ssh admin@<IP_OLT>`. Executa CLI completo (todos comandos acima). Preferível a Telnet por criptografia.
- **Por Modelo/Firmware:** Suportado em todos; V100R+ requer `ssh user <user> authentication-type password`.
- **Uso:** Mesma CLI que console; ideal para config remota segura de PON/VLAN.

### Telnet (Inseguro, Porta 23)
- **Habilitar:** `telnet server enable`<br>`vty 0 4`<br>`user privilege level 15`<br>`authentication-mode password`.
- **Acesso:** `telnet <IP_OLT>`, login root/admin. Executa todos comandos CLI.
- **Por Modelo/Firmware:** Universal; desabilite em produção: `undo telnet server enable`.
- **Uso:** Para setup inicial/VLAN upstream; capture outputs com PuTTY logging.

### SNMP (Monitoramento, UDP 161/162)
- **Habilitar:** `snmp-agent sys-info version v2c`<br>`snmp-agent community read public`<br>`snmp-agent target-host trap address <NMS_IP> udp-port 162 param v2c public`<br>`snmp-agent trap enable standard gpon`.
- **OIDs para PON/VLAN:** 
  - VLAN: 1.3.6.1.4.1.2011.5.6.1.2.1.5 (hwVlanInterfaceAdminStatus).
  - PON Status: 1.3.6.1.4.1.2011.6.128.1.1.2.21.1.10 (hwGponDeviceOltControlStatus).
  - Upstream Tráfego: 1.3.6.1.2.1.2.2.1.10 (ifInOctets em uplink ports).
  - Traps: hwGponDeviceOntStateChangeTrap para mudanças PON/VLAN.
- **Por Modelo/Firmware:** MIBs HUAWEI-GPON-MIB/VLAN-MIB em V800R+; V100R+ adiciona OIDs para 10G PON e VLAN QoS. Use GET para monitorar, SET limitado (ex.: thresholds).
- **Uso:** Polling para status VLAN upstream (ex.: snmpwalk para ifTable em uplink); traps para alertas PON offline. Integre com NMS para automação.

## Considerações Finais
- **Teste:** Após config, verifique conectividade: `ping` de OLT a core, `display ont traffic` para upstream flow.
- **Segurança:** Use SSH; configure ACLs em uplink: `acl 2000 rule permit ip source <trusted>`.
- **Erros Comuns:** Mismatch trunk/native VLAN causa perda de link upstream; verifique com `display port vlan`.
- Para firmwares específicos, baixe HedEx em support.huawei.com.

Se precisar de exemplos para modelo exato ou scripts, forneça detalhes!