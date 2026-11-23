# H9c — SelectDialog and DynamicDateRange parity

Continue on `codex/H9c` after H9 and H9b are merged. Use the preserved H9b tip `966e1a4` and `docs/plan/returns/H9.md` at that tip for the implementation and capture history. When syncing merged main, restore the deferred components and their registrations from that tip or the inverse of the move commit `e0e1720`. Preserve the merged H9 bookkeeping and regenerate derived files.

## Scope

- **SelectDialog** (WCR 2.28.2). Keep the field-only search, public search slot, text overrides, dialog focus and selection behavior. Finish the LTR and RTL content-tree comparison. Keep the pinned-shell guards and compare the inner modal, semantic regions, list selection and live announcements.
- **DynamicDateRange** (UI5 Web Components 2.28.1). Retain the passing closed trees, options and date-only editor pixel parity. Finish LTR and RTL comparisons for the open list and editors. Complete the date-time editor pixel matrix, including compact high-contrast white (worst recorded 12.06%), and the ar-EG localized fixture (2.57%). Retain the de-DE and zh-CN fixtures and complete the remaining localized matrix and editor stories.
- Install each component independently from its registry item in a fresh consumer, build and render it, and verify the owned behavior and extension points.

## Open-state tree review

1. About half the differences are form-associated UI5 hosts around Input, Button and CheckBox. Extend the existing guarded `ui5FormHosts` mechanism at the exact fixture paths and preserve each underlying control's accessible name, focusability, state and descendants.
2. UI5 places the heading in a generic wrapper and keeps the heading level on the inner node. Preserve the inner level and heading text during comparison.
3. Names such as “Navigate Back” and “Submit” sit on the inner button nodes in UI5. Compare the names on the controls that own them.
4. Trace the extra empty React `alert` in the static capture. Match the live-region lifecycle and keep the interaction and announcement assertions.

## Acceptance and budget

Follow AGENTS.md and the original H9 parity criteria for these two components. Run focused pixel, tree, axe and behavior checks, then Tier 2 and the installed-consumer proofs. Use `PORT=4370`, `STORYBOOK_PORT=4380` and `SAPUI5_PORT=4371`. Use two hypotheses per failing check, about two hours, and zero pushes. Record unresolved checks if the budget is reached. Close all task-owned servers and browsers.
