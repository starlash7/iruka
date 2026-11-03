# Reader library expansion checklist

Owner: current agent, current `starlash7/fix-logged-in-pages` branch. Shared files
are changed sequentially; no parallel workspace assignments.

- [x] Read rules, feature map, sprint, design, product docs and original code.
- [x] Baseline build before file generation.
- [x] Migration/shared DTOs: folders, chat titles, favorites, opt-in attribution.
- [x] `server/chat/library.ts`, reader/API: private query, rename/move/folder CRUD.
- [x] Discovery/core APIs: private favorites and safe public creator names.
- [x] Media/Studio: immutable code-slot upload and editor binding/recovery.
- [x] Reader client/session + development adapters: new contracts, auth isolation.
- [x] Work actions: latest same-work Continue, New conversation, favorite.
- [x] Chat library: folders, rename/move/delete, pagination and dialog errors.
- [x] Conversation search/highlight and bounded persistent reading preferences.
- [x] Discovery page loading + saved works; public author rendering/consent UI.
- [x] Focused regression tests and real HTTP/DB integration checks.
- [x] Browser desktop/mobile, failure/retry, keyboard and screenshots in .context.
- [x] Full npm test/build, diff review, docs/HANDOFF/decisions.
- [x] Commit current branch and update draft PR #19; no main merge/deployment.
