# Security

Security is a release requirement, not a later UI feature. The current slice establishes Appwrite browser authentication and a short-lived JWT boundary for future API authorization, but does not yet implement the full RBAC and evidence-upload pipeline.

## Current foundation controls

- Django `SECRET_KEY` is required and must be supplied through an ignored environment file or secret manager.
- Normal settings reject a non-PostgreSQL database.
- Appwrite owns browser account passwords and sessions; Django API routes do not use Basic authentication or Django sessions.
- The frontend creates short-lived Appwrite JWTs only for explicitly protected API requests; tokens are not persisted by Truth Guardian.
- CORS origins and CSRF trusted origins are explicit environment settings.
- Django security middleware and WhiteNoise are enabled.
- Secure cookies, HTTPS redirect, HSTS, proxy SSL handling and content-type protections are configurable for production.
- Session and CSRF cookies are HTTP-only and SameSite by default for Django administration/future server-managed flows.
- DRF uses JSON, form and multipart parsers with bounded upload settings; new API views default to authenticated access and public views must opt in explicitly.
- The API root and liveness endpoint do not expose secrets or raw database errors.

The default local `.env` generated during development is ignored by Git. It is not a deployment secret and should be replaced with a unique value in every environment.

## Required before production

- Configure Appwrite email verification, rate limits, session limits, MFA and OAuth redirect origins before enabling public registration.
- Use an Appwrite custom domain/API endpoint in production where possible; otherwise the Web SDK may fall back to localStorage for session material. Enforce a strict CSP and treat XSS prevention as an authentication control.
- Keep the Appwrite server API key backend-only; use a least-privilege key and rotate it through a secret manager.
- Add strict server-side RBAC for `PUBLIC_USER`, `GOVERNMENT_OFFICIAL`, `VERIFICATION_OFFICER`, `ANALYST`, `ADMIN` and `SUPER_ADMIN`; do not rely on hidden React controls.
- Add throttling by IP/account/route, abuse detection and safe error responses.
- Keep Appwrite Storage buckets private; validate uploads by content signature, size, extension and filename, scan them in production, and store only Appwrite file IDs/metadata in PostgreSQL.
- Protect URL analysis against SSRF, private ranges, DNS rebinding, redirects to local addresses and excessive downloads.
- Encrypt sensitive evidence and reporter contact data at rest, minimize retention and log access.
- Add immutable audit events for privileged reads, assignments, merges, escalations, publication and exports.
- Add dependency, container, secret and static analysis to CI.
- Configure production HTTPS, HSTS carefully, CSP, Permissions-Policy, secure proxy headers and database TLS.
- Add backup/restore drills, alerting, rate-limit storage and incident response procedures.

## Privacy rules

Reporter names, contact details, private notes, attachments and internal scores are not public fields. Similar-report results may expose only safe categories, dates, districts and non-identifying indicators. Administrative AI summaries must query authorized database evidence and must not invent or infer missing statistics.

## Security validation status

`manage.py check` passes in the local configuration. A production-style `check --deploy` should be run with HTTPS, secure cookies, `DEBUG=False` and a valid HSTS policy in the deployment environment. Full security and integration tests are scheduled for the later security/testing phase.
