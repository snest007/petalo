# H9 — SelectDialog, SplitterLayout, DynamicDateRange, CalendarLegend check

The [owner split recorded in the H9 return](../../returns/done/H9.md#owner-split) limits H9 and H9b to SplitterLayout and
CalendarLegend. [H9d](H9d-splitter-layout-auto-sizing.md) carries the reviewer’s remaining findings for that delivery.

**Goal:** add the components below from issue #1's list. Depends on: H0, E4 and E5 (merged). Can run in parallel with H1–H6 and with
the other H7+ cards (disjoint files), except where a component edits an existing component's file — then don't run
it at the same time as another card that edits that file: `input.tsx` (H7), `button.tsx` (H8), `menu.tsx` and
`table.tsx` (H10).

## Components

1. **SelectDialog** — search field + selectable list in a Dialog, single/multi with confirm, `onSearch`,
   `onConfirm(selected)`, "Clear" and selected-count texts; reuse `Dialog`, `Search`, `List`. Route: select-dialog vs
   value-help-dialog vs combobox. Reference: `@ui5/webcomponents-react` 2.28.2 (H0) — read `dist/components/<Name>/**`. Fixtures `<name>.tsx` +
`<name>.wcr.tsx` (`reference: "wcr"`).
2. **SplitterLayout** — `SplitterLayout` / `SplitterElement` (horizontal/vertical, `size`, `minSize`, `resizable`),
   draggable and keyboard-resizable separators (`role="separator"`, `aria-valuenow`, arrows/Home/End/Shift+arrows as
   WCR), RTL. Reference: `@ui5/webcomponents-react` 2.28.2 (H0) — read `dist/components/<Name>/**`. Fixtures `<name>.tsx` +
`<name>.wcr.tsx` (`reference: "wcr"`).
3. **DynamicDateRange** — UI5 2.11+ `DynamicDateRange` with its standard options (today, yesterday, last/next X days/
   weeks/months, date, date range, …) and option registration for custom options. Locale-aware texts and formats.
   Reference: UI5 Web Components 2.28 in `node_modules` (rule 1) — read `dist/<Name>.js`, `dist/<Name>Template.js`,
`dist/generated/themes/<Name>.css.js` for each. Fixtures `<name>.tsx` + `<name>.ui5.ts`.
4. **CalendarLegend** — already exported by `calendar.tsx`; only check it against ui5-calendar-legend fixtures and add
   missing cases (no new item unless the check shows a gap).

## For every component in this card

- Parity with the reference, plus extension points per H1's contract where the component renders consumer content
  (render slots render content only; owned ARIA can't be overridden; `data-slot` + `data-*` state; `classNames`).
- Rules 9 and 10 in full: every role/aria/announcement/keyboard path from the reference; every reference i18n key as an
  overridable text with its key named, resolved through `FioriLocaleProvider`; numbers/dates via `Intl`; RTL fixture.
- Registry item + `usage` (G0 schema; route look-alikes both ways), demo, spec, fixtures on both sides for each visual
  state (popups in place), axe + accessibility tree + pixel parity. If wave S is merged, add the stories too (S0 rules).
- Each component is its own commit (`<card>: <component>`).

## Files

Component-owned files (rule 3) of the new components; `docs/src/fixtures/index.ts` (register); README component count;
`usage` blocks of the look-alike items you route to (only the `usage` object of their `registry/items/*.json`).

## Acceptance

AGENTS.md definition of done; every listed component passes pixel, tree and axe checks in all themes, densities and RTL;
final message lists each component with its reference and any `skipCompare`/`a11yDiff` with reasons.
