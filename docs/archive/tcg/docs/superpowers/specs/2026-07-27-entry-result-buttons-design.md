# Entry And Result Buttons Design

## Goal

Use one Iruka button language on the intro screen and after a pack reveal
without changing copy or action behavior.

## Current Problem

- `Play Iruka!` uses the shared action class, but an entry-specific solid blue
  override removes the normal Iruka glass gradient.
- `Vault`, `Sell now`, and `Ship` use the older asset-action treatment with a
  compact rectangular shape and an unrelated second-button emphasis.

## Design

- `Play Iruka!` uses the existing Iruka blue glass gradient, highlight,
  shadow, hover, and pressed states.
- Result actions share one height, full-pill shape, icon gap, and typography.
- `Vault` is the primary action and uses the Iruka blue glass treatment.
- `Sell now` and `Ship` are white-glass secondary actions with a soft blue
  border and blue hover state.
- Disabled `Ship` keeps its dimensions and uses lower saturation and opacity.
- Mobile actions remain full-width when they wrap.

## Scope

- Add semantic primary and secondary class names to active-pull buttons.
- Remove only the entry-specific solid blue background override.
- Update only button selectors needed by Intro and active-pull actions.
- Do not change labels, action order, status behavior, or adjacent Account and
  Vault layouts.

## Verification

- Assert Intro retains the shared Iruka action class without a solid override.
- Assert active-pull buttons declare primary and secondary hierarchy.
- Assert secondary and disabled treatments exist.
- Run focused button and Vending tests, TypeScript, and formatting checks.
