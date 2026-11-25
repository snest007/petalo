# H9e — Finish DynamicDateRange parity

Start `codex/H9e` in `.worktrees/H9e` from local main after H9, H9b and H9d merge. Restore the DynamicDateRange
component, fixtures, tests, stories and related inventory and usage-routing entries from preserved commit
`966e1a4`. The [H9 return](../returns/done/H9.md) records the checkpoint and evidence.

## Review findings

1. The H9b LTR and RTL Web Components captures report 378 differences each across the open cases. The closed
   field trees passed after verifying the exact form-associated Input host. Compare the open list and all
   editors with UI5's amount field, focus guards, live regions and time controls. Check names such as
   “Navigate Back” and “Submit” on their inner buttons. Preserve level, name and state when resolving wrappers.
2. The popup height now matches and the options and date-only editors pass. The three date-time editor cells
   still exceed 2% in parts of the matrix, up to 12.06% in compact High Contrast White. The `ar-EG` case differs
   by 2.57%. Measure the editor rows, controls and spacing on both sides. Preserve the passing `de-DE` and
   `zh-CN` cases and complete the localized coverage and editor stories.

## Acceptance

- Verify the original H9 parity and extension criteria for DynamicDateRange, with focused visual, LTR/RTL tree,
  axe and behavior checks followed by tier 2. Install `@petalo/dynamic-date-range` as the only requested item in a
  fresh consumer, build and render it, and verify typed expressions and a custom option. Tick H9e.
- Budget is two hypotheses per failing check, about two hours, and zero pushes.

## Review of the H9e checkpoint

`codex/H9e` at `1ae2b54` passes all 117 pixel comparisons, all 24 localized comparisons,
the focused stories and the installed consumer. After two repairs the LTR and RTL tree comparisons
still differ on every open editor category. See the [H9e return](../returns/H9e.md) for raw capture paths,
case counts and the pinned template evidence.

Start the next focused comparison with the date-only Calendar shortcut and announcement lifecycle,
then the native List's preset text and sentinels. The name and role differences in the amount and
date-time editors repeat the H9b issue. The [owner decision](../decisions.md#2026-11-25--preserve-accessible-controls-in-dynamicdaterange-editors)
permits exact, source-backed tree comparisons for those cases. Preserve interactive semantics and
leave shared picker production changes for separate review. All prior acceptance checks still apply.

## Shared integration files

- `README.md`, `docs/plan/README.md`, `docs/plan/decisions.md`, `docs/plan/returns/H9e.md`, and
  `docs/plan/tasks/P2-parity-value-pickers.md` record the shipped item, scoped owner decision and P2 ownership.
- `registry/items/date-picker.json` and `registry/items/date-range-picker.json` contain usage routing to
  `dynamic-date-range`. The item adds its own `docs/stories/dates/dynamic-date-range.stories.tsx`.
- `docs/src/fixture-types.ts`, `tests/a11y-tree-normalize.ts` and `tests/dynamic-date-range-a11y.ts`
  register the reference-tree comparison. `tests/a11y-tree-baseline.ts`, `tests/a11y-tree.spec.ts`,
  `tests/a11y-tree-customizations.spec.ts`, `tests/i18n.spec.ts` and `tests/i18n-audit-baseline.json`
  register the owner, RTL and locale coverage, and public customization proof.
- `scripts/a11y-audit.mjs` and `scripts/i18n-audit.mjs` register verified UI5 channels. The generated
  `docs/plan/a11y-audit.md`, `docs/plan/i18n-audit.md`, locale packs under `registry/i18n/` and
  `skills/petalo/references/dates.md` incorporate the item.
