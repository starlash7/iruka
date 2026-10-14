# Monad Metropolis Design

Approved by the user on October 6, 2026. The user also authorized CUA operation
of Conductor and independent frontend/backend workspaces.

## Scope

Add a Monad Testnet deployment of the existing pack-opening product. Preserve
GIWA as the default and retain existing features, policy and design. Select the
deployment at build time with `VITE_IRUKA_DEPLOYMENT=giwa|monad`; reject unknown
values. No runtime chain switcher, reveal redesign or new dependency is needed.

Monad Testnet: chain ID 10143, native MON, default RPC
`https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadvision.com`.
Verify official network and tooling docs before deployment.

## Interface

- Frontend consumes only `VITE_MONAD_PACK_BATCH_ADDRESS` and optional
  `VITE_MONAD_RPC_URL` for a Monad build; never inherit GIWA's contract address.
- Backend uses independent `MONAD_*` configuration and encrypted manifest.
- `POST /api/monad/fulfill`: `{ requestId: string }`, positive decimal integer.
  Preserve the GIWA API's pending/submitted/fulfilled semantics and error status.
- HTTP success is not fulfillment proof. Confirm `getPull`, matching
  `PullFulfilled`, collector, batch and inventory commitment before Reveal.
- `GET /api/monad/recover` requires cron authorization and processes at most one
  request per run. Trigger and cron share an atomic request lease.
- Lease identity includes chain 10143, contract and request ID.

## Initial Batch

Use a fresh chain-neutral `IrukaPackBatch`, one committed batch only, label
`IRK-MON-2026-001`, pack `debut`, 100 test positions, price
`10000000000000` wei (0.00001 test MON). Inventory identifiers and ordering match
the existing Debut mapping. Generate independent seeds and commitments.
Preview identities do not establish physical inventory or redemption rights.

## Acceptance

- Login and embedded wallet work on the selected network.
- MON balance and native transfers use Monad RPC, signer and Explorer.
- Valid request and fulfillment lead to the matching revealed card.
- Pending requests resume without another purchase; mismatched deployments
  cannot resume. GIWA keys and historical records stay intact.
- Persist real request and fulfillment provenance with new collection records.
- Missing Monad deployment disables Pull rather than assigning a local result.
- Existing reveal skip, reduced-motion and fallback behavior is retained.
- Focused tests, both builds, contract tests and desktop/mobile checks pass.
- Live completion additionally requires verified contract and batch receipts,
  funded Keeper, installed secrets, working cron and one real browser Pull.

USDC, ERC-721, commercial settlement, physical custody and shipping are outside
this adaptation. Never label planned capabilities live.

## Workstreams

- Kathmandu: rules, Feature Map, CI, shared configuration, integration, Docs.
- Yaounde: frontend and related tests; own scoped plan.
- Yokohama: new Monad backend/scripts and related tests; own scoped plan.

Shared files are integrated by Kathmandu only. Agents commit locally; no push,
PR, merge into main, or deployment is implied by this implementation phase.
