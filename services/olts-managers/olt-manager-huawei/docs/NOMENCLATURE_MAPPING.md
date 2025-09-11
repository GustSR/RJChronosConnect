# Plano de Padronização de Nomenclatura

## Arquivos a Renomear (CLI Commands)

| Arquivo Atual | Novo Nome | Classe Atual | Nova Classe |
|---------------|-----------|--------------|-------------|
| display_board.py | get_board_cli.py | DisplayBoardCommand | GetBoardCliCommand |
| display_mac_address.py | get_mac_address_cli.py | DisplayMacAddressCommand | GetMacAddressCliCommand |
| display_ont_autofind.py | get_ont_autofind_cli.py | DisplayOntAutofindCommand | GetOntAutofindCliCommand |
| display_ont_failed.py | get_ont_failed_cli.py | DisplayOntFailedCommand | GetOntFailedCliCommand |
| display_ont_info.py | get_ont_info_cli.py | DisplayOntInfoCommand | GetOntInfoCliCommand |
| display_ont_port_attribute.py | get_ont_port_attribute_cli.py | DisplayOntPortAttributeCommand | GetOntPortAttributeCliCommand |
| display_ont_register_info.py | get_ont_register_info_cli.py | DisplayOntRegisterInfoCommand | GetOntRegisterInfoCliCommand |
| display_ont_traffic.py | get_ont_traffic_cli.py | DisplayOntTrafficCommand | GetOntTrafficCliCommand |
| display_port_state.py | get_port_state_cli.py | DisplayPortStateCommand | GetPortStateCliCommand |
| display_service_port.py | get_service_port_cli.py | DisplayServicePortCommand | GetServicePortCliCommand |
| display_statistics_ont_eth.py | get_ont_eth_stats_cli.py | DisplayStatisticsOntEthCommand | GetOntEthStatsCliCommand |

## Arquivos SNMP (já padronizados)

| Arquivo Atual | Status |
|---------------|---------|
| get_mac_address_snmp.py | ✅ Já padronizado |
| get_ont_eth_stats_snmp.py | ✅ Já padronizado |
| get_ont_info_snmp.py | ✅ Já padronizado |
| get_ont_optical_info_snmp.py | ✅ Já padronizado |
| get_ont_port_attribute_snmp.py | ✅ Já padronizado |
| get_ont_port_state_snmp.py | ✅ Já padronizado |
| get_ont_register_info_snmp.py | ✅ Já padronizado |
| get_ont_traffic_snmp.py | ✅ Já padronizado |

## Padrão Final

- **CLI Commands**: `get_*_cli.py` com classes `Get*CliCommand`
- **SNMP Commands**: `get_*_snmp.py` com classes `Get*SnmpCommand`
- **Action Commands**: `set_*_cli.py`, `add_*_cli.py`, etc.

## Arquivos que Precisam de Atualização

1. `src/services/olt_service.py` - Imports e referências
2. `src/main.py` - Se houver imports diretos
3. Qualquer outro arquivo que importe esses comandos

## Implementação

1. Renomear arquivos
2. Atualizar nomes das classes
3. Atualizar imports no olt_service.py
4. Testar se não há imports quebrados