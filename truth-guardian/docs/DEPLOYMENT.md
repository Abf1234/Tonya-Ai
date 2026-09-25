# Deployment

This document describes the intended deployment path. Phase 1 provides Dockerfiles and a development Compose topology; no external service has been configured or claimed to be live.

## Local container topology

`docker-compose.yml` defines:

- `db`: PostgreSQL 16 with the pgvector extension image.
- `redis`: Redis 7 for Celery.
- `api`: Django development server with migrations on startup.
- `worker`: Celery worker.
- `frontend`: Vite development server.

Before running Compose, copy `backend/.env.example` to `backend/.env`, generate a unique `SECRET_KEY`, set local PostgreSQL credentials, and copy the root `.env.example` to `.env` with the public Appwrite endpoint/project variables. The backend receives the public Appwrite settings from the root Compose environment; keep the server API key in `backend/.env` or a secret manager. The key is optional until server-mediated storage or administration is enabled. Then run:

```powershell
docker compose up --build
```

The Compose file is for development. It uses development HTTP and credentials supplied by environment variables; do not expose it directly to the internet.

## Native development

```powershell
# backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000

# frontend, in another terminal
npm run dev
```

Gunicorn is included for Linux deployment. It depends on Unix `fcntl` and is not a Windows development server; use Django’s runserver on Windows.

## Production components

- **Frontend:** build `frontend/` on Vercel, Netlify or another static host. Set only public Vite variables and route `/api` to the backend origin.
- **Backend:** deploy `backend/` as a Django WSGI service on Render, Railway or a comparable platform using Gunicorn/uWSGI and a supported Linux runtime.
- **Database:** use managed PostgreSQL with pgvector enabled, TLS, automated backups and connection pooling.
- **Worker:** run a separate Celery worker process using the same code release and environment.
- **Broker:** use private Redis with authentication, TLS where supported and restricted network access.
- **Appwrite:** use a managed Appwrite Cloud project or a separately secured self-hosted instance. Register the production web platform, configure email/password and allowed origins, prefer a custom API domain for cookie-based session security, and keep the server API key in the platform secret manager.
- **Evidence storage:** use a private Appwrite Storage bucket with server-mediated validation, malware scanning and short-lived access URLs.
- **Secrets:** use the platform secret manager; never put Appwrite server keys, Google, OpenAI, database or Redis credentials in frontend environment variables.

## Release sequence

1. Build and scan the frontend and backend images.
2. Apply migrations using a one-off release job.
3. Start the API and worker.
4. Run liveness and readiness checks.
5. Deploy the frontend and verify the browser/API boundary.
6. Run smoke, integration, permission and security tests.
7. Keep a rollback migration/recovery plan for database changes.

## Health endpoints

- `GET /api/health/` checks process liveness.
- `GET /api/health/ready/` checks database connectivity.
- A failed readiness check should remove an instance from traffic without exposing database error details.
