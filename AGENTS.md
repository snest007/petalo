# AGENTS.md — rules for coding agents

petalo ships SAP Fiori Horizon visuals and interaction for React as a shadcn registry. Visual values come from SAP's
open-source theme packages. Pixel-compare every component against the pinned SAP reference (rule 1).
Read [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before any task.

## Where the work is

- [Backlog](docs/plan/README.md) for status, order and dependencies. Cards live in `docs/plan/tasks/` and returns in
  `docs/plan/returns/`, each with a `done/` folder. A card defines the goal, sources, file scope, behaviour, tests and acceptance.
- Do one card per run unless told otherwise. Use `.worktrees/<card-id>` from local `main` on `codex/<card-id>`. Leave the
  main checkout alone, including its branch. Use small commits with English imperative messages. Card sessions do
  not push or merge.
- Tick the completed card in the backlog in the completion commit. Leave its file in place for the reviewer to move.
  Run `node scripts/plan-check.mjs` after editing the backlog.
- See [RUN.md](docs/plan/RUN.md) for card scheduling and [INTEGRATION.md](docs/plan/INTEGRATION.md) for review and merge.

## Environment

Use Node 24 and pnpm 10. Run `pnpm install --frozen-lockfile`, then `pnpm generate` once to build tokens, icons,
illustrations and component CSS, some git-ignored. Dependency changes need card authorization. If Chromium is missing,
run `pnpm exec playwright install chromium`. Report any sandbox block on network or browser checks in the final message.

## Commands

Give Playwright a `PORT` other than 4173/5173 so it builds and serves its own copy. See RUN.md for port coordination.
```bash
pnpm generate && pnpm typecheck && pnpm registry:build       # build inputs, check types, generate registry.json and public/r
pnpm build                                                 # docs → dist/
PORT=4310 pnpm exec playwright test                        # full main suite, or append tests/<name>.spec.ts
PORT=4310 pnpm test:summary tests/<name>.spec.ts             # compact output, full log on disk
PORT=4310 pnpm test:changed                                 # tier 1
PORT=4310 pnpm test:changed --repeat-each=2                  # tier 2 scoped runs
pnpm test:smoke                                            # tier 2 shared-path smoke
pnpm test:milestone                                        # tier 3, release option --runs=2
VISUAL_ONLY=<prefix>[,<prefix>…] PORT=4310 pnpm test:summary tests/visual.spec.ts
PORT=4310 pnpm exec playwright test tests/visual.spec.ts    # UI5 pixels, 4 themes × 2 densities
scripts/ci-local.sh tests/toolbar.spec.ts                   # reproduce Linux CI in Docker
pnpm check                                                 # full repository checks in order
pnpm storybook                                             # http://localhost:6006
pnpm storybook:build                                       # storybook-static/
PORT=4320 pnpm test:storybook                              # render, globals, Controls and axe
STORYBOOK_ONLY=toolbar PORT=4320 pnpm test:summary -c playwright.storybook.config.ts tests-storybook/storybook.spec.ts
pnpm dev                                                   # http://localhost:5173, /?fixtures, /ui5.html, /wcr.html, /block.html?name=<block>
node scripts/smoke-install.mjs                             # fresh shadcn app, install every block, build and render
node scripts/integrate.mjs …                               # reviewer commands
node scripts/plan-check.mjs                                # backlog, cards, returns and links, --fix moves finished cards
```
Use `node scripts/a11y-baseline.mjs --list P<n>` to inspect entries and `--prune P<n>` after a complete capture.

## Hard rules

1. **Use the installed SAP source.** Read UI5 2.28's `dist/<Name>.js`, `dist/<Name>Template.js` and
   `dist/generated/themes/<Name>.css.js` in `node_modules/@ui5/webcomponents` or `@ui5/webcomponents-fiori` before coding.
   For WCR-only controls, read `@ui5/webcomponents-react` 2.28.2 `dist/components/<Name>/**` including hooks and default renderers.
   Quote the owning file/function in a code comment for non-obvious behaviour. The installed packages are the sole source of truth.
2. **No hard-coded design values.** Use `--sap*` tokens and `--fiori-*` parameters from `registry/styles/fiori.css`.
   Use the parameter wherever available. Look up component parameters with `grep -- '--fiori-<component>' registry/styles/fiori.css | sort -u`.
3. **Component ownership.** The component owns `registry/ui/<name>.tsx`, `registry/items/<name>.json`,
   `registry/styles/components/<name>.css`, `docs/src/fixtures/<name>.tsx` and `<name>.ui5.ts`, `docs/src/demos/<name>.tsx`,
   `tests/<name>.spec.ts` and `docs/stories/<category-lowercase>/<name>.stories.tsx`. Update the item's `dependencies` and/or
   `registryDependencies` when adding imports. Shared edits require card scope and a note in the commit message.
4. **Pixel parity.** Pair each new visual state. Fail on any size difference or more than 2% differing pixels. Fix the cause.
   Raising `tolerance` or using `skipCompare` requires a concrete reason in a code comment.
5. **Keyboard-only focus ring** via `:focus-visible`. Default to English with prop overrides for every user-visible
   string. Value states are `none | negative | critical | positive | information`.
6. **Deterministic tests.** Wait for the asserted focus or rendered value before the next keypress, and scope locators
   to the owning demo (`#<name>-demo …`) on the shared docs page. Never fix a flake with retries or sleeps.
7. **Preserve public APIs.** Props may be added. Renaming or removing exported names or props requires card authorization.
8. **Tailwind v4.** Use `h-(--fiori-x)`, `text-(length:--sapFontSize)`, `font-(family-name:--sapFontFamily)` and
   `leading-[normal]`. Use neither `leading-normal` nor `-webkit-font-smoothing`. Add `transition` only if UI5 uses it.
9. **Port full accessibility from the UI5 template and implementation.**
   - Keep roles, every `aria-*` attribute and state, labels/descriptions (`ui5-hidden-text`, `aria-describedby`),
     announcements (`announce()`, `aria-live`), keyboard shortcuts/model, roving `tabindex`, and initial/return/trapped
     focus. Quote the UI5 template or function in a code comment for non-obvious ARIA. Removing or weakening existing attributes, shortcuts or announcements requires card scope.
   - Map all UI5 `accessibleName`, `accessibleNameRef`, `accessibleDescription`, `accessibleDescriptionRef`,
     `accessibleRole` and `accessibilityAttributes` to native ARIA on the same host (document it in prop JSDoc)
     or named props for generated text. Hidden and announced strings are overridable.
   - Every customization (render props, `asChild`, custom cells/items/days, `className` slots) preserves component-owned
     roles, ARIA states/relations, IDs and `tabindex`. Test each custom render with owned semantics intact.
   - Compare every fixture tree. The `tests/a11y-tree-baseline.json` ratchet rejects new, changed or stale mismatches.
     Each entry has a matrix/case/path/kind identity, owning P card and exact fingerprint. Only that owner deletes
     entries it fixes. Existing components add none. New cards from wave H onward
     follow New-component accessibility acceptance below. Reject capture and allowance errors.
   - Use exact `a11yDiff` only for permanent deviations with a concrete source-backed reason such as a UI5 bug,
     inert wrapper or rule 5. An allowance cannot substitute for fixing a failing test.
   - `tests/a11y-audit-baseline.json` gap/unverified counts cannot rise. Verified mappings and functional customization
     proofs stay `ok` or `fixed in E4`.
10. **Port full localization.**
    - Each UI5 i18n key used by the JS/template (`i18nBundle.getText`, `messagebundle_en.json`) has an English default
      and override in `texts?: Partial<<Name>Texts>`. Keep existing `labels`. Comment each default with its UI5 key.
      Preserve `{0}`, `{1}` order in function texts like `(count: number) => string`. Text props win over `FioriLocaleProvider`.
    - Dates, times, numbers, percentages, units, sort/filter comparison and plurals use `Intl` (date/number formatting,
      collation and plural rules) or `registry/lib/fiori-dates.ts` / `fiori-numbers.ts`. Locale order is prop, provider, then `navigator.language`.
      Parse localized input wherever formatting is locale-aware. Never hard-code separators, grouping, week starts,
      AM/PM or month names, or use `toFixed` for display. Match UI5 CLDR output in the same locale, with `de-DE`, `zh-CN`, `ar-EG` fixtures.
    - Track every component's UI5 keys and statuses in `docs/plan/i18n-audit.md`. Apply the same ownership rule to
      `tests/i18n-audit-baseline.json`. Gaps cannot rise and `ok` keys cannot become gaps. Lower reduced counts in the same commit.
    - Support RTL with logical CSS, UI5's icon mirroring and arrow-key swaps. Each new component or visual state
      gets an RTL fixture and a behaviour test for direction-dependent keys.
    - Calendars are Gregorian-only and otherwise follow this rule. Removing a text prop, hard-coding a string
      or format, or narrowing locale support requires card authorization.
11. **Follow the [extension contract](docs/extension-contract.md).** Ship default UI5 parity and extension points.
    Consumer features such as fiscal pickers or booking calendars belong in consumer code.
    - New and changed components owe full T1. E4/E5, P1–P6 including P2a, and S story cards defer T1 to the planned
      X rollout (X1–X13 after the owning P card). They preserve existing extension points, `className`, `data-slot`
      and controlled props, and apply ownership rules to added points. T2/T3 need a realistic consumer example that
      would otherwise fork the file, plus invariant tests. Inventory tiers are ceilings. T4 needs an approved card.
    - Preserve default pixels, tree and interaction unless the owning card explicitly fixes parity. Use owned semantic
      hosts and protected getters (`getXProps(item, extra)` merges extra props). Preserve roles, ARIA states/relations,
      focus, keyboard, announcements, overridable texts, locale and RTL. Semantic hosts cannot use unrestricted `asChild`.
    - Slot names, `components` keys, context state/actions/getters and detail types are public. Document new surfaces as
      experimental for one registry release, with rule 7 still in force.
    - Each point gets a Customise section, a story for its tier, neutral paired fixtures, adversarial tests that
      reject hostile roles/ARIA/IDs/tabindex with a dev warning, and an installed example importing only its item entry.

## Verification budget

**Current phase** prioritizes new components ahead of polish. All cards and agents follow these limits and
[RUN.md's milestone and CI rules](docs/plan/RUN.md#milestones-and-pushing).

- At most two authorized CI pushes and two local hypotheses per failing test. Stop at about two hours or the card's own limit,
  even with rounds left. No fifth or later attempt. After a second failed CI round or local hypothesis, commit and
  return via RUN.md without widening the search. Only the owner can authorize a third CI round.
  Route out-of-scope defects to the owning P card or the return note.
- **Tier 1** uses `pnpm test:changed` for main specs, visuals, stories and changed Storybook regressions (1–3 min).
  It uses `main...HEAD` and working-tree changes and falls back to visuals for components without specs, with a notice.
  Inventory edits and new components add inventory specs. See [scope classification](scripts/changed-scope.mjs).
- **Tier 2** uses two scoped runs plus one smoke run (~5 min) after generate/typecheck/registry build. If
  `test:changed` prints "shared file changed: run the full suite", use affected tooling checks in the inner loop and
  run full main and Storybook once via `test:summary` at card done. Shared paths include `.storybook/**`, Storybook
  helpers, shared styles/libs, Playwright configs, docs entry points and CI. The next full run belongs to tier 3.
  Add a CI shard in the same card if it adds many tests, after checking the timing warning.
- **Tier 3** is the reviewer milestone on macOS with fresh builds, both full suites and stored accessibility baseline
  comparisons. See RUN.md for CI and publishing.
- Keep full logs on disk. Use `test:summary` or filter to at most ~50 summary/failure lines. For CI use one
  `gh run watch` without polling, then `gh run view --log-failed | grep` for failing tests.
- Put long runs in the background and notify once at completion, with no intermediate checks.
- Run Playwright tests, probes and evidence scripts headless. Never use `--headed`, `--ui`, `--debug`, `headless: false`,
  `page.pause()`, `slowMo` and a visible Chrome for Testing. Use screenshots, traces and `error-context.md`.
  For manual reviews use a background browser or a dedicated Chrome extension tab group. Do not use a new window or
  `open <url>`. Explain any visible-window need and ask first. Close all browsers, contexts and preview servers you started.

## Definition of done (every card)

- The card's acceptance and required checks pass. Follow any explicit text-only verification on the card. Otherwise
  generate, typecheck, build the registry and pass tier 2 with **0 failed and 0 flaky**. Old "main ×2, Storybook ×2" means tier 2. Manual walk-throughs or screenshots are
  required only by the card. Each new visual state or prop gets a story (rule 3).
- Pair new or changed states for the tree comparison. Keep axe clean and test new keyboard paths and announcements.
  The owning card prunes exactly the entries it fixes. Meet the localization and extension checklists in rules 10 and 11.
- **New components** register in the same card before final checks. Add the owner to `tests/a11y-tree-baseline.ts`
  `groups`, directional components to the RTL list in `tests/a11y-tree.spec.ts`, proofs to `tests/a11y-tree-customizations.spec.ts`,
  verified members/texts to `scripts/a11y-audit.mjs`, and reachable plus unrendered native keys to `scripts/i18n-audit.mjs`.
  Include keys an existing component gains via a new slot. Regenerate audits, locale packs and `skills/petalo/` with
  `pnpm generate && pnpm registry:build`. Keep gap counts from rising. The scoped preflight reports omissions before Playwright.
- **New-component accessibility acceptance.** Require LTR/RTL behaviour and keyboard tests, clean axe and parity
  for every UI5 role, name, description, state/property, text and label/description relationship. Record only
  structural differences (extra/missing unnamed state-free `generic` wrappers or the same semantic node one level
  higher/lower) and open-popup pixel cells. Use the component's existing P card via `groups`, no separate card.
  Before E11 lands, use an exact `a11yDiff` wrapper path with reason `structural; owned by P<n>`. After E11 lands,
  use `node scripts/a11y-baseline.mjs --record <component>`. Name the P card in popup `skipCompare` reasons. List both in the return note.
  Semantic differences stay out of the baseline. Fix them or use an exact rule 9 `a11yDiff` where justified.
- Final message names changed files and shared edits, copies the tier 2/test summaries, counts CI and full-suite runs,
  and explains any skipped or deferred checks.

## Gotchas already paid for (don't rediscover them)

- WCR fixtures share neutral inputs with React. Keep registry imports out of the reference, import WCR Assets and
  static CSS, and await the async i18n store before measuring. Morning/Evening use `sap_horizon.css`, HCB/HCW `sap_horizon_hc.css`.
- Import `@ui5/webcomponents-fiori/dist/Assets.js` for Fiori fixtures. Import each `.ui5.ts` icon individually
  via `@ui5/webcomponents-icons/dist/<icon>.js`.
- Compare popups in place using `ui5-popup-in-place.ts` or `ui5-picker-popover.ts` under `docs/src/fixtures/`.
  Keep each SAPUI5 popup painted inside its cell on the shared page. Hide replaced parents, re-pin after
  `_applyPosition` and keep another fixture's focus from closing it. For "if feasible", try the in-place helper.
  If UI5 still cannot render the open surface deterministically in the cell after a real attempt (~1 h), use a
  justified single-cell `skipCompare`. Cover that case with a behaviour test and report it in the final message.
- Blocks install at `components/<name>.tsx` and cannot share a component name. Prefix fixture, demo and test IDs
  with the component name.
- Before an action that opens a file chooser, start `page.waitForEvent("filechooser")` and make a round trip
  (`await page.evaluate(() => 0)`) so interception is enabled.
