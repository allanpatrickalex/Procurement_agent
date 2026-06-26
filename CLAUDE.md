# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Procurement Advisor Agent v2.0** — an AI-powered procurement platform. Users upload supplier quote PDFs, contract PDFs, and spend CSVs. The backend extracts text, sends it to Gemini 2.5 Pro, and returns structured JSON that is validated, persisted to SQLite, and returned to the React frontend. Features include multi-tenancy with JWT auth, savings tracking, contract renewal alerts, a procurement copilot chat, and AI-powered negotiation/RFP generation.

## Running the App

**Backend** (venv is at project root):
```
venv\Scripts\activate              # Windows
uvicorn app.main:app --reload --app-dir backend  # http://localhost:8000
```

**Frontend** (from `frontend/`):
```
npm install
npm run dev    # runs on http://localhost:5173, proxies /api → :8000
```

**Environment** — copy `.env.example` to `.env` and fill in:
```
GEMINI_API_KEY=...
DATABASE_URL=sqlite:///procurement.db
JWT_SECRET=change-me-in-production
REQUIRE_AUTH=false           # set to true to enforce JWT on all routes
ALLOWED_ORIGINS=http://localhost:5173
```

SQLite DB is created automatically at startup (`init_db()`). Dev org and admin user are seeded automatically.
Default dev credentials: `admin@local.dev` / `admin123`

API docs: `http://localhost:8000/docs`

## Architecture

```
React (Vite/MUI) + AuthContext
         ↓  JWT Bearer token
     FastAPI (get_current_user dependency → CurrentUser with org_id)
         ↓
     Agent (org-scoped DB writes + report saves)
         ↓
     GeminiService  →  Gemini 2.5 Pro
         ↓
     PDFService / CSVService
         ↓
     SQLite  +  JSON report files
```

## Directory Structure

- **Frontend** (`frontend/src/`):
  - `pages/` — Dashboard, SupplierAnalysis, ContractReview, SpendAnalysis, SavingsTracker, ContractRenewals, Copilot, Sourcing, Login
  - `components/` — Navbar (with notifications bell + user menu), FileUpload, ReportViewer, MappingConfirmModal
  - `contexts/AuthContext.jsx` — JWT auth context: `user`, `loading`, `login()`, `register()`, `logout()`
  - `services/api.js` — All API calls with axios interceptor attaching Bearer token from localStorage
  - `App.jsx` — ThemeProvider + AuthProvider + routes with `AuthGuard` redirecting unauthenticated to `/login`

