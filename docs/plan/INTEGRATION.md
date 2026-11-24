# Review and merge (reviewer)

How to review a returned card, integrate it, and publish a milestone. Read [AGENTS.md](../../AGENTS.md) and
[RUN.md](RUN.md) first. Build and verify merge candidates in the orchestrator's separate worktree. Advance
local `main` by fast-forward from the verified candidate.

## 1. Verify the claims (before believing the final message)

On the card's branch / worktree:

1. `git status --short` (clean), `git log --oneline main..<branch>`, `git diff --stat main...<branch>`.
2. Read `docs/plan/returns/<ID>.md` if present and the card's acceptance.
3. Open the summary logs the final message names (`test-results/summary-*.log`) and list the failing tests
   (`grep '✘'`, skip retries). Never trust a count you haven't seen in a log.
4. Run `node scripts/integrate.mjs scope <branch>` with the returned branch. Check the active card's scope as well.
   For follow-ups sharing a branch, the script looks up the original card by branch name. Explain changes outside
   the card's components, including shared inventories, generated files and the backlog.

## 2. Check what was added to make tests pass

- New `a11yDiff`, `ui5FormHosts`, focus-scaffolding or other allowances in `tests/a11y-tree-normalize.ts` or fixtures:
  require exact paths, a check on the node shape removed, and scope limited to the card's cases. Existing mechanisms
  such as form hosts and pinned popup shells can be reused. Check structural baseline entries and permanent
  semantic deviations against rule 9 and [new-component acceptance](../../AGENTS.md#definition-of-done-every-card).
- Verify pixel exceptions against rule 4 and new-component acceptance. Return cards that bypass these checks
  with retries, sleeps, or `test.skip`, and flag hard-coded values with a `--sap*` or `--fiori-*` parameter. A search such as
  `grep -nE '#[0-9a-f]{3,6}\b|[0-9]+px' <changed files>` can help identify values to review.

## 3. Classify each remaining failure (if the card isn't green)

For every failing check, find the cause before writing anything:

- **Accessibility tree:** read the case's capture (`test-results/a11y-tree-wcr/<dir>-<case>.json` or
  `test-results/a11y-latest/a11y-tree-report.json` when using `pnpm test:summary`), group by kind
  (role/name/state vs. wrapper/nesting), and
  locate the reference template (`node_modules/@ui5/webcomponents*/dist/<Name>Template.js`, WCR
  `dist/components/<Name>/**`). Apply the allowance and baseline rules above before deciding whether to return the card.
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

Commit the bookkeeping in the orchestrator's worktree and fast-forward local `main` to it. Give the owner the
[one-line follow-up prompt](RUN.md#prompts). If the same issue keeps returning, ask the owner to settle the rule
before drafting a third follow-up. Record the decision in [decisions.md](decisions.md).

## 4b. Done → merge

1. In the separate orchestrator worktree, start from current local `main` and name the branch reviewed in step 1 in
   `git merge --no-ff --no-commit <reviewed-branch>`. Keep both sides of shared inventory additions and regenerate
   with `pnpm generate && pnpm registry:build`. If two cards touched a component file, preserve both behaviours and
   run both cards' specs.
2. Verify the candidate before advancing `main`. Repeat scoped Tier 2 where it applies under the
   [verification budget](../../AGENTS.md#verification-budget). Use `pnpm test:summary` to check merge impact with the
   card's specs and affected inventory checks (`tests/a11y-tree*.spec.ts`, `tests/i18n.spec.ts`,
   `tests/usage-guidance.spec.ts`). The milestone is the scheduled full-suite repeat.
3. Run `node scripts/plan-check.mjs --fix` to archive ticked cards and their return notes. Fix any reported links,
   update the Backlog Status table, and run `node scripts/plan-check.mjs` for zero errors.
4. Commit the verified candidate. Confirm the main checkout is clean and run
   `git -C "<main checkout>" merge --ff-only <orchestrator-branch>`.

Use these steps for card merges. The legacy `node scripts/integrate.mjs merge` writes directly to local `main`
before candidate verification and defaults to all pending `codex/*` branches when names are omitted.

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

After two attempts without a cause, stop and report. Keep the unresolved candidate out of `main`. If `main` has
already advanced and its checkout was clean before the merge, return to the pre-merge revision.

## 6. Milestone and publishing

At the end of a wave, after about 3–5 merged cards, or when the owner asks to publish:

1. Integrate reviewed cards using step 4b. Confirm card and return archives, Backlog Status, and zero errors from
   `node scripts/plan-check.mjs`. If a wave changed, update [README.md](../../README.md). Check that agreed rules
   are reflected in [AGENTS.md](../../AGENTS.md), [decisions.md](decisions.md) and the relevant runbook steps.
   Check that open cards still match those rules, including dependencies, filenames and test counts. Include any
   release changelog entries required by the [extension contract](../extension-contract.md).
2. Run `pnpm test:milestone` once on macOS for fresh builds, full main and Storybook suites, and the full stored
   accessibility-baseline comparisons. Release verification can use `--runs=2`. Target about 20 minutes locally
   and 12 minutes in CI. Keep the milestone report and record the summary lines in the commit message.
3. With owner authorization, push the verified `main` to publish the registry and docs on GitHub Pages.
4. Record the Linux CI outcome. CI runs behaviour, live pixel and Storybook checks and provides a keyboard test
   environment closer to Windows. Fix failures that reproduce on macOS or in a behaviour test. Record Linux-only
   failures in the milestone report. CI serves as a reminder for card work.
5. With owner approval, use `node scripts/integrate.mjs cleanup` to remove the merged branches and clean worktrees
   listed by `plan-check`.

For integration milestones requiring installed-consumer and recorded-usage proofs, `node scripts/integrate.mjs verify`
wraps the milestone command on clean local `main` and writes `.integration/REPORT.md`.

## 7. Report to the owner

Per card: merged / follow-up written (one line why) / returned. Any allowance or baseline entry accepted and why.
Anything that needs the owner's decision. Short: the owner reads the result, not the process.
