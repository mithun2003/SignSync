# Copilot Instructions for SignSync

## Repository topology

- This root repository is an orchestrator for two git submodules tracked in `.gitmodules`:
  - `frontend` → Angular SPA (`SignSync-FE`, branch `new-model`)
  - `backend` → FastAPI service (`SIgnSync-BE`, branch `new-model`)
- Most product changes are made inside `frontend/` or `backend/`; root-level work is usually Docker orchestration and submodule pointer updates.

## Build, test, and lint commands

### Root (orchestration)

- Start full local stack (frontend + backend + Postgres + pgAdmin):
  - `docker compose up --build`
- Stop stack:
  - `docker compose down`
- One-off bootstrap tools (admin/tier):
  - `docker compose -f docker-compose.yml -f docker-compose.tools.yml run --rm create_superuser`
  - `docker compose -f docker-compose.yml -f docker-compose.tools.yml run --rm create_first_tier`

### Frontend (`frontend/`)

- Install dependencies: `npm install`
- Dev server: `npm run dev` (or `ng serve`)
- Production build: `npm run build`
- Lint: `npm run lint`
- Tests (all): `npm test`
- Single test file:
  - `ng test --include='src/app/pages/user/components/gesture-detection/gesture-detection.component.spec.ts'`
  - (pattern works for any `*.spec.ts` path)

### Backend (`backend/`)

- Install/sync dependencies: `uv sync`
- Run API locally: `uv run uvicorn src.app.main:app --reload`
- Tests (all): `uv run pytest -v`
- Single test file: `uv run pytest tests/test_auth.py -v`
- Single test function: `uv run pytest tests/test_auth.py::TestLogin::test_login_success -v`
- Lint/format (from project config):
  - `uv run ruff check .`
  - `uv run ruff format .`
- Type checking: `uv run mypy src`
- Pre-commit checks (if hooks installed): `pre-commit run --all-files`

## High-level architecture

### End-to-end flow

- Frontend camera pipeline uses MediaPipe in-browser (`HandDetectService`) to extract landmarks, then streams prediction payloads to backend WebSocket (`/api/v1/predict/ws`) through `UserService`.
- Backend prediction router (`backend/src/app/api/v1/predict.py`) validates/authenticates, performs model inference, and logs successful detections into DB (`crud_sign_detections`).
- Frontend `GestureDetectionComponent` consumes prediction signals, applies letter stability/confidence heuristics, builds sentence state, and can trigger help-email workflows.

### Frontend architecture (Angular 21, standalone)

- Bootstrapped via `bootstrapApplication` with `app.config.ts` providers:
  - zoneless change detection (`provideZonelessChangeDetection`)
  - router + view transitions
  - `HttpClient` with `withFetch()` and DI interceptors
- Route composition:
  - top-level lazy load in `app.routes.ts`
  - grouped routes in `pages.routes.ts` for `user`, `auth`, `admin`
  - layout components (`UserLayoutComponent`, `AuthLayoutComponent`, `AdminLayoutComponent`) wrap route groups
- API access goes through `ApiService` (`environment.rootUrl + '/api/v1'`) with `withCredentials: true` and JSON headers.
- Auth token behavior is split between:
  - `AuthInterceptor`: attaches bearer access token and attempts refresh on 401 via `auth/refresh`
  - `LocalStorageService`: token/role persistence with environment-aware encryption toggle
- UI theming is tokenized via Tailwind v4 CSS variable layers in `src/assets/style_variants/` (do not hardcode palette values when token classes exist).

### Backend architecture (FastAPI, async SQLAlchemy)

- App entry: `src/app/main.py` uses `create_application(...)` from `core/setup.py` with custom lifespan.
- Lifespan initializes pools/services (DB tables, Redis cache/queue/rate-limit) and loads ML model at startup.
- API is versioned under `/api/v1`:
  - router mount chain: `api/__init__.py` → `api/v1/__init__.py`
  - admin routes also mounted under `/api/v1/admin`
- Request handling pattern:
  - endpoint/router validates + orchestrates
  - CRUD modules perform database operations
  - schemas in `schemas/` define request/response contracts
- Auth/rate limiting are dependency-driven in `api/dependencies.py`:
  - `get_current_user`, `get_current_superuser`
  - tier/path-based rate-limit resolution via Redis-backed `RateLimiter`
- Prediction and emergency alerts:
  - prediction endpoints in `api/v1/predict.py`
  - help-sign email dispatch in `services/email_service.py` (includes cooldown dedupe)

## Key codebase conventions

### Monorepo + submodule workflow convention

- Treat `frontend/` and `backend/` as independent repos. Changes inside each are committed/pushed in that submodule; root repo tracks only submodule pointers and root infra files.

### Frontend conventions

- Standalone Angular components with `ChangeDetectionStrategy.OnPush` are the default (aligned with `angular.json` schematics and existing code).
- Prefer Angular Signals (`signal`, `computed`, `effect`) for component state and derived UI state.
- Use TS path aliases defined in `tsconfig.json` (`@core/*`, `@pages/*`, `@layouts/*`, etc.) instead of deep relative imports when available.
- Route guarding convention:
  - `roleGuard` enforces authenticated access and admin gating for `/admin`
  - `guestGuard` blocks auth pages for already-authenticated users
- Backend communication convention:
  - all REST calls through `ApiService`
  - cookies included (`withCredentials: true`) and bearer token added by interceptor
- Theme/styling convention:
  - use design-token classes (`bg-bg-*`, `text-font-*`, `border-border-*`, etc.) from `style_variants`
  - avoid introducing one-off hardcoded colors unless unavoidable

### Backend conventions

- API routers focus on validation/orchestration; CRUD modules are the source of DB operations.
- Use async SQLAlchemy sessions (`async_get_db`) and dependency injection (`Depends`) consistently.
- Error handling uses project exception types from `core/exceptions/http_exceptions.py` for API semantics.
- Configuration is centralized in `core/config.py` (`Settings` from `.env` at `backend/src/.env`).
- Tests are pytest-based unit-style tests with heavy use of `AsyncMock`/`patch` (see `tests/test_auth.py`, `tests/test_sign_detections.py`).

## Existing AI instruction sources incorporated

- `frontend/.github/copilot-instructions.md`: Angular standalone + signal-oriented style
- `frontend/.cursor/rules/angular-20.mdc`: modern Angular patterns (signals, OnPush, template control flow)
- Root/FE/BE README files and `backend/CONTRIBUTING.md` for command and workflow alignment
