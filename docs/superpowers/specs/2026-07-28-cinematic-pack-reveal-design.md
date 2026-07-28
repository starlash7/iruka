# Cinematic Pack Reveal Design

## Goal

Replace the abrupt reveal transition with one deliberate sequence:

```text
pack film -> opening flash -> bottom-up card reveal -> clean card hold -> summary
```

Privy authentication, local fixture pulls, GIWA production pulls, Skip,
reduced motion, and result actions remain unchanged.

## Media

- Use `kling_20260728_VIDEO_Close_up_o_4652_0.mp4`.
- Play the 5.04-second clip once from its first frame at normal speed.
- Keep the portrait composition intact with `object-fit: contain`; do not crop
  the pack on wide screens.
- Use the final blue burst as the transition point into the DOM card.
- Keep playback muted and preserve the existing CSS fallback.

## Timeline

The asset-backed reveal uses one consistent timeline for every rarity:

| Phase | Time | Behavior |
| --- | ---: | --- |
| Charging | 0-350ms | Short anticipation without showing the result |
| Tear | 350-5,400ms | Play the complete pack film |
| Reveal | 5,400-7,500ms | Fade the film, reveal the card from the bottom for 1,500ms, then hold the complete card |
| Summary | 7,500ms onward | Move the settled card into the result layout and show all information |

Rarity still controls accent, foil, aura, and summary treatment. It no longer
shortens this supplied cinematic. Skip remains available from every active
phase and immediately opens Summary.

Reduced-motion users keep the existing short 520ms CSS path with no video,
mask sweep, glare, or long hold.

## Card Transition

- The result card is absent during Charging and Tear.
- Reveal starts after the film has faded.
- A rounded `clip-path` opens from the lower edge while the card rises a short
  distance into its final centered position.
- The card is not interactive during this entrance.
- After the card is fully visible, it remains centered without information for
  600ms.
- Summary then moves the card to the established desktop or mobile result
  position and fades in rarity, name, value, receipt, and Continue.

## Scope

- Replace the previous reveal video with the supplied close-up film.
- Change the pure reveal timeline and card entrance styles.
- Keep the existing state names and component boundaries.
- Remove rarity-specific video seek offsets because the new film always starts
  at the beginning.
- Add no dependency and no new visible copy.

## Failure Handling

- A video load or playback failure shows the existing CSS pack opening.
- Missing media never blocks Reveal or Summary.
- Escape and Skip continue to reach Summary.
- The completed card is persisted only through the existing completion path.

## Verification

- Assert `charging -> tear -> reveal -> summary` at 0ms, 350ms, 5,400ms, and
  7,500ms.
- Assert the close-up film starts at zero and uses normal playback speed.
- Assert the card uses a bottom-up mask and is interactive only in Summary.
- Assert reduced motion omits video and retains the short path.
- Check desktop and mobile for cropped video, card overlap, and summary
  overflow.
