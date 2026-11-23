# X0 — Extension architecture: library-wide contract + Calendar pilot design

**Goal:** decide, once for the whole library, **how** consumers customise shadcn-fiori components without editing our
source. Then prove the design on `Calendar` with a prototype. This is a design card: it produces documents, a
prototype in `docs/spikes/` and rewritten cards. It does **not** change any file under `registry/`.

## Why (owner's decision, 2026-11-17)

- The library is public. Community developers use it to build SAP apps quickly.
- **Features are endless, so we don't build them.** The library ships UI5 parity as the default and enough extension
  points that a consumer builds their own feature (a fiscal-period picker, a booking calendar, a custom table) on
  top. The owner chose shadcn over UI5 Web Components precisely because UI5 is hard to customise deeply.
- shadcn distributes source, so a consumer can always fork a file. But a fork stops receiving our fixes (UI5 parity,
  accessibility, week-number corrections…). **Extension points exist so that common deep customisation doesn't need a
  fork, and the consumer keeps upgrading.**
- This is a **template**: every component follows the contract this card defines, not only Calendar.

Evidence: the fiscal-calendar spike (`docs/spikes/fiscal-calendar/README.md`). With today's props, a consumer can
restyle cells and select periods. A consumer can't replace the grid layout, the paging step or the header. That
structural layer is what this card designs.

## Inputs to read first

- `docs/plan/tasks/done/H1-analytical-table-foundation.md` → "Extension contract". This is the deepest contract in the
  plan so far: instance access, controlled state, content-only render slots, styling hooks, prop getters with owned
  ARIA filtered out. Start from it and generalise it; don't contradict it.
