# H12b — Match the ActionSheet phone title bar

Continue on `codex/H12` in `.worktrees/H12`. Merge local `main` first.
Use the AGENTS.md verification budget with zero CI pushes.

## Review findings

The reviewer ran a production bundle at `e21c437` against the pinned WCR phone
surface at the same 375 px width in Morning Horizon cozy.

| Header input | Petalo header | WCR header |
|---|---:|---:|
| Short title | 44 px | 44 px |
| Omitted title | 0 px | 44 px |
| Long title | 72 px, wrapped | 44 px, single line with ellipsis |

The ordinary action activated once, closed the surface and returned focus to the
opener in all three runs. See
`.worktrees/review-h2-h9/.integration/review-h12/phone-probe.json` and the
adjacent probe and entry point.

The existing LTR/RTL behavior and desktop WCR tree checks passed all six reviewer
tests. Log: `test-results/summary-2026-11-25T07-37-14-039Z-56260.log` in the
reviewer worktree.

`ResponsivePopoverTemplate.js` renders its default mobile header even without
`headerText` and passes `wrappingType: "None"` to the title. Follow the
header height and title width in `generated/themes/ResponsivePopover.css.js`
and the single-line ellipsis in `generated/themes/Title.css.js`. WCR
`ActionSheet/index.js` hides the close button and aligns the title to inline start.
The Petalo title currently supplies the only minimum height in
`registry/styles/components/action-sheet.css`, and its flex layout lets text wrap.

## Scope

Update the ActionSheet phone header styling and its owned markup as needed.
Add neutral paired phone cases and focused assertions in the existing ActionSheet
fixtures and tests. Preserve the heading's full accessible name when its visible
text is truncated.

## Acceptance

- The header retains the SAP height without a supplied title and exposes no empty
  heading. A title that exceeds the available width stays on one line and
  truncates at inline end. Verify LTR and RTL, keeping the named header region,
  existing keyboard behavior and return focus.
- Pair the omitted and long title cases against WCR. Keep the existing size and
  pixel limits, tree, localization and axe checks. Re-run the item-only phone
  smoke test and Tier 2. Tick H12 and H12b once the checks pass.
