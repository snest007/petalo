# E11b — Close the E11 review gaps

Continue on `codex/E11` in `.worktrees/E11` after merging local `main`. Scope is the existing E11 tooling and its tests.
Budget is two hypotheses per failing check, about two hours and zero pushes.

## Review findings

1. **Popup containment misses owned content.** An expanded combobox in a 120 px fixture owns a visible, fixed
   `role="listbox"` via `aria-controls="combo-list"`. The listbox extends 100 px into the next cell.
   `popupOverflow` returned `[]`. A second test used an in-cell dialog with a visible absolutely positioned
   child extending 100 px outside the cell. It also returned `[]`. In `tests/visual-popup-cell.ts` around lines
   11–37 and 84–103, the ownership scan records trigger IDs, but the bounds loop visits only the selector's
   surface matches. Discover owned popup targets through their IDs and check their escaping painted descendants.
   Keep the clipping and per-case opt-out guards.
2. **A crash lets two callers claim the same explicit port.** A child claimed TCP 49000 and exited before binding
   a listener. The next two lease requests for that exact port both returned 49000 even though the first new
   caller still held its lease. In `scripts/free-port.mjs` around lines 25–37 and 104–111, an abandoned symlink
   permits a socket probe with no replacement claim and returns a no-op release. Recover an abandoned claim
   atomically or reject the second request with the active owner's PID and command. Keep busy socket detection
   and automatic selection.
3. **Structural recording rejects an allowed one-level wrapper change.** The live comparison helper produced
   role/name differences for `generic → button "Confirm"` versus the same button directly at the root. The
   flattened semantic order and parentage were identical. `recordStructuralDifferences` rejected the case
   because the positional comparison reported `/ax/0/role`, `/ax/0/name` and the relocated named child. Reconcile
   provably inert wrappers in the comparison/report path so the ratchet uses a stable structural identity.
   Keep refusals for real role, name, state, value, text, relationship, order or semantic-parent changes.

The E11 merge candidate at `183dd9e` plus review base `3093cb2` gave 29 passed and 3 failed with retries off.
The failing browser and tree probes are in the reviewer worktree's
`.integration/review-e11/repro.spec.ts` and `test-results/summary-2026-11-23T09-19-26-221Z-53599.log`.
The killed-owner result is in `.integration/review-e11/stale-port.log`.
E11's original full main and Storybook logs were green.

## Acceptance

- Add regression checks for the linked listbox, escaped descendant, dead-owner port lease and one-level wrapper.
  Preserve the existing negative tests for changed semantics and clipped content.
- Re-run E11 acceptance, including the full shared-file suites once with 0 failed and 0 flaky. Keep component
  and fixture rendering out of scope. Tick E11 and E11b together when acceptance passes.
