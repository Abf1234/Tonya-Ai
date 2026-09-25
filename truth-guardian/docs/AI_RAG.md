# Assistant, AI and RAG status

## What is live now

The public assistant is a **deterministic approved-source lookup with an optional,
server-side language layer**. `POST /api/assistant/` and its `/api/fact-checks/`
alias always run the same PostgreSQL lookup over approved, currently valid official
documents. A provider call is attempted only when every condition below is met:

- `HUGGINGFACE_ENABLED=True` is set in the backend environment;
- `HUGGINGFACE_TOKEN` holds a rotated, server-only credential;
- at least one approved source excerpt matched the query;
- the request finished inside the configured timeout.

The browser never receives the token, the provider payload or a raw provider error.
When any condition fails, the response is the deterministic lookup result with an
explicit `ai_status`; the answer is never blocked by provider configuration.

## Response contract

Every assistant response includes:

- `status`: `evidence_found` or `not_verified`
- `answer`: the plain-language answer actually returned to the user
- `evidence`: approved source records with institution, dates and direct source URL
- `evidence_strength`: `limited`, `moderate` or `none`
- `ai_generated`: `true` only when provider wording was returned for a grounded
  answer
- `ai_status`: one of `grounded`, `not_needed`, `disabled`, `not_configured` or
  `unavailable`
- `limitations`: a plain statement of what the answer cannot establish

`evidence_found` means approved material matched the submitted text. It does not
mean the user's claim is absolutely true, current in every circumstance, or
supported by every part of an announcement.

## Deterministic fallback (default)

With no provider configured, the assistant returns a templated answer built only
from the approved records that matched. This path requires no network call, no API
key, and behaves identically in tests. No embedding, vector search, citation
generation or scraping is simulated.

## Optional provider behavior

| `ai_status` | Meaning |
| --- | --- |
| `grounded` | Provider rewrote the evidence into clearer language and stayed within the excerpts. |
| `not_needed` | No approved excerpt matched, so no provider call was made. |
| `disabled` | `HUGGINGFACE_ENABLED` is off. |
| `not_configured` | Enabled, but token, model or API URL is missing. |
| `unavailable` | The provider timed out, errored, or returned an unusable payload. |

The provider may only rephrase the retrieved excerpts. It cannot approve or reject a
document, change a source URL, add a citation, or make a verification decision. A
provider response is post-processed before it reaches the user:

1. **Redaction** — email addresses and phone numbers are removed from the prompt and
   from the returned text, because a public query can contain a reporter's details.
2. **URL allowlisting** — only URLs that already appear on a returned approved
   source survive; any other link the model produces is removed.
3. **Reference cleanup** — unsupported `[S2]`, `[S3]`… markers are stripped, so the
   UI cannot show a citation that has no matching source card.
4. **Shape validation** — a missing message, empty content or non-JSON payload
   degrades to `unavailable` instead of surfacing raw provider text.

## Source policy

Only records that are approved, published, current, effective, not expired and
attached to an active verified institution are searchable. Citizen fraud reports are
not treated as facts. Unknown domains are not called official merely because they
appear in a message. Source provenance, institution, dates and the direct source URL
are preserved in the response, and the UI marks a source as verified only when the
backend supplies an explicit verification value.

## Languages

`language` accepts `auto`, `en`, `krio`, `mende`, `temne` and `limba`. The choice is
propagated to the prompt, not to a separate translation service, and `auto` asks the
model to detect the user's language. Selecting a Sierra Leonean language is a
request for help in that language; it is **not** a promise of fluent, idiomatic or
authoritative output. The prompt instructs the model to keep names, dates and status
words explicit and to say when it is uncertain, and the UI repeats that the optional
model may be disabled, unavailable, or limited. An unsupported value is rejected
with a validation error rather than silently falling back.

## Configuration

Backend-only variables (never `VITE_*`):

```dotenv
HUGGINGFACE_ENABLED=False
HUGGINGFACE_TOKEN=
HUGGINGFACE_API_URL=https://router.huggingface.co/v1/chat/completions
HUGGINGFACE_MODEL=openai/gpt-oss-120b:fastest
HUGGINGFACE_TIMEOUT_SECONDS=15
HUGGINGFACE_MAX_TOKENS=450
```

`HUGGINGFACE_API_URL` must use HTTPS; the settings module refuses to start with a
plain-HTTP provider URL. Any token that has been pasted into a chat, issue, commit or
log must be revoked at the provider and replaced before enabling the layer.

## Target flow for a future, separately approved service

A future AI/RAG phase may add the following only after trusted-source ingestion,
privacy review, evaluation and operational controls are in place:

```text
User query
  → Django API
  → query normalization and scope detection
  → approved-source retrieval (PostgreSQL full text, then optional embeddings)
  → evidence filtering and provenance assembly
  → optional backend model call
  → citation validation and uncertainty policy
  → human review for high-impact claims
  → structured result
```

The model provider must be called only by backend services. The browser receives
structured, source-linked results and never provider credentials. Retrieval must
preserve conflicting evidence, source scope, publication/effective dates and missing
information.

## Evidence and safety rules

- Prefer primary official documents for official-announcement checks.
- Never invent statistics, quotations, source links, verification decisions or
  administrative conclusions.
- Treat screenshots, PDFs and URLs as untrusted input. Do not fetch or extract them
  until the approved server-side pipeline is configured and tested.
- If retrieval, extraction, scanning or model configuration is unavailable, return an
  explicit uncertainty or unavailable state rather than a fabricated answer.
- Require human review for criminal accusations, serious allegations, officials,
  political claims, national emergencies, major financial schemes and conflicting
  official sources.
- Keep evaluation, citation correctness, unsupported-claim rate, refusal quality,
  latency, cost and reviewer agreement outside the public UI until measured.

## Not configured

There is no embedding pipeline, vector index or source-ingestion worker. Registering
a knowledge-source URL in the admin console records review intent only; it does not
fetch, extract or index the page. Google Sheets, OCR, malware scanning and private
Appwrite evidence storage are likewise not configured, and the admin console and
official dashboard report each of these as an explicit non-success state.
