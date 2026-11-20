# petalo

React components that follow the SAP Fiori (Horizon) design language, in look **and** interaction, distributed as a
[shadcn/ui](https://ui.shadcn.com) registry. *Petalo* is Italian for "petal".
The colors, sizes, shadows and icons are not hand-tuned. They are generated from SAP's open-source theme
packages, and each component is screenshot-compared against [UI5 Web Components](https://github.com/UI5/webcomponents),
SAP's official implementation.

[![CI](https://github.com/snest007/petalo/actions/workflows/ci.yml/badge.svg)](https://github.com/snest007/petalo/actions/workflows/ci.yml)

> An independent project, not affiliated with or endorsed by SAP SE, and not an SAP product. "SAP" and "Fiori" are
> trademarks of SAP SE, used here only to describe the design language this project follows.

Browse the [component docs and floorplans](https://snest007.github.io/petalo/).

## Why petalo

[UI5 Web Components](https://github.com/UI5/webcomponents) are SAP's official, framework-independent Fiori
implementation, and a good choice when you want a maintained library you consume as-is. petalo takes the
[shadcn/ui](https://ui.shadcn.com) approach instead: you get the source, so you can change anything.

- **You own the code.** `npx shadcn add @petalo/<name>` copies plain React + TypeScript files into your project.
  Edit markup, behaviour or styles directly; there is no package version to wait for and nothing to fork.
- **No Shadow DOM.** Every element is in your DOM, so Tailwind classes, your CSS, `className` on any part,
  `querySelector` and testing tools reach it. UI5 Web Components render inside Shadow DOM, where outside styles only
  reach what a component exposes through CSS variables, `::part()` and slots.
- **Composable parts.** Components are built from small exported pieces (291 exports across the registry, e.g.
  `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`) instead of one closed element, and 26 components accept
  `asChild` to render as your own element (a router link, for example).
- **React-native data flow.** Controlled and uncontrolled props (`value` / `onValueChange`, `open` /
  `onOpenChange`), typed with TypeScript; DataTable is built on TanStack Table, so column definitions, sorting and
  filtering use its API.
- **Same tokens, your theme.** Styling uses SAP's `--sap*` theme parameters and UI5's component parameters as plain
  CSS variables. Switch the four Horizon themes and cozy/compact density with `data-theme` / `data-density` on any
  element, or override a variable to rebrand.
- **Fidelity is tested, not assumed.** Components are pixel-compared with UI5 Web Components 2.28 in 4 themes ×
  2 densities (the few with no UI5 Web Component, such as FilterBar, are checked against SAP's design guidelines),
  and keyboard models and ARIA are ported from UI5's source. Customization points such as `asChild` keep the
  component's roles, states and focus handling.

What you give up: updates are not automatic. When you have edited a copied file, you merge upstream changes
yourself (`npx shadcn add --diff` shows what changed), as with any shadcn registry.

## Status: all four phases done (foundation, core, complex controls, layouts & floorplans)

| | |
|---|---|
| Themes | Morning Horizon, Evening Horizon, High Contrast Black, High Contrast White (`data-theme`) |
| Density | cozy (default), compact (`data-density="compact"`, works on any subtree) |
| Tokens | 1479 `--sap*` variables per theme + 1477 component parameters from UI5 (main + fiori packages) |
| Icons | 704 SAP Horizon icons, tree-shakeable |
| Components | **Actions** Button, ButtonBadge, SplitButton, ToggleButton, SegmentedButton · **Forms** Label, Input, TextArea, Select, ComboBox, MultiComboBox, MultiInput (+Token, Tokenizer), NumericInput, StepInput, CheckBox, RadioGroup, Switch, Slider/RangeSlider, RatingIndicator, FileUploader, ColorPalette, ColorPalettePopover, ColorPicker, Form · **Dates** Calendar, DatePicker, DateRangePicker, TimePicker, DateTimePicker · **Data** Table, DataTable (TanStack, virtualized), List, Tree, Timeline, UploadCollection, ObjectStatus, ObjectNumber, ObjectIdentifier · **Overlays** Dialog, Popover, ResponsivePopover, Menu, Toast, ViewSettingsDialog, ValueHelpDialog, AdaptFiltersDialog, UserMenu · **Display** MessageStrip, Tag, Avatar/AvatarGroup, Card, Panel, BusyIndicator, ProgressIndicator, Link, Title, Text, ExpandableText, Carousel, MediaGallery, HeroBanner, IllustratedMessage · **Navigation** Tabs (IconTabBar), Breadcrumbs, Toolbar, Bar, FilterBar, ShellBar, Search, ProductSwitch, NotificationList, SideNavigation, Wizard, VariantManagement · **Layout** Page, DynamicPage, ObjectPage, FlexibleColumnLayout (+`useFlexibleColumnLayout`), DynamicSideContent, NavigationLayout |
| Floorplans (blocks) | `app-shell`, `launchpad` (shell + side navigation), `list-report`, `object-page-floorplan`, `master-detail` (flexible column layout), `wizard-page`, `empty-states` — preview at `/block.html?name=<block>`, install with `npx shadcn add @petalo/<block>` |
| Illustrations | 118 SAP illustrations (72 Fiori + 46 TNT) in Scene/Dialog/Spot/Dot sizes; `illustrations-core` (14 common states) ships with IllustratedMessage, the rest as `@petalo/illustration-<name>` |
| Verified | 600 fixtures pixel-diffed vs UI5 2.28 in 4 themes × 2 densities (4800 cells, worst 1.6%); components without a UI5 Web Component (FilterBar, ValueHelpDialog, ObjectPage, Object*) checked against SAP's guideline images; axe; 1,418 Playwright tests incl. Fiori keyboard models, phone layouts and RTL; 4,073 Storybook render/axe/Controls checks |

## Browse in Storybook

Browse [Storybook](https://snest007.github.io/petalo/storybook/) for individual component states, live Controls, source code and usage guidance. Run `pnpm storybook` locally at `http://localhost:6006`.

## Install into an app

Requires Tailwind CSS v4 and React 19.

```bash
npx shadcn@latest init https://snest007.github.io/petalo/r/petalo.json
```

This writes the theme to `src/styles/fiori/`, adds the imports to your Tailwind CSS entry, maps shadcn's
`--primary` / `--border` / … to Fiori tokens, and installs the components. Add components individually with
`npx shadcn add @petalo/button`.

The SAP 72 font is a separate, optional item (see [License](#license) before you add it):

```bash
npx shadcn@latest add https://snest007.github.io/petalo/r/fiori-font.json
```

To switch themes and density, set attributes on `<html>` (or any element):

```html
<html data-theme="sap_horizon_dark" data-density="compact">
```

Next.js: the CLI writes the theme files to `src/styles/fiori/`. If your CSS entry is `app/globals.css`,
move the folder next to it, or fix the `@import` paths.

## Usage

```tsx
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { accept } from "@/lib/fiori-icons"

<Button variant="emphasized">Save</Button>          // default | emphasized | transparent | positive | negative | attention
<Button variant="positive"><Icon icon={accept} />Approve</Button>
<Label htmlFor="name" required showColon>Name</Label>
<Input id="name" valueState="negative" valueStateMessage="Enter at least 3 characters." />
<Select defaultValue="de">
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="de">Germany</SelectItem>
    <SelectItem value="cn">China</SelectItem>
  </SelectContent>
</Select>
```

Fiori behaviour this library reproduces (beyond appearance):

- **Select**: while closed, ↑/↓/Home/End change the value in place; Alt+↓, Alt+↑, F4, Space and Enter open the list.
- **Value states** (negative, critical, positive, information): the field styling, and a message that appears
  while the field is focused, is linked with `aria-describedby`, and defaults to SAP's standard text.
- **Focus**: the inner focus ring appears only for keyboard focus, never on mouse click.
- **F6 navigation**: install `@petalo/f6-navigation` and call `useF6Navigation()` or `installF6Navigation()` to enable page-group navigation. The five main floorplan blocks opt in; Popup scopes keep navigation inside the open surface.
- **Chinese text**: the 72 font has no CJK glyphs, so the font stack falls back to PingFang SC / Microsoft YaHei / Noto Sans CJK.

## Localization

Install the locale utilities and optional SAP translations:

```bash
npx shadcn add @petalo/i18n-de
```

```tsx
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "@/lib/fiori-i18n/de"

<FioriLocaleProvider locale="de-DE" texts={de}>
  <StepInput defaultValue={1.5} valuePrecision={1} />
</FioriLocaleProvider>
```

Component text props override the provider table. A component locale prop overrides the provider locale;
without either, the locale hook resolves the browser language. Existing component defaults remain compatible
without a provider. Set `dir` on your application's root for RTL; the provider exposes direction without changing
the document. The Localization docs page demonstrates text overrides, decimal input, date/time formatting,
collation and plural categories. The Storybook Locale toolbar loads the matching optional pack.

The 48 optional packs are generated deterministically from SAP's UI5 Web Components **2.28.1** and
OpenUI5 **1.154.0** translations (© SAP SE, Apache-2.0). They contain only keys with an implemented text owner;
[the source audit](docs/plan/i18n-audit.md) records remaining localization gaps. E5 acceptance is still pending.
Numeric and Gregorian date displays use Latin digits where the pinned UI5 formatters do; Arabic typed digits
and separators are accepted as an input extension. Calendars remain Gregorian.

## Use with coding agents

Copy `skills/petalo` into your project's `.claude/skills/` or `.agents/skills/` directory. The skill helps agents
choose components and floorplans using this registry's APIs. Its category references are generated from the same item
metadata as the docs and registry; run `pnpm skill:build` after editing usage guidance.

## Develop

```bash
pnpm install
pnpm dev               # docs at http://localhost:5173; fixtures at /?fixtures, UI5 reference at /ui5.html
pnpm check             # regenerate, typecheck, build registry + site, run all tests
```

| Path | What |
|---|---|
| `scripts/generate-tokens.mjs` | Writes `registry/styles/fiori.css` (tokens, density, shadcn mapping) and `fiori-tailwind.css` from `@sap-theming/theming-base-content` and UI5's compiled theme parameters |
| `scripts/generate-icons.mjs` | Writes `registry/lib/fiori-icons.ts` from `@ui5/webcomponents-icons` |
| `scripts/build-registry-json.mjs` | Writes `registry.json`; `REGISTRY_URL` sets the `@petalo` namespace URL baked into `petalo.json` |
| `registry/` | What gets distributed: `ui/`, `lib/`, `styles/fiori-components.css` |
| `scripts/generate-illustrations.mjs` | Writes `registry/lib/fiori-illustrations/` and their registry items from `@ui5/webcomponents-fiori` |
| `registry/blocks/`, `registry/block-items/` | Floorplans (`registry:block`), previewed by `docs/block.html` |
| `docs/src/fixtures/<name>.tsx` + `.ui5.ts` | Fixtures rendered identically by `index.html?fixtures` (ours) and `ui5.html` (UI5) |
| `tests/visual.spec.ts` | Pixel diff per fixture; failing cells are written to `test-results/visual/` as `-ours/-ui5/-diff.png` |
| `tests/a11y.spec.ts` | axe, keyboard and focus behaviour |

Upgrading SAP's packages: bump `@sap-theming/theming-base-content` / `@ui5/webcomponents*`, then run `pnpm check`.
The visual tests will show any component whose reference changed.

Adding a component: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for component ownership and reference fixtures, and
[AGENTS.md](AGENTS.md) for task-card workflow and acceptance checks.

## Not done yet

The backlog with task cards is in [docs/plan](docs/plan/README.md) (open cards in `docs/plan/tasks/`, finished ones in
`docs/plan/tasks/done/`). Calendars are Gregorian only, by design. None of the following blocks using the library.

- **Accessibility and localization parity with UI5, library-wide:** the comparison and ratchet infrastructure (cards
  E4, E5) and the per-group fixes (wave P) are in progress.
- **Extension points** for every component (wave X, after its P card), following [the extension contract](docs/extension-contract.md).
- **From [issue #1](https://github.com/snest007/petalo/issues/1)** (wave H): AnalyticalTable, Calendar extension
  points, Input suggestions + MessageBox, SplitButton, ButtonBadge, NumericInput, SelectDialog, SplitterLayout,
  DynamicDateRange and the remaining lower-priority components.
- **Storybook coverage gate** (card S5).

## License

Apache-2.0. Generated theme values, icon paths and illustrations are © SAP SE or an SAP affiliate company, used
under Apache-2.0 (`@sap-theming/theming-base-content`, `@ui5/webcomponents`, `@ui5/webcomponents-fiori`,
`@ui5/webcomponents-icons`). Components and component CSS are partly derived from UI5 Web Components and OpenUI5
(Apache-2.0); each shipped file says so in its header.

**The 72 font is not covered.** Its files carry their own license ("Copyright SAP SE. All rights reserved" plus
Monotype terms that forbid copying and redistribution), even though they sit inside an Apache-2.0 npm package. This
registry does not bundle them. The optional `@petalo/fiori-font` item only adds `@font-face` rules that load the
font from SAP's npm package on jsDelivr, as UI5 Web Components does. Install it only if your use of 72 is permitted
(for example under your SAP license); without it the theme falls back to Arial / Helvetica.

The SAP logo icon (`sap-logo-shape`) is left out of the icon set: Apache-2.0 grants no trademark rights.
