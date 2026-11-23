# H2d — Restore AnalyticalTable built-in filter parity

Continue on `codex/H2` in `.worktrees/H2` after E11. Merge local main first and keep its H2d card and H3 dependency.
Budget is two hypotheses per failing check, about one hour, and zero pushes. See the [H2 return](../../returns/done/H2.md).

## Review findings

1. A headless Chromium comparison of `codex/H2` merged with `2d2a787` found three built-in filter regressions.
   With rows `SAP Fiori`, `SAP Analytics`, `Other`, WCR returns `SAP Fiori` for `includesAll` with
   `["SAP", "Fiori"]` and `SAP Fiori`, `Other` for `includesSome` with `["Fiori", "Other"]`.
   For numeric strings `"2"`, `"10"`, `"20"` and `between` bounds `[1, 12]`, WCR returns `"2"` and `"10"`.
   The petalo grid shows its filtered empty state in all three cases.
2. `registry/lib/analytical-table/sort-filter.ts` limits `includesAll` and `includesSome` to array cells and
   `between` to number cells. Follow WCR's `AnalyticalTable/react-table/filterTypes.js` for string and array
   membership and numeric comparison. Keep the localized text matching required by H2 and test both controlled
   filters and updates through the custom Filter slot.
3. The H2 main run failed at the ColorPalettePopover outside-pointer focus assertion. The reviewer reproduced
   that failure on clean main and recorded it in [P2](../P2-parity-value-pickers.md#review-finding).

## Acceptance

- Add regression coverage for the three reference comparisons and preserve the existing AnalyticalTable
  WCR pixel, LTR/RTL tree, axe and keyboard checks. Preserve the custom Filter slot and installed-consumer proof.
- Regenerate, typecheck, build the registry and complete the H2c verification with zero failed and zero flaky.
  Tick H2, H2b, H2c and H2d together.
