# H9e — DynamicDateRange editor parity

H9e stays open on `codex/H9e` in `.worktrees/H9e`. The branch restores the DynamicDateRange item, paired fixtures,
demo, stories, tests and its registrations from `966e1a4` on top of local main `5344ea0`.

## Verification

- Installed dependencies with the frozen lockfile. Generation, TypeScript, registry build, and the accessibility
  and localization inventories passed. The plan check reported 0 errors.
- Baseline reproduction — `23 passed, 20 failed, 0 flaky, 0 skipped (243.7s)`. LTR and RTL Web Components trees each
  had 378 difference lines. The Arabic visual cells failed in every theme and density. The date-time editor visual
  cells exceeded the 2% threshold. The first registry build identified DynamicDateRange's missing P2 owner in the
  plan table, which was restored before the first repair run.
- First repair — `39 passed, 6 failed, 0 flaky, 0 skipped (260.8s)`. Matched the date-time range field spacing and
  Date/Time switch to the measured UI5 editor geometry. Reused Gregorian date parsing and formatter helpers with
  Latin digits and matched the pinned Arabic medium date pattern. Cloned fixture dates because the native
  `toDates.js` mutates dates through the date-only options. Matched Navigate Back's single tooltip-based name and
  Submit's translated default-action description. All 24 localized comparisons passed. The compact From/To calendars
  still rendered 18 px farther from inline-start than UI5. The trees each had 373 difference lines.
- Second repair — `45 passed, 2 failed, 0 flaky, 0 skipped (273.6s)`. The compact calendar now starts on the native
  inline edge, so all 117 visual cells and all 24 localized comparisons pass. The highest pixel difference was
  0.725%, on the RTL Morning cozy Next editor. The native header, footer and Date/Time switch wrapper comparisons
  use exact state-free wrapper paths or the existing guarded form-associated Button host handling. The full
  Snapshots and AX captures retain the real nodes. The editor behavior test covers switching to Time after a day
  selection, and the new Storybook stories open the relative, range and single date-time editors.

- Focused Storybook — `27 passed, 0 failed, 0 flaky, 0 skipped (33.3s)`. New editor and existing component stories
  passed render and axe checks. Log `test-results/summary-2026-11-24T01-31-45-613Z-96202.log`.
- A fresh app installed only `@petalo/dynamic-date-range` with shadcn, then passed strict TypeScript and Vite
  build. Production Chromium verified the styled field, typed expression, custom editor, named actions and focus return.
  Log `.integration/H9e/consumer-final.log`.

The shared fixture type and restored accessibility normalizer call for full-suite Tier 2 verification. The two
focused tree failures leave Tier 2 and smoke pending. CI rounds and full-suite runs were both zero.

## Remaining tree failures

Both `all Web Component accessibility trees ltr` and `all Web Component accessibility trees rtl` still have
188 difference lines. All five closed cases pass in both directions. These are the exact open-case counts in
each direction:

| Fixture | Difference lines | Cause observed |
| --- | ---: | --- |
| `dynamic-date-range-options` | 32 | Native list shadow hosts add wrappers around the sentinels, and the scoped snapshot reports the projected preset text before each named list item. The React List mounts an empty local polite alert. |
| `dynamic-date-range-amount`, `dynamic-date-range-next-editor` | 37 each | `LastNextTemplate.js` gives the labels no control references. Scoped native StepInput exposes an unnamed textbox and generic focusable step buttons. The React StepInput has its associated label, spinbutton semantics and named Increase/Decrease buttons, and Select has its associated unit label. |
| `dynamic-date-range-date-editor`, `dynamic-date-range-period-editor` | 3 each | The Calendar shortcut token is serialized as `Shift+F4` versus native `Shift + F4`. The React Calendar has an empty local assertive alert in both channels. |
| `dynamic-date-range-date-time-editor` | 58 | `DateTimeRangeTemplate.js` renders labels without associations. React keeps the associated From/To textboxes and named picker buttons. The native closed DateTimePicker's icon wrappers and placeholder channels differ. The input and preview dates now agree after cloning the fixture dates. |
| `dynamic-date-range-from-date-time-editor`, `dynamic-date-range-to-date-time-editor` | 9 each | The React Date/Time switch has a name. Native `FromDateTimeTemplate.js` mounts its SegmentedButton without one. Its options omit the implicit false invalid state. The Calendar shortcut and two empty assertive live outlets also differ. |

