# Account IP Profile Design

## Goal

Rebuild Account as an Iruka collector profile using the information hierarchy
of the supplied Phygitals reference while keeping Iruka's own light visual
system and only real session data.

## Product Direction

Account should lead with collector identity and owned IP, not wallet
infrastructure. Wallet access remains available as a supporting utility
because GIWA balance, address copying, Deposit, and sign out are existing
product functions.

The Phygitals reference is used for layout hierarchy only. Iruka does not copy
its branding, dark palette, progress system, rank, achievements, offers, or
lending surfaces.

## Layout

### Profile Hero

- Use `roadmap-iruka-universe.jpg` as the full-width Iruka cover.
- Keep the hero bright enough to read as Iruka while adding a restrained
  right-side blue overlay for text contrast.
- Place the profile cluster at the lower right: circular Iruka avatar,
  authenticated identity, and `GIWA Sepolia` status.
- Place `Overview` and `Inventory` anchor controls at the lower left.
- Move Sign out into the profile cluster as a quiet icon-and-text action.
- Keep a screen-reader Account heading without rendering a second large title.

### Overview

- Place real collection KPI surfaces directly below the hero.
- Keep Inventory FMV and Cards collected visible.
- Show Listed and Shipping only when non-zero.
- Do not add user volume, rank, points, membership, achievements, or progress.

### Wallet Details

- Move the full wallet address, balance, refresh, and Deposit into one compact
  supporting surface below the KPI row.
- The wallet surface uses a horizontal desktop layout and a stacked mobile
  layout.
- Deposit remains the only primary wallet action.
- Preserve loading, error, Retry, address copy, Deposit dialog, and focus
  refresh behavior.

### Inventory

- Inventory remains visible on the initial Account page.
- The Inventory anchor scrolls to the existing gallery; it does not hide
  content behind a second click.
- Keep the current responsive six, four, and two-column card grid.

## Components

- `AccountProfileHero.tsx` owns the cover, profile, navigation, and sign out.
- `AccountWalletPanel.tsx` owns address and balance presentation.
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
- Wallet details stack in reading order: balance, address, Deposit.
- All controls remain at least 44px tall and no horizontal scroll is
  introduced.

## Verification

- Account markup contains the IP hero, right-aligned profile, anchor
  navigation, KPI row, wallet details, and visible Inventory.
- No unsupported Phygitals surfaces or fake metrics are rendered.
- Existing balance, Deposit, address copy, sign out, and inventory summary
  tests remain valid.
- Desktop and mobile CSS contracts, TypeScript, and all tests pass.
