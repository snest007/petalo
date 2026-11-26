# H13b — Preserve user settings state across categories

Continue on `codex/H13` in `.worktrees/H13`. Merge local `main` first.
Use the AGENTS.md verification budget with zero CI pushes.

## Review findings

In the built candidate at `9a0947b`, select Evening Horizon in Appearance,
open General, and return to Appearance. Petalo shows Evening Horizon as
`Not Selected` and reverts to Morning Horizon. The same flow in UI5 2.28.1
leaves Evening Horizon `Selected`. The reviewer captured both sides with
`.worktrees/review-h13/.integration/review-h13/navigation-state.spec.ts`.
The summary was 1 passed and 1 failed at
`.worktrees/review-h13/test-results/summary-2026-11-26T08-10-34-727Z-49527.log`.

`UserSettingsDialogTemplate.js` changes the name of the active content slot,
and retains the supplied views as light-DOM children. Petalo replaces
`active.content` on every category change and reinitializes the uncontrolled
selection when the view mounts again.

## Scope

Retain the supplied category view instances and separate their state by stable
category ID during an open dialog session. Cover the existing Appearance view
and the narrow Back path. Preserve the active pane's focus and visible layout
and keep inactive controls out of the keyboard and accessibility tree. Keep
the implementation and regression in the existing `user-settings-dialog`
files. The dedicated Notifications view follows H13 integration.

## Acceptance

- Reproduce the red and green Appearance path against native and Petalo.
- Cover LTR and RTL, verify the narrow Back path and that the edited selection
  persists on return. Verify the tree, pixels and axe at the existing limits.
- Re-run the item-only install and Tier 2. Tick H13 and H13b together when the
  checks pass, and record evidence in `docs/plan/returns/H13.md`.
