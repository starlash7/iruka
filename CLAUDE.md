# CLAUDE.md - Iruka Working Rules

## 1. Build And Lint

- Run build/lint only before AI file generation or right before release.
- During normal edits, prefer the smallest useful verification for the changed surface.

## 2. Code Editing Principles

- Do not add unnecessary copy or duplicate messaging.
- Do not rewrite existing visible copy unless the user asks for it.
- Do not edit files outside the requested scope.
- Do not delete existing features.
- Before adding a new dependency, check whether the standard library or existing packages are enough.
- Prefer the smallest code that solves the request.

## 3. Coding Guide

- Use `karpathy-guidelines` as the base rule set.
- One file should have one role.
- If a file grows beyond 200 lines, split it when touching that area.
- Do not create catch-all `utils` files.
- Use clear verb+noun function names, such as `getStationList` or `calculateReward`.

## 4. Tooling Preference

- Do not use Ponytail mode or Ponytail skills for this project unless the user explicitly asks.
