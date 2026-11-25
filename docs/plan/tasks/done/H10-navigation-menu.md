# H10 — NavigationMenu

**Goal:** deliver the standalone navigation menu from issue #1. H0, E4 and E5 are merged.

Compare the existing Menu link and submenu behavior, and the NavigationMenu behavior already ported inside
SideNavigation, to UI5 2.28 `@ui5/webcomponents-fiori/dist/NavigationMenu.js`, `NavigationMenuItem.js`, their
templates and generated themes. Both inherit from the main package's Menu implementation. Extend the existing
Menu additively if it can express the pinned behavior without changing its defaults. Otherwise deliver a thin
NavigationMenu item that reuses the existing primitives. Preserve SideNavigation's collapsed menu behavior.

## Scope

- Item links with `href` and `target`, activation and cancellation order, external indicators, icon/tag
  layout and hierarchical submenus. Match the pinned focus, keyboard, pointer and RTL behavior.
- The selected component's owned registry, style, fixture, demo, story and test files. If a separate item ships,
  register it in the required inventories under P4, add its usage routes and prove the item-only consumer install.
  Edit Menu and SideNavigation usage metadata as needed for routing. Shared imports or refactors must be justified
  by the port and covered by the affected component tests.

## Acceptance

Follow AGENTS.md, including the extension, accessibility and localization contracts. Pair link, nested, keyboard
and RTL behavior with the pinned reference. Cover the visual states, tree, axe, focus return and public link
behavior. Run the affected Menu and SideNavigation tests when implementation code is shared. Complete Tier 2
and record the reference paths and reasons for any exact comparison allowances.
