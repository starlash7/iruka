# Iruka screen reference audit

Date: 2026-10-30. Status: research and implementation handoff, not shipped UI.

## Method and limits

- Inspected real sites with ego lite, TaskSpace 31; existing signed-in sessions were present.
- Read-only navigation: home, Uummai studio/list/account menu, Frontia episode detail.
- No messages sent, works created, settings saved, purchases, model calls, or signups.
- Desktop screenshots remain private under `.context/ux-p1.png` through `ux-p4.png`.
- Screenshots include existing account UI: do not commit or distribute them.
- 390px emulation exposed responsive navigation and reported document width 390px.
  Some screenshot captures were clipped; this is NOT complete mobile visual verification.
- Logged-out onboarding, chat generation, editor save/publish, recovery and accessibility
  end-to-end flows were not exercised on competitors. Do not infer their implementations.

## Observed references

| Source | Direct observation | Iruka application | Exclude |
| --- | --- | --- | --- |
| [Crack](https://crack.wrtn.ai/) | Persistent recent-chat sidebar; top search/navigation; genre chips; compact poster rails; mobile navigation changes | Shared shell, quick return to chat, consistent poster hierarchy | Events, adult categories, extra chat modes and image generation |
| [Frontia](https://frontia.ai/) | Featured work with separate detail/play actions; detail dialog includes continue/new play, introduction, tags, characters and previews | Explain the story and user's role before entering chat; preserve distinction between continue and new session | Dark cinematic theme, autoplay media, commerce and social counts |
| [BabeChat](https://babechat.ai/) | Creation/chat shortcuts; recent chats; discovery tabs; cards combine image, short description, tags and creator | Clear compact card information; creation remains reachable during exploration | Payment/promotions, adult features, excessive tabs |
| [Uummai](https://uumm.ai/) | Home/studio/activity sidebar; studio list separates published/draft status; per-work edit actions; account menu exposes personas separately | Studio as work management, not a blank form; separate profile from conversation persona | Revenue/exchange, identity verification, JSX, BGM and badge systems |

These observations describe UI, not verified backend behavior. Competitor assets,
copy, source and private account data are not implementation inputs.

## Proposed Iruka composition

Keep Korean, white/pink, Pretendard, existing API and Privy DID identity.
The reference is information hierarchy, not a pixel-for-pixel clone.

1. Common shell: stable desktop sidebar, search/account header; mobile navigation
   with equivalent destinations. Preserve current shared shell and chat-specific layout.
2. Discover: compact featured work only when real content exists, then browsable
   poster grid/rails. Use existing search/ranking/tag data; no invented recommendation metrics.
3. Work detail: cover, title, creator, concise introduction and tags; supported public
   character/story information; clear conversation start and persona selection.
   Continue/new conversation needs existing-session lookup before presenting it as supported.
4. Chat: prioritize reading and input; reveal regenerate/branch controls predictably;
   distinguish streaming, cancelled, failed and retry states without losing draft text.
5. Studio: manageable draft/published work list; editor sections follow basic information,
   public presentation, private settings, preview and publish. Do not expose hidden prompts.
6. My Page: compact identity header, profile edit, own activity destinations; persona
   remains a distinct conversation identity. Wallet stays optional, outside the primary path.

## Parallel ownership and gates

- Integration: shared shell, navigation, common tokens and API contract requests.
- D discovery: home/search/ranking/work detail after common tokens are settled.
- B studio: studio list/editor/preview presentation, no shared shell edits.
- C persona: persona management and selection accessibility; preserve pinned snapshots.
- A runtime: assess chat failure/cancellation/recovery requirements, not discovery styling.
- Profile/shared chat glue remains integration-owned; do not assign overlapping files.

Before implementation, publish the exact file set for each worker. No speculative
API expansion; raise a concrete contract gap first. No assumption that instructions
have automatically reached the user's other Conductor workspaces.

## Parallel code review results

Two independent read-only reviewers inspected discovery/chat and studio/profile.
These are static findings, not reproduced browser bugs.

### Preserve existing implementation

- ReaderLayout already shares navigation/account/footer and has a chat-specific mode.
- WorkPage already has characters, openings and play guide. StartChatSheet already
  selects opening/persona/model and checks credits; do not rebuild these from scratch.
- Chat already supports streaming, cancellation, reconciliation, regeneration and branching.
- Studio has five editor stages, 700ms autosave, conflict/recovery handling and immutable publishing.
- My Page already supports server-backed nickname, bio and avatar. Personas have soft deletion
  and snapshot preservation. New public profiles are not part of this task.

### First implementation batch: existing-flow gaps

| Priority | Owner / files | Change | Verification |
| --- | --- | --- | --- |
| P0 | Integration with A agreement: chat/ChatPage, ChatPanels, MessageList | Explain pending-turn/model-unavailable states; align regenerate eligibility with its handler; show mutation errors inside the active modal | Pending refresh, insufficient credits, no model, failed edit/delete |
| P0 | B: studio/EditorPage and related sections | Link publish validation to missing fields; make draft versus published version explicit; link successful publish to the public work | Missing character examples, save conflict, publish failure/success |
| P1 | D: discover/WorkPage, WorkGrid, SearchPage | Actionable empty/reset states; unavailable work/opening explanation; long title and mobile detail layout | Empty/filter reset/error/retry and 390/768/1440px |
| P1 | C: user/personas | Clarify that editing/deleting a persona does not rewrite existing conversations | Existing pinned chat remains unchanged |
| P1 | Integration: user/profile, AccountView | Distinguish saved public-facing nickname/avatar from authentication identity in expanded settings | Save/cancel/header update, separate users |

### Contract decisions before follow-up work

- Studio image-code slots currently lack the upload/bind action available to covers and
  character images. B must propose the scoped media contract before presenting this as usable.
- Continue-existing-chat, richer studio list metadata and creator attribution must use
  real contracts. Do not invent data to reproduce competitor screenshots.
- Discovery supports offsets at client level but screens do not paginate. Confirm server
  behavior before adding load-more, taxonomy, sorting or new curated collections.
- Private studio requests before authentication and start-chat login continuation need an
  explicit auth-state review, not a competitor-inspired cosmetic workaround.

First complete these gaps, then apply card density and layout refinements. No new revenue,
social feed, bookmarks, public creator profile or content-generation feature is authorized here.

## Acceptance for subsequent implementation

- Preserve real routes/auth/ownership and credit accounting; no mock operational metrics.
- Validate loading, empty, error, signed-out and signed-in states on each changed screen.
- 390/768/1440px: no page overflow, overlay overlap or obscured input; keyboard focus visible.
- Profile and persona edits must not affect another user or existing chat snapshots.
- Publish -> discover -> persona -> chat -> regenerate/branch -> reload is the final
  integration gate, with test doubles clearly separated from real authentication/model results.
- Run scoped tests, npm test and npm run build for implementation completion.

No application code, dependencies, deployment or main branch changed in this audit.
