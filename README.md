# RJChronosConnect

Repositório para o sistema de gestão e monitoramento de equipamentos de rede **RJChronosConnect**.

## 🚀 Sobre o Projeto

O **RJChronosConnect** é uma plataforma completa para o gerenciamento e monitoramento de redes de telecomunicações, projetada para provedores de internet (ISPs) que buscam modernizar suas operações. A solução integra o controle de CPEs (equipamentos na casa do cliente) e OLTs (equipamentos no provedor) com funcionalidades avançadas de automação, monitoramento em tempo real e business intelligence.

Este projeto utiliza uma arquitetura de microsserviços orquestrada com Docker para simular um ambiente de produção robusto e escalável.

## 🛠️ Stack Tecnológico

A plataforma é construída com tecnologias modernas e performáticas, visando agilidade, escalabilidade e uma excelente experiência de usuário.

- **Frontend:** React com Vite e TypeScript
- **Backend:** Python com FastAPI
- **Banco de Dados:** PostgreSQL (para dados da aplicação) e MongoDB (para o GenieACS)
- **ACS Server:** GenieACS para comunicação TR-069
- **Containerização:** Docker e Docker Compose
- **Proxy Reverso:** Nginx

## ✨ Funcionalidades Principais

- **Gestão Unificada:** Controle CPEs, ONTs e OLTs de um único local.
- **Provisionamento Zero-Touch:** Automatize a configuração de novos equipamentos na rede.
- **Monitoramento em Tempo Real:** Dashboards interativos com o status e a performance da sua rede.
- **Diagnóstico Remoto:** Ferramentas para identificar e resolver problemas sem visitas técnicas.
- **Arquitetura Escalável:** Baseada em microsserviços para suportar o crescimento da sua operação.

## 🏁 Começando

O ambiente de desenvolvimento é totalmente containerizado, facilitando a configuração e garantindo consistência entre diferentes máquinas.

### Pré-requisitos

- Docker Engine
- Docker Compose

### Instalação e Execução

1. Clone o repositório.
2. Navegue até a raiz do projeto.
3. Inicie os serviços com Docker Compose:
   ```bash
   docker-compose up --build
   ```

Após a inicialização, a aplicação principal estará acessível em `http://localhost`.

Para mais detalhes sobre a arquitetura, serviços e comandos úteis, consulte nosso guia completo:

**[>> Guia do Ambiente de Desenvolvimento <<](docs/DEVELOPMENT.md)**

## 🤝 Contribuição

As contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

Para saber como contribuir com o projeto, por favor, leia nosso **[Guia de Contribuição](docs/CONTRIBUTING.md)**.

## 📄 Licença

Este projeto é distribuído sob a licença especificada no arquivo [LICENSE](LICENSE).