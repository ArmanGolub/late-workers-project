# AGENTS.md

Guidance for coding agents (Codex, Claude Code, etc.) working in this repository.

## What this is

A Vite + React 19 + TypeScript SPA: Tailwind 4, TanStack Query, zustand, i18next (react-i18next), axios. Talks to the FastAPI backend (see `../backend/AGENTS.md`) over `/api/v1`. Node 20+, package manager is `yarn` (root `Makefile` uses it; `npm` scripts also work directly inside `frontend/`).

## Commands

```bash
yarn install --frozen-lockfile      # install deps
npm run dev                         # run on :5173 (Vite HMR)
npm run build                       # production build
npm run lint                        # eslint src/**/*.{ts,tsx}
npm run typecheck                   # tsc --noEmit -p tsconfig.app.json
npm run format                      # prettier --write
```

Run `lint` and `typecheck` before finishing any task. Both must pass. There is no test runner configured yet (no vitest/jest, no `test` script).

## Architecture

```
src/
  common/
    components/layout/   Page, Section, Stack, Footer — layout primitives (barrel index.ts)
    components/ui/       shadcn-style primitives (button.tsx, card.tsx) via @radix-ui/react-slot + cva (barrel index.ts)
    lib/utils.ts          cn() — clsx + tailwind-merge
    styles/classes.ts      shared className constants (eyebrow, field, fieldLabel, fieldError, ...)

  core/                   app infrastructure, not feature-specific
    api/client.ts          axios instance: baseURL = `${VITE_API_URL}/api/v1`, injects Bearer token, normalizes errors to ApiError, clears token on 401
    api/token.ts            tokenStorage — localStorage + in-memory fallback, pub/sub listeners
    api/sse.ts               streamSse() — fetch-based SSE async generator (axios can't stream in-browser)
    api/errors.ts             toApiError / isApiError / getErrorMessage / getFieldErrors
    api/types.ts               Page<T>, ApiError, ApiErrorBody shared shapes
    query/                     QueryClient (staleTime 60s, gcTime 5m, retry:1) + QueryProvider
    router/appRoutes.tsx        single RouteObject tree, imports pages from module barrels
    env.ts                      zod-validated env: VITE_API_URL (url, default localhost:8000), VITE_APP_ENV
    i18n.ts                     i18next + http-backend + languagedetector

  modules/                 feature modules
    auth/         api/auth.ts, stores/useAuthStore.ts, hooks/{useLogin,useLogout,useMe,useRegister}, components/RequireAuth.tsx, pages/{Login,Register}Page
    notes/        api/notes.ts (CRUD), hooks/useNotes* , components/{NoteForm,NoteList,Pagination}, pages/NotesPage
    ai/           api/chat.ts, hooks/{useChat,useChatStream}, components/ChatPanel.tsx, pages/ChatPage.tsx
    system/       api/health.ts, hooks/useHealth.ts, components/ApiStatus.tsx
    dashboard/    pages/{HomePage,ContactFormPage}, stores/useAppStore.ts
    theme/        ThemeProvider.tsx, components/ThemeToggle.tsx, stores/useThemeStore.ts
```

Each module follows the same internal layout: `api/<resource>.ts` (typed fetch fns over `apiClient`) → `queryKeys.ts` (key factory: `.all/.lists()/.list(filters)/.details()/.detail(id)`) → `hooks/use<Thing>.ts` (TanStack Query wrappers) → `components/` + `pages/` → public barrel `index.ts`.

## Conventions

- Path alias `@` → `src`, defined separately in `tsconfig.json`/`tsconfig.app.json` and `vite.config.ts` — keep both in sync when adding new alias roots.
- `no-restricted-imports` (see `eslint.config.js`) blocks `@/modules/*/*` deep imports and `@/common/components/{layout,ui}/*` / `@/common/styles/*` file imports — always go through the module/folder's barrel `index.ts`. Inside a module, use relative imports.
- `tokenStorage` (`src/core/api/token.ts`) is the source of truth for the auth token. `useAuthStore` (zustand) only mirrors it via subscription — read/write auth state through `tokenStorage`, not the store.
- Requests that must skip auth (login, register, health) pass `skipAuth: true` in the axios config so a stale token isn't attached and a 401 there doesn't trigger logout.
- A 401 on any authenticated request clears the token in the response interceptor (`core/api/client.ts`), which propagates through `tokenStorage`'s listeners into `useAuthStore`, which `RequireAuth` reacts to.
- `useLogin`/`useLogout` call `queryClient.clear()` to purge cross-user cache.
- Comments: only for non-obvious *why* (a workaround, a subtle invariant, a constraint) — never restate *what* the code already says. Default to no comment.
- Components hold only rendering/JSX logic; hooks hold only hook logic (state, effects, query/store wiring). Pull every pure function (formatting, calculations, mapping, validation) out into a `helpers.ts`/`utils.ts` inside the module (or `common/lib` if it's shared across modules) and import it in — don't inline that logic in a component or a hook body.

## Backend integration

- Base URL: `VITE_API_URL` (validated in `core/env.ts`) + `/api/v1`, except `/health` which is hit directly. `VITE_API_URL` must be in the backend's `CORS_ORIGINS`.
- Error shape: backend returns `{"error": {"code", "message", "details"}}`; `toApiError()` normalizes it (whether from axios or the SSE fetch path) into `ApiError { status, code, message, details?, requestId? }`.
- `getFieldErrors(err)` maps FastAPI 422 `details` (`{loc: ["body", "field"], msg}`) into a `{field: message}` record for `react-hook-form`'s `setError`.
- SSE: `streamSse()` POSTs via raw `fetch` (not axios) to `${API_V1_URL}<path>`, parses `event:`/`data:` blocks, yields typed events. Used by `modules/ai/hooks/useChatStream.ts` against `POST /ai/chat/stream`; event contract is `delta` / `done` (with usage) / `error`, matching `backend/app/services/ai.py`.

## ~~Don'ts~~

- Don't bypass `tokenStorage` to read/write the auth token directly from components or stores.
- Don't import a module's internal files from outside it — use the module's `index.ts` barrel.
- Don't trust `frontend/README.md` for the current module/stack list — it's stale (describes a "quotes" module that doesn't exist and Tailwind 3; the real modules are `auth`, `notes`, `ai`, `system`, `dashboard`, `theme`, and the stack uses Tailwind 4).
- Don't build on `modules/dashboard/stores/useAppStore.ts` — it's an unused starter-kit leftover (a demo counter), not real app state.
