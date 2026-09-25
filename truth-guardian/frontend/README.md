# Truth Guardian frontend

This directory contains the separate React + Vite public application.

## Commands

```powershell
npm install
npm run dev       # http://localhost:5173
npm test
npm run build
npm run preview
```

The frontend uses Tailwind CSS, React Router, Axios, the Appwrite Web SDK, Lucide icons and Recharts. The browser calls the Django REST API through the Axios client in `src/services/api.js`. Appwrite owns browser identity and session management.

## API configuration

Copy `.env.example` to `.env` only when local overrides are needed. The only safe frontend variables are public Vite settings such as:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<public-project-id>
VITE_APPWRITE_DATABASE_ID=<reserved-appwrite-database-id>
VITE_APPWRITE_STORAGE_BUCKET_ID=<private-bucket-id>
```

Never add database, Appwrite server API keys, Google, OpenAI, Redis or other server credentials to a `VITE_*` variable. Vite embeds public variables into the browser bundle.

In the Appwrite console, register the local web platform, enable email/password authentication, and configure the allowed origins. For production, use an Appwrite custom domain as the API endpoint where possible so the SDK can use secure cookies instead of its localStorage fallback; also deploy a strict CSP. The storage bucket should remain private; the current UI does not upload evidence until server-side validation and access controls are implemented.

## Current scope

The public visual shell and route structure are implemented. Appwrite email/password sign-in, session restoration, account display and current-device sign-out are available once the public Appwrite settings are configured. The app runs one non-blocking Appwrite client ping at startup and logs whether the configured project is reachable. Verification, chat and reporting screens clearly identify their foundation limitations rather than presenting simulated AI or production records. Protected API calls can opt into the short-lived Appwrite JWT interceptor; backend workflows and evidence uploads will be added in later phases.
