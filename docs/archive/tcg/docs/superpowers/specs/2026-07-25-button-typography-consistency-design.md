# Iruka Button And Typography Consistency

## Scope

Unify only the primary calls to action in the intro and Account surfaces:

- `Play Iruka`
- `Deposit`
- `Open GIWA Faucet`

Secondary actions such as copy, refresh, close, language selection, and sign out
keep their existing semantic treatment.

## Visual Direction

- Reuse one bright blue, full-pill Iruka CTA treatment.
- Keep the current soft highlight, blue depth, hover lift, and pressed state.
- Preserve each surface's existing dimensions: the intro remains prominent,
  while Account actions stay compact and task-focused.
- Use the app font stack instead of the current Arial exception.

## Typography Audit

- Intro and Account controls use `var(--font-sans)`.
- Primary action labels use a consistent medium-semibold weight.
- Headings, values, labels, and metadata retain their existing hierarchy unless
  a visual check finds overflow, clipping, or an obvious scale mismatch.
- Korean text continues to use Pretendard through the existing locale rule.

## Verification

- Check intro and Account at desktop and mobile widths.
- Confirm CTA hover, pressed, focus, and disabled states.
- Confirm English and Korean labels fit without overlap.
- Run focused source tests and TypeScript validation.
