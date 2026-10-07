# Monad Docs execution checklist

- [x] Read FEATURE_MAP, sprint, original Docs and deployment evidence.
- [x] Use isolated workspace and docs task branch; root owns the file set.
- [x] docs.json: shared-testnet description, preserve public navigation.
- [x] overview.mdx: both live networks, Monad evidence/links and dated counts.
- [x] project/how-it-works.mdx: selected-network wallet/Pull/transfer flow.
- [x] faq.mdx: supported networks, same-chain funding and receipt verification.
- [x] packs/pack-information.mdx: separate Debut batch parameters and commitments.
- [x] packs/pack-reveal.mdx: both-network receipt boundary and fail-closed Monad.
- [x] technical/onchain-architecture.mdx: contracts, wallet roles, isolated recovery.
- [x] technical/monad-testnet.mdx: 377 tests, verification/withdrawal section order.
- [x] roadmap.mdx and product/marketplace.mdx: accurate shared testnet boundaries.
- [x] Record publication decision in decisions; validate MDX and links.
- [x] Commit/push documentation, confirm publication result without CUA.

## Observed verification

- `npm run build`: passed before generation.
- `npx mint validate`: passed.
- `npx mint broken-links`: no broken links found.
- `git diff --check`: passed.
- [Docs-only publication PR #1](https://github.com/starlash7/iruka/pull/1): merged to main at `b3c978e30ab8ed08f22cc051ea9f196a0d7f3da7`; Mintlify Deployment completed successfully.
- Anonymous HTTP follow-redirect checks returned 200 with updated Monad content on Overview, How It Works, FAQ, Packs and Odds, Pack Reveal, Onchain Architecture, Monad Testnet, Roadmap and Marketplace. Overview was refetched after propagation.
- Monad Testnet response includes the exact deployed contract address and 377-test report. HTTP checks verify published content, not desktop/mobile rendering; no CUA was used.
