# AI and RAG design (planned)

AI functionality is deliberately deferred until trusted-source ingestion, access control, evaluation and safety controls are implemented. No OpenAI or other model key is used by the current frontend or foundation API.

## Target flow

```text
User query
  → Django API
  → query normalization and scope detection
  → hybrid retrieval (PostgreSQL full text + pgvector)
  → trusted-source/evidence filtering
  → context assembly
  → backend LLM call, if configured and permitted
  → structured answer with citations and uncertainty
  → human review rules for high-impact claims
```

## Evidence rules

- Retrieve from registered, active sources with a defined scope.
- Prefer primary official documents for official-announcement checks.
- Preserve conflicting evidence instead of hiding it.
- Include publication date, source scope, verification status and direct citation URL.
- Never invent statistics, source links, quotes or administrative conclusions.
- If retrieval or model configuration is unavailable, return an explicit `UNDER REVIEW` or `INSUFFICIENT EVIDENCE` result.
- Treat uploaded screenshots/documents as untrusted content and extract text only through approved services.

## Source ingestion

Future ingestion workers will respect robots.txt, terms of service, rate limits, copyright and takedown procedures. They will store source metadata, content hashes, retrieval timestamps and audit events. News sources will be marked as scoped trusted reporting rather than official confirmation.

## Human review gates

Human review is required for criminal accusations, serious allegations, government officials, political claims, national emergencies, major financial schemes and conflicting official sources. AI can summarize database evidence for analysts, but publication decisions and sensitive actions remain auditable staff actions.

## Evaluation before launch

Create a labeled Sierra Leone evaluation set covering official announcements, scams, impersonation, health, education, police, telecommunications, finance, agriculture, public safety and multilingual queries. Measure citation correctness, unsupported-claim rate, scope errors, refusal quality, latency, cost and human reviewer agreement.

Krio, Mende, Temne and Limba support will be introduced only with validated translations, local review and separate safety evaluations.

## Configuration

`OPENAI_API_KEY` is a backend-only variable. It is intentionally blank in the example environment and is not a Vite variable. A future provider adapter should support a no-key/local-model mode for development and should fail closed when credentials are absent.
