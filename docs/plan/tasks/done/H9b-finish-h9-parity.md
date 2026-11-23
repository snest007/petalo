# H9b — Finish H9 parity

Continue H9 in `.worktrees/H9` on `codex/H9`. H9 and H9b are reviewed and merge together once all four controls pass. Use local main as the integration base. Do not push or merge into main.

- **SelectDialog:** Compare with WCR 2.28.2. Compose the search field with Input and a decorative search icon inside SelectDialog. Preserve the search slot, text overrides, clear behavior, submit callbacks and focus. Use the existing Dialog fixture and tree comparison conventions for the native shell, focus boundaries and live region. Keep the shared Search unchanged.
- **DynamicDateRange:** Compare with UI5 Web Components 2.28.1. Reuse the exact form-associated Input host allowance for closed fixtures. Measure the native ResponsivePopover sections and list row heights, then compare the entire open surface and editor trees. Complete the localized fixtures and missing editor cases.
- **CalendarLegend:** Complete the pixel matrix for the existing Calendar fixtures with `VISUAL_ONLY=calendar`.
- **SplitterLayout:** Verify installation and rendering from its registry item. Also run installed-consumer proofs for SelectDialog and DynamicDateRange after Tier 2.

Edit the H9-owned component files, paired fixtures, demos, stories and tests as needed, and the shared test or inventory files required by existing parity conventions. Keep the stored ratchets intact. Retain the card's accessibility, localization and extension acceptance.

Use `PORT=4370`, `STORYBOOK_PORT=4380` and `SAPUI5_PORT=4371`. Run focused parity checks, `pnpm test:changed --repeat-each=2`, `pnpm test:smoke`, then the installed-consumer checks. Tick H9 and H9b together after acceptance. Budget two hypotheses per failing check, about two hours, and zero pushes. Record unresolved failures in `docs/plan/returns/H9.md` within that budget. Close all task-owned servers and browsers.
