# Release audit checklist

- [x] Read working rules, feature map, sprint, source and evidence.
- [x] Assign read-only frontend and Keeper review; root owns edits.
- [x] Reproduce and fix stale GIWA-only assertions in tests/docs-content.test.mjs.
- [x] Reproduce account transfer remount overlap; smallest session-level fix.
- [x] Harden verifier setup events, Keeper preparation fencing and zero-operator preflight.
- [x] Review compatible dependency patches and remaining advisories.
- [x] Run Node suite, both builds and both Foundry modes.
- [x] Reverify live receipt JSON and HTTP API guards without signing.
- [x] Check desktop/mobile anonymous routes with headless browser, no CUA.
- [x] Inspect public source/README/license/evidence/history and branch ancestry.
- [ ] Record observed results and material decisions; open release PR with CI.
