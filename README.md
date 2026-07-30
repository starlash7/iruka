# Iruka

Iruka connects fandom collectible pack discovery, onchain pull receipts,
verified storage, secondary trading, and physical redemption. The first
category is K-pop photocards, with the same product rails designed to support
other officially issued fandom and sports collectibles.

- Product: [playiruka.space](https://playiruka.space)
- Documentation: [docs.playiruka.space](https://docs.playiruka.space/overview)
- GIWA Sepolia contract:
  [`0xbB3c...4334`](https://sepolia-explorer.giwa.io/address/0xbb3c833df538d1cfce7457952be102b5be154334)

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
  |-- viem GIWA Sepolia client
  |-- IrukaPackBatch request and receipt reads
  |
Vercel API
  |-- authenticated Keeper fulfillment
  |-- scheduled pending-request recovery
  |
Mintlify
  `-- product, custody, policy, and contract documentation
```

`IrukaPackBatch` commits supply, inventory and odds roots before pulls begin,
reserves one position per request, and verifies the configured Keeper's
committed server-seed proof before assignment. Contract behavior, deployment
transactions, and current limitations are documented in
[GIWA Contracts](./docs/gitbook/technical/giwa-testnet.mdx).

## Local Setup

Requirements:

- Node.js `20.18.2` from [.nvmrc](./.nvmrc)
- npm
- Foundry for Solidity tests and contract operations

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_PRIVY_APP_ID` in `.env.local`. `VITE_PRIVY_CLIENT_ID` is optional.
The checked-in `.env.example` contains the public GIWA configuration and empty
placeholders for server-only values.

## Verification

```bash
npm test
npm run test:contracts
npm run build
```

The browser tests cover authentication wiring, Vending data, GIWA request and
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
