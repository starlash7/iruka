# Monad release and judging audit

Audit the existing Iruka flow, GIWA/Monad chain boundaries, production HTTP
behavior, dependencies, and GitHub presentation. No CUA, private-key disclosure,
new product features, or other workspace changes. Previously authorized real
testnet checks use only the existing dedicated test wallet, without browser
wallet signing.

The root owns all edits on isolated Conductor workspace branch
`monad-release-audit`. Frontend and Keeper reviewers are read-only. Inspect
original code and reproduce concrete defects before minimal changes; rerun
relevant regression tests and full release gates afterward.

Success criteria: Node suite passes; both deployment builds pass; Foundry and
Monad-specific contract modes pass with supported tooling; public receipts
reverify; public app/API/Docs respond correctly; a reviewable release PR and
judge route connect source, CI, live product, evidence and limitations.
Retain existing GIWA records and all unmerged workspace work. Do not rewrite
history, rename branches, or call historical screenshots fresh browser tests.

Final development-tool follow-up uses isolated branch `monad-build-audit`:
root owns package-lock.json and audit documentation; review is read-only.
Patch only the four development dependency advisories found by the full audit,
then rerun npm ci, the Node suite, both builds and both dependency audit modes.
