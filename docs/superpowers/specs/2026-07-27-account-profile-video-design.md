# Account Profile Video Design

## Goal

Replace the Account profile's static cover with the user-provided Iruka video
while preserving profile readability and a reliable image fallback.

## Design

- Render the video as the full-cover media inside `AccountProfileHero`.
- Use native `autoPlay`, `muted`, `loop`, and `playsInline` behavior.
- Keep `roadmap-iruka-universe.jpg` as the poster so blocked or delayed playback
  never leaves an empty cover.
- Retain the existing blue bottom shade for navigation and profile contrast.
- Keep controls hidden because the video is ambient profile media.
- Pause animation for reduced-motion users by hiding the video and showing its
  poster image instead.

## Scope

- Add one MP4 asset under `src/assets`.
- Modify only the Account profile component, profile stylesheet, and focused
  Account tests.
- Do not change Account copy, layout, wallet behavior, or Inventory.
- Add no dependency.

## Verification

- Assert the video source and native playback attributes.
- Assert the poster fallback and reduced-motion CSS behavior.
- Run focused Account tests, TypeScript checks, and the existing regression
  suites.
