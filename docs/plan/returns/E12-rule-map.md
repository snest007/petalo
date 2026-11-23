# E12 rule map

The source is `git show 3093cb2:AGENTS.md`, the local main revision before E12. Line numbers on the left refer to that revision.

Destinations use [AGENTS](../../../AGENTS.md), [RUN](../RUN.md), [Integration](../INTEGRATION.md) and [Decisions](../decisions.md). Script and configuration references use repository-relative file and line locations at the source revision.

## Project, card workflow and environment

- L3 · Fiori Horizon visuals and interaction for React, delivered as a shadcn registry → AGENTS introduction.
- L4–5 · Visual values come from SAP's open-source themes and every component is pixel-compared with the pinned SAP reference → AGENTS introduction and rules 1, 2 and 4.
- L5 · Read README and CONTRIBUTING before any task → AGENTS introduction.
- L9–10 · Backlog contains status, order and dependencies → AGENTS, Where the work is.
- L9–10 · Open cards and returns use the task and return folders, with done folders for finished work → AGENTS, Where the work is.
- L11 · One card per run unless directed otherwise → AGENTS, Where the work is.
- L11–12 · The card sets goal, UI5 source, file scope, behavior, tests and acceptance → AGENTS, Where the work is.
- L13–14 · Tick the card in the completion commit and leave its file for the reviewer to move → AGENTS, Where the work is and Integration §4b.
- L14–15 · Run plan-check after editing the backlog → AGENTS, Where the work is.
- L19 · Use Node 24, pnpm 10 and frozen-lockfile installation → AGENTS, Environment.
- L19 · Adding, removing or upgrading dependencies requires authorization in the card → AGENTS, Environment.
- L20 · Generate once after installation, including partially ignored tokens, icons, illustrations and component CSS → AGENTS, Environment.
- L21 · Install Playwright Chromium if missing → AGENTS, Environment.
- L22 · Report network or browser sandbox blocks in the final message → AGENTS, Environment.

## Commands

- L27 · Generate tokens/icons/illustrations/component CSS → AGENTS, Environment and Commands.
- L28 · `pnpm typecheck` runs `tsc --noEmit` → AGENTS, Commands and `package.json:25`.
- L29 · Build the shadcn registry manifest and `public/r` → AGENTS, Commands.
- L30 · Build docs to `dist/` → AGENTS, Commands.
- L31 · Run the main suite with its own build and preview port → AGENTS, Commands.
- L32 · Select a component spec by path → AGENTS, Commands.
- L33 · Run a compact test summary and retain the full log on disk → AGENTS, Commands and Verification budget.
- L34 · Run scoped main specs, visuals and stories against main → AGENTS, Commands and Verification budget.
- L35 · Use `--repeat-each=2` for tier 2 scoped runs → AGENTS, Commands.
- L36 · Run shared-path smoke once at tier 2 → AGENTS, Commands and Verification budget.
- L37 · Run both suites once at a milestone and retain the report → AGENTS, Commands and `scripts/test-milestone.mjs:124`.
- L38 · A release can use two runs of each suite → AGENTS, Commands and RUN, Milestones and pushing.
- L39 · Use `VISUAL_ONLY` for affected fixture prefixes → AGENTS, Commands.
- L40 · Reproduce Linux CI in Docker with `scripts/ci-local.sh` → AGENTS, Commands.
- L41 · Run the UI5 pixel comparison for four themes and two densities → AGENTS, Commands.
- L42 · Run the repository checks in order via `pnpm check` → AGENTS, Commands and `package.json:27`.
- L43 · Preview Storybook on port 6006 → AGENTS, Commands.
- L44 · Build static Storybook to `storybook-static/` → AGENTS, Commands.
- L45 · Verify Storybook rendering, globals, Controls and axe separately → AGENTS, Commands.
- L46 · Filter full component story IDs with `STORYBOOK_ONLY` → AGENTS, Commands.
- L47 · Docs on port 5173 with React, UI5, WCR and block fixture routes → AGENTS, Commands.
- L48 · Run the fresh consumer shadcn install of all blocks, then build and render → AGENTS, Commands.
- L49 · Use the integration script under the review/merge workflow → AGENTS, Commands and Integration.
- L50 · Plan-check verifies the backlog, file and return links. `--fix` moves finished cards → AGENTS, Commands and Integration §4b.
- L53 · Assign a Playwright port different from 4173/5173 to force its own build and preview → AGENTS, Commands.

