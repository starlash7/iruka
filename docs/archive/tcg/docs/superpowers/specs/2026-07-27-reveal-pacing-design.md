# Reveal Pacing Design

## Goal

Make the no-video pack reveal feel deliberate and suspenseful without
exceeding Iruka's established rarity timing or changing the pull result.

## Root Cause

The overlay currently enables the quick timeline automatically after one
completed reveal. That reduces later sequences to 650-900ms without an
explicit user choice, so the pack tear and card reveal read as one abrupt
transition.

## Behavior

- Every reveal starts on the full rarity timeline by default.
- Common remains within 1.5s.
- Rare and Epic remain within 3.0s.
- Legendary and Iruka remain within 4.5s.
- Charging lasts no more than 500ms.
- The tear phase holds long enough to show the split pack and inner light.
- Legendary and Iruka hold before the card reveal for up to 800ms.
- Summary begins only after the card settle animation completes.
- Skip remains available during every active phase.
- Quick opening is never enabled implicitly from local storage.
- Reduced-motion keeps its existing short fallback.

## Timing

| Rarity | Tear starts | Card appears | Summary |
| --- | ---: | ---: | ---: |
| Common | 400ms | 900ms | 1,500ms |
| Rare | 480ms | 1,750ms | 3,000ms |
| Epic | 480ms | 1,750ms | 3,000ms |
| Legendary | 500ms | 2,800ms | 4,500ms |
| Iruka | 500ms | 2,800ms | 4,500ms |

The Legendary and Iruka tear treatment reaches its visual peak around 2.0s,
then holds before the card enters at 2.8s.

## Scope

- Change the pure reveal timeline and overlay quick-mode selection.
- Keep the existing CSS pack, rarity effects, card, sound, GIWA receipt, Vault,
  Sell, and Ship behavior.
- Add no dependency, video, visible explanatory copy, or new persistence key.

## Verification

- Assert exact normal event timings for every rarity.
- Assert a completed reveal does not automatically opt the next reveal into
  quick mode.
- Assert Skip is rendered throughout non-summary phases.
- Run focused reveal tests, all reveal state-machine tests, and TypeScript.
