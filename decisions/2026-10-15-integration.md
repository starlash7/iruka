# Integration decisions and unresolved inputs

## Confirmed scope
- Story-led works, Korean white/pink UI; retain character chat and internal mode.
- Privy DID authorizes data; optional approved wallets are not chat prerequisites.
- Credits already implemented; production grant/rate policy not decided.
- GIWA anchoring deferred. No deployment, main merge or paid model calls.
- Docs b7f750e reviewed/merged; repository text updated, remote access/deployment unchanged.

## Owner inputs still required
| Input | Owner | Gate |
|---|---|---|
| Model/provider | A | OpenAI gpt-5.4-mini adapter integrated; actual transport not activated |
| Moderation, usage accounting, budget and call approval | user + A/integration | Explicit safety and rate policy required before paid invocation |
| Image storage | B + integration | Local immutable PNG storage wired; remote provider/lifecycle undecided |
| Persona mutations | C + integration | PATCH/DELETE implemented, same DTO, soft deletion retains chat snapshots |
| Discovery API gaps | D | Existing contracts sufficient; no taxonomy/pagination expansion |
| Free grants, cadence and per-model cost | user + integration | Local 100/1 values are fixtures, not launch policy |
| Remote DB/API hosting and durable worker | integration + user | No infrastructure creation or deployment |
| Retention/deletion and operator access policy | user + integration | Do not invent promises |

## Operational validation still pending
Actual Google/OTP/wallet approval and session recovery; remote PostgreSQL
concurrent writes and recovery; real provider quality/usage; persistent API and
worker runtime, observability and failure alerting. Read credentials only when
needed; never publish secrets, tokens, emails or personal test records.

At initial intake there were no new remote handoffs. Subsequent fetch found and
integrated A 4fb5391, B a1eca8d, C ecba192, D 7a0ae58, Docs b7f750e.
No other workspaces were edited and no cross-workspace messages were sent.

## Operations before live validation

1. Privy dashboard must enable Google/email and the exact local/host origins.
   Browser/server App IDs must agree; server verifier uses the public verification key.
2. An isolated remote PostgreSQL target and API host need approval. Run existing
   migrations there before concurrent-write/restart testing; local PGlite is not
   remote concurrency evidence.
3. Local images live in LOCAL_IMAGE_DIRECTORY; do not deploy that directory as a
   public static bucket. A remote ImageStorage must preserve private access and
   immutable keys. Backups, quotas, retention and cleanup require an explicit policy.
4. Long-lived API/worker hosting must support SSE cancellation and recurring lease
   recovery. dev.ts runs maintenance every 15 seconds; that is not a deployed worker.
   ProductOptions.runSummaries is false by default and needs separate cost approval.
5. Real model composition takes the adapter's explicit safety, token/time limits and
   credit policy. Setting an API key alone never enables it. No production safety
   policy is inferred from the deterministic fixture's keyword check.