## Hard rules 1–8

- L57–59 · Authority is installed UI5 Web Components 2.28 from the main or Fiori package. Read implementation, template and generated theme CSS before coding → AGENTS rule 1.
- L57–58 · Use the local pinned source over memory and web references → AGENTS rule 1.
- L59 · Quote the owning file/function in a code comment for non-obvious behavior → AGENTS rule 1.
- L60–62 · Use installed WCR 2.28.2 for WCR-only controls. Read component source, hooks and default renderers, and cite the owner in non-obvious code → AGENTS rule 1.
- L63–64 · No hard-coded design values. Use SAP tokens and component parameters, preferring an available parameter. Keep the lookup command → AGENTS rule 2.
- L65–67 · The component owns its UI, item metadata, CSS, paired fixtures, demo, spec and category story → AGENTS rule 3.
- L67–68 · Added imports require the relevant item dependency and/or registry dependency update → AGENTS rule 3.
- L68 · Shared edits need card scope and a commit-message callout → AGENTS rule 3.
- L69 · Pair every new visual state → AGENTS rule 4.
- L69–70 · Any size mismatch or over 2% different pixels fails a cell → AGENTS rule 4.
- L70–71 · Fix the cause. Tolerance or skip changes need a concrete code comment → AGENTS rule 4.
- L72 · Use `:focus-visible` for keyboard-only focus rings → AGENTS rule 5.
- L72–73 · English defaults and prop overrides for all visible strings → AGENTS rule 5.
- L73 · Keep the five supported value states → AGENTS rule 5.
- L74–75 · Wait for the actual focus/rendered value before the next keypress → AGENTS rule 6.
- L75 · Scope locators to the owning demo ID on the shared docs page → AGENTS rule 6.
- L75–76 · Never use retries or sleeps to fix flaky tests → AGENTS rule 6.
- L77 · Adding props is allowed. Removing or renaming exported names/props needs card authorization → AGENTS rule 7.
- L78 · Keep Tailwind v4 arbitrary-variable syntax for dimensions, text lengths and fonts → AGENTS rule 8.
- L79 · Use `leading-[normal]` and avoid `leading-normal` → AGENTS rule 8.
- L79 · Omit `-webkit-font-smoothing` and only use UI5 transitions → AGENTS rule 8.

## Rule 9 · Accessibility

- L80–82 · Port the template and implementation's roles, ARIA attributes/states and hidden descriptions/labels including targets → AGENTS rule 9, first bullet.
- L82–83 · Port all live announcements, keyboard model, roving tab index and initial, return and trapped focus → AGENTS rule 9, first bullet.
- L83–84 · Quote the UI5 template/function in a code comment for non-obvious ARIA → AGENTS rule 9, first bullet.
- L85–87 · Map all six native accessibility inputs to the owning host's native ARIA or named props for generated text → AGENTS rule 9, second bullet.
- L86–87 · Document the receiving host in prop JSDoc → AGENTS rule 9, second bullet.
- L88 · Hidden and announced text is overridable → AGENTS rule 9, second bullet.
- L89–91 · Every custom render preserves component-owned roles, ARIA states/relations, IDs and tab order → AGENTS rule 9, third bullet.
- L91–92 · Each customization gets a test where custom output retains the owned semantics → AGENTS rule 9, third bullet.
- L93 · Compare the accessibility tree of every fixture with the reference → AGENTS rule 9, ratchet bullet.
- L94–95 · Keep one entry per matrix/case/path/kind, with an exact fingerprint and owning P card → AGENTS rule 9, ratchet bullet.
- L95–96 · The ratchet fails on unlisted, changed and stale mismatches → AGENTS rule 9, ratchet bullet.
- L96–97 · Only the owning card deletes fixed entries → AGENTS rule 9 and Definition of done.
- L97–98 · Existing components add no entries. Match UI5 or use an eligible exact allowance → AGENTS rule 9, ratchet and allowance bullets.
- L98–99 · Wave H and later can record structural differences only under the component's P card → AGENTS rule 9 and New-component accessibility acceptance.
- L99–101 · Exact `a11yDiff` requires a permanent grounded reason such as a UI5 bug, inert wrapper or keyboard-only focus rule. Never use it as a test bypass → AGENTS rule 9, allowance bullet.
- L102–103 · `--write` is the one-time E4 baseline from successful complete Web LTR/RTL, phone and OpenUI5 captures → `scripts/a11y-baseline.mjs:13`, `scripts/a11y-baseline.mjs:17`, `tests/a11y-tree-coverage.ts:29`.
- L103 · `--list P<n>` lists the owning card's entries → AGENTS, Commands and `scripts/a11y-baseline.mjs:26`.
- L103–104 · Use `--prune P<n>` after a complete capture. The command removes only stale owning entries and rejects uncaptured owning cases → AGENTS, Commands and `scripts/a11y-baseline.mjs:28`–`35`.
- L104–105 · Capture or allowance errors cannot enter the baseline → AGENTS rule 9, ratchet bullet.
- L105–106 · Per-component audit gaps and unverified counts cannot grow → AGENTS rule 9, last bullet.
- L106 · Verified E4 mappings and functional customization proofs stay `ok` or `fixed in E4` → AGENTS rule 9, last bullet.
- L107–108 · Removing or weakening ARIA attributes, shortcuts or announcements requires card authorization → AGENTS rules 7 and 9.

