# Account IP Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Account as an Iruka IP collector profile with a cover hero,
right-aligned identity, real collection KPIs, supporting wallet details, and
an always-visible Inventory.

**Architecture:** Split visual responsibilities into
`AccountProfileHero.tsx` and `AccountWalletPanel.tsx`; keep data loading and
session behavior in `AccountView.tsx`. `AccountPage.tsx` remains the page
composer and keeps the existing Deposit dialog.

**Tech Stack:** React 18, TypeScript, Lucide React, native CSS, Node test
runner.

## Global Constraints

- Add no dependency, fake metric, achievement, rank, membership, or progress.
- Preserve balance loading, address copying, Deposit, sign out, and Inventory.
- Inventory stays visible without a second click.
- Use `roadmap-iruka-universe.jpg` from the existing asset set.
- Keep every touched component under 200 lines.
- Write failing tests before implementation.

---

### Task 1: Profile And Wallet Components

**Files:**
- Create: `src/AccountProfileHero.tsx`
- Create: `src/AccountWalletPanel.tsx`
- Modify: `src/AccountPage.tsx`
- Modify: `src/appCopy.ts`
- Modify: `tests/account-view.test.mjs`

**Interfaces:**
- `AccountProfileHero` consumes identity, network, account, inventory, sign-out
  copy, and `onSignOut`.
- `AccountWalletPanel` consumes the existing address, balance, copy, Deposit,
  Retry, and callback props.
- `AccountPage` composes both components without changing its public props.

- [x] **Step 1: Add failing Account markup assertions**

Require `account-profile-hero`, `account-profile-cover`,
`account-profile-cluster`, `account-profile-nav`, `account-wallet-panel`,
`#account-overview`, and `#account-inventory`. Require the profile cluster to
contain Sign out and disallow the old `account-heading` and
`account-overview`.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/account-view.test.mjs
```

Expected: the new profile and wallet structure assertions fail.

- [x] **Step 3: Implement focused components**

Create the cover/profile/navigation component and move existing wallet markup
into `AccountWalletPanel`. Add localized `overview` and `walletDetails` copy.
Keep all callbacks and balance states unchanged.

- [x] **Step 4: Verify GREEN**

Run the Task 1 test command.

### Task 2: Iruka Profile Visual System

**Files:**
- Create: `src/account-profile.css`
- Modify: `src/account.css`
- Modify: `src/account-balance.css`
- Modify: `src/account-stats.css`
- Modify: `src/account-inventory.css`
- Modify: `src/main.tsx`
- Modify: `tests/responsive-layout.test.mjs`
- Modify: `tests/account-navigation.test.mjs`

**Interfaces:**
- Consumes: Task 1 class names.
- Produces: a full-width hero with right-aligned profile, left anchor controls,
  compact wallet utility, responsive KPI row, and visible Inventory.

- [x] **Step 1: Add failing style assertions**

Require the new stylesheet import, cover image treatment, right-aligned
profile cluster, hero anchor navigation, mobile hero stacking, compact wallet
grid, full-pill controls, and existing six/four/two-column Inventory grid.

- [x] **Step 2: Verify RED**

Run:

```bash
node --test --test-concurrency=1 tests/account-navigation.test.mjs tests/responsive-layout.test.mjs
```

Expected: the new Account profile style contracts fail.

- [x] **Step 3: Implement the visual system**

Move hero styles out of `account.css`, rewrite wallet presentation in
`account-balance.css`, simplify KPI accents, and retain existing Inventory
breakpoints. Add `account-profile.css` to `main.tsx`.

- [x] **Step 4: Verify GREEN**

Run the Task 2 test command.

### Task 3: Regression Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-27-account-ip-profile.md`

**Interfaces:**
- Produces: a verified Account redesign with unchanged session behavior.

- [x] **Step 1: Run focused Account tests**

```bash
node --test --test-concurrency=1 tests/account-view.test.mjs tests/account-navigation.test.mjs tests/responsive-layout.test.mjs
```

- [x] **Step 2: Run all tests**

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
