# REST API contract

Base path: `/api/`

This is the current public-slice contract for the React client. Django REST Framework
serves the public civic-tech workflows and the approved-official portal. The browser
calls Appwrite Account directly for identity and sessions; it does not send Appwrite
server credentials to Django or Vite.

The API does not currently call a vector index, URL scanner, Google Sheets
synchronizer, malware scanner or evidence-storage worker. Those integrations are
represented only by explicit, non-success states until their services are configured.
The only model-backed feature is an **optional, disabled-by-default, backend-only**
Hugging Face language layer for the public assistant, which always degrades to the
deterministic approved-source lookup (see [AI_RAG.md](AI_RAG.md)).

## Service metadata and health

### `GET /api/`

The root advertises the live routes and the bounded implementation status:

```json
{
  "service": "Truth Guardian Sierra Leone API",
  "version": "0.2.0",
  "status": "public-slice",
  "documentation": "/docs/API.md",
  "endpoints": {
    "liveness": "/api/health/",
    "readiness": "/api/health/ready/",
    "public_fraud_reports": "/api/reports/",
    "public_verified_information": "/api/public/verified-information/",
    "public_assistant": "/api/assistant/",
    "public_fact_check": "/api/fact-checks/",
    "official_documents": "/api/official/documents/",
    "official_dashboard": "/api/official/dashboard/"
  }
}
```

### `GET /api/health/`

Liveness does not query PostgreSQL. A healthy response is:

```json
{"status":"ok","service":"truth-guardian-api"}
```

### `GET /api/health/ready/`

Readiness performs a minimal PostgreSQL query. It returns `200` with
`{"status":"ready","checks":{"database":"available"}}` or `503` with
`{"status":"unavailable","checks":{"database":"unavailable"}}`. Raw database errors and
credentials are never returned.

## Public endpoints

### `POST /api/reports/`

Accepts a public fraud/suspicious-information report without login. JSON and
`multipart/form-data` are supported because a future private evidence pipeline may
receive one file.

Fields:

- `claim` (required, trimmed text)
- `description` (optional)
- `category` (optional, defaults to `OTHER`)
- `is_anonymous` (optional boolean)
- `contact_email` and `contact_phone` (optional; discarded when anonymous)
- `evidence` (optional file; currently fail-closed until scanning and private storage
  are configured)

The client should send a stable `Idempotency-Key` header for one draft (up to 128
characters, using letters, numbers, `-`, `_`, `:`, or `.`). A first successful
request returns `201`; replaying the same key returns `200` with the original
receipt and does not upload or scan evidence again.

Receipt example:

```json
{
  "report_id": "TG-2026-000123",
  "status": "RECEIVED",
  "created_at": "2026-01-01T12:00:00Z",
  "evidence_processing_status": "NOT_PROVIDED",
  "message": "Your report was received. Keep this reference for follow-up."
}
```

Public responses contain no reporter contact details, private notes or provider IDs.
There is no public report-list endpoint in this slice.

If a file is supplied, the server validates size, MIME type, signature and a bounded
safe filename. It then requires both a configured malware scanner and an Appwrite
server key/private bucket. Until those conditions are met, the request returns
`503` with error code `evidence_upload_unavailable`; the API never pretends an upload
or scan succeeded.

### `GET /api/public/verified-information/`

Lists up to 100 currently public official records. Optional query parameters are
`q` (title/description/body search) and `category` (case-insensitive exact match).
The response reports the full matching count while capping the result list:

```json
{
  "count": 1,
  "results": [
    {
      "id": 12,
      "title": "Reviewed public notice",
      "description": "A short description",
      "institution_name": "Ministry of Test Information",
      "institution_acronym": "MTI",
      "category": "Public notice",
      "document_type": "PUBLIC_NOTICE",
      "source_url": "https://moti.test/notice",
      "publication_date": "2026-01-01",
      "effective_date": "2026-01-01",
      "expiry_date": null,
      "version_number": 1,
      "verification_status": "approved_official"
    }
  ]
}
```

