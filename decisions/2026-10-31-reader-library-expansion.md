# Reader expansion decisions

- User explicitly approved the five previously listed follow-ups, including the
  needed library/favorite/creator data contracts. This supersedes earlier deferral
  of those specific features, while live LLM/payment/deployment exclusions remain.
- Conversation metadata is mutable without changing pinned work/version/persona.
  Folders and favorites remain private and server-authorized per Privy identity.
- Per-work creator attribution defaults off and is chosen in Studio before
  publishing. A private saved nickname is not automatically made public.
- Named image codes require immutable version rows, rather than overwriting the
  URL of an asset already referenced by a published version or existing chat.
- Message search covers the selected loaded path. Device reading preferences
  contain no conversation or identity data and tolerate unavailable storage.
- Runtime/model credentials and production image storage remain unconfigured;
  no live provider call or deployment is part of this request.
- Validation completed with 216 passing tests, successful build and local browser
  checks at 390/768/1440px. See docs/pivot/HANDOFF.md for the evidence boundaries.
- Keep draft PR #19 based on the existing story-platform integration branch
  `starlash7/clone-repo`; do not replace its base with historical TCG `main`.
