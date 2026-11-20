# H1 — AnalyticalTable foundation: extension contract, ARIA ownership, columns

> **X0 approved on 2026-11-17.** The extension contract below conforms to `docs/extension-contract.md` (see
> "Conformance to the X0 extension contract" at the end, and the contract's amendments: T2/T3 points need a consumer
> example).

**Goal:** start `AnalyticalTable` — the React port of WCR 2.28.2's `AnalyticalTable` — with the architecture every later
card (H2–H5) builds on, and the column features: sizing, resizing, reordering, hiding, freezing (sticky). Ported from
`node_modules/@ui5/webcomponents-react/dist/components/AnalyticalTable/**` (H0 makes it the source of truth).
Depends on H0 (E4 and E5 are merged). It no longer waits for P3 (owner's decision 2026-11-20: build out components first).

Scope principle (owner + issue #1 reporter): **feature parity with WCR 2.28.2, plus extension points.** No features
WCR doesn't have. Everything a consumer might want to change must be changeable without editing our source — and
none of it may break ARIA (AGENTS.md rule 9) or localization (rule 10).

## Component shape (decide here, binding for H2–H5)

- New registry item `analytical-table` (`registry/ui/analytical-table.tsx`, may split helpers into
  `registry/lib/analytical-table/*.ts` — register them as files of the same item). `DataTable` and `Table` stay as they
  are (rule 7); `DataTable` remains the light option. Docs/usage: `analytical-table` gets `usage` (G0 schema) saying
  when to use it vs `data-table` vs `table`, and `data-table`'s `avoidWhen` routes heavy grids here (edit only the
  `usage` block of `registry/items/data-table.json`).
- Engine: **TanStack Table v9** (already a dependency) — not react-table v7 like WCR. Map each WCR feature to TanStack
  features/state; where WCR behaviour differs from TanStack's default, port WCR's behaviour (quote the WCR hook).
  Virtualisation: `@tanstack/react-virtual` (already a dependency) for rows and columns.
- DOM structure and classes follow WCR's rendered DOM (div-based `role="grid"`, header row group, virtual body,
  `role="row"` / `role="columnheader"` / `role="gridcell"`), so pixel and tree parity with `/wcr.html` is achievable.
  Styles: `registry/styles/components/analytical-table.css` with `--fiori-wcr-*` parameters (H0) and `--sap*` tokens.

## Extension contract (binding for H2–H5 — write it as a section of the component's header comment)

1. **Instance access.** `tableOptions?: Partial<TableOptions>` merged into TanStack options (consumer features,
   `_features`, custom row models, `meta`), and `tableRef?: React.Ref<AnalyticalTableInstance>` exposing the TanStack
   table plus our imperative API (`scrollToRow`, `scrollToColumn`, `focusCell`, `resetColumnSizing` …, matching WCR's
   `tableRef` methods). This replaces WCR's `tableHooks` / `reactTableOptions` / `stateReducer`.
2. **Every state is controlled or uncontrolled.** For each state a card adds (column sizing / order / visibility /
   pinning here; sorting, filters, grouping, expanded, row selection later): `x`, `defaultX`, `onXChange` — same naming
   as `sorting` / `defaultSorting` / `onSortingChange` in `DataTable`.
3. **Render slots render content only.** Column `cell`, `header`, `footer`, `aggregatedCell`, `placeholderCell` and
   table-level `renderRowSubComponent`, `NoDataComponent`, `LoadingComponent`, header menu content: consumer output is
   placed **inside** a component-owned wrapper. The wrapper owns `role`, `aria-*` states, `aria-rowindex` /
   `aria-colindex`, ids, `tabindex` and keyboard handling; a consumer cannot remove them. Render slots receive what WCR
   passes (`{ cell, row, column, table, value, … }`) plus `webComponentsReactProperties`-equivalent helpers.
4. **Styling hooks.** Every part has a stable `data-slot` (`analytical-table`, `-header-row`, `-header-cell`,
   `-row`, `-cell`, `-resizer`, `-sub-component`, `-no-data`, …) and state as `data-*` (`data-selected`, `data-sorted`,
   `data-grouped`, `data-frozen`, `data-expanded`, `data-highlight`, `data-navigated`, `data-dragging`); `className` on
   the root, `classNames?: Partial<Record<Slot, string>>` for parts, and per-column `meta.className` /
   `meta.headerClassName`. Row/cell props hooks: `getRowProps?(row)` / `getCellProps?(cell)` returning extra props
   that are **merged** (className/style concatenated, handlers chained) and can't override owned ARIA attributes
   (filter them out with a dev-mode warning).
5. **Texts** (rule 10): `texts?: Partial<AnalyticalTableTexts>` with every WCR key the table uses (45 today; H0 lists
   them as `wcr:<KEY>`), each default from WCR's `messagebundle_en.json`, key named in a comment, resolved through
   `FioriLocaleProvider`. Placeholders as functions.
6. **Locale** (rule 10): `locale?: string`; numbers via `fiori-numbers.ts`, comparisons via `Intl.Collator`.

Write `docs/src/demos/analytical-table.tsx` with a **"Custom"** example that uses every point above (custom cell with
a micro chart-like bar using tokens, custom header menu item, `getRowProps` className, custom text) — the S-wave story
copies it.

## Conformance to the X0 extension contract (approved 2026-11-17)

