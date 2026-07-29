# Torn Pack Reveal Pacing Design

## Goal

Make the approved drag-to-open reveal feel like a foil pack tearing open
instead of a straight slider, then give the hint and card reveal enough time
to build anticipation.

## Scope

This change affects only the pack-opening gesture, post-film pacing, and the
matching reveal documentation and tests. It does not change the selected
card, odds, wallet login, GIWA transaction, receipt, Vault, Sell, or Ship
behavior.

## Opening Gesture

The existing left-to-right `Slide to open` interaction remains. A successful
drag still completes at `72%`, and an incomplete drag still returns in
`220ms`.

The straight two-pixel seal is replaced with a paired irregular foil edge:

- The upper and lower pack layers use complementary jagged polygon edges.
- Drag progress exposes a silver torn edge from left to right.
- The upper foil section lifts up and to the right as the drag advances, with
  a small rotation that follows the existing CSS progress variables.
- The pack art remains recognizable and does not receive extra particles,
  rings, rays, or decorative copy.

The effect uses the existing DOM and CSS variables. It does not add Canvas,
WebGL, or a new dependency.

## Post-Film Timeline

The approved 5.04-second film remains unchanged and advances through
`onEnded`. After the film, every rarity uses the same five-second sequence:

| Scene | Timeline | Behavior |
| --- | ---: | --- |
| Hint | 0.0-1.8s | Real result fields enter with a 450ms stagger |
| Card Back | 1.8-3.4s | The card back rises slowly from below |
| Card Front | 3.4-5.0s | The card flips, then holds before Summary |
| Summary | 5.0s | The reveal scene is replaced by the result layout |

Rarity still controls which real hints appear and the card's color treatment.
It no longer changes the amount of post-film time.

Reduced-motion keeps the existing short path: the static card appears
immediately and Summary replaces it after `300ms`.

## Visual Motion

- Hint text uses a restrained upward fade lasting about `650ms`.
- The card-back rise lasts about `1.2s` and does not use rarity-specific speed.
- The back-to-front flip lasts about `900ms`.
- The existing foil sweep may run for about `1.2s` after the front appears.
- Only one primary scene remains mounted at a time.

## Accessibility And Recovery

Mouse, touch, Enter, and Space retain the same opening behavior. Skip remains
an explicit control. Media rejection, timeout, and file errors continue
directly to Hint so the result cannot become stuck.

## Verification

- Timing tests assert the same `1.8s / 3.4s / 5.0s` transitions for every
  rarity.
- Reveal source tests assert a jagged foil edge and remove the old straight
  two-pixel seal.
- Focused reveal tests and TypeScript checks must pass.
- Desktop and mobile review checks for overlap, card cropping, and horizontal
  overflow when a browser session is available.
