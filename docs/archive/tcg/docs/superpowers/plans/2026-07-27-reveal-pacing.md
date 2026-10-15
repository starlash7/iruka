# Reveal Pacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every default no-video pack reveal use the full rarity-aware
sequence and preserve Quick open as an explicit, optional path.

**Architecture:** Keep `revealMachine.ts` as the pure timing source and
`PackRevealOverlay.tsx` as the interaction composer. Replace automatic
local-storage quick selection with the full timeline, then keep Skip visible
through every active phase.

**Tech Stack:** React 18, TypeScript, native CSS, Node test runner.

## Global Constraints

- Add no dependency or video.
- Do not change GIWA pull results, receipt handling, result actions, or copy.
- Charging remains at or below 500ms.
- Common remains at 1.5s, Rare and Epic at 3.0s, Legendary and Iruka at 4.5s.
- Reduced-motion keeps its existing short fallback.
- Write failing tests before behavior changes.

---

### Task 1: Full Default Timeline

**Files:**
- Modify: `tests/reveal-machine.test.ts`
- Modify: `src/features/pack-reveal/revealMachine.ts`

**Interfaces:**
- Consumes: `getRevealTimeline(rarity, options?)`.
- Produces: exact default phase timings from the approved pacing design.

- [x] **Step 1: Add exact timing assertions**

Assert default event times:

```ts
const expected = {
  common: [0, 400, 900, 1500],
  rare: [0, 480, 1750, 3000],
  epic: [0, 480, 1750, 3000],
  legendary: [0, 500, 2800, 4500],
  iruka: [0, 500, 2800, 4500]
} as const;
```

- [x] **Step 2: Verify RED**

Run:

```bash
node --experimental-strip-types --test tests/reveal-machine.test.ts
```

Expected: the exact default timing test fails against the current event times.

- [x] **Step 3: Implement the timing table**

Add one internal normal-timing record and pass its values to
`createTimeline`. Keep quick and reduced-motion branches unchanged.

- [x] **Step 4: Verify GREEN**

Run the Task 1 test command and confirm all reveal-machine tests pass.

### Task 2: Explicit Quick Behavior And Persistent Skip

**Files:**
- Modify: `tests/pack-reveal.test.mjs`
- Modify: `src/features/pack-reveal/PackRevealOverlay.tsx`

**Interfaces:**
- Consumes: `useRevealTimeline({ quick: false, ... })`.
- Produces: the full timeline by default and a Skip action during every
  non-summary phase.

- [x] **Step 1: Add overlay source assertions**

Require `quick: false`, disallow `getRevealCount`, and require the Skip button
to be guarded only by `!isSummary`.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/pack-reveal.test.mjs
```

Expected: overlay assertions fail because quick mode is read from local
storage and Skip is restricted to quick mode.

- [x] **Step 3: Remove implicit quick selection**

Remove `getRevealCount` and the `quick` state. Pass `quick: false`, set
`data-quick={false}`, and render Skip whenever summary is not active. Keep
`markRevealSeen` only for completion history.

- [x] **Step 4: Verify GREEN**

Run the Task 2 test command and confirm all pack-reveal tests pass.

### Task 3: Regression Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-27-reveal-pacing.md`

**Interfaces:**
- Produces: verified reveal behavior without changes to adjacent product
  surfaces.

- [x] **Step 1: Run focused tests**

```bash
node --experimental-strip-types --test tests/reveal-machine.test.ts
node --test --test-concurrency=1 tests/pack-reveal.test.mjs
```

- [x] **Step 2: Run TypeScript and formatting checks**

```bash
npx tsc --noEmit
git diff --check
```

- [x] **Step 3: Confirm local server**

Verify `http://localhost:5173/` returns HTTP 200 and keep the development
server running for manual review.
