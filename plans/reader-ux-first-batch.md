# Reader UX First Batch Implementation Plan

Approved scope: reader-ux-reference-audit.md, 2026-10-30 user approval.
Preserve Korean white/pink UI, existing APIs, authentication and credit behavior.
No dependencies, main changes, deployment or paid requests.

## Ownership

- Chat worker: src/features/chat/**, tests/chat-ux-states.test.mjs.
- Studio worker: src/features/studio/**, tests/studio-ux-readiness.test.mjs.
- Integration: discovery files, discovery tests, documentation and final checks.
- No concurrent edits to shared contracts, authentication, tokens or server code.

## Checklist

- [x] Inspect rules, existing code and approved audit; assign disjoint files.
- [x] Discovery: failing tests for filter reset, loading grid and unavailable start.
- [x] Discovery: implement using existing pink tokens; mobile detail single-column.
- [x] Chat: pending/model status, consistent regenerate gating, modal-local errors.
- [x] Studio: publish readiness, published-version distinction and exact-field focus.
- [x] Review worker patches and focused tests; P2 section-only focus fixed and re-reviewed.
- [x] Run npm test (192/192), npm run build (exit 0), git diff --check.
- [x] Ego lite local visual checks; distinguish fixture from authenticated behavior.
- [ ] Record limitations in HANDOFF; commit current branch and update Draft PR.

Final validation: full test log .context/ux-tests-final.log; build log
.context/ux-build-final.log (existing bundle-size warning). Exact-field focus has
unit/markup coverage and static review; live authenticated editor flow remains
unverified because local server Privy configuration is incomplete.

Deferred: new media-binding contract, continue-chat lookup, auth return-route changes,
profile identity redesign and persona explanatory copy. This batch fixes existing
critical flows before adding APIs or broadening the redesign.
