# Chat server decisions

- Foundation: e67418a; current placeholder branch kept. Fast-forwarded the documented dependency.
- Model/credit policy and safety are explicit injected inputs, never environment-based auth or paid defaults.
- Whole-output moderation precedes SSE text delivery; this deliberately trades first-token latency for
  preventing partial unsafe/private/control text exposure. Test adapter only in development evidence.
- Credits and turn state require a shared async-context Database wrapper. Integration owner must
  construct credits with that wrapper; no ledger implementation in the chat module.
- Latest shared config has no assets, regex trigger or embedding contract. Support a server-only
  asset resolver option, literal keyword triggers, and branch-anchored bounded summaries. Ask
  common/studio owners to formalize assets and vector retrieval before adding provider dependencies.
- Add migration 0100 in the originally assigned path, with explicit chat migration runner. Shared
  migration registry, application routing and dev composition remain integration-owner changes.

- Independent review found and regression tests reproduced author-only text echo, missing usage
  treated as zero, and newer summaries displacing pinned notes. All three fixed and re-reviewed.
  Literal privacy guard only covers normalized full strings >= 8 characters; injected moderation
  must handle semantic disclosure/partial excerpts. No production moderation claim.