The next attempt should first compare where native announcements are mounted during actual interaction, beginning
with the date-only editors, and verify equivalent shortcut serialization. For the relative and date-time range
editors, compare the owned accessible controls against the native templates one at a time and document native
label/role defects with exact shape checks if the reviewer accepts those differences. Preserve named controls,
live content, real states and keyboard/focus behavior. The tree attempts used the full two-hypothesis budget.
The stored baseline has no additions and the visual matrix uses the regular 2% threshold.

Full reports are under `.integration/H9e/` and `test-results/`. The final tree capture is
`test-results/a11y-capture-2026-11-24T01-25-35-184Z-91686/a11y-tree-report.json`. The final test summary is
`test-results/summary-2026-11-24T01-25-35-184Z-91686.log`.

## Review of `1ae2b54`

The reviewer checked the final capture, the installed reference templates and the branch scope.
LTR and RTL both retain the same 188 lines across the eight open cases. The underlying differences
include empty announcement outlets and the native List's projected text, as well as real name and role
differences on the amount and date-time editors. The source templates render the amount, unit and From/To
labels separately from their controls and render the Date/Time SegmentedButton without a group name.
The branch preserves the existing named controls and does not change shared StepInput, DateTimePicker
or SegmentedButton production code. No tree baseline entries were added.

H9e returns unchecked. This is the same open-editor parity issue that survived H9b. Before another
implementation run, settle how to compare the source-confirmed unassociated labels and the native
amount textbox while retaining the React controls' names and spinbutton semantics. Keep the rule 9
case-specific source proof and real interaction checks. No additional card was opened for the same issue.

## 2026-11-25 owner decision and acceptance

Merged local main `e9f3827` into the card branch before verification. The owner approved
the [case-specific comparison](../decisions.md#2026-11-25--preserve-accessible-controls-in-dynamicdaterange-editors).
The exact checks reconcile the native label and role deviations in the amount and date-time range editors, the
unnamed Date/Time listbox, duplicated native preset text, empty pinned-fixture announcement outlets, and the
Calendar year shortcut spelling. They verify the expected names, values, states, references, and node shapes
before reconciliation. Shared picker production code and the stored accessibility-tree baseline were unchanged.

The first focused run passed both tree matrices and all nine visual passes. Four new interaction tests failed
to start from their intended React route or opener. The follow-up scoped the tests to the mounted demo and
used its live opener. All 15 interaction tests passed, including LTR and RTL amount and unit edits, From/To
names and focus, the UI5 and React selection announcement, the year shortcut and focus return.

Full Tier 2 compared all 26 DynamicDateRange trees with zero unresolved differences. The 117 visual cells
passed with a maximum difference of 0.7310%, and all 24 localization checks passed. Generation, typecheck,
registry build, the accessibility ratchet and a fresh item-only install passed. The installed project verified
typed expressions, a custom editor, named actions and focus return. Evidence is in `.integration/H9e/`.

```text
1972 passed, 0 failed, 0 flaky, 0 skipped (784.7s) | Log: test-results/summary-2026-11-25T01-41-26-265Z-42606.log | PORT=4310 SAPUI5_PORT=4311
4662 passed, 0 failed, 0 flaky, 0 skipped (887.6s) | Log: test-results/summary-2026-11-25T01-54-31-828Z-45839.log | STORYBOOK_PORT=4320
```

Shared test files required the full Tier 2 route, one main suite and one Storybook suite. Zero CI pushes.
The card and this note stay in place for reviewer archive.
