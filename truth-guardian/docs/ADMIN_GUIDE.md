# Administrator guide

## Current official portal

The React official portal is a bounded workflow for manually submitted official
records. It is not the full incident-management, clustering or analyst dashboard.

Appwrite owns identity and browser sessions. Django validates the short-lived Appwrite
JWT, resolves an approved `OfficialUser` record and enforces institution scope. Client
role labels and hidden buttons are not authorization.

### Roles currently enforced for official content

- `GOVERNMENT_OFFICIAL`: submit content and view their own submissions.
- `VERIFICATION_OFFICER`: submit content and review the queue for their institution.
- `ADMIN`: submit/review across institutions; may be institutionless.
- `SUPER_ADMIN`: same broad platform scope; may be institutionless.

Non-platform-admin accounts must belong to an active institution with
`verification_status=VERIFIED`. The Django permission layer and `review_document`
service both enforce the boundary.

### Review workflow

1. An official submits a manual-text or verified-domain record.
2. The record is stored as `PENDING_REVIEW` and is not public.
3. A same-institution reviewer (or platform admin) can approve, reject, archive or
   expire it. Rejection requires a reason.
4. Approval requires a pending record, active verified institution, a non-expired date
   and available/manual text. URL/file extraction is not configured, so a URL-only
   record cannot be approved by pretending it was extracted.
5. Only approved, published, current, effective and non-expired records from active
   verified institutions appear in public information and assistant results.

The dashboard explicitly reports each integration as an explicit state, for example
`ai_provider: disabled`, `vector_index: not_configured`,
`google_sheets: not_configured` and
`private_storage: disabled_until_scanner_and_server_key`.

## Platform admin console

The admin console (`/admin`, also reachable at `/admin/monitoring` and
`/official/admin`) is a separate, more privileged surface for operational monitoring
and knowledge-base upkeep. It is protected by the `IsPlatformAdmin` permission: a valid
Appwrite JWT **and** an approved server-side `OfficialUser` row with `ADMIN` or
`SUPER_ADMIN`. A signed-in user without that role sees a plain “Admin access is
restricted” message with no data and no internal reason. Responses are sent with
`Cache-Control: no-store`.

### What it shows

- **Service health** — aggregate report counts (`total`, `received`,
  `under_review`, `action_taken`, `closed`, evidence pending/failed). Counts only; no
  claim text, reporter contact fields, private notes or attachments.
- **Knowledge base** — document counts (`total`, `pending_review`, `approved`,
  `rejected`, `extraction_failed`) and source-registry counts (`total`,
  `pending_review`, `active_count`, `not_configured`, `failed`).
- **Institutions** — `total`, `active_count`, `verified_count`.
- **Integration boundaries** — the honest state of the knowledge scraper
  (`not_configured`), assistant provider (`disabled` / `not_configured` / `ready`),
  private evidence storage (`not_configured`) and Google Sheets (`not_configured`).

If one panel fails to load, the console keeps the panels that did load and shows the
specific failure, instead of presenting a healthy-looking dashboard.

### Registering a URL to scrape later

`POST /api/admin/knowledge-sources/` (the “Record source URL” form) records a URL for
future review. Requirements are enforced server-side:

- HTTPS only, no embedded credentials, port 443 or the default port;
- exact match of the institution's approved domain or a subdomain of it;
- the institution must be active and `VERIFIED`.

The record is created as `PENDING_REVIEW` / `NOT_CONFIGURED`, and the response says
`URL recorded for review. No scraper ran.` **This is the whole feature today.** There
is no extraction worker, so nothing is fetched, extracted, indexed, queued or
published, and the console never claims otherwise. A duplicate URL for the same
institution is rejected (`400` with a field message, or `409`
`knowledge_source_already_registered` if two requests race).

### Adding knowledge-base data manually

The “Add knowledge-base data” form posts to the same reviewed-official endpoint used
by the portal (`POST /api/official/documents/`). The record enters the authorized
review queue as `PENDING_REVIEW`, is unpublished, and only becomes public after a
reviewer approves it. Manual official text is required before approval; a URL-only
record cannot be approved.

### Promotion, scraping and audit

Promotion from a registered URL to an approved document, and any actual scraping,
requires a separately secured worker with SSRF, DNS-rebinding and redirect
protection, bounded size/time/rate limits, provenance capture, a review gate and audit
logging. That worker is not part of this repository.

## Not currently implemented

Public incident clustering, analyst summaries, report-management queues, assignment
workflows, exports, notifications, fact-check publication, alert delivery and broad
administrative analytics are not implemented. Do not infer that a dashboard control or
integration is live when its status says it is not configured.

## Review principles

- Never treat an assistant result or future model score as a criminal finding.
- Keep reporter identity, contact fields, attachments and internal scores out of public
  or analyst summaries.
- Show source dates, scope, conflicts and uncertainty.
- Require human approval for serious allegations, officials, political claims,
  emergencies, major financial schemes and conflicting sources.
- Record privileged reads, review decisions, publication, evidence access and exports
  in an immutable audit system when one is deployed.
- Keep the platform non-partisan and avoid candidate rankings or persuasion.

## Go-live gate

Before enabling a broader public administration surface, complete rate limits,
threat-model review, audit logging, safe serializer tests, backup/restore testing,
integration tests, secure deployment settings and an operational review process. The
current repository does not claim those production controls are complete.
