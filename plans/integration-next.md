# Next integration checklist

## Baseline and ownership

2026-10-15 fetch: integration 8ada036; Docs b7f750e (PR15, targets
starlash7/clone-repo). Current branch stays starlash7/clone-repo.
Unrelated .superpowers/ and output/ are excluded.

| Owner | Files | Remote state at intake |
|---|---|---|
| A model | server/models/**; scoped chat changes by agreement | PR11 4fb5391 reviewed and integrated |
| B studio/media | features/studio, server/studio, api/studio, server/media | PR12 a1eca8d reviewed and integrated |
| C persona | PersonasPage, features/user/personas/** | PR16 ecba192 reviewed and integrated |
| D discovery | discover pages/layout and their styles; not auth/API provider | PR17 7a0ae58 reviewed and integrated |
| Integration | product/core, shared contracts, API routing, migrations, env/packages, common UI/routes, necessary chat glue | PR14 |
| Docs | docs/gitbook/** | PR15 b7f750e reviewed, merged as e025f3f |

## File checklist

- [x] Fetch, inspect PR heads and Docs decisions; do not remerge ancestor branches.
- [x] AGENTS/CLAUDE/CURRENT_SCOPE/sprint: separate current rules from history.
- [x] decisions/2026-10-15-integration.md: record unresolved operating inputs.
- [x] docs/pivot/handoffs/integration.md: record existing contracts and intake format.
- [x] Receive A adapter contract/tests: OpenAI gpt-5.4-mini; safety/rate/budget remain unapproved.
- [x] Receive B local storage, media contract and ownership/lifecycle tests; remote storage undecided.
- [x] Receive C persona mutation API requirements and snapshot tests.
- [x] Receive D discovery API gaps, route compatibility and visual results; no new DTO needed.
- [x] Implement persona mutations, local media wiring/private image auth and summary opt-in.
- [x] Review and merge completed work in dependency order onto this branch only.
- [x] Review Docs PR15 diff before separate integration; retain both handoff histories.
- [ ] Run full integrated journeys with real services when credentials/approvals exist.
- [x] Record final implementation delta for Docs owner below and in HANDOFF; no automatic message delivery.

## Integration delta

- 0004 soft-deletes personas; list/start excludes them while pinned chats survive.
- ProductOptions accepts ImageStorage; local dev uses LOCAL_IMAGE_DIRECTORY.
- Reader and Studio share authenticated image loading; tokens never go to external image URLs.
- Recovery always runs; summary calls require explicit runSummaries and are off by default.
- Mobile common header groups network/account controls; no A-D active worktree edits.
- Docs reflect delivered UI/CRUD/local images and adapter-only model status.
- No taxonomy, pagination, deployment or live moderation policy invented ahead of owner requests.

## Merge gates

Inspect changed files, commit ancestry, tests and limitations before each merge.
Do not assume an OPEN/Draft PR is finished. Require owner handoff. Shared-file
edits outside ownership must be reviewed explicitly. Start dependent UI only
after required shared contracts have a published commit. No destructive reset.

## Verification gates

Common API changes: unauthorized/cross-user access, validation, replay,
atomic reservation/charge/refund, cancellation and expired lease recovery.
Persona: mutation must not rewrite existing chat personaSnapshot.
Media: format/size/ownership, failed upload/save cleanup and public/private boundary.
Model: missing usage/policy fails explicitly, no paid provider calls without approval.
Integrated journey: sign in -> publish -> discover -> persona -> send -> regenerate
-> branch -> reload/sign back in. Distinguish test transport from real Privy.
Visual changes: 390/768/1440, overflow/overlap, focus and keyboard navigation.
This initial rules-only change has no new runtime or UI behavior to verify.

Before delivery: npm test, npm run build, git diff --check. Record actual results
in docs/pivot/HANDOFF.md and instruction observations in evals/.
