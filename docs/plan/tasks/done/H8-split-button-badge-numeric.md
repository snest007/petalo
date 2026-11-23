# H8 — SplitButton, ButtonBadge, NumericInput

**Goal:** add the components below from issue #1's list. Depends on: E4 and E5 (merged); not on H0 (UI5 references only). Can run in parallel with H1–H6 and with
the other H7+ cards (disjoint files), except where a component edits an existing component's file — then don't run
it at the same time as another card that edits that file: `input.tsx` (H7), `button.tsx` (H8), `menu.tsx` and
`table.tsx` (H10).

## Components

1. **SplitButton** — primary action + arrow; `onClick` / `onArrowClick`, `activeArrowButton`, `design`, keyboard
   (Alt/F4 opens, Space/Enter on the right part), with a `Menu` composition demo. UI5 `SplitButton.js`.
2. **ButtonBadge** — badge on `Button` (`design`: `InlineText | OverlayText | AttentionDot`), as a child component
   like UI5's `badge` slot; accessible name includes the badge text. UI5 `ButtonBadge.js`. Edit `button.tsx`
   additively.
3. **NumericInput** — UI5's `NumericInput` is **@experimental** in 2.28: port it, mark the registry item and docs
   "experimental (follows UI5)", and keep its API minimal (value, min, max, step, precision, locale-aware formatting
   via E5's `fiori-numbers.ts`, value states). Route usage: numeric-input vs step-input.

Reference: UI5 Web Components 2.28 in `node_modules` (rule 1) — read `dist/<Name>.js`, `dist/<Name>Template.js`,
`dist/generated/themes/<Name>.css.js` for each. Fixtures `<name>.tsx` + `<name>.ui5.ts`.

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
