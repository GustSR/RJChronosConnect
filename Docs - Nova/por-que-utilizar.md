# Por que utilizar o RJChronosConnect

Este documento apresenta as principais vantagens de utilizar o RJChronosConnect como plataforma de gestao e monitoramento de dispositivos de rede (CPEs, ONUs) via TR-069.

## 1. Visao unificada da operacao

- Centraliza o gerenciamento de dispositivos em uma interface web moderna.
- Apresenta metricas e status em tempo real, facilitando a tomada de decisao.
- Reune inventario, diagnosticos e alertas em um unico lugar.

## 2. Diagnostico e configuracao remota

- Executa testes e consultas de parametros sem deslocamento ao cliente.
- Envia configuracoes individuais ou em massa (ex: SSID e senha de Wi-Fi).
- Reduz tempo de resposta e custo operacional.

## 3. Arquitetura robusta e escalavel

- Microservicos com separacao clara de responsabilidades.
- Backend em FastAPI e frontend em React, com gateway Bun/Elysia.
- Uso do GenieACS como ACS TR-069, com MongoDB dedicado.
- Mensageria com RabbitMQ e cache/resultados com Redis.

## 4. Ambiente de desenvolvimento padronizado

- Stack containerizada com Docker e Docker Compose.
- Setup reproduzivel para toda a equipe.
- Fluxo simples para subir e derrubar o ambiente completo.

## 5. Foco em operacao de redes

- Pensado para operadoras e provedores que precisam de controle e visibilidade.
- Suporta fluxos de provisionamento, monitoramento e manutencao em escala.