## Rule 10 · Localization

- L109 · Port every locale-dependent behavior → AGENTS rule 10.
- L110–112 · Every native text key used in the reference JS/template has an English default and an override in typed partial `texts`. Keep `labels` → AGENTS rule 10, texts bullet.
- L112–113 · Comment the owning UI5 key beside the English default → AGENTS rule 10, texts bullet.
- L113–114 · Use function texts and preserve native placeholder order → AGENTS rule 10, texts bullet.
- L114 · Texts also resolve through FioriLocaleProvider. A prop wins → AGENTS rule 10, texts bullet.
- L115–116 · Dates, times, numbers, percentages, units, comparisons and plural forms use Intl or the shared date and number modules → AGENTS rule 10, formats bullet.
- L117 · Locale resolves from prop, provider, then browser language → AGENTS rule 10, formats bullet.
- L117–119 · No hard-coded separators, grouping, week start, AM/PM or month names and no display `toFixed` → AGENTS rule 10, formats bullet.
- L118–119 · Match UI5 CLDR for the same locale. Keep de-DE, zh-CN and ar-EG fixtures → AGENTS rule 10, formats bullet.
- L120 · Parse input with locale awareness wherever formatting is localized → AGENTS rule 10, formats bullet.
- L121–122 · Track each component's UI5 keys and statuses in the audit and its gap count in the baseline → AGENTS rule 10, audit bullet and `tests/i18n.spec.ts:32`–`42`.
- L122–124 · The audit rejects new gaps, formerly implemented keys becoming gaps and unfollowed gap reductions → AGENTS rule 10, audit bullet and `tests/i18n.spec.ts:32`–`42`.
- L124 · Only the owner changes its baseline. Lower counts in the same commit as fixes → AGENTS rule 10, audit bullet.
- L125–126 · RTL uses logical CSS plus UI5's icon mirroring and arrow swaps → AGENTS rule 10, direction bullet.
- L126–127 · New controls and states get RTL fixtures and direction-dependent behavior tests → AGENTS rule 10, direction bullet.
- L128 · Gregorian-only calendars retain all other localization duties → AGENTS rule 10 and Decisions, Calendars stay Gregorian-only.
- L129–130 · Removing text props, hard-coding localized text/formats or narrowing locale requires authorization → AGENTS rules 7 and 10.

## Rule 11 · Extensibility

