# Iruka Vending Dispense Reveal Design

## Goal

Make opening a pack feel like receiving a physical product from the Iruka
vending machine. The sequence must remain legible, unbroken, and premium on
mobile and desktop without overlapping pack, receipt, and card layers.

## Direction

Use one continuous physical sequence:

```text
sealed -> dispensing -> opening -> extracting -> showcase -> summary
```

The visual story is:

```text
vending slot -> pack drops -> top seal opens -> card rises -> full card -> result
```

The receipt metaphor is removed from the reveal. A transaction receipt remains
available only in Summary when a real GIWA transaction exists.

## Approaches Considered

### Selected: Physical Vending Dispense

The pack emerges from a chrome vending slot, drops into view, opens, and
releases the actual card. This directly supports the Iruka product concept and
creates a clear cause-and-effect relationship after the drag.

### Rejected: Receipt Transformation

Transforming a pack into a receipt requires duplicate full-size surfaces and
does not communicate vending. It caused visual overlap and unclear scale.

### Rejected: Full-Screen Prerendered Video

A video can look polished but cannot adapt to the actual selected pack, card,
rarity, accessibility preference, or failure state. It also introduces a
visible transition between video and product UI.

## Asset Normalization

The pack source canvas is `1086x1448`, but the visible foil pack occupies only
part of that transparent canvas. Matching UI to the outer canvas makes the pack
look small and causes surrounding surfaces to appear misaligned.

- Crop transparent canvas space at runtime with a fixed product viewport.
- Preserve the complete foil packet, including both serrated seals.
- Use `object-fit: contain`; never use `cover` for the physical pack or card.
- Use one visible pack body and one top-seal crop from the same source.
- Do not place a second complete pack, receipt, or card behind the product.
- Normalize all four tier assets to the same visible product bounds.

## Visual Sequence

All rarities use the same primary timing. Rarity changes only edge color and
the final label.

| Time | Scene | Behavior |
| ---: | --- | --- |
| Before drag | Sealed | A chrome vending slot holds the lower edge of the selected pack |
| 0.0-0.6s | Release | The slot light travels once and the latch opens |
| 0.6-1.8s | Dispensing | The upright pack drops vertically into the center and settles once |
| 1.8-2.5s | Settle | The pack holds while the top seam becomes visible |
| 2.5-3.5s | Opening | The serrated top strip separates left to right; the pack does not rotate |
| 3.2-5.8s | Extracting | The actual card front rises slowly from inside the open pack |
| 4.8s | Rarity | A restrained rarity edge and the real rarity label appear |
| 5.6s | Name | The actual card name appears after most of the image is visible |
| 6.0-6.5s | Transition | An opaque ice-blue wash hides the pack removal |
| 6.5-8.5s | Showcase | The same card holds fully visible and uncropped |
| 8.5s | Summary | The existing result, receipt, Vault, Sell, and Ship flow replaces Showcase |

No pack flip, card flip, camera orbit, perspective turn, radial ring, particle
field, or unrelated decorative copy appears during this sequence.

## Composition

### Vending Slot

- Centered above the product, not inside a card.
- Soft chrome shell with a dark inner recess and one blue status line.
- Wide enough to establish where the pack came from.
- No machine illustration or explanatory label in the overlay.

### Pack

- Upright for the entire sequence.
- Positioned from the normalized visible alpha bounds rather than the source
  canvas.
- The body remains in front of the lower part of the card while extraction
  begins, so the card reads as physically inside the pack.
- The top strip is the only duplicated crop and leaves the frame after opening.

### Card

- One card DOM surface is used from extraction through Showcase.
- The actual front image rises directly; there is no back-face flip.
- The card is never cropped. Its source ratio is preserved with `contain`.
- A rarity-colored edge appears only after at least half the card is visible.
- The Showcase transition changes scale and position only while the opaque wash
  covers the screen.

### Text

- During extraction, show only rarity and card name.
- Rarity appears first; the card name follows.
- Serial, edition, estimated value, and Explorer receipt remain in Summary.

## Interaction

- Preserve the current `Slide to open` control and `72%` completion threshold.
- A failed drag returns in `220ms`.
- Completing the drag starts the sequence exactly once.
- The explicit Skip control moves directly to Summary.
- Sound remains muted by default.

## Responsive Behavior

- Desktop product maximum height: `min(58dvh, 560px)`.
- Mobile product maximum height: `min(52dvh, 440px)`.
- The slot, pack, and card share one centered responsive coordinate system.
- The drag control remains below the product and never overlaps it.
- Safe-area insets keep HUD controls clear on mobile.
- No horizontal scrolling at `390`, `768`, `1440`, or `2560` pixel widths.

## Accessibility And Failure States

- Enter and Space complete the opening gesture.
- Reduced motion skips the drop and tear, shows the static full card, and moves
  to Summary after the existing short delay.
- Missing pack art uses the neutral Iruka pack fallback.
- Missing card art uses the Iruka card fallback and still reaches Summary.
- Skip and Escape cancel the active GSAP timeline exactly once.

## Code Boundaries

- `PackRevealOverlay`: dialog, sound, Skip, and Summary boundary.
- `VendingRevealScene`: sequence state and single shared coordinate system.
- `VendingSlot`: chrome slot presentation.
- `DispensedPack`: normalized pack body and top-seal crop.
- `EmergingCard`: one card surface used through Showcase.
- `revealMachine`: pure state order, drag threshold, and timing constants.
- `revealSequenceAnimation`: one scoped GSAP timeline and cleanup.

The existing Privy, GIWA pull, card result, Vault, Sell, Ship, and Explorer
receipt behavior does not change.

## Acceptance Criteria

- The complete foil pack is visible without transparent-canvas padding.
- The pack visibly originates from the vending slot.
- Only the top seal separates; the pack never flips or changes orientation.
- The card visibly emerges from inside the pack.
- Only one complete pack and one card surface are mounted.
- Rarity and name appear in sequence without covering the card image.
- The full card photo is uncropped before Summary.
- No main surfaces overlap at supported desktop and mobile sizes.
- Local fixture and GIWA pulls use the same reveal.
- Existing Summary actions and real GIWA receipts remain intact.
