# Administrator guide

## Current status

The React administrative dashboard, custom roles, report-management API, clustering controls and analyst assistant are not implemented yet. Appwrite handles user identity/session state, while Django enforces the future API role model. Django’s built-in `/admin/` is available only as a framework foundation and is not the planned operational dashboard.

## Planned role model

- `PUBLIC_USER`: submit permitted requests and view their own safe records.
- `GOVERNMENT_OFFICIAL`: scoped official/institution access only.
- `VERIFICATION_OFFICER`: review verification cases and manage assigned reports.
- `ANALYST`: intelligence summaries, clustering and trend analysis within scope.
- `ADMIN`: operational management, assignments, publication and escalation.
- `SUPER_ADMIN`: controlled role and system administration.

All checks must be enforced in Django permissions and querysets, not only by hiding React controls.

## Review principles

- Never treat an AI score as a criminal finding.
- Keep reporter identity and contact fields out of public or analyst summaries.
- Show source dates, scopes, conflicts and uncertainty.
- Require human approval for serious allegations, officials, political claims, emergencies, major financial schemes and conflicting sources.
- Record every privileged read, assignment, merge, escalation, publication and export in the audit log.
- Keep the platform non-partisan and avoid candidate rankings or persuasion.

## Go-live gate

Do not enable the admin dashboard publicly until authentication, RBAC, audit logs, safe serializers, rate limits, threat-model review, backup/restore testing and integration tests are complete.
