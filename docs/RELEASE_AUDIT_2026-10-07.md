# October 7 release audit

This audit checked Iruka source, failure recovery, public HTTP behavior, live
Monad receipts, dependency advisories and GitHub review paths. CUA was not used.

Tested implementation: [`9f08b0c`](https://github.com/starlash7/iruka/commit/9f08b0c93f72840c59b5f15c924859e0b4271e5b).
Docs-only publication is already merged in [PR #1](https://github.com/starlash7/iruka/pull/1).
The [judging guide](./JUDGING_GUIDE.md) identifies the submission branch and CI.

## Reproduced and fixed

| Finding | Result and regression evidence |
| --- | --- |
| Latest CI failed two stale GIWA-only Docs assertions | Assertions now check both chain-specific test assets and selected-contract pricing; Docs remain accurate |
| Account remount could reset a pre-hash transfer lock | App-owned lock rejects both deposit and withdrawal overlap across remounts |
| A hash saved by an old Account instance could escape the new instance's guard | Action boundary checks persisted pending state; original reproduction now makes one send and rejects the second |
| Temporary receipt RPC failure left transfers blocked | Submitted/restored hashes retry confirmation; cleanup cancels retries; denied storage retains the current in-memory hash |
| Slow Keeper preparation could outlive its lease | RPC preparation and local signing precede final ETag renewal; only the surviving owner sends raw bytes; preparation-time confirmation races return canonical results |
| Verifier accepted unrelated successful setup receipts | Requires setup receipts addressed to the contract, OperatorUpdated and matching BatchCommitted fields, in addition to all Pull checks |
| Zero Keeper placeholder could pass deploy preflight | Rejected before credential decoding, RPC or deployment |
| High-severity transitive dependency advisories | Patched socket.io-parser/undici and compatible pinned axios/ws; wallet SDK version retained |

New failure cases were observed failing before their fixes and passing afterward.
Wallet/RPC/Blob regression boundaries use controlled adapters; these tests do
not count as new live transactions or a mounted Privy end-to-end test.

## Observed checks

| Check | Actual result |
| --- | --- |
| `npm test` | 391 passed, 0 failed, 0 skipped |
| `VITE_IRUKA_DEPLOYMENT=giwa npm run build` | Passed; TypeScript and Vite |
| `VITE_IRUKA_DEPLOYMENT=monad npm run build` | Passed; TypeScript and Vite |
| Foundry 1.8 `forge test` | 13 passed |
| Foundry 1.8 `forge test --network monad` | 13 passed |
| Read-only public receipt verifier | Five Pulls and exact native withdrawal verified; setup event checks pass |
| Anonymous desktop 1440×1000 and mobile 390×844 | Monad-to-GIWA selection verified, no page exceptions or document horizontal overflow; screenshots inspected |
| Live HTTP/API checks | App 200; invalid method 405; invalid input 400; foreign origin 403; unauthenticated recovery 401; already-fulfilled #1 returned 200 with index 84 |
| Limited source hygiene check | No tracked private/build paths, no historical .env/.context/.vercel paths, no current private-key/PAT format candidates |
| `npm audit --omit=dev` | 0 critical, 0 high, 26 moderate package findings |
| `git diff --check` | Passed |

The default shell Forge is 1.7.1; the two reported contract runs explicitly used
the locally available 1.8.0 binary matching CI. CI pins Node 24.14.0 and Foundry
1.8.0. Contract modes run locally, not against the deployed contract.

At 04:09 UTC the hardened public verifier found available=95, remaining=95,
nextDrawIndex=5, nextFulfillIndex=5. These are dated observations and can change.
The five Pull and 0.001 test MON withdrawal receipts are the October 6 evidence,
rechecked October 7; no new wallet signing was performed for this audit.

## Limits and remaining work

- Twenty-six moderate advisories remain in the wallet SDK dependency tree.
  The audit does not report a clean dependency/security scan or an external
  security audit. It avoided the suggested incompatible SDK downgrade.
- Wallet/3D bundle-size warnings remain; no mobile performance benchmark was run.
- Pending persistence cannot survive reload/component destruction if browser
  storage is denied. Current-view memory recovery is tested.
- A lease cannot prevent an arbitrary process pause exceeding its TTL after
  renewal; the added test covers slow transaction preparation and owner loss.
- Current recovery operates one initial Debut batch, one queued request per cron
  invocation. The central operator and committed-seed mechanism remain trust
  boundaries. Commercial custody, NFT, USDC and shipping remain planned.
- New tests and anonymous browser checks do not repeat the historical signed
  Privy Pull/withdrawal UI scenarios. Their existing receipt/screenshots remain
  separate evidence in the Monad verification report.
- Demo/pitch videos and final platform submission remain outstanding.

## Publication

Production rollout and release PR CI are recorded after their observed results.
