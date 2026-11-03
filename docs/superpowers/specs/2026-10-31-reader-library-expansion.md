# Reader workflow expansion

User-approved scope: all five follow-ups from the Crack comparison: continue/new
conversation, conversation library management, search/reading settings, image-code
uploads, and discovery pagination/creator attribution/favorites. Baseline 056e4f0;
retain the current branch and existing pink UI, authentication and credit rules.

## Contracts and behavior

- Work detail looks up the signed-in user's latest active conversation for that
  exact work. Continue navigates to it; New conversation retains the opening,
  persona and model sheet. Public work loading never waits for private reads.
- Library supports custom chat names, personal folders, moving chats, deletion
  with confirmation, folder rename/delete and paginated browsing. Folder deletion
  keeps conversations in All. All mutations verify ownership and preserve pinned
  work/persona/version records; pending chat deletion still fails with 409.
- Search is literal text over the loaded selected conversation path, with match
  navigation and safe highlighting. Reading size/line spacing are bounded device
  preferences; denied storage must not break reading or erase existing data.
- Upload/replace an image into a named code slot using the existing PNG validation,
  storage and owner checks. Immutable asset versions preserve published snapshots
  and pinned conversations. Bind the new version to the draft before publishing;
  a failed upload/save keeps draft recovery and permits retry.
- Home/search/tag can fetch the next 60 works, retaining query/mode/tag. Ignore
  stale responses, prevent duplicate requests/rows and keep results on failure.
- Creator display is an explicit per-work publishing choice, off for existing
  drafts/works. Only the opted-in saved nickname is public; never email, Privy DID,
  avatar, biography or private settings. No public profile/social-count system.
- Favorites are private server-owned records for published public works, with
  idempotent save/remove and an authenticated paginated saved-works destination.

## Implementation boundaries

One owner, sequenced shared contracts. Add one additive foundation migration and
one Studio asset-version migration.
Reuse API envelopes, authenticated identity, Modal/Button, Reader APIs, image
storage and editor save/recovery. No dependencies, live model calls, OAuth bypass,
wallet/chain changes, main merge or deployment.

## Acceptance

Real local HTTP/DB tests cover unauthorized/cross-user operations, folder moves,
deletion locks, private/unpublished favorites, creator disclosure, paging and
immutable image replacement. Focused UI tests plus 390/768/1440 browser checks cover
empty/loading/error/retry, same-work continue, library dialogs, literal search,
reading persistence and image upload/replacement. Full tests/build and checked
screenshots precede commit/draft PR update. Controlled auth/model transports are
not evidence of real OAuth or provider generation.
