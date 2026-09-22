# AGENTS.md

Guidance for coding agents (Codex, Claude Code, etc.) working in this repository.

## What this is

A monorepo with two apps:

| Dir | What | Port |
|---|---|---|
| `backend/` | FastAPI + async SQLAlchemy + Alembic + JWT + optional Redis + OpenAI (SSE) | 8000 |
| `frontend/` | Vite + React 19 + TypeScript + Tailwind 4 + TanStack Query + zustand + i18next | 5173 |

**`backend/AGENTS.md` and `frontend/AGENTS.md` are the source of truth for each app's architecture, conventions, and per-app commands.** This file is a monorepo-level map — read it first to orient, then open the relevant package doc before making changes there. Don't restate package-level detail here when editing; update it in the package's own `AGENTS.md` instead.

## Commands (whole stack, from repo root)

```bash
make docker-up      # full stack in Docker: Postgres + Redis + API + web, hot reload
make docker-down     # stop (data kept); make docker-reset stops + drops the DB volume
make setup            # local dev: uv sync (backend) + yarn install (frontend), .env files created
make infra              # Postgres + Redis only, in Docker — for local dev against real infra
make dev                  # API (:8000) + web (:5173) together, locally, Ctrl+C stops both
make backend / make frontend   # run one side only
make test                        # backend pytest
make lint                         # backend ruff + frontend eslint/tsc
```

See root `README.md` for the full quick-start walkthrough (in Russian) and DB connection details for external tools.

## Architecture overview

**Backend** (`backend/app/`) is layered by technical concern, not by feature: thin routers in `api/v1/*` → business logic + commits in `services/*` → SQLAlchemy `models/*` with Pydantic `schemas/*` at the boundary. Errors are always `{"error": {"code", "message", "details"}}` via `AppError` subclasses (`core/exceptions.py`), never raw `HTTPException`. Full detail: `backend/AGENTS.md`.

**Frontend** (`frontend/src/`) splits into `core/` (app infra: API client, auth token storage, SSE, router, env, i18n) and `modules/*` (feature slices: `auth`, `notes`, `ai`, `system`, `dashboard`, `theme`), each following `api/` → `queryKeys.ts` → `hooks/` → `components/`+`pages/` → barrel `index.ts`. Full detail: `frontend/AGENTS.md`.

## How frontend and backend connect

- **Base URL**: frontend's `VITE_API_URL` (validated via zod in `frontend/src/core/env.ts`) + `/api/v1`; the backend must list that origin in `CORS_ORIGINS` (`localhost:5173` is allowed by default).
- **HTTP client**: `frontend/src/core/api/client.ts` — axios, `baseURL=${VITE_API_URL}/api/v1`, injects `Authorization: Bearer <jwt>`, normalizes every error to `ApiError {status, code, message, details}` — matching the backend's `{"error": {...}}` shape. Requests with `skipAuth: true` (login, register, health) don't send a token.
- **Auth token**: single store in `frontend/src/core/api/token.ts` (`tokenStorage`, localStorage + pub/sub). On a `401` the client clears the token, which flows into `useAuthStore` and `RequireAuth` redirects to `/login`.
- **AI streaming**: `frontend/src/core/api/sse.ts` (`fetch` + `text/event-stream` parser) consumes the backend's SSE contract (`delta` / `done` / `error`) from `backend/app/services/ai.py`.
- **Validation errors (422)**: `getFieldErrors(err)` on the frontend maps FastAPI's `details` array to per-field messages for `react-hook-form`.
- **Modules ↔ endpoints**: `auth` → `/auth/register`, `/auth/login/json`, `/users/me`; `notes` → `/notes*`; `ai` → `/ai/chat`, `/ai/chat/stream`; `system` → `/health` (hit directly, no `/api/v1` prefix).

## Don'ts (whole repo)

- Don't change the DB schema without an Alembic migration (`backend/AGENTS.md` → Conventions); never call `Base.metadata.create_all` outside tests.
- Don't add a new SQLAlchemy model without registering it in `backend/app/models/__init__.py` (Alembic autogenerate silently misses unregistered models).
- Don't weaken `SECRET_KEY` validation or `DEBUG` handling for `ENV=prod` (backend refuses a placeholder secret and leaks exception text if `DEBUG=true` in prod).
- Don't bypass `tokenStorage` on the frontend or deep-import across `frontend/src/modules/*` — see `frontend/AGENTS.md` → Conventions/Don'ts.
- Don't trust `frontend/README.md` as current — it predates the `auth`/`notes`/`ai`/`system` modules and the Tailwind 4 upgrade.
- Don't commit `.env`, `*.db`, `.venv`, or `node_modules`.
