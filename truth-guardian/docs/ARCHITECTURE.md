# Architecture

## System boundary

Truth Guardian is a modular platform. The public website, future mobile application, WhatsApp interface, official portal and administrative tools should use the same versioned Django REST APIs rather than duplicate business logic in clients.

```text
Public users
     │
     ├── Verify ─┐
     ├── Chat ───┼── React / future clients ── Django REST API
     └── Report ─┘                              │
                   │                            ├── PostgreSQL + pgvector
                   │                            ├── Trusted sources and documents
                   │                            ├── Verification/RAG services
                   │                            ├── Scam intelligence
                   │                            └── Celery + Redis workers
                   │                                      │
                   │                                      └── Google Sheets (operational export)
                   │
                   └── Appwrite Auth + Appwrite Storage
```

## Runtime components

### Frontend

- React and Vite provide a separate browser application.
- React Router owns public route navigation.
- The Appwrite Web SDK owns browser account/session state; the current email/password sign-in flow uses `Account.createEmailPasswordSession()` and restores the session with `Account.get()`. Registration remains reserved for a later phase.
- Axios is the only HTTP client boundary and keeps API configuration centralized. Protected calls opt into a short-lived Appwrite JWT; public calls do not request a token.
- Tailwind CSS provides responsive styling.
- Recharts is installed for future administration analytics.
- Lite Mode is a client preference that reduces motion and visual weight.

### Backend

- Django provides configuration, admin foundation and URL routing.
- Django REST Framework exposes JSON APIs.
- `apps.core` currently owns the API root and health contract.
- Domain packages are separated for accounts, institutions, sources, documents, verification, reports, incidents, indicators, chatbot, fact checks, alerts, analytics, notifications and audit logs.
- `config.celery` is configured for background tasks; domain tasks will be added with the reports and ingestion phases.

### Data and integrations

- PostgreSQL is the authoritative system of record for reports, evidence metadata and platform records.
- Appwrite Auth is the identity/session provider. Django does not create a parallel user password store.
- Appwrite Storage is the planned private object store for evidence. PostgreSQL stores file IDs and metadata; the browser will not bypass server-side validation/scanning.
- pgvector is provisioned in the development database image for future embedding retrieval.
- Redis is the Celery broker/result backend and will support future rate limiting and caching.
- Google Sheets is an operational/reporting export. It is never the source of truth.
- AI providers are called only by backend services. Browser code receives structured results and citations, never provider credentials.

## Request and reporting principles

### Verification

```text
Input
  → content extraction
  → claim extraction
  → entity extraction
  → scoped source search
  → evidence retrieval
  → comparison
  → assessment
  → citations
  → result
```

The pipeline must represent uncertainty. A result can be `UNVERIFIED`, `DISPUTED`, `POTENTIALLY MISLEADING`, `POTENTIAL SCAM`, `INSUFFICIENT EVIDENCE` or `UNDER REVIEW` rather than forcing a binary answer.

### Fraud reporting

```text
React form
  → POST /api/reports/
  → Django validation and authorization
  → PostgreSQL transaction
  → return report ID/number
  → enqueue Celery synchronization
  → Google Sheets
```

If Google Sheets is unavailable, the committed PostgreSQL report remains available and its synchronization state is `PENDING` or `FAILED` for retry. A report is never discarded because an external spreadsheet is down.

## Source trust model

A source is trusted for a defined scope, not universally. Registry records will include source type, verification level, scope, active state, last verification and last check dates. Official accounts and domains will be linked to the responsible institution and verification evidence. Unknown domains will be described as unverified, not automatically malicious.

## Human review and neutrality

AI may assist extraction, retrieval, clustering and analyst summaries. Human administrators remain responsible for criminal accusations, serious allegations, government officials, political claims, national emergencies, major financial schemes and conflicting official sources. The platform will not rank candidates or political actors and will not use political persuasion.

## Planned deployment topology

A production topology should use a managed PostgreSQL instance with pgvector, a private Redis instance, an Appwrite project (cloud or self-hosted), a Django API service, one or more Celery workers, a scheduled retry task, Appwrite Storage for evidence, and a CDN/edge-hosted React build. Health checks, structured logs, metrics, backups, secret management and audit retention belong in the deployment plan.