- L132 · The extension contract is approved by the owner → Decisions, Extensibility is a library contract.
- L132–134 · Ship default UI5 parity with extension points. Fiscal pickers, booking calendars and similar features belong to consumers → AGENTS rule 11.
- L135 · New and changed components implement all of T1 → AGENTS rule 11, first bullet.
- L135–136 · T2/T3 require a realistic example that would otherwise fork the file, plus invariant tests → AGENTS rule 11, first bullet.
- L136 · Inventory tiers are ceilings → AGENTS rule 11, first bullet.
- L137–139 · E4, E5, P1–P6 including P2a, and S story cards defer T1 to X1–X13 after the owning P card → AGENTS rule 11, first bullet and Decisions, Extensibility is a library contract.
- L139–141 · Exceptions still preserve existing points, className, data-slot and controlled props. New points follow the ownership rules → AGENTS rule 11, first bullet.
- L142–143 · Preserve default pixels, accessibility tree and interaction unless the owning card explicitly fixes parity → AGENTS rule 11, second bullet.
- L144–145 · Customizations use owned semantic hosts and getters that merge extra props → AGENTS rule 11, second bullet.
- L145–146 · Preserve roles, ARIA states/relations, focus, keyboard, announcements, overridable texts, locale and RTL → AGENTS rule 11, second bullet.
- L146 · Semantic hosts cannot accept unrestricted asChild → AGENTS rule 11, second bullet.
- L147 · Slot names, components keys, context state/actions/getters and detail types are public API → AGENTS rule 11, third bullet.
- L148–149 · Document new surfaces as experimental for one registry release. Rule 7 still protects names and availability → AGENTS rule 11, third bullet.
- L150–151 · Each extension has a Customise section, tier story, neutral paired fixtures and adversarial ownership tests → AGENTS rule 11, last bullet.
- L151–152 · Ignore hostile role/ARIA/id/tabindex props and issue a dev warning → AGENTS rule 11, last bullet.
- L152 · Each extension includes an installed example importing only the component's item entry → AGENTS rule 11, last bullet.
- L153 · T4 remains deferred until an approved card implements it → AGENTS rule 11, first bullet.

## Verification budget

