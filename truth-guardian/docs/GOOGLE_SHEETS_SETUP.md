# Google Sheets setup (not configured)

Google Sheets is an optional operational export for authorized staff. It is **not** the
Truth Guardian database and is not required to accept a citizen report.

## Current status

The current API has no Google service, worker, sheet schema or active credentials.
Reports are committed to PostgreSQL and their `google_sheets_sync_status` remains
`NOT_CONFIGURED`. The UI does not claim that a spreadsheet append, update or retry
occurred.

A pasteable, idempotent Apps Script bootstrap is available at
[`google-apps-script/TruthGuardianSheet.gs`](google-apps-script/TruthGuardianSheet.gs).
It creates a safe sheet template and setup notes without deleting existing rows. It is
a setup tool, not a public webhook or proof of live synchronization.

## Required backend variables when implemented

Keep these values in the backend/deployment secret store:

```dotenv
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SHEET_ID=
GOOGLE_SHEET_NAME=
```

`GOOGLE_SERVICE_ACCOUNT_JSON` should contain the service-account JSON or a secure
path/reference resolved by the deployment platform. Do not paste the JSON into React,
HTML, public JavaScript, source control or an issue.

## Proposed spreadsheet columns

A future service should use an explicitly approved, versioned schema. The currently
documented candidate columns are:

1. Report ID
2. Date
3. Category
4. Description
5. District
6. Platform
7. Phone Number
8. URL
9. Email
10. Organisation
11. Amount Requested
12. Amount Lost
13. Reporter Name
14. Reporter Contact
15. Anonymous
16. Attachment
17. Status
18. Priority
19. Assigned Officer
20. Admin Notes
21. Created At
22. Updated At

Private reporter information may be included only when the spreadsheet's access
controls and operational policy explicitly permit it. The public API must never
serialize it. The current report model does not contain every proposed operational
column, so the schema must be reconciled before activation.

## Service boundary

A future implementation belongs in a backend-only service and should expose operations
such as:

```python
append_report(report)
update_report(report)
sync_report(report_id)
retry_failed_sync(report_id=None)
```

The React form calls only `POST /api/reports/`; it must never call Google directly.
Idempotency keys/report IDs should prevent duplicate rows during retries.

## Failure-tolerant sequence

```text
Validate request
  → INSERT/transaction in PostgreSQL
  → set google_sheets_sync_status = PENDING
  → return report ID/receipt
  → enqueue a real worker
  → append/update Google Sheets
  → set google_sheets_sync_status = SYNCED
```

If Google is unavailable, the PostgreSQL transaction remains successful. The future
worker must record a safe failure and schedule policy-approved retries; a spreadsheet
outage must not create a false report failure. No part of this sequence runs until the
integration is configured.

## Operational safeguards

- Use a dedicated Google service account with least privilege.
- Restrict spreadsheet sharing to authorized staff.
- Validate the sheet ID/name against an allow-list.
- Store synchronization attempt metadata without service-account secrets.
- Apply queue, timeout and rate limits so a spreadsheet outage cannot exhaust workers.
- Test append, update, unavailable credentials, quota errors, timeout, duplicate retry
  and partial-failure cases before enabling the worker.

No Google credentials or Sheets integration code is active in the current public slice.
