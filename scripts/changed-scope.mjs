// Classification and registration diagnostics for `pnpm test:changed`.
import { caseOwner, componentOwner } from "../tests/a11y-tree-baseline.ts"

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

/** The specs that read those inventories after the Node registration preflight. */
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

const fixturesDir = "docs/src/fixtures"
const phoneDir = "docs/src/fixtures-phone"
const sapui5Dir = "docs/src/fixtures-sapui5"

export function componentFixtureFiles(name) {
  return [`${fixturesDir}/${name}.tsx`, `${phoneDir}/${name}.tsx`, `${sapui5Dir}/${name}.tsx`]
}

/** Only select visual checks with a reference; independent interaction checks own their case list. */
export function componentVisualSpecs(name, exists, interactionSource) {
  const [web, phone, sapui5] = componentFixtureFiles(name)
  const specs = []
  if (exists(web) && exists(`${fixturesDir}/${name}.ui5.ts`)) specs.push("tests/visual.spec.ts")
  if (exists(web) && exists(`${fixturesDir}/${name}.wcr.tsx`)) specs.push("tests/visual-wcr.spec.ts")
  if (exists(phone) && exists(`${phoneDir}/${name}.ui5.ts`)) specs.push("tests/visual-phone.spec.ts")
  if (exists(sapui5)) specs.push("tests/visual-sapui5.spec.ts")
  if (interactionSource.includes(`"${name}-`) || interactionSource.includes(`"${name}"`)) specs.push("tests/visual-interaction.spec.ts")
  return specs
}

export function registrationOwnerProblems(components, fixtures = []) {
  const edit = "add it to groups in tests/a11y-tree-baseline.ts"
  const problems = []
  for (const name of components) {
    try { componentOwner(name) } catch {
      problems.push(`${name}: no P-card owner — ${edit}`)
    }
  }
  for (const { id, file } of fixtures) {
    try { caseOwner(id) } catch {
      problems.push(`${id} (${file}): no fixture P-card owner — ${edit} or fix the fixture ID prefix`)
    }
  }
  return problems
}

/** Keep the child process's diagnostic, without echoing its source snippet and stack. */
export function auditFailure(script, result) {
  if (result.status === 0 && !result.error) return undefined
  const diagnostic = result.stderr?.match(/^\w*Error: ([\s\S]*)/m)?.[1]
  const message = diagnostic?.split(/\n\s+at |\n\nNode\.js/, 1)[0].trim()
  return `${script}: ${result.error?.message ?? message ?? (result.stderr?.trim() || `exited with ${result.status ?? result.signal}`)}`
}
