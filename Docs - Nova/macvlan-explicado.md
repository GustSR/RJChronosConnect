# Entendendo o Macvlan no RJChronosConnect

Este documento explica, de forma simples e direta, o que é o driver de rede **Macvlan** do Docker e como ele resolveria os problemas de conectividade do GenieACS (TR-069) no nosso projeto.

---

## 1. O Conceito (Analogia Simples)

Imagine a porta de rede do seu servidor (a placa física onde chega o cabo da OLT/Switch) como a **Porta da Frente** de uma casa.

### Como estamos hoje (Docker Bridge):
O Docker cria um "roteador virtual" (NAT) dentro do servidor.
*   O **GenieACS** mora em um quarto dentro da casa.
*   Para a OLT falar com o GenieACS, ela bate na "Porta da Frente" (IP do Servidor) e o porteiro (Docker) tem que saber encaminhar o pacote para o quarto certo (Port Mapping).
*   **O Problema:** Quando o GenieACS grita "Estou aqui!", ele grita o endereço do quarto dele (ex: `172.18.0.5`), que ninguém fora da casa conhece. A OLT tenta responder nesse IP e falha.

### Como ficaria com Macvlan:
O Macvlan permite criar uma "puxada de cabo" virtual direto da rua para o container.
*   O **GenieACS** ganha seu próprio IP na rede física.
*   Para o switch/OLT, parece que conectamos um **segundo servidor físico** no mesmo cabo de rede.
*   O GenieACS fala diretamente com a rede externa, sem "porteiro" (NAT) no meio.

---

## 2. Por que isso resolve o problema do TR-069?

O protocolo TR-069 tem uma funcionalidade chamada **Connection Request** (o botão "Summon" ou "Refresh").

1.  O GenieACS manda um pacote para a ONT.
2.  A ONT precisa responder **iniciando** uma conexão com o GenieACS.
3.  A ONT usa o endereço que o GenieACS informou na configuração.

**No modo Bridge:** O GenieACS informa seu IP interno (`172.x.x.x`). A ONT (que está na rede `10.x.x.x` ou pública) não consegue chegar nesse IP.

**No modo Macvlan:** O GenieACS tem um IP real da rede de gerência (ex: `10.250.0.50`). A ONT consegue "pingar" e conectar nesse IP perfeitamente.

---

## 3. Como funcionaria no RJChronosConnect?

Vamos supor que seu servidor tem a interface `eth0` ligada na rede de gerência dos provedores (onde estão as OLTs e ONTs), com a faixa de IP `10.250.0.x/24`.

### Arquitetura Proposta:

1.  **Backend, Frontend, Banco de Dados:** Continuam na rede padrão do Docker (`bridge`). Eles não precisam ser vistos diretamente pelas ONTs.
2.  **GenieACS:** Entra na rede `macvlan`.

### Configuração no `docker-compose.yml`:

```yaml
networks:
  # Rede interna para os serviços conversarem entre si
  rjchronos-net:
    driver: bridge

  # Rede "física virtual" para o GenieACS
  rede-gerencia-onts:
    driver: macvlan
    driver_opts:
      parent: eth0  # <-- A interface física do seu servidor
    ipam:
      config:
        - subnet: 10.250.0.0/24    # A rede real da sua gerência
          gateway: 10.250.0.1      # O gateway real da sua rede
          ip_range: 10.250.0.128/28 # Uma fatia de IPs reservados para containers

services:
  genieacs:
    networks:
      rjchronos-net: # Para falar com o banco de dados e backend
      rede-gerencia-onts: # Para falar com as ONTs
        ipv4_address: 10.250.0.50 # IP fixo e real na rede
```

---

## 4. Vantagens e Desvantagens

### ✅ Vantagens (O Sonho)
1.  **Performance Máxima:** Não processa NAT. É velocidade de cabo.
2.  **IP Real:** O GenieACS tem um IP na mesma rede das OLTs.
3.  **Portas Livres:** Não ocupa a porta 3000 ou 7547 do servidor principal (host). Você pode ter outro serviço usando a porta 7547 no IP do servidor, e o GenieACS usa a 7547 no IP dele (`10.250.0.50`).
4.  **Fim dos problemas de "Summon":** O IP que o GenieACS vê é o IP que a ONT vê.

### ⚠️ Cuidados (A Realidade)
1.  **Bloqueio em Nuvem (Cloud):** AWS, Google Cloud, DigitalOcean geralmente **bloqueiam** Macvlan. Eles não deixam dois MAC addresses diferentes saírem pela mesma porta da VM. Só funciona bem em servidores físicos (Bare Metal) ou VMs locais (Proxmox/VMware) com "Promiscuous Mode" ativado.
2.  **Isolamento do Host:** Por segurança do Linux, **o servidor (host) não consegue falar com o container Macvlan** diretamente, e vice-versa.
    *   *Impacto:* Se você tentar dar um `curl 10.250.0.50` de dentro do próprio servidor onde o Docker roda, vai falhar. (Existem gambiarras para resolver, mas é o padrão).
3.  **Gestão de IP:** Você precisa garantir que o IP `10.250.0.50` não seja usado por mais ninguém na rede da empresa.

---

## 5. Resumo

Use **Macvlan** se:
*   Você tem um servidor físico ou controle total da virtualização.
*   Precisa que o container tenha um IP exclusivo na rede da empresa.
*   Quer resolver problemas de NAT/TR-069 de forma definitiva.

Use **Host Mode** (o que sugerimos antes) se:
*   Você está em uma VPS de nuvem.
*   Quer algo mais simples de configurar agora.
