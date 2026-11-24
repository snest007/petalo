# Adding a component

Each component owns the files below. Scope shared edits using [AGENTS.md](AGENTS.md#hard-rules) rule 3.
See [card scheduling](docs/plan/RUN.md#picking-cards) for parallel work.

| File | Purpose |
|---|---|
| `registry/ui/<name>.tsx` | The component (distributed to users via shadcn) |
| `registry/items/<name>.json` | Registry metadata: `{ title, description, dependencies?, registryDependencies? }`. Use `"@petalo/icons"` if you import icons, `"@petalo/<other>"` for other components |
| `registry/styles/components/<name>.css` | Optional. Plain CSS for stateful styling that utilities can't express well (no `@layer` wrapper; `pnpm css` wraps everything) |
| `docs/src/fixtures/<name>.tsx` | `defineFixtures({ name, cases, react })`: static states to pixel-compare |
| `docs/src/fixtures/<name>.ui5.ts` | `defineUi5(set, props => HTMLElement)`: the same cases rendered with UI5 Web Components. Import the UI5 modules **and every icon used** (`@ui5/webcomponents-icons/dist/<icon>.js`) at the top |
| `docs/src/demos/<name>.tsx` | `defineDemo({ title, order, Demo })`: an interactive example for the docs page |
| `tests/<name>.spec.ts` | Behaviour tests (keyboard, ARIA, focus) with Playwright |

## Source of truth

The reference is UI5 Web Components 2.28: `node_modules/@ui5/webcomponents` (main) and
`node_modules/@ui5/webcomponents-fiori` (ShellBar, SideNavigation, UploadCollection, Wizard, DynamicPage, …).
Before writing anything, read:

- `dist/generated/themes/<Component>.css.js`: the component's CSS. This is what you port.
- `dist/<Component>.js` and `dist/<Component>Template.js`: DOM structure, keyboard handling, ARIA.
- The `--fiori-*` variables in `registry/styles/fiori.css` are UI5's `--_ui5_*` / `--ui5-*` parameters,
  renamed `--_ui5_button_base_height` → `--fiori-button-base-height` (and `--_ui5-foo` → `--fiori-x-foo`).
  They already switch with theme and density. **Use them; never hard-code a value that has a parameter.**
- `--sap*` tokens are SAP's theme variables, used directly (`bg-(--sapButton_Background)`).

Quick lookup: `grep -- '--fiori-checkbox' registry/styles/fiori.css | sort -u`

## Rules

- React 19, function components, `data-slot="<name>"` on the root, accept `className`, spread `...props`. Follow `registry/ui/button.tsx` and `select.tsx`.
- Tables/virtualisation: `@tanstack/react-table` and `@tanstack/react-virtual` are available (list them in your item's `dependencies`).
- Imports: `@/lib/utils`, `@/lib/fiori-icons`, `@/components/ui/<name>`. Interaction primitives come from `radix-ui` (`import { Checkbox as CheckboxPrimitive } from "radix-ui"`).
- Tailwind v4 arbitrary vars: `h-(--fiori-x)`, `text-(length:--sapFontSize)`, `font-(family-name:--sapFontFamily)`. Line height: UI5 uses `normal`, so write `leading-[normal]` (Tailwind's `leading-normal` is 1.5).
- Don't add `-webkit-font-smoothing`. Don't use `transition` unless UI5 does.
- Focus ring: only for keyboard (`:focus-visible`), drawn the way UI5 draws it (usually an inset pseudo-element).
- Value states use the names `negative | critical | positive | information` and reuse `ValueState`, `valueStateIcons`, `valueStateDefaultText` from `@/components/ui/input`.
- Text is English in the components (callers pass their own strings). Any user-visible default text must be overridable via props.

## Done means

Follow the card's acceptance checks and the [definition of done](AGENTS.md#definition-of-done-every-card).
The [verification budget](AGENTS.md#verification-budget) defines when to run scoped or full suites.

The visual test fails a cell if more than 2% of its pixels differ, or if its size differs at all. Failing cells
are written to `test-results/visual/<theme>-<density>/` as `<id>-ours.png`, `-ui5.png` and `-diff.png`. Open them with the Read tool.
Raise `tolerance` or use `skipCompare` only for a reason you can name (e.g. UI5 animates something we can't freeze),
and put the reason in a code comment.

Fixtures that use `@ui5/webcomponents-fiori` must import `@ui5/webcomponents-fiori/dist/Assets.js` in their `.ui5.ts`,
or the dark/HC themes fall back to Morning Horizon parameters on the UI5 side.

Generated files (`registry.json`, `registry/styles/fiori-components.css`, `public/r/`) are git-ignored; scripts rebuild them.
Commit only your component's own files. If you truly must change a shared file (`fiori-types`, `input.tsx`, a script),
keep the change minimal and say so in your commit message.

## Verification and preview recipes

The verification scripts choose free ports. For direct Playwright commands, set a free `PORT` other than
4173 or 5173 so Playwright builds and serves its own copy. Use a free port in place of the examples below.

```bash
PORT=4310 pnpm exec playwright test                      # full main suite, or append tests/<name>.spec.ts
PORT=4310 pnpm exec playwright test tests/visual.spec.ts  # UI5 pixels across 4 themes × 2 densities
VISUAL_ONLY=button,toggle-button pnpm test:summary tests/visual.spec.ts  # comma-separated fixture prefixes
scripts/ci-local.sh tests/toolbar.spec.ts                 # reproduce Linux CI in Docker
pnpm check                                               # full repository checks in order
pnpm storybook                                           # preview at http://localhost:6006
pnpm storybook:build                                     # build storybook-static/
PORT=4320 pnpm test:storybook                            # render, globals, Controls and axe
STORYBOOK_ONLY=toolbar pnpm test:summary -c playwright.storybook.config.ts tests-storybook/storybook.spec.ts
pnpm dev                                                 # preview docs at http://localhost:5173
pnpm build                                               # build docs into dist/
node scripts/smoke-install.mjs                           # install every block in a fresh shadcn app, build and render
```

The docs preview exposes `/?fixtures`, `/ui5.html`, `/wcr.html`, and `/block.html?name=<block>`.
Use `node scripts/a11y-baseline.mjs --list P<n>` to inspect entries and `--prune P<n>` after a complete capture.

## Components from SAPUI5

Controls absent from UI5 Web Components use **OpenUI5 1.154.0** as a second reference. The pinned `@openui5/*`
packages and UI5 Tooling are dev dependencies only; the reference app in `sapui5/webapp/` is not built into the
docs site or shadcn registry. Use the installed OpenUI5 JavaScript, renderer and theme LESS as the source of truth.

The reference uses UI5 Tooling (option A). Its isolated `sapui5/package.json` intentionally has no dependencies:
`ui5.yaml` resolves the framework, while the root package pins the development sources and CLI. This avoids
Tooling discovering the same framework twice through npm and `ui5.yaml`. The first serve resolves the six
OpenUI5 libraries into `~/.ui5/framework/packages/@openui5/<package>/1.154.0/` and may need registry access;
subsequent serves and browser tests use that local cache. To prepare the cache explicitly, run
`../node_modules/.bin/ui5 use openui5@1.154.0` from `sapui5/`, then start `pnpm sapui5:serve` once.

Run `pnpm sapui5:serve` to open the local reference at `http://localhost:4174/index.html`. Add `?demo` to inspect
the real VariantManagement, MDC FilterBar and Adapt Filters dialog. Both reference modes accept `?theme=`
(`sap_horizon`, `sap_horizon_dark`, `sap_horizon_hcb`, `sap_horizon_hcw`) and `&density=compact`.

To add a comparison:

1. Add `docs/src/fixtures-sapui5/<name>.tsx`, default-exporting a `defineFixtures` set from `../fixture-types`.
   The docs page collects these sets automatically and renders them at `/index.html?fixtures-sapui5`.
2. Add the same case IDs and equivalent real OpenUI5 controls to `sapui5/webapp/fixtures.js`. Keep IDs prefixed
   with the component name; both pages expose their comparison cases through `window.__fixtures`.
3. Await asynchronous control initialization before declaring the reference ready. Open overlays using their
   real API, then move their surface into the fixture cell with the app's in-place popup helper. Keep SAPUI5's
   surface styling; override only viewport positioning. The harness disables animations and waits for themes,
   rendering and fonts before setting `html[data-ready=true]`.
4. Run `PORT=4310 pnpm exec playwright test tests/visual-sapui5.spec.ts`. Playwright starts both the built docs
   and local reference servers. `SAPUI5_PORT` overrides reference port 4174 when another checkout uses it.

The spec compares all cases in four themes and two densities, rejects missing or mismatched case IDs, and uses
the same exact-size and 2% pixel-difference rules as the Web Components oracle. Failed images and reports go
to `test-results/visual-sapui5/<theme>-<density>/`. It blocks remote requests, so the reference must load its
framework, themes and fonts locally. The `sapui5-button` Default and Emphasized cases always run as smoke checks.

## Components from UI5 Web Components for React

For WCR 2.28.2 controls, read the installed `dist/components/<Name>/` implementation, hooks and default renderers.
Mark the fixture set `reference: "wcr"` and add a matching `<name>.wcr.tsx` that exports a fixture set using only SAP
code and shared inputs. Compare `/index.html?fixtures&ref=wcr` with `/wcr.html` using the existing theme, density,
direction and locale query options. Use `pinWcrPopup` for static dialog and popover surfaces, and keep functional
open/close assertions in the component test. Run `PORT=4310 pnpm test:summary tests/{visual-wcr,a11y-tree-wcr}.spec.ts`.

## Adding a block (page template / floorplan)

| File | Purpose |
|---|---|
| `registry/blocks/<name>.tsx` | Default-exports a full-page React component built only from `@/components/ui/*` (no fixed data fetching; sample data inline) |
| `registry/block-items/<name>.json` | `{ title, description, registryDependencies: ["@petalo/…"] }` |
| `tests/<name>.spec.ts` | Behaviour tests against `block.html?name=<name>` |

Preview at `http://localhost:5173/block.html?name=<name>`. Blocks are compared to SAP's guideline images by screenshot, not pixel-diffed.
