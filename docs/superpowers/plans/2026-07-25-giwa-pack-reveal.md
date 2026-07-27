# GIWA Pack Receipt And Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record concurrent, without-replacement pack pulls on GIWA Sepolia and replace the current Three.js-first reveal with the `sprint.md` DOM reveal flow.

**Architecture:** `IrukaPackBatch` reserves supply at request time and fulfills requests in draw order using per-draw server seeds committed in a Merkle root. The browser submits one request transaction and exposes its real Explorer receipt. A pure reveal state machine drives optional tear media, a CSS fallback, an interactive DOM card, and a persistent summary.

**Tech Stack:** Solidity 0.8.28, Foundry, React 18, TypeScript, CSS, viem, Node test runner.

## Global Constraints

- Do not claim VRF, production settlement, custody, or ERC-721 ownership.
- Do not add dependencies.
- Keep sound generic, visible, and muted by default.
- Skip must work from every active reveal state.
- Reduced-motion and missing media must complete through CSS.
- Preserve existing Vending, Vault, Sell, Ship, Marketplace, and Privy behavior.
- Render Explorer links only for real GIWA Sepolia transaction hashes.

---

### Task 1: Concurrent GIWA Pull Receipt Contract

**Files:**
- Modify: `contracts/test/IrukaPackBatch.t.sol`
- Modify: `contracts/src/IrukaPackBatch.sol`

**Interfaces:**
- Consumes: inventory and per-draw Merkle roots committed by Task 2.
- Produces: `commitBatch(..., drawSeedRoot)`, `requestPull(batchId, clientSeed)`, `fulfillPull(requestId, serverSeed, seedProof, inventoryId, inventoryProof)`, `getBatch`, and `getPull`.

- [ ] **Step 1: Write failing contract tests**

Add tests that submit two requests before fulfillment, assert draw indices `0`
and `1`, assert available supply reaches zero while remaining supply stays
unchanged, reject a third request, reject out-of-order fulfillment, reject a
server seed proven for the wrong draw position, and complete both requests
without assigning the same inventory item.

- [ ] **Step 2: Verify RED**

Run: `forge test -vv`

Expected: compilation or assertion failures because the existing contract has
one batch-wide pending request and one server-seed commitment.

- [ ] **Step 3: Implement the minimal contract**

Replace `pendingRequestId` and the batch-wide seed commitment with
`available`, `drawSeedRoot`, `nextDrawIndex`, and `nextFulfillIndex`. Reserve
available supply in `requestPull`; verify the draw seed and inventory proofs in
`fulfillPull`; preserve the existing swap mapping for without-replacement
selection.

- [ ] **Step 4: Verify GREEN**

Run: `forge test -vv`

Expected: all contract tests pass.

### Task 2: Batch Manifest And Operator Scripts

**Files:**
- Modify: `tests/giwa-batch-script.test.mjs`
- Modify: `scripts/giwa/prepare-batch.mjs`
- Modify: `scripts/giwa/commit-batch.mjs`
- Modify: `scripts/giwa/fulfill-pull.mjs`

**Interfaces:**
- Consumes: Task 1 contract ABI.
- Produces: a local manifest with `drawSeedRoot` and one seed/proof per draw.

- [ ] **Step 1: Write the failing manifest test**

Require a four-card manifest to contain four draw seeds, valid bytes32 seed
values, a `drawSeedRoot`, and Merkle proofs for both inventory and draw seeds.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/giwa-batch-script.test.mjs`

Expected: assertions fail because the current manifest has no draw-seed tree.

- [ ] **Step 3: Implement manifest and scripts**

Generate cryptographically random local draw seeds with `node:crypto`, commit
their indexed leaves in a Merkle tree, pass the root to `commitBatch`, and have
the fulfillment script read the request's draw index before submitting the
matching seed and proofs.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/giwa-batch-script.test.mjs`

Expected: the manifest test passes.

### Task 3: One-Transaction Browser Request

**Files:**
- Modify: `tests/giwa-pack-batch.test.ts`
- Modify: `tests/giwa-pull.test.ts`
- Modify: `tests/giwa-ui-wiring.test.mjs`
- Modify: `src/giwaPackBatch.ts`
- Modify: `src/giwaPull.ts`
- Modify: `src/VendingPackDetail.tsx`

**Interfaces:**
- Consumes: Task 1 contract ABI.
- Produces: `GiwaPullReceipt` with request transaction hash, request ID, draw index, contract address, and Explorer URL.

