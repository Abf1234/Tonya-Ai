# Truth Guardian Sierra Leone

**Verify Before You Share.**

Truth Guardian Sierra Leone is a modular civic information platform for citizens,
journalists, public servants, authorized officials and organizations. It helps people
inspect suspicious claims, find approved official information, use an approved-source
assistant and report suspicious activity while preserving privacy, provenance and
human review.

## Current status

The repository now contains a working **public-slice** application rather than a
simulated production platform. It deliberately reports unavailable integrations
instead of inventing verification, uploads, citations, AI processing or notifications.

### Available now

- Responsive React + Vite frontend with public routes for Home, Verify, Truth Guardian
  assistant, Report, Alerts, Fact Checks, Verified Information, Trusted Sources, Learn,
  About, account, official portal and a protected platform admin console.
- Appwrite email/password sign-in, session restoration, current-device sign-out and
  short-lived JWT support for explicitly protected Django requests.
- Public PostgreSQL-backed fraud reporting with anonymous mode, validation, stable
  idempotency keys, safe `TG-YYYY-NNNNNN` receipts, copy-reference UX and duplicate
  submission protection.
- Public approved-official information search/detail and an approved-source assistant.
  The assistant always performs a deterministic database lookup, returns provenance and
  uncertainty, and reports `ai_generated` / `ai_status` so the UI can state whether an
  optional, disabled-by-default backend language model helped.
- Official document submission and review workflow with server-side institution checks,
  reviewer/institution scoping, rejection reasons, approval gates and public-record
  status filters.
- A platform-admin console (`/admin`, `/admin/monitoring`, `/official/admin`) with
  aggregate monitoring counts, explicit integration states, an approved-domain URL
  registry for a future extraction worker, and manual knowledge-base records that enter
  the normal review queue. Registering a URL records intent only: no fetching,
  extraction, indexing or publication is simulated.
- Evidence selection, drag/drop, screenshot paste, PDF/image previews, local validation
  and progress UI. File storage and malware scanning remain fail-closed until their
  server-side dependencies are configured.
- Shared accessible UI primitives, keyboard focus states, reduced-motion support,
  loading/error/empty states, lazy routes and a top-level error boundary.
- PostgreSQL-only normal settings, Appwrite authentication boundary, health endpoints,
  backend/frontend tests and production build configuration.

### Deliberately not active yet

Appwrite registration/OAuth/MFA setup, private evidence storage, malware scanning, OCR,
URL analysis, a knowledge-source extraction worker, embedding retrieval, Google Sheets
synchronization, public incident/alert/fact-check publication feeds, notifications,
clustering, broad analyst tools and production rate limiting are not implemented. The
optional Hugging Face language layer is server-only, off by default, and degrades to
the deterministic lookup. No API key, source record, incident, citation, upload,
notification or model result is fabricated.

## Repository layout

```text
truth-guardian/
├── frontend/                 React + Vite public, official-portal and admin client
│   ├── src/
│   ├── package.json
│   └── .env.example
├── backend/                  Django REST API
│   ├── apps/
│   │   ├── core/             API root, health and error envelope
│   │   ├── accounts/         Appwrite principal and official authorization
│   │   ├── institutions/     approved institutions and official roles
│   │   ├── documents/        official submission/review, public info, admin console
│   │   ├── reports/          citizen reports and receipts
│   │   └── assistant/        approved-source lookup and optional language layer
│   ├── services/evidence.py  fail-closed evidence boundary
│   ├── tests/
│   ├── config/
│   └── .env.example
├── docs/
├── .env.example
└── docker-compose.yml
```

PostgreSQL is authoritative for reports, official records and authorization data.
Appwrite owns browser identity/session state. Appwrite Storage, Google Sheets, AI
providers and worker services are optional future integrations and are not assumed to
be running locally.

## Prerequisites

