# Home Discovery Redesign

Approved: 2026-10-30, visible homepage redesign rather than only state fixes.
Preserve white/pink, existing account actions, footer and public work contracts.

- [x] Home-only header search, compact sidebar navigation/chat spacing.
- [x] Image-led masthead using existing original Iruka artwork; manual featured-work
  navigation only for real works with usable covers. No invented counts/recommendations.
- [x] Discover/ranking/search destinations, real tag filters and denser poster grid.
- [x] Explicit missing-cover state; zero/error/loading states retain shell without fake works.
- [x] Public discovery reads independent of private login initialization; private calls unchanged.
- [x] Focused tests first, full tests/build, ego lite desktop/mobile screenshots.
- [ ] Record evidence and restrictions; commit/update current draft PR only.

Ownership: main agent HomePage/HomeMasthead/HomeSearch/home-discovery.css, shared
ReaderLayout optional header slot, scoped discovery tests. Parallel worker owns
readerApi.ts and public-reader-auth.test.mjs only. No new dependencies.

Verification: npm test 202/202; npm run build exit 0 (existing chunk warning).
Ego lite checked the actual local homepage/search at 390/768/1440/2560px,
keyboard search focus and no horizontal overflow. Published data currently has
two works, neither with a cover; multi-slide behavior has component test coverage
but was not exercised with real covered works. Private recent chats still need
server Privy configuration. No credentials, private authorization or DB changed.
