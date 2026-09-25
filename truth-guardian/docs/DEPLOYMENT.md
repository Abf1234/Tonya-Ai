# Deployment

This document describes the intended deployment path. The repository provides a
public-slice Django API and React client plus a development Compose topology; no
external service should be treated as live unless its own health/configuration checks
confirm it.

## Local container topology

`docker-compose.yml` defines a development topology for:

- `db`: PostgreSQL 16 with the pgvector extension image.
- `redis`: Redis 7 for optional Celery work.
- `api`: Django service with migrations on startup.
- `worker`: optional Celery worker.
- `frontend`: Vite development server.

Before running Compose, copy `backend/.env.example` to `backend/.env`, generate a
unique `SECRET_KEY`, set local PostgreSQL credentials, and copy the root `.env.example`
to `.env` with the public Appwrite endpoint/project variables. Keep the Appwrite server
API key in `backend/.env` or a secret manager. The key is optional until a real
server-mediated storage or administration integration is enabled.

```powershell
docker compose up --build
```

The Compose file is for development. It uses development HTTP and credentials supplied
by environment variables; do not expose it directly to the internet.

## Native development

```powershell
# backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000

# frontend, in another terminal
npm run dev
```

Gunicorn is included for Linux deployment. It depends on Unix `fcntl` and is not a
Windows development server; use Django's `runserver` on Windows.

## Production components

- **Frontend:** build `frontend/` on a static host or CDN. Set only public Vite
  variables and route `/api` to the backend origin.
- **Backend:** deploy `backend/` as a Django WSGI service on a supported Linux runtime
  using Gunicorn/uWSGI.
- **Database:** use managed PostgreSQL with TLS, automated backups and connection
  pooling. The application rejects non-PostgreSQL normal configurations.
- **Identity:** use a secured Appwrite Cloud project or self-hosted instance, register
  production origins, configure email verification/MFA/session limits and keep the
  server key in a secret manager.
- **Evidence storage:** use a private Appwrite Storage bucket only after server-side
  validation, malware scanning and access-audit controls are deployed.
- **Workers/broker:** run Celery and private Redis only for features that have real
  workers and retry/audit policies. The current public slice does not claim that a
  Sheets, OCR or evidence worker ran.
- **Secrets:** never put Appwrite server keys, Google, Hugging Face, database or Redis
  credentials in frontend environment variables.
- **Optional assistant model:** set `HUGGINGFACE_ENABLED`, `HUGGINGFACE_TOKEN`,
  `HUGGINGFACE_API_URL` and `HUGGINGFACE_MODEL` only in the server/secret store. Leave
  the flag off unless a rotated token is available; the assistant degrades to the
  deterministic approved-source lookup when the provider is disabled, unreachable or
  returns an unusable response.
- **Admin console:** `/admin` requires an approved `ADMIN`/`SUPER_ADMIN` row. Restrict
  it to real staff accounts, enable MFA for those accounts, and keep a deployment-level
  access log. The console returns aggregate counts only and is served `no-store`.

## Release sequence

1. Build and scan frontend/backend artifacts.
2. Apply migrations using a one-off release job.
3. Start the API and any explicitly enabled workers.
4. Run liveness and readiness checks.
5. Deploy the frontend and verify the browser/API boundary.
6. Run smoke, integration, permission and security tests.
7. Keep a rollback migration/recovery plan for database changes.

## Health endpoints

- `GET /api/health/` checks process liveness.
- `GET /api/health/ready/` checks database connectivity.
- A failed readiness check should remove an instance from traffic without exposing
  database error details.

A production `check --deploy` should be run with HTTPS, secure cookies, HSTS and
`DEBUG=False` configured deliberately. Do not enable HSTS until all covered hosts are
HTTPS-only.
