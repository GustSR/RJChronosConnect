# Repository Guidelines

## Regras Gerais
Sempre que for mexer em alguma parte do codigo, consulte a documentação utilizando o mcp Context7 para melhor compreensão.

## Project Structure & Module Organization
Este repositorio e um monorepo. Os componentes principais ficam em `services/`, por exemplo: `services/edge` (gateway Bun/Elysia), `services/frontend` (React/Vite), `services/backend-api` (FastAPI), `services/works` (worker), `services/genieacs` (ACS), e `services/olts-managers` (microservicos de OLT). Outros diretorios relevantes: `shared/` (codigo compartilhado), `infrastructure/` (Nginx e afins), `config/` (configuracoes), `docs/` (documentacao) e `scripts/` (automacoes). Os arquivos `docker-compose*.yml` na raiz orquestram o ambiente.

## Contexto Recente (branch atual em 2 fev 2026)
- Branch atual: `feature/frontend-refactor` (atualize esta secao ao trocar de branch).
- Foco recente em `services/olts-managers` (escopo `olt-manager`): robustez de reboot e `delete_ont`, parsing de Serial Number, selecao dinamica de indice WAN, criacao de `service-port` de gerencia e vinculo TR-069, alem de ajustes para uso de CLI no lugar de SNMP.
- Fluxos de ONU evoluiram: remocao de ONU, configuracao por Serial Number e armazenamento/lookup de `ont_id` no backend.
- Frontend: restauracao de `getStatusChip` em `ONUInventoryCard`.

## Build, Test, and Development Commands
- Ambiente dev completo (Docker):
  ```bash
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
  ```
  Para parar: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml down`.
- Frontend (fora do Docker, em `services/frontend`): `bun run dev`, `bun run build`, `bun run lint`, `bun run test`.
- Edge (fora do Docker, em `services/edge`): `bun run dev` ou `bun run start`.
- Configure `.env` a partir de `.env.example` antes de subir o stack.

## Coding Style & Naming Conventions
- Frontend segue `services/frontend/.prettierrc` (2 espacos, aspas simples, ponto e virgula) e `services/frontend/eslint.config.mjs`.
- Prefira organizacao por dominio dentro de cada servico (ex: `services/backend-api/app/...`).
- Nomes de arquivos devem refletir o dominio/feature (ex: `devices.ts`, `DeviceTable.tsx`).

## Testing Guidelines
- Frontend usa Vitest (`bun run test`) com convencao `*.test.tsx`/`*.test.ts`.
- Existem testes pontuais em servicos Python (ex: `services/backend-api/tests`, `services/olts-managers/olt-manager-huawei/tests`); nao ha meta de cobertura documentada.

## Commit & Pull Request Guidelines
- Branches a partir de `dev` com prefixos: `feature/`, `bugfix/`, `chore/`, `docs/`.
- Commits seguem Conventional Commits: `<tipo>(<escopo>): <descricao>`.
- PRs: titulo claro, descricao do que/por que, link para tarefa quando houver, revisao por outro membro e CI verde.

## Security & Configuration Tips
- Nao commite segredos; use `.env` local e mantenha valores de exemplo em `.env.example`.
- Documentacao sensivel deve ficar em `docs/` com redacoes genericas.

## Agent-Specific Instructions
- Para contribuicoes assistidas por IA, siga `CLAUDE.md` (stack existente, solicitacao de novas ferramentas e comunicacao em pt-BR).
