# Servico: genieacs-sim

O genieacs-sim e um simulador de dispositivos TR-069 usado para testes controlados.

## Visao geral

- Emula comportamentos de CPEs/ONUs.
- Permite testar fluxo TR-069 sem hardware real.
- Acelera validacao de integracoes com o ACS.

## Diagrama

```mermaid
graph LR
GenieACS_SIM --> GenieACS --> Backend
```

## Papel no fluxo da aplicacao

1) O simulador se registra no ACS (genieacs).
2) O backend envia comandos ao ACS.
3) O simulador responde como se fosse um dispositivo real.
4) O time valida o resultado no fluxo completo.

## O que ele faz

- Simula conexoes e parametros de dispositivos.
- Responde a comandos de leitura e escrita.
- Ajuda a reproduzir cenarios sem impacto operacional.

## Integracoes e dependencias

- genieacs (ACS principal).

## Variaveis de ambiente

- Nao ha variaveis obrigatorias definidas no compose atual.

## Casos de uso comuns

- Testar provisionamento sem equipamento fisico.
- Validar mudancas de codigo no backend.
- Reproduzir bugs de comunicacao TR-069.
