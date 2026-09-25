# User guide

## Verify Before You Share

Start on the home page and enter a suspicious message, claim or URL. The verification
workspace performs a cautious lookup against approved, currently valid official
records. It can also accept a local screenshot or PDF for the report/evidence workflow;
a selected file is not uploaded or scanned until the server-side storage and malware
controls are configured.

The result distinguishes “approved material found” from “not verified.” It is not an
automatic fraud or misinformation judgment, and it does not claim that a model or a
live URL analyzer ran.

## Truth Guardian assistant

The Truth Guardian route accepts a question and searches approved official records. A
match includes direct source metadata, dates and an excerpt, but you should open the
linked institution source and check its dates. If no record matches, the assistant says
that it could not verify the claim from the currently available approved sources.

Every answer carries a status line telling you how it was produced:

- **Deterministic approved-source lookup** — the default. No model is involved.
- **AI-assisted wording grounded in approved excerpts** — an optional server-side
  model rephrased the same approved excerpts for clarity. It did not decide whether
  the claim is true, and the source cards below the answer are the evidence.
- **Optional model disabled / not configured / unavailable** — the answer still works
  and is based on the approved-source lookup.

The assistant never treats a citizen report as a fact and never invents a citation.

### Choosing a reply language

The language selector offers `Auto-detect`, `English`, `Krio`, `Mende`, `Temne` and
`Limba`, and your choice is sent with each question. It asks the assistant to answer in
that language and to say when it is unsure. It is a request, not a promise: accuracy,
fluency and authority in Krio, Mende, Temne and Limba vary, so always rely on the
official source card and the linked institution page rather than the translation.

## Report suspicious activity

The public reporting hub saves a report to PostgreSQL without requiring an account.
You may choose anonymous reporting; optional contact details are discarded for an
anonymous submission. After a successful submission, keep the reference in the form
`TG-2026-000123` for follow-up. The interface prevents rapid duplicate submissions and
lets you copy the reference.

Do not include passwords, one-time codes, payment PINs or unnecessary identity
information. Evidence files are validated locally and server-side, but the current
default deployment fails closed with `evidence_upload_unavailable` rather than
pretending to store or scan a file.

## Trusted information and alerts

Verified Information searches approved, published, current records from active verified
institutions. The Sources page explains the scoped trust model. Alerts, Fact Checks and
related publication feeds are currently empty states because no real publication
provider or moderation feed is connected; no sample incident or fact-check record is
shown as real.

## Official portal

An authenticated, server-authorized official can submit manual official content and see
the appropriate institution queue. Reviewers see their own institution's queue;
platform administrators may have broader scope. A submission remains pending until a
reviewer approves it with valid text and an active verified institution. Rejection
requires a reason. These permissions are enforced by Django, not only by the React UI.

## Admin console

A platform administrator (server-side `ADMIN`/`SUPER_ADMIN`) also gets an **Admin
console** link in the official portal, and can open `/admin` directly. It shows
aggregate monitoring counts, integration states, a form to register an approved
institution URL for a future extraction worker, and a form to add knowledge-base
records by hand. Manual records go into the same review queue and stay unpublished
until approved. Registering a URL only records it: nothing is fetched, extracted or
indexed, and the console never claims a scrape happened. Everyone else sees an
"Admin access is restricted" message with no data.

## Safety and privacy

Public receipts and approved-information records do not expose reporter contact details,
private notes, attachments or internal scores. Use anonymous reporting when contact
information is not needed. Do not share a report reference publicly if it contains
sensitive context.

## Lite Mode

Lite Mode is a browser preference that reduces motion and visual weight. It does not
change the source, status or privacy of a result.
