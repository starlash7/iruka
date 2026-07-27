# Account Product UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Account as a wide Iruka product surface while preserving all existing Account behavior and copy.

**Architecture:** Keep `AccountView` and all data flow unchanged. Recompose only the presentational `AccountPage` markup into one overview surface and one Inventory surface, then update the focused Account stylesheets to match existing Marketplace and Vending tokens.

**Tech Stack:** React 18, TypeScript, native CSS, Node test runner, existing Lucide icons.

## Global Constraints

- Do not add dependencies.
- Do not change Account copy, balance behavior, inventory calculations, Deposit behavior, or logout behavior.
- Keep Inventory number and status only, with no card thumbnails.
- Use existing CSS variables and existing application patterns.
- Do not run the build for this normal visual edit.

---

### Task 1: Recompose the Account overview

**Files:**
- Modify: `tests/account-view.test.mjs`
- Modify: `src/AccountPage.tsx`

**Interfaces:**
- Consumes: existing `AccountPageProps`.
- Produces: `.account-overview`, `.account-profile-summary`, and
  `.account-balance-panel` markup without changing callbacks or state.

- [ ] **Step 1: Write the failing markup test**

Add assertions that Account renders one `account-overview`, does not render
`account-profile-card` or `account-avatar`, and keeps Balance, Deposit,
Inventory, address, and Sign out.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/account-view.test.mjs
```

Expected: the new overview assertions fail against the old three-card markup.

- [ ] **Step 3: Implement the minimal markup change**

Replace the profile-card and balance-card wrappers with one:

```tsx
<article className="account-overview">
  <div className="account-profile-summary">...</div>
  <div className="account-balance-panel">...</div>
</article>
```

Keep all existing balance-state branches and callbacks unchanged. Rename the
Inventory wrapper to `account-inventory-panel`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the same Node test command. Expected: all Account rendering tests pass.

### Task 2: Align Account styling with Iruka product pages

**Files:**
- Modify: `tests/account-view.test.mjs`
- Modify: `src/account.css`
- Modify: `src/account-balance.css`
- Modify: `src/account-inventory.css`
- Modify: `src/account-deposit.css`

**Interfaces:**
- Consumes: the class names from Task 1 and global CSS variables in
  `src/styles.css`.
- Produces: wide desktop overview, flat numeric Inventory, and explicit
  single-column mobile behavior.

- [ ] **Step 1: Write the failing visual contract test**

Assert that Account uses the existing 1600px product canvas, a 40px-class
heading scale, one overview surface, a two-column overview on desktop, a
single-column overview under 760px, and no `.account-profile-card` selector.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/account-view.test.mjs tests/responsive-layout.test.mjs
```

Expected: the old 1180px dashboard layout fails the new visual contract.

- [ ] **Step 3: Implement the minimum CSS replacement**

Use existing variables:

```css
.account-section {
  width: 100%;
  max-width: 1600px;
  padding-inline: clamp(14px, 2.2vw, 30px);
}

.account-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  border: 1px solid rgba(214, 228, 255, 0.82);
  border-radius: var(--radius-xl);
}
```

Use one internal divider, restrained blue-tinted shadow, `var(--blue)` and
`var(--blue-hover)` for actions, and flat Inventory status columns.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same focused test command. Expected: all tests pass.

- [ ] **Step 5: Run final verification**

Run:

```bash
node --test --test-concurrency=1 tests/account-navigation.test.mjs tests/account-view.test.mjs tests/auth-actions.test.mjs tests/giwa-balance.test.mjs tests/responsive-layout.test.mjs
npx tsc --noEmit --pretty false
git diff --check
```

Expected: zero failures and zero TypeScript or whitespace errors.
