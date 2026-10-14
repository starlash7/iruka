# Iruka Pivot Cleanup Implementation Plan

**Goal:** Preserve React, Privy and Iruka branding; deliver a minimal account app.
**Architecture:** App routes → AuthActions configuration boundary → PrivyAuthActions
SDK adapter → pure AccountView. No wallet dependency in account access.
**Tech stack:** Existing React 18, Vite, TypeScript, Node test runner, Privy.

## Global constraints
Current branch only; no main push/merge, deployment, paid calls or secrets.
CURRENT_SCOPE.md overrides all imported ZIP proposals. No new product screens.
One owner (primary agent), sequential changes to shared files.

- [x] Preserve original ZIP docs; archive old root rules, docs, evidence and decisions.
- [x] Write tests/pivot-account.test.mjs for session-ready/anonymous/authenticated rendering,
  email and Google identities without wallets, loading/logout error and SDK callbacks.
  Run `node --test tests/pivot-account.test.mjs`; observe failures before implementation.
- [x] Replace src/App.tsx, AuthActions.tsx, PrivyAuthActions.tsx, AccountView.tsx,
  app-main.tsx, styles.css; add src/privyConfig.ts. Keep main/brand-kit entry and assets.
  `/` and `/account` render auth boundary, unknown path renders 404 and home link.
- [x] Remove unreachable product modules, legacy API/server/scripts/contracts and tests
  after checking recorded imports. Preserve src/giwaChain.ts as unused future config.
- [x] Remove unused direct dependencies and refresh lock; simplify Vite/Vercel/CI/env,
  retain security headers/least-privilege CI; add SPA fallback for direct navigation.
- [x] Rewrite AGENTS/CLAUDE/design/sprint/FEATURE_MAP/README/gitbook for latest scope;
  record decisions, manual eval scenarios and HANDOFF deletion/reuse inventory.
- [x] Run npm ci, npm test, npm run build, local desktop/mobile path and state checks;
  scan dangling imports, assets, prohibited runtime calls and staged secret patterns.
- [ ] Review final diff, commit related files, push this branch with hosting deployment
  disabled, create draft PR targeting main and record remaining verification limits.
