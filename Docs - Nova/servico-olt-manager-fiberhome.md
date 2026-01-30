# Servico: olt-manager-fiberhome

O olt-manager-fiberhome e o microservico dedicado a integracao com OLTs FiberHome. Ele centraliza comandos e protocolos especificos do fabricante.

## Visao geral

- Microservico isolado para FiberHome.
- Reduz complexidade no backend principal.
- Mantem integracoes por fornecedor de forma independente.

## Diagrama

```mermaid
graph LR
Backend --> OLT_Manager_FiberHome
OLT_Manager_FiberHome --> OLT_FiberHome
```

## Papel no fluxo da aplicacao

1) O backend solicita uma operacao de OLT.
2) O olt-manager executa comandos no equipamento FiberHome.
3) O resultado e retornado ao backend.

## O que ele faz

- Executa consultas e comandos especificos de OLT FiberHome.
- Exponde API interna para operacoes de rede.
- Facilita manutencao e evolucao por vendor.

## Integracoes e dependencias

- backend (principal consumidor da API).
- rabbitmq (para tarefas assincronas, quando aplicavel).

## Variaveis de ambiente

- BACKEND_API_URL: URL do backend para integracoes internas.
- SNMP_COMMUNITY: comunidade SNMP padrao.

## Casos de uso comuns

- Diagnostico de portas e sinais opticos.
- Consulta de status de ONUs em OLT FiberHome.
- Operacoes de provisao e manutencao em rede.

## Observacoes de operacao

- Em dev, costuma estar exposto na porta 8002.
- Configuracoes de OLT podem ser definidas por variaveis de ambiente.
