# H3 — AnalyticalTable grouping and aggregation

**Goal:** continue `AnalyticalTable` (started in H1) with the features below, at parity with WCR 2.28.2. Depends on
H2 (merged); H1–H5 edit the same files, so they run strictly in order.

## Features

From WCR `useGroupBy`, `defaults/Column/Grouped`, `RepeatedValue`, `ColumnHeaderModal` (group items), react-table
`useGroupBy` + `aggregations`:

- Grouping by one or more columns (`groupable` / `disableGroupBy`, header menu "Group" / "Ungroup", `onGroup`),
  grouped rows with expand/collapse, group header row rendering (`Grouped` render slot), `RepeatedValue`,
  `groupBy` state controlled or uncontrolled, `isGrouped` styling.
- Aggregation: `aggregate` (built-ins `sum`, `min`, `max`, `minMax`, `average`, `median`, `unique`, `uniqueCount`,
  `count` + custom), `aggregateValue`, `Aggregated` render slot; aggregated numbers formatted with
  `fiori-numbers.ts` in the table's locale.
- ARIA: group rows' `aria-expanded`, `aria-level`, accessible name including the grouped value and count (WCR texts),
  announcements on expand/collapse.

## Fixtures and tests

Fixtures: grouped by one column (collapsed, expanded), grouped by two, aggregated sum/average with `de-DE` number
format, header menu with group item. Tests: group/ungroup via menu and keyboard, expand/collapse with keyboard,
aggregates update when data/filters change, custom `aggregate` and `Aggregated`, locale formatting, announcements.

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
