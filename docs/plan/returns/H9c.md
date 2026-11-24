# H9c — SelectDialog verification

Restored SelectDialog from `966e1a4` on top of `5344ea0`. The implementation uses the pinned WCR 2.28.2 SelectDialog and UI5 Web Components 2.28.1 dialog, input, button and list sources.

## Findings and changes

- The initial focused run passed the nine visual matrices and seven behavior and axe checks. Both WCR tree directions failed. The named dialog, listitem descriptions and checked state were already present, but the confirmation button lacked UI5's **Default Action** description. The count announcement did not clear after the pinned InvisibleMessage interval.
- The first correction added the overridable, translated confirmation description and tested clearing the polite announcement while preserving the visible count. Exact, case-owned guards verify the closed PopupTemplate shell, duplicated form-host properties, the title tooltip's equivalent name and description representation, and the empty announcements present only in the React static fixture. The open dialog's live count is exercised with a controlled browser clock.
- The second correction aligned two unnamed WCR List wrappers around its actual focus sentinels. Both sentinels remain in the comparison. The final semantic trees then matched in both directions, including the level-1 heading, searchbox, listitem names and descriptions, checkboxes, confirmation and cancel.
- Localized fixtures compared translated search and confirmation, the confirmation description, the selection count and active row names in German, Simplified Chinese and Arabic RTL. React now supplies the translated active-row description to its owned List and uses the same ungrouped Latin digits as the WCR count. The localized WCR probe established that the page's shadow dialog exposes slotted controls in its accessibility tree. The test queries those controls from the owning fixture cell so Playwright's DOM containment does not skip the slots.
- The restored usage routes affect only ComboBox and ValueHelpDialog metadata. Shared fixture types and tree comparison support the narrowly guarded pinned Dialog. The audit generators and generated references enumerate the newly shipped item and its delegated translation keys. The shared List, Input, Button and Dialog implementations are unchanged.

## Structural accessibility baseline

`node scripts/a11y-baseline.mjs --record select-dialog` recorded 130 entries owned by P4 from the complete six-matrix capture. Every entry is an extra or missing unnamed state-free generic wrapper. The five named cases have 12 single, 17 multiple, 17 selected, 17 custom and 2 empty entries per WCR direction. Full source captures are in the H9c worktree under `.integration/H9c/` and `test-results/`. The case-owned comparison guards validate exact shape and retain interactive nodes, relationships and descendants. The recorded entries contain no standalone role, name, state, text or description mismatch. Visual tolerance and fixture comparison coverage remain at repository defaults.

## Focused verification and checkout scope

- Generate, typecheck, registry build and the accessibility audit check passed. `pnpm test:changed` classified the shared fixture type and tree normalizer as requiring the full-suite fallback.
- `20 passed, 0 failed, 0 flaky, 0 skipped (71.8s)` in `test-results/summary-2026-11-24T01-27-10-571Z-92904.log`. The run covers every WCR visual pass and both WCR trees, plus selection, focus return, translated UI strings, row ownership, count expiry and four themes' axe checks.
- A fresh Vite app requested only `@petalo/select-dialog` from the local shadcn registry. Strict TypeScript and production build passed. The headless app verified the search styling slot, clear control and focus, rejected hostile row props, selected a row and restored opener focus. The final evidence is `.integration/H9c/consumer-final.log`.
- The full main snapshot covered all six accessibility matrices again on the final source. The E11 recorder added zero further entries.

## First full-suite fallback

- Main ran once with three workers and retries off. `1911 passed, 1 failed, 0 flaky, 0 skipped (1725.1s)` in `test-results/summary-2026-11-24T01-29-43-059Z-94570.log`. The sole failure was `select: phone label names dialog and list separately and follows live label updates`. The native UI5 Select still exposed “Shipping country” after the test updated its label to “Billing country” at `tests/select.spec.ts:159`. H9c's exact isolated comparison passed 12/12, with retries off, in `test-results/summary-2026-11-24T02-43-05-437Z-57160.log`. The reviewer observed 16/16 passed on clean main. Select, the phone fixture and the owning assertion are identical in both revisions.
- Storybook ran once with three workers and retries off. `4556 passed, 1 failed, 0 flaky, 0 skipped (2644.1s)` in `test-results/summary-2026-11-24T01-58-30-473Z-15534.log`. The sole failure was `S3 Playground-open marker binds its live primary docs canvas (sap_horizon)`, waiting for the open ViewSettingsDialog segmented-button mode control at `tests-storybook/known-issues.spec.ts:154`. The same H9c test failed once in 12 isolated runs with retries off in `test-results/summary-2026-11-24T02-43-05-436Z-57154.log`. P4 already tracks this same test family and control. The owning story, component, assertion and Storybook configuration are identical to clean main.

## Full confirmation

Both suites passed unchanged with seven workers, retries disabled and the same generated inputs.

- Main. `1912 passed, 0 failed, 0 flaky, 0 skipped (754.3s) | Log: test-results/summary-2026-11-24T02-44-41-777Z-58019.log | PORT=4310 SAPUI5_PORT=4311`.
- Storybook. `4557 passed, 0 failed, 0 flaky, 0 skipped (896.5s) | Log: test-results/summary-2026-11-24T02-57-16-830Z-64520.log | STORYBOOK_PORT=4320`.
- Total full runs were two main and two Storybook. CI rounds were zero.
