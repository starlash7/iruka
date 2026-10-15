# Common integration handoff — 2026-10-15

The initial rule-only intake was based on 8ada036. Current integration includes
A 4fb5391, B a1eca8d, C ecba192, D 7a0ae58 and Docs b7f750e.

## Existing contracts to reuse
- server/core/interfaces.ts: ModelService.stream accepts messages/signal and emits
  delta + actual usage; do not introduce a parallel model contract.
- src/shared/contracts.ts: PersonaDto and ChatDto.personaSnapshot; preserve snapshots.
- server/product/index.ts: composition point; chat and credits share scoped DB.
- api/server core: existing authentication and ApiEnvelope/error conventions.
- Models fail unavailable without a policy/provider. Local model/grants are opt-in.
- Persona PATCH/DELETE /api/me/personas/:id now use bearer ownership and the existing
  envelope. PATCH returns PersonaDto; DELETE returns null. Invalid input is 400,
  missing auth 401, other-owner/deleted IDs 404. Existing chat snapshots survive.

## Request format for A–D
Each handoff should contain baseline/head commit, owned files, requested shared
files, exact method/path or TypeScript signature, inputs/outputs/errors, auth and
ownership checks, compatibility/migration needs, tests and unresolved decisions.
Do not include secrets or production personal records.

## Integration status
All received heads were reviewed and merged. Common changes add persona soft delete,
local image storage injection, authenticated Reader images and summary-call opt-in.
See plans/integration-next.md and decisions/2026-10-15-integration.md for remaining
live-service approval/validation gates. No live model or remote services were created.

## Docs follow-up
Confirmed in code/local tests: story-led discovery, guided Studio, persona CRUD,
local uploads and private media retrieval, adapter contract with injected transport.
Repository Docs updated for those changes. Not confirmed: live OAuth/OTP, real model
quality/moderation, remote storage/DB, deployed API/workers or production readiness.
Historical per-owner handoffs retain their original pre-integration limitations.
