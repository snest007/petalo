# H13 — UserSettingsDialog

Deliver UserSettingsDialog and its owned item/view composition, with a UserMenu example that opens it. H0, E4 and
E5 are merged. Use UI5 2.28 `@ui5/webcomponents-fiori/dist/UserSettingsDialog.js` and its companion
`UserSettingsItem`, `UserSettingsView`, account, appearance and notifications views, templates and styles as the
source of truth. Include the Fiori Assets import in the paired fixtures. Register the item in P4.

Match the reference navigation between settings, supplied view content, labels and announcements, keyboard and
focus behavior, and theme/density and RTL rendering. Use component-owned files, required shared inventories,
the minimal UserMenu integration and usage routes. Pair open surfaces in place. Verify tree, axe, owner routes,
interaction and a fresh item-only install under AGENTS.md Tier 2. If the native views exceed the card budget,
record the exact remaining view inventory in the return.

## File scope

- `user-settings-dialog` owns the implementation, styles, registry item, demo, paired fixtures and
  behavior tests. Shared fixture inputs and Storybook live in
  `docs/src/fixtures/user-settings-dialog.cases.ts` and
  `docs/stories/overlays/user-settings-dialog.stories.tsx`.
- The UserMenu entry touches `docs/src/demos/user-menu.tsx` and `registry/items/user-menu.json`.
  List's opt-in selection veto supports the dialog and Appearance view through
  `registry/ui/list.tsx` and `docs/stories/data/list.stories.tsx`.
- P4 ownership and generated documentation use `docs/plan/tasks/P4-parity-overlays.md`,
  `docs/extension-contract.md`, `docs/plan/i18n-audit.md`,
  `scripts/a11y-audit.mjs`, `scripts/i18n-audit.mjs`, `tests/i18n-audit-baseline.json`,
  regenerated locale packs and `skills/petalo/references/overlays.md`.
- The exact H13 comparison and its registrations touch `docs/src/fixture-types.ts`,
  `tests/a11y-tree-normalize.ts`, `tests/user-settings-dialog-a11y.ts`,
  `tests/a11y-tree.spec.ts`, `tests/a11y-tree-baseline.ts`,
  `tests/a11y-tree-baseline.json` and `tests/a11y-tree-customizations.spec.ts`.
- The archive holds this card and its [acceptance record](../../returns/done/H13.md).
