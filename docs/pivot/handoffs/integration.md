# Common integration handoff — 2026-10-15

Code baseline remains 8ada036 until a reviewed common runtime change is published.
The accompanying rule commit does not change APIs, migrations or environments.

## Existing contracts to reuse
- server/core/interfaces.ts: ModelService.stream accepts messages/signal and emits
  delta + actual usage; do not introduce a parallel model contract.
- src/shared/contracts.ts: PersonaDto and ChatDto.personaSnapshot; preserve snapshots.
- server/product/index.ts: composition point; chat and credits share scoped DB.
- api/server core: existing authentication and ApiEnvelope/error conventions.
- Models fail unavailable without a policy/provider. Local model/grants are opt-in.
- Persona list exists; mutation needs must be checked against actual router before
  C assumes CRUD is available. No new mutation endpoints are announced here.

## Request format for A–D
Each handoff should contain baseline/head commit, owned files, requested shared
files, exact method/path or TypeScript signature, inputs/outputs/errors, auth and
ownership checks, compatibility/migration needs, tests and unresolved decisions.
Do not include secrets or production personal records.

## Integration status
A/B/D remote heads still represent the already-integrated work; C has no remote
handoff at intake. New requests are pending, not approved by omission.
See plans/integration-next.md for owners/gates and decisions/2026-10-15-integration.md
for operating inputs. Shared contracts will be implemented only after intake.

## Docs follow-up
Confirmed now: consistent pink/story-led scope, optional wallets, implemented
test credits, deferred anchor. Not yet confirmed: new model, upload, persona CRUD,
new discovery UI or operating readiness. Docs must not mark those complete.
