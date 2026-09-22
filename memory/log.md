# Журнал

## 2026-09-20 (18:50) — запуск через Docker
- У юзера `make dev` падал: локальный Homebrew Postgres на :5432 без базы `app`; у команды Postgres может не быть вовсе.
- Сделал два пути запуска. (1) `make docker-up` — корневой `docker-compose.yml`: Postgres + Redis + API (uvicorn --reload, bind-mount `backend/`) + web (новый `frontend/Dockerfile`, Vite HMR, bind-mount `frontend/`). Порт базы наружу НЕ публикуется — на машине уже три Postgres'а (5432 локальный, 5433 `edu_postgres`, 5434 `esil-postgres`). (2) `make dev` локально — теперь по умолчанию SQLite и без Redis (`backend/.env.example` изменён), работает без инфраструктуры.
- Проверено в Docker: `/health` → database ok, redis ok; регистрация из браузера → строка в докерном Postgres; правка файла на хосте → uvicorn перезагрузился в контейнере.
- Стек оставлен запущенным (`docker compose ps`). Docker Desktop был выключен — запустил его.
— d

## 2026-09-20 (18:30) — фронт и бэк соединены, прогнано в браузере
- Модули `auth`, `notes`, `ai` написаны (страницы /login, /register, /notes, /chat); роуты в `appRoutes.tsx` (/notes и /chat под `RequireAuth`), TopBar: навигация, email юзера, логаут, индикатор API; переводы en/ru слиты.
- Наш Vite поднялся на **:5174** (на :5173 сидит другой проект — «Магическое зеркало»), поэтому в `backend/.env` добавлен `http://localhost:5174` в `CORS_ORIGINS`.
- Браузерный прогон: гард (/notes → /login) ✓, регистрация → автологин → /notes ✓, создание заметки + пагинация + локализованная дата ✓, чат: SSE-ошибка «AI provider is not configured» показана аккуратно (ключа OpenAI нет — впиши `OPENAI_API_KEY` в backend/.env) ✓, логаут → /login ✓. Консоль без ошибок.
- Код-ревью (6 ревьюеров, 12 агентов): применены фиксы — очистка кэша React Query при логине (чтобы второй юзер не видел заметки первого), безопасный маппинг 422 в формах, in-memory fallback токена без localStorage, в чате: Enter при IME-вводе не отправляет, автоскролл только если пользователь внизу, пустой ответ модели не коммитится.
- Финал: tsc ✓, eslint ✓ (1 старое предупреждение шаблона), `vite build` ✓; повторный логин → вернуло на страницу, с которой выкинул логаут ✓.
- Серверы для проверки оставлены запущенными: бэк :8000 (SQLite в scratchpad, не в проекте), фронт :5174.
— d

## 2026-09-20 (вечер) — фронт ⇄ бэк
- Переписал ядро API фронта под наш бэкенд: `frontend/src/core/api/` — axios-клиент с `baseURL=${VITE_API_URL}/api/v1`, JWT из `tokenStorage` (localStorage `authToken`, с подпиской на изменения), нормализация ошибок в `ApiError {status, code, message, details}` под формат бэка `{"error": {...}}`, `skipAuth` для публичных запросов, сброс токена на 401.
- Добавил `sse.ts` — стриминг `POST /ai/chat/stream` (события `delta`/`done`/`error`) через fetch, и `dates.ts` — парсинг таймстампов бэка (SQLite отдаёт naive UTC, без фикса время «уезжало» бы на часовой пояс).
- `VITE_API_URL=http://localhost:8000` в `frontend/.env(.example)`; выпилил демо-модуль `quotes` (dummyjson); добавил модуль `system` — индикатор живости API (`GET /health`).
- Прогнал бэкенд E2E вручную (register/login/me/notes CRUD/CORS preflight с :5173/AI без ключа) — всё отвечает по контракту.
- Корневые `Makefile` (`make dev` = оба приложения) и `README.md` (как связаны фронт и бэк).
- Запущен воркфлоу: агенты пишут модули `auth`, `notes`, `ai` (страницы /login, /register, /notes, /chat) + ревью. После него осталось: подключить роуты в `appRoutes.tsx`, ссылки в TopBar, слить i18n-ключи, финальная проверка в браузере.
— d

## 2026-09-20 (день) — бэкенд-шаблон
- Закинул шаблон `~/FastApi_Starter_kit` в `backend/` (61 файл, без .venv и кэшей).
- Починил баг шаблона: тесты падали, если существует `.env` с `REDIS_URL` (pydantic-settings читал его в обход `os.environ.pop`). Фикс: `REDIS_URL=""` в `tests/conftest.py` + валидатор «пустая строка = None» в `app/core/config.py`. Стоит перенести фикс в оригинальный шаблон.
- `make setup && make lint && make test` — 24/24, ruff чист.
- Разрулил разъехавшиеся ветки (у origin был свой отдельный `init` от IDE): `git pull --rebase origin main`.
— d
