# Entry And Result Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Intro and post-reveal actions with Iruka's existing blue
glass button system and a clear primary-secondary hierarchy.

**Architecture:** Keep the shared `iruka-action-button` visual source in
`styles.css`. Add role-specific classes to the existing active-pull buttons,
then use narrowly scoped selectors so adjacent buttons remain unchanged.

**Tech Stack:** React 18, TypeScript, native CSS, Node test runner.

## Global Constraints

- Add no dependency or visible copy.
- Do not change button order, handlers, disabled logic, or card state.
- Keep Intro and result actions responsive.
- Write failing tests before implementation.

---

### Task 1: Button Hierarchy Contract

**Files:**
- Modify: `tests/vending-view.test.mjs`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `asset-action-primary` for Vault and `asset-action-secondary` for
  Sell and Ship.

- [x] **Step 1: Add failing source assertions**

Require the Vault action to include `iruka-action-button
asset-action-primary`; require Sell and Ship to include
`asset-action-secondary`.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/vending-view.test.mjs
```

Expected: active-pull hierarchy assertions fail.

- [x] **Step 3: Add semantic action classes**

Add class names only. Keep every existing handler, icon, label, title, and
disabled expression unchanged.

- [x] **Step 4: Verify GREEN**

Run the Task 1 test command.

### Task 2: Shared Visual Treatment

**Files:**
- Modify: `tests/home-entry.test.mjs`
- Modify: `tests/vending-view.test.mjs`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: the action classes from Task 1.
- Produces: shared Intro gradient, primary result treatment, white-glass
  secondary treatment, and stable disabled state.

- [x] **Step 1: Add failing style assertions**

Disallow a solid `#1677ff` override on `.iruka-entry-action`. Require scoped
primary, secondary, and disabled result selectors.

- [x] **Step 2: Verify RED**

Run the focused button test and confirm the new style assertions fail.

- [x] **Step 3: Implement scoped styles**

Remove `.iruka-entry-action` from the solid account-button override. Give
active-pull actions a full-pill 48px control, use the existing Iruka glass
declaration for the primary action, and define white-glass secondary and
disabled states.

- [x] **Step 4: Verify GREEN**

Run the focused button test.

### Task 3: Regression Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-27-entry-result-buttons.md`

**Interfaces:**
- Produces: verified UI source with unchanged action behavior.

- [x] **Step 1: Run focused surfaces**

```bash
node --test --test-concurrency=1 tests/home-entry.test.mjs tests/vending-view.test.mjs
```

- [x] **Step 2: Run full source tests**

```bash
node --test --test-concurrency=1 tests/*.test.mjs
node --experimental-strip-types --test --test-concurrency=1 tests/*.test.ts
```

- [x] **Step 3: Run static checks**

```bash
npx tsc --noEmit
git diff --check
```

- [x] **Step 4: Confirm local server**

Verify `http://localhost:5173/` returns HTTP 200.
