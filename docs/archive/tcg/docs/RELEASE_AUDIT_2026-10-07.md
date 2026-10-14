# October 7 release audit

This audit checked Iruka source, failure recovery, public HTTP behavior, live
Monad receipts, dependency advisories and GitHub review paths. CUA was not used.

Implementation audited before the tooling follow-up: [`9f08b0c`](https://github.com/starlash7/iruka/commit/9f08b0c93f72840c59b5f15c924859e0b4271e5b).
Docs-only publication is already merged in [PR #1](https://github.com/starlash7/iruka/pull/1).

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
| Full audit also found four high development-tool findings | Compatible Browserslist, Nano ID, PostCSS and source-map-js patches; all nine changed lockfile entries are development-only |

New failure cases were observed failing before their fixes and passing afterward.
Wallet/RPC/Blob regression boundaries use controlled adapters; these tests do
not count as new live transactions or a mounted Privy end-to-end test.

## Initial audit checks

| Check | Actual result |
| --- | --- |
| `npm test` | 391 passed, 0 failed, 0 skipped |
| `VITE_IRUKA_DEPLOYMENT=giwa npm run build` | Passed; TypeScript and Vite |
| `VITE_IRUKA_DEPLOYMENT=monad npm run build` | Passed; TypeScript and Vite |
| Foundry 1.8 `forge test` | 13 passed |
| Foundry 1.8 `forge test --network monad` | 13 passed |
| Read-only public receipt verifier | Six Pulls and exact native withdrawal verified; setup event checks pass |
| Anonymous desktop 1440×1000 and mobile 390×844 | Monad-to-GIWA selection verified, no page exceptions or document horizontal overflow; screenshots inspected |
| Live HTTP/API checks | App 200; invalid method 405; invalid input 400; foreign origin 403; unauthenticated recovery 401; already-fulfilled #1 returned 200 with index 84 |
| Limited source hygiene check | No tracked private/build paths, no historical .env/.context/.vercel paths, no current private-key/PAT format candidates |
| `npm audit --omit=dev` | 0 critical, 0 high, 26 moderate package findings |
| `npm audit` including development tools | 0 critical, 0 high, 26 moderate package findings after the tooling follow-up |
| `git diff --check` | Passed |

The default shell Forge is 1.7.1; the two reported contract runs explicitly used
the locally available 1.8.0 binary matching CI. CI pins Node 24.14.0 and Foundry
1.8.0. Contract modes run locally, not against the deployed contract.

The final tooling follow-up changed Browserslist to 4.29.3, Nano ID to 3.3.20,
PostCSS to 8.5.29 and source-map-js to 1.2.2, within their parent dependency
ranges. Five Browserslist data dependencies also updated. No runtime/wallet
SDK entry or package.json declaration changed. A fresh `npm ci`, all 391 tests
and both deployment builds were rerun; both audit modes report the same 26
moderate findings. Maintainer advisories:
[Browserslist](https://github.com/advisories/GHSA-c83g-rgw3-j3cx),
[Nano ID](https://github.com/advisories/GHSA-2v37-7h3g-55p8),
[PostCSS](https://github.com/advisories/GHSA-r28c-9q8g-f849),
[source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
The development-only patch and its checks are separately reviewable in
[PR #3](https://github.com/starlash7/iruka/pull/3).

At 04:09 UTC the hardened public verifier found available=95, remaining=95,
nextDrawIndex=5, nextFulfillIndex=5. These are dated observations and can change.
The first five Pulls and 0.001 test MON withdrawal are October 6 evidence,
rechecked October 7. One additional real test-wallet Pull (#6) was signed on
October 7 after deploying these fixes; no browser wallet signing was performed.

The deployed desktop login UI also showed MetaMask, Phantom and OKX Wallet;
selecting email/social methods opened the email field. This was a login-modal
smoke check without authentication or browser signing.

Public screenshots from the deployed audit source:

[Desktop 1440×1000](./assets/audit-monad-desktop-2026-10-07.png) ·
[Mobile 390×844](./assets/audit-monad-mobile-2026-10-07.png)

## Limits and remaining work

- Twenty-six moderate advisories remain in the wallet SDK dependency tree.
  The audit does not report a clean dependency/security scan or an external
  security audit. It avoided the suggested incompatible SDK downgrade.
- The testnet panel displays initial rarity tiers; remaining per-rarity odds
  are not yet recalculated, as described in Packs and Odds.
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

## Publication

[PR #2](https://github.com/starlash7/iruka/pull/2) exposes the complete Monad
implementation against the published foundation. Its
[verification run](https://github.com/starlash7/iruka/actions/runs/37571664026)
passed both jobs on final PR source `6ae9aa2`.
PR #2 merged as `aa3847c` after all checks passed; GitHub now recognizes the
MIT license on its default `main` branch. `monad` is retained and synchronized
with the published release. Merged Docs task branches were removed; other
Conductor workspace branches were preserved.

The same implementation at source `94b1aa7` was deployed to the existing
Iruka production project as
`dpl_D74xPyyM2KtBkBLgQCt81qM8E2L8`, Ready and aliased to playiruka.space.
A dedicated test wallet requested one additional position at 0.00001 test MON.
The live API returned 200/submitted; the raw Keeper transaction mined
successfully and exactly one matching fulfillment event assigned index 75.

- [Pull #6 request](https://testnet.monadvision.com/tx/0xd213e6238e815566e800ac8e0b61d76d09c7f7288d89344456c0201d47997ff9)
- [Pull #6 fulfillment](https://testnet.monadvision.com/tx/0xfe777f3fe51f60b875d3bbf319374cee8188a4f4bf02ec577069146988035d4c)
- [Public JSON](./evidence/monad-testnet.json), including deployment/source and HTTP observation

At 04:24:11 UTC the batch had 94 available/remaining positions and both draw
counters were 6. The original five inventory indices and index 75 are unique.
The read-only verifier now checks all six requests.

## Evidence and release configuration follow-up

A later review of `ccb338b` identified three validation gaps still present after
the documentation cleanup: the top-level batch snapshot retained five-Pull
counters, CI compiled Monad without a contract address, and custom browser RPCs
could be excluded by the deployed CSP. The original snapshot was a dated
October 6 observation; its receipts were valid, but the latest JSON and README
did not clearly distinguish it from the six-Pull record.

The latest `batchSnapshot` now records six completed Pulls and 94 remaining
positions at checkpoint block `68874602`. The five-Pull checkpoint at
`68637128` remains in `historicalBatchSnapshots`. These exact state anchors are
after the corresponding fulfillment transactions; they are not invented
original observation capture blocks. The original observation timestamps and
transaction hashes remain preserved.

The verifier now compares available, remaining, nextDrawIndex and
nextFulfillIndex for every snapshot using a block-pinned `getBatch` call.
Missing anchors, changed counters, unavailable historical RPC state, a latest
checkpoint predating a recorded fulfillment, a stale RPC head and an invalid
release checkpoint/Pull relationship fail verification. Later legitimate Pulls
may change live counters without invalidating historical checkpoints. The
returned current counters include their separately captured block number.

`IRUKA_RELEASE_VALIDATE=1` and Vercel production builds require the browser's
Monad address to match the public deployment evidence. Both selectable
networks' browser RPCs must use HTTPS and have their exact origins explicitly
allowed by `vercel.json`'s `connect-src`. CI derives its address from the public
JSON and enables this gate. Ordinary development builds retain the existing
disabled-Pull behavior when the Monad address is missing. The policy was not
broadened to wildcard RPC origins.

| Follow-up check | Actual result |
| --- | --- |
| `npm test` | 421 passed, 0 failed, 0 skipped; 30 additional configuration/checkpoint regressions |
| Monad build with evidenced address and `IRUKA_RELEASE_VALIDATE=1` | Passed; TypeScript and Vite |
| Build with privately downloaded Iruka production environment and release gate enabled | Passed; GIWA default, evidenced Monad browser address |
| Production HTTP/CSP comparison against configured browser RPCs | App 200; both RPC origins allowed by the deployed header |
| Foundry 1.8 default and Monad contract modes | 13 passed in each mode |
| Read-only verifier at 05:20:38 UTC, block `68885831` | Six Pulls, all recorded checkpoints and exact 0.001 test MON withdrawal verified; counters 94/94/6/6 |
| Mintlify `mint validate` and `mint broken-links` | Build valid; no broken links |
| `git diff --check` | Passed |

The new failure assertions were observed failing before their corresponding
fixes. Production environment exports remain ignored under `.context`; secret
values were not published. The downloaded frontend configuration check does
not validate server-only secrets or prove a new signed wallet transaction.
No CUA, new login, browser signing or fresh Pull was performed in this
follow-up. Existing signed-flow observations remain historical evidence.
Build configuration validation, receipt verification and browser end-to-end
testing are separate checks. Existing dependency and bundle-size limitations
above remain applicable.

## Wallet assets and network menu follow-up

The MON token and Monad Testnet network previously rendered the same text
initials. They now use their separate, unmodified official SVG assets, including
the funding method, deposit, withdrawal and asset-options surfaces. Source and
brand attribution are recorded in [THIRD_PARTY.md](./THIRD_PARTY.md). GIWA and
Ethereum assets remain intact.

The header network control now uses Iruka's white/blue pill and popover styles.
It exposes the selected network, supports keyboard navigation and retains the
existing full reload when changing networks. An observed tablet header overlap
was fixed with a two-row layout between 821 and 1200px. A reproduced Shift+Tab
focus problem was fixed, and native exclusive details grouping prevents token
and chain options from remaining open together.

| Check | Actual result |
| --- | --- |
| `npm test` | 423 passed, 0 failed, 0 skipped; includes both networks' wallet asset regressions |
| GIWA and Monad release-validation builds | Passed; TypeScript and Vite, using the configured public Monad address |
| Actual app header in headless Chromium | Passed at 1440, 1200, 1101, 900, 821, 844, 390 and 320px; no measured control overlap or horizontal overflow |
| Header keyboard and switching | Arrow keys, Home/End, Tab/Shift+Tab, Escape, outside click, current-network dismissal and route/query/hash preservation passed |
| Original wallet components in a private browser fixture | Deposit, withdrawal, funding and token/chain options passed at desktop, 375/320px mobile, Korean Monad and English GIWA; assets loaded and operation lock closed/disabled the network menu |
| Independent read-only review | No remaining findings after the keyboard and tablet fixes |

Screenshots were visually inspected locally. The wallet fixture uses unsigned
placeholder state and cannot send a transaction; it verifies the original
components' rendering and interactions, not authenticated production custody,
a fresh transfer or a Pull. No CUA or new wallet signing was performed. Private
fixtures, screenshots and environment exports remain excluded from Git and
Vercel uploads. Existing bundle-size warnings remain applicable.