- L157 · The limits bind every card and agent → AGENTS, Verification budget.
- L159–160 · New components come before polish in the current phase → AGENTS, Verification budget and Decisions, Build out components first.
- L160 · The user platforms are Windows/macOS. Owner and agents develop on macOS → Decisions, Build out components first.
- L161–162 · Linux push CI is a reminder with behavior, live pixels and Storybook, including Windows-like keyboard coverage → RUN, Milestones and pushing and Decisions, Build out components first.
- L162–164 · Fix CI failures reproduced on macOS or in behavior tests. Note Linux-only failures in the milestone report without a card → RUN, Milestones and pushing and Integration §6.
- L164 · Stored-baseline tree comparisons run only at macOS milestones → RUN, Milestones and pushing.
- L165 · No fifth or later attempt → AGENTS, Verification budget.
- L165–166 · At budget exhaustion propose a small follow-up for remaining items → RUN, Card session flow.
- L167–168 · Route unrelated defects to the owning P card or return note → AGENTS, Verification budget.
- L170 · At most two CI pushes per task where authorized → AGENTS, Verification budget.
- L170–171 · Stop after the second failed CI push and commit work in progress → AGENTS, Verification budget and RUN, Card session flow.
- L171–172 · Record named failures, what each round changed and why, outstanding hypotheses and next action → RUN, Card session flow.
- L172–173 · Only the owner authorizes a third CI round. The limit grants no authorization to push → AGENTS, Verification budget and RUN, Roles.
- L174–175 · At most two local hypotheses per failing test. Commit and return if still failing, without widening scope → AGENTS, Verification budget and RUN, Card session flow.
- L176 · Record the dated tiered verification decision → Decisions, Build out components first.
- L177–178 · Tier 1 covers affected main specs, visuals, Storybook stories and Storybook regression specs in 1–3 min → AGENTS, Verification budget.
- L178–179 · Scope includes committed changes against main and working changes → AGENTS, Verification budget and `scripts/test-changed.mjs:96`–`102`.
- L179 · A component without a spec uses its visuals and prints a notice → AGENTS, Verification budget.
- L180–181 · Tier 2 follows generation, typecheck and registry build. Run scoped twice and smoke once with a ~5 min target → AGENTS, Commands and Verification budget.
- L181 · Reviewer repeats scoped tier 2 before merge → Integration §4b.
- L182–183 · Shared-file diagnostic triggers one full main and one full Storybook run at card done → AGENTS, Verification budget.
- L183–184 · Shared files include Storybook setup/helpers, shared styles/libs, Playwright configs, docs entry points and CI → AGENTS, Verification budget.
- L184 · The next full verification belongs to the milestone/CI → AGENTS, Verification budget and Integration §4b.
- L184–185 · Use affected tooling checks during implementation. Keep full suites out of the inner loop → AGENTS, Verification budget.
- L186–187 · Reviewer milestone at end of wave or owner publish request → RUN, Milestones and pushing and Integration §6.
- L187–188 · One macOS milestone run includes fresh builds, both suites and stored tree comparisons → AGENTS, Verification budget and RUN, Milestones and pushing.
- L188 · Push main only after milestone checks and authorization. GitHub Pages redeploys the docs and registry → RUN, Milestones and pushing.
- L189 · Two runs are available for a release. Aim for ~20 min locally and ~12 min in CI → RUN, Milestones and pushing.
- L190–191 · The backlog, tasks, returns and handoffs are the only bookkeeping exclusions → `scripts/changed-scope.mjs:5`.
- L191 · Bookkeeping-only runs print their message and exit zero → `scripts/test-changed.mjs:110`–`114`.
- L192–194 · Recognized inventory paths use the scoped inventory specs. Other plan files stay shared → AGENTS, Verification budget and `scripts/changed-scope.mjs:11`–`29`, `scripts/changed-scope.mjs:49`–`61`.
- L193–194 · A new component triggers inventory specs → AGENTS, Verification budget and `scripts/changed-scope.mjs:48`, `scripts/changed-scope.mjs:61`.
- L195 · Check CI timing and add a shard in the same card if it adds many tests → AGENTS, Verification budget.
- L196–198 · Use the compact summary or limit filtered output to ~50 summary/failure lines, with full logs on disk → AGENTS, Verification budget.
- L197–198 · Use one CI watch without polling, then show only filtered failing tests from the failed log → AGENTS, Verification budget.
- L199 · Background long runs, notify once at completion and avoid intermediate checks → AGENTS, Verification budget.
- L200–201 · Stop and report at about two hours or the card's tighter limit even with rounds left → AGENTS, Verification budget and RUN, Card session flow.
- L202–203 · Foreground browsers interrupt the owner on the shared machine → Decisions, Browsers stay out of the owner's way.
- L204–206 · Tests, probes and evidence are headless. Keep the exact disallowed switches/methods and visible-Chromium rule → AGENTS, Verification budget.
- L206 · Use screenshots, traces and error context as evidence → AGENTS, Verification budget and Decisions, Browsers stay out of the owner's way.
- L207–209 · Manual review uses the background browser or a dedicated Chrome extension tab group without a new window or shell open → AGENTS, Verification budget.
- L210 · Close every started browser, context and preview server → AGENTS, Verification budget and RUN, Card session flow.
- L211 · Explain a visible-window need and ask the owner before opening it → AGENTS, Verification budget.

## Definition of done

