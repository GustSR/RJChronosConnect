# RJChronosConnect 🌐

**Sistema de Gestão e Monitoramento de Equipamentos de Rede**

---

## 1. Visão Geral

O **RJChronosConnect** é uma plataforma completa para a gestão e o monitoramento de dispositivos de rede (CPEs, ONUs) que utilizam o protocolo TR-069. O sistema oferece uma interface web moderna para diagnósticos em tempo real, configuração remota e gerenciamento de alertas, utilizando o **GenieACS** como servidor de auto-configuração (ACS).

Este repositório contém o código-fonte de todos os componentes da plataforma, orquestrados em um ambiente de desenvolvimento containerizado com Docker.

## 2. Principais Funcionalidades

-   **Dashboard Intuitivo:** Métricas e status da planta em tempo real.
-   **Inventário de Dispositivos:** Listagem, busca e filtros para todos os equipamentos gerenciados.
-   **Diagnóstico Remoto:** Execução de testes e visualização de parâmetros dos dispositivos.
-   **Provisionamento e Configuração:** Envio de configurações em massa ou individuais (ex: SSID, senhas de Wi-Fi).
-   **Gestão de Alertas:** Visualização e tratamento de falhas reportadas pelos equipamentos.

## 3. Arquitetura

A plataforma é construída sobre uma arquitetura orientada a microserviços, facilitando a manutenção e escalabilidade. Os principais componentes são:

-   **Frontend:** Uma aplicação moderna em **React**.
-   **Backend:** Uma API robusta em **FastAPI (Python)** que serve como o núcleo do sistema.
-   **GenieACS:** O servidor de auto-configuração (ACS) para a comunicação TR-069.
-   **Bancos de Dados:** **PostgreSQL** para a aplicação e **MongoDB** para o GenieACS.
-   **Serviços Adicionais:** **Nginx** como reverse proxy e **Redis** para caching.

> Para um diagrama detalhado da arquitetura e a descrição completa dos serviços, consulte o nosso **[Guia do Ambiente de Desenvolvimento](./DEVELOPMENT.md)**.

## 4. Como Começar

Para configurar e executar o ambiente de desenvolvimento completo em sua máquina local, siga as instruções detalhadas no documento abaixo:

**[>> Guia do Ambiente de Desenvolvimento <<](./DEVELOPMENT.md)**

## 5. Como Contribuir

Nós encorajamos contribuições da comunidade! Se você deseja contribuir, por favor, leia nosso guia com as diretrizes e o fluxo de trabalho recomendado:

**[>> Guia de Contribuição <<](./CONTRIBUTING.md)**

## 6. Licença

Este é um software proprietário. Todos os direitos são reservados. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.