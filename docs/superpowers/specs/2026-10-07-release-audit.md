# Monad release and judging audit

Audit the existing Iruka flow, GIWA/Monad chain boundaries, production HTTP
behavior, dependencies, and GitHub presentation. No CUA, private-key disclosure,
live signing, new product features, or other workspace changes.

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
