# H4 — AnalyticalTable tree, selection, sub-components, row states

**Goal:** continue `AnalyticalTable` (started in H1) with the features below, at parity with WCR 2.28.2. Depends on
H3 (merged); H1–H5 edit the same files, so they run strictly in order.

## Features

From WCR `useToggleRowExpand`, `defaults/Column/Expandable`, `useRowSelect`, `useRowSelectionColumn`,
`useSingleRowStateSelection`, `useSelectionChangeCallback`, plugin hooks `useIndeterminateRowSelection`,
`useManualRowSelect`, `useRowDisableSelection`, `TableBody/RowSubComponent`, `useRowHighlight`,
`useRowNavigationIndicator`:

- Tree table: `isTreeTable`, `subRowsKey`, `getSubRows`, expand/collapse (`onRowExpandChange`, `expanded` state),
  indentation per level, expand icon; `aria-level`, `aria-expanded`, `aria-setsize`/`aria-posinset` as WCR sets them.
- Selection: `selectionMode` (`None | Single | Multiple`), `selectionBehavior` (`Row | RowOnly | RowSelector`),
  select-all header checkbox with WCR's texts, `selectedRowIds` state, `onRowSelect`, `onRowClick`,
  `tagNamesWhichShouldNotSelectARow` equivalent (a `shouldIgnoreRowClick?(event)` hook), plugin-hook equivalents as
  opt-in props or exported TanStack features (`indeterminateRowSelection`, `manualRowSelect`,
  `rowDisableSelection` with a `isRowSelectable?(row)`), selection announcements (`ROW_SELECTED*`).
- Sub-components: `renderRowSubComponent`, `subComponentsBehavior` (`Expandable | Visible | IncludeHeight |
  IncludeHeightExpandable`), `alwaysShowSubComponent`, measured heights in virtualisation.
- Row states: `withRowHighlight` + `highlightField` (value states, rule 5), `withNavigationHighlight` +
  `markNavigatedRow`, `onRowContextMenu`.

## Fixtures and tests

Fixtures: tree collapsed / expanded 3 levels, each selection mode × behaviour, select-all partial (indeterminate),
disabled selection row, sub-component visible / expandable, row highlights (all value states), navigated row.
Tests: keyboard expand/collapse (+/−, arrows as WCR), Space/Enter selection, Shift range selection where WCR supports
it, select-all, plugin-hook equivalents, sub-component focus order, announcements, controlled/uncontrolled.

## Rules for this card

Follow H1's **extension contract** (instance access, controlled/uncontrolled state, render slots render content only,
styling hooks, texts, locale) for everything you add; ARIA (rule 9) and localization (rule 10) in full. Source of truth:
`node_modules/@ui5/webcomponents-react/dist/components/AnalyticalTable/**` (2.28.2) — read the listed hooks and
default renderers first and quote them in comments. Parity, not invention: no feature WCR doesn't have.

## Files

Component-owned only (rule 3): `registry/ui/analytical-table.tsx`, `registry/lib/analytical-table/**`,
`registry/items/analytical-table.json`, `registry/styles/components/analytical-table.css`,
`docs/src/fixtures/analytical-table.tsx` + `.wcr.tsx`, `docs/src/demos/analytical-table.tsx`,
`tests/analytical-table.spec.ts`.

## Acceptance

AGENTS.md definition of done (rules 9 and 10 included); every new fixture passes pixel (`tests/visual-wcr.spec.ts`),
accessibility-tree and axe checks against WCR, LTR and RTL; the demo's "Custom" example still works and gains one use of
this card's slots; final message lists each WCR prop/hook covered by this card.
