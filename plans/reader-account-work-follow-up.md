# Account and work-detail follow-up

Owner: current agent, `starlash7/fix-logged-in-pages`, based on integration
`061c630`. No other workspace or owner is being assigned changes.

- [x] Check GitHub PR #14 and latest integration; discard mistaken TCG edits.
- [x] Read current rules, feature map, scope, design, sprint and reference audit.
- [x] Read-only reference inspection: signed-in Crack profile and Uummai menu.
- [x] Baseline install/build, npm test 202/202.
- [x] `user/profile/MyProfile.tsx`, `profile.css`, `useProfile.ts`: responsive identity/activity,
  keep destinations available during profile failure.
- [x] `AccountView.tsx`: separate login identity from saved profile; preserve wallet.
- [x] `discover/WorkPage.tsx`, `work-detail.css`: section navigation and mobile CTA.
- [x] `chat/StartChatSheet.tsx`, `StartChatAccess.tsx`: auth-ready private requests,
  same-sheet login continuation, existing development path only.
- [x] `ReaderAccountMenu.tsx`, `useReaderLogin.ts`: only the initiating login
  surface may reload; release native modal before opening SDK portal.
- [x] Focused regressions: five failures observed, then six new cases pass.
- [x] Browser 390/768/1440px: profile/detail without overflow; editor/error/retry,
  same-work login cancellation/continuation and keyboard focus checked.
- [x] Full tests 208/208, build exit 0, diff review; record HANDOFF and decisions.
- [x] Implementation `7a76e09`; draft [PR #19](https://github.com/starlash7/iruka/pull/19)
  targets `starlash7/clone-repo`. Current feature branch retained; no main merge/deploy.
