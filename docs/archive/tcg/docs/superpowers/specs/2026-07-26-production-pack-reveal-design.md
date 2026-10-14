# Production Pack Reveal Design

## Goal

Upgrade the existing no-video Iruka reveal from a functional CSS fallback to
a production-quality product moment while preserving the approved
`idle -> charging -> tear -> reveal -> summary` flow.

## Design Direction

The reveal stays bright, liquid, and trustworthy. It does not switch into a
dark game scene. Motion concentrates around the selected pack and card:

1. soft stage light gathers behind the pack
2. the sealed pack compresses and lifts
3. the top seal separates with a white tear flash and small foil fragments
4. a rarity-colored burst introduces the exact assigned card
5. the card rises, settles, and exposes foil through pointer movement
6. the card and result panel move into a stable summary composition

Common remains quick and restrained. Rare uses green caustic light, Epic uses
a sharper red prism, Legendary uses warm yellow rays, and Iruka uses an
ice-blue holographic spectrum. Color supports the result without recoloring
the whole interface.

## Architecture

- `RevealEffects.tsx` owns decorative stage light, rings, rays, and particles.
- `RevealTear.tsx` owns the pack shell, split pieces, core light, and foil
  fragments. Optional video support remains an adapter but no video is
  configured for this build.
- `RevealCard.tsx` owns card rise, edge light, foil, pointer tilt, and flip.
- `PackRevealOverlay.tsx` composes the reveal and locks background scrolling
  while mounted.
- The existing pure reveal timeline remains the source of phase timing.

All decorative nodes are `aria-hidden`. Motion uses transform and opacity.
There is no canvas, WebGL, runtime randomness, or new dependency.

## Rarity Treatments

| Rarity | Stage treatment | Card treatment |
| --- | --- | --- |
| Common | one soft ring, minimal particles | short white foil sweep |
| Rare | green caustic burst, moderate particles | green edge and foil |
| Epic | red prism burst, stronger particles | sharper red foil sweep |
| Legendary | yellow rays, premium particle field | longer gold settle |
| Iruka | aqua-blue spectrum and wave rings | strongest holographic foil |

The established maximum durations remain 1.5s, 3.0s, 3.0s, 4.5s, and 4.5s.
Quick opening and skip retain their current behavior.

## Accessibility And Performance

- Sound remains muted by default.
- Reduced motion removes floating, flashing, particle, tilt, and long
  transitions while still reaching summary.
- The overlay locks document scrolling and restores it on unmount.
- Decorative effects never receive pointer events or accessibility focus.
- Mobile uses fewer visible particles and a centered result composition.
- Existing GIWA receipt and inventory verification behavior is unchanged.

## Acceptance

- Every rarity has a visibly distinct stage treatment.
- The pack visibly separates without requiring video.
- The resulting card rises from the pack and settles without layout shifts.
- Pointer foil and flip remain available after reveal.
- Skip, quick mode, sound control, reduced motion, and receipt links regress
  neither functionally nor visually.
- Desktop and mobile have no horizontal overflow or overlapping result actions.
