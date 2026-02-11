# Delta Plan

## A) Executive Summary
- Next.js 16 + React 19 app with API routes and component-heavy UI under `src/app` and `src/components`.
- Prisma client is imported from generated output `src/generated/prisma/client` via `src/lib/prisma.ts`.
- Build currently depends on generated Prisma artifacts being present locally.
- Baseline lint is red with existing React hook rule violations across several components.
- Build and typecheck are otherwise healthy once Prisma client is generated.

### Key risks
- Fresh clones fail `npm run build` without manual `prisma generate`.
- Verification posture is inconsistent because lint is currently red and no explicit typecheck script exists.
- Team onboarding depends on README tribal knowledge for Prisma generation.

### Improvement themes (prioritized)
1. Build reproducibility (automatic Prisma generation).
2. Verification ergonomics (first-class typecheck script).
3. Operational traceability (session artifacts + checkpoints).

## B) Constraints & Invariants
- Keep architecture and runtime behavior unchanged.
- Do not alter database schema or API contracts.
- Preserve existing lint rule set; document current failures instead of suppressing them.
- Non-goal: fixing all pre-existing lint violations in this delta.

## C) Proposed Changes by Theme
### Theme 1: Build reproducibility
- Current: `README` asks users to run `npx prisma generate` manually.
- Change: add `predev`/`prebuild` hooks that run `prisma generate` automatically.
- Why: prevents missing-client build failures in fresh environments.
- Tradeoff: small extra startup/build time.
- Scope: `package.json`, docs update.

### Theme 2: Verification ergonomics
- Current: no explicit typecheck script.
- Change: add `typecheck` script (`tsc --noEmit`).
- Why: fast contract verification in local and CI workflows.
- Scope: script only.

### Theme 3: Session durability
- Current: no codified session logs/checkpoints.
- Change: add `codex/*.md` artifacts with plan, decisions, verification, checkpoints.
- Why: interruption-safe audit trail.

## D) File/Module Delta
- ADD
  - `codex/SESSION_LOG.md`
  - `codex/PLAN.md`
  - `codex/DECISIONS.md`
  - `codex/CHECKPOINTS.md`
  - `codex/VERIFICATION.md`
  - `codex/CHANGELOG_DRAFT.md`
- MODIFY
  - `package.json` — automation + verification scripts.
  - `README.md` — align setup docs with script behavior.
- REMOVE/DEPRECATE
  - None.

## E) Data Models & API Contracts
- Current models in `prisma/schema.prisma` unchanged.
- No API route contract changes.
- No migrations required.

## F) Implementation Sequence
1. Add codex planning/logging artifacts.
   - Verify: file presence and markdown sanity.
   - Rollback: remove `codex/` files.
2. Add npm scripts (`prisma:generate`, `typecheck`, `predev`, `prebuild`).
   - Verify: `npm run prisma:generate`, `npm run typecheck`.
   - Rollback: restore prior scripts block.
3. Update README onboarding steps for auto-generation behavior.
   - Verify: read-through consistency.
   - Rollback: revert README section.
4. Final verification pass and changelog draft.
   - Verify: build/typecheck/generate; lint recorded as known baseline red.

## G) Error Handling & Edge Cases
- Build edge case addressed: missing generated Prisma client on fresh clone.
- Lint failures remain tracked as deferred technical debt, not suppressed.

## H) Integration & Testing Strategy
- Use script-level verification:
  - `npm run prisma:generate`
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint` (known baseline red)
- DoD: build reproducible from clean environment without manual Prisma generation.

## I) Assumptions & Judgment Calls
- Assumption: auto-generating Prisma client before build/dev is acceptable workflow cost.
- Judgment call: defer lint cleanup because violations are broad and unrelated to the narrow reliability delta.
