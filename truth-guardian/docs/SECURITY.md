# Security

Security is a release requirement. The current public slice establishes a real
Appwrite-to-Django authentication boundary, server-side official authorization,
PostgreSQL-first report handling, and fail-closed evidence validation. It does not
claim that unconfigured integrations are secure or operational.

## Current controls

- `SECRET_KEY` is required and is loaded from the backend environment. Normal settings
  reject a non-PostgreSQL database.
- Appwrite owns browser passwords, sessions, email verification and future OAuth/MFA.
  Django API routes do not use Basic authentication or a parallel Django password
  store.
- Protected frontend requests opt into a short-lived Appwrite JWT. The backend maps
  the validated principal to an explicitly approved `OfficialUser` record; Appwrite
  labels and client-side role state are not authorization.
- Non-platform-admin officials require an active institution whose verification status
  is `VERIFIED`. Platform `ADMIN` and `SUPER_ADMIN` records may be institutionless.
  Reviewers are scoped to their institution and cannot review another institution's
  document.
- Public views opt into `AllowAny` explicitly. Report receipts and public official
  records use allow-listed serializers and do not expose contact details, private
  notes, internal risk values or storage provider IDs.
- Anonymous report submissions clear optional contact fields before persistence.
- CORS origins, CSRF trusted origins, allowed hosts, secure cookies, HTTPS redirect,
  HSTS, proxy SSL handling and content-type protections are environment-configurable.
  The deployment environment must set them deliberately.
- DRF uses JSON, form and multipart parsers with bounded upload settings. Evidence
  validation checks presence, actual byte size, MIME type, file signature and a bounded,
  path-free filename.
- Evidence is not reported as uploaded or scanned unless a malware scanner and a
  private Appwrite Storage integration are both configured. The default result is a
  truthful `503 evidence_upload_unavailable` response. The browser never receives a
  private storage credential or bypasses the server boundary.
- The assistant performs a read-only lookup of approved public records and returns
  source metadata/limitations. It does not treat citizen reports as evidence.
- The optional assistant provider is server-only, disabled by default, and bounded by a
  timeout and token limit. The browser never receives the token, the provider payload
  or a provider error. Contact details are redacted before and after generation, URLs
  that are not on a returned approved source are stripped, and unsupported citation
  markers are removed before the answer is displayed.
- The admin console requires a valid Appwrite JWT plus an approved server-side
  `ADMIN`/`SUPER_ADMIN` record, returns aggregate counts only (no report text, contact
  fields, private notes or attachments), and is served with `Cache-Control: no-store`.
  Knowledge-source URLs are re-validated server-side for HTTPS, embedded credentials,
  port and exact approved institution domain; the browser check is not authoritative.
- Health responses and the API error envelope do not expose secrets or raw database
  errors. Unhandled server-side failures return a generic `500 server_error` envelope
  instead of a provider, database or stack-trace payload.
- PostgreSQL remains authoritative; optional spreadsheets or providers cannot replace
  a committed citizen report.

Local `.env` files are ignored by Git. Never put a server API key, database password,
Google service-account JSON, provider key or other secret in `VITE_*`, browser code,
logs, fixtures or documentation.

## Required before production

- Configure Appwrite email verification, rate limits, session limits, MFA and OAuth
  redirect origins before enabling public registration. Use a custom HTTPS domain or
  endpoint where possible and enforce a strict CSP to reduce session-token exposure.
- Put the Appwrite server API key in a secret manager and use a least-privilege key
  scoped to the required private storage operations. Rotate it and audit access.
- Add production throttling by IP/account/route, abuse controls, safe error budgets
  and operational alerting. The current settings intentionally do not claim a
  production rate limiter.
- Run a real malware scanner in a quarantine/staging workflow before any evidence is
  retained. Keep the bucket private, encrypt sensitive data at rest, minimize
  retention, and log access to evidence.
- If URL analysis is added, defend against SSRF, private/link-local ranges, DNS
  rebinding, redirects to local addresses, oversized responses and unsafe content
  types.
- Add immutable audit events for privileged reads, review decisions, publication,
  evidence access, exports and role changes.
- Add dependency, container, secret and static analysis to CI, plus backup/restore
  drills and an incident-response process.
- Configure HTTPS, secure cookies, HSTS carefully, CSP, Permissions-Policy, secure
  proxy headers and database TLS in the production environment. Do not enable HSTS
  until every covered host is HTTPS-only.
- Configure Google Sheets only with a dedicated service account, least-privilege sheet
  access, a documented schema and a retry/audit worker. It is not the source of truth.
- Keep AI/RAG providers server-side and disabled until retrieval evaluation,
  privacy review, prompt/data controls, citation validation and human-review gates are
  complete. Revoke and rotate any provider token that has ever been pasted into a chat,
  issue, log or commit before enabling `HUGGINGFACE_ENABLED`.
- Protect the admin console with real account security (MFA for administrators,
  least-privilege Appwrite projects, and an audit trail) before it is used for
  day-to-day operations.

## Privacy rules

Reporter names, contact details, private notes, attachments and internal scores are
not public fields. Similar-report results may expose only safe categories, dates,
districts and non-identifying indicators. Administrative summaries must query
authorized database evidence and must not invent or infer missing statistics.

## Validation status

The automated frontend suite and backend pytest suite pass in the local test
configuration. `manage.py check --deploy` should still be run with production values;
a test/development configuration will correctly warn about HSTS, HTTPS redirects,
secure cookies and `DEBUG` until those environment variables are set. Browser visual
QA and real Appwrite authenticated smoke tests require configured services and a
connected test session; they are not evidence that an unconfigured integration works.
