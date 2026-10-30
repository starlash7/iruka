# Integration rule evaluation

- Latest instructions override Wave 01 placeholders: routes now load the actual
  reader/studio/credits implementations. Old TCG features were not restored.
- Later approved wallet/account work is preserved; chat identity and ownership
  remain Privy DID based. No wallet transaction was submitted in this review.
- Pink shared UI matches the C handoff; no new dependency or artwork was added.
- Real service integration uses one transaction-aware DB for chat and credits.
  Tests cover publication, ownership, replay, regeneration, branching, memo,
  failure refund and expired-lease recovery.
- Local deterministic model/grants are opt-in and reject hosted production.
  Browser verification injects a test identity in its isolated test transport,
  not application authentication; OAuth/OTP success is not claimed.
- No main merge, deployment, paid model call or chain write. Unrelated
  `.superpowers/` and `output/` are not included.
