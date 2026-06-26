# Procurement Advisor — Feature Summary (v2.0.0)

This file is a concise summary of all agents, features, and endpoints in this repository.

---

## Agents & Primary Capabilities

### Core Analysis Agents
- **SupplierAgent** — Upload multiple supplier quote PDFs → AI ranks suppliers 0–100, identifies lowest-cost winner, records `PricePoint` rows for benchmarking, and writes `SavingsEntry` rows to the tracker.
- **ContractAgent** — Upload a single contract PDF → AI extracts risk levels (Low/Medium/High), key dates (renewal, notice period, auto-renewal), and writes `ContractKeyDate` rows for the renewal monitor.
- **SpendAgent** — Upload a procurement CSV → AI normalizes columns, calculates spend by vendor/category, finds savings opportunities, and records `SavingsEntry` rows.

### New Sourcing Agents
- **NegotiationAgent** — Provide free-text context → AI returns negotiation levers, target price, BATNA, walk-away point, and a ready-to-send supplier email draft.
- **RfpAgent** — Describe a procurement need → AI generates a complete RFP document with sections, evaluation criteria, scoring matrix, and timeline. Exports to PDF.

---

## API Endpoints (FastAPI, all under `/api`)

### Auth (Phase 1)
- `POST /api/auth/register` — Create org + admin user, returns JWT
- `POST /api/auth/login` — Verify credentials, returns JWT
- `GET /api/auth/me` — Return current user profile

### Core Analysis
- `POST /api/suppliers/analyze` — Upload multiple PDFs for supplier comparison
- `POST /api/contracts/analyze` — Upload a contract PDF for risk review + key date extraction
- `POST /api/spend/map` — Upload CSV headers for adaptive column mapping preview
- `POST /api/spend/analyze` — Upload CSV with confirmed column mapping

### Reports
- `GET /api/reports/{type}/{id}` — Retrieve stored JSON report
- `GET /api/reports/{type}/{id}/pdf` — Download report as PDF

### Dashboard
- `GET /api/dashboard` — Aggregated summary: analyses, contracts, savings realized

### Savings Tracker (Phase 2)
- `GET /api/savings` — Summary + entries list (identified / in_progress / realized)
- `PATCH /api/savings/{entry_id}` — Update savings status or realized amount

### Contract Renewals & Notifications (Phase 3)
- `GET /api/renewals` — All contract key dates with urgency classification
- `PATCH /api/renewals/{key_date_id}/status` — Mark renewed or cancelled
- `POST /api/renewals/sweep-alerts?days_ahead=N` — Scan and create notification rows
- `GET /api/notifications` — List unread notifications
- `POST /api/notifications/{id}/read` — Mark one notification read
- `POST /api/notifications/mark-all-read` — Dismiss all

### Procurement Copilot (Phase 4)
- `POST /api/chat` — Multi-turn AI chat with full org data context injected

### Sourcing Assistant (Phase 5)
- `POST /api/sourcing/negotiate` — Generate negotiation strategy + supplier email
- `POST /api/sourcing/rfp` — Generate RFP document JSON
- `POST /api/sourcing/rfp/pdf` — Export RFP to PDF bytes

---

## Database Models

| Model | Purpose |
|---|---|
| `Organization` | Multi-tenant org record |
| `User` | User with email, hashed password, role, org_id |
| `AuditLog` | Action audit trail per org |
| `SupplierAnalysis` | Supplier quote comparison result (org-scoped) |
| `ContractReview` | Contract risk review result (org-scoped) |
| `SpendReport` | Spend CSV analysis result (org-scoped) |
| `SavingsEntry` | Savings ledger: identified → in_progress → realized |
| `PricePoint` | Historical unit prices for benchmarking |
| `ContractKeyDate` | Renewal dates + notice deadlines per contract |
| `Notification` | In-app alerts (renewal alerts, etc.) |

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Sign in / register with JWT auth |
| `/` | Dashboard | Summary tiles: analyses, contracts, savings |
| `/suppliers` | SupplierAnalysis | Upload + review supplier quote comparisons |
| `/contracts` | ContractReview | Upload + review contract risk reports |
| `/spend` | SpendAnalysis | Upload + review spend CSV analyses |
| `/savings` | SavingsTracker | Track identified vs. realized savings |
| `/renewals` | ContractRenewals | Renewal calendar with urgency levels |
| `/copilot` | Copilot | Multi-turn AI chat over procurement data |
| `/sourcing` | Sourcing | Negotiation strategies + RFP generation |

---

## Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `GEMINI_API_KEY` | required | Google AI Studio or Vertex API key |
| `DATABASE_URL` | `sqlite:///procurement.db` | SQLite for local; Cloud SQL for prod |
| `JWT_SECRET` | `dev-secret-change-in-production` | Must be overridden for production |
| `REQUIRE_AUTH` | `false` | Set to `true` to enforce JWT on all routes |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | Comma-separated CORS origins |

---

## Running Locally

```bash
# Backend (from project root with venv active)
venv\Scripts\activate
uvicorn app.main:app --reload --app-dir backend   # http://localhost:8000

# Frontend
cd frontend && npm install && npm run dev          # http://localhost:5173
```

Default dev credentials (auto-seeded): `admin@local.dev` / `admin123`
