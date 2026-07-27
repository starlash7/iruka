# Production Pack Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-quality no-video Iruka pack reveal with distinct
rarity effects, a convincing CSS pack opening, and a stable interactive card
result.

**Architecture:** Keep the existing reveal state machine and GIWA result flow.
Add one decorative `RevealEffects` leaf, enrich the focused tear and card
components, and keep all choreography phase-driven through DOM data
attributes and CSS.

**Tech Stack:** React 18, TypeScript, native CSS, Node test runner.

## Global Constraints

- Do not add dependencies, canvas, WebGL, or video assets.
- Do not change GIWA, Vending, Vault, Marketplace, pack data, or visible copy.
- Keep sound muted by default and skip available from every active phase.
- Keep established rarity maximum durations unchanged.
- Use transform and opacity for continuous motion.
- Disable decorative motion and glare for reduced-motion users.

---

### Task 1: Rarity Stage Effects

**Files:**
- Create: `src/features/pack-reveal/RevealEffects.tsx`
- Create: `src/pack-reveal-effects.css`
- Modify: `src/features/pack-reveal/PackRevealOverlay.tsx`
- Modify: `src/main.tsx`
- Test: `tests/pack-reveal.test.mjs`

**Interfaces:**
- Consumes: `RevealPhase`.
- Produces: `<RevealEffects phase={phase} />`, with decorative rings, rays,
  burst, and deterministic particle nodes.

- [x] **Step 1: Write failing composition tests**

Require `PackRevealOverlay` to compose `RevealEffects`, require the component
to expose atmosphere, burst, rings, rays, and particles as `aria-hidden`, and
require the new stylesheet to include selectors for all five rarities,
responsive particle reduction, and reduced-motion shutdown.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/pack-reveal.test.mjs
```

Expected: failures because `RevealEffects` and its stylesheet do not exist.

- [x] **Step 3: Implement the effect leaf**

Render fixed deterministic decorative nodes, mount it before the pack and
card, import its stylesheet, and drive appearance exclusively from the
overlay's existing `data-phase` and `data-rarity`.

- [x] **Step 4: Verify GREEN**

Run the Task 1 test command and confirm it passes.

### Task 2: Pack Opening And Card Settle

**Files:**
- Modify: `src/features/pack-reveal/RevealTear.tsx`
- Modify: `src/features/pack-reveal/RevealCard.tsx`
- Modify: `src/pack-reveal-tear.css`
- Modify: `src/pack-reveal-card.css`
- Test: `tests/pack-reveal.test.mjs`

**Interfaces:**
- Consumes: current phase, selected pack poster, reveal card, and rarity CSS
  variables.
- Produces: a sealed pack shell with split foil pieces and fragments, plus a
  card with edge light, aura, foil, flip, and stable summary placement.

- [x] **Step 1: Write failing structure and motion tests**

Require a pack core light, foil surface, seal edges, deterministic fragments,
card aura, card edge, rarity selectors, and reduced-motion coverage.

- [x] **Step 2: Verify RED**

Run the focused pack reveal test and confirm the new structure assertions
fail.

- [x] **Step 3: Implement the no-video opening**

Add only decorative nodes to the existing components. Animate charge, split,
fragment scatter, burst handoff, card rise, foil sweep, and summary settle
without changing component props or result behavior.

- [x] **Step 4: Verify GREEN**

Run the focused test and `npx tsc --noEmit`.

### Task 3: Overlay Lifecycle And Responsive Polish

**Files:**
- Modify: `src/features/pack-reveal/PackRevealOverlay.tsx`
- Modify: `src/pack-reveal.css`
- Test: `tests/pack-reveal.test.mjs`

**Interfaces:**
- Produces: background scroll lock with cleanup, a stable desktop summary, and
  a centered mobile summary without horizontal overflow.

- [x] **Step 1: Write failing lifecycle assertions**

Require overlay mount cleanup to restore body overflow and require
reduced-transparency and narrow-mobile fallbacks in the reveal styles.

- [x] **Step 2: Verify RED**

Run the focused reveal test and confirm lifecycle/style assertions fail.

- [x] **Step 3: Implement lifecycle and layout safeguards**

Lock body scroll while the modal is mounted, restore the previous value on
unmount, soften transparency when requested, and constrain all fixed-format
surfaces on mobile.

- [x] **Step 4: Verify complete surface**

Run:

```bash
node --test --test-concurrency=1 tests/pack-reveal.test.mjs tests/vending-view.test.mjs
node --experimental-strip-types --test tests/reveal-machine.test.ts
npx tsc --noEmit
git diff --check
```

Then inspect the reveal at desktop and mobile sizes through the local server.
