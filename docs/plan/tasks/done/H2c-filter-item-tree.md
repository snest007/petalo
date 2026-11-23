# H2c — Match the AnalyticalTable filter-item tree

Continue on `codex/H2` in `.worktrees/H2`. Scope is the open sort/filter menu and the remaining acceptance for H2 and H2b. See the [H2 return](../../returns/done/H2.md).

- Compare the computed layout of the filter wrappers in the settled fixture, the matching probe, and WCR's `.ui5-li-content` and FlexBox. Match the grouping of the Filter label and editor in the WCR accessibility tree in LTR and RTL.
- Keep the existing pixel tolerance and passing behavior and axe checks. Add no accessibility-tree allowances or baseline entries.
- Merge local main, run `pnpm generate && pnpm registry:build` and typecheck, then run the focused AnalyticalTable, WCR tree and WCR visual specs. Run full main and Storybook once each via `pnpm test:summary` for tier 2, then verify the fresh installed consumer with `.integration/H2-consumer.mjs`.
- Use `PORT=4330` and `STORYBOOK_PORT=4340`. Allow two fix hypotheses, about 45 minutes and zero pushes. Close task servers and browsers. Tick H2, H2b and H2c only after acceptance passes. Record any remaining failure in the return note.