A record is eligible only when it is `APPROVED`, published, current, associated with
an active verified institution, effective, and not expired. The detail route is
`GET /api/public/verified-information/{id}/` and uses the same policy. A match here
means an approved record was found; it is not an absolute truth score for a claim.

### `POST /api/assistant/`

Runs the public approved-source lookup. Input:

```json
{"query":"Is this recruitment notice official?","language":"krio"}
```

`query` is required (or `claim`/`url` as aliases). `language` is optional and must be
one of `auto`, `en`, `krio`, `mende`, `temne`, `limba`; an unsupported value returns
`400` with code `validation_error` instead of silently falling back. `auto` asks the
optional model to detect the user's language.

The response uses `status: "evidence_found"` or `"not_verified"`, includes a plain
answer, an `evidence` array with direct source metadata, `evidence_strength`, an
explicit `limitations` field, and AI metadata:

```json
{
  "status": "evidence_found",
  "answer": "One approved record matches this text.",
  "evidence": [{"id": 12, "title": "Reviewed public notice"}],
  "evidence_strength": "limited",
  "ai_generated": false,
  "ai_status": "disabled",
  "language": "krio",
  "limitations": "This lookup is limited to approved official records."
}
```

`ai_generated` is `true` only when the optional provider returned grounded wording for
a matched excerpt. `ai_status` is one of `grounded`, `not_needed`,
`disabled`, `not_configured` or `unavailable`, and tells the client whether the
deterministic lookup was used. No provider key, token, model name or provider error
is ever returned. `evidence_found` means matching approved material was found, not
that every part of the user's claim is true.

`POST /api/fact-checks/` is an alias of the same lookup route for the public fact-check
workspace; it is not a separate publication feed.

## Official endpoints and authorization

These endpoints require a valid Appwrite session JWT sent as:

```http
Authorization: Bearer <short-lived-appwrite-jwt>
```

Django also requires a server-side `OfficialUser` row with `APPROVED` status. Appwrite
labels or account metadata alone do not grant access. Non-platform-admin officials
must belong to an active institution whose verification status is `VERIFIED`.
`ADMIN` and `SUPER_ADMIN` may be institutionless.

### `GET /api/official/documents/`

Returns a scoped document queue. Reviewers (`VERIFICATION_OFFICER`, `ADMIN` and
`SUPER_ADMIN`) see their institution queue; platform admins see all institutions;
other officials see their own submissions. Results are capped at 100 and the total
count is returned separately.

### `POST /api/official/documents/`

Accepts a manual-text or verified-domain official submission. Important fields are
`title`, `category`, optional `body_text`, `source_url`, publication/effective/expiry
dates, `document_type`, and optional `evidence`. The source URL must use HTTPS and a
verified institution domain. New records are `PENDING_REVIEW` and are not public.

A document cannot be approved until it has manually supplied or genuinely extracted
text. URL/file extraction is not configured yet, so a URL-only record remains pending
and cannot be approved by pretending it was processed. Evidence files are subject to
the same fail-closed `503 evidence_upload_unavailable` behavior as public reports.

### `POST /api/official/documents/review/{id}/`

Requires a reviewer permission and institution scope. The `action` is one of:

- `approve`
- `reject` (a non-empty `reason` is required)
- `archive`
- `expire`

Approval requires a pending document, active verified institution, a non-expired date,
and available/manual text. The service repeats authorization checks under a database
lock to prevent cross-institution review even if a view-level check is bypassed.

### `GET /api/official/institutions/`

Returns active verified institutions, scoped to the caller's institution for
non-platform administrators.

### `GET /api/official/dashboard/`

