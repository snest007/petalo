# Review and merge (reviewer)

How a returned card branch is checked, merged into local `main`, or turned into a follow-up card. Agent-neutral.
Run it in the orchestrator's checkout (a worktree on its own branch), never by editing the main checkout's working
tree; `main` only moves by fast-forward from there. Read `/AGENTS.md` and [RUN.md](RUN.md) first.

## 1. Verify the claims (before believing the final message)

On the card's branch / worktree:

1. `git status --short` (clean), `git log --oneline main..<branch>`, `git diff --stat main...<branch>`.
2. Read `docs/plan/returns/<ID>.md` if present and the card's acceptance.
3. Open the summary logs the final message names (`test-results/summary-*.log`) and list the failing tests
   (`grep '✘'`, skip retries). Never trust a count you haven't seen in a log.
4. Scope: `node scripts/integrate.mjs scope <branch>`. Every file outside the card's component(s) needs a reason
   (shared inventories, generated files and the backlog are expected).

## 2. Check what was added to make tests pass

- New `a11yDiff`, `ui5FormHosts`, focus-scaffolding or other allowances in `tests/a11y-tree-normalize.ts` or fixtures:
  each must name exact paths, verify the node shape it removes, and be limited to the card's cases. Reuse of an existing
  mechanism (form hosts, pinned popup shell) is fine; a blanket "ignore" is not.
- Tree-baseline entries: only structural differences owned by the component's P card (AGENTS.md "New-component
  accessibility acceptance"). Any role/name/state/text difference in the baseline → return the card.
- Forbidden shortcuts: raised `tolerance`, `skipCompare` without a P-card reason, `retries`, `waitForTimeout`/sleeps,
  `test.skip`, hard-coded colours/sizes that have a `--sap*`/`--fiori-*` parameter
  (`grep -nE '#[0-9a-f]{3,6}\b|[0-9]+px' <changed files>`).

## 3. Classify each remaining failure (if the card isn't green)

For every failing check, find the cause before writing anything:

- **Accessibility tree:** read the case's capture (`test-results/a11y-tree-wcr/<dir>-<case>.json` or
  `test-results/a11y-tree-report.json`), group the differences by kind (role/name/state vs. wrapper/nesting), and
  locate the reference template (`node_modules/@ui5/webcomponents*/dist/<Name>Template.js`, WCR
  `dist/components/<Name>/**`). Structural-only → may be recorded under the new-component rule. Semantic → must be fixed.
- **Pixels:** isolated (`only=`) vs. full grid. If only the full grid fails, or unrelated components fail on the
  branch, suspect a popup painted outside its cell (cause 2 below). Check the same cells on clean `main` before
  blaming the branch.
- **Console/page errors** in the reference (e.g. WCR `NaN` width) are fixture inputs, not pixels.
- Existing precedent first: search `registry/ui` and `tests/a11y-tree-normalize.ts` for how another component already
  solved the same thing, and point to it (file:line).

## 4a. Not done → write the follow-up card

Add `docs/plan/tasks/<ID>b-<slug>.md` (or the next letter) and its line in `docs/plan/README.md` under the parent card:

```markdown
# <ID>b — <what is left>

Continue on `codex/<ID>` in `.worktrees/<ID>`. Budget: 2 hypotheses per failing check, about <n> h, 0 pushes.

## Review findings
1. <failing check> — <cause, with evidence: capture path / log line> — <where to fix, with precedent file:line>.
2. …

## Acceptance
- <the checks that must pass>; tier 2; installed-consumer check if not done; tick <ID> and <ID>b.
```

Commit it to local `main` (bookkeeping only, no tests needed) and give the owner the one-line follow-up prompt from
RUN.md. A card that keeps coming back on the same kind of problem is a signal to raise a rule question with the owner
(record the answer in `decisions.md`), not to write a third follow-up.

## 4b. Done → merge

1. In the orchestrator checkout (up to date with local `main`): `git merge --no-ff --no-commit <branch>`. Conflicts are
   almost always appended lines in shared inventories: keep both sides, then `pnpm generate && pnpm registry:build`
   instead of hand-merging generated files. A real conflict in a component file means two cards touched it: keep both
   behaviours and run both cards' specs.
2. Re-run what the merge could have changed: the card's specs plus the inventory specs
   (`tests/a11y-tree*.spec.ts`, `tests/i18n.spec.ts`, `tests/usage-guidance.spec.ts`) with `pnpm test:summary`.
   Not the full suite: that is the milestone's job.
3. `node scripts/plan-check.mjs --fix` moves ticked cards to `tasks/done/` and return notes to `returns/done/`; fix the
   relative links it then reports, update the Status table, run plan-check again (0 errors).
4. Commit, check the main checkout is clean, `git -C <main checkout> merge --ff-only <orchestrator branch>`.

## 5. When something fails after merging (it passed on each branch alone)

Check in this order, fix the cause, and say which one it was in the commit message:

1. **Over-broad locator** now that more demos are on the page: scope to `#<name>-demo …` / `[data-slot=…]`.
2. **A popup painted outside its fixture cell** covering another cell (compare `test-results/visual*/…-ours.png`,
   `-ui5.png`, `-diff.png`): pin it in place (`docs/src/fixtures/ui5-popup-in-place.ts`, `wcr-popup-in-place.ts`).
3. **Focus stolen by another fixture** closing a popup or changing `:focus-visible`.
4. **Acting before async state settled**: wait for the state (`expect.poll`, `toBeFocused`), never sleeps or retries.
5. **Fractional layout** shifting later cells by 1 px: whole-pixel slots.
6. **Load-dependent reference rendering** (only with several workers): confirm with `--workers=1` runs; if the
   reference varies, run that spec serially and say so.

Two honest attempts and still unexplained: stop, roll back the merge if `main` was clean before it, and report.

## 6. Milestone (end of a wave / every 3–5 merged cards / owner asks to publish)

```bash
pnpm test:milestone              # fresh builds, full main + Storybook once, stored-baseline tree comparisons (macOS)
node scripts/integrate.mjs cleanup   # deletes merged codex/* branches and their clean worktrees
```

Then push `main` only if the owner authorized it (it publishes). CI is a reminder; a Linux-only failure goes into the
milestone report, not a card.

## 7. Report to the owner

Per card: merged / follow-up written (one line why) / returned. Any allowance or baseline entry accepted and why.
Anything that needs the owner's decision. Short: the owner reads the result, not the process.
