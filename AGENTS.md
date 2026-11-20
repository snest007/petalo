# AGENTS.md — rules for coding agents (Codex, Claude, …)

petalo: SAP Fiori (Horizon) look **and** interaction for React, shipped as a shadcn registry.
Every visual value comes from SAP's open-source theme packages; every component is pixel-compared against
UI5 Web Components 2.28 (SAP's official implementation). Read `README.md` and `CONTRIBUTING.md` before any task.

## Where the work is

- Task backlog: `docs/plan/README.md` (status, order, dependencies). Open cards are in `docs/plan/tasks/`, finished
  ones in `docs/plan/tasks/done/`; notes of returned cards in `docs/plan/returns/` (finished: `returns/done/`).
- Do exactly one task card per run unless told otherwise. A card lists its goal, the UI5 source to read, the files
  you may touch, the behaviour to reproduce, the tests to add, and its acceptance checks.
- When the card is done, tick it in `docs/plan/README.md` (`[ ]` → `[x]`) in the same commit. Leave the card file
  where it is; the reviewer moves it to `tasks/done/` when merging. Run `node scripts/plan-check.mjs` after editing
  the backlog.

## Environment

- Node 24, pnpm 10 (`pnpm install --frozen-lockfile`). Never add, remove or upgrade npm dependencies unless the card says so.
- Run `pnpm generate` once after install (tokens, icons, illustrations, component CSS are generated and git-ignored in part).
- Playwright needs Chromium: `pnpm exec playwright install chromium` if it is missing.
- If your sandbox blocks network or the browser, say so in your final message instead of skipping checks silently.

## Commands

```bash
pnpm generate                      # regenerate tokens / icons / illustrations / component CSS
pnpm typecheck                     # tsc --noEmit
pnpm registry:build                # registry.json + public/r (shadcn build)
pnpm build                         # docs site → dist/
PORT=4310 pnpm exec playwright test                      # full suite (builds + serves on PORT)
PORT=4310 pnpm exec playwright test tests/<name>.spec.ts # one spec
PORT=4310 pnpm test:summary tests/<name>.spec.ts          # compact result + full log on disk
PORT=4310 pnpm test:changed                             # changed main specs, visual fixtures and stories vs main
PORT=4310 pnpm test:changed --repeat-each=2             # tier 2: scoped verification twice
pnpm test:smoke                                       # tier 2: shared-path smoke once
pnpm test:milestone                                   # tier 3: both full suites once + report
pnpm test:milestone --runs=2                          # release: both full suites twice
VISUAL_ONLY=<prefix>[,<prefix>…] PORT=4310 pnpm test:summary tests/visual.spec.ts # affected fixtures
scripts/ci-local.sh tests/toolbar.spec.ts                # Linux CI reproduction in Docker
PORT=4310 pnpm exec playwright test tests/visual.spec.ts # pixel diff vs UI5, 4 themes × 2 densities
pnpm check                         # everything above, in order
pnpm storybook                     # component stories at http://localhost:6006
pnpm storybook:build               # static Storybook → storybook-static/
PORT=4320 pnpm test:storybook       # separate Storybook render, globals, Controls and axe checks
STORYBOOK_ONLY=toolbar PORT=4320 pnpm test:summary -c playwright.storybook.config.ts tests-storybook/storybook.spec.ts # whole component story ids
pnpm dev                           # http://localhost:5173 (docs), /?fixtures, /ui5.html, /block.html?name=<block>
node scripts/smoke-install.mjs     # fresh consumer app: shadcn init + add every block, build, render
node scripts/integrate.mjs …       # merging card branches — see docs/plan/INTEGRATION.md
node scripts/plan-check.mjs        # backlog index ↔ card files ↔ return notes ↔ links; --fix moves finished cards
```

Always pass a `PORT` other than 4173/5173 to Playwright so it builds and serves its own copy.

## Hard rules

1. **Source of truth is UI5 2.28 in `node_modules`** (`@ui5/webcomponents`, `@ui5/webcomponents-fiori`), not memory and
   not the web. Read the component's `dist/<Name>.js`, `dist/<Name>Template.js` and `dist/generated/themes/<Name>.css.js`
   before writing code. Quote the UI5 file/function you ported in a code comment where behaviour is non-obvious.
2. **No hard-coded design values.** Use `--sap*` tokens and `--fiori-*` parameters from `registry/styles/fiori.css`
   (`grep -- '--fiori-<component>' registry/styles/fiori.css | sort -u`). If a value has a parameter, use the parameter.
3. **Component file ownership.** Each component owns `registry/ui/<name>.tsx`, `registry/items/<name>.json`,
   `registry/styles/components/<name>.css`, `docs/src/fixtures/<name>.tsx` + `<name>.ui5.ts`, `docs/src/demos/<name>.tsx`,
   `tests/<name>.spec.ts`, `docs/stories/<category-lowercase>/<name>.stories.tsx` — including `registry/items/<name>.json` when you add imports (update its `dependencies` /
   `registryDependencies`). Edit other files only if the card lists them; call out any other shared edit in the commit message.
4. **Pixel parity is the bar.** New visual states get fixtures on both sides. The visual test fails a cell above 2% differing
   pixels or on any size difference. Fix causes; don't raise `tolerance` or add `skipCompare` without a concrete reason
   written in a code comment (e.g. "UI5 animates X and it can't be frozen").
5. **Keyboard focus ring only for keyboard** (`:focus-visible`). Text defaults in English, every user-visible string
   overridable by a prop. Value states are `none | negative | critical | positive | information`.
6. **Tests must be deterministic.** Wait for the state you assert on (focus moved, value re-rendered) before the next key
   press; scope locators to your own demo (`#<name>-demo …`) — the docs page holds every component. Never fix a flaky
   test by adding retries or sleeps.
7. **Don't break public APIs.** Adding props is fine; renaming or removing exported names/props needs the card to say so.
8. Tailwind v4 arbitrary vars: `h-(--fiori-x)`, `text-(length:--sapFontSize)`, `font-(family-name:--sapFontFamily)`;
   line height `leading-[normal]` (not `leading-normal`). No `-webkit-font-smoothing`. No `transition` unless UI5 has it.
9. **Accessibility is ported in full, never trimmed.** Everything UI5's `dist/<Name>Template.js` and `dist/<Name>.js`
   give assistive technology is part of the port: roles, every `aria-*` attribute and its states, hidden description /
   label texts (`ui5-hidden-text`, `aria-describedby` targets), live-region announcements (`announce()`, `aria-live`),
   the keyboard model, roving `tabindex` and focus management (initial focus, focus return, focus trap). Quote the UI5
   template or function in a code comment for non-obvious ARIA.
   - Every UI5 `accessibleName` / `accessibleNameRef` / `accessibleDescription` / `accessibleDescriptionRef` /
     `accessibleRole` / `accessibilityAttributes` has an equivalent: native `aria-*` props passed through to the element
     UI5 puts them on (document which element in the prop's JSDoc), or a named prop when UI5 builds the text itself.
     Every announced or hidden text is an overridable string (rule 5).
   - Customisation points (render props, `asChild`, custom cells/items/days, `className` slots) must not be able to drop
     ARIA: the component, not the consumer's render output, owns roles, `aria-selected`/`aria-expanded`/`aria-checked`
     /`aria-sort`/`aria-rowindex`…, ids and `tabindex`. Each customisation point gets a test that a custom render
     keeps them.
   - The accessibility tree is compared with UI5's for every fixture (`tests/a11y-tree.spec.ts`, added by card E4).
     Known differences live in the **ratchet baseline** `tests/a11y-tree-baseline.json` (one entry per matrix, case,
     node path and semantic kind, each with a P1–P6 owning card id and an exact mismatch fingerprint). The test fails on any difference **not** in the baseline, on a changed mismatch at the same identity, and on any baseline entry
     that no longer differs (so a fix must delete its entry — the baseline only shrinks). Only a card listed as the
     entry's owner may delete entries; nobody adds entries except E4 (which creates the baseline) — new code must match
     UI5 or use `a11yDiff`. `a11yDiff` is for permanent, justified deviations (documented UI5 bug, inert wrapper, rule 5
     over UI5) with a concrete reason (e.g. "UI5 bug: role=listitem inside role=grid, TableTemplate.js:…"), never to
     make a failing test pass.
   - `scripts/a11y-baseline.mjs --write` creates E4's initial baseline once from complete, successful captures of Web
     LTR/RTL, phone and OpenUI5. `--list P<n>` lists an owner's entries; `--prune P<n>` removes only that owner's
     stale entries after a complete capture, and refuses uncaptured owning cases. Baselines never absorb capture or
     allowance errors. `tests/a11y-audit-baseline.json` records per-component gap/unverified counts; the audit test
     fails when any count rises. E4's verified mappings and functional customization proofs stay `ok` or `fixed in E4`.
   - Don't remove or weaken an existing ARIA attribute, keyboard shortcut or announcement without the card saying so
     (rule 7 applies to accessibility behaviour too).
10. **Localization is ported in full, never trimmed.** Everything UI5 makes locale-dependent is locale-dependent here.
    - **Texts:** every UI5 i18n key the component's `dist/<Name>.js` / template uses (`i18nBundle.getText(KEY)`,
      `messagebundle_en.json`) has an English default **and** an overridable string, in the component's `texts` object
      (`texts?: Partial<<Name>Texts>`, existing `labels` props stay). Name the UI5 key in a comment next to each
      default (`// UI5 STEPINPUT_DEC_ICON_TITLE`). Placeholders keep UI5's order (`{0}`, `{1}`) as function texts:
      `(count: number) => string`. Texts also resolve from `FioriLocaleProvider` (card E5); a prop wins over the provider.
    - **Formats:** dates, times, numbers, percentages, units, sort/filter comparison and plural forms go through `Intl`
      (`DateTimeFormat`, `NumberFormat`, `Collator`, `PluralRules`) or `registry/lib/fiori-dates.ts` /
      `fiori-numbers.ts` (E5), with the locale from the prop, else the provider, else `navigator.language`. No
      hard-coded separators, digit grouping, week start, AM/PM, month names or `toFixed` for display. Where UI5 formats
      with its CLDR data, the result must match UI5's for the same locale (fixtures in `de-DE`, `zh-CN`, `ar-EG`).
      Parsing user input is locale-aware wherever formatting is.
    - **Audit ratchet:** `docs/plan/i18n-audit.md` (E5) lists every UI5 key per component with a status. The number of
      `gap` rows per component is recorded in `tests/i18n-audit-baseline.json`; `tests/i18n.spec.ts` fails when a
      component's gap count rises or when a key that was `ok` becomes `gap`, and when the count falls without the
      baseline being lowered in the same commit. Same ownership rule as the accessibility baseline.
    - **Direction:** every component works in RTL (logical CSS properties, mirrored icons where UI5 mirrors them, arrow
      keys swapped where UI5 swaps them). New components and new visual states get an RTL fixture and an RTL behaviour
      test for direction-dependent keys.
    - Calendars stay Gregorian-only (owner's decision, README); everything else in this rule applies to them.
    - Don't remove a text prop, hard-code a string or format, or narrow locale support without the card saying so
      (rule 7 applies to localization too).

11. **Extensibility is a library contract** (owner-approved 2026-11-17; `docs/extension-contract.md`). The library ships
    UI5 parity as the default plus extension points; consumers build features (fiscal pickers, booking calendars…) on
    top. We don't build those features.
    - New and changed components implement the contract's T1 in full. T2/T3 points ship only with a realistic consumer
      example that would otherwise fork the file, plus invariant tests; inventory tiers are ceilings, not targets.
      **Exception (owner's decision, 2026-11-17):** parity and documentation cards — E4, E5, P1–P6 (incl. P2a) and the
      S story cards — don't owe T1 for the components they touch; T1 arrives with the component's rollout card
      (X1–X13, after its P card, per `docs/plan/README.md`). They still must not remove or narrow an existing
      extension point, `className`, `data-slot` or controlled prop (rule 7), and any customisation point they *add*
      follows the ownership rules below.
    - Default UI5 pixels, accessibility tree and interaction stay unchanged unless the owning card explicitly fixes
      parity.
    - Customisation points use component-owned semantic hosts and protected getters (`getXProps(item, extra)` merges
      `extra`). They can't remove roles, ARIA states/relationships, focus management, keyboard handling,
      announcements, overridable texts, locale or RTL behaviour. No unrestricted `asChild` on semantic hosts.
    - Slot names, `components` keys, context state/actions/getters and detail types are public API (rule 7). A new
      surface ships as documented experimental for one registry release (contract amendment 3); experimental never
      permits renaming or removing.
    - Each extension point ships with a Customise docs section, a story for its tier, neutral paired fixtures,
      adversarial ownership tests (hostile `role` / `aria-*` / `id` / `tabindex` props are ignored with a dev
      warning) and an installed-consumer example that imports only the component's item entry.
    - T4 (headless) is deferred until an approved card implements it.

## Verification budget

These hard limits apply to every card and every agent (Codex and Claude).

**Current phase (owner's decision, 2026-11-20): build out components first.** The library is young; progress on
components comes before polish. Users run Windows and macOS (no Linux users); the owner and agents develop on macOS.
- **CI is a reminder, not a gate.** Push CI (Linux) runs behaviour tests, live pixel comparisons and Storybook. Its
  value is a second platform with non-macOS keyboard behaviour (closer to Windows). Fix a CI failure only when it
  reproduces on macOS or in a behaviour test; a failure that appears only on Linux is noted in the milestone report,
  not turned into a card. Stored-baseline comparisons (`tests/a11y-tree*.spec.ts`) run only on macOS at milestones.
- **No fifth or later attempt.** When a card hits its budget, what's left becomes a small follow-up card (`<id>b`),
  scoped to the remaining items.
- **Stay in scope.** A problem found outside the card's components is written into the owning P card (or the return
  note), not fixed in this card.

1. **CI rounds: at most 2 pushes per task.** If CI is still red after the second push, stop. Commit the work in
   progress and write `docs/plan/returns/<card>.md` with the failing test names, what each round changed and why,
   your hypotheses for what is left, and what you would try next. Then end the run. The owner decides whether a
   third round happens. This limit does not authorize pushing when the card forbids it.
2. **Local fix attempts: at most 2 per failing test.** Two hypotheses tried and it still fails → commit and report
   it in the same return note, then end the run. Don't widen the search in the same run.
3. **Tiered verification** (owner's decision, 2026-11-20):
   - **Tier 1 — inner loop:** `pnpm test:changed` while working: changed main specs, visual fixtures and Storybook
     stories, plus changed Storybook regression specs. Target 1–3 minutes. It includes committed changes against
     `main...HEAD` and working-tree changes. A component without its own spec runs its visuals and prints a notice.
   - **Tier 2 — card done:** `pnpm test:changed --repeat-each=2` (two scoped runs) + `pnpm test:smoke` once, after
     generate/typecheck/registry build. Target about 5 minutes; the reviewer repeats tier 2 before merging.
   - **Shared-file cards:** if `test:changed` prints "shared file changed: run the full suite", run full main and
     Storybook suites once at card done instead. This includes `.storybook/**`, Storybook helpers, shared styles/libs,
     Playwright configs, docs entry points and CI. The second full verification is the milestone/CI. Choose affected
     tooling checks during implementation; don't run full suites in the inner loop.
   - **Tier 3 — milestone:** the reviewer's job at the end of a wave (or when the owner asks to publish):
     `pnpm test:milestone` once on macOS (fresh builds, full main + Storybook, incl. the stored-baseline tree
     comparisons), then push. Pushing main publishes (GitHub Pages redeploys the registry and docs).
     `--runs=2` is available for a release. Targets: about 20 minutes local / 12 minutes CI.
   `test:changed` ignores only bookkeeping: `docs/plan/README.md`, `docs/plan/tasks/**`, `docs/plan/returns/**`,
   and `docs/plan/handoff/**`. Bookkeeping-only branches print "bookkeeping only: no tests needed" and exit 0.
   Other `docs/plan/` files stay shared (for example `a11y-audit.md` and `i18n-audit.md`, read by Storybook).
   When a card adds many tests, check the CI timing warning and add a shard in the same card.
4. **Compact output.** Never print a whole Playwright or CI log into the conversation. Use `pnpm test:summary`
   or grep for summary and failing lines, at most about 50 lines. For CI, use `gh run watch` once (no polling loops),
   then `gh run view --log-failed | grep` for the failing tests only. Full logs stay on disk.
5. **Long runs go in the background** with a single completion notification. Don't check on them in between.
6. **Time box:** if a task has used about 2 h of wall-clock time, or its own stated round limit, stop and report,
   even if the round limits above aren't reached yet.
7. **Browsers stay out of the owner's way** (owner's decision, 2026-11-18). The owner works on the same machine;
   a browser window that appears in front, takes focus or stays open interrupts their other tasks.
   - Playwright tests, probes and evidence scripts run **headless** (the config default). Never pass `--headed`,
     `--ui`, `--debug`, `headless: false`, `page.pause()` or `slowMo`, and don't launch "Chrome for Testing" with a
     window. Screenshots, traces and `error-context.md` give the same evidence without one.
   - Manual review of a page (Storybook Docs, the docs site) uses a browser tool that works in the background: the
     agent's built-in browser, or the Chrome extension inside its own tab group. Not a new app window, not
     `open <url>`.
   - Close every browser, context and preview server you started before you end the run.
   - If a task really needs a visible window, say why and ask the owner first.

## Definition of done (every card)

- `pnpm generate && pnpm typecheck && pnpm registry:build` succeed.
- **Tier 2:** `PORT=4310 pnpm test:changed --repeat-each=2` passes (two scoped runs), then `pnpm test:smoke`
  passes once, with **0 failed and 0 flaky**. Shared-file cards run the full main and Storybook suites **once**
  instead; use `pnpm test:summary` for each. The second full run belongs to the reviewer's tier 3 milestone/CI,
  not the card. Old card text saying "main ×2, Storybook ×2" means tier 2 under these rules.
- A new visual state or prop also gets a story in `docs/stories/<category-lowercase>/<name>.stories.tsx`.
- The card's own acceptance checks all hold. Manual page-by-page reviews (Morning/HCB "How" walkthroughs, Evening
  screenshots) are no longer required unless the card asks for them; automated tests and Storybook checks cover it.
- Accessibility (rule 9): new or changed states have fixtures on both sides so `tests/a11y-tree.spec.ts` compares them;
  axe stays clean; new keyboard paths and announcements have behaviour tests; the accessibility baseline doesn't grow
  (and shrinks by exactly the entries your card fixed).
- Extensibility (rule 11): new extension points meet the contract (example, ownership tests, Customise docs, story).
- Localization (rule 10): every new user-visible or announced string is in `texts` with its UI5 key named; new formatted
  values use `Intl` with the resolved locale; new states have an RTL fixture; the i18n audit baseline doesn't grow.
- Git: work on a branch `codex/<card-id>`, small commits, messages in English, imperative mood. Don't push; don't merge.
  If you work in a separate worktree, leave the main checkout untouched (no edits, no branch switch) — an earlier run
  left an uncommitted draft and a stray branch there.
- SAPUI5 fixtures share one reference page: a popup you open must not stay painted outside its own cell (hide parents
  you replace, re-pin after `_applyPosition`), and it must not close because another fixture took focus.
- Final message states tier 2 summary lines, how many CI rounds and how many full-suite runs the task used.
- Final message: what changed (files), test summary lines (copy them), anything skipped or deferred and why,
  any shared file you touched.

## Gotchas already paid for (don't rediscover them)

- UI5 fixtures that use `@ui5/webcomponents-fiori` must import `@ui5/webcomponents-fiori/dist/Assets.js`.
- Icons used in a `.ui5.ts` fixture must be imported individually (`@ui5/webcomponents-icons/dist/<icon>.js`).
- Popups are compared "in place": see `docs/src/fixtures/ui5-popup-in-place.ts` and `ui5-picker-popover.ts`.
  "If feasible" in a card means: try the in-place helper; if the UI5 side still can't render the open surface
  deterministically inside the cell after a real attempt (≈1 hour), add `skipCompare` for that one case with the reason,
  cover it with a behaviour test, and mention it in your final message.
- Blocks install into `components/<name>.tsx`; a block may not share a name with a component (the build fails).
- Fixture ids, demo element ids and test ids are prefixed with the component name.
- `page.waitForEvent("filechooser")` enables interception asynchronously: do a round trip (`await page.evaluate(() => 0)`)
  before the action that opens the chooser. Playwright workers are capped at 75%.
