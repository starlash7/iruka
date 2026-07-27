# Account Summary Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present Account as three adjacent Inventory FMV, Cards collected, and
Wallet sections, with Sign out contained in Wallet.

**Architecture:** Keep Account data and callbacks in `AccountPage`. Render the
two real collection metrics through `AccountStats` and the existing wallet
behavior through `AccountWalletPanel` inside one responsive summary grid.
Remove Sign out only from `AccountProfileHero`.

**Tech Stack:** React 18, TypeScript, Lucide React, native CSS, Node test runner.

## Global Constraints

- Preserve balance loading, Retry, address copy, Deposit, and sign out.
- Render exactly three summary sections.
- Do not add copy, fake metrics, dependencies, or nested cards.
- Keep Inventory immediately visible.
- Keep touched source files at or below 200 lines.

---

### Task 1: Three-Section Account Summary

**Files:**
- Modify: `src/AccountProfileHero.tsx`
- Modify: `src/AccountStats.tsx`
- Modify: `src/AccountWalletPanel.tsx`
- Modify: `src/AccountPage.tsx`
- Modify: `src/account-profile.css`
- Modify: `src/account-stats.css`
- Modify: `src/account-balance.css`
- Modify: `tests/account-view.test.mjs`
- Modify: `tests/responsive-layout.test.mjs`

**Interfaces:**
- `AccountProfileHero` no longer receives `onSignOut` or `signOutLabel`.
- `AccountWalletPanel` receives `onSignOut` and renders the sign-out action.
- `AccountStats` renders only Inventory FMV and Cards collected.

- [x] **Step 1: Add failing structure assertions**

Require `.account-summary-grid` to contain AccountStats followed by Wallet,
require Sign out inside Wallet and outside the profile cluster, and disallow
Listed and Shipping summary cards.

- [x] **Step 2: Verify RED**

```bash
node --test --test-concurrency=1 tests/account-view.test.mjs tests/responsive-layout.test.mjs
```

Expected: the three-section grid and Wallet sign-out assertions fail.

- [x] **Step 3: Implement component composition and CSS**

Move the Sign out button to `AccountWalletPanel`, limit `AccountStats` to two
metrics, and compose both inside a three-column summary surface. Use a stacked
mobile layout without changing the existing Inventory gallery.

- [x] **Step 4: Verify**

```bash
node --test --test-concurrency=1 tests/account-view.test.mjs tests/responsive-layout.test.mjs
npx tsc --noEmit
node --test --test-concurrency=1 tests/*.test.mjs
node --test --test-concurrency=1 tests/*.test.ts
git diff --check
```

Expected: all checks pass and the local server returns HTTP 200.
