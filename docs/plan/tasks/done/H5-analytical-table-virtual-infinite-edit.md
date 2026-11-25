# H5 — AnalyticalTable virtualisation, infinite scroll, editing, pop-in

**Goal:** continue `AnalyticalTable` (started in H1) with the features below, at parity with WCR 2.28.2. Depends on
H4 (merged); H1–H5 edit the same files, so they run strictly in order.

## Features

From WCR `TableBody/VirtualTableBody*`, `scrollbars/*`, `useSyncScroll`, `useNativeScrollbar`, `useScrollToRef`,
`usePopIn`, `defaults/Column/PopIn`, plugin hooks `useF2CellEdit`, `useOnColumnResize`, `useAnnounceEmptyCells`:

- Row and column virtualisation (`overscanCount`, `overscanCountHorizontal`), large-data performance target: 100,000
  rows × 50 columns scroll without layout thrash (assert frame count/time in a perf test with a generous bound, not a
  pixel test).
- Infinite scroll: `infiniteScroll`, `infiniteScrollThreshold`, `onLoadMore`, `onTableScroll`; busy row while loading;
  `aria-rowcount` reflects the known total or `-1` as WCR does.
- Scroll API on `tableRef` (`scrollTo`, `scrollToItem`, `horizontalScrollTo`, … per WCR), `nativeScrollbar`
  equivalent, synced header/body scrolling.
- Responsive pop-in: `responsiveMinWidth`, `responsivePopIn`, `popinDisplay` (`Block | Inline | WithoutHeader`),
  `adjustTableHeightOnPopIn`, `PopInHeader`.
- Cell editing (F2): `useF2CellEdit` behaviour — F2 enters edit mode in an interactive cell, F2/Escape returns to cell
  navigation, Tab moves between interactive elements as WCR does; announcements.
- Empty-cell announcements, `onColumnResize` plugin-hook equivalent if not done in H1.

## Fixtures and tests

Fixtures: scrolled to the middle of 10,000 rows (deterministic `scrollToItem`), horizontal scroll with a frozen
column, pop-in in each `popinDisplay`, a cell in edit mode, infinite-scroll busy row. Tests: scrolling keeps
`aria-rowindex` correct; keyboard navigation across virtual boundaries; `onLoadMore` fires once per threshold; F2 edit
cycle; pop-in at widths; performance bound.

## Afterwards

Update the README component list and `registry/items/analytical-table.json` description; if every WCR prop is covered,
say so in the final message with the list.

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
