# Account Product UI Redesign

## Goal

Make Account feel like part of Iruka's Home, Marketplace, and Vending product
flow instead of a standalone mock dashboard.

## Direction

- Redesign mode: preserve.
- Design variance: 5.
- Motion intensity: 3.
- Visual density: 4.
- Use the attached Phygitals home only for its wide profile hierarchy and
  number-first composition.
- Keep Iruka's light theme, existing palette variables, typography, radii,
  borders, and pill controls.

## Layout

Account uses the same wide product canvas and gutters as Marketplace and
Vending.

The page contains two primary surfaces:

1. A single wide overview surface. The left side contains identity, network,
   and the copyable full wallet address. The right side contains the real test
   ETH balance, refresh action, and Deposit button.
2. A wide Inventory surface. It shows the owned-card count and only non-zero
   Listed and Shipping statuses, followed by the existing Vault action.

The overview is one integrated surface, not a grid of nested cards. The
initial-letter avatar is removed because it reads as generic mock profile UI.
Sign out remains a quiet action below the primary content.

## Visual System

- Page heading follows Marketplace scale rather than an oversized dashboard
  heading.
- Surfaces use `--radius-xl`, a thin blue-tinted border, and restrained
  `--shadow-sm` or `--shadow-md`.
- The overview uses a soft white and sky background with a restrained section
  of `--iruka-gradient`, without glow or glass effects.
- Balance is the strongest number on the page.
- Deposit remains the only solid primary action.
- Inventory statuses are flat numeric columns separated by spacing or one
  hairline. They are not cards inside a card.
- Existing Lucide icons are retained because the project already uses that
  icon family.

## Responsive Behavior

At 760px and below, the overview becomes one column. Identity appears first,
then Balance and Deposit. Inventory numbers wrap into a compact grid and all
actions remain at least 44px tall. The full address may wrap without causing
horizontal overflow.

## Preserved Behavior

- Existing English and Korean copy.
- GIWA Sepolia balance loading, success, error, Retry, and focus refresh.
- Deposit dialog, address copying, and official faucet link.
- Inventory total excluding Sold.
- Zero Listed and Shipping states remain hidden.
- Vault navigation and existing logout reset.

## Acceptance Criteria

- Account shares Marketplace and Vending container width and heading scale.
- The page no longer renders three equal dashboard cards or an initial avatar.
- Overview reads as one integrated surface.
- Inventory remains number and status only, with no card thumbnails.
- Desktop and 390px layouts have no overflow or overlapping controls.
- Account, Auth, responsive tests, TypeScript, and `git diff --check` pass.
