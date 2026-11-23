#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process"
import { copyFileSync, existsSync, globSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { ensureStorybookBuild, testSummary } from "./test-milestone.mjs"
import { auditFailure, classifyChanges, componentFixtureFiles, componentVisualSpecs, registrationOwnerProblems } from "./changed-scope.mjs"

async function readFixtureIds(files, temp) {
  if (!files.length) return []
  // The docs aliases let us import the real case arrays (including generated IDs)
  // in Node. Build only those modules and never render either side of the fixtures.
  const { build } = await import("vite")
  const { aliases } = await import("../vite.aliases.ts")
  const outDir = join(temp, "fixtures")
  const inputs = Object.fromEntries(files.map((file, index) => [`fixture-${index}`, file]))
  await build({
    configFile: false,
    logLevel: "silent",
    resolve: { alias: aliases },
    build: { ssr: true, outDir, rollupOptions: { input: inputs } },
  })
  const entries = await Promise.all(Object.entries(inputs).map(async ([entry, file]) => {
    const { default: set } = await import(pathToFileURL(join(outDir, `${entry}.js`)).href)
    return set.cases.map(({ id }) => ({ id, file }))
  }))
  return entries.flat()
}

function localizationProblems(temp) {
  const script = "scripts/i18n-audit.mjs"
  const sources = resolve("registry/ui")
  const auditSources = join(temp, "registry/ui")
  mkdirSync(dirname(auditSources))
  symlinkSync(sources, auditSources, "dir")
  const problems = []

  while (true) {
    const result = spawnSync(process.execPath, [resolve(script), "--json"], { cwd: temp, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 })
    const missing = result.stderr?.match(/^Error: Missing owning card for ([\w-]+)$/m)?.[1]
    if (!missing || !existsSync(join(auditSources, `${missing}.tsx`))) {
      const failure = auditFailure(script, result)
      if (failure) problems.push(failure)
      return problems
    }
    // The audit throws on its first missing owner. Exclude that input only
    // from the temporary audit directory to collect other missing owners.
    if (!problems.length) {
      unlinkSync(auditSources)
      mkdirSync(auditSources)
      for (const file of readdirSync(sources)) symlinkSync(join(sources, file), join(auditSources, file))
    }
    problems.push(`${missing}: no localization owner — add it to the wave P table in docs/plan/README.md or the WCR owner map in ${script}`)
    unlinkSync(join(auditSources, `${missing}.tsx`))
  }
}

async function registrationPreflight(components) {
  const problems = registrationOwnerProblems(components)
  const temp = mkdtempSync(join(tmpdir(), "petalo-registration-"))
  try {
    // i18n-audit --json also writes its Markdown and evidence. Give it copied
    // input inventories and keep both outputs out of the checkout.
    symlinkSync(resolve("node_modules"), join(temp, "node_modules"), "dir")
    for (const file of ["docs/plan/README.md", "docs/plan/i18n-audit.md", ".integration/E5-evidence/GAP-TRIAGE.md"]) {
      if (!existsSync(file)) continue
      const dest = join(temp, file)
      mkdirSync(dirname(dest), { recursive: true })
      copyFileSync(file, dest)
    }
    writeFileSync(join(temp, "package.json"), '{"type":"module"}\n')
    const fixtureFiles = components.flatMap(componentFixtureFiles).filter(existsSync)
    try {
      problems.push(...registrationOwnerProblems([], await readFixtureIds(fixtureFiles, temp)))
    } catch (error) {
      problems.push(`Could not read fixture IDs from ${fixtureFiles.join(", ")} — ${error.message}`)
    }
    problems.push(...localizationProblems(temp))
    const script = "scripts/a11y-audit.mjs"
    const result = spawnSync(process.execPath, [script, "--check-baseline"], { encoding: "utf8" })
    const missingA11yOwner = result.stderr?.match(/^Error: No P-card owner for component (\S+)$/m)?.[1]
    if (missingA11yOwner) {
      problems.push(...registrationOwnerProblems([missingA11yOwner]))
    } else {
      const failure = auditFailure(script, result)
      if (failure) problems.push(failure)
    }
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
  return [...new Set(problems)]
}

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
if (newComponents.length || inventory.length) {
  const problems = await registrationPreflight(newComponents)
  if (problems.length) {
    console.error(problems.join("\n"))
    process.exit(1)
  }
}
if (shared.length) {
  shared.forEach((file) => console.error(`shared file changed: run the full suite (${file})`))
  process.exit(1)
}
if (newComponents.length) console.log(`New components: ${newComponents.join(", ")} — running the shared inventory specs (AGENTS.md "New components").`)
else if (inventory.length) console.log(`Inventory files changed (${inventory.join(", ")}) — running the shared inventory specs.`)
const visualSpecs = new Set()
const visualNames = new Set()
const storyNames = new Set()
const storyFiles = new Set(globSync("docs/stories/*/*.stories.tsx").map((file) => file.split("/").at(-1)))
const interactionSource = readFileSync("tests/visual-interaction.spec.ts", "utf8")
for (const name of names) {
  const visuals = componentVisualSpecs(name, existsSync, interactionSource)
  if (visuals.length) visualNames.add(name)
  for (const visual of visuals) visualSpecs.add(visual)
  if (newComponents.includes(name) && !visuals.length) console.log(`${name}: no paired fixtures yet — visual comparison skipped`)
  if (storyFiles.has(`${name}.stories.tsx`)) storyNames.add(name)
  else if (newComponents.includes(name)) console.log(`${name}: no stories yet — Storybook skipped`)
  const spec = `tests/${name}.spec.ts`
  if (existsSync(spec)) specs.add(spec)
  else if (visuals.length) console.log(`${name} has no own spec; running its visual fixtures.`)
}
const args = [...specs, ...visualSpecs]
if (!args.length && !storyNames.size && !storySpecs.size) {
  console.error("No affected specs or paired visual fixtures found: run the full suite.")
  process.exit(1)
}
const started = Date.now()
const filter = [...names].join(",")
const visualFilter = [...visualNames].join(",")
const env = { VISUAL_ONLY: visualFilter || undefined, STORYBOOK_ONLY: undefined }
let ok = true
if (args.length) {
  console.log(`Affected main specs: ${args.join(", ")}${visualFilter ? ` | VISUAL_ONLY=${visualFilter}` : ""}`)
  ok = testSummary([...args, ...process.argv.slice(2)], { env }).ok
}
if (storyNames.size || storySpecs.size) {
  if (!ensureStorybookBuild()) process.exit(1)
  const port = process.env.STORYBOOK_PORT ?? "4320"
  // Keep changed regression specs unfiltered; STORYBOOK_ONLY applies only to the generic loop.
  const storyFilter = [...storyNames].join(",")
  const selected = [...(storyNames.size ? ["tests-storybook/storybook.spec.ts"] : []), ...storySpecs]
  console.log(`Affected Storybook specs: ${selected.join(", ")}${storyFilter ? ` | STORYBOOK_ONLY=${storyFilter}` : ""}`)
  const result = testSummary(["-c", "playwright.storybook.config.ts", ...selected, ...process.argv.slice(2)], {
    env: { ...env, PORT: port, STORYBOOK_ONLY: storyFilter || undefined },
  })
  ok &&= result.ok
}
console.log(`Changed verification ${ok ? "PASS" : "FAIL"} (${((Date.now() - started) / 1000).toFixed(1)}s) | Components: ${filter || "changed regression specs"}`)
process.exitCode = ok ? 0 : 1
