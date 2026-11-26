# P4 — Accessibility and localization parity: overlays

**Goal:** shrink this group's share of the two ratchet baselines to zero: every `tests/a11y-tree-baseline.json`
entry with `owner: "P4"`, every `tests/a11y-audit-baseline.json` gap/unverified count for these components, and
every `tests/i18n-audit-baseline.json` gap for them. Depends on **E4 and E5 merged** (they create the baselines and
the provider). P1–P6 touch disjoint component files and may run in parallel; run at most two at a time (they all
run the full tree matrix).

## Components

`action-sheet`, `dialog`, `popover`, `responsive-popover`, `menu`, `toast`, `user-menu`, `value-help-dialog`, `view-settings-dialog`, `adapt-filters-dialog` — includes the unnamed ViewSettingsDialog mode control that blocks S3 (`view-settings-dialog.tsx:447`; UI5 shares the defect → fix it and record an `a11yDiff`).

Also: `tests-storybook/known-issues.spec.ts` › "S3 Playground-open marker binds its live … canvas" times out about 1 in 40 isolated runs waiting for the open dialog's mode control (`.fiori-vsd__sub-header > [data-slot="segmented-button"]`), on main as well (measured 2026-11-23 at the H8 merge). Make the open wait deterministic when the marker is removed.

## How

1. Start from the data, not from memory: `node scripts/a11y-baseline.mjs --list P4` (or filter the JSON by
   `owner`), the audit rows for these components in `docs/plan/a11y-audit.md` and `docs/plan/i18n-audit.md`
   (including their triage: `absent-feature`, `delegation`, `owner-review`, …), and the announcement inventory
   entries marked `owner: P4`.
2. Work **one component at a time**, one commit each (`P4: <component> — <what>`). For each entry, read the UI5
   source the entry cites (rule 1) and decide:
   - **Port it** — the usual case: make our tree / text / announcement match UI5 (rules 9 and 10), with a fixture on
     both sides if the state has none, and a behaviour test for keyboard paths and announcements.
   - **Permanent deviation** — only for a documented UI5 bug, an inert wrapper, or rule 5 over UI5: an `a11yDiff`
     entry with a concrete reason quoting the UI5 line. Never for "not ported yet".
   - **Absent feature** — UI5 has a feature we don't (e.g. a property we never built): don't build features here.
     Record it in the audit as `absent-feature` with the UI5 property, and list it in your final message so the owner
     can plan it. Its entries leave the baseline only if the component legitimately doesn't render that state.
3. After each component: `node scripts/a11y-baseline.mjs --prune P4` and lower the i18n baseline counts, in the
   same commit as the fix (the ratchet fails otherwise).
4. Component defects that S-cards marked `fixed by E4-followup` for these components are yours too: fix them and
   remove the marker.

## Rules

- No new features, no API removals (rule 7); additive props only where UI5 has an equivalent property.
- Don't touch other groups' components, the baseline entries of other owners, or the comparison harness (changes to
  `tests/a11y-tree*.ts` or the normaliser need a concrete harness bug, called out in the commit message).
- Pixel parity still holds (rule 4): run `tests/visual.spec.ts` for every component you change.

## Files

The listed components' own files (rule 3); `tests/a11y-tree-baseline.json`, `tests/a11y-audit-baseline.json`,
`tests/i18n-audit-baseline.json` (only this card's entries); `docs/plan/a11y-audit.md`, `docs/plan/i18n-audit.md`
(only these components' rows); `tests-storybook/known-issues.ts` (remove markers only); and, for new text keys, the
generated language packs (`registry/i18n/**`, regenerate — don't hand-edit).

## Acceptance

AGENTS.md definition of done; `owner: "P4"` entries in the tree baseline: **0**; audit/i18n gap counts for these
components: 0 except rows recorded as `absent-feature` (listed in the final message with their UI5 property) and
justified `a11yDiff`s; Storybook suite green twice. If the card turns out bigger than L, finish whole components,
stop, and report which components remain — the owner splits the rest into `P4b`.
