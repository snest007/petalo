# H9d — Match SplitterLayout automatic pane sizing

Continue on `codex/H9` in `.worktrees/H9` after E11. Merge local main first. Keep its H9c and H9e scopes and
leave H9 and H9b open during verification. Budget is two hypotheses per failing check, about one hour, and zero
pushes. See the [H9 return](../../returns/done/H9.md) for the owner split and previous checks.

## Review findings

1. The four existing WCR visual cases give all but one pane an explicit size. In a 500 px layout with two
   automatic panes containing 20 px and 180 px wide content, the reviewer measured petalo widths of 242 px and
   242 px and WCR widths of 162 px and 322 px. Both separators were 16 px. The separator is 80 px from its
   reference position.
2. `registry/ui/splitter-layout.tsx` gives automatic panes `flex: 1 1 0px`. WCR 2.28.2
   `SplitterElement/index.js` starts with `flex: 1 0 min-content` and holds the measured extent after a
   `ResizeObserver` notification. Compare both the settled position and behavior after resizing, preserving
   explicit and controlled sizes, minimum sizes, keyboard steps and RTL.
3. The owner split removed the existing `SelectDialog` entry from `wcrComponents` in `scripts/i18n-audit.mjs`
   and dropped five still-published `wcr:` keys from the locale packs. Preserve the existing main SelectDialog
   mapping alongside the Splitter registration and regenerate the audits and packs.
4. The branch's full main run recorded a 30-second timeout in the Morning Horizon all-components axe check.
   Its two isolated repeats passed on H9, and 12 repeats passed on clean main with retries disabled.
   The full main result still contains one flake.

## Acceptance

- A paired fixture with two differently sized automatic panes matches WCR, including RTL. Exercise resize
  bounds and focus from that initial position. Keep existing SplitterLayout and CalendarLegend coverage green.
- Regenerate, typecheck, build the registry, and rerun the SplitterLayout installed-consumer check and tier 2
  with zero failed and zero flaky. Use the shared-file fallback when indicated. Tick H9, H9b and H9d together.
