# Iruka

Interactive MVP demo for redeemable collectible card packs on GIWA.

- Website: `https://playiruka.space`
- Docs: `https://docs.playiruka.space`

Design direction and UI rules live in [design.md](./design.md).
Mintlify documentation lives in [docs/gitbook](./docs/gitbook).

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`

## Documentation

Mintlify uses `docs/gitbook` as the monorepo documentation path. Use Node.js 20.18.2 and install the Mintlify CLI once before previewing the docs.

- `nvm use`
- `npm install --global mint@latest`
- `cd docs/gitbook`
- `mint dev`
- `mint broken-links`

## Wallet login

Copy `.env.example` to `.env.local` and set `VITE_PRIVY_APP_ID` from the Privy dashboard. `VITE_PRIVY_CLIENT_ID` is optional.

## GIWA testnet

The GIWA vertical slice uses `IrukaPackBatch`: a committed inventory root, test-ETH pull request, client-seed reveal, and without-replacement fulfillment receipt. Run the contract tests with `forge test`.

Deployment and batch-operation commands are documented in [GIWA Testnet Evidence](./docs/gitbook/technical/giwa-testnet.mdx). Keep `GIWA_DEPLOYER_PRIVATE_KEY` and `GIWA_SERVER_SEED` only in local deployment environment variables. Never expose either through a `VITE_` variable.
