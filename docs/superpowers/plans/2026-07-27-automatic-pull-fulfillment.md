# Automatic Pull Fulfillment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every GIWA Sepolia pull after one collector transaction by
using a permission-separated automatic Keeper.

**Architecture:** Preserve the current commit-reveal and ordered
without-replacement algorithm. Add a rotatable operator role, an encrypted
manifest loader, a same-origin Vercel fulfillment endpoint, and a browser
trigger that remains tied to the original request ID.

**Tech Stack:** Solidity 0.8.28, Foundry, Node.js standard crypto, Vercel
Functions, viem, React 18, TypeScript.

## Global Constraints

- Add no dependency.
- Do not expose a Keeper private key, deployer key, or unencrypted server seed.
- Keep one collector wallet transaction per pull.
- Preserve committed odds, inventory proof verification, Reveal, Vault, Sell,
  and Ship behavior.
- Do not claim VRF or production readiness.
- Write failing tests before each behavior change.

---

### Task 1: Contract Operator Role

**Files:**
- Modify: `contracts/test/IrukaPackBatch.t.sol`
- Modify: `contracts/test/IrukaPackBatchConcurrent.t.sol`
- Modify: `contracts/src/IrukaPackBatch.sol`
- Modify: `contracts/script/DeployIrukaPackBatch.s.sol`

**Interfaces:**
- Produces: `operator()`, `setOperator(address)`, `OperatorUpdated`, and
  operator-only `fulfillPull`.

- [x] Add failing tests proving the operator can fulfill, collectors cannot
  fulfill, the owner can rotate the operator, and zero addresses are rejected.
- [x] Run `forge test -vv` and confirm the new role tests fail.
- [x] Implement the smallest role separation while preserving owner-only batch
  and withdrawal behavior.
- [x] Run `forge test -vv` and confirm all contract tests pass.

### Task 2: Encrypted Manifest Contract

**Files:**
- Modify: `tests/giwa-batch-script.test.mjs`
- Create: `server/giwa/manifestStore.mjs`
- Create: `scripts/giwa/encrypt-manifest.mjs`
- Create: `server/giwa/manifests/debut.json.enc`

**Interfaces:**
- Produces: `encryptBatchManifest`, `decryptBatchManifest`, and
  `loadBatchManifest`.

- [x] Add a failing round-trip test that rejects a wrong key and never writes
  plaintext seeds to the encrypted artifact.
- [x] Run `node --test tests/giwa-batch-script.test.mjs` and confirm failure.
- [x] Implement AES-256-GCM encryption with Node standard APIs.
- [x] Encrypt the current Debut manifest and rerun the focused test.

### Task 3: Idempotent Keeper Endpoint

**Files:**
- Create: `tests/giwa-keeper.test.mjs`
- Create: `server/giwa/fulfillRequest.mjs`
- Create: `api/giwa/fulfill.mjs`
- Create: `vercel.json`
- Modify: `.env.example`
- Modify: `scripts/giwa/fulfill-pull.mjs`

**Interfaces:**
- Consumes: `requestId`, configured contract, encrypted manifest, and Keeper
  key.
- Produces: `fulfilled`, `submitted`, or `pending` JSON states.

- [x] Add failing tests for fulfilled idempotency, ordered pending responses,
  proof submission, invalid request IDs, and secret-name contracts.
- [x] Run `node --test tests/giwa-keeper.test.mjs` and confirm failure.
- [x] Implement the shared Keeper operation and thin Vercel handler.
- [x] Reuse `GIWA_KEEPER_PRIVATE_KEY` in the manual recovery script.
- [x] Run the Keeper and batch-script tests.

### Task 4: Automatic Browser Trigger

**Files:**
- Modify: `tests/giwa-pull.test.ts`
- Modify: `tests/giwa-ui-wiring.test.mjs`
- Modify: `src/giwaFulfillment.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `triggerGiwaPullFulfillment(receipt)` and automatic trigger/poll
  behavior for the same request.

- [x] Add failing tests proving the Keeper is triggered without another wallet
  transaction and pending requests are retried.
- [x] Run the focused GIWA TypeScript and source tests and confirm failure.
- [x] Trigger the same-origin endpoint during fulfillment polling while keeping
  the existing receipt and recovery action.
- [x] Run the focused tests and TypeScript check.

### Task 5: Evidence, Deployment, And Release Verification

**Files:**
- Modify: `docs/gitbook/technical/giwa-testnet.mdx`
- Modify: `docs/gitbook/packs/pack-reveal.mdx`
- Modify: `.env.example`

**Interfaces:**
- Documents the deployed V2 address, role separation, automatic Keeper,
  transaction evidence, and remaining testnet limitations.

- [x] Update documentation without claiming deployment before Explorer
  verification.
- [x] Run all JS, TS, and Solidity tests.
- [x] Run `npm run build` and `git diff --check`.
- [ ] Deploy and verify V2, commit the Debut batch, fund the dedicated Keeper,
  configure encrypted Vercel secrets, redeploy, and verify two consecutive
  pulls from the browser.
