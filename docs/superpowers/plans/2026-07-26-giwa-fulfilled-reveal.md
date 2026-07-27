# GIWA Fulfilled Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reveal the exact inventory card assigned by a confirmed GIWA
`PullFulfilled` event without requiring a deployment key in the browser.

**Architecture:** Keep wallet submission in `giwaPull.ts`. Add one focused
module for fulfillment polling and one for mapping the committed inventory
index to Vending data. `App` preserves a pending request and retries that
request instead of sending another transaction.

**Tech Stack:** React 18, TypeScript, viem, Node test runner, Solidity 0.8.28.

## Global Constraints

- Do not add dependencies.
- Never reveal a local random card for a configured GIWA batch.
- Render Explorer links only from confirmed request or fulfillment hashes.
- Preserve local fixture Reveal, Vault, Sell, and Ship behavior.
- Keep sound muted by default and existing reveal timing unchanged.
- Use a 100-position Debut review batch matching `60/28/9/2/1` exactly.

---

### Task 1: Fulfillment Reader And Polling

**Files:**
- Create: `src/giwaFulfillment.ts`
- Modify: `src/giwaPackBatch.ts`
- Modify: `src/giwaPull.ts`
- Test: `tests/giwa-pull.test.ts`

**Interfaces:**
- Consumes: `GiwaPullReceipt`.
- Produces: `readGiwaPullFulfillment(receipt)` and
  `waitForGiwaPullFulfillment(receipt, options)`.

- [x] **Step 1: Write failing polling tests**

Test that pending reads retry, fulfilled reads return the assigned inventory,
timeouts return `undefined`, and fulfillment links use the event transaction.

- [x] **Step 2: Verify RED**

Run:

```bash
node --experimental-strip-types --test tests/giwa-pull.test.ts
```

Expected: module or export assertions fail.

- [x] **Step 3: Implement the reader**

Add the `PullFulfilled` event ABI, store the request block number, read
`getPull`, query the canonical event from that block, and poll with injectable
reader and delay functions.

- [x] **Step 4: Verify GREEN**

Run the Task 1 test command and confirm all tests pass.

### Task 2: Inventory Commitment Mapping

**Files:**
- Create: `src/giwaInventory.ts`
- Modify: `src/vendingFixtures.ts`
- Test: `tests/giwa-pack-batch.test.ts`
- Test: `tests/vending-data.test.ts`

**Interfaces:**
- Consumes: `packId`, `inventoryId`, and `inventoryIndex`.
- Produces: `createGiwaVendingPull(packId, fulfillment)`.

- [x] **Step 1: Write failing mapping tests**

Test that index zero maps to `debut-inventory-001`, a mismatched commitment is
rejected, and Debut contains exactly 100 inventory positions with counts
`60/28/9/2/1`.

- [x] **Step 2: Verify RED**

Run:

```bash
node --experimental-strip-types --test \
  tests/giwa-pack-batch.test.ts \
  tests/vending-data.test.ts
```

Expected: the new mapper is missing and Debut still has 120 items.

- [x] **Step 3: Implement exact mapping**

Read one card by inventory index, hash its source ID with the existing
commitment helper, reject mismatches, and return a `VendingPull`. Align the
Debut fixture counts and supply to 100.

- [x] **Step 4: Verify GREEN**

Run the Task 2 test command and confirm all tests pass.

### Task 3: Pending Request To Reveal

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/VendingView.tsx`
- Modify: `src/VendingPackDetail.tsx`
- Modify: `src/appCopy.ts`
- Test: `tests/giwa-ui-wiring.test.mjs`
- Test: `tests/vending-view.test.mjs`

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: one pending request, retryable result check, and exact Reveal.

- [x] **Step 1: Write failing wiring tests**

Require `App` to wait for fulfillment, map the assigned inventory, preserve a
timed-out receipt, and avoid another `requestGiwaPull` call while pending.
Require short English and Korean pending labels.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test tests/giwa-ui-wiring.test.mjs tests/vending-view.test.mjs
```

Expected: source assertions fail.

- [x] **Step 3: Implement pending flow**

Submit only when no request exists. Poll the existing request, create the
committed Vending result after fulfillment, open the existing Reveal overlay,
and use the fulfillment transaction in the summary receipt.

- [x] **Step 4: Verify GREEN**

Run the Task 3 test command and confirm all tests pass.

### Task 4: Review Batch And Evidence Docs

**Files:**
- Modify: `scripts/giwa/prepare-batch.mjs`
- Modify: `tests/giwa-batch-script.test.mjs`
- Modify: `docs/gitbook/technical/giwa-testnet.mdx`
- Generate locally: `.context/giwa-debut-batch.json`

**Interfaces:**
- Produces: a private 100-position Debut manifest and a deployment-independent
  operator runbook.

- [x] **Step 1: Write failing manifest assertions**

Require `packId`, 100 matching inventory IDs, and exact public odds metadata.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test tests/giwa-batch-script.test.mjs
```

Expected: the manifest has no explicit `packId`.

- [x] **Step 3: Update script and Docs**

Accept a pack ID, store it in the manifest, document polling and fulfillment
evidence, and keep all addresses pending until verified deployment.

- [x] **Step 4: Generate the private review manifest**

Run:

```bash
node scripts/giwa/prepare-batch.mjs \
  IRK-GG-2026-001 100 1000000000000000 \
  scripts/giwa/debut-odds.json \
  .context/giwa-debut-batch.json \
  debut
```

- [x] **Step 5: Verify the complete surface**

Run Foundry tests, all Node tests, `npx tsc --noEmit`, script syntax checks,
`git diff --check`, and confirm the local server returns HTTP 200.
