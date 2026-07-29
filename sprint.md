# sprint.md - Iruka GIWA Review Sprint

This file defines the current one-week delivery priority. It is a plan, not
proof that a feature, partnership, metric, or contract is live.

## Rule Order

When instructions conflict, follow this order:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `design.md`
4. Relevant pages in `docs/gitbook/`
5. This sprint

In particular, sound remains muted by default, IP rules still apply, and no
onchain or custody claim may be shown without evidence.

## Sprint Goal

Make the GIWA review path credible and complete:

1. Open one pack and understand the reveal.
2. Verify the resulting GIWA transaction.
3. Inspect published odds and value ranges.
4. Understand vault, verification, and redemption status.
5. Confirm the product model and technical state in Docs.

The target review path should take about 30 seconds and contain no dead ends.

## Priority Order

### P0. Onchain Evidence

- Link a pack or card to `https://sepolia-explorer.giwa.io` only when a real
  transaction hash exists.
- Publish deployed testnet contract addresses only after deployment and source
  verification.
- Label GIWA Sepolia clearly. Do not imply mainnet availability.
- Read counters such as opened packs or minted cards from a contract or indexed
  API. Hide unavailable or zero-value promotional counters.
- Keep personal data and full custody records offchain.
- Never fabricate a receipt, block number, contract address, mint count, or
  explorer URL for preview content.

### P0. Pack Reveal

Treat reveal as part of Vending, not a separate game.

Use this state machine:

```text
sealed -> unpacking -> summary
```

- `sealed`: show one centered pack and require a left-to-right drag to release
  it.
- `unpacking`: keep a single pack and one card surface mounted in one bright
  DOM scene. GSAP settles the pack, opens its top seal, extracts the card, and
  holds it for Showcase without video.
- `summary`: replace the reveal scene with card details and a real Explorer
  receipt when one exists. Card interaction starts only in this state.

- Track drag progress from `0` to `1`. Complete once at `72%` or above.
- A released drag below `72%` returns to the start in `220ms`.
- Pointer movement writes CSS variables through `requestAnimationFrame` and
  does not trigger React renders.
- Enter and Space perform the same open action.
- Do not make the whole overlay tappable. Use an explicit Skip control.
- Keep one Unpacking DOM scene mounted until Summary replaces it. The pack and
  card use no rotation or flip.

#### Reveal Timing

All rarities use the same 9.0-second GSAP sequence:

| Step | Timeline | Behavior |
| --- | ---: | --- |
| Release | 0.0-0.6s | The drag control clears |
| Pack motion | 0.6-2.0s | The centered pack settles into its opening position |
| Opening | 2.0-3.8s | The pack mouth opens and its top seal clears with no rotation |
| Extracting | 3.5-6.8s | One card surface rises while remaining inside the viewport |
| Rarity | 5.6s | The actual rarity appears |
| Name | 6.2s | The actual inventory name appears |
| Showcase | 8.7-9.0s | One bright wash replaces the extracted card with Summary |

Edition appears only in Summary. Serial appears only in Summary. Rarity changes
the real card treatment but not the timing. An explicit Skip cancels the active
GSAP timeline and moves from any active scene to Summary.

- Do not invent year, grade, serial, or value clues.
- Remove particles, radial rings, rays, and full-screen tap skip.
- Keep only a restrained rarity glow and foil on the card.
- Keep the white and ice-blue frame through the full sequence.
- Reduced-motion reaches a static front card, then Summary, in
  `300ms`.

#### Visual Asset Contract

- Normalize the selected transparent Iruka pack inside a fixed pack frame.
- Keep the pack and card upright with no rotation or flip.
- Show the actual pulled card image from extraction through Showcase.
- Use the same original image URL in extraction and Summary with
  `object-fit: contain`.
- The pack and pulled card remain visible together until the final wash.
- Do not request or play an MP4 in the runtime reveal path.
- If pack art fails, show the neutral Iruka pack fallback and continue.
- If card art fails, the reveal boundary must still provide a way to continue.
- Do not include text, watermarks, third-party logos, real artists, or hands in
  new Iruka-owned assets.

