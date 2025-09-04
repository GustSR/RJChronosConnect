# Tarefa: Refatorar para Fake API e Definir Fluxo Frontend-First

**Status:** A Fazer
**Responsável:** Time de Frontend

## 1. Objetivo

O objetivo desta tarefa é desacoplar o desenvolvimento do Frontend do Backend, permitindo que a UI seja construída de forma independente e ágil. Isso será feito através da criação de uma "Fake API" que servirá dados de teste (mock) realistas, simulando o comportamento da API real.

Isso elimina gargalos, permite o desenvolvimento paralelo e cria um "contrato" claro de dados entre as duas equipes.

## 2. Isso é um Padrão de Mercado?

Sim. Esta abordagem é um padrão moderno conhecido como **Desenvolvimento Frontend-First**. As maiores empresas de tecnologia a utilizam para aumentar a velocidade e a eficiência das equipes. Ao invés de o frontend esperar pelo backend, ele define os dados que precisa através da Fake API, e o backend implementa esse "contrato".

## 3. Plano de Ação

### Fase 1: Refatoração da Estrutura de Mock Atual

1.  **Centralizar os Dados:**
    -   Dentro de `services/frontend/src/__fakeApi__/`, criar uma nova pasta `data`.
    -   Mover os arrays de dados mock (como `mockOlts`, `mockOnus`, etc.) que hoje estão em `genieacsApi.ts` para arquivos individuais dentro de `__fakeApi__/data/` (ex: `olts.ts`, `onus.ts`).

2.  **Implementar o Simulador da API:**
    -   No arquivo `services/frontend/src/__fakeApi__/index.ts`, importar os dados da pasta `data`.
    -   Criar e exportar um objeto `fakeApi` que contém funções com as mesmas assinaturas da API real (ex: `getOLTs`, `getOLTStats`).
    -   Estas funções devem simular o comportamento da API, incluindo um pequeno delay de rede (ex: `setTimeout`) para tornar a experiência mais realista.

3.  **Refatorar o Serviço `genieacsApi.ts`:**
    -   Remover todos os métodos privados e arrays de dados mock de dentro do arquivo `genieacsApi.ts`.
    -   Alterar as funções principais (como `getOLTs`) para que, se o modo de mock estiver ativo (`devConfig.useMockData`), elas chamem a função correspondente da `fakeApi` importada. O bloco `try...catch` para fallback de mock não será mais necessário.

### Fase 2: Fluxo de Trabalho para Novos Endpoints

Este será o processo padrão para qualquer nova funcionalidade no frontend que precise de dados do backend.

1.  **Definição do Contrato (Frontend):** Ao iniciar uma nova feature, o desenvolvedor frontend primeiro define a estrutura de dados (a `interface` TypeScript) que a UI precisará.

2.  **Criar os Dados Mock (Frontend):** Com base na interface, o dev cria um novo arquivo de dados de teste em `src/__fakeApi__/data/`.

3.  **Simular o Endpoint (Frontend):** O dev adiciona a nova função no simulador (`__fakeApi__/index.ts`), fazendo-a retornar os dados de teste recém-criados.

4.  **Desenvolver a Feature (Frontend):** O dev implementa a feature completa na UI, fazendo a chamada para a API como se ela já existisse. A UI será construída e testada com dados realistas, porém falsos.

5.  **Gerar a Demanda para o Backend:** Uma vez que a feature está pronta e o formato dos dados foi validado na UI, o dev frontend preenche o modelo abaixo e o entrega para o time de backend. Este documento é o "contrato" final do que precisa ser implementado.

## 4. Modelo de Requisição de Endpoint para o Backend

> Copie e cole este modelo para cada novo endpoint necessário.

---

**Endpoint:**
`[ex: /devices/olts/{olt_id}/stats]`

**Método HTTP:**
`[ex: GET]`

**Descrição:**
`[ex: Retorna estatísticas agregadas (total, online, offline) para uma OLT específica.]`

**Parâmetros da URL:**
- `{olt_id}` (string): O ID da OLT.

**Corpo da Requisição (para POST/PUT):**
`[Nenhum ou descrever o JSON aqui]`

**Exemplo de Resposta de Sucesso (JSON):**
```json
{
  "total": 150,
  "online": 142,
  "offline": 8
}
```
---
