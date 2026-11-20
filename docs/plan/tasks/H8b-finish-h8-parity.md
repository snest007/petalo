# H8b — Finish H8: make main green with the three new components, then merge-ready

**Goal:** H8 (`codex/H8`, commits `ec0f60a` SplitButton, `02e790a` ButtonBadge, `663504e` NumericInput) is
merge-ready: main's full suites pass with the new components registered everywhere the shared tests expect them.
Trimmed by the owner on 2026-11-20 to what merging needs; polish moves to P1 (build-out phase, AGENTS.md
"Current phase"). Read [the H8 return](../returns/H8.md) for the evidence of the first run.

## Where

Continue on **`codex/H8`** in `.worktrees/H8`. **Merge main first**: main has moved 3 commits (H0 merged: WCR reference,
`wcr:` keys in all 48 locale packs, `fiori.css` WCR parameters, `i18n-audit.md` regenerated). Expect conflicts in
`docs/plan/README.md`, `registry/i18n/*`, `docs/plan/i18n-audit.md` and generated usage/skill files: keep main's
content and regenerate generated files (`pnpm generate && pnpm registry:build`) rather than hand-merging them.
Leave the main checkout untouched.

## Do (in this order)

1. **Shared registrations** — without these, main's tests fail after merge:
   - Add owners for the H8 fixtures in `tests/a11y-tree-baseline.ts` (split-button, button-badge, numeric-input →
     **P1**, like Button/StepInput) and the RTL inventory, so `a11y-tree.spec.ts` no longer stops at
     `No P-card owner for case numeric-input-default`. New components **match UI5 or use an exact `a11yDiff` with a
     concrete reason** (rule 9); they don't add baseline entries.
   - Register the H8 customization proofs and accessible members in the E4 audit/customization inventories, including
     Button's new `badge` slot where ToggleButton/ToolbarButton inherit it.
   - Update the E5 i18n inventories for `BUTTON_BADGE_ONE_ITEM` / `BUTTON_BADGE_MANY_ITEMS` and the new controls.
     Mark private/unrendered native features as such; the ratchet must pass without raising any gap count.
   - Regenerate the tracked usage references, skill and locale packs.
2. **SplitButton open menu in HCB/HCW** (4 pixel cells): fix it, keeping the real Menu composition and the popup in its
   cell. This is the new component's own look, so it stays in H8b. At most 2 hypotheses; if it still differs, add
   `skipCompare` for those 4 cells only, with a concrete reason comment, and list it in the final message.
3. **Re-verify Button.** H8 changed `registry/ui/button.tsx` (badge slot, accessible-name composition), which every
   other component uses. Confirm the earlier failures are gone: the 24 main and 14 Storybook failures from the first
   run, the `label-content-name-mismatch` cases, and the docs-page axe runs.

## Moved out (owner's decision, 2026-11-20)

- **NumericInput focused value-state popup paired fixture** → noted in P1. Behaviour tests already cover it.

## Files

H8-owned files (`split-button`, `button-badge`, `numeric-input` in every rule-3 location), `registry/ui/button.tsx`,
`tests/a11y-tree-baseline.ts` and the E4 audit/customization inventories, the E5 i18n inventories/audit, generated
usage/skill/locale outputs, `docs/plan/returns/H8.md`, `docs/plan/README.md`. Nothing in other components.

## Budget (hard)

About 2 hours, 0 CI pushes, at most 2 hypotheses per failing check. This is a shared-file card that also changes
Button, so at the end run the **full main suite once and the full Storybook suite once** (`pnpm test:summary`), plus
`tests/a11y-tree*.spec.ts` on macOS. Don't run full suites while another heavy job runs on the machine; re-run a
failing timing test alone once before treating it as a defect. At a limit: commit, add a short "H8b result" to
`docs/plan/returns/H8.md`, stop.

## Acceptance

1. Full main ×1 and full Storybook ×1: 0 failed, 0 flaky. `tests/a11y-tree*.spec.ts`: 0 unlisted / 0 stale. i18n
   ratchet passes. Copy the summary lines.
2. All H8 fixtures pass pixel and axe (except any `skipCompare` from step 2, listed with its reason).
3. Tick **H8 and H8b** in `docs/plan/README.md`; run `node scripts/plan-check.mjs` (the ticked-card folder warning is
   expected; the reviewer moves files). Don't push or merge.

## Final message

Changed files, the four summary lines, what fixed the SplitButton cells (or the skipCompare reason), how each earlier
failure family was resolved, CI rounds (0), full-suite runs used.