- Node.js 20.19+ (Node 22 LTS recommended)
- Python 3.11+ (the current dependency set supports Python 3.13)
- PostgreSQL 15+ for normal application settings
- An Appwrite project with a regional `/v1` endpoint and email/password authentication
- Redis only if Celery/worker work is being developed
- Docker Desktop/Engine for the optional Compose workflow

The backend test settings use an isolated SQLite database for fast tests. That is not a
production database choice; normal settings reject non-PostgreSQL databases.

## Local setup

### Backend

```powershell
cd truth-guardian/backend
Copy-Item .env.example .env
```

Set a unique `SECRET_KEY`, a PostgreSQL `DATABASE_URL` and the Appwrite public endpoint
and project ID if protected official routes will be exercised. Never use the example
secret in a deployed environment and never put `APPWRITE_SERVER_API_KEY` in a
`VITE_*` variable.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend

```powershell
cd truth-guardian/frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite proxy forwards `/api` to
`http://127.0.0.1:8000` by default. Set `VITE_APPWRITE_ENDPOINT` (including the
regional `/v1` path) and `VITE_APPWRITE_PROJECT_ID` in an ignored local `.env` to
exercise Appwrite sign-in. These are public client settings; never add server keys,
database credentials or provider secrets to Vite variables.

### Optional Docker Compose

After copying `backend/.env.example` to `backend/.env` and setting a unique secret,
copy the root `.env.example` to `.env`, set the required public Appwrite identifiers,
and run:

```powershell
docker compose up --build
```

Compose provides the development database/Redis/frontend tooling. Its security values
are development-only; production deployments must terminate HTTPS and use production
secrets.

## Validation commands

```powershell
# Backend
cd truth-guardian/backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run --settings=config.test_settings

# Frontend
cd truth-guardian/frontend
npm test
npm run build
```

Run `manage.py check --deploy` with production environment values. A development or
test configuration will warn about HTTPS redirects, secure cookies, HSTS and `DEBUG`
until those values are deliberately enabled.

## Current API slice

- `GET /api/` returns service metadata and the live route map.
- `GET /api/health/` is a liveness check and does not query PostgreSQL.
- `GET /api/health/ready/` checks PostgreSQL without exposing raw errors.
- `POST /api/reports/` creates a PostgreSQL report and safe receipt; supplied evidence
  fails honestly with `503 evidence_upload_unavailable` until the scanner/storage
  boundary is configured.
- `GET /api/public/verified-information/` and its detail route expose only approved,
  current, effective, non-expired records from active verified institutions.
- `POST /api/assistant/` and `POST /api/fact-checks/` perform the same approved-source
  lookup, accept an optional `language`, and call a model only when the optional
  backend provider is enabled and evidence was found.
- `/api/official/documents/`, `/api/official/documents/review/{id}/`,
  `/api/official/institutions/` and `/api/official/dashboard/` implement the protected
  official workflow.
- `/api/admin/overview/` and `/api/admin/knowledge-sources/` are restricted to approved
  platform administrators and return aggregate monitoring data only.

See [`docs/API.md`](docs/API.md) for request fields, status semantics, authorization and
error contracts.

## Configuration and secrets

Backend variables are documented in [`backend/.env.example`](backend/.env.example) and
the root [`.env.example`](.env.example). Appwrite endpoint/project/bucket identifiers
are public configuration; the server API key, database password, Google service-account
JSON, provider keys and Redis credentials are backend/deployment secrets. They must
never be placed in React source, `VITE_*` variables, public JavaScript, logs, fixtures
or documentation.

The current report flow does not synchronize to Google Sheets, and the optional
assistant language model is disabled unless `HUGGINGFACE_ENABLED=True` and a rotated
`HUGGINGFACE_TOKEN` are configured on the server. Their status is explicit in the
API/UI and the integration documents.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md)
- [`docs/API.md`](docs/API.md)
- [`docs/GOOGLE_SHEETS_SETUP.md`](docs/GOOGLE_SHEETS_SETUP.md)
- [`docs/AI_RAG.md`](docs/AI_RAG.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md)
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
