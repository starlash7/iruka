# Signed-in account and work-detail reference follow-up

Baseline: `061c630` from integration PR #14, not the historical `origin/main`
TCG tree. The user clarified that this is the existing reverse-engineering
effort. Keep the current feature branch and the integrated Korean/pink product.

Use `plans/reader-ux-reference-audit.md` and the directly inspected signed-in
Crack profile/menu and Uummai account menu as information-hierarchy references.
Separate profile identity, activity and login settings; keep persona distinct.
Do not copy competitor content, artwork, account data, commerce or social stats.
Some competitor work details are restricted; do not change their filters/settings.

## Changes

- Compact, responsive My Page profile card and direct activity destinations.
  Activity links must remain usable when profile loading fails.
- Distinguish saved profile from authentication identity in account settings;
  preserve optional wallet/library functionality without a second promotional hero.
- Work detail: cover/title, existing public sections with anchor navigation,
  opening previews, and one reachable mobile conversation-start action.
- Gate start-sheet private data on real authentication readiness. Login inside
  the sheet resumes the same work; do not force wallet setup or reload the page.
  Existing explicit development fixtures remain isolated from production auth.

No new APIs, dependencies, creator identities, counts, paid calls or deployment.
Preserve public/private boundaries, profile ownership and existing chat snapshots.

## Verification

Focused tests for profile error/activity, auth identity, public work sections and
start-sheet session states; then full tests/build. Inspect 390/768/1440px layouts
and keyboard/modal behavior with original components in a local test harness.
Controlled sessions/API transport are not evidence of real Privy OAuth or a
live model call. Record actual results and limits before committing/draft PR.
