# Button And Typography Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the intro and Account primary actions one Iruka button treatment and remove the inconsistent Arial typography.

**Architecture:** Reuse the existing `iruka-action-button` class as the single primary CTA contract. Apply it only to Account's Deposit and Faucet actions, while keeping local size rules and semantic secondary actions unchanged.

**Tech Stack:** React, TypeScript, CSS, Node test runner

## Global Constraints

- No new dependency.
- Do not change visible copy.
- Keep copy, refresh, close, language, and sign-out controls semantically distinct.
- Use the existing Pretendard/Geist font stack.
- Verify desktop and mobile layouts without running a release build.

---

### Task 1: Lock The Shared CTA Contract

**Files:**
- Modify: `tests/account-view.test.mjs`
- Modify: `tests/home-entry.test.mjs`

**Interfaces:**
- Consumes: Existing `iruka-action-button` CSS class.
- Produces: Source-level regression coverage for the three primary CTA surfaces.

- [ ] **Step 1: Write failing assertions**

Assert that `Play Iruka`, `Deposit`, and `Open GIWA Faucet` use
`iruka-action-button`, and that the shared CSS uses `var(--font-sans)`.

- [ ] **Step 2: Run the focused tests**

Run:

```bash
node --test --test-concurrency=1 tests/home-entry.test.mjs tests/account-view.test.mjs
```

Expected: FAIL because the Account CTA classes and shared font contract are not
yet present.

### Task 2: Apply The Shared CTA Treatment

**Files:**
- Modify: `src/AccountPage.tsx`
- Modify: `src/AccountDepositDialog.tsx`
- Modify: `src/styles.css`
- Modify: `src/account-balance.css`
- Modify: `src/account-deposit.css`

**Interfaces:**
- Consumes: `.iruka-action-button`.
- Produces: Consistent primary CTA visuals with surface-specific dimensions.

- [ ] **Step 1: Add the shared class**

Use:

```tsx
className="account-deposit-button iruka-action-button"
```

and:

```tsx
className="account-faucet-action iruka-action-button"
```

- [ ] **Step 2: Normalize typography**

Change the shared primary CTA font from Arial to:

```css
font-family: var(--font-sans);
font-weight: 600;
```

Keep the intro's larger font size and Account's compact font sizes.

- [ ] **Step 3: Remove conflicting local primary colors**

Keep local dimensions and layout, but let `.iruka-action-button` own the
primary background, border, shadow, hover, pressed, and disabled states.

- [ ] **Step 4: Run focused tests**

Run:

```bash
node --test --test-concurrency=1 tests/home-entry.test.mjs tests/account-view.test.mjs tests/responsive-layout.test.mjs
```

Expected: PASS.

### Task 3: Visual And Type Verification

**Files:**
- No production file changes unless the visual audit exposes overflow or scale problems.

**Interfaces:**
- Consumes: Updated intro and Account UI.
- Produces: Desktop/mobile verification evidence.

- [ ] **Step 1: Check computed typography and dimensions**

Verify `1440px` and `390px` viewports for:

- font family
- label weight
- control height
- text overflow
- focus, hover, and pressed states

- [ ] **Step 2: Run final checks**

Run:

```bash
node --test --test-concurrency=1 tests/home-entry.test.mjs tests/account-view.test.mjs tests/responsive-layout.test.mjs
npx tsc --noEmit
git diff --check
```

Expected: all checks pass and both viewports have no horizontal overflow.
