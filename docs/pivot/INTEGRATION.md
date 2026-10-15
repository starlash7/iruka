# A-D integration

Scope: compose the existing branches on the current workspace branch; no main
merge, deployment, paid model call or chain write. Preserve later brand/account
changes. GIWA anchoring remains deferred as recorded by D.

## Checklist
- [x] Register studio/chat migrations and compose authenticated API handlers.
- [x] Align reader DTOs, start/view/list, selection, branching, memo and regeneration.
- [x] Connect real credit transactions to chat, explicit local test model/policy,
      lease recovery and summary worker.
- [x] Connect product routes, remove duplicate shell, unify pink UI tokens.
- [x] Test integrated publication -> discovery -> chat -> credits -> recovery,
      ownership and replay; repair placeholder tests.
- [x] Verify full tests/build and desktop/mobile; record limits.

## Verification (2026-10-14)

- `npm test`: 128 passed, 0 failed.
- `npm run build`: passed, including API and scripts in server TypeScript checks.
  Existing Privy/application chunk size warning remains (about 2.4 MB raw).
- Browser: 1440/768/390px, actual product routes and real service composition in
  an isolated test DB. Publication, discovery, detail, ranking, studio route,
  start, send, reload: no horizontal overflow or browser runtime errors.
- Browser auth was injected only in the test transport. This is not evidence of
  successful real OAuth, email delivery or wallet approval.
- Service tests include anonymous denial, cross-user access denial, idempotent
  grant/turn replay, siblings, branching, memo, provider failure refund and
  expired lease recovery. Only real successful turns contribute to ranking.
- Old chats read mode/title from their pinned version, not an edited work.
  Shared chat/credit writers lock account before chat/turn to avoid inversion.
- User-requested wallet restoration is preserved; this review submits no funds.

## Local run

`npm run dev` starts web/API with real Privy JWT verification. To exercise the
deterministic model and one-time 100 test credits per user, set
`LOCAL_TEST_CHAT=1` explicitly. Production/VERCEL environments reject this flag.
Without a configured model/policy, generation is unavailable, not fabricated.

To import the two existing manuscripts into the local app DB:
`node --experimental-strip-types scripts/seed/seed-works.ts --development`.
It refuses `DATABASE_URL`, production and Vercel; `LOCAL_DATABASE_DIR` can select
an isolated local directory. Import is idempotent. Artwork remains unset until
real assets are provided.

Review server: web `http://localhost:5173`, API `127.0.0.1:8791`, isolated DB
`.context/integration-dev-db`. The model is a deterministic local fixture.
No real LLM provider has been connected by this integration.

## Before release

Verify real Privy Google/email/wallet sign-in and sign-out, remote PostgreSQL
concurrency, actual model adapter/usage pricing, production safety moderation,
asset storage, deployment API hosting and durable recovery worker. GIWA ledger
anchoring is deferred; it is not implemented by these credits changes.

No actual OAuth/OTP, remote PostgreSQL concurrency or real LLM quality is claimed
by local tests. Local test grants/prices are development fixtures, not a release
pricing decision.
