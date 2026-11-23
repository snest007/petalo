#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { ensureStorybookBuild, testSummary } from "./test-milestone.mjs"
import { classifyChanges } from "./changed-scope.mjs"

// Include tracked edits and new files for the inner loop before the first commit.
const changedFiles = [...new Set([
  ...execFileSync("git", ["diff", "--name-only", "-z", "main...HEAD"], { encoding: "utf8" }).split("\0"),
  ...execFileSync("git", ["diff", "--name-only", "-z", "HEAD"], { encoding: "utf8" }).split("\0"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0"),
].filter(Boolean))]
if (!changedFiles.length) {
  console.log("No changes compared with main.")
  process.exit(0)
}
// Classification lives in changed-scope.mjs so tests/test-changed-scope.spec.ts can cover it.
const added = execFileSync("git", ["diff", "--name-only", "--diff-filter=A", "-z", "main...HEAD"], { encoding: "utf8" }).split("\0")
  .concat(execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0"))
  .concat(execFileSync("git", ["diff", "--name-only", "--diff-filter=A", "-z", "HEAD"], { encoding: "utf8" }).split("\0"))
  .filter(Boolean)
const { bookkeepingOnly, names, specs, storySpecs, shared, inventory, newComponents } = classifyChanges(changedFiles, added, existsSync)
if (bookkeepingOnly) {
  console.log("bookkeeping only: no tests needed")
  process.exit(0)
}
if (shared.length) {
  shared.forEach((file) => console.error(`shared file changed: run the full suite (${file})`))
  process.exit(1)
}
if (newComponents.length) console.log(`New components: ${newComponents.join(", ")} — running the shared inventory specs (AGENTS.md "New components").`)
else if (inventory.length) console.log(`Inventory files changed (${inventory.join(", ")}) — running the shared inventory specs.`)
const visualSpecs = new Set()
const interactionSource = readFileSync("tests/visual-interaction.spec.ts", "utf8")
for (const name of names) {
  const spec = `tests/${name}.spec.ts`
  if (existsSync(spec)) specs.add(spec)
  else {
    console.log(`${name} has no own spec; running only its visual fixtures.`)
    // Absence of a behaviour spec must never request a full-suite fallback.
    // The visual guard reports a component with no comparable fixtures clearly.
    visualSpecs.add("tests/visual.spec.ts")
  }
  if (existsSync(`docs/src/fixtures/${name}.tsx`) && existsSync(`docs/src/fixtures/${name}.ui5.ts`)) visualSpecs.add("tests/visual.spec.ts")
  if (existsSync(`docs/src/fixtures-sapui5/${name}.tsx`)) visualSpecs.add("tests/visual-sapui5.spec.ts")
  if (existsSync(`docs/src/fixtures-phone/${name}.tsx`)) visualSpecs.add("tests/visual-phone.spec.ts")
  // Interaction CASES include literal ids and generated `<name>-` prefixes.
  if (interactionSource.includes(`"${name}-`) || interactionSource.includes(`"${name}"`)) visualSpecs.add("tests/visual-interaction.spec.ts")
}
const args = [...specs, ...visualSpecs]
if (!args.length && !storySpecs.size) {
  console.error("No affected specs or paired visual fixtures found: run the full suite.")
  process.exit(1)
}
const started = Date.now()
const filter = [...names].join(",")
const env = { VISUAL_ONLY: names.size ? filter : undefined, STORYBOOK_ONLY: undefined }
let ok = true
if (args.length) {
  console.log(`Affected main specs: ${args.join(", ")}${filter ? ` | VISUAL_ONLY=${filter}` : ""}`)
  ok = testSummary([...args, ...process.argv.slice(2)], { env }).ok
}
if (names.size || storySpecs.size) {
  if (!ensureStorybookBuild()) process.exit(1)
  const port = process.env.STORYBOOK_PORT ?? "4320"
  // Keep changed regression specs unfiltered; STORYBOOK_ONLY applies only to the generic loop.
  const selected = [...(names.size ? ["tests-storybook/storybook.spec.ts"] : []), ...storySpecs]
  console.log(`Affected Storybook specs: ${selected.join(", ")}${filter ? ` | STORYBOOK_ONLY=${filter}` : ""}`)
  const result = testSummary(["-c", "playwright.storybook.config.ts", ...selected, ...process.argv.slice(2)], {
    env: { ...env, PORT: port, STORYBOOK_ONLY: names.size ? filter : undefined },
  })
  ok &&= result.ok
}
console.log(`Changed verification ${ok ? "PASS" : "FAIL"} (${((Date.now() - started) / 1000).toFixed(1)}s) | Components: ${filter || "changed regression specs"}`)
process.exitCode = ok ? 0 : 1
