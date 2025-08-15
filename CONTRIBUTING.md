# Guia de Contribuição Interna - RJChronosConnect

Este documento descreve as diretrizes e o fluxo de trabalho para os colaboradores do projeto. O objetivo é manter a qualidade, consistência e organização do nosso código-fonte.

## Ambiente de Desenvolvimento

Antes de começar, certifique-se de que seu ambiente de desenvolvimento está configurado conforme o nosso guia: **[Guia do Ambiente de Desenvolvimento](DEVELOPMENT.md)**.

## Fluxo de Trabalho (Git)

Adotamos um fluxo de trabalho baseado em **feature branches** a partir da branch `main`.

### 1. Nomenclatura de Branches

Sempre crie uma nova branch a partir da `main` para cada nova tarefa. Use os seguintes prefixos:

- `feature/`: Para novas funcionalidades (ex: `feature/login-com-2fa`).
- `bugfix/`: Para correção de bugs (ex: `bugfix/ajuste-tabela-cpes`).
- `chore/`: Para tarefas de configuração, build, etc. (ex: `chore/atualiza-dockerfile`).
- `docs/`: Para alterações na documentação.

### 2. Mensagens de Commit

É obrigatório seguir o padrão **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)**. Isso nos ajuda a gerar changelogs e a entender o histórico de forma clara.

**Formato:** `<tipo>(<escopo>): <descrição>`

- **Exemplos:**
  - `feat(api): adiciona endpoint para buscar alertas`
  - `fix(ui): corrige cor do botão de salvar`
  - `docs(readme): atualiza guia de instalação`

### 3. Pull Requests (PRs)

Todo o código deve ser enviado para a `main` através de um Pull Request.

**Checklist para um bom PR:**

- [ ] O título do PR é claro e segue o padrão Conventional Commits.
- [ ] A descrição explica **o que** foi feito e **por que**.
- [ ] O PR está ligado à sua tarefa correspondente (se aplicável).
- [ ] O código foi revisado por pelo menos um outro membro da equipe.
- [ ] Todos os checks da pipeline de CI (GitHub Actions) estão passando (verde).

## Padrões de Código

- O código deve estar em conformidade com as regras do linter configurado no projeto.
- Execute os linters e formatadores locais antes de enviar seu código.
