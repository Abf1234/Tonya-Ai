# Architecture

## Current system boundary

Truth Guardian is a modular civic-tech platform. The current repository contains a
React/Vite browser client and a Django REST API. PostgreSQL is authoritative for
platform records. Appwrite owns browser identity and sessions; Django validates a
short-lived Appwrite JWT and then applies server-side official authorization.

```text
Browser (React/Vite)
  ├─ public verification / assistant
  ├─ public fraud reporting
  ├─ approved official information
  ├─ official portal
  └─ platform admin console
          │
          ├─ Appwrite Account + session (browser only)
          │          └─ short-lived JWT ───────────────┐
          └───────────────────────────────────────────┤
                                                      ▼
                                               Django REST API
                                                ├─ public records
                                                ├─ reports/receipts
                                                ├─ approved-source lookup
                                                ├─ optional assistant language layer
                                                ├─ official review workflow
                                                └─ admin monitoring + source registry
                                                      │
                                                      ▼
                                                  PostgreSQL
```

The frontend and API are deliberately split so a future mobile, messaging or
partner client can use the same contracts without duplicating business rules.

## Runtime components

### Frontend

- React, Vite, React Router, Tailwind CSS and `lucide-react` provide the browser app.
- Appwrite Web SDK owns account/session restoration and sign-in. Appwrite server API
  keys are never read by Vite.
- Axios is the HTTP boundary. Public calls do not request an Appwrite JWT; protected
  official calls opt into a short-lived JWT.
- Routes for public verification, assistant, reporting, approved information, alerts,
  fact checks, sources, learning, the official portal and the platform admin console
  are available. Lazy-loaded pages, accessible focus states, reduced-motion styles,
  loading/error/empty states and a top-level error boundary are in the shared UI layer.
- The client presents evidence strength and source provenance, not an absolute truth
  score. It only uses a “Verified source” label for explicit backend verification
  metadata.
- The assistant UI labels optional AI wording with the backend's `ai_status`, exposes a
  language selector (`auto`, `en`, `krio`, `mende`, `temne`, `limba`), and states the
  model's limitations instead of implying fluency or authority.

### Backend

- Django and Django REST Framework provide settings, URL routing, authentication
  boundary, serializers, permissions and error envelopes.
- `apps.core` owns API metadata and health checks.
- `apps.accounts` validates Appwrite principals and server-side official roles.
- `apps.institutions` stores manually approved institutions and official-user records.
- `apps.documents` stores reviewed official documents and exposes public information
  plus the scoped official submission/review queue.
- `apps.reports` stores citizen reports and safe receipts in PostgreSQL.
- `apps.assistant` implements a deterministic lookup against approved official
  documents, plus an optional, disabled-by-default backend-only provider layer that
  can only rephrase retrieved excerpts.
- `apps.core` also owns the shared error envelope used by every handler and manual
  error response.
- The API defaults to authenticated access; public views opt into `AllowAny`
  explicitly.

### Data and integrations

- PostgreSQL stores reports, document metadata, institution approvals and public
  record content. It is the system of record.
- Appwrite Auth is the identity/session provider. Django does not create a parallel
  password store for API users.
- Appwrite Storage is reserved for private evidence. In the current configuration,
  evidence is accepted only after a server-side scanner and private storage boundary
  are configured. With the default configuration, a supplied file receives a truthful
  `503 evidence_upload_unavailable` response.
- Redis/Celery settings exist for future workers, but no current report, extraction or
  synchronization worker claims to have run.
- Google Sheets is an optional operational export. No service-account credentials,
  sheet schema or sync worker is configured, so report sync state is
  `NOT_CONFIGURED`.
- No embedding pipeline or vector index is configured. The assistant searches approved
  PostgreSQL records directly and reports `ai_generated: false` unless the optional
  backend provider is deliberately enabled, in which case it reports
  `ai_generated: true` with an explicit `ai_status` and the same source cards.
- A `KnowledgeSource` row records an approved URL for future review only. No worker
  fetches, extracts or indexes it, so `processing_status` stays `NOT_CONFIGURED`.

## Request flows

### Approved-source verification and assistant

```text
Text claim (+ optional language selection)
  → Django validation
  → title/description/body match against approved, current documents
  → source metadata and short excerpt (if found)
  → optional backend provider rephrasing (disabled by default)
  → redaction, URL allowlisting and reference cleanup
  → evidence_found or not_verified response with ai_generated / ai_status
  → React result with status, limitations and provenance
```

A result means that matching approved material was found. It does not mean that a
claim is absolutely true, current in every context, or supported by an unconfigured
model. Citizen reports are not treated as facts and are not included in the assistant
search.

### Platform admin console

```text
Admin signs in (Appwrite session)
  → GET /api/admin/overview/ (aggregate counts + integration states)
  → GET /api/admin/knowledge-sources/ (registry, max 100)
  → POST /api/admin/knowledge-sources/ (HTTPS + verified-domain allowlist)
  → manual knowledge record via POST /api/official/documents/ (PENDING_REVIEW)
  → no report text, contact details or private fields are returned
```

Every admin request requires a valid Appwrite JWT plus an approved server-side
`ADMIN`/`SUPER_ADMIN` record, and is served with `Cache-Control: no-store`. Adding a
URL records review intent; it never triggers a fetch, extraction, index build or
publication.

### Fraud reporting

```text
React form
  → POST /api/reports/ (optional Idempotency-Key)
  → DRF field validation
  → optional evidence validation
  → PostgreSQL report transaction
  → safe receipt (TG-YYYY-NNNNNN)
  → no Sheets or provider synchronization in this slice
```

A report is committed to PostgreSQL before any optional downstream work. Anonymous
reports discard optional contact details before persistence. The receipt contains a
reference, status, timestamp and evidence-processing status; it never exposes contact
information or provider IDs.

### Official content and human review

1. An approved official submits a manual-text or verified-domain document.
2. The document is stored as `PENDING_REVIEW`; it is not public.
3. A reviewer in the same institution (or a platform admin) reviews it under a database
   lock. Cross-institution review is denied in both the view and service layer.
4. Approval requires active verified institution state, a non-expired date and
   available/manual text. A rejection requires a reason.
5. Only approved, published, current, effective and non-expired records from active
   verified institutions are returned by public information and assistant queries.

No current endpoint fetches a source URL, extracts a PDF, calls OCR, performs URL
analysis, or simulates a malware scan. A future ingestion worker must be explicit
about each of those operations and retain provenance/audit metadata.

## Trust and neutrality model

Trust is scoped: an approved government domain supports a particular institution and
source type, not every claim on the public web. Unknown domains and citizen reports are
described as unverified or non-authoritative rather than automatically fraudulent.

Serious allegations, criminal accusations, officials, emergencies, political claims
and major financial schemes require human review and auditability. The platform does
not rank political actors or provide political persuasion. It preserves conflicting
sources and uncertainty when future retrieval expands the evidence set.

## Deployment shape

A production deployment should use managed PostgreSQL, a private Appwrite project and
private storage bucket, a Django API, a CDN/edge-hosted frontend build, a supported
malware scanner, and a managed worker system for extraction and retries once those
features are enabled. HTTPS, secure cookies, HSTS, CSP, rate limits, audit retention,
backups, secret management, database TLS and monitoring belong in the deployment
configuration. The current local test configuration is not a production deployment.
