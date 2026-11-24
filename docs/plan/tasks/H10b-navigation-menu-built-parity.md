# H10b — Close NavigationMenu built parity and open-state acceptance

Continue on `codex/H10` in `.worktrees/H10`. Merge local main first and keep the reviewed
[H10 return](../returns/H10.md) if the return note is added on both sides. Budget: two hypotheses per
failing check, about two hours and zero pushes.

## Review findings

1. All nine desktop visual passes on `bfcda85` fail with English RTL cells that are 4 px too narrow.
   Cozy measures 204×236 against 208×236 and compact 200×188 against 204×188. The production stylesheet
   compiles `:dir(rtl)` into `:lang(...)`, while the reference and component use a right-to-left layout
   with `lang=en`. The saved dev probe matches the reference width exactly. Apply the inset selection
   to the menu's effective direction with an owned attribute and check the production output.
2. The headless open-state probe measures the native root at the opener's inline end and the checkpoint's
   root below it. The first native submenu is 107.546875 px wide, including its distinct popup styling,
   and the checkpoint uses a 160 px minimum. Review native `Popover.js` placement, `MenuItem.css.js`
   offset and the NavigationMenu root versus submenu settings before updating the paired open fixtures.
   Keep surfaces in their fixture cells and verify real positioning separately.
3. The native phone probe drops the crossed-shadow Dialog name reference, and the Back button's computed
   name comes from the nav-back icon. Derive the expected labels from the pinned source and test actual
   phone roving focus, back/dismiss and post-activation focus. Compare the owned single roving target
   against the native anchor and inner item without weakening focus or named state checks.

## Acceptance

- Pass the full built RTL/LTR pixel matrix and pair an open nested state. Keep the 2% limit, the full live
  tree comparisons and the existing exact native deviations documented in the H10 return.
- Verify phone and localized keyboard/label cases (de-DE, zh-CN and ar-EG) with the installed source,
  hostile extension checks and a fresh item-only consumer using the built direction styles.
- Complete the remaining Storybook and Tier 2 acceptance with zero failed and zero flaky. Tick H10 and H10b.
