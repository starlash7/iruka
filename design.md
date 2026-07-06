# DESIGN.md - Iruka

> Direction: **Clean Blue Fintech Collectibles**.
> If Upbit or Toss built phygital card packs, the app should feel fast, calm, liquid, and trustworthy.
> No dark luxury mode. No mock dashboard. No sharp fintech-table UI.

---

## 0. Product Read

- First screen is a product flow, not a marketing page.
- The user should understand in 3 seconds: choose pack, open, vault, sell, ship.
- Use English UI for the MVP judging surface.
- The brand can use `Iruka`; social/domain can use `playiruka`.

---

## 1. Visual System

### Palette

```text
App bg:        #F4F8FF
Surface:       #FFFFFF
Soft surface:  #F8FBFF
Blue:          #1677FF
Blue hover:    #0B63F6
Sky:           #EAF4FF
Aqua:          #20C7DF
Ink:           #101828
Muted:         #667085
Subtle:        #98A2B3
Line:          #E6EEF8
Success:       #12B76A
Warning:       #F79009
Danger:        #F04438
```

### Shape

- Use a soft radius system: 22px large surfaces, 18px controls, full-pill for primary buttons/chips.
- No angular cards. No 8px hard dashboard boxes.
- Shadows must be blue-tinted and very soft, never black-heavy.

### Typography

- Prefer system fintech feel: Pretendard / Inter / system sans.
- Prices and timers use `tabular-nums`.
- Big text is simple and readable; avoid decorative display type.
- No long explanatory copy inside the app.

---

## 2. Layout

### Hero

```text
[Header] Iruka / Drops / Vault / GIWA / Wallet
[Hero] Left: pack product image
       Right: selected drop, price, remaining, progress, primary Open button
[Below] horizontal pack selector
[Flow] Reveal + settlement details
[Vault] collection/action surface
```

- Keep the first viewport bright, calm, and product-led.
- Use white/blue depth, not dark panels.
- The pack image should feel like a real product thumbnail, not a placeholder.
- Secondary packs should look selectable and tactile, like finance app product cards.

### App Copy

- Short labels only: `Open pack`, `Vault`, `Sell now`, `Ship`.
- Avoid `demo`, `mock`, or explanatory investor wording in visible UI.
- Trust line can be one concise sentence near CTA.

---

## 3. Interaction

- Buttons: hover lift, pressed scale, loading state.
- Cards: soft hover raise, selected blue ring.
- Pack open: brief blue wash/reveal, not cinematic dark flash.
- Progress bar: rounded liquid blue.
- Mobile: single-column, no text overflow, controls remain thumb-friendly.

---

## 4. Definition of Done

```text
[ ] Page reads white/blue within 3 seconds.
[ ] No dark luxury remnants.
[ ] No angular card system.
[ ] Primary CTA is obvious and interactive.
[ ] Pack selection feels tappable.
[ ] Empty zero stats are hidden.
[ ] Open flow adds a revealed card and vault row.
[ ] Desktop and mobile screenshots have no overlap.
```
