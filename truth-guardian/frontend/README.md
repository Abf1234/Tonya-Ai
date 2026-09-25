# Truth Guardian frontend

This directory contains the separate React + Vite public and official-portal client.

## Commands

```powershell
npm install
npm run dev       # http://localhost:5173
npm test
npm run build
npm run preview
```

The frontend uses Tailwind CSS, React Router, Axios, the Appwrite Web SDK, Lucide icons
and Recharts. The browser calls the Django REST API through the Axios client in
`src/services/api.js`. Appwrite owns browser identity and session management; Django
enforces official authorization after validating the short-lived JWT.

## API configuration

Copy `.env.example` to `.env` only when local overrides are needed. The safe frontend
variables are public Vite settings such as:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<public-project-id>
VITE_APPWRITE_DATABASE_ID=<reserved-appwrite-database-id>
VITE_APPWRITE_STORAGE_BUCKET_ID=<private-bucket-id>
```

Never add database, Appwrite server API keys, Google, OpenAI, Redis or other server
credentials to a `VITE_*` variable. Vite embeds public variables into the browser
bundle.

In the Appwrite console, register the local web platform, enable email/password
authentication and configure allowed origins. For production, use an HTTPS custom
domain/endpoint where possible and deploy a strict CSP. The storage bucket should remain
private; the current UI does not claim a file is stored or scanned until the backend
scanner and private-storage boundary are configured.

## Current scope

The public visual shell, route structure and shared accessible UI states are
implemented. The client supports public verification/assistant lookup, PostgreSQL
report submission with receipts and idempotency, approved-information search, a
role-aware official portal, and a `IsPlatformAdmin`-protected admin console with
monitoring counts, a source-URL registry and manual knowledge-base entry. Chat
responses are approved-source lookups; when the optional backend model is enabled they
are labelled `AI-assisted wording` with the backend's `ai_status`, and otherwise the UI
states that the deterministic lookup was used. A language selector (`auto`, `en`,
`krio`, `mende`, `temne`, `limba`) travels with each question without promising
translation quality. Alerts, fact-check publication, URL analysis, OCR, evidence
storage, knowledge-source extraction, Google Sheets synchronization and broad
administration remain explicitly unconfigured or empty.

Protected API calls opt into the short-lived Appwrite JWT interceptor. Public calls do
not request a token. Loading, error, empty, offline and reduced-motion states are
rendered in the UI rather than filled with demo data.
