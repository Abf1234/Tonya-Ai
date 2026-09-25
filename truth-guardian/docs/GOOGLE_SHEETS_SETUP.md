# Google Sheets setup (planned integration)

Google Sheets is an operational export for authorized staff. It is **not** the Truth Guardian database and is not required to accept a citizen report.

## Required backend variables

Keep these values in the backend/deployment secret store:

```dotenv
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SHEET_ID=
GOOGLE_SHEET_NAME=
```

`GOOGLE_SERVICE_ACCOUNT_JSON` should contain the service-account JSON or a secure path/reference resolved by the deployment platform. Do not paste the JSON into React, HTML, public JavaScript, source control or an issue.

## Spreadsheet columns

The future service will map PostgreSQL report fields to these columns in this order:

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

Private reporter information must only be included when the spreadsheet’s access controls and operational policy explicitly permit it. The public API must never serialize it.

## Service boundary

The future implementation belongs in `backend/services/google_sheets/google_sheets_service.py` and will expose operations such as:

```python
append_report(report)
update_report(report)
sync_report(report_id)
retry_failed_sync(report_id=None)
```

The React form will call `POST /api/reports/`; it will never call Google directly.

## Failure-tolerant sequence

```text
Validate request
  → INSERT/transaction in PostgreSQL
  → set google_sheet_status = PENDING
  → return report ID/number
  → enqueue Celery task
  → append/update Google Sheets
  → set google_sheet_status = SYNCED
```

If the Google API is unavailable, the PostgreSQL transaction remains successful. The task records a safe failure, sets `FAILED` or `RETRYING` according to policy, and a scheduled Celery retry examines eligible records. A spreadsheet outage must not create a false report failure.

## Suggested statuses

- `PENDING`: authorized for synchronization or waiting for a worker.
- `SYNCED`: Google confirmed the append/update.
- `FAILED`: the last attempt failed and requires policy-based retry.
- `RETRYING`: a retry is scheduled or in progress.

## Operational safeguards

- Use a dedicated Google service account with least privilege.
- Restrict spreadsheet sharing to authorized staff.
- Use idempotency keys/report IDs to prevent duplicate rows during retries.
- Store a synchronization attempt log without service-account secrets.
- Apply a queue and rate limit so a spreadsheet outage cannot exhaust workers.
- Test append, update, unavailable credentials, quota errors, timeout, duplicate retry and partial-failure cases.

No Google credentials or Sheets integration code is active in Phase 1. The current project only reserves the environment variables and service boundary.
