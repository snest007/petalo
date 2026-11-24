# H2 — AnalyticalTable sorting and filtering

**Goal:** continue `AnalyticalTable` (started in H1) with the features below, at parity with WCR 2.28.2. Depends on
H1 (merged); H1–H5 edit the same files, so they run strictly in order.

## Features

From WCR `useOrderedMultiSort`, `ColumnHeader/ColumnHeaderModal` (sort/filter items), `defaults/FilterComponent`,
react-table `useSortBy` / `useFilters` / `useGlobalFilter` behaviour as WCR configures it:

- Sorting: per column `sortable` / `disableSortBy`, `sortType` (built-ins + custom function), `sortDescFirst`,
  `sortInverted`; multi-sort with WCR's ordering (`enableMultiSort`, `useOrderedMultiSort` priority), `onSort`;
  header menu "Sort Ascending" / "Sort Descending" items; sort indicator icon; `aria-sort` on the header cell.
  Text sorting uses `Intl.Collator(locale)`; numbers/dates by value.
- Filtering: per column `filterable` / `disableFilters`, the header-menu filter input (`defaults/FilterComponent`,
  custom `Filter` render slot), `filter` / `filterType` built-ins + custom, `onFilter`; global filter
  (`globalFilterValue`, `disableGlobalFilter`); `noDataReason: "Filtered"` and its text; filter indicator icon in the
  header. Comparison via `Intl.Collator(locale, { sensitivity: "base" })` — locale-aware case/accent folding.
- State: `sorting` / `columnFilters` / `globalFilter` controlled or uncontrolled (H1 contract).
- Announcements WCR makes on sort/filter, and the header cell's accessible description of its sort/filter state.

## Fixtures and tests

Fixtures (both sides): sorted asc, sorted desc, multi-sorted (two indicators), filtered column (indicator + reduced
rows), header menu open with sort + filter items (in place, H0 helper), filtered to no data. Tests: mouse and keyboard
paths through the header menu; multi-sort order; custom `sortType` and `Filter`; `de-DE` and `sv-SE` collation; global
filter; announcements; controlled/uncontrolled.

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
