# Repository Guidelines

## Project Structure & Module Organization
- `services/backend-api`: FastAPI service; `app/` holds routers, models, schemas, and migrations live in `alembic/`.
- `services/frontend`: React + Vite client; feature code resides in `src/` and static assets in `public/`.
- `services/works`: Python workers consuming RabbitMQ tasks; keep job modules close to `main.py`.
- `shared/logging`: Structured logging helpers shared across Python services.
- `infrastructure`, `config`, `scripts`, `docs`: Deployment manifests, environment defaults, automation scripts, and architectural specs.

## Build, Test, and Development Commands
- `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build`: boot the full stack with live reload; stop with the same flags and `down`.
- Backend API: `cd services/backend-api && pip install -r requirements.txt && uvicorn app.main:app --reload` for focused development.
- Frontend UI: `cd services/frontend && npm install && npm run dev -- --host` to expose Vite on your LAN.
- Tests: run backend suites with `pytest` (ensure dev deps installed) and frontend suites with `npm run test`.
- Quality gates: `npm run lint`, `npm run fm:check`, and `npm run fix:all` keep the web client consistent; mirror equivalent Python linting before committing.

## Coding Style & Naming Conventions
- Follow PEP 8, 4-space indentation, and explicit type hints; keep domain logic in `app/services` and CRUD in `app/crud`.
- Expose request/response DTOs from `app/schemas`; routers live in `app/api` with `snake_case` file names.
- Frontend respects the repo Prettier profile (2-space tabs, single quotes, semicolons) and ESLint rulesets.
- Name React components in `PascalCase`, co-locate styles/assets with the feature, and keep hook names prefixed with `use`.

## Testing Guidelines
- Target coverage above 80% as defined in `docs/Arquitetura-Oficial.md` and surface gaps in PRs.
- Backend tests live under `services/backend-api/tests`; name files `test_<feature>.py` and rely on FastAPI `TestClient` plus HTTPX mocks.
- Frontend tests use Vitest; colocate `.test.tsx` files with the component or utility they exercise.
- Bring up supporting services via docker-compose before running integration flows that touch ACS, Redis, or PostgreSQL.

## Commit & Pull Request Guidelines
- Branch from `dev` using prefixes `feature/`, `bugfix/`, `chore/`, or `docs/` to signal intent.
- Author commits with the Conventional Commits format (`type(scope): summary`), e.g., `feat(api): expose device telemetry feed`.
- PR descriptions should capture intent, implementation notes, related issues, and UI screenshots when visuals change.
- Require a green CI run (lint, tests, docker builds) and keep each PR scoped to a single concern.

## Environment & Secrets
- Copy `.env.example` to `.env`, fill in database and Auth0 secrets locally, and never commit sensitive values.
- Store runtime overrides under `config/` or `infrastructure/`; coordinate credential rotations with the infra team.
