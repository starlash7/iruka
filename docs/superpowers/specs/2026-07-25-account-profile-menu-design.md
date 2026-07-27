# Account Profile Menu And Collection Stats

## Goal

Make Account feel like a useful collector profile and replace the connected
wallet address in the header with a familiar avatar menu.

## Account Layout

- Keep the existing identity, GIWA network, wallet address, balance, Deposit,
  and Inventory behavior.
- Use the Iruka logo as the temporary profile image until user-uploaded avatars
  exist.
- Add a compact KPI row between the overview and Inventory.
- Show only values derived from the current collection:
  - Inventory FMV from non-sold card estimated values.
  - Cards collected from non-sold cards.
  - Listed cards when the count is greater than zero.
  - Shipping cards when the count is greater than zero.
- Do not add user volume, rank, points, membership, or progress data without a
  persisted source.
- Remove the duplicate Inventory count/status strip once the KPI row exists.
- Keep the existing responsive Inventory gallery.

## Header Profile Menu

- Replace the connected wallet-address button with a 42px circular Iruka avatar.
- Clicking the avatar opens a right-aligned menu with identity, GIWA network,
  Account, Settings, and Sign out.
- Account opens the existing protected Account view.
- Settings reveals the existing English/Korean preference inside the menu.
- While authenticated, the header language control lives inside the profile
  menu. While signed out, it remains in the header.
- Escape, outside click, Account selection, and Sign out close the menu.
- Keep the existing Privy session and wallet connection behavior unchanged.

## Visual Direction

- Use white, ice blue, and restrained Iruka holographic accents.
- Use soft blue borders and shadows, 18px stat surfaces, and a circular avatar.
- Keep labels at 11-12px, values at 26-32px, and weights between 550 and 700.
- Avoid dashboard-black styling, oversized headings, nested cards, and fake
  collector achievements.

## Acceptance Criteria

- No wallet address appears in the authenticated header.
- Avatar menu is keyboard accessible and exposes Account, Settings, and Sign out.
- Account stats are calculated from collection state and update with card status.
- Sold cards are excluded from card count and Inventory FMV.
- Desktop, tablet, and 390px layouts have no horizontal overflow or overlap.
- Focused tests, TypeScript, and whitespace checks pass.
