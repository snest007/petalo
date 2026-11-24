# H7 — Input suggestions and MessageBox (high priority)

**Goal:** add the components below from issue #1's list. Depends on: H0, E4 and E5 (merged). Can run in parallel with H1–H6 and with
the other H7+ cards (disjoint files), except where a component edits an existing component's file — then don't run
it at the same time as another card that edits that file: `input.tsx` (H7), `button.tsx` (H8), `menu.tsx` and
`table.tsx` (H10).

## Components

1. **Input suggestions** — `Input` gains `showSuggestions`, `SuggestionItem` / `SuggestionItemGroup`, `filter`,
   type-ahead autocomplete, highlighted match, `onSelectionChange` / `onSuggestionItemPreview`, phone full-screen
   dialog (D1 pattern). UI5: `Input.js` (suggestions part), `SuggestionItem*.js`, `features/InputSuggestions.js`.
   Edit `registry/ui/input.tsx` additively (rule 7). Route usage: input+suggestions (free text allowed) vs combobox
   (must pick) vs multi-input.
   Reference: UI5 Web Components 2.28 in `node_modules` (rule 1) — read `dist/<Name>.js`, `dist/<Name>Template.js`,
`dist/generated/themes/<Name>.css.js` for each. Fixtures `<name>.tsx` + `<name>.ui5.ts`.
2. **MessageBox** — `MessageBox` with `type` (`Confirm | Error | Information | Success | Warning`), predefined
   `actions` (OK, Cancel, Yes, No, Abort, Retry, Ignore, Close, Delete), `emphasizedAction`, `initialFocus`,
   `onClose(action)`, plus a `useMessageBox()` hook returning `show(options) => Promise<action>` for imperative use
   (WCR's `Modals.showMessageBox` behaviour, without a global API). Built from our `Dialog`.
   Reference: `@ui5/webcomponents-react` 2.28.2 (H0) — read `dist/components/<Name>/**`. Fixtures `<name>.tsx` +
`<name>.wcr.tsx` (`reference: "wcr"`).

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
