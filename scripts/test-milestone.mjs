#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { checkExplicitPorts } from "./free-port.mjs"

// Shared by the three verification entry points so failures and flakes have the same meaning.
export function run(command, args, { env = {}, log } = {}) {
  const started = Date.now()
  const result = spawnSync(command, args, {
    encoding: "utf8", maxBuffer: 1 << 28, env: { ...process.env, ...env },
  })
  const output = (result.stdout ?? "") + (result.stderr ?? "")
  if (log) {
    mkdirSync(dirname(log), { recursive: true })
    writeFileSync(log, output)
  }
  const ok = result.status === 0 && !result.error
  if (!ok) console.error(`${command} ${args.join(" ")} failed${log ? ` | Log: ${log}` : ""}\n${result.error?.message ?? output.trim().split("\n").slice(-12).join("\n")}`)
  return { ok, output, duration: Date.now() - started }
}

export function ensureStorybookBuild({ force = false } = {}) {
  const index = "storybook-static/index.json"
  const built = existsSync(index) ? statSync(index).mtimeMs : -1
  function newer(path) {
    if (!existsSync(path)) return false
    const info = statSync(path)
    if (info.isDirectory()) return readdirSync(path).some((name) => newer(join(path, name)))
    return info.mtimeMs > built
  }
  if (!force && built >= 0 && !["docs/stories", ".storybook", "registry"].some(newer)) return true
  console.log(`Rebuilding storybook-static/: ${force ? "fresh milestone build" : "missing index or newer docs/stories, .storybook or registry source"}.`)
  const result = run("pnpm", ["storybook:build"], { log: ".integration/storybook-build.log" })
  if (result.ok) console.log(`Storybook build passed (${(result.duration / 1000).toFixed(1)}s).`)
  return result.ok
}

export function testSummary(args, { env = {}, log } = {}) {
  const result = run("pnpm", ["test:summary", ...args], { env, log })
  const summary = result.output.match(/^(\d+) passed, (\d+) failed, (\d+) flaky, (\d+) skipped \(([\d.]+)s\) \| Log: (\S+)(?: \| .+)?$/m)
  // Fail closed on collection/server failures (no result), and on a retry which passed.
  result.ok &&= !!summary && Number(summary[2]) === 0 && Number(summary[3]) === 0
  result.summary = summary?.[0] ?? "No test summary produced; see the log."
  result.log = summary?.[6]
  console.log(result.summary)
  if (!result.ok && summary) {
    console.error(result.output.slice(result.output.indexOf(summary[0]) + summary[0].length).trim().split("\n").slice(0, 12).join("\n"))
  }
  return result
}

function slowest(log) {
  const totals = new Map()
  const plain = readFileSync(log, "utf8").replace(/\x1b\[[0-9;]*m/g, "")
  for (const line of plain.split("\n")) {
    // Unnamed Playwright projects have no leading `›`; named projects prepend `[project] ›`.
    const test = line.match(/\b((?:tests|tests-storybook)\/[^:]+\.spec\.ts):\d+:\d+ › .*\(([\d.]+)(ms|s|m)\)\s*$/)
    if (!test) continue
    const ms = Number(test[2]) * ({ ms: 1, s: 1000, m: 60000 }[test[3]])
    totals.set(test[1], (totals.get(test[1]) ?? 0) + ms)
  }
  return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 10)
}

export async function milestone(args = process.argv.slice(2)) {
  const runsArgs = args.filter((arg) => arg.startsWith("--runs="))
  const workerArgs = args.filter((arg) => arg.startsWith("--workers="))
  const runs = runsArgs[0]?.slice(7) ?? "1"
  const workers = workerArgs[0]?.slice(10)
  if (runsArgs.length > 1 || !["1", "2"].includes(runs) || workerArgs.length > 1
    || (workers !== undefined && (!/^[1-9]\d*$/.test(workers) || !Number.isSafeInteger(Number(workers))))
    || args.some((arg) => !arg.startsWith("--runs=") && !arg.startsWith("--workers="))) {
    console.error("Usage: pnpm test:milestone [--runs=1|2] [--workers=<positive integer>]")
    return false
  }
  if (!await checkExplicitPorts(process.env, ["PORT", "SAPUI5_PORT", "STORYBOOK_PORT"])) return false
  const started = Date.now()
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  const out = `.integration/milestone-${date}`
  mkdirSync(out, { recursive: true })
  const env = { ...process.env }
  // Undefined removes inherited filters from spawnSync's merged environment too.
  env.VISUAL_ONLY = undefined
  env.STORYBOOK_ONLY = undefined
  const steps = []
  const suites = []
  let ok = true
  for (const name of ["generate", "typecheck", "registry:build"]) {
    const result = run("pnpm", [name], { env, log: `${out}/${name.replace(":", "-")}.log` })
    steps.push(`- ${name}: ${result.ok ? "PASS" : "FAIL"} (${(result.duration / 1000).toFixed(1)}s)`)
    console.log(steps.at(-1))
    if (!result.ok) { ok = false; break }
  }
  const testArgs = ["--retries=0", ...(workers ? [`--workers=${workers}`] : [])]
  if (ok) {
    ok = ensureStorybookBuild({ force: true })
    steps.push(`- fresh Storybook build: ${ok ? "PASS" : "FAIL"} | Log: .integration/storybook-build.log`)
  }
  if (ok) for (let i = 1; i <= Number(runs); i++) {
    // Always collect both suites' evidence for this round, even if main fails.
    for (const [name, config, port] of [["main", [], env.PORT], ["Storybook", ["-c", "playwright.storybook.config.ts"], undefined]]) {
      console.log(`Milestone ${name} run ${i}/${runs}.`)
      const result = testSummary([...config, ...testArgs], { env: { ...env, PORT: port }, log: `${out}/${name.toLowerCase()}-${i}.log` })
      const timings = result.log && existsSync(result.log) ? slowest(result.log) : []
      // Missing timing evidence is a report failure, not a silently empty top-ten table.
      if (result.ok && !timings.length) result.ok = false
      suites.push({ name, run: i, ...result, timings })
      ok &&= result.ok
    }
    if (!ok) break
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  const report = [
    `# Milestone verification — ${date}`, "", `Result: **${ok ? "PASS" : "FAIL"}** | Total: ${elapsed}s | Required runs per suite: ${runs}`,
    `Workers: ${workers ?? "configured default"}; retries: 0; filters: unset.`, "", "## Build checks", "", ...steps,
    ...suites.flatMap((suite) => ["", `## ${suite.name} run ${suite.run}`, "", suite.summary,
      `Command duration (including build/server startup): ${(suite.duration / 1000).toFixed(1)}s.`, "",
      "Ten slowest spec files, ranked by cumulative test duration (parallel tests overlap):", "",
      "| Spec | Test time |", "|---|---:|",
      ...suite.timings.map(([file, ms]) => `| ${file} | ${(ms / 1000).toFixed(1)}s |`),
      ...(!suite.timings.length ? ["Timing data unavailable; see the run log."] : []),
    ]), "",
  ].join("\n")
  writeFileSync(`${out}/REPORT.md`, report)
  console.log(`Milestone ${ok ? "PASS" : "FAIL"} (${elapsed}s) | Report: ${out}/REPORT.md`)
  return ok
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) process.exitCode = await milestone() ? 0 : 1