- [ ] **Step 1: Write failing ABI and wiring tests**

Assert that `requestPull` accepts the raw client seed, `PullRequested` exposes
the draw index, the receipt has no reveal transaction, and the UI links the
request transaction.

- [ ] **Step 2: Verify RED**

Run:
`node --experimental-strip-types --test tests/giwa-pack-batch.test.ts tests/giwa-pull.test.ts`
and `node --test tests/giwa-ui-wiring.test.mjs`

Expected: ABI/source assertions fail against the two-transaction flow.

- [ ] **Step 3: Implement the browser request**

Read `available` and `priceWei`, send one `requestPull`, parse `requestId` and
`drawIndex`, and build the Explorer URL from the confirmed request hash.

- [ ] **Step 4: Verify GREEN**

Run the Task 3 test commands again.

Expected: all selected tests pass.

### Task 4: Reveal State Machine

**Files:**
- Create: `tests/reveal-machine.test.ts`
- Create: `src/features/pack-reveal/revealMachine.ts`
- Modify: `src/features/pack-reveal/revealConfig.ts`
- Modify: `src/features/pack-reveal/useRevealTimeline.ts`

**Interfaces:**
- Produces: phases `idle | charging | tear | reveal | summary`, rarity-aware timelines, quick mode, reduced-motion mode, and skip-to-summary behavior.

- [ ] **Step 1: Write failing pure state tests**

Test normal phase order, 500ms maximum charging, rarity maximum duration,
quick-mode shortening, reduced-motion shortening, and skip from every
non-summary phase.

- [ ] **Step 2: Verify RED**

Run:
`node --experimental-strip-types --test tests/reveal-machine.test.ts`

Expected: module-not-found failure for `revealMachine.ts`.

- [ ] **Step 3: Implement state helpers and hook**

Keep timeline calculation pure in `revealMachine.ts`; use browser timers in
`useRevealTimeline.ts`; expose `phase`, `skip`, and `isSummary`.

- [ ] **Step 4: Verify GREEN**

Run the Task 4 test command again.

Expected: all reveal machine tests pass.

### Task 5: DOM Tear, Card, And Summary

**Files:**
- Create: `tests/pack-reveal.test.mjs`
- Create: `src/features/pack-reveal/RevealCard.tsx`
- Create: `src/features/pack-reveal/RevealTear.tsx`
- Modify: `src/features/pack-reveal/PackRevealOverlay.tsx`
- Modify: `src/styles.css`
- Modify: `src/appCopy.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 4 timeline and the existing `RevealCard` data shape.
- Produces: accessible reveal dialog with CSS tear fallback, pointer tilt, card flip, summary, skip, quick mode, and optional GIWA receipt.

- [ ] **Step 1: Write failing component/source tests**

Assert that the overlay renders the DOM tear and card components, exposes skip
during every active phase, shows a summary action, supports optional media,
and no longer imports `RevealScene`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/pack-reveal.test.mjs`

Expected: assertions fail because the DOM components do not exist.

- [ ] **Step 3: Implement the DOM reveal**

Build transform-only CSS motion, pointer-derived glare variables, front/back
flip, optional video error fallback, summary metadata, muted sound control,
and a continue action that commits the existing App result.

- [ ] **Step 4: Verify GREEN**

Run the Task 5 test command again.

Expected: all reveal component tests pass.

### Task 6: Documentation And Focused Regression

**Files:**
- Modify: `docs/gitbook/technical/giwa-testnet.mdx`
- Modify: `docs/gitbook/packs/pack-reveal.mdx`

**Interfaces:**
- Documents the deployed behavior without publishing an address before deployment.

- [ ] **Step 1: Update technical documentation**

Describe the one-transaction request, per-draw seed root, ordered operator
fulfillment, DOM fallback, and explicit trust limitation. Keep deployment
address and verification status pending.

- [ ] **Step 2: Run focused verification**

Run:

```bash
forge test -vv
node --experimental-strip-types --test tests/giwa-pack-batch.test.ts tests/giwa-pull.test.ts tests/reveal-machine.test.ts
node --test tests/giwa-batch-script.test.mjs tests/giwa-ui-wiring.test.mjs tests/pack-reveal.test.mjs tests/vending-view.test.mjs
git diff --check
```

Expected: every command exits successfully with no failed tests or whitespace
errors.

- [ ] **Step 3: Inspect changed scope**

Run: `git diff --stat && git status --short`

Expected: only GIWA, reveal, directly related Docs/tests, and pre-existing
unrelated user changes appear.
