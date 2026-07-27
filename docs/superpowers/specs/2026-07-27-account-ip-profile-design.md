# Account IP Profile Design

## Goal

Rebuild Account as an Iruka collector profile using the information hierarchy
of the supplied Phygitals reference while keeping Iruka's own light visual
system and only real session data.

## Product Direction

Account should lead with collector identity and owned IP, not wallet
infrastructure. Wallet access remains available as a supporting utility
inside the collection summary because GIWA balance, address copying, Deposit,
and sign out are existing product functions.

The Phygitals reference is used for layout hierarchy only. Iruka does not copy
its branding, dark palette, progress system, rank, achievements, offers, or
lending surfaces.

## Layout

### Profile Hero

- Use `roadmap-iruka-universe.jpg` as the full-width Iruka cover.
- Keep the hero bright enough to read as Iruka while adding a restrained
  right-side blue overlay for text contrast.
- Place only the circular Iruka avatar and authenticated identity at the lower
  right.
- Place `Overview` and `Inventory` anchor controls at the lower left.
- Keep Sign out out of the hero so profile identity remains visually clean.
- Keep a screen-reader Account heading without rendering a second large title.

### Overview

- Place exactly three equal summary sections directly below the hero:
  `Inventory FMV`, `Cards collected`, and `Wallet`.
- Do not render separate Listed or Shipping KPI sections.
- Do not add user volume, rank, points, membership, achievements, or progress.

### Wallet Details

- Place balance, refresh, shortened address, Deposit, and Sign out inside the
  rightmost Wallet summary section.
- Keep Wallet visually equal to the Inventory FMV and Cards collected sections.
- Deposit remains the only primary wallet action.
- Sign out remains a quiet secondary action.
- Preserve loading, error, Retry, address copy, Deposit dialog, and focus
  refresh behavior.

### Inventory

- Inventory remains visible on the initial Account page.
- The Inventory anchor scrolls to the existing gallery; it does not hide
  content behind a second click.
- Keep the current responsive six, four, and two-column card grid.

## Components

- `AccountProfileHero.tsx` owns the cover, profile, and navigation.
- `AccountWalletPanel.tsx` owns address, balance, Deposit, and sign out.
- `AccountPage.tsx` composes Profile Hero, AccountStats, Wallet Details,
  Inventory, and the existing Deposit dialog.
- Existing `AccountView.tsx` data loading and session behavior do not change.

## Visual System

- White page background, ice-blue surfaces, and Iruka holographic accents.
- Hero radius: 22px. Controls: full pill. KPI surfaces: 18px.
- Profile text is white over the image; content text uses existing ink and
  muted colors.
- Shadows stay soft and blue-tinted.
- Use weights from 550 to 700; no oversized dashboard typography.
- No nested cards, decorative orbs, fake metrics, or instructional copy.

## Responsive Behavior

- At 760px and below, hero profile and anchor controls stack without covering
  the central characters.
- The hero keeps a stable minimum height and crops from center.
- The three summary sections stack in reading order: Inventory FMV, Cards
  collected, Wallet.
- Wallet actions wrap without creating horizontal scroll.
- All controls remain at least 44px tall and no horizontal scroll is
  introduced.

## Verification

- Account markup contains the IP hero, right-aligned profile, anchor
  navigation, three-section summary, and visible Inventory.
- No unsupported Phygitals surfaces or fake metrics are rendered.
- Existing balance, Deposit, address copy, sign out, and inventory summary
  tests remain valid.
- Desktop and mobile CSS contracts, TypeScript, and all tests pass.
