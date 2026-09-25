# Truth Guardian Sierra Leone

**Verify Before You Share.**

Truth Guardian Sierra Leone is a modular civic information platform for citizens, journalists, public servants, authorized officials and organizations. The intended platform helps people verify suspicious claims, understand official sources, identify possible scams and report suspicious activity while preserving human review and political neutrality.

## Current status

The project foundation and the first Appwrite authentication slice are implemented. It intentionally does **not** simulate production integrations or advanced analysis.

### Available now

- Separate React + Vite frontend and Django REST API backend.
- Responsive public shell with Home, Verify, Truth Guardian, Report, Alerts, Fact Checks, Verified Information, Trusted Sources, Learn and About routes.
- Appwrite Web SDK configuration, email/password sign-in, session restoration, current-device sign-out, account view and safe unconfigured-state messaging.
- Short-lived Appwrite JWT validation for future protected Django API requests; no Django user passwords or DRF Basic/Session authentication.
- Appwrite Storage client configuration is reserved for the validated evidence workflow; public file uploads are not enabled yet.
- Accessible verification and chat workspaces that clearly state when advanced processing is not connected.
- Axios API client, Vite development proxy, Tailwind CSS, React Router and Recharts dependency.
- Django health API:
  - `GET /api/`
  - `GET /api/health/`
  - `GET /api/health/ready/`
- PostgreSQL-only application settings, pgvector-ready Docker service, Redis/Celery configuration and backend service package boundaries.
- Lite Mode preference for reduced motion and lighter browser presentation.
- Frontend and backend automated tests.

### Deliberately not active yet

Appwrite account registration, OAuth providers, MFA, role/RBAC enforcement, trusted-source ingestion, fraud report persistence, Google Sheets synchronization, evidence uploads, OCR, URL analysis, RAG/LLM calls, incident clustering, alerts, fact-check publication, notifications and the administrative dashboard are reserved for later phases. No API keys, source records, incidents or production results are fabricated.

## Repository layout

```text
truth-guardian/
├── frontend/                 React + Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── backend/                  Django REST API and Celery application
│   ├── config/
│   ├── apps/
│   ├── services/
│   ├── tests/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
├── .gitignore
├── .env.example
└── docker-compose.yml
```

The requested domain packages under `backend/apps/` and service packages under `backend/services/` exist as boundaries for incremental implementation. They do not yet contain domain models or integrations.

## Prerequisites

- Node.js 20.19+ (Node 22 LTS recommended for deployment containers).
- Python 3.11+ (Python 3.13 is supported by the current dependency set).
- PostgreSQL 15+ with pgvector available for the full architecture.
- Redis for Celery and future rate limiting.
- An Appwrite project with a regional API endpoint and email/password authentication enabled.
- Docker Desktop/Engine for the optional Compose workflow.

## Local setup

### Backend

```powershell
cd truth-guardian/backend
Copy-Item .env.example .env
```

Set a unique `SECRET_KEY` in `backend/.env`, then configure a PostgreSQL `DATABASE_URL`. Do not use the example secret in a deployed environment.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

The normal application settings require PostgreSQL. The automated test settings use an in-memory SQLite database only to keep isolated unit tests fast; this is not a production or local development database choice.

### Frontend

```powershell
cd truth-guardian/frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite proxy forwards `/api` requests to `http://127.0.0.1:8000` by default. Override it with `VITE_API_PROXY_TARGET` in a local, uncommitted `frontend/.env` if needed. Set `VITE_APPWRITE_ENDPOINT` (including the regional `/v1` path) and `VITE_APPWRITE_PROJECT_ID` to enable `/login`. These are public client settings; never put an Appwrite API key in a `VITE_*` variable.

### Optional Docker Compose

After copying `backend/.env.example` to `backend/.env` and setting a secret, also copy the root `.env.example` to `.env` and set the Appwrite endpoint/project IDs there for Compose:

```powershell
docker compose up --build
```

Compose provisions PostgreSQL with pgvector, Redis, Django, a Celery worker and Vite. The supplied `SECURE_*` values in the Compose environment are development-only; production deployments must terminate HTTPS and use production secrets.

## Validation commands

```powershell
# Backend
cd truth-guardian/backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe -m pytest

# Frontend
cd truth-guardian/frontend
npm test
npm run build
npm audit
```

## API foundation

- `GET /api/` returns service metadata and available foundation endpoints.
- `GET /api/health/` is a liveness check and does not query the database.
- `GET /api/health/ready/` checks PostgreSQL connectivity and returns `503` when the database is unavailable without exposing credentials or raw database errors.

See [`docs/API.md`](docs/API.md) for the contract and planned endpoint boundaries.

## Configuration and secrets

Required backend variables are documented in [`backend/.env.example`](backend/.env.example) and the root [`.env.example`](.env.example). The supplied Appwrite project/database identifiers are recorded in the ignored local environment files. `APPWRITE_DATABASE_ID` is reserved for a future Appwrite table integration; PostgreSQL remains authoritative and no Appwrite database writes are enabled. `APPWRITE_SERVER_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_NAME`, `OPENAI_API_KEY`, database credentials and Redis credentials are backend/deployment secrets. They must never be placed in React source, `VITE_*` variables, public JavaScript or HTML. Appwrite's endpoint, project ID and storage bucket ID are public identifiers, not secrets.

The Google Sheets and AI integrations are not configured in Phase 1. Their planned failure-tolerant designs are documented in [`docs/GOOGLE_SHEETS_SETUP.md`](docs/GOOGLE_SHEETS_SETUP.md) and [`docs/AI_RAG.md`](docs/AI_RAG.md).

## Development order

The next implementation stages follow the requested order: finish Appwrite authentication/RBAC and trusted sources, then reporting and PostgreSQL-first Google Sheets synchronization, followed by Celery retries, admin tools, verification, RAG, chatbot, scam intelligence, clustering, advanced analysis, official portals, alerts/fact checks, security/integration testing and deployment hardening.

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
