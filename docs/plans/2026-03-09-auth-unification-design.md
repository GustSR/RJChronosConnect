# Unificacao de Autenticacao Edge/Backend — Design

> **Decisao:** Eliminar JWT do Backend, usar apenas Better Auth (sessoes). Edge injeta headers, Backend protege tudo por padrao.

**Problema:** Edge (Better Auth, sessoes PostgreSQL) e Backend (JWT, python-jose) sao dois sistemas de auth independentes. Frontend autentica via Better Auth mas Backend nao valida essas sessoes. Secret key JWT hardcoded.

**Solucao:** Edge valida sessao e injeta `X-User-Id` / `X-User-Email` no proxy. Backend le headers, auto-provisiona user local, protege todas as rotas por padrao.

---

## Arquitetura

```
[Browser] -> cookie better-auth.session_token
    |
[Edge Gateway :8081]
    |-- Valida sessao (Better Auth API)
    |-- Injeta headers: X-User-Id, X-User-Email
    |-- Sanitiza headers vindos do cliente (remove X-User-Id/Email falsos)
    +-- Proxy -> Backend :8000
                  |
[Backend API]
    |-- Middleware global le X-User-Id
    |-- Rotas protegidas por padrao
    |-- Whitelist: /docs, /openapi.json, /health
    +-- get_current_user() le request.state (sem JWT)
```

## Decisoes

| Pergunta | Escolha | Motivo |
|----------|---------|--------|
| Fonte de verdade auth | Better Auth (Edge) | Ja integrado no frontend, sessoes no banco mais seguras que JWT hardcoded |
| Unificacao tabelas user | Duas tabelas com sync | Menor risco, Better Auth tem schema rigido (id TEXT), Backend tem FKs (id BIGINT) |
| Validacao no Backend | Header injetado pelo Edge | Zero latencia extra, Edge ja e unico ponto de entrada |
| Protecao de rotas | Tudo protegido por padrao | Secure by default, whitelist pequena |

## Componentes

### 1. Edge — Middleware de injecao de headers

- Antes de proxy `/api/*` (exceto `/api/auth/*`), valida sessao
- Usa Better Auth API: `auth.api.getSession({ headers })`
- Se valida: injeta `X-User-Id` e `X-User-Email`
- Se invalida/ausente: proxy sem headers (Backend rejeita com 401)
- **Sanitizacao:** Remove `X-User-Id` e `X-User-Email` vindos do cliente ANTES de validar

### 2. Backend — Middleware global de protecao

- Intercepta todas as requests
- Le `X-User-Id` do header
- Se presente: busca user local por `external_id`, injeta em `request.state.current_user`
- Se ausente: retorna 401 JSON `{"detail": "Nao autenticado"}`
- Whitelist (sem auth): `/docs`, `/openapi.json`, `/redoc`, `/health`

### 3. Sync de usuarios (auto-provision)

- Backend recebe `X-User-Id` + `X-User-Email` pela primeira vez
- User nao existe na tabela `users` (por `external_id`): cria automaticamente
- User existe: usa o existente
- Campo novo: `external_id TEXT UNIQUE` na tabela `users`

### 4. Dependency get_current_user() atualizada

- Antes: decodifica JWT, query por email
- Depois: le `request.state.current_user` (ja populado pelo middleware)
- Contrato identico — endpoints nao mudam

### 5. Cleanup

- Remove `python-jose` do requirements.txt
- Remove `OAuth2PasswordBearer` e JWT logic de `security.py`
- Remove fallback JWT do frontend (`JWTAuthContext.tsx`)
- Remove endpoint `POST /api/auth/token` (login agora e via Better Auth)

## Modelo de dados

### Migration nova (tabela `users`)
```sql
ALTER TABLE users ADD COLUMN external_id TEXT UNIQUE;
CREATE INDEX ix_users_external_id ON users(external_id);
```

### Tabela `user` (Better Auth) — sem alteracao
```
id TEXT PK, name TEXT, email TEXT UNIQUE, emailVerified BOOLEAN, image TEXT, createdAt, updatedAt
```

## Seguranca

- Backend nunca exposto diretamente (Nginx -> Edge -> Backend)
- Edge sanitiza headers do cliente (impede spoofing de X-User-Id)
- Sem secret key hardcoded (elimina JWT)
- Sessoes com expiracao no banco (revogaveis)

## Error handling

| Cenario | Comportamento |
|---------|---------------|
| Sessao expirada | Edge nao injeta header -> Backend 401 |
| User deletado no Better Auth | Header nao injetado -> 401 |
| User novo (primeiro acesso Backend) | Auto-provision cria user local |
| Request direta ao Backend (bypass Edge) | Sem header -> 401 |
| Edge fora do ar | Nginx retorna 502 (Backend inacessivel) |
