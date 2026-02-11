# Changelog Draft

## Theme: Build Reproducibility
- Added npm lifecycle hooks so Prisma client generation runs automatically before `dev` and `build`.
- This removes a fresh-clone failure mode where `@/generated/prisma/client` was missing at build time.

## Theme: Verification Ergonomics
- Added a dedicated `typecheck` script (`tsc --noEmit`) to support faster verification loops and CI friendliness.

## Theme: Documentation + Session Durability
- Updated README setup flow to remove the now-redundant manual `prisma generate` step and document automatic behavior.
- Added codex session artifacts (`PLAN`, `SESSION_LOG`, `DECISIONS`, `CHECKPOINTS`, `VERIFICATION`) for interruption-safe continuity.

## Deferred
- Existing lint failures from `react-hooks/set-state-in-effect` and several warnings remain and should be handled in a focused lint-remediation tranche.
