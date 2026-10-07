# Monad Integration Implementation Plan

> **For agentic workers:** Use the assigned Conductor workstream plans and
> verification-before-completion. User approved parallel execution.

**Goal:** Integrate a truthful, independently configured Monad testnet product.

**Architecture:** Frontend selects one build deployment; independent Monad
Keeper routes reuse chain-neutral logic. Kathmandu owns shared configuration.

**Tech Stack:** React, TypeScript, Privy, viem, Vercel, Node 24.14.0, Foundry.

## Global Constraints

Preserve GIWA defaults, policies and keys. No dependencies, runtime network
switcher or reveal redesign. Follow the approved design's API, batch and chain
values. Never invent deployment evidence. Do not rename the current branch.

## Task 1: Baseline And Rules

- [x] Read every text file in the user's ZIP and adapt the existing-repo rules.
- [x] Run `npm ci`, `npm test`, `forge test`, `npm run build` before generation.
- [x] Record baseline: 276 Node tests, 13 contract tests, build exit 0.
- [x] Add CI using `.nvmrc`, required Node tests/build and pinned Foundry.
- [x] Add PR evidence, Feature Map, decisions and focused manual eval cases.
- [x] Verify workflow structure and rule preservation; record actual results.

## Task 2: Independent Implementation

- [x] Create frontend and backend Conductor workspaces through CUA.
- [x] Send approved design, exact ownership and completion evidence requirements.
- [x] Review frontend commit, focused test results and both deployment builds.
- [x] Review backend commit, isolation tests and deployment prerequisites.
- [x] Integrate reviewed commits into this branch; resolve any conflicts locally.

## Task 3: Shared Configuration

- [x] Add public Monad selector/address/RPC placeholders and server-only secrets
  to `.env.example`, with an empty contract address until deployment exists.
- [x] Add Monad API manifest packaging and cron to `vercel.json`; preserve GIWA.
- [x] Permit only the necessary Monad RPC source in CSP.
- [x] Adjust cron tests to assert each chain's recovery schedule separately.
- [x] Add honest Monad technical status and internal submission checklist.

## Task 4: Integration Evidence

- [x] Run `npm test`, `npm run test:contracts`, GIWA and Monad builds.
- [x] Review desktop/mobile Vending and account states through CUA.
- [x] Record screenshots and limitations under `.context/`.
- [x] Check live prerequisites without printing private keys.
- [ ] Only after actual deployment, publish address and real receipts.
- [x] Report remaining user-owned inputs explicitly if runtime validation cannot run.

## Final Integration Evidence

- Frontend `f127b3d` integrated as `51eef92`; backend `fd598ec` as `4340cfd`.
- `npm test`: 317 passed, zero failures (`.context/final-tests.log`).
- `npm run test:contracts`: 13 passed; official verified Forge 1.8.0
  `forge test --network monad`: 13 passed.
- GIWA and Monad `npm run build`: exit 0 (6.27s / 5.67s).
- Independent review found the public Monad RPC's 100-block log limit; bounded
  scans and aged-pending regression resolve it. No outstanding review findings.
- CUA desktop and 390x844 checks verified labels, odds and disabled Pull without
  a configured address; screenshots under `.context/`. Authenticated/live flows
  remain unverified. RPC fixtures are test evidence, not chain receipts.
- Only `.env.example` is present in this workspace. Live deployment needs
  funded dedicated deployer/Keeper wallets, Privy configuration, server secrets,
  Blob storage, HTTPS origin and hosting; no secrets were read or transactions sent.
- No push, PR, main merge, branch rename or hackathon final submission performed.

The remaining unchecked deployment step is intentionally a live release gate.
The submission checklist remains in `docs/internal/metropolis-submission-2026.md`.
