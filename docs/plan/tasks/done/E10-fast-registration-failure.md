# E10 — A missing registration fails in seconds, with one clear message

**Goal:** when a new component is not registered in the shared inventories (AGENTS.md "New components"),
`pnpm test:changed` stops within about a minute and prints the missing registration, instead of running for tens of
minutes and burying it under unrelated failures. Found on 2026-11-23 after `5fe6a5a` (inventory specs for new
components in `test:changed`).

## Evidence (2026-11-23, H8 wave review)

A fake component `fake-widget` (only `registry/ui/fake-widget.tsx` + `registry/items/fake-widget.json`, no fixtures,
no stories, no registrations) was added on a clean branch and `PORT=… pnpm test:changed` was run:

- Good: `test:changed` detected the new component and added the 5 inventory specs without a full-suite fallback.
  `scripts/i18n-audit.mjs:321` threw `Missing owning card for fake-widget` in the first ~5 minutes.
- Bad: once the audit script threw, every test in `tests/i18n.spec.ts` that calls `readSourceAudit()` (4 call sites,
  each re-running `scripts/i18n-audit.mjs --json`) failed with the same stack, and the visual and i18n tests ran on up
  to the 2-minute test timeout each. The run was stopped by hand after **40 minutes**.
- The default specs can't take a component that has no fixtures or stories yet: `tests/visual.spec.ts` fails
  `VISUAL_ONLY=fake-widget: no fixtures matched`, and the Storybook stage fails
  `STORYBOOK_ONLY=fake-widget: no stories matched whole component ids`. These are a second, unrelated failure for a
  component under construction.

## Do

1. **Registration preflight before Playwright.** In `scripts/test-changed.mjs`, when `newComponents` or `inventory` is
   non-empty, first run the registration checks directly in Node (no browser, no server): the owner lookup of
   `tests/a11y-tree-baseline.ts` (`componentOwner` / `caseOwner` for each new component and its fixture ids), and
   `scripts/i18n-audit.mjs --json` and `scripts/a11y-audit.mjs` (or their exported checks). On failure, print each
   missing registration on its own line with the file to edit (e.g.
   `fake-widget: no P-card owner — add it to groups in tests/a11y-tree-baseline.ts`), and exit 1 **without starting
   Playwright**. Target: under 60 seconds.
2. **One failure, not many.** In `tests/i18n.spec.ts`, compute the source audit once per worker (module-level lazy
   value or `beforeAll`) so an audit-script error fails one test with the script's message, and the dependent tests
   are skipped or fail fast with "source audit failed (see …)", without re-running the script. Do the same for any other
   inventory spec that re-runs a generator per test (check `tests/a11y-tree-audit.spec.ts`,
   `tests/usage-guidance.spec.ts`).
3. **A component under construction doesn't fail on missing fixtures/stories in `test:changed`.** When a new component
   has no paired fixtures, print `fake-widget: no paired fixtures yet — visual comparison skipped` and leave
   `tests/visual.spec.ts` out for it. The same goes for missing stories and the Storybook stage. Leave the guard in
   `tests/visual.spec.ts` and `tests-storybook/storybook.spec.ts` unchanged for explicit `VISUAL_ONLY` /
   `STORYBOOK_ONLY` runs. The Definition of done still requires fixtures and stories; only the scoped inner loop gets
   quieter.
4. Unit tests for the new `scripts/changed-scope.mjs` / preflight logic (same style as the existing classifier tests),
   including: unregistered new component → preflight fails with the named file; registered one → passes; new component
   without fixtures → visual spec not selected.

## Files

`scripts/test-changed.mjs`, `scripts/changed-scope.mjs` (+ `.d.mts`), `tests/i18n.spec.ts`, optionally
`tests/a11y-tree-audit.spec.ts` / `tests/usage-guidance.spec.ts` (only the audit-loading part), the classifier unit
test, `AGENTS.md` (one line under "New components" naming the preflight), `docs/plan/README.md`. No registry,
fixture or baseline edits; no baseline count changes.

## Budget (hard)

About 1 hour, 0 CI pushes, at most 2 hypotheses per failing check. This touches shared test tooling, so at the end run
the 5 inventory specs once on any port other than 4350, plus the repro below. Full suites are not needed (no runtime
code changes).

## Acceptance

1. Repro: on a scratch branch, add `registry/ui/fake-widget.tsx` + `registry/items/fake-widget.json` only, run
   `PORT=4310 pnpm test:changed`. It exits 1 in **under 2 minutes**, with the missing registrations listed one per line
   and no Playwright run. Delete the fake files afterwards (working tree clean).
2. Register the fake component's owner only (no fixtures/stories): preflight passes, the visual and Storybook stages
   print the "skipped" notices, and the run finishes without a `no fixtures matched` / `no stories matched` failure.
   Delete it again.
3. On clean main, `PORT=4310 pnpm test:summary tests/a11y-tree.spec.ts tests/a11y-tree-audit.spec.ts
   tests/a11y-tree-customizations.spec.ts tests/i18n.spec.ts tests/usage-guidance.spec.ts` passes: 0 failed, 0 flaky
   (copy the summary line).
4. Tick E10 in `docs/plan/README.md`; `node scripts/plan-check.mjs` passes. Don't push or merge.