The extension contract above conforms to [docs/extension-contract.md](../../extension-contract.md), tiers T1–T3.
Keep tableOptions/tableRef, controlled states, content-only wrappers, class maps, protected prop merging and all
texts/locale promises. Add a public `useAnalyticalTable()` facade with read-only model/actions, protected row/cell/
header getters and typed structural replacements; default wrappers continue owning grid roles/count/index/focus.
The engine's instance access remains additive, and options/features cannot overwrite semantic/focus ownership.
Document components keys, context/getter names and imperative methods as rule-7 public API. Customise docs/stories
and installed-consumer conformance use the same library contract.

Differences are intentional domain capabilities: H1 exposes the TanStack instance/options/imperative scroll methods
where Calendar exposes date/item/paging actions; its F2 editing mode permits focus into cell content, while Calendar
cells remain a single roving stop. Existing WCR-named `NoDataComponent`/`LoadingComponent` remain **content** slots in
owned hosts despite their names. Per-column meta classes supplement the uniform class map; WCR reference/i18n keys
supplement UI5 keys. None weakens ARIA/text/locale ownership. Generic structural replacement is new to H1's starting
contract; approve the common facade before coding, not a second incompatible table-only replacement API. H1 no
longer waits for P3 (2026-11-20); to avoid collisions, H1 creates its own `analytical-table` files and doesn't edit
`data-table.tsx` or shared data files that P3 owns. If it needs a change there, it notes it for P3 instead.

## Column features (this card)

From WCR `useColumnResizing`, `useDynamicColumnWidths`, `useAutoResize`, `useStickyColumns`, `useDragAndDrop`,
`useVisibleColumnsWidth`, `VerticalResizer`, `ColumnHeader/*`:

- Widths: `scaleWidthMode` (`Default | Smart | Grow`, WCR algorithm incl. font measuring after `document.fonts.ready`),
  column `minWidth` / `maxWidth` / `width`, `autoResizable` (double-click on the resizer fits content).
- Resizing: drag the resizer, keyboard resize (WCR: header focused + Shift+arrow… — port exactly what WCR does), RTL
  mirrored; `onColumnResize` / `onAutoResize`; `retainColumnWidth`.
- Reordering: drag & drop of headers (`disableDragAndDrop`), `onColumnsReorder`; WCR's drop indicator styling.
- Hiding: column visibility state; `hiddenColumns` in `initialState` equivalent.
- Freezing: `sticky` columns (start side; WCR `useStickyColumns`), header menu "Freeze" / "Unfreeze" when WCR offers it,
  shadow/border at the frozen edge, RTL.
- Header cell: text truncation + tooltip (`headerTooltip`), `hAlign` / `vAlign`, column header popover/menu skeleton
  (sorting/filter/group items arrive in H2/H3 — build the menu with a slot list so they plug in).
- Basic body: rows, `rowHeight`, `headerRowHeight`, `alternateRowColor`, `minRows`, `visibleRows`,
  `visibleRowCountMode` (`Fixed | Auto | AutoWithEmptyRows | Interactive` incl. the vertical resizer), `loading` /
  `loadingDelay` / `alwaysShowBusyIndicator`, `NoDataComponent` with `noDataReason` (`Empty | Filtered`),
  `noDataText`.
- Keyboard navigation (WCR `useKeyboardNavigation`): grid navigation with arrows, Home/End, Ctrl+Home/End, PageUp/Down,
  F2 enter/exit cell content, Tab out; roving `tabindex` on cells; RTL swaps left/right. Port all of it here — H2–H5
  only add keys.
- `useA11y` / `useAnnounceEmptyCells` / `useCanUseVoiceOver`: every `aria-*` WCR sets on grid, rows, header cells and
  cells, `aria-rowcount` / `aria-colcount` on the full counts, empty-cell announcements.

## Fixtures and tests

- `docs/src/fixtures/analytical-table.tsx` + `analytical-table.wcr.tsx` (`reference: "wcr"`): default, alternate rows,
  each `scaleWidthMode`, a frozen column, a hidden column, a resized column (fixed width), long header text,
  `visibleRowCountMode` Fixed / AutoWithEmptyRows, loading, no data (Empty, Filtered), RTL, `de-DE` texts. Delete H0's
  `wcr-smoke` set.
- `tests/analytical-table.spec.ts`: resize by mouse and keyboard (asserting widths and `onColumnResize`), auto-resize,
  reorder by drag and `onColumnsReorder`, freeze from the header menu, hide; full keyboard navigation matrix (LTR and
  RTL); controlled/uncontrolled for each state; **extension contract**: a custom cell and a `getCellProps` that tries
  to set `role`/`aria-selected`/`tabindex` keep the owned values (plus the dev warning); `classNames` reach the parts;
  `tableRef` methods work; `texts` and provider override texts.
- Visual (`tests/visual-wcr.spec.ts`), accessibility tree (E4) and axe pass for every fixture.

## Files

Component-owned (rule 3): `registry/ui/analytical-table.tsx`, `registry/lib/analytical-table/**` (new),
`registry/items/analytical-table.json`, `registry/styles/components/analytical-table.css`,
`docs/src/fixtures/analytical-table.tsx` + `.wcr.tsx`, `docs/src/demos/analytical-table.tsx`,
`tests/analytical-table.spec.ts`. Shared (allowed): `docs/src/fixtures/index.ts` (register),
`docs/src/fixtures/wcr-smoke*.tsx` (delete), `registry/items/data-table.json` (`usage` only), README component count.

## Acceptance

AGENTS.md definition of done (rules 9 and 10 included); every fixture passes pixel, tree and axe checks against WCR;
the "Custom" demo works; final message lists each WCR prop/hook covered by this card and which are left for H2–H5.
