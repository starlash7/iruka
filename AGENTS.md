# AGENTS.md - Iruka Working Rules

These instructions apply to the whole repository. Keep `CLAUDE.md`, `design.md`,
and `docs/gitbook/` as the source rules for future agent work.

## Required Context

- Use `karpathy-guidelines` as the base working style: small scoped changes,
  clear assumptions, and verification tied to the changed surface.
- Read `design.md` before UI or UX changes.
- Read the relevant `docs/gitbook/` page before changing product behavior,
  copy, packs, odds, reveal, vault, marketplace, shipping, or policy surfaces.
- Do not use Ponytail mode or Ponytail skills unless the user explicitly asks.

## Editing Rules

- Do not add unnecessary copy or duplicate messaging.
- Do not rewrite existing visible copy unless the request is about copy.
- Do not edit files outside the requested scope.
- Do not delete existing features.
- Before adding a dependency, check whether existing packages or platform APIs
  are enough.
- Prefer the smallest code that solves the request.
- Keep one clear role per file.
- When touching a file that has grown beyond 200 lines, split only if the split
  directly helps the requested change.
- Do not create catch-all `utils` files.
- Use clear verb+noun function names, such as `getStationList` or
  `calculateReward`.

## Verification

- During normal edits, run the smallest useful verification for the changed
  surface.
- Run `npm run build` before release-oriented changes or AI-generated file
  generation.
- For visual work, check desktop and mobile layouts for text overflow,
  incoherent overlap, and broken interactive states.

## Product Rules

- Iruka connects collectible pack discovery, verified storage, marketplace
  trading, and physical redemption.
- The core flow is: choose pack, pull/open, reveal, vault, sell/list, or ship.
- The first screen should be a product flow, not a marketing page.
- The user should understand the core loop within 3 seconds.
- Use English UI for the MVP judging surface unless the user asks otherwise.
- Public packs must show price, remaining supply, rarity tiers, odds, estimated
  value ranges, and redemption eligibility.
- Production pack logic, odds, result assignment, inventory eligibility, and
  custody records should be auditable.
- Only show an item as vaulted when records prove custody, verification, and
  redemption eligibility.
- Items listed for sale should be delisted before shipment can be requested.

## Design Rules

- Direction: Clean Blue Fintech Collectibles.
- The app should feel fast, calm, liquid, and trustworthy.
- No dark luxury mode, mock dashboard feel, or sharp fintech-table UI.
- Use the palette, spacing, shape, and typography in `design.md`.
- Use soft white/blue depth, 22px large surfaces, 18px controls, and full-pill
  primary buttons or chips.
- Shadows should be blue-tinted and soft, never black-heavy.
- Keep app labels short, such as `Open pack`, `Vault`, `Sell now`, and `Ship`.
- Do not add instructional or explanatory UI copy unless asked.
- Avoid `demo`, `mock`, and investor-style wording in visible UI.
- Hide empty zero stats.
- Pack selection should feel tappable, and the open flow should add a revealed
  card and vault row.

## IP And Policy Rules

- Do not imply official affiliation with artists, agencies, labels, publishers,
  manufacturers, grading companies, or other third parties unless it exists.
- Keep public pack branding neutral unless rights, licenses, or partnership
  approval exist.
- Marketplace listings and vault details may use third-party names only as
  narrow identifiers for genuine physical items.
- Do not render or generate unlicensed third-party faces, person silhouettes,
  logos, brand marks, official images, commercial card artwork, or real songs.
- Use original Iruka pack art, neutral mockups, or photos of actual inventory.

## Reveal Rules

- Treat pack reveal as part of the vending flow, not a separate game.
- Use 3D only for the reveal moment; keep purchase, result, vault, and
  marketplace UI as regular DOM.
- Sound must be generic, visibly toggleable, and muted by default.
- Reduced-motion users and WebGL failures must receive a CSS fallback.
- Add the 3D reveal dependencies from `docs/gitbook/packs/pack-reveal.md` only
  when reveal implementation actually starts.
- Keep reveal timing rarity-aware: Common around 1.5s, Rare/Epic around 3.0s,
  and Legendary/Iruka around 4.5s.
- Tap skip should work from every reveal timeline point.
