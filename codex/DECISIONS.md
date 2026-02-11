# Decisions

1. **Automate Prisma generation via npm lifecycle scripts**
   - Context: build fails when generated client is absent.
   - Decision: add `predev` and `prebuild` hooks to run `prisma generate`.
   - Alternative rejected: commit generated client artifacts directly.

2. **Add explicit typecheck command**
   - Context: no dedicated script for TS contract verification.
   - Decision: add `typecheck` script with `tsc --noEmit`.
   - Alternative rejected: rely on build-only typecheck (slower feedback loop).

3. **Do not disable lint rules in this delta**
   - Context: existing lint errors are pre-existing and broad.
   - Decision: keep rules intact; document failures as known baseline issues.
   - Alternative rejected: turning off `react-hooks/set-state-in-effect` (would weaken guarantees).