- **Backend** (`backend/app/`):
  - `api/` — FastAPI routers: `auth.py`, `supplier.py`, `contracts.py`, `spend.py`, `dashboard.py`, `reports.py`, `savings.py`, `renewals.py`, `chat.py`, `negotiation.py`
  - `api/dependencies.py` — `get_current_user` dependency: returns `CurrentUser(id, org_id, role)`. Bypasses auth when `REQUIRE_AUTH=false` and no token (returns dev user org #1).
  - `agents/` — `SupplierAgent`, `ContractAgent`, `SpendAgent`, `NegotiationAgent`, `RfpAgent`
  - `services/gemini_service.py` — `GeminiService` cached via `@lru_cache`. `generate_json()` for structured output, `generate_text()` for the copilot.
  - `services/auth_service.py` — `hash_password`, `verify_password`, `create_access_token`, `decode_token` (python-jose + passlib/bcrypt).
  - `services/pdf_service.py` — pdfplumber → PyPDF2 fallback.
  - `services/csv_service.py` — adaptive CSV column mapping.
  - `services/pdf_export.py` — renders JSON reports to PDF.
  - `database/models.py` — 10 ORM models (see below).
  - `database/db.py` — `init_db()` runs migrations (`_add_column_if_missing`), seeds dev org + admin user.
  - `schemas.py` — Pydantic models validating all Gemini output.
  - `prompts/` — `supplier_analysis.txt`, `contract_review.txt`, `spend_analysis.txt`, `negotiation.txt`, `rfp_generation.txt`, `copilot.txt`

## Database Models

| Model | Key fields |
|---|---|
| `Organization` | id, name, plan_tier |
| `User` | id, org_id, email, hashed_password, role |
| `AuditLog` | org_id, user_id, action, entity_type, entity_id, ts |
| `SupplierAnalysis` | org_id (nullable), recommended_supplier, supplier_count, summary |
| `ContractReview` | org_id (nullable), contract_name, risk_level, summary |
| `SpendReport` | org_id (nullable), total_spend, vendor_count, top_category |
| `SavingsEntry` | org_id, source_type, source_id, identified_amount, realized_amount, status (identified/in_progress/realized) |
| `PricePoint` | org_id, category, item_description, unit_price, supplier_name, source_type, source_id |
| `ContractKeyDate` | org_id, contract_id, contract_name, renewal_date, notice_deadline, notice_period_days, auto_renewal, status |
| `Notification` | org_id, title, message, notification_type, entity_id, is_read |

`org_id` is nullable on the three original analysis tables for backward compatibility. Queries use `(org_id == X) | (org_id == None)` to include legacy data.

## Auth Flow

- `REQUIRE_AUTH=false` (dev default): no token → `_DEV_USER = CurrentUser(id=1, org_id=1, role="admin")`
- `REQUIRE_AUTH=true` (production): no/invalid token → 401
- Frontend attaches `Authorization: Bearer <token>` via axios interceptor
- `AuthContext` restores session from `localStorage` on mount via `GET /api/auth/me`

## Key Data Flow (Analysis)

1. Frontend uploads file(s) via `multipart/form-data` with Bearer token.
2. API route calls `get_current_user` → `CurrentUser` with `org_id`.
3. Agent saves upload under `backend/app/uploads/{type}/<uuid>/`.
4. Agent calls `PDFService.extract_text_from_bytes()` or `CSVService`.
5. Agent calls `GeminiService.generate_json(prompt_name, user_content)`.
6. Agent validates with Pydantic schema from `schemas.py`.
7. Agent persists to SQLite (stamped with `org_id`), saves JSON report to `backend/app/reports/`.
8. Agent writes side-effects: `SavingsEntry` rows (all agents), `PricePoint` rows (supplier), `ContractKeyDate` rows (contracts).
9. Returns result Pydantic model to frontend.

## Key Data Flow (Copilot)

`POST /api/chat` → `_build_data_context(db, org_id)` queries all org tables → injects as `{data_context}` into `copilot.txt` prompt → `generate_text()` → streamed reply.

## Adding a New Feature

1. Add prompt template to `backend/app/prompts/<name>.txt`.
2. Add Pydantic validation schemas to `backend/app/schemas.py`.
3. Create `backend/app/agents/<name>_agent.py` following existing agent patterns.
4. Add API router in `backend/app/api/<name>.py`, add `current_user = Depends(get_current_user)`, register in `backend/app/main.py`.
5. Add DB model to `backend/app/database/models.py` if needed; add migration call to `init_db()`.
6. Add frontend page under `frontend/src/pages/`, add API call to `services/api.js`, add route to `App.jsx`.

## Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `GEMINI_API_KEY` | required | Google AI Studio or Vertex AI key |
| `DATABASE_URL` | `sqlite:///procurement.db` | SQLite for local, Cloud SQL for prod |
| `JWT_SECRET` | `dev-secret-change-in-production` | Override for any deployed environment |
| `REQUIRE_AUTH` | `false` | Set `true` to enforce JWT on all routes |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS allowed origins |

## Tests

Backend tests live in `backend/tests/`. Run from project root with venv active:
```
pytest backend/tests/
pytest backend/tests/test_csv_service.py   # single file
```

No frontend test suite exists yet.
