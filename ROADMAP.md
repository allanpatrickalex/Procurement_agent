# Procurement Advisor — Roadmap

## Completed ✅

- **Phase 0** — Stability: startup env validation, spend_agent bug fix
- **Phase 1** — Auth + multi-tenancy: JWT auth, org isolation, dev bypass, seeded dev org
- **Phase 2** — Savings Tracker + Benchmarking: SavingsEntry ledger, PricePoint table, Savings Tracker page
- **Phase 3** — Contract Renewals: ContractKeyDate extraction, urgency classification, Notifications, Renewals page
- **Phase 4** — Procurement Copilot: `/api/chat` with data-context injection, Copilot page with chat UI
- **Phase 5** — Sourcing Assistant: NegotiationAgent (strategy + supplier email), RfpAgent, Sourcing page

---

## Remaining TODO

### Phase 6 — Enterprise Hardening

Pursue once mid-market traction exists. These unlock large enterprise (P&G-scale) buyers.

#### 6a — SSO
- Enable SAML/OIDC in Identity Platform (Firebase Auth or Vertex Identity)
- Per-org `sso_config` field on `Organization` model already stubbed
- Admin UI to configure SSO provider per org

#### 6b — RBAC
- Enforce roles (admin / analyst / viewer) in `get_current_user` dependency
- `require_admin` dependency already written in `api/dependencies.py`
- Frontend route/button gating by role

#### 6c — GCP Production Stack
- Switch SQLite → Cloud SQL for PostgreSQL + Alembic migrations
- Switch local `uploads/`+`reports/` → Cloud Storage (GCS), keyed by `org_id`
- Switch Gemini AI Studio key → Vertex AI (`genai.Client(vertexai=True, project, location)`)
- Containerize backend → Cloud Run; frontend → Firebase Hosting
- Move secrets to Secret Manager

#### 6d — Compliance + Audit
- Complete audit-log coverage (every write stamps `AuditLog`)
- Data retention + right-to-be-forgotten jobs
- VPC-SC around Vertex for SOC2 story
- Encryption at rest: Cloud SQL default + CMEK option

#### 6e — Integrations
- ERP connectors: NetSuite, SAP, QuickBooks — auto-ingest spend CSVs
- Email-to-inbox ingestion: forward a PDF → system analyzes automatically
- Slack/Teams webhooks for renewal alerts

#### 6f — Scheduled Alerts
- Cloud Scheduler → daily renewal sweep endpoint
- Email delivery via SendGrid (GCP Marketplace) for renewal notifications
