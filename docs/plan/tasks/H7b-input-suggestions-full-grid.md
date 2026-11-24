# H7b — Close Input suggestions full-grid acceptance

Continue on `codex/H7` in `.worktrees/H7`. Merge local main first and keep this reviewed card and
the [H7 return](../returns/H7.md) when resolving their duplicate additions. Budget: 2 hypotheses per failing
check, about 2 hours, and 0 pushes.

## Review findings

1. H7's desktop pixel tests failed in all 9 matrices. 33 of 45 new Input cells exceeded the 2% limit.
   In a same-build HCB compact probe, `input-suggestions-filtered` had a 210 × 66 px native popup against
   a 242 × 130 px cell. Its origin relative to the cell moved from (16, 45) in isolation to
   (-790, -18469) in the full grid. Both captures had `:popover-open`. The fixture overrides `openPopup`
   in `docs/src/fixtures/input.ui5.ts`, but `Popup.js` calls `showPopover` separately. Pin the native popup
   in its own cell, including after native positioning, following `docs/src/fixtures/ui5-popup-in-place.ts`.
2. The clean-main grid passed all 9 matrices, including all 44 foreign matrix failures across 9 case IDs
   on H7. Recheck those exact cells after fixing the Input fixture. The H7 return links the recorded comparison.
3. The Storybook run failed 6 axe checks across Morning Horizon and HCB. Input Suggestions Customise
   and RTL use `li[role=group]` inside another group. Suggestions Value State exposes a nested
   `role=banner`. Fix the semantic hosts in `registry/ui/input.tsx`, preserve the accessible group
   label and validation announcement, and document any native-template deviation at its exact fixture path.

## Acceptance

- Compare all open Input suggestions in the full desktop grids, including grouped RTL, filtered and value-state
  cases. Keep the existing 2% threshold, keyboard model and tree ratchet.
- Pass the affected Storybook axe, tree, phone, keyboard and locale checks. Keep both installed-consumer proofs.
- Rerun H7 acceptance under AGENTS.md, including the Input importers, with zero failed and zero flaky.
  Tick H7 and H7b together.
