# Monad Backend Implementation Plan

> **For agentic workers:** Execute inline with executing-plans, using focused red/green checks. This isolated workspace owns only Monad backend files.

**Goal:** Add independent Monad Testnet Keeper routes and operator scripts without changing GIWA.

**Architecture:** Reuse the chain-neutral fulfillment algorithm, atomic Blob operations, encryption primitives and ABI. Monad wrappers select chain 10143, dedicated credentials, encrypted manifest and chain-scoped lease keys. A fresh contract has exactly one Debut batch; recovery maps the next draw to its global request ID.

**Tech Stack:** Node ESM, viem, Vercel Blob, Foundry, node:test; no new dependencies.

## Global Constraints

- No deployments, private-key inspection, branch rename, push, PR or merge.
- Scope: server/monad, api/monad, scripts/monad, two focused tests and this plan.
- Batch IRK-MON-2026-001, debut, 100 positions, 10000000000000 wei; identical inventory identifiers/order, independent seeds.
- Encrypted manifest is absent until deployment preparation; no GIWA manifest or secrets copied.
- Shared CRON_SECRET and BLOB_READ_WRITE_TOKEN retain semantics.
- Official guides checked 2026-10-06: Foundry >=1.8, --network monad; MonadVision Sourcify verification with chain 10143.

### Task 1: Independent Keeper and routes

Files: server/monad/{monadTestnetChain,manifestStore,fulfillmentLease,fulfillRequest,recoverPendingPull}.mjs; api/monad/{fulfill,recover}.mjs; tests/monad-keeper.test.mjs.

- [x] Write failing tests for dedicated configuration, lease namespace, decimal string validation, method/origin/cron rejection and no-store.
- [x] Run `node --test tests/monad-keeper.test.mjs`; confirm missing Monad implementation failure.
- [x] Implement environment wiring exporting `fulfillMonadPullFromEnvironment(requestId, environment)` and `recoverNextMonadPullFromEnvironment(environment)`; reuse generic fulfillment and leases. Keep the exact GIWA result/error contract. Require server credentials and Blob token; assert RPC chain ID before signing.
- [x] Run focused tests; test ordered pending, submitted, fulfilled, lease contention and recovery through shared algorithm.

### Task 2: Operator scripts

Files: scripts/monad/{prepare-batch,commit-batch,commitGuard,encrypt-manifest,fulfill-pull,deploy-pack-batch,deploymentForge}.mjs and debut-odds.json; tests/monad-batch-script.test.mjs.

- [x] Write failing CLI tests for exact manifest configuration, every Merkle proof, fresh seeds, encryption round trip and missing Monad credentials.
- [x] Run `node --test tests/monad-batch-script.test.mjs`; confirm missing scripts failure.
- [x] Adapt preparation for fixed Debut settings and mode 0600 exclusive output; validate Monad manifest before encryption/commit. Compile unchanged contract with `forge build --network monad`; deploy via viem with a dedicated deployer, set dedicated operator, wait for real success receipts, verify using official Sourcify endpoint. Refuse Forge <1.8 and wrong chain.
- [x] Manual fulfillment delegates to the same encrypted-manifest Keeper and Blob lease, then waits for real receipt if submitted. Never bypass the lease.
- [x] Run script tests and existing GIWA script tests.

### Task 3: Verification and handoff

- [x] Run `npm ci` and `npm run build` before generating files (completed before implementation).
- [x] Run `node --test tests/monad-keeper.test.mjs tests/monad-batch-script.test.mjs tests/giwa-keeper.test.mjs tests/giwa-batch-script.test.mjs` and `forge test`.
- [x] Check diff against assigned scope and `git diff --check`, then commit only assigned files locally.
- [x] Save .context/monad-backend-report.md with hash, prerequisites, coordinator config additions, deployment sequence, exact verification and limits.

## Completed evidence

Focused Monad and GIWA suites: 51/51 passing. Contract suites: 13/13 passing. Build passed before generation. Read-only review found no blockers. MONAD_APP_ORIGIN supports exact HTTPS deployment origin while retaining GIWA origins. Commit guard accepts the actual deployment transaction hash and scans bounded 100-block ranges. Deployment and Monad-specific Forge compilation remain unexecuted because runtime credentials are not installed and local Forge is 1.7.1 (official minimum 1.8). Handoff saved under .context/monad-backend-report.md.
