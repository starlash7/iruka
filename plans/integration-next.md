# Next integration checklist

## Baseline and ownership

2026-10-15 fetch: integration 8ada036; Docs b7f750e (PR15, targets
starlash7/clone-repo). Current branch stays starlash7/clone-repo.
Unrelated .superpowers/ and output/ are excluded.

| Owner | Files | Remote state at intake |
|---|---|---|
| A model | server/models/**; scoped chat changes by agreement | PR11 9ff5b19, previous work already integrated; no new handoff |
| B studio/media | features/studio, server/studio, api/studio, server/media | PR12 627bb4a, previous work already integrated; no new handoff |
| C persona | PersonasPage, features/user/personas/** | No new remote PR/handoff found |
| D discovery | discover pages/layout and their styles; not auth/API provider | PR13 6909ff8, previous work already integrated; no new handoff |
| Integration | product/core, shared contracts, API routing, migrations, env/packages, common UI/routes, necessary chat glue | PR14 |
| Docs | docs/gitbook/** | PR15; separate review, not automatically merged |

## File checklist

- [x] Fetch, inspect PR heads and Docs decisions; do not remerge ancestor branches.
- [x] AGENTS/CLAUDE/CURRENT_SCOPE/sprint: separate current rules from history.
- [x] decisions/2026-10-15-integration.md: record unresolved operating inputs.
- [x] docs/pivot/handoffs/integration.md: record existing contracts and intake format.
- [ ] Receive A provider decision, adapter contract, usage/safety policy and tests.
- [ ] Receive B storage decision, media contract, ownership/lifecycle and migration needs.
- [ ] Receive C persona mutation API requirements and snapshot tests.
- [ ] Receive D discovery API gaps, route compatibility and visual results.
- [ ] Implement only received/approved common changes sequentially; publish commit IDs.
- [ ] Review and merge completed work in dependency order onto this branch only.
- [ ] Review Docs PR15 diff before separate integration; retain both handoff histories.
- [ ] Run full integrated journeys with real services when credentials/approvals exist.
- [ ] Supply final implementation delta to Docs owner; no automatic message delivery.

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
