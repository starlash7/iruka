# Iruka Feature Map

Iruka connects pack discovery, committed testnet pulls and Reveal with a
collection interface and planned physical collectible operations.

## Structure

- `src/`: React product, Privy wallets, EVM reads/transfers, pending requests,
  local collections, Vending, Reveal, Vault and Marketplace interfaces.
- `api/giwa/` and `server/giwa/`: GIWA Keeper trigger, scheduled recovery,
  encrypted manifest loading and atomic fulfillment leases.
- `api/monad/`, `server/monad/`, `scripts/monad/`: assigned to the independent
  Monad backend workstream; implementation and deployment require verification.
- `scripts/giwa/`: prepare, encrypt, commit and fulfill test batches.
- `contracts/`: chain-neutral `IrukaPackBatch`, deployment script and Foundry tests.
- `tests/`: Node tests for product wiring, runtime behavior and server operations.
- `docs/gitbook/`: authoritative product status, custody, policy and network docs.
- `docs/superpowers/`: approved scopes and task checklists.
- `.github/`: CI and PR evidence format.
- `decisions/`: material choices with evidence; `evals/`: manual agent-rule checks.
- `.context/`: gitignored logs, screenshots and private coordination artifacts.

## Core Flow

1. Privy authenticates the user and provisions a separate embedded EVM wallet.
2. Vending reads the configured batch and requests one committed position.
3. Keeper fulfills it; the browser verifies the contract result before Reveal.
4. A pulled card enters the account collection. This does not establish custody.
5. Commercial ownership, USDC settlement and physical redemption remain planned.

## Files And Ownership

- `src/App.tsx`: product state and Pull/resume/Reveal orchestration.
- `src/app-main.tsx`: Privy configuration and application entry.
- `src/giwaPull.ts`, `src/giwaFulfillment.ts`: request and proof-confirmation flow.
- `src/giwaPendingPull.ts`, `src/cardCollectionStorage.ts`: persisted account state.
- `server/giwa/fulfillRequest.mjs`: dependency-injected Keeper logic reusable by adapters.
- `server/giwa/recoverPendingPull.mjs`: single-batch request-order recovery.
- `vercel.json`: API packaging, cron and CSP; integration owner only.
- `.env.example`, `.nvmrc`, `package.json`, lockfile: integration owner only.

Frontend owns `src/` and its focused tests. Backend owns Monad APIs, server
adapters, scripts and its focused tests. Coordinator owns shared configuration,
rules, submission documents and integration. Freeze API, batch label, inventory
ordering and environment names before dependent work starts.

## Verification

```sh
nvm use
npm ci
npm test
npm run test:contracts
npm run build
```

Normal edits use focused tests; release verification also checks both deployment
builds and desktop/mobile layouts. CI success is not proof of a live deployment.
Never commit private manifests, credentials, `dist/`, or generated contract output.