Sound must be generic, licensed for use, visibly toggleable, and muted by
default. Reduced-motion users receive the short static-card path without
flashing or forced 3D motion.

### P0. Odds And Randomness

- Display price, rarity odds, value ranges, redemption eligibility, and the
  snapshot time before purchase.
- Use one structured data source for Vending, the odds page, and Docs.
- Published odds must total 100% and match the active batch.
- Do not claim VRF or verifiable randomness unless the deployed implementation
  proves it.
- Explain the current assignment mechanism honestly, including what is still
  client-side or planned.
- Do not publish expected profit, guaranteed return, or buyback language.

### P0. Vault And RWA Trust

- Explain intake, authentication, storage, ownership, listing, and shipping as
  a concise process.
- Show `Vaulted` only when custody, verification, ownership, and redemption
  records agree.
- Delist a card before accepting a shipping request.
- Mark unverified preview inventory as preview inventory, not vaulted stock.
- If a partner, grading company, storage provider, or insurance policy is not
  contracted, state that it is planned or omit the claim.
- Use third-party artist or group names only as narrow identifiers for genuine
  physical inventory.

### P1. Docs

Keep Mintlify as the Docs surface. Do not build a second documentation app this
sprint.

Required structure:

1. Overview and product loop
2. Packs, tiers, odds, value ranges, and batch snapshots
3. Vault, verification, custody, and shipping
4. Marketplace and fee model
5. GIWA Sepolia integration, contract addresses, and verification steps
6. FAQ
7. Roadmap and current limitations

Use short Korean copy with an English equivalent. Do not duplicate different
numbers between the app and Docs. Fees that are not approved remain clearly
marked as planned rather than live.

## Seven-Day Execution

| Day | Deliverable |
| --- | --- |
| D1 | Finalize transparent pack and inventory-card asset contracts |
| D2 | Build the DOM foil card and rarity presets |
| D3 | Connect the GSAP unpacking sequence, explicit Skip, and CSS fallback |
| D4 | Add muted audio controls, quick opening, mobile polish, and performance checks |
| D5 | Finish odds, vault trust flow, and real explorer receipt links |
| D6 | Align Mintlify Docs with live app and contract data |
| D7 | Rehearse the 30-second path, fix defects, record desktop and mobile evidence |

## Agent Execution Rules

- Read `design.md` and the relevant `docs/gitbook/` page before each surface.
- Work on one deliverable at a time and keep existing Marketplace and Vault
  behavior intact.
- Write a failing test before changing behavior.
- Do not add a dependency until existing packages and platform APIs are ruled
  out.
- Do not create fake assets, transactions, inventory, metrics, partners, or
  custody evidence to make the review look complete.
- If a required image, sound, contract, or API is missing, implement the typed
  interface and fallback, then report the missing input.
- Use English for the judging surface and verify the Korean equivalent.
- Run focused checks during development. Run the build only at release time, as
  required by `CLAUDE.md`.
- Do not mark a task complete without a reproducible test, screenshot, receipt,
  or published Docs page appropriate to that task.

## Definition Of Done

- The review path works on desktop and mobile without overlap or horizontal
  scrolling.
- Every shown explorer link resolves to the displayed GIWA Sepolia transaction
  or verified contract.
- Odds shown in Vending and Docs match the active batch data.
- Reveal has skip, muted sound control, reduced-motion behavior, and an asset
  failure fallback.
- A completed pull reaches summary and preserves Vault, Sell, and Ship actions.
- Vault and redemption wording matches the available custody evidence.
- Korean and English labels fit their controls.
- Docs disclose contract addresses, verification steps, fees, limitations, and
  roadmap without unsupported claims.

## Not This Sprint

- GIWA mainnet support
- Faucet or scanner development
- Improvements to a real-time Three.js pack simulation
- User consignment intake
- Unverified grading, storage, insurance, or IP partnership claims
- Buyback or investment-return promises