- `docs/plan/tasks/H6-calendar-extension-points.md`, `H6b-…`, `H6c-…`: the Calendar extension points planned so far.
- `docs/spikes/fiscal-calendar/`: the gaps (G1–G6) and the "Outside Calendar" needs.
- AGENTS.md rules 3, 5, 7, 9 and 10: ownership, texts, public API stability, accessibility, localization.
- External models (read their docs; **don't add dependencies**):
  - react-day-picker v9 (shadcn's own calendar): `components` replacement map, `useDayPicker()` for replaced parts,
    `classNames` / `modifiers`.
  - Radix primitives (compound parts + `asChild`).
  - downshift / React Aria (state hooks + prop getters that carry ARIA and keyboard handling).

## Deliverable 1 — `docs/extension-contract.md` (library-wide, binding once the owner approves)

Write the contract as tiers. A component implements the tier its shape needs, plus all lower tiers. Settle each
question below with a recommendation and the alternatives you rejected.

| Tier | Applies to | Contract (starting point — refine it) |
|---|---|---|
| **T1 Style & state** | every component | `className` on the root; `data-slot` on every part; state as `data-*`; `classNames?: Partial<Record<Slot, string>>`; native props reach the element UI5 puts them on (rule 9); every state controlled or uncontrolled (`x` / `defaultX` / `onXChange`); `texts` and `locale` (rule 10). |
| **T2 Content** | components that render consumer items or content (list, select, table, tree, tabs, calendar days…) | Render slots render **content only**, inside a component-owned wrapper that owns role, `aria-*`, ids, `tabindex` and keys. `getXProps?(item)` hooks are merged (className and style concatenated, handlers chained) and can't override owned ARIA (filtered out, with a dev warning). Callback details say what happened (H6b's `detail` pattern). |
| **T3 Structure** | composite or stateful components (calendar, date pickers, table, list, tree, tabs, wizard, select/combobox, dialogs with structure, …) | `components?: Partial<{ Header, Grid, Cell, … }>` replaces structural parts. A public context hook (`useCalendar()`-style) gives replaced parts the state, actions and **prop getters** (`getGridProps()`, `getCellProps(item)`) that carry ARIA, roving `tabindex` and keyboard handling, so a replacement that spreads them keeps rules 9 and 10. Behaviour defaults (paging step, item model, navigation) are UI5's and can be overridden. |
| T4 Headless (option, not now) | — | Export the state hook and parts so consumers compose from scratch. Only a design note now: say what T3 must expose so T4 can be added later without breaking changes. |

Questions the contract must answer:

1. **ARIA ownership in replaced parts.** Prop getters, wrapper components, or both? How does a test prove that a
   replacement keeps the accessibility tree (rule 9)? Propose the test helper.
2. **Defaults and parity.** With no overrides, rendering is pixel- and tree-identical to today. With overrides, which
   guarantees remain: keyboard model, announcements, texts, RTL?
3. **Public API surface and stability.** Are `components` keys, context shape and prop-getter names public API under
   rule 7? Propose how a new extension point ships first (e.g. documented as experimental for one release) and how it
   becomes stable.
4. **When to add an extension point.** A rule of thumb that keeps the API from growing without end. For example: add a
   point when a realistic consumer need would otherwise force a fork; otherwise document "fork this part".
5. **Docs and stories.** Each component's docs gets a "Customise" section and a story per tier it supports. How the
   G-wave `usage` metadata mentions extension points to coding agents.
6. **Registry packaging.** Does a consumer who replaces a part still install the same item? Must exported parts be
   importable from the item file? Check with `node scripts/smoke-install.mjs`.
7. **AGENTS.md rule.** Draft "rule 11 — extensibility" text (new and changed components follow
   `docs/extension-contract.md`; customisation points can't drop ARIA, texts or locale behaviour). Put the draft in the
   contract; it goes into AGENTS.md after owner approval (see Acceptance).

Also deliver a **component inventory**: one row per registry component (81) with its tier, its structural parts (the
likely `components` keys), and what is missing today. Sort it into rollout groups (see Deliverable 4).

## Deliverable 2 — Calendar design (`docs/spikes/calendar-composition/README.md`)

Apply the contract to `Calendar` and the date pickers concretely:

- `components` keys, for example `Header`, `NavButton`, `HeaderButton`, `DayGrid`, `WeekNumber`, `DayCell`,
  `GridPicker` (months, years, year ranges: one generic grid with consumer-defined items, count and row size),
  `Legend`, `LegendItem`.
- The context hook: focused date, selection and `select(date, detail)`, current picker and `showPicker`, `page(dir)`,
  `labels`, `locale`, week config, and the prop getters for grid, row, row header, cell and header buttons.
- Behaviour overrides, each defaulting to UI5:
  - paging step (`getPage(date, dir)` or a controlled page state);
  - grid item model for the generic `GridPicker`;
  - week number (H6b's `getWeekNumber` with `defaultNumber`).
- Map every planned H6 / H6b point onto the design. State which stay as shorthands (e.g. `renderDay` = content of the
  default `DayCell`) and which disappear because a `components` override covers them. H6c is a bug fix and stays as
  it is.
- Date pickers: how `components` and the shorthands reach the embedded Calendar (one `calendarProps` passthrough, or
  explicit props).

## Deliverable 3 — prototype that proves it (`docs/spikes/calendar-composition/`)

- Copy `registry/ui/calendar.tsx` into the spike folder and refactor the **copy** to the Deliverable 2 design. Don't
  edit `registry/`.
- **Parity proof:** a spike test renders the registry `Calendar` and the prototype's default `<Calendar>` for every
  existing calendar fixture case. The DOM accessibility tree must be equal and the screenshots identical. If they
  differ, the design is wrong, not the test.
- **Extension proof:** a consumer in the spike builds, using only the prototype's public API (no imports of
  internals):
  1. a **fiscal period picker**: P01–P16 grid per fiscal year, special periods 13–16 selectable as items, paging by
     fiscal year in the header, keyboard model and screen-reader names intact;
  2. a **fiscal day calendar**: period label in each cell, fiscal week numbers, a click selects the whole period,
     paging by fiscal period.
  - Reuse `docs/spikes/fiscal-calendar/fiscal-variants.ts` and `fiscal-adapter.ts` as the data.
  - Port the existing spike tests and add keyboard, accessible-name and axe tests for the period picker.
- Suite runs with its own config, like the fiscal spike, and stays out of `pnpm test`.

## Deliverable 4 — plan updates (drafts for the owner)

- Rewrite `docs/plan/tasks/H6-calendar-extension-points.md` to implement the approved Calendar design. Rewrite H6b as
  well if the design absorbs it. Keep H6c.
- Add a note to `H1-analytical-table-foundation.md`: its extension contract conforms to `docs/extension-contract.md`,
  and any differences are listed.
- Propose rollout cards for the other components by group (e.g. "X2 — T2/T3 for list, tree, select, combobox"). Give
  scope and order, and keep each card S or M; E4 and E5 were returned twice for being too large. Write only the
  card list and goals in `docs/plan/README.md` under Wave X; full cards come after approval.
- Rollout must not collide with P1–P6 (they edit the same component files). Propose the order: rollout after a
  group's P card, or the P card first.

## Files

New:
- `docs/extension-contract.md`;
- `docs/spikes/calendar-composition/**`.

Edited:
- `docs/plan/README.md` (Wave X section);
- `docs/plan/tasks/H6-*.md`, `H6b-*.md` and `H1-*.md` (notes or rewrites as above).

**No `registry/`, `tests/`, `docs/src/` or AGENTS.md edits.** This card can run in parallel with any other card.

## Acceptance

- The contract answers questions 1–7 with a recommendation each, and includes the component inventory.
- The prototype's parity proof passes (tree equal, screenshots identical) for every existing calendar fixture case.
- The fiscal period picker and fiscal day calendar are built only on the prototype's public API, and their tests pass
  (keyboard, accessible names, axe in four themes).
- Final message: the contract's tiers in one line each, the Calendar `components` keys and context shape, what
  happens to each H6 / H6b point, the proposed rollout cards and order, and open questions for the owner.
- After the owner approves (in a later session): AGENTS.md gets rule 11, and H6 runs as rewritten.
