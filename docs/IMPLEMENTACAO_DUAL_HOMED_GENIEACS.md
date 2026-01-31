# Tarefa Técnica: Implementação da Arquitetura Dual-Homed no GenieACS

## Contexto
Atualmente, nosso servidor de provisionamento GenieACS roda em Docker. Precisamos alterar sua arquitetura de rede para operar em modo "Dual-Homed" (Dupla Interface). O objetivo é isolar completamente o tráfego de gerenciamento das ONUs (TR-069) do tráfego interno da aplicação (API/Banco de Dados), eliminando problemas de NAT e garantindo segurança.

## Infraestrutura Base (Já Configurada)
* **Servidor Linux:** Possui uma interface física dedicada chamada `ens19`.
* **Rede de Gerência (VLAN 200):** A interface `ens19` já está conectada a esta rede (Sub-rede `10.200.0.0/21`, Gateway `10.200.0.1`).
* **IP do Host:** O Linux tem o IP `10.200.7.254`.
* **IP Reservado para o Container:** O IP `10.200.7.253` foi reservado exclusivamente para o container do GenieACS.

---

## O que precisa ser feito (Passo a Passo)

Você deve editar o arquivo `docker-compose.dev.yml` para aplicar as seguintes mudanças:

### 1. Configuração de Redes do Container
O serviço `genieacs` deve ser conectado a duas redes simultâneas:

* **Rede 1: `rjchronos-net` (Interna/Bridge)**
    * **Função:** Comunicação com o ecossistema interno (MongoDB, Redis, Backend API) e exposição da UI via Proxy Reverso.
    * **Configuração:** Padrão do Docker (já existente).
* **Rede 2: `onu_management_net` (Externa/Macvlan)**
    * **Função:** Comunicação direta com as ONUs (Chão de fábrica).
    * **Driver:** `macvlan`.
    * **Parent Interface:** `ens19` (Isso é crucial).
    * **Configuração IP:** Deve fixar o IP estático `10.200.7.253` para o container.

### 2. Binding de Serviços e Portas (Crucial)
O GenieACS é modular. Você deve configurar as variáveis de ambiente para que cada módulo "escute" na interface correta:

| Módulo | Porta | Interface de Escuta (Bind IP) | Rede Utilizada | Quem Acessa? |
| :--- | :--- | :--- | :--- | :--- |
| **CWMP (TR-069)** | 7547 | `10.200.7.253` (IP da Macvlan) | `onu_management_net` | Apenas as ONUs. É por aqui que elas enviam o "Inform". |
| **FS (File Server)** | 7567* | `10.200.7.253` (IP da Macvlan) | `onu_management_net` | Apenas as ONUs. Usado para baixar Firmwares e Backups. |
| **NBI (API)** | 7557 | `0.0.0.0` (Todas) | `rjchronos-net` | O Backend API. O nosso sistema usa essa porta para enviar comandos ao ACS. |
| **UI (Interface)** | 3000 | `0.0.0.0` (Todas) | `rjchronos-net` | Administradores. Acessado via navegador (através do proxy na porta 8088/Edge). |

*(Nota: A porta FS padrão pode variar, confirme se é 7567 ou se está embutida na 7547, mas o princípio do IP se mantém).*

### 3. Definição da Rede no Docker Compose
Adicione o bloco de rede no final do arquivo `docker-compose.dev.yml`:

```yaml
networks:
  onu_management_net:
    driver: macvlan
    driver_opts:
      parent: ens19  # <--- Interface física do Host Linux
    ipam:
      config:
        - subnet: 10.200.0.0/21
          gateway: 10.200.0.1
          # O range auxilia o Docker a não "roubar" IPs de outros equipamentos.
          # Pode usar um range pequeno em volta do IP fixo.
          ip_range: 10.200.7.240/28
```

---

## Critérios de Sucesso (DoD)
1. O container sobe sem erros.
2. De dentro do container, é possível pingar o gateway `10.200.0.1`.
3. O comando `netstat -tuln` dentro do container mostra a porta 7547 ouvindo apenas em `10.200.7.253`.
4. O Backend consegue continuar falando com a API do GenieACS (porta 7557) via rede interna.
