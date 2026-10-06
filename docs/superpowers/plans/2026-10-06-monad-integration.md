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
- [ ] Add CI using `.nvmrc`, required Node tests/build and pinned Foundry.
- [ ] Add PR evidence, Feature Map, decisions and focused manual eval cases.
- [ ] Verify workflow structure and rule preservation; record actual results.

## Task 2: Independent Implementation

- [x] Create frontend and backend Conductor workspaces through CUA.
- [x] Send approved design, exact ownership and completion evidence requirements.
- [ ] Review frontend commit, focused test results and both deployment builds.
- [ ] Review backend commit, isolation tests and deployment prerequisites.
- [ ] Integrate reviewed commits into this branch; resolve any conflicts locally.

## Task 3: Shared Configuration

- [ ] Add public Monad selector/address/RPC placeholders and server-only secrets
  to `.env.example`, with an empty contract address until deployment exists.
- [ ] Add Monad API manifest packaging and cron to `vercel.json`; preserve GIWA.
- [ ] Permit only the necessary Monad RPC source in CSP.
- [ ] Adjust cron tests to assert each chain's recovery schedule separately.
- [ ] Add honest Monad technical status and internal submission checklist.

## Task 4: Integration Evidence

- [ ] Run `npm test`, `npm run test:contracts`, GIWA and Monad builds.
- [ ] Review desktop/mobile Vending and account states through CUA.
- [ ] Record screenshots and limitations under `.context/`.
- [ ] Check live prerequisites without printing private keys.
- [ ] Only after actual deployment, publish address and real receipts.
- [ ] Report remaining user-owned inputs explicitly if runtime validation cannot run.