Returns document counts, the caller's role and review scope, plus explicit integration
status. Counts are scoped: reviewers see their institution queue, platform admins see
all institutions, and other officials see only their own submissions. Responses are
sent with `Cache-Control: no-store` because they are authorization-scoped. The
integration values are reported as non-success states, for example
`ai_provider: disabled`, `vector_index: not_configured`,
`google_sheets: not_configured`, and
`private_storage: disabled_until_scanner_and_server_key`.

## Admin console endpoints

These endpoints require the same Appwrite JWT **and** a server-side `OfficialUser`
row with an `ADMIN` or `SUPER_ADMIN` role. Appwrite labels, `OfficialUser` rows with
`PENDING` verification, and ordinary `VERIFICATION_OFFICER` records are all rejected
with `403`. All admin responses are `Cache-Control: no-store`.

### `GET /api/admin/overview/`

Aggregate monitoring only. It contains counts and integration states, and never
returns report claim text, reporter contact details, admin notes or other private
fields:

```json
{
  "generated_at": "2026-09-25T12:00:00Z",
  "reports": {"total": 12, "received": 9, "under_review": 2, "closed": 1, "evidence_pending": 0, "evidence_failed": 0},
  "knowledge_base": {
    "documents": {"total": 5, "pending_review": 3, "approved": 2, "rejected": 0, "extraction_failed": 0},
    "sources": {"total": 2, "pending_review": 2, "active_count": 2, "not_configured": 2, "failed": 0}
  },
  "institutions": {"total": 3, "active_count": 2, "verified_count": 2},
  "integrations": {
    "knowledge_scraper": {"status": "not_configured", "message": "..."},
    "huggingface": {"status": "disabled", "message": "..."},
    "private_storage": {"status": "not_configured", "message": "..."},
    "google_sheets": {"status": "not_configured", "message": "..."}
  }
}
```

### `GET /api/admin/knowledge-sources/`

Lists registered source URLs (newest first, capped at 100 with a separate `count`).
Optional query parameters: `q` (title/URL/notes contains), `status` and
`processing_status`. An unknown status value returns `400` with code
`invalid_knowledge_source_status` or `invalid_knowledge_source_processing_status`.

### `POST /api/admin/knowledge-sources/`

Records a URL for later review. Fields: `institution_id`, `url` (HTTPS, no embedded
credentials, port 443 or default, exact approved institution domain or subdomain),
and optional `title` and `notes`.

- The institution must be active and `VERIFIED`.
- A duplicate for the same institution returns `400` with a `url` field message; a
  concurrent duplicate caught by the database constraint returns `409` with code
  `knowledge_source_already_registered`.
- New records are created with `status: "PENDING_REVIEW"` and
  `processing_status: "NOT_CONFIGURED"`, and the response includes
  `message: "URL recorded for review. No scraper ran."`

**Recording a URL does not fetch, extract, index or publish anything.** There is no
extraction worker, so the processing status must remain `NOT_CONFIGURED` until one is
deployed with its own SSRF, DNS-rebinding, redirect, size and rate controls.

## Error format

API errors use a stable envelope and do not forward provider or database internals:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request could not be completed.",
    "details": {}
  }
}
```

Validation errors keep their field mapping under `details`, so the client can show a
message next to the offending input. Authentication and authorization failures use
the same envelope with codes such as `not_authenticated`, `authentication_failed` and
`permission_denied`. Evidence configuration errors use `503` with
`evidence_upload_unavailable`. An unexpected server-side failure returns
`500` with code `server_error` and a generic message; the original exception is
logged server-side and never returned (`DEBUG=True` still shows the Django traceback
during local development).

## Not currently exposed

There is no live general-purpose claim-verification endpoint, URL-analysis endpoint,
incident/alert feed, fact-check publication API, notification delivery API, public
report search, Google Sheets synchronization endpoint, knowledge-source extraction
endpoint, or embedding/RAG endpoint. The React routes that describe these areas show
their limits instead of filling them with simulated results. Future contracts must
preserve the same privacy, source provenance, uncertainty and fail-closed integration
rules.
