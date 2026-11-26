# H13c — Notification settings views

Start from local `main` after H13 and H13b merge. Use `.worktrees/H13c` on
`codex/H13c`. Extend the existing `@petalo/user-settings-dialog` item.

Use the installed UI5 2.28.1 `UserSettingsNotificationsView`,
`UserSettingsNotificationsViewGroup`, `UserSettingsNotificationsViewItem`
and `UserSettingsItem` implementations and their templates and generated
styles. Follow the existing UserSettingsDialog content and page APIs.

## Scope

- Add the primary and secondary views, the additional content slot, header
  form rows, grouped and ungrouped list rows, and distinct primary and
  secondary accessible list names.
- Render title, byline, checked switch or custom end content, and the
  navigation affordance. Match row Space, switch activation, item-click veto
  and propagation boundaries. Keep the consumer in control of persistence.
- Route a navigable item to its sibling secondary view by item key, with the
  native first-secondary fallback and title. Move focus to its first control.
  Back restores focus to the row that opened it and retains current switches.
- Use the component-owned files and P4 inventories for slots, text and
  installed dependency registration. Update the item dependencies for
  redistributable controls used by the views.

## Acceptance

- Pair primary, grouped/switch, header/custom-end and secondary states in the
  existing UI5 fixture grid. Verify pixels in all four themes, both densities
  and RTL at the existing limits.
- Check keyboard, axe and AX tree in LTR/RTL. Cover distinct list and switch
  names, row and switch key behavior, veto, fallback, focus and state after
  Back, and hostile custom end content. Verify the native list-name keys in
  German, Simplified Chinese and Arabic.
- Rebuild the registry, pass Tier 2, and prove the composition in a fresh
  consumer that installs only `@petalo/user-settings-dialog` and its dependencies.
