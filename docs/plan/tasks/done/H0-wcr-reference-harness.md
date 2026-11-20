# H0 — WCR reference harness: pixels, accessibility tree, locale + WCR texts in the i18n pipeline

**Goal:** a third reference page that renders **UI5 Web Components for React 2.28.2** (`@ui5/webcomponents-react`, SAP's
official React package, Apache-2.0), so components WCR implements in React — AnalyticalTable first, then MessageBox,
MessageView, SelectDialog, SplitterLayout, ActionSheet, AnalyticalCardHeader — are pixel-compared, ARIA-compared and
locale-compared like every other component. Also pull WCR's own i18n texts into the E5 pipeline. Wave H depends on it.

Context: issue #1 (owner + reporter azhu716). Principle agreed with them: **parity with WCR 2.28.2 plus extension
points** — don't invent features beyond the reference; make everything customisable instead. Depends on E4 and E5
(merged): this card extends their tree comparison and i18n tooling.

## Decisions already made (don't revisit)

- Exact devDependencies (this card is allowed to add them): `@ui5/webcomponents-react` **2.28.2**,
  `@ui5/webcomponents-react-base` **2.28.2**. Peer deps already match (`@ui5/webcomponents*` ~2.28.1, React 19).
  Nothing else; WCR's own `@tanstack/react-virtual` pin resolves next to ours.
- The reference page is **`docs/wcr.html`** + `docs/src/wcr-main.tsx`, a separate React root that never imports our
  `registry/` code or our CSS (no `fiori.css`, no Tailwind) — the oracle must stay independent. It imports
  `@ui5/webcomponents-react/dist/Assets.js` (themes + i18n + CLDR for WCR and the web components) and
  `@ui5/webcomponents-react/styles.css` (or the package's `dist/css/index.css` — whichever 2.28.2 exports; check
  `package.json` `exports`), and wraps fixtures in WCR's `ThemeProvider`.
- Theme/density/direction/locale come from the same query parameters as `ui5.html` (`readPageOptions()`); apply with
  `setTheme` / `data-ui5-compact-size` / `dir` / `setLanguage` from `@ui5/webcomponents-base`. Add the page to
  `vite.config.ts` `rollupOptions.input`.
- WCR's theme CSS defines its own `--_ui5wcr*` parameters per theme (`dist/css/themes/sap_horizon.css`,
  `sap_horizon_hc.css`). Generate them into our tokens the same way `--_ui5_*` becomes `--fiori-*`: extend
  `scripts/generate-tokens.mjs` to read WCR's theme CSS and emit `--fiori-wcr-<name>` (lower-case, `_`/`-` normalised,
  same collision rule as `rename()`), per theme, into `registry/styles/fiori.css`. Components ported from WCR use these
  (AGENTS.md rule 2). Note in the generator comment: "WCR theme parameters, © SAP SE, Apache-2.0".

## Fixtures

- Fixture files: `docs/src/fixtures/<name>.tsx` (ours, as today) + **`<name>.wcr.tsx`** (new sibling, a React component
  that renders the WCR equivalent for the same case props). `FixtureSet` gets `reference?: "ui5" | "wcr" | "sapui5"`
  (default `"ui5"`); `ui5-main.ts` skips sets whose reference is `"wcr"`; `wcr-main.tsx` renders only those.
- Popups (MessageBox, SelectDialog, column header popover, ActionSheet) are compared in place like `ui5-popup-in-place.ts`:
  write `docs/src/fixtures/wcr-popup-in-place.ts` that pins WCR's `ui5-dialog`/`ui5-popover` inside the cell.
- Pilot set (this card): one `wcr-smoke` fixture set — WCR `AnalyticalTable` with 3 columns × 5 rows, no features,
  against a **temporary** React side that renders our `DataTable` with the same data. It proves the harness, not
  parity: give it `tolerance` and an explaining comment, and delete it in H1 when the real AnalyticalTable fixtures land.

## Tests

- `tests/visual-wcr.spec.ts` (new): same matrix as `tests/visual.spec.ts` (4 themes × 2 densities + RTL), comparing
  `/index.html?fixtures&ref=wcr` cells with `/wcr.html` cells; report `test-results/visual-wcr/…`.
- Accessibility tree: extend E4's `tests/a11y-tree.spec.ts` (or add `tests/a11y-tree-wcr.spec.ts`) to compare the WCR
  sets the same way, using E4's normaliser and `a11yDiff`.
- Locale: the WCR page honours `?locale=de-DE|zh-CN|ar-EG` (E5's option); one test asserts the WCR smoke table's
  "No data" text is German under `de-DE`.

## WCR texts in the i18n pipeline (extends E5)

- `scripts/i18n-audit.mjs`: also scan WCR — for each WCR-referenced component, the keys it imports from
  `@ui5/webcomponents-react/dist/i18n/i18n-defaults.js` (AnalyticalTable uses 45 of WCR's 159 keys today). Audit rows
  get a `source` column (`ui5` / `ui5-fiori` / `wcr` / `openui5`).
- `scripts/build-i18n-packs.mjs`: merge WCR's `dist/assets/i18n/messagebundle_<lang>.json` (51 languages) into the
  same packs. Keys can collide between UI5 and WCR (`SELECT_ALL`, `NO_DATA`…): namespace WCR keys as `wcr:<KEY>` in
  the provider table, and use the namespaced key in `t()` from WCR-ported components. Update `FioriLocaleProvider`'s
  JSDoc and README's i18n section accordingly.
- `NOTICE`: add WCR (© SAP SE, Apache-2.0, version 2.28.2) as a source of theme parameters and translations.

## AGENTS.md

Rule 1 gets a sentence: for components that UI5 Web Components doesn't have but WCR implements, the source of truth
is `@ui5/webcomponents-react` 2.28.2 in `node_modules` (`dist/components/<Name>/**`) — read its hooks and default
renderers before writing code, quote them in comments. Commands: `/wcr.html`. Gotchas: anything new you learn while
building the harness.

## Files

Shared (allowed): `package.json` (2 devDependencies), `pnpm-lock.yaml`, `vite.config.ts` (input only),
`docs/wcr.html`, `docs/src/wcr-main.tsx`, `docs/src/fixtures/wcr-popup-in-place.ts`, `docs/src/fixtures/wcr-smoke*.tsx`
(new), `docs/src/fixture-types.ts` (`reference` only), `docs/src/ui5-main.ts` (skip `wcr` sets only),
`docs/src/main.tsx` (`ref=wcr` filter only), `docs/src/fixtures/index.ts` (register), `scripts/generate-tokens.mjs`,
`scripts/i18n-audit.mjs`, `scripts/build-i18n-packs.mjs`, `registry/lib/fiori-locale.tsx` (namespacing only),
`tests/visual-wcr.spec.ts`, `tests/a11y-tree*.spec.ts`, `tests/i18n.spec.ts`, `AGENTS.md`, `README.md`, `NOTICE`,
`CONTRIBUTING.md` (one paragraph on the WCR reference).

## Acceptance

- AGENTS.md definition of done (existing visual, a11y-tree and i18n suites unchanged).
- `tests/visual-wcr.spec.ts` runs the smoke set in all passes; the WCR page has no console errors in any theme.
- `--fiori-wcr-*` parameters exist for all 4 Horizon themes; `pnpm generate` is deterministic.
- Language packs contain the WCR AnalyticalTable keys for every language; `docs/plan/i18n-audit.md` lists them.
- Final message: screenshots of the WCR smoke table and ours side by side in Morning Horizon and HCB.
