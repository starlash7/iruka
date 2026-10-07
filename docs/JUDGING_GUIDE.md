# Iruka judging guide

Start with [Monad Vending](https://playiruka.space/?network=monad#pull), then
follow the same result through its explorer receipt and public source.

| Review step | Where to look |
| --- | --- |
| Submitted source | [monad branch](https://github.com/starlash7/iruka/tree/monad) |
| What changed | [Monad release PR](https://github.com/starlash7/iruka/pull/2) and [development-tool security patch](https://github.com/starlash7/iruka/pull/3) |
| Current checks and fixes | [October 7 release audit](./RELEASE_AUDIT_2026-10-07.md) |
| Automated verification | [verify workflow on monad](https://github.com/starlash7/iruka/actions/workflows/verify.yml?query=branch%3Amonad) |
| Live Pull/recovery evidence | [Monad verification](./MONAD_VERIFICATION.md) and [receipt JSON](./evidence/monad-testnet.json) |
| Product and network boundaries | [Public Docs](https://docs.playiruka.space/overview) |
| Open-source terms and dependencies | [MIT](../LICENSE) and [attribution](./THIRD_PARTY.md) |

## Reproduce

```bash
git clone --branch monad https://github.com/starlash7/iruka.git
cd iruka
nvm install
nvm use
npm ci
npm test
npm run test:contracts
# Requires Foundry 1.8+
forge test --network monad
VITE_IRUKA_DEPLOYMENT=giwa npm run build
VITE_IRUKA_DEPLOYMENT=monad npm run build
node --experimental-strip-types scripts/monad/verify-live-evidence.mjs
```

These checks do not need private manifests, wallet keys or an Iruka account.
The README documents frontend and independent full-stack setup. A frontend-only
preview cannot provide Keeper APIs or decrypt the deployed private manifest.

## Branch and build history

`main` is the canonical published source after the reviewed Monad release.
`monad` retains the submitted implementation and its incremental history.
[PR #2](https://github.com/starlash7/iruka/pull/2) records the implementation
review against the published foundation. The previously merged Docs-only PR is
[#1](https://github.com/starlash7/iruka/pull/1).

The pre-existing project snapshot is
[`c2cce94`](https://github.com/starlash7/iruka/commit/c2cce94).
The Monad deployment, integration, hardening and evidence commits remain in the
branch history. Published Docs were merged back before opening the release PR,
so its diff focuses on the remaining implementation. Other Conductor workspace
branches retain their owners' work; they are not alternate submission versions.

GIWA remains available. Monad uses a separate contract, committed batch,
manifest, Keeper lease, pending state and collection. Test MON is not a
commercial payment. The contract uses committed seeds, not VRF, and does not
mint NFTs or prove physical custody/redemption.

See [submission checklist](./internal/metropolis-submission-2026.md) for the
remaining demo video, pitch video and final platform submission. Tests and a
public repository do not establish hackathon eligibility by themselves.
