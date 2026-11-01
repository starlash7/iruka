# Visual story experience

User requests the remaining reference-audit UI/UX and asset work, excluding actual
DB and login verification. Keep the current branch and existing product rules.

## Deliverable

1. Inventory original story assets at a pinned `starlash7/crack` revision. Use
   explicitly adopted covers, portraits and public introduction artwork, plus the
   five adopted private reaction images;
   keep rejected candidates and spoiler art out. Record source/hash/purpose.
2. Bundle approved public artwork, connect seed presentation with a separate,
   deliberate local attachment command. Preserve existing seed manuscripts and
   edited drafts; never silently replace existing browser or DB records.
   Private reactions remain outside public/ and use authenticated/pinned media
   access. They are not automatically added to the public gallery.
3. Improve image-led discovery and cover cropping. Work detail gains public
   introduction images, gallery enlargement, character captions and opening
   artwork. Render known image codes in the public opening preview safely.
4. Chat uses the pinned version's public character portraits, accessible image
   enlargement and a structured status display with a text fallback. Reading,
   search, generation and branch behavior remain intact.
5. Studio list gains cover thumbnails, published/draft filtering and modification
   dates. Image management gains search, usage filters, a thumbnail overview,
   batch upload with per-file results/retry and public gallery selection.
   Preview uses the same public presentation components as the reader.
6. Optional JSON fields are explicitly validated/projected; uploaded images still
   require owned bindings. Private assets/prompts never become a public gallery
   merely because they exist. No executable author HTML/JSX, BGM/video runtime,
   paid generation, commercial features or new dependencies.

## Verification

Use component regressions, full npm test/build, and a clearly labelled local
fixture (not a live DB or real login) for 390/768/1440 screenshots, keyboard focus,
loading/error/retry, long text and image flows. Actual DB/OAuth validation is
excluded at the user's request. Commit and update Draft PR #19.
