# REST API contract

Base path: `/api/`

All Django endpoints use JSON unless a documented upload endpoint requires multipart form data. Appwrite Account endpoints are called directly by the browser and are not proxied through Django. The current API intentionally exposes only foundation endpoints plus the authentication boundary. Planned endpoints below are contracts for later implementation, not claims that the routes are already live.

## Current endpoints

### `GET /api/`

Service metadata and current API version.

Example response:

```json
{
  "service": "Truth Guardian Sierra Leone API",
  "version": "0.1.0",
  "status": "foundation",
  "documentation": "/docs/API.md",
  "endpoints": {
    "liveness": "/api/health/",
    "readiness": "/api/health/ready/"
  }
}
```

### `GET /api/health/`

Liveness check. It does not query PostgreSQL.

```json
{
  "status": "ok",
  "service": "truth-guardian-api"
}
```

### `GET /api/health/ready/`

Readiness check. It queries the configured database.

Available response:

```json
{
  "status": "ready",
  "checks": {"database": "available"}
}
```

Unavailable response uses HTTP `503` and does not expose credentials or raw database errors.

## Authentication boundary

Appwrite owns account creation, email/password sessions and future OAuth/MFA configuration. The browser calls the Appwrite Web SDK directly. Django does not expose `/api/auth/register/` or `/api/auth/login/` and does not store passwords.

For a protected Django endpoint, the frontend may create a short-lived Appwrite JWT with `account.createJWT({ duration: 900 })` and send it as:

```http
Authorization: Bearer <appwrite-jwt>
```

The Axios client exposes `withAppwriteAuth(config)` for this opt-in. The backend validates that token through Appwrite's server SDK and exposes only a minimal `AppwritePrincipal`; Django user/session and Basic authentication are not used for API routes. The current public health endpoints do not require or receive a token.

## Planned public endpoints

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/verify/` | Submit text, URL or supported evidence | Public/throttled |
| GET | `/api/verification/{id}/` | Retrieve a result and citations | Public result policy |
| POST | `/api/chat/` | Ask the evidence-backed assistant | Public/throttled |
| POST | `/api/reports/` | Save a fraud/suspicious-information report | Public/throttled |
| GET | `/api/reports/` | List permitted public reports | Public safe fields |
| POST | `/api/url-check/` | Check HTTPS, redirects, registry and reports | Public/throttled |
| POST | `/api/before-pay-check/` | Check a programme/payment request | Public/throttled |
| GET | `/api/incidents/` | Read public-safe incident summaries | Public |
| GET | `/api/alerts/` | List published alerts | Public |
| GET | `/api/fact-checks/` | List published fact checks | Public |
| GET | `/api/sources/` | Search scoped trusted sources | Public |
| GET | `/api/documents/` | Search permitted public documents | Public |

## Planned administration endpoints

| Method | Endpoint | Minimum role |
| --- | --- | --- |
| GET | `/api/admin/dashboard/` | `VERIFICATION_OFFICER` or higher |
| GET | `/api/admin/analytics/` | `ANALYST` or higher |
| GET | `/api/admin/reports/` | `VERIFICATION_OFFICER` or higher |
| POST/PATCH | `/api/admin/reports/{id}/` | Authorized officer |
| POST | `/api/admin/incidents/{id}/merge/` | Analyst/admin |
| POST | `/api/admin/alerts/` | Admin or super admin |
| POST | `/api/admin/fact-checks/` | Verification officer or higher |

The backend, not React, must enforce every permission. Public responses must use serializers that exclude reporter names, contact details, private notes, evidence metadata and internal risk scores.

## Error format

Later API errors should use a stable structure:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request could not be processed.",
    "fields": {}
  }
}
```

Evidence uploads will be sent to a server-mediated endpoint that performs MIME/signature checks, size limits, safe filenames and malware scanning before storing files in a private Appwrite Storage bucket. PostgreSQL will retain the Appwrite file ID and metadata. URL analysis must defend against SSRF and never fetch private/link-local addresses.
