# Account Profile Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real collection KPIs to Account and replace the authenticated header wallet address with an Iruka avatar menu.

**Architecture:** Keep collection and Privy state in their current owners. Add a focused presentational `AccountStats` component and a focused stateful `ProfileMenu`; pass locale callbacks from `AppHeader` without adding routes or dependencies.

**Tech Stack:** React 18, TypeScript, native CSS, Privy, Lucide, Node test runner.

## Global Constraints

- Do not add dependencies or fake volume, rank, membership, or activity data.
- Preserve Privy authentication, GIWA wallet selection, Account balance, Deposit, and Inventory actions.
- Use only current collection state for Account KPI values.
- Use existing Iruka tokens, English/Korean copy, and responsive breakpoints.
- Do not run the release build for this normal UI change.

---

### Task 1: Collection KPI Contract

**Files:**
- Modify: `tests/account-view.test.mjs`
- Modify: `src/AccountView.tsx`
- Modify: `src/AccountPage.tsx`
- Create: `src/AccountStats.tsx`
- Create: `src/account-stats.css`

**Interfaces:**
- Consumes: `readonly CardPull[]` and localized `AccountCopy`.
- Produces: `getAccountInventorySummary(cards)` with `estimatedValue`, `listed`, `shipping`, and `total`.

- [ ] Write failing tests for sold-card exclusion, FMV summing, Iruka avatar markup, and the four KPI labels.
- [ ] Run `node --test --test-concurrency=1 tests/account-view.test.mjs` and confirm the assertions fail because stats and FMV do not exist.
- [ ] Implement `AccountStats`, calculate non-sold collection values, and remove the duplicate Inventory summary strip.
- [ ] Run the focused Account tests and confirm they pass.

### Task 2: Authenticated Profile Menu

**Files:**
- Modify: `tests/auth-actions.test.mjs`
- Create: `tests/profile-menu.test.mjs`
- Modify: `src/AuthActions.tsx`
- Modify: `src/AppChrome.tsx`
- Modify: `src/App.tsx`
- Modify: `src/appCopy.ts`
- Create: `src/ProfileMenu.tsx`
- Create: `src/profile-menu.css`

**Interfaces:**
- Consumes: Privy identity, connected GIWA wallet, locale, and current Account callback.
- Produces: circular avatar trigger and an accessible Account/Settings/Sign out menu.

- [ ] Write failing source and render tests for the avatar, menu actions, locale settings, and authenticated language-toggle placement.
- [ ] Run the Auth/Profile tests and confirm they fail because `ProfileMenu` does not exist.
- [ ] Implement the profile menu, outside-click/Escape closing, and locale settings without changing wallet selection.
- [ ] Run the focused Auth/Profile tests and confirm they pass.

### Task 3: Responsive Visual Verification

**Files:**
- Modify: `tests/responsive-layout.test.mjs`
- Modify: `src/account.css`
- Modify: `src/account-inventory.css`
- Modify: `src/account-stats.css`
- Modify: `src/profile-menu.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: Account stats and ProfileMenu class names.
- Produces: 4/2-column stat layouts and a viewport-safe right-aligned menu.

- [ ] Write failing CSS contract assertions for stat columns, 390px stacking, avatar dimensions, and menu width.
- [ ] Implement only the responsive rules required by those assertions.
- [ ] Run all Account/Auth/responsive tests, `npx tsc --noEmit`, and `git diff --check`.
- [ ] Capture and inspect 1440px and 390px Account/ProfileMenu states for overflow, clipping, and focus visibility.
