# E9 — Linux-only failures in the accessibility tests (milestone CI after wave E)

**Goal:** main's CI is green again. The first milestone push after wave E (run `44688788089`, `e5b11c0`) failed two of
11 jobs. Every failure is in a test E4/E5 added, and all of them pass on macOS (local milestone: main 1,807 passed,
Storybook 4,344 passed). Owner's decision, 2026-11-20.

Run in one Codex session on branch `codex/E9`, worktree `.worktrees/E9`. Read `AGENTS.md` (Verification budget,
tiered verification, rule 6 "tests must be deterministic") first. GitHub Pages deployed and is live; only CI is red.

## What failed (CI and reproduced in `scripts/ci-local.sh`, the same Playwright image)

| Test | On Linux | On macOS |
|---|---|---|
| `tests/a11y-tree-sapui5.spec.ts` › all OpenUI5 accessibility trees | **18 difference lines**, all `openui5/ltr` AdaptFiltersDialog (4 cases, owner P4) and VariantManagement (6 cases, owner P6): `missing-node` / `extra-node` at dialog child paths, e.g. `/ax/0/children/1/children/3` missing, `/ax/0/children/6` extra | passes |
| `tests/segmented-button.spec.ts` › `<root|item> <channel> reaches the UI5 owning element` | **6 of 8 time out at 30 s** in `ci-local.sh` (1 on CI) | passes |
| `tests/a11y-tree.spec.ts` › all Web Component accessibility trees ltr | timeout at 300 s (CI only) | passes |
| `tests/a11y.spec.ts` › docs page has no axe violations (sap_horizon, sap_horizon_dark) | timeout at 30 s (CI only) | passes |

The CI timing warning fired 11 times in that run: shard 1 (the one with the tree and docs-axe specs) ran its
non-visual tests for 10m37s.

## What to find out (evidence first, no guesses)

1. **OpenUI5 tree differences.** Compare the Linux capture (`test-results/a11y-tree-report.json` from
   `scripts/ci-local.sh tests/a11y-tree-sapui5.spec.ts`) with a macOS capture of the same cases. Is the difference in
   *our* tree or *UI5's* tree, and why does it depend on the platform? Likely suspects: popup open timing (the
   capture runs before the OpenUI5 dialog finishes rendering under slower Linux), font metrics changing layout,
   or a platform-dependent attribute. Fix the cause so both platforms produce the same tree:
   - a capture that waits on a real readiness signal (rule 6: wait for the state, never a sleep), or
   - a normalization in the tree comparison that is justified and narrow (e.g. a platform-only wrapper node), with a
     comment naming the UI5/OpenUI5 source.
   **Don't edit the baseline entries** to make Linux pass, and don't add `a11yDiff` for this.
2. **SegmentedButton timeouts.** Each test opens a second page on `/ui5.html` (the whole UI5 reference page) only to
   read one fixture. Find which wait never resolves on Linux (the trace in the artifact, or a headless probe). If the
   test simply loads too much, make it load only the fixture it reads (e.g. the existing `&only=<id>` page option the
   phone tests use) rather than raising timeouts.
3. **Tree ltr / docs axe timeouts.** Check whether they are the same slowness (full-page loads on a loaded shard).
   Prefer making the test cheaper (scope, `only=`) or rebalancing shards so they don't sit together; raise a timeout
   only with a measured reason in a comment.

## Files

`tests/a11y-tree*.ts` / `tests/a11y-tree-sapui5.spec.ts` (capture/normalization only), `tests/segmented-button.spec.ts`,
`tests/a11y.spec.ts`, `docs/src/ui5-main.ts` / `sapui5/webapp/**` only if a readiness signal is genuinely missing,
`.github/workflows/ci.yml` (shard balance only), `docs/plan/README.md`. Nothing in `registry/`. No baseline edits.

## Budget (hard)

About 2 hours. Reproduce with `scripts/ci-local.sh <specs>` locally before any push. **At most 2 CI rounds** on your own
branch (open a PR or use `workflow_dispatch`); never push main. At most 2 hypotheses per failing test. Shared-file card:
at the end, full main suite once and full Storybook suite once locally, plus `ci-local.sh` for the four specs above.
At a limit: commit, write `docs/plan/returns/E9.md`, stop.

## Acceptance

1. `scripts/ci-local.sh tests/a11y-tree-sapui5.spec.ts tests/segmented-button.spec.ts tests/a11y-tree.spec.ts tests/a11y.spec.ts`: 0 failed.
2. The CI run on `codex/E9` is green; no shard over 12 minutes; the timing warning doesn't fire for the shard that
   had the tree specs.
3. Baseline files byte-identical to main. macOS full main ×1 and Storybook ×1: 0 failed, 0 flaky.
4. Tick E9. Open a PR from `codex/E9`; don't merge.

## Final message

The cause of each failure (with file:line), the fix, before/after shard timings, CI rounds and full-suite runs used.
