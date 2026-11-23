# H9c — Finish SelectDialog parity

Continue on `codex/H9c` in `.worktrees/H9c` after H9, H9b and H9d merge. The branch preserves H9b's tip
`966e1a4`. After merging local main, recover the SelectDialog-owned sources, registrations and usage routing
from that tip. The original [H9 return](../returns/H9.md) records both components' checkpoint history.

## Review findings

1. The H9b LTR and RTL WCR comparison still fails after the exact pinned Dialog shell is verified. The
   single-selection capture has an extra empty React `alert` and a search field wrapper with differing `invalid`
   and focusability properties. The WCR heading is one level deeper with level 1 on the heading itself.
   Compare the named modal's header, searchbox, list (including selection states), footer and live region.
2. Trace the empty alert's lifecycle and keep the announcement tests. Reuse exact, guarded native host
   handling for inert wrappers where appropriate. Keep the search slot, clear behavior and focus return.

## Acceptance

- Keep the passing WCR pixel matrix and complete LTR/RTL tree, axe, behavior and extension ownership checks.
- Install `@petalo/select-dialog` as the only requested item in a fresh consumer, build and render it, and prove
  the search slot and focus behavior. Complete tier 2 and tick H9c. Budget is two hypotheses per failing check,
  about two hours, and zero pushes.
