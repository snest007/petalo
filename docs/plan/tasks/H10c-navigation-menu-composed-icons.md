# H10c — Keep NavigationMenu icon alignment with composed items

Continue on `codex/H10` in `.worktrees/H10` after merging local main. H10 and H10b remain open on main
pending this follow-up. Keep the [review return](../returns/H10b.md) and the earlier H10 acceptance evidence.

## Review findings

The production Storybook Playground renders its root rows through `<Destinations />`.
`NavigationMenuSurface` decides whether to reserve icon space by inspecting immediate React child props.
It sees the wrapper and misses the icon on the rendered Home row. Workspace then starts 28 px earlier
than Home. The pinned UI5 root rows start at the same position. The existing paired fixture passes direct
items and misses this Storybook path. See the review return for the measurement and source paths.

## Scope

Change NavigationMenu-owned component, CSS and verification files. Make icon spacing depend on the actual
rows at that menu level. Preserve the submenu boundary, item roles and names, roving focus, and the
direction-specific insets from H10b.

## Acceptance

- Pair a production fixture with a composed set of mixed-icon rows and verify alignment in LTR and RTL.
  Exercise the existing Playground shape and confirm that icons inside a submenu do not reserve root icon space.
- Keep the 2% pixel threshold, the existing reference-tree checks, keyboard and hostile extension tests,
  localized phone checks and single-item installation. Complete Tier 2 and tick H10, H10b and H10c.
- Two hypotheses per failing check, about two hours, and zero pushes. Leave archive and integration to the reviewer.
