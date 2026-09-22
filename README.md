# late-workers-project

Монорепо из двух приложений:

| Папка | Что | Порт |
|---|---|---|
| [`backend/`](backend/) | FastAPI + SQLAlchemy (async) + Alembic + JWT + опциональный Redis + OpenAI (SSE) | 8000 |
| [`frontend/`](frontend/) | Vite + React 19 + TypeScript + Tailwind 4 + TanStack Query + zustand + i18next | 5173 |

## Быстрый старт

### Вариант 1 — всё в Docker (рекомендуется для команды)

Нужен только Docker Desktop. Поднимает Postgres, Redis, API и фронт; исходники примонтированы — правки на хосте подхватываются (uvicorn `--reload`, Vite HMR).

```bash
make docker-up     # первый раз соберёт образы (~1–2 мин)
```

- фронт — http://localhost:5173
- API — http://localhost:8000, Swagger — http://localhost:8000/docs

`make docker-down` — остановить, `make docker-reset` — остановить и стереть базу. База доступна с хоста на порту **5439** (нестандартный, чтобы не конфликтовать с другими Postgres): DBeaver/DataGrip → PostgreSQL, host `localhost`, port `5439`, db `app`, user `postgres`, password `postgres`.

Ключ OpenAI и прочие секреты кладёшь в `backend/.env` (создаётся из `.env.example` через `make setup`) — compose подхватит его автоматически.

### Вариант 2 — локально без Docker

Нужны [uv](https://docs.astral.sh/uv/) и Node 20+. Бэк работает на SQLite (`backend/app.db`), Redis выключен.

```bash
make setup     # uv sync + yarn install + .env из .env.example в обеих папках
make dev       # API на :8000 и фронт на :5173 одной командой
```

Хочешь локальный запуск, но с Postgres + Redis — `make infra` поднимет только их в Docker, а в `backend/.env` раскомментируй `DATABASE_URL=postgresql+asyncpg://...` и `REDIS_URL=...`.

Чтобы работал AI-чат, впиши `OPENAI_API_KEY` в `backend/.env`.

## Как связаны фронт и бэк

- **Адрес API** — `frontend/.env` → `VITE_API_URL=http://localhost:8000`. Значение валидируется zod-схемой в [`frontend/src/core/env.ts`](frontend/src/core/env.ts). Для прода меняешь URL и добавляешь origin фронта в `CORS_ORIGINS` бэка (`localhost:5173` уже разрешён).
- **HTTP-клиент** — [`frontend/src/core/api/client.ts`](frontend/src/core/api/client.ts): axios с `baseURL=${VITE_API_URL}/api/v1`, подставляет `Authorization: Bearer <jwt>`, а любую ошибку приводит к `ApiError {status, code, message, details}` — ровно то, что отдаёт бэк в `{"error": {...}}`. Запросы с `skipAuth: true` (логин, регистрация, health) токен не шлют.
- **Токен** — [`frontend/src/core/api/token.ts`](frontend/src/core/api/token.ts): одно хранилище (`localStorage.authToken`) с подпиской. На `401` клиент сбрасывает токен → `useAuthStore` это видит → `RequireAuth` уводит на `/login`.
- **Стриминг AI** — [`frontend/src/core/api/sse.ts`](frontend/src/core/api/sse.ts): `fetch` + парсер `text/event-stream` под события бэка `delta` / `done` / `error`.
- **Ошибки валидации (422)** — `getFieldErrors(err)` раскладывает `details` FastAPI по полям формы для `react-hook-form`.

### Модули фронта ↔ эндпоинты бэка

| Модуль | Эндпоинты | Страницы |
|---|---|---|
| `modules/auth` | `POST /auth/register`, `POST /auth/login/json`, `GET /users/me` | `/login`, `/register` |
| `modules/notes` | `GET/POST /notes`, `GET/PATCH/DELETE /notes/{id}` | `/notes` (защищена) |
| `modules/ai` | `POST /ai/chat`, `POST /ai/chat/stream` (SSE) | `/chat` (защищена) |
| `modules/system` | `GET /health` | индикатор в шапке |

Все пути — относительно `/api/v1`, кроме `/health`.

## Команды

| Команда | Что делает |
|---|---|
| `make docker-up` / `docker-down` / `docker-reset` | весь стек в Docker |
| `make dev` | оба приложения локально (Ctrl+C останавливает оба) |
| `make backend` / `make frontend` | по отдельности |
| `make test` | pytest бэкенда |
| `make lint` | ruff + eslint + tsc |

Подробнее — в [`backend/README.md`](backend/README.md) и [`frontend/README.md`](frontend/README.md).
