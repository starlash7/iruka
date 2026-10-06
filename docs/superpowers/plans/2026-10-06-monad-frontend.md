# Monad frontend integration

Approved design: build-time giwa|monad selection (default GIWA, reject unknown), no runtime switcher or redesign, no dependencies. Work only in yaounde on the existing branch. Coordinator owns shared configuration/docs; backend owns API/server/scripts.

1. Establish baseline: read repository rules/product docs, npm ci, npm run build. Verify Monad Testnet network values against official docs.
2. Add failing focused tests for deployment selection, address isolation/DEV handling, active chain routing, storage namespaces/pending contract+batch rejection, exact debut inventory order, and persisted receipt evidence.
3. Add src/activeDeployment.ts: descriptor owns active chain/RPC/address/batch/API/faucet/storage names. Keep GIWA chain and compatibility function names. Route Privy, EVM pulls, fulfillment, native balance/transfers through descriptor. Reject Monad fixture pulls even in DEV and fail closed on missing address.
4. Isolate pending pulls/transfers/collections by deployment and chain while retaining existing GIWA storage keys. Validate pending contract/batch before resume.
5. Persist serializable request and fulfillment provenance with cards, restore it through collection storage, keep legacy records readable. Keep Pulled and redemption disabled. Change only network/currency/faucet labels and receipt links; preserve reveal, Vault, Marketplace behavior.
6. Run focused frontend regression tests, default GIWA and Monad builds, unknown-selection rejection. Inspect desktop/mobile testnet labels and disabled Pull with missing Monad config. Review diff, commit scoped files locally, write .context/monad-frontend-report.md including commands/results/risks/hash and coordinator handoff. Do not push, PR, deploy, merge, or rename.

Network reference: https://docs.monad.xyz/developer-essentials/testnet (10143, MON, https://testnet-rpc.monad.xyz, https://testnet.monadvision.com, https://faucet.monad.xyz).

## File boundaries and interfaces

- `src/activeDeployment.ts`: `getDeployment(env)` and `activeDeployment` descriptor, `getDeploymentStorageKey(surface, wallet)` preserves GIWA namespaces; active chain alias allows compatibility EVM modules to keep exports.
- `src/giwaPull.ts`, `src/giwaFulfillment.ts`, `src/giwaBalance.ts`, `src/giwaTransfer.ts`, `src/app-main.tsx`: consume chain/address/API from descriptor. `getGiwaPackBatchAddress(value?, isDevelopment?)` retains GIWA DEV fixtures, never bypasses Monad. Receipt includes optional collector for old-record compatibility.
- `src/giwaPendingPull.ts`, `src/giwaPendingTransfer.ts`, `src/cardCollectionStorage.ts`: descriptor key routing and pending deployment checks. Pending storage retains decimal strings for bigint IDs.
- `src/giwaInventory.ts`, `src/vendingTypes.ts`, `src/cardFlow.tsx`: `createGiwaVendingPull(packId, fulfillment, receipt?)` attaches serialized provenance when receipt exists; `CardPull.onchainReceipt` remains optional for legacy cards.
- `src/vendingData.ts`: debut batch label only changes under Monad; inventory generation unchanged. `pullPack` rejects Monad fixture invocation.
- `src/App.tsx`, `src/appCopy.ts`, existing account funding components and `src/VendingPackDetail.tsx`: fail closed before fixture branch and use active network/token/faucet labels. No CSS redesign.
- `tests/monad-frontend.test.mjs` and focused existing frontend tests: runtime SSR checks for descriptor, namespaces, receipt persistence, routing and GIWA compatibility.

## Execution checklist

- [x] Baseline `npm ci && npm run build` succeeds.
- [x] RED: `node --experimental-strip-types --test tests/monad-frontend.test.mjs` demonstrates missing descriptor, Monad routing, and provenance behavior.
- [x] GREEN: implement descriptor and route existing callers; rerun focused tests until zero failures.
- [x] Verify `VITE_IRUKA_DEPLOYMENT=giwa npm run build` and `VITE_IRUKA_DEPLOYMENT=monad npm run build`; verify invalid deployment fails.
- [x] Review scoped diff and desktop/mobile output; commit locally and write handoff report.


## Integration review corrections

- Persist the completed collection synchronously before pending recovery cleanup.
- Reopen an owned collected card directly in the existing Summary using its saved real fulfillment receipt. Validate collector, active deployment, and chain; legacy cards have no fabricated links.
- Scan Monad fulfillment events in inclusive windows of at most 100 blocks, from the request block onward, stopping at the first canonical matching event. GIWA retains its single query through latest. Local RPC regression reproduced error -32614 before the fix and verifies aged recovery across three windows after the fix.
- Coordinator covers invalid-selection build rejection in their vite.config.ts changes; frontend runtime descriptor also rejects unknown values. Shared configuration remains outside this commit.
