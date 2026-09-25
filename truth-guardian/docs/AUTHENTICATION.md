# Appwrite authentication

Truth Guardian uses Appwrite as the browser identity provider. Django does not receive or store user passwords.

## Current flow

1. The browser reads only public Vite settings and initializes the Appwrite Web SDK.
2. `AuthProvider` restores an existing Appwrite session with `Account.get()`.
3. The sign-in page calls `Account.createEmailPasswordSession({ email, password })`.
4. Sign-out calls `Account.deleteSession('current')`, which revokes the current Appwrite session.
5. A future protected Django request may opt into `withAppwriteAuth()`. The Axios interceptor asks Appwrite for a 15-minute client JWT and sends it as `Authorization: Bearer <jwt>`.
6. Django validates the JWT through Appwrite's server SDK and creates only an `AppwritePrincipal`; it does not create a Django user or session.

On startup, `src/main.jsx` invokes `pingAppwrite()` once. The check is non-blocking, logs a clear success or failure message, and does not prevent the UI from rendering.

The current UI does not register accounts, upload evidence, or call protected domain endpoints. The supplied Appwrite database ID is reserved for a future table integration, and the supplied storage bucket is configured only for that future workflow; PostgreSQL remains the authoritative domain database and the bucket must stay private.

## Configuration

Set these public values in the frontend environment:

```dotenv
VITE_APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<public-project-id>
VITE_APPWRITE_DATABASE_ID=<reserved-database-id>
VITE_APPWRITE_STORAGE_BUCKET_ID=<private-bucket-id>
```

Set the corresponding backend values in `backend/.env` for native development, or in the root Compose environment for containers:

```dotenv
APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<public-project-id>
APPWRITE_DATABASE_ID=<reserved-database-id>
APPWRITE_STORAGE_BUCKET_ID=<private-bucket-id>
APPWRITE_SERVER_API_KEY=<server-only-secret>
```

Never place `APPWRITE_SERVER_API_KEY` or any other secret in a `VITE_*` variable. The regional endpoint is required; the project ID alone is not enough to initialize the SDK. If a local Appwrite instance uses HTTP, set `APPWRITE_ALLOW_INSECURE_ENDPOINT=True` only in the local backend environment; production settings require HTTPS.

## Appwrite console checklist

- Add the local and production hostnames as Web platforms.
- Enable email/password authentication.
- Configure the project's allowed origins and session policy.
- Require email verification and configure rate/session limits before public launch.
- Prefer a custom API domain in production so the Web SDK can use secure cookies instead of its localStorage fallback.
- Keep the storage bucket private. Do not grant public read or write permissions to evidence files.
- Create a least-privilege server API key only when server-mediated storage or administration needs it.

## Security review

Implemented controls:

- No Django password store or DRF Basic/Session authentication for API routes.
- New DRF views default to authenticated access; public views opt into `AllowAny` explicitly.
- JWTs are short-lived, held only for the request, and never persisted by the application.
- Authentication errors shown to the browser are sanitized.
- Bearer tokens are validated against Appwrite rather than decoded locally.
- Only a minimal account principal is retained; password hashes and arbitrary preferences are not copied.
- Appwrite endpoints must use HTTPS in production builds; HTTP is allowed only in explicit local development.
- The `next` redirect after login is restricted to a same-origin path.

Required before production:

- Complete server-side RBAC using Appwrite labels/team policy and Django permissions/querysets.
- Add throttling, abuse detection, MFA/OTP policy, audit events, and account/session management UX.
- Add a strict CSP and other browser security headers; XSS protection is especially important when the SDK falls back to localStorage.
- Validate and scan uploads server-side before placing files in Appwrite Storage.
- Add integration tests against a real Appwrite project and verify SDK/server-version compatibility.
- Bound Appwrite identity-provider calls with an explicit timeout/circuit breaker before exposing authenticated production endpoints.

## Live verification

Live sign-in still requires a non-production test account and a registered Web platform in the supplied Appwrite project. Once those are available, verify:

1. The `/login` form is enabled and no configuration warning is shown.
2. A valid test account creates a session; an invalid password shows only the generic error.
3. Reloading the app restores the session.
4. Sign-out invalidates the current session and removes account controls.
5. A protected API test accepts a valid JWT and rejects missing, expired, or revoked tokens.

Do not use production administrator accounts or real personal data for this smoke test.
