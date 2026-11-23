#!/usr/bin/env node
// Keep both reporters' full output on disk; only the result crosses the agent's context.
import { spawn } from "node:child_process"
import { constants } from "node:os"
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, createWriteStream } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { once } from "node:events"
import { reservePort } from "./free-port.mjs"

const args = process.argv.slice(2)
const storybook = args.some((arg) => /(?:^|[=/])playwright\.storybook\.config\.ts$/.test(arg))
const requests = [
  { name: storybook ? "STORYBOOK_PORT" : "PORT", explicit: process.env.PORT ?? (storybook ? process.env.STORYBOOK_PORT : undefined), base: storybook ? 4320 : 4310 },
  ...(storybook ? [] : [{ name: "SAPUI5_PORT", explicit: process.env.SAPUI5_PORT, base: 4311 }]),
]
const reservations = new Map()
try {
  for (const { name, explicit, base } of [...requests].sort((a, b) => Number(b.explicit !== undefined) - Number(a.explicit !== undefined))) {
    reservations.set(name, await reservePort(name, explicit, base))
  }
} catch (error) {
  reservations.forEach(({ release }) => release())
  console.error(error.message)
  process.exit(1)
}
process.once("exit", () => reservations.forEach(({ release }) => release()))
const [port, sapui5Port] = requests.map(({ name }) => reservations.get(name).port)
const ports = ` | ${storybook ? "STORYBOOK_PORT" : "PORT"}=${port}${sapui5Port === undefined ? "" : ` SAPUI5_PORT=${sapui5Port}`}`

const stamp = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`
// Give each invocation its own Playwright artifact folder so concurrent runs keep their evidence.
const temporary = mkdtempSync(join(tmpdir(), "petalo-test-summary-"))
const fullLog = join(temporary, "playwright.log")
const reportFile = join(temporary, "results.json")
const captureFolder = `a11y-capture-${stamp}`
const captureDirectory = join("test-results", captureFolder)
const output = args.some((arg) => arg === "--output" || arg.startsWith("--output=")) ? [] : ["--output", `test-results/playwright-${stamp}`]
const log = createWriteStream(fullLog)
const started = Date.now()
const child = spawn("pnpm", ["exec", "playwright", "test", ...args, ...output, "--reporter=list,json"], {
  env: {
    ...process.env,
    PORT: String(port),
    ...(sapui5Port === undefined ? {} : { SAPUI5_PORT: String(sapui5Port) }),
    PLAYWRIGHT_JSON_OUTPUT_FILE: reportFile,
    PETALO_TREE_REPORT_DIR: captureDirectory,
  },
  stdio: ["inherit", "pipe", "pipe"],
  detached: process.platform !== "win32",
})
child.stdout.pipe(log, { end: false })
child.stderr.pipe(log, { end: false })
let spawnError
child.on("error", (error) => { spawnError = error; log.write(`${error.message}\n`) })
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  if (process.platform === "win32" || !child.pid) {
    child.kill(signal)
    return
  }
  // Signal the Playwright process as well as pnpm so its server teardown
  // handlers run even when the package-manager wrapper exits first.
  try { process.kill(-child.pid, signal) } catch (error) { if (error.code !== "ESRCH") throw error }
})
const [code, signal] = await once(child, "close")
log.end()
await once(log, "finish")
mkdirSync("test-results", { recursive: true })
if (existsSync(join(captureDirectory, "a11y-tree-report.json"))) {
  const link = join("test-results", `a11y-latest-${stamp}`)
  symlinkSync(captureFolder, link)
  renameSync(link, "test-results/a11y-latest")
}
const logPath = `test-results/summary-${stamp}.log`
cpSync(fullLog, logPath)
const plain = (value) => String(value).replace(/\x1b\[[0-9;]*m/g, "")
const firstLine = (value) => plain(value).split(/\r?\n/).find((line) => line.trim())?.trim() ?? "Unknown error"
try {
  const report = JSON.parse(readFileSync(reportFile, "utf8"))
  const { expected = 0, unexpected = 0, flaky = 0, skipped = 0, duration = Date.now() - started } = report.stats
  console.log(`${expected} passed, ${unexpected} failed, ${flaky} flaky, ${skipped} skipped (${(duration / 1000).toFixed(1)}s) | Log: ${logPath}${ports}`)
  const failures = []
  function visit(suites, parents = []) {
    for (const suite of suites) {
      const titles = [...parents, suite.title].filter(Boolean)
      for (const spec of suite.specs ?? []) for (const test of spec.tests) {
        if (test.status !== "unexpected") continue
        const result = [...test.results].reverse().find((result) => result.error || result.errors?.length)
        const error = result?.error ?? result?.errors?.[0]
        failures.push(`${[...titles, spec.title, test.projectName].filter(Boolean).join(" › ")}: ${firstLine(error?.message ?? error?.value ?? "Test failed without an error message")}`)
      }
      visit(suite.suites ?? [], titles)
    }
  }
  visit(report.suites ?? [])
  for (const error of report.errors ?? []) failures.push(firstLine(error.message ?? error.value))
  failures.slice(0, 48).forEach((failure) => console.log(failure))
  if (failures.length > 48) console.log(`${failures.length - 48} more failures; see the full log.`)
} catch {
  console.log(`Playwright exited ${code ?? signal ?? 1} (${((Date.now() - started) / 1000).toFixed(1)}s) | Log: ${logPath}${ports}`)
  const lines = plain(readFileSync(fullLog, "utf8")).split(/\r?\n/)
  const error = spawnError?.message ?? lines.find((line) => /Error:|error:|ERR_/.test(line))
  if (error) console.log(firstLine(error))
}
rmSync(temporary, { recursive: true, force: true })
process.exitCode = code ?? (signal ? 128 + (constants.signals[signal] ?? 1) : 1)
