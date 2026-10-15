# My Page implementation

Approved scope: existing /account becomes My Page with editable avatar, nickname,
bio, activity links and separate account settings. Preserve optional wallet flows.

- [x] Add authenticated GET/PUT /api/me/profile and a separate user_profiles table.
  Nickname 1-30 characters, bio up to 300. Avatar is a bounded normalized PNG
  (512px maximum), stored with the profile; no external URL or public endpoint.
  Profile save is atomic, keyed exclusively by the verified server user.
- [x] Add edit/save/cancel, upload/remove with local preview; shared header reloads
  saved profile through a scoped event. No Google/email value is published.
- [x] Test auth, owner isolation, validation, image rejection, persistence and UI markup.
- [x] Run npm test/build and record actual verification.
- [ ] Desktop/mobile browser interaction verification (shared browser in use).

No remote service provisioning, deployment, paid calls or public profile directory.
