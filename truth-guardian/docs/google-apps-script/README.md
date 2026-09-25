# Google Apps Script: Truth Guardian report sheet

The pasteable script is [`TruthGuardianSheet.gs`](TruthGuardianSheet.gs).

## Create the sheet

1. Open [script.google.com](https://script.google.com) and create a project. A bound
   blank spreadsheet is convenient, but a standalone script also works.
2. Paste the entire contents of `TruthGuardianSheet.gs` into `Code.gs`.
3. Save, choose `setupTruthGuardianSheet`, and click **Run**.
4. Approve the Google authorization prompt. The script creates/reuses a spreadsheet
   named **Truth Guardian Reports**, adds a `Reports` tab and a `Setup Notes` tab, and
   returns the sheet URL in a confirmation dialog.
5. Restrict spreadsheet sharing to authorized staff. Do not publish it or expose it as
   a public data source.

Re-running setup is safe: headers and formatting are repaired without deleting report
rows. The script stores only the spreadsheet ID in Apps Script Script Properties; it
does not store API keys or service-account credentials.

## What it does not do

The script does **not** publish a `doPost` webhook, create an unauthenticated public
endpoint, or claim that reports are synchronized automatically. The current Django
report flow stores reports in PostgreSQL and reports Google Sheets status as
`NOT_CONFIGURED`.

`appendReport(report, options)` is available for a future trusted Apps Script trigger
or separately authenticated backend worker. It:

- accepts a known report object and ignores unknown fields;
- prevents duplicate `report_id` rows, and only re-formats the tab when a new header
  row is written;
- prefixes text beginning with `=`, `+`, `-`, or `@` (including after leading
  whitespace) to avoid spreadsheet formula injection;
- leaves private contact columns blank unless the trusted caller passes
  `{ includePrivate: true }`, and never writes them for an anonymous report.

Do not call `appendReport` from an unauthenticated browser endpoint. A real sync
service still needs server-side authentication, idempotency, retries, audit logging,
rate limits and a privacy-approved sheet schema.