- L215 · Generation, typecheck and registry build must succeed for standard cards → AGENTS, Commands and Definition of done.
- L216–217 · Tier 2 uses two scoped runs and one smoke run, with zero failures and flakes → AGENTS, Commands, Verification budget and Definition of done.
- L217–219 · Shared-file tier 2 runs both full suites once, via compact summaries. Reviewer milestone owns the next full runs → AGENTS, Verification budget and Integration §4b.
- L219 · Old “main ×2, Storybook ×2” acceptance resolves to tier 2 → AGENTS, Definition of done.
- L220 · A new prop or visual state gets a category story → AGENTS, Definition of done and rule 3.
- L221 · Satisfy the card's acceptance → AGENTS, Definition of done.
- L221–222 · Morning/HCB walks and Evening screenshots are manual requirements only when named by the card → AGENTS, Definition of done.
- L223–224 · Paired fixtures for new/changed states cover tree comparison, clean axe, and behavior tests for new keyboard paths and announcements → AGENTS, Definition of done.
- L224–225 · No accessibility-baseline growth for existing controls. Prune exactly the fixed owning entries → AGENTS, Definition of done and rule 9.
- L226–227 · Register a new component in the same card before final runs. H8 explains the decision → AGENTS, New components and Decisions, Register new components before acceptance.
- L227–228 · Register the P-card owner in the baseline groups and directional cases in the RTL comparison list → AGENTS, New components.
- L228–229 · Add customization proofs to the specified test and verified members/texts to the accessibility audit generator → AGENTS, New components.
- L229–231 · Register reachable and unrendered UI5 keys, including keys added to an existing component through slots → AGENTS, New components.
- L231–232 · Regenerate the audits, locale packs and agent skill and keep gaps from increasing → AGENTS, New components.
- L233–235 · New components need LTR/RTL behavior and keyboard tests, axe and all reference semantic channels including label and description relationships → AGENTS, New-component accessibility acceptance.
- L235–237 · Only unnamed state-free generic changes and semantic-preserving one-level nesting shifts qualify as structural → AGENTS, New-component accessibility acceptance and Decisions, New-component cards may record structural accessibility-tree differences.
- L237–238 · Structural records use the component's existing P owner in groups → AGENTS, New-component accessibility acceptance.
- L237–239 · Only open-popup pixel cells qualify for recording with a P-card reason in `skipCompare` → AGENTS, New-component accessibility acceptance.
- L239 · Report both kinds of deferred differences in the card's return note → AGENTS, New-component accessibility acceptance.
- L239–241 · Until E11 use the exact generic-wrapper `a11yDiff` path and the prescribed P-card reason → AGENTS, New-component accessibility acceptance.
- L241–242 · Keep semantic differences out of the baseline. Fix them or use only an exact justified allowance → AGENTS, New-component accessibility acceptance and rule 9.
- L242–244 · Inventory and new registry UI/item edits run inventory specs, and the Node preflight detects missing registrations before Playwright → AGENTS, Verification budget, New components and `scripts/test-changed.mjs:115`–`127`.
- L245 · Extension deliverables include the example, ownership tests, Customise docs and story → AGENTS, Definition of done and rule 11.
- L246–247 · Named native keys for new visible/announced strings, locale-resolved Intl formats, RTL fixtures and no audit gap growth → AGENTS, Definition of done and rules 9–10.
- L248 · Work on `codex/<card-id>` and use small commits with English imperative messages → AGENTS, Where the work is.
- L248–249 · Card sessions never push or merge into main → AGENTS, Where the work is and RUN, Roles.
- L249–250 · Separate worktrees leave main's files and branch alone, following an earlier incident → AGENTS, Where the work is and Decisions, Parallel sessions with one reviewer.
- L251–252 · Pin SAPUI5 popups within the shared fixture cell, hide replaced parents, re-pin after positioning and prevent focus-driven closure → AGENTS, Gotchas.
- L253–255 · Final message copies tier 2/test summary lines, counts CI and full-suite runs, lists changed files and shared edits, and explains skips/deferrals → AGENTS, Definition of done.

## Gotchas

- L259 · Share React/WCR fixture inputs via a neutral module → AGENTS, Gotchas.
- L259–260 · WCR reference avoids registry imports, imports WCR Assets/static CSS and awaits the async i18n bundle → AGENTS, Gotchas.
- L261 · Morning/Evening use sap_horizon.css and HCB/HCW use sap_horizon_hc.css → AGENTS, Gotchas.
- L262 · Fiori fixtures import the Fiori Assets module → AGENTS, Gotchas.
- L263 · UI5 fixtures import each used icon by its individual module → AGENTS, Gotchas.
- L264 · Compare popups in place with the established helpers → AGENTS, Gotchas.
- L265–267 · “If feasible” requires a real attempt (~1 h). If native rendering still cannot settle within the cell, annotate a single-case skip, test behavior and report the exception → AGENTS, Gotchas and rule 4.
- L268 · Block target path is `components/<name>.tsx` → AGENTS, Gotchas.
- L268 · Block and component names must differ or registry build fails → AGENTS, Gotchas and `scripts/build-registry-json.mjs:62`.
- L269 · Prefix fixture, demo and test IDs with the component name → AGENTS, Gotchas.
- L270–271 · Wait for the file chooser and perform a protocol round trip before the opening action → AGENTS, Gotchas.
- L271 · Cap Playwright workers at 75% → `playwright.config.ts:12` and `playwright.storybook.config.ts:7`.
