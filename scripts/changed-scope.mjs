// Pure classification for `pnpm test:changed`; tests/test-changed-scope.spec.ts covers it.

/** Bookkeeping: no test or build reads these files. */
export const isBookkeeping = (file) => file === "docs/plan/README.md" || /^docs\/plan\/(?:tasks|returns|handoff)\//.test(file)

/** Shared inventories every new component registers in (AGENTS.md "Definition of done" → New components).
 * Editing them runs the inventory specs below instead of the full suite. The audit generators hold the
 * per-component verified/unrendered tables, and the inventory specs check their whole output. The tree
 * normalizer (`tests/a11y-tree-normalize.ts`) and the pack builder stay shared files. */
export const isInventory = (file) =>
  file === "README.md"
  || file === "tests/a11y-tree-baseline.ts"
  || file === "tests/i18n-audit-baseline.json"
  || file === "docs/plan/a11y-audit.md"
  || file === "docs/plan/i18n-audit.md"
  || file === "docs/src/fixtures/index.ts"
  || file === "scripts/a11y-audit.mjs"
  || file === "scripts/i18n-audit.mjs"
  || /^registry\/i18n\/[^/]+\.(?:json|ts)$/.test(file)
  || /^skills\/petalo\//.test(file)

/** The specs that read those inventories; a missing registration fails here within minutes. */
export const inventorySpecs = [
  "tests/a11y-tree.spec.ts",
  "tests/a11y-tree-audit.spec.ts",
  "tests/a11y-tree-customizations.spec.ts",
  "tests/i18n.spec.ts",
  "tests/usage-guidance.spec.ts",
]

/** AGENTS.md rule 3: all component-owned paths share the component's basename. */
export function ownedComponent(file) {
  const owned = file.match(/^registry\/(?:ui\/([^/]+)\.tsx|items\/([^/]+)\.json|styles\/components\/([^/]+)\.css)$/)
    ?? file.match(/^docs\/src\/(?:fixtures|demos)\/([^/]+)\.(?:tsx|ui5\.ts)$/)
    ?? file.match(/^docs\/stories\/[^/]+\/([^/]+)\.stories\.tsx$/)
  return owned?.slice(1).find(Boolean)
}

/**
 * @param {string[]} changed every changed path (committed against main, working tree, untracked)
 * @param {string[]} added paths that don't exist on main (new files)
 * @param {(path: string) => boolean} exists
 */
export function classifyChanges(changed, added, exists) {
  const files = changed.filter((file) => !isBookkeeping(file))
  const names = new Set(), specs = new Set(), storySpecs = new Set(), shared = [], inventory = []
  const newComponents = [...new Set(added.map((file) => file.match(/^registry\/(?:ui\/([^/]+)\.tsx|items\/([^/]+)\.json)$/)?.slice(1).find(Boolean)).filter(Boolean))].sort()
  for (const file of files) {
    const owner = ownedComponent(file)
    if (owner) names.add(owner)
    else if (isInventory(file)) inventory.push(file)
    else if (/^tests\/(?!visual)[^/]+\.spec\.ts$/.test(file)) {
      specs.add(file)
      const name = file.slice("tests/".length, -".spec.ts".length)
      if (exists(`registry/ui/${name}.tsx`)) names.add(name)
    }
    else if (/^tests-storybook\/[^/]+\.spec\.ts$/.test(file) && file !== "tests-storybook/storybook.spec.ts") storySpecs.add(file)
    else shared.push(file)
  }
  if (newComponents.length || inventory.length) for (const spec of inventorySpecs) specs.add(spec)
  return { bookkeepingOnly: files.length === 0, names, specs, storySpecs, shared, inventory, newComponents }
}
