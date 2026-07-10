# Pack Reveal Experience

Iruka's pack reveal is the premium moment after a vending machine pull. It should feel like a stage lift reveal: blackout, lights, pack tear, card rise, foil sweep, and a rarity stamp.

Only the reveal moment should use 3D. The surrounding purchase, result, vault, and marketplace UI should remain regular DOM.

## Product Rules

- The reveal is part of the vending machine flow, not a separate game.
- Use pack surfaces, cards, lights, stage lines, particles, and foil effects.
- Do not render unlicensed idol images, person silhouettes, agency logos, artist logos, brand logos, or real songs.
- Sound must be generic crowd and synth effects only, muted by default.
- Reduced-motion users and WebGL failures must receive a CSS fallback.

## Rarity Pacing

| Tier | Timing | Treatment |
| --- | --- | --- |
| Common | 1.5s | Fast card fade-in and rarity stamp |
| Rare | 3.0s | Short shake, tear, green flare, lift, stamp |
| Epic | 3.0s | Rare sequence with stronger red flare |
| Legendary | 4.5s | Full stage sequence, orbit, and foil sweep |
| Iruka | 4.5s | Full grail sequence with the strongest holographic treatment |

Rarity presentation should not feel uniform. The full sequence should be reserved for the highest-value pull moments so users learn that a longer reveal means a stronger result.

## Visual Direction

- Common: neutral chrome and soft white light
- Rare: green spotlight and moderate foil reflection
- Epic: red spotlight and sharper reveal flash
- Legendary: yellow foil, stronger bloom, and full card orbit
- Iruka: blue, chrome, and iridescent foil with the most dramatic lift

Final colors should follow the live Iruka design tokens when implemented.

## Technical Scope

Suggested stack for the 3D reveal:

- `react-three-fiber`
- `@react-three/drei`
- `@react-three/postprocessing`
- `gsap`
- `three` r160+ for `MeshPhysicalMaterial` iridescence

Per project rules, add these dependencies only when the reveal implementation starts. Until then, this page is the implementation spec.

## Suggested File Structure

```text
src/features/pack-reveal/
  PackRevealOverlay.tsx
  RevealScene.tsx
  PackMesh.tsx
  CardMesh.tsx
  StageLights.tsx
  LightstickParticles.tsx
  useRevealTimeline.ts
  revealConfig.ts
  sounds.ts
```

Each file should keep one clear role. Timing constants and rarity settings should live in `revealConfig.ts`; timeline control should live in `useRevealTimeline.ts`.

## Scene Composition

```text
Canvas overlay
├─ PerspectiveCamera, fov 40
├─ Environment reflection preset
├─ StageLights with crossed spotlights
├─ PackMesh with top tear animation
├─ CardMesh with dynamic card texture
└─ LightstickParticles at the lower stage edge
```

The card should use a physical material with metalness, clearcoat, environment reflection, and rarity-driven iridescence. The card image must be injected from reveal props, not hardcoded.

## Full Iruka Timeline

| Time | Label | 3D Action | DOM Action | Camera |
| --- | --- | --- | --- | --- |
| 0.0s | blackout | Pack under one spotlight | Background black overlay | Front, fixed |
| 0.5s | shake | Pack rotates slightly twice | None | Small zoom |
| 1.2s | tear | Pack top cap separates, inner light turns on | None | Front |
| 1.8s | teaser | Rarity color flare | Rarity hint fades in | Front |
| 2.6s | crowd | Lightstick particles begin moving | None | Front |
| 3.0s | lift | Card rises from below stage | None | Dolly in |
| 4.0s | orbit | Card completes one foil orbit | None | Slight orbit |
| 4.5s | stamp | Card stops front-facing | Rarity stamp and value count-up | Hold |

Common should skip the lift and orbit. Rare and Epic should use a shortened version. Legendary and Iruka should use the full stage sequence.

## Interaction Rules

- Tap anywhere during the overlay to skip directly to the final result state.
- Hide the skip hint on a user's first pack; show it from the second reveal onward.
- For multi-pack pulls, only the best card should receive the full sequence.
- Remaining multi-pack results should slide into the result grid with a short stagger.
- After reveal, the card can use a small mouse or gyro tilt in the idle state.
- Sound should have a visible toggle and remain muted by default.

## Performance Rules

- Animate transforms and opacity only for DOM layers.
- Keep particles in a single `Points` object with a 200-particle cap.
- Enable bloom only for Legendary and Iruka reveal moments.
- Cap mobile DPR at 2.
- Cap card textures at 1024px unless a later quality pass proves otherwise.
- Dispose textures, geometry, and materials when the reveal scene unmounts.

## Props Shape

```ts
type IrukaRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'iruka';

interface PackRevealProps {
  cards: {
    imageUrl: string;
    rarity: IrukaRarity;
    name: string;
    estimatedValue: number;
  }[];
  onComplete: () => void;
  onSkip?: () => void;
}
```

## Implementation Order

1. Build `revealConfig.ts` and `useRevealTimeline.ts` first.
2. Create a standalone `CardMesh` demo with foil material and idle tilt.
3. Add `StageLights` and `LightstickParticles`.
4. Add `PackMesh` tear animation.
5. Assemble `PackRevealOverlay` and `RevealScene`.
6. Add rarity variants, skip behavior, multi-pack behavior, sound toggle, and fallback.
7. Add a local demo route such as `/reveal-demo` for visual QA before connecting real pack data.

## Acceptance Checklist

- Iruka and Legendary full sequences finish within 4.5 seconds.
- Common finishes within 1.5 seconds.
- Tap skip works from every timeline point.
- CSS fallback appears for reduced-motion users and WebGL failure.
- Card texture is dynamic from props.
- No unlicensed IP assets are used in the reveal.
- Mobile Safari and Android Chrome stay close to 60fps on a current device.
