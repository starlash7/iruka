[![Iruka — collectible packs from a blue vending machine](./public/brand/iruka-x-banner-vending-rush.png)](https://playiruka.space)

# Iruka

Iruka connects fandom collectible pack discovery, onchain pull receipts,
verified storage, secondary trading, and physical redemption. The first
category is K-pop photocards, with the same product rails designed to support
other officially issued fandom and sports collectibles.

- Product: [playiruka.space](https://playiruka.space)
- Documentation: [docs.playiruka.space](https://docs.playiruka.space/overview)
- Networks: [Monad Testnet](./docs/gitbook/technical/monad-testnet.mdx) ·
  [GIWA Sepolia](./docs/gitbook/technical/giwa-testnet.mdx)

## Monad Metropolis

Iruka brings its K-pop-first collectible experience to Monad: transparent pack
odds, committed inventory assignment, and verifiable onchain Pull receipts in
one Vending → Reveal → Collection flow. The Metropolis build targets
**Monad Testnet**, with **Consumer Products & Payments** as the proposed primary
track.

| Network | Current status | Evidence |
| --- | --- | --- |
| Monad Testnet · `10143` · MON | Integration implemented and locally verified; deployment and live Pull pending | [Monad technical status](./docs/gitbook/technical/monad-testnet.mdx) |
| GIWA Sepolia · `91342` · test ETH | Existing source-verified contract and documented test pulls; default build | [Contract and receipts](./docs/gitbook/technical/giwa-testnet.mdx) |

### Implemented on Monad

- Privy embedded-wallet configuration, MON balances and native transfers
- Debut batch `IRK-MON-2026-001`: 100 test positions at 0.00001 test MON
- Independent Keeper fulfillment, encrypted manifest and atomic recovery leases
- Canonical contract and event confirmation before Reveal
- Pending-request recovery with bounded RPC queries and no second purchase
- Saved request/fulfillment provenance and Explorer links after reload
- Chain-isolated pending requests, transfers and collections

Missing Monad contract configuration disables Pull, including in development.
The initial positions are test records, not evidence of physical custody or
redemption eligibility. Monad deployment needs its own contract, batch seeds,
funded Keeper and hosting configuration; GIWA receipts remain GIWA evidence.

### Run the Monad build

After the local setup below, set these public values in `.env.local`:

```dotenv
VITE_IRUKA_DEPLOYMENT=monad
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
# Set the real contract address after deployment.
VITE_MONAD_PACK_BATCH_ADDRESS=
```

Run `npm run dev` to preview or `npm run build` to build the selected deployment.
A complete Pull also requires the same-origin `/api/monad/fulfill` Keeper,
its encrypted manifest, Blob leases and scheduled recovery. Server-only
configuration is listed separately in [.env.example](./.env.example).

Deployment tooling lives in [scripts/monad](./scripts/monad), with the
[approved design](./docs/superpowers/specs/2026-10-06-monad-metropolis-design.md)
and [submission checklist](./docs/internal/metropolis-submission-2026.md)
recording the remaining release gates. No Monad address or successful live
Pull is published yet.

## Public Access

The website and product documentation opened to public access on
September 5, 2026. Select `Play Iruka` to enter the product, or open
[`#home`](https://playiruka.space/#home) or
[`#pull`](https://playiruka.space/#pull) directly. Browsing does not require
sign-in; account and wallet actions retain their authentication requirements.

All Mintlify navigation groups and the separate pack reveal reference page
are explicitly public. Website and documentation metadata allow search
indexing. The production CSP permits the required Privy and WalletConnect
connections while retaining the other browser security headers.

The release was verified on desktop and mobile for public entry, direct links,
history navigation, images, wallet options, and the email login screen. Actual
sign-in and new onchain pulls were not performed during this access check.

## Product Flow

```text
Vending -> Reveal -> Vault -> Marketplace -> Redemption
```

Collectors select a pack, review its published odds, request a pull, reveal the
assigned inventory item, and then choose to keep, list, or redeem an eligible
physical card.

## Current Scope

**Live**

- React and Vite product interface with English and Korean locales
- Privy sign-in and per-user embedded wallets
- Debut pack selection, odds review, pull, reveal, and account inventory
- Source-verified `IrukaPackBatch` contract on GIWA Sepolia
- Request and Keeper fulfillment receipts linked to GIWA Explorer
- Marketplace, Vault, funding, and withdrawal product interfaces

**In validation**

- Monad Testnet deployment and live end-to-end Pull verification
- Physical inventory sourcing, intake, verification, custody, and grading
- Market-value methodology and shipping operations

**Planned**

- Canonical USDC settlement and marketplace contracts
- One-to-one ERC-721 ownership for eligible vaulted inventory
- Commercial packs, redemption operations, and licensed IP drops

The public demo is a testnet product implementation. It does not claim that
commercial payment, physical custody, shipping, or third-party partnerships
are live. The detailed status and operating boundaries are maintained in the
[product documentation](./docs/gitbook/overview.mdx).

## Architecture

```text
React + Vite
  |-- Privy authentication and embedded wallet
  |-- build-time Monad Testnet or GIWA Sepolia viem client
  |-- IrukaPackBatch request and receipt reads
  |
Vercel API
  |-- independent Monad and GIWA Keeper fulfillment
  |-- chain-scoped leases and scheduled pending-request recovery
  |
Mintlify
  `-- product, custody, policy, and contract documentation
```

`IrukaPackBatch` commits supply, inventory and odds roots before pulls begin,
reserves one position per request, and verifies the configured Keeper's
committed server-seed proof before assignment. Contract behavior, deployment
transactions, and current limitations are documented in
[Monad Testnet](./docs/gitbook/technical/monad-testnet.mdx) and
[GIWA Contracts](./docs/gitbook/technical/giwa-testnet.mdx).

## Local Setup

Requirements:

- Node.js `24.14.0` from [.nvmrc](./.nvmrc)
- npm
- Foundry for Solidity tests and contract operations

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_PRIVY_APP_ID` in `.env.local`. `VITE_PRIVY_CLIENT_ID` is optional.
The checked-in `.env.example` defaults to GIWA and includes separate Monad
configuration and empty placeholders for server-only values. Set the deployment
selector to `monad` to use the Monad configuration above.

## Verification

```bash
npm test
npm run test:contracts
npm run build
VITE_IRUKA_DEPLOYMENT=monad npm run build
```

The browser tests cover authentication wiring, Vending data, Monad and GIWA request and
recovery behavior, reveal state, account inventory, Marketplace, locale
persistence, and responsive layout. Foundry tests cover contract permissions,
commitments, request fulfillment, and concurrent pull behavior.

## Documentation

Mintlify source lives in [docs/gitbook](./docs/gitbook). Preview it with:

```bash
npm install --global mint@latest
cd docs/gitbook
mint dev
mint broken-links
```

## Repository Rules

- [AGENTS.md](./AGENTS.md) contains repository-wide product and engineering
  constraints.
- [CLAUDE.md](./CLAUDE.md) defines editing and verification rules.
- [design.md](./design.md) defines the product design system.
- [sprint.md](./sprint.md) defines the current GIWA review scope.

## Security

Never commit deployer keys, Keeper keys, manifest keys, Privy secrets, or
Vercel environment exports. `.env.local`, `.context/`, and `.vercel/` are
ignored. Server secrets must never use a `VITE_` prefix because Vite exposes
those variables to the browser bundle.
