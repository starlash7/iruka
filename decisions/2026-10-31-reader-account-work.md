# Account/work reference follow-up

- GitHub PR #14 (`starlash7/clone-repo`, `061c630`) is the current story-platform
  integration. `origin/main` is still the older TCG product. This workspace was
  fast-forwarded to the integration head, preserving its current feature branch.
  Initial TCG edits were discarded; their private backup is not delivered.
- Reuse the approved reference audit and actual read-only signed-in profile/menu
  observations. Competitor private data/assets are not copied into the repository.
  Restricted detail views were left restricted, with no settings changed.
- Fix existing presentation and start-sheet auth boundaries with current DTOs.
  Creator display names, social metrics, payments and continue-chat lookup remain
  outside this change. No speculative API fields or custody claims are added.
- Real Privy configuration, OAuth/OTP, remote DB and live model generation remain
  separate operational verification gates. UI fixtures must be labelled as such.
- Login callbacks are shared SDK events. Only the initiating header login may
  reload, so a start-sheet login preserves the selected work. The sheet closes
  its native top layer before opening the SDK portal, then restores on success
  or cancellation. A reproduced focus-return gap was fixed at the work trigger.
- Verification: 208 Node tests passed; TypeScript/server/Vite build passed with
  pre-existing SDK annotation/chunk-size warnings. Original components with
  explicitly synthetic local auth/HTTP adapters passed desktop/mobile UI checks.
  This does not verify real OAuth, a production profile write or model generation.
