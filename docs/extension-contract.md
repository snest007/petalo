# Extension contract

Status: **approved by the owner on 2026-11-17** (X0 review), with the amendments below. This is the library contract
that AGENTS.md rule 11 points to. UI5 parity remains the default, and fiscal/business rules belong to consumers. This
contract generalises H1's instance/state/content/props contract. Calendar evidence and exact API signatures are in
[the composition spike](spikes/calendar-composition/README.md).

## Amendments at approval (they override the sections below where they conflict)

1. **Tiers in the inventory are ceilings, not targets.** Every rollout card implements **T1 in full** for its
   components. A T2 or T3 point ships only with a realistic consumer example that would otherwise fork the file
   (section 4), in a story or spike, and its invariant tests. Candidate `components` keys that no example needs stay
   unbuilt; the card's final message lists them as "not needed yet". "Apply the inventory tiers" in a rollout card
   means exactly this.
2. **Calendar ownership.** P2a owns Calendar and the three date pickers and must merge before H6.
   See the [Backlog](plan/README.md) for current scheduling and the remaining dependencies.
3. **"Release" for experimental status (section 3)** means one published registry version: a deploy of `public/r`
   (card E3's publishing pipeline) with a changelog entry naming the experimental surface. An extension point leaves
   experimental status at the earliest in the following release, by an explicit card, never by renaming (rule 7).

## Tiers

A component implements its highest needed tier and all lower applicable capabilities. Stateless components have
no invented state or locale prop: locale/text capabilities apply wherever the reference has locale-dependent
behaviour. Compound components count as one item, including their exported parts.

| Tier | Applies to | Required capabilities |
|---|---|---|
| **T1 Style & state** | Every component | Root `className`; stable `data-slot` on each part and documented state `data-*`; typed `classNames?: Partial<Record<Slot, string>>`. Preserve existing names. Native props reach their documented owning DOM element. Every externally meaningful state has `x/defaultX/onXChange`; transient hover/pressed/measurement state is internal. Overridable `texts`, existing labels aliases, resolved locale/provider/RTL from rule 10. |
| **T2 Content** | Consumer items/content | Content-only render slots in library-owned semantic hosts; item info contains state, resolved locale and `defaultContent`. Extra-props hooks merge styles/classes/handlers but cannot alter semantic ownership. Selection callbacks include item/date, action/source and resulting state, preserving one-argument callbacks. |
| **T3 Structure** | Composite or stateful layouts | Partial typed `components` map; public component context hook exposing state, actions, item models and semantic prop getters; protected public row/cell/trigger parts. Replace layouts without rebuilding UI5 keyboard/ARIA logic. Named behavioural adapters override a coherent policy (e.g. paging) with UI5 defaults. Instance access for engines such as H1's table. |
| **T4 Headless** | Future option only | Separately export the state hook and default parts; no implementation in this wave. T3 must keep a DOM-independent model, stable action/detail types, semantic getters with refs and engine facade so T4 can reuse them additively. |

## 1. ARIA ownership: recommend both wrappers and getters

**Semantic boundaries stay library-owned.** A replacement is rendered inside the existing grid/cell/button/list
host; no extra host is inserted for the default. Layout replacements arrange public protected parts. A replacement
cell changes content/layout *within* the cell, not its role or focus identity. Public helpers such as `CalendarCell`
and `CalendarRow` call the same getters used by default parts. An inert outer layout can be replaced freely; a
semantic tag change needs a separately reviewed typed host adapter, not unrestricted `asChild`.

Getters accept extra props as an argument (`getCellProps(item, extra)`) and return the fully merged result. Do not
suggest `{...getter()} {...extra}`: that discards protection. Protected values include role, owned `aria-*`, ids and
id refs, `tabIndex`, item identity, focus refs, keyboard/pointer handlers and count/index/selection states. Extra
props cannot remove hidden texts/live regions. Ignore conflicting ownership props and warn in development with
component, part and attribute. Unowned native ARIA (e.g. consumer descriptions) can be added on documented targets;
accessible-name augmentation uses a named label hook so reference text is preserved. The Calendar spike deliberately
filters all extra ARIA; H6 must implement the narrower per-part ownership allowlist, with tests.

Merge classes with `cn`; merge style objects property-by-property (consumer decorative properties win). Compose
refs. Run core event handlers before observational consumer handlers. Extra handlers cannot cancel core ARIA/focus
work. Behaviour changes go through a named adapter or controlled state. Where a public callback is intentionally
cancelable, document it separately and preserve the reference contract. Content inside a roving cell is not another
tab stop; default descendants are demoted to `tabIndex=-1`. A future grid supporting interactive editing must own
an F2 entry/exit mode (H1), rather than silently making arbitrary descendants tabbable.

Rejected: getters alone (consumers can forget to spread); cloning unrestricted render output/`asChild` (can lose ref
or change semantic tag); wrappers adding extra DOM (break pixels); filtering only TypeScript props (JS bypasses it).
A consumer can deliberately omit an entire row in a layout; no API can guarantee arbitrary markup. The contract
requires using the public semantic parts and passing the conformance test before claiming accessibility support.

### Proposed `expectExtensionConformance` helper

A future shared helper belongs to the first implementation card that lists its files, not X0. Given baseline and
replacement mounts, fixture IDs, interaction steps and declared domain changes, it must:

1. Compare the DOM accessibility tree (not only raw HTML) with UI5 for every existing default fixture. Compare the
   replacement to its default for neutral decoration; for a changed domain compare exact expected role/name/state
   trees and identity/count invariants. Normalise generated IDs **only by a bijective mapping**, preserving all
   `aria-labelledby`/`describedby` targets and references. Never strip roles/names/states or add baseline entries.
2. Verify one roving tab stop per grid, focus movement/return, selection/disabled state, hidden text and live-region
   output. Run the reference keyboard paths in LTR and RTL, including modifier keys and focusable custom children.
3. Attempt conflicting role, selected, expanded, disabled, id and tabindex props; assert owned values, dev warnings,
   merged classes/styles and both chained handlers. Add a control proving missing wrappers/getters fails the helper.
4. Run axe in all four themes and localised name/format assertions in de-DE, zh-CN and ar-EG. Compare no-override
   screenshots with the existing oracle; never increase tolerance to accommodate an extension refactor.

The spike's `parity.spec.ts` is executable proof of step 1 and exact PNG equality for all current Calendar cases;
its fiscal and extension specs demonstrate the ownership/keyboard/name/axe subset. It does not replace E4/P2's UI5
tree correction work or promise accessibility of arbitrary consumer markup.

## 2. Defaults and parity: recommend strict default identity

No overrides means identical pixels, sizes, accessibility tree, focus and behaviour to the current component; the
existing UI5 ratchets also remain unchanged. A later parity bug fix (H6c) changes the reference-backed default
calculation deliberately, not to hide a refactor mismatch.

With overrides, styling/content/domain output may change. Library-owned roles, state relationships, keyboard
navigation, announcements, overridable text resolution, locale formatting and RTL remain guaranteed when public
parts/adapters are used. Paging applies consistently to header and keyboard actions. Generic item grids use stable
keys independent of dates; selected and focused states stay separate. Domain-specific text/formatting is the
consumer's responsibility through supplied locale/text APIs. No promise of pixel equivalence for custom content.

Rejected: reducing guarantees for all custom renderers; keeping keyboard paging tied to months while the header
pages fiscal periods; adding business features to the registry; fixing unrelated parity defects in an extension card.

## 3. Public surface/stability: recommend explicit API ownership

`components` keys and their prop types, context state/action names, getters, slot/state names, details, public parts,
engine facade and behavioural adapters are **public API under rule 7**. Return read-only state snapshots, not mutable
internal React state or DOM caches. Document refs on their target hosts. Keep H1's `tableOptions` and `tableRef`, but
merge consumer engine options before library-owned semantics; expose TanStack instance plus stable imperative API.
Consumer engine features cannot overwrite semantic prop getters or the reference keyboard model.

Ship a new extension surface with documented `experimental` status for at least one release (amendment 3), an upgrade example,
one realistic independent consumer and exact default conformance tests. Experimental status is a feedback signal,
**not permission to rename/remove exports**: rule 7 still needs an explicitly authorised card. Stabilise when a
release of consumer feedback, registry installation, keyboard/locale/axe and upgrade tests pass. Additive keys can
ship independently; don't expose private helpers as context fields merely because they exist.

Rejected: freezing an undocumented internal context; treating experimental as a blanket breaking-change waiver;
forcing an experimental prop rename on stabilisation; publishing a headless API before consumers prove the model.

## 4. Growth rule: recommend a demonstrated fork boundary

Add an extension point when a realistic consumer example needs to replace a reusable structural or behavioural
boundary and would otherwise fork source, and the boundary can keep owned semantics through a small API. Require
an example, invariant tests and a short upgrade story. Reuse an existing content slot, class map, controlled state
or generic item model first. A fiscal picker proves Header + paging + keyed GridPicker; it does not justify fiscal
props in the library. If no invariant can be maintained, document a deliberate fork and its lost upgrade path.

Rejected: one prop per feature/domain; exporting every helper; a replacement hook for every decorative span; an
open-ended plugin bus with no ownership. Simple controls stop at T1 or T2 unless a concrete composition needs T3.

## 5. Documentation, stories and coding-agent metadata

Recommend a **Customise** section per component with its supported tier, typed slot map, state/prop-target table,
one content example, one structural example where supported, owned-prop rules, locale and upgrade constraints.
One story per supported tier (T1 styled/controlled, T2 custom content, T3 replacement using public parts), plus
neutral overrides in paired fixtures. Domain-only demos use explicit React-only justification; default tree fixtures
stay paired against UI5. Fixture inventories must include changed states, RTL and localisation.

G-wave `usage` metadata should add a versioned, validated optional `extensions` block in a later schema card X40:
`tier`, `stability`, `slots`, `components`, `context`, `examples`, `ownership` and `source` (repo docs pointer).
The generated skill must explain content versus structure and owned ARIA, not teach agents to fork by default.
Until that schema ships, use supported `useWhen`/`avoidWhen` prose linking appropriate component choices and the
Customise docs; do not insert unvalidated keys. Rejected: inventing metadata fields in X0's registry JSON; relying
on stories alone; telling agents that a getter allows arbitrary overrides.

## 6. Registry packaging: recommend the same item

Replacing Calendar parts still installs `@petalo/calendar`. `Calendar`, its public protected parts, context hook and
all public types are importable from the installed `components/ui/calendar` entry. Helpers may be separate files
owned and registered by that **same item** (H1's analytical-table helpers follow this rule); no hidden dependency on
repository aliases or docs. Custom parts belong to the consumer. Imports of other library components must be listed
in `registryDependencies`; no new npm dependency for the Calendar design.

Run `node scripts/smoke-install.mjs` to check the unchanged registry. Its all-block smoke covers installation/build/
render of current items, **not a new prototype export**. The spike's `packaging-proof.mjs` additionally creates a
fresh consumer, installs calendar, substitutes only the local prototype copy into that consumer's installed entry,
imports replacements and hook from that entry, and builds/renders it. This is a simulated future item upgrade,
clearly distinct from changing today's registry. H6 must repeat the same consumer proof using actual registry
exports. Rejected: a second calendar-composition item, docs imports in shipped components, or claiming the existing
smoke alone validates new exports.

## 7. AGENTS.md rule 11 (activated 2026-11-17; the AGENTS.md text, which adds amendment 1, is authoritative)

[AGENTS.md rule 11](../AGENTS.md#hard-rules) defines the binding requirements for an extension card and its
acceptance evidence. List any shared packaging, schema, or test-helper edits in the card and name them in the commit.

## Reference models read

- [react-day-picker v9 custom components](https://daypicker.dev/v9/guides/custom-components),
  [versioned documentation source](https://github.com/gpbl/react-day-picker/blob/v9.13.0/website/docs/guides/custom-components.mdx):
  partial replacement map, `useDayPicker` state/actions/classNames/labels/modifiers, default-part composition and
  responsibility to forward ARIA/ref/handlers. The public website returned HTTP 403, so the v9.13.0 official docs
  source was read. Adopt its map/context and modifier model; add protected hosts to satisfy this repo's rule 9.
- [Radix composition](https://www.radix-ui.com/primitives/docs/guides/composition): `asChild` clones its child;
  consumers must spread props/ref and preserve accessible element types. Keep existing compound APIs; do not add
  unrestricted semantic tag replacement to Calendar.
- [Downshift useSelect](https://www.downshift-js.com/use-select/): item/menu/trigger prop getters, controlled state,
  item-to-string for typeahead/live names, refs needed for focus/scroll. Adopt coherent state/actions/getters.
- [React Aria useCalendar](https://react-spectrum.adobe.com/react-aria/useCalendar.html): separate state plus
  useCalendarGrid/useCalendarCell ARIA hooks and focused/visible ranges. Adopt model/semantic separation without
  adding dependencies or non-Gregorian calendar scope.

## Inventory and rollout groups

Source snapshot: 81 `registry/ui/*.tsx` entries at X0 base `5ed08d1`; 83 `registry/items/*.json` includes two library
items (`f6-navigation`, `variants`) outside the component count. Proposed keys below are **candidates**, not promises
that all will ship. `—` means T1/T2 needs no structural replacement. Current `className`, native props, existing
compound parts and value-state APIs remain; gaps below describe missing typed uniform extension surfaces, not an
assertion that every current part fails accessibility. P cards settle the existing ARIA/text gaps before rollout.

| Rollout / predecessor | Component | Target tier | Candidate structural keys | Present and missing today |
|---|---|---|---|---|
| X1 (P1) | `button` | T1 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract. |
| X1 (P1) | `toggle-button` | T1 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract. |
| X1 (P1) | `segmented-button` | T3 | Group,Item | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X2 (P1) | `input` | T2 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X2 (P1) | `textarea` | T1 | — | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract. |
| X2 (P1) | `label` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X3 (P1) | `checkbox` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X3 (P1) | `radio-group` | T3 | Group,Item | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X3 (P1) | `switch` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X4 (P1) | `slider` | T1 | — | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract. |
| X4 (P1) | `step-input` | T1 | — | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract. |
| X4 (P1) | `rating-indicator` | T1 | — | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract. |
| X5 (P1) | `select` | T3 | Trigger,Content,Item,Group | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X6 (P1) | `form` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X7 (P2) | `combobox` | T3 | Input,Popup,Item | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X7 (P2) | `multi-combobox` | T3 | Input,Popup,Item,Tokenizer | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X8 (P2) | `multi-input` | T3 | Input,Tokenizer,ValueHelp | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X8 (P2) | `token` | T2 | — | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X8 (P2) | `tokenizer` | T3 | Items,Overflow | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X9 (P2) | `file-uploader` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X10 (P2) | `color-palette` | T3 | Grid,Item | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X10 (P2) | `color-palette-popover` | T3 | Trigger,Content | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X10 (P2) | `color-picker` | T3 | Channels,Preview,Palette | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X11 (P2) | `time-picker` | T3 | Field,Popup,Clock | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X11 (P2) | `picker-field` | T3 | Input,Trigger,Message | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| H6/H6b (P2) | `calendar` | T3 | Header,NavButton,HeaderButton,DayGrid,Grid,Row,DayCell,WeekNumber,GridPicker,Cell,Legend,LegendItem | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| H6/H6b (P2) | `date-picker` | T3 | Field,Popup,Calendar | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| H6/H6b (P2) | `date-range-picker` | T3 | Field,Popup,Calendar | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| H6/H6b (P2) | `date-time-picker` | T3 | Field,Popup,Calendar,Time | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X12 (P3) | `list` | T3 | Items,Item,Group,NoData | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X13 (P3) | `tree` | T3 | Nodes,Node,Toggle | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X14 (P3) | `table` | T3 | Header,Body,Row,Cell,Popin | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X15 (P3) | `data-table` | T3 | Header,Body,Row,Cell,Pagination,NoData | root/part className; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X16 (P3) | `timeline` | T3 | Items,Item | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X16 (P3) | `upload-collection` | T3 | Items,Item,Upload | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X17 (P3) | `object-status` | T1 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract. |
| X17 (P3) | `object-number` | T1 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract. |
| X17 (P3) | `object-identifier` | T2 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X18 (P4) | `dialog` | T3 | Header,Body,Footer | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X19 (P4) | `popover` | T3 | Trigger,Header,Body,Footer | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X19 (P4) | `responsive-popover` | T3 | Header,Body,Footer | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X20 (P4) | `menu` | T3 | Content,Item,Group | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X20 (P4) | `user-menu` | T3 | Header,Accounts,Items | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X21 (P4) | `toast` | T2 | — | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X22 (P4) | `value-help-dialog` | T3 | Header,Search,Results,Tokens,Footer | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X23 (P4) | `view-settings-dialog` | T3 | Tabs,Items,Footer | root/part className; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X23 (P4) | `adapt-filters-dialog` | T3 | Search,Groups,Items,Footer | root/part className; existing data-slot; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X24 (P5) | `avatar` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X24 (P5) | `busy-indicator` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X24 (P5) | `progress-indicator` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| H13 (P4 parity) | `user-settings-dialog` | T1 | — | Category, tab and page state, caller-owned view content, and localized dialog actions. The `classNames` map is experimental. |
| H12 (P4 parity) | `action-sheet` | T1 | — | Owned trigger, popup and action buttons, controlled visibility, and responsive and locale-aware labels. The `classNames` map is experimental. |
| H11 (P5 parity) | `analytical-card-header` | T1 | — | Root and part styling, KPI state and trend attributes, localized strings and values, and declarative side indicators. Both `classNames` maps are experimental. |
| X25 (P5) | `card` | T3 | Header,Body,Footer | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X25 (P5) | `panel` | T3 | Header,Body | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X26 (P5) | `carousel` | T3 | Pages,Navigation | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X26 (P5) | `media-gallery` | T3 | Items,Preview,Navigation | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X27 (P5) | `hero-banner` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X27 (P5) | `illustrated-message` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X28 (P5) | `expandable-text` | T1 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract. |
| X28 (P5) | `link` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X28 (P5) | `text` | T1 | — | root/part className; existing data-slot; missing typed classNames/complete slot-state contract. |
| X28 (P5) | `title` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X29 (P5) | `message-strip` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X29 (P5) | `tag` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X29 (P5) | `icon` | T1 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract. |
| X30 (P6) | `bar` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |
| X30 (P6) | `toolbar` | T3 | Items,Overflow | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X30 (P6) | `breadcrumbs` | T3 | Items,Overflow | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X31 (P6) | `tabs` | T3 | Headers,Header,Panel,Overflow | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X31 (P6) | `wizard` | T3 | Steps,Step,Navigation | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X32 (P6) | `filter-bar` | T3 | Header,Filters,Actions | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X32 (P6) | `variant-management` | T3 | Trigger,Menu,Save,Manage | root/part className; existing data-slot; existing controlled/uncontrolled states; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X33 (P6) | `notification-list` | T3 | Items,Item,Group | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X33 (P6) | `product-switch` | T3 | Grid,Item | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X34 (P6) | `search` | T3 | Field,Suggestions,Item | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X34 (P6) | `shell-bar` | T3 | Start,Search,Actions,Profile | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X35 (P6) | `side-navigation` | T3 | Items,Item,Group,Overflow | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X36 (P6) | `dynamic-page` | T3 | Title,Header,Content,Footer | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X37 (P6) | `object-page` | T3 | Header,Sections,Section,Subsection,Navigation | root/part className; existing data-slot; existing controlled/uncontrolled states; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X38 (P6) | `dynamic-side-content` | T3 | Main,Side | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X38 (P6) | `flexible-column-layout` | T3 | Begin,Mid,End,Navigation | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X39 (P6) | `navigation-layout` | T3 | Header,Side,Content | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract; replacement map/public context + semantic getters. |
| X39 (P6) | `page` | T2 | — | root/part className; existing data-slot; children/compound content; missing typed classNames/complete slot-state contract; uniform content info and protected extra-props contract. |

The two library items keep their existing public state/actions API. They need no visual tier; validate F6 and variant
integration alongside their owning P6/components. H1's new AnalyticalTable is not counted among the 81 and implements
T3 in H1–H5. No inventory row authorises feature additions or promises all candidate keys.

Rollout order: approve X0 → complete the component group's P card → the group's X cards; shared-slot/getter patterns
start with H6/H6b after P2a (amendment 2), then X12 (list) and X13 (tree), then selects/comboboxes/tables. H6c follows H6b and fixes
week numbers without changing the new week hook. H0 → H1–H5 stay serial and use this contract. Different P groups may
progress independently; never overlap a group's X/H card with its P card, or two cards editing a shared component.
X40 adds validated extension usage metadata after H6 and X12 establish real APIs; it does not block content rollout.
