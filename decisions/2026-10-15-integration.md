# Integration decisions and unresolved inputs

## Confirmed scope
- Story-led works, Korean white/pink UI; retain character chat and internal mode.
- Privy DID authorizes data; optional approved wallets are not chat prerequisites.
- Credits already implemented; production grant/rate policy not decided.
- GIWA anchoring deferred. No deployment, main merge or paid model calls.
- Docs decisions b7f750e were read; public Docs are not changed in this pass.

## Owner inputs still required
| Input | Owner | Gate |
|---|---|---|
| Model/provider, moderation and usage accounting | A + user | No speculative provider integration or paid call |
| Image storage, upload contract and lifecycle | B + user | No external account/storage purchase |
| Persona mutations, errors and limits | C -> integration | Reuse current DTO and preserve pinned snapshots |
| Discovery API gaps | D -> integration | No fabricated metrics or new recommendation engine |
| Free grants, cadence and per-model cost | user + integration | Local 100/1 values are fixtures, not launch policy |
| Remote DB/API hosting and durable worker | integration + user | No infrastructure creation or deployment |
| Retention/deletion and operator access policy | user + integration | Do not invent promises |

## Operational validation still pending
Actual Google/OTP/wallet approval and session recovery; remote PostgreSQL
concurrent writes and recovery; real provider quality/usage; persistent API and
worker runtime, observability and failure alerting. Read credentials only when
needed; never publish secrets, tokens, emails or personal test records.

No next-wave requests were found in remote handoff directories at initial intake.
This does not mean other workspaces have no local work. Do not edit them or claim
messages have been sent. Re-fetch and inspect owner handoffs before integration.
