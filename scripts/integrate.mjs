#!/usr/bin/env node
// Integration of finished task-card branches (codex/<card-id>…) into main.
// Used by an agent following docs/plan/INTEGRATION.md. Every command prints a short summary and
// writes details to .integration/; `verify` also writes REPORT.md (paste that back).
//
//   node scripts/integrate.mjs prepare <card-id…>     create .worktrees/<id> on branch codex/<id> from main, install, generate;
//                                                     prints the worktree path
//   node scripts/integrate.mjs status                 list codex/* branches, worktrees, merge state
//   node scripts/integrate.mjs scope [branch…]        files each branch changes vs. what its card allows
//   node scripts/integrate.mjs merge [branch…]        scope check, then merge --no-ff in the given order
//   node scripts/integrate.mjs verify [--runs=1|2] [--workers=<positive integer>]
//                                                     install, milestone (both suites, default one run), smoke install, recorded usage output build
//   node scripts/integrate.mjs cleanup [branch…]      remove merged branches and their (clean) worktrees
//
// Branches default to every local codex/* branch not yet merged into main (cleanup: merged ones).
// Test runners select their own ports at invocation.
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs"
import { join } from "node:path"
import { checkExplicitPorts } from "./free-port.mjs"

// Not under test-results/: Playwright empties that folder at the start of every run.
const OUT = ".integration"
mkdirSync(OUT, { recursive: true })

function sh(cmd, { allowFail = false, quiet = true, env = {}, log } = {}) {
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", maxBuffer: 1 << 28, env: { ...process.env, ...env } })
  const out = (r.stdout ?? "") + (r.stderr ?? "")
  if (log) writeFileSync(join(OUT, log), out)
  if (!quiet) process.stdout.write(out)
  if (r.status !== 0 && !allowFail) {
    console.error(`\n✖ ${cmd}\n${out.split("\n").slice(-40).join("\n")}`)
    process.exit(1)
  }
  return { ok: r.status === 0, out: out.trim() }
}
const git = (args, opts) => sh(`git ${args}`, opts).out

function requireCleanMain() {
  if (git("rev-parse --abbrev-ref HEAD") !== "main") fail("Check out main in this checkout first (git switch main).")
  if (git("status --porcelain")) fail("main has uncommitted changes. Commit or remove them first; don't integrate on a dirty tree.")
}
function fail(msg) {
  console.error(`✖ ${msg}`)
  process.exit(1)
}

function codexBranches() {
  return git("for-each-ref --format='%(refname:short)' refs/heads/codex/").split("\n").filter(Boolean)
}
// "Merged" = main contains a merge commit whose second parent is the branch tip (we always merge --no-ff).
// A freshly prepared branch with no commits of its own is therefore never "merged", even after main moves on.
const isMerged = (b) => {
  const tip = git(`rev-parse ${b}`)
  return git("log main --merges --format=%P").split("\n").some((line) => line.split(" ").slice(1).includes(tip))
}
function worktrees() {
  const map = new Map()
  let path
  for (const line of git("worktree list --porcelain").split("\n")) {
    if (line.startsWith("worktree ")) path = line.slice(9)
    if (line.startsWith("branch refs/heads/")) map.set(line.slice(18), path)
  }
  return map
}

function cardFor(branch) {
  const id = branch.match(/^codex\/([A-Z]\d+[a-z]?)/)?.[1]
  if (!id) return null
  // Open cards live in docs/plan/tasks/, finished ones in docs/plan/tasks/done/ (scripts/plan-check.mjs).
  for (const dir of ["docs/plan/tasks", "docs/plan/tasks/done"]) {
    const file = existsSync(dir) && readdirSync(dir).find((f) => f.startsWith(`${id}-`) && f.endsWith(".md"))
    if (file) return { id, path: `${dir}/${file}`, text: readFileSync(`${dir}/${file}`, "utf8") }
  }
  return { id, path: null, text: "" }
}

// Files a component owns (AGENTS.md rule 3); a file here is fine when its component is named in the card.
const OWNED = [
  /^registry\/ui\/([^/]+)\.tsx$/, /^registry\/items\/([^/]+)\.json$/, /^registry\/styles\/components\/([^/]+)\.css$/,
  /^registry\/blocks\/([^/]+)\.tsx$/, /^registry\/block-items\/([^/]+)\.json$/,
  /^docs\/src\/fixtures(?:-sapui5)?\/([^/.]+)(?:\.ui5)?\.tsx?$/, /^docs\/src\/demos\/([^/]+)\.tsx$/,
  /^tests\/((?!visual|a11y)[^/]+)\.spec\.ts$/, /^sapui5\/(?:webapp\/)?fixtures\/([^/]+)\.js$/, /^sapui5\/webapp\/([^/]+)\.js$/,
]
const ALWAYS_OK = new Set(["docs/plan/README.md"])

function scopeOf(branch) {
  const card = cardFor(branch)
  const files = git(`diff --name-only main...${branch}`).split("\n").filter(Boolean)
  const messages = git(`log main..${branch} --format=%B`)
  const rows = files.map((file) => {
    if (ALWAYS_OK.has(file)) return { file, verdict: "ok", why: "backlog checkbox" }
    if (card?.text.includes(file)) return { file, verdict: "ok", why: "listed in card" }
    const owner = OWNED.map((re) => file.match(re)?.[1]).find(Boolean)
    // The card must name the component as a file/path ("registry/ui/<owner>.tsx", "<owner>.css",
    // "tests/<owner>.spec.ts", "`<owner>`"), not just use the word in prose ("…opens a button").
    const named = owner && new RegExp(`(^|[\\s\`/(])${owner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\.(tsx?|css|json|js|spec\\.ts|ui5\\.ts)|\`|/)`, "m").test(card?.text ?? "")
    if (named) return { file, verdict: "ok", why: `owned by ${owner}` }
    const base = file.split("/").pop()
    if (messages.includes(file) || messages.includes(base)) return { file, verdict: "called-out", why: "named in a commit message" }
    return { file, verdict: "UNLISTED", why: owner ? `component "${owner}" not in card` : "shared file not in card" }
  })
  return { branch, card, files, rows, commits: git(`log --oneline main..${branch}`).split("\n").filter(Boolean) }
}

function printScope(s) {
  const bad = s.rows.filter((r) => r.verdict === "UNLISTED")
  const called = s.rows.filter((r) => r.verdict === "called-out")
  console.log(`\n${s.branch}  card: ${s.card?.path ?? "NOT FOUND"}  commits: ${s.commits.length}  files: ${s.files.length}`)
  for (const r of [...bad, ...called]) console.log(`  ${r.verdict.padEnd(10)} ${r.file}  (${r.why})`)
  if (!bad.length && !called.length) console.log("  all files within the card's scope")
  return { bad: bad.length, called: called.length }
}

function pending(args) {
  const named = args.filter((a) => !a.startsWith("--"))
  return named.length ? named : codexBranches().filter((b) => !isMerged(b))
}

const [cmd = "status", ...args] = process.argv.slice(2)

if (cmd === "prepare") {
  requireCleanMain()
  const ids = args.filter((a) => !a.startsWith("--"))
  if (!ids.length) fail("prepare needs card ids, e.g. prepare F3 A1")
  const taken = new Set([...worktrees().values()])
  ids.forEach((id) => {
    const card = readdirSync("docs/plan/tasks").find((f) => f.startsWith(`${id}-`))
    if (!card) fail(`No card docs/plan/tasks/${id}-*.md`)
    const branch = `codex/${id}`
    const path = join(process.cwd(), ".worktrees", id)
    if (codexBranches().includes(branch) || taken.has(path)) fail(`${branch} or ${path} already exists — finish or clean it up first`)
    sh(`git worktree add -b ${branch} "${path}" main`)
    sh(`cd "${path}" && pnpm install --frozen-lockfile --prefer-offline && pnpm generate`, { log: `prepare-${id}.log` })
    console.log(JSON.stringify({ card: `docs/plan/tasks/${card}`, branch, path }))
  })
} else if (cmd === "status") {
  const wt = worktrees()
  console.log(`main ${git("rev-parse --short main")}  checkout: ${git("rev-parse --abbrev-ref HEAD")}  dirty: ${git("status --porcelain") ? "YES" : "no"}`)
  for (const b of codexBranches()) {
    const path = wt.get(b)
    const dirty = path && existsSync(path) ? (git(`-C "${path}" status --porcelain`) ? "dirty" : "clean") : "-"
    console.log(`  ${b.padEnd(40)} ${isMerged(b) ? "merged  " : "PENDING "} worktree: ${path ?? "-"} (${dirty})`)
  }
  const others = git("for-each-ref --format='%(refname:short)' refs/heads/").split("\n").filter((b) => b && b !== "main" && !b.startsWith("codex/"))
  if (others.length) console.log(`  other branches (not handled by this script): ${others.join(", ")}`)
} else if (cmd === "scope") {
  let bad = 0
  for (const b of pending(args)) bad += printScope(scopeOf(b)).bad
  process.exit(bad ? 3 : 0)
} else if (cmd === "merge") {
  requireCleanMain()
  const branches = pending(args)
  if (!branches.length) fail("No unmerged codex/* branches.")
  const before = git("rev-parse --short main")
  if (!existsSync(join(OUT, "main-before.txt"))) writeFileSync(join(OUT, "main-before.txt"), before + "\n")
  console.log(`main before merging: ${before} (rollback: git reset --hard ${before})`)
  const scopes = branches.map(scopeOf)
  const bad = scopes.reduce((n, s) => n + printScope(s).bad, 0)
  if (bad && !args.includes("--accept-scope")) {
    console.error(`\n✖ ${bad} file(s) outside their card's scope. Review them; if they are justified, re-run with --accept-scope and explain each in REPORT.md.`)
    process.exit(3)
  }
  for (const s of scopes) {
    if (isMerged(s.branch)) continue
    const title = s.card?.text.match(/^#\s+(.+)$/m)?.[1] ?? s.branch
    const r = sh(`git merge --no-ff ${s.branch} -m "Merge ${s.branch}: ${title.replace(/"/g, "'")}"`, { allowFail: true })
    if (!r.ok) {
      const conflicts = git("diff --name-only --diff-filter=U", { allowFail: true })
      console.error(`\n✖ Conflict merging ${s.branch}:\n${conflicts.split("\n").map((f) => "  " + f).join("\n")}`)
      console.error("Resolve (INTEGRATION.md §Conflicts), `git add` them, `git commit --no-edit`, then re-run `merge` for the rest.")
      process.exit(2)
    }
    console.log(`✔ merged ${s.branch}`)
  }
  appendFileSync(join(OUT, "merged.txt"), branches.join("\n") + "\n")
} else if (cmd === "verify") {
  const workerArgs = args.filter((a) => a === "--workers" || a.startsWith("--workers="))
  const workers = workerArgs[0]?.slice("--workers=".length)
  if (workerArgs.length > 1 || (workerArgs.length && (!/^[1-9]\d*$/.test(workers) || !Number.isSafeInteger(Number(workers))))) {
    fail("verify --workers must be a positive integer, e.g. --workers=1.")
  }
  requireCleanMain()
  const runs = args.find((a) => a.startsWith("--runs="))?.slice(7) ?? "1"
  if (!["1", "2"].includes(runs) || args.filter((a) => a.startsWith("--runs=")).length > 1
    || args.some((a) => !a.startsWith("--runs=") && !a.startsWith("--workers="))) {
    fail("verify accepts --runs=1|2 (default 1) and --workers=<positive integer>.")
  }
  if (!await checkExplicitPorts(process.env, ["PORT", "SAPUI5_PORT", "STORYBOOK_PORT"])) process.exit(1)
  const install = sh("pnpm install --frozen-lockfile", { allowFail: true, log: "install.log" })
  // The milestone entry point owns fresh builds, both full suites, compact summaries and timings.
  const milestone = install.ok ? sh(`pnpm test:milestone --runs=${runs}${workers ? ` --workers=${workers}` : ""}`, {
    allowFail: true, log: "milestone.log",
  }) : { ok: false, out: "skipped (install failed)" }
  let smoke = { ok: false, out: "skipped (earlier step failed)" }
  let usageBuild = { ok: false, out: "skipped (earlier step failed)" }
  if (milestone.ok) smoke = sh("node scripts/smoke-install.mjs", { allowFail: true, log: "smoke.log" })
  if (smoke.ok) usageBuild = sh("node scripts/eval-skill-build.mjs", { allowFail: true, log: "eval-build.log" })
  // Preserve installed-consumer and recorded-page evidence at integration milestones.
  const ok = install.ok && milestone.ok && smoke.ok && usageBuild.ok
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  const report = [
    `# Integration report — ${date}`, "",
    `main: ${git("rev-parse --short main")} — ${git("log -1 --format=%s main")}`,
    `Result: **${ok ? "PASS" : "FAIL"}**`, "",
    `main before merging: ${existsSync(join(OUT, "main-before.txt")) ? readFileSync(join(OUT, "main-before.txt"), "utf8").trim() : "(unknown)"}`,
    "", "## Branches merged in this integration", "",
    existsSync(join(OUT, "merged.txt")) ? readFileSync(join(OUT, "merged.txt"), "utf8").trim().split("\n").map((b) => `- ${b}`).join("\n") : "- (none recorded)",
    "", "## Verification", "",
    `- install: ${install.ok ? "PASS" : "FAIL"} | Log: .integration/install.log`,
    milestone.out,
    `- Milestone details and ten slowest specs per suite: [REPORT.md](milestone-${date}/REPORT.md)`,
    `- installed consumer: ${smoke.ok ? "PASS" : "FAIL"} | Log: .integration/smoke.log`,
    `- recorded usage outputs: ${usageBuild.ok ? "PASS" : "FAIL"} | Log: .integration/eval-build.log`,
    "", "## Notes from the integrating agent", "",
    "(fill in: conflicts resolved, fixes made with file list and reason, anything needing the owner's decision)", "",
  ].join("\n")
  writeFileSync(join(OUT, "REPORT.md"), report)
  console.log(report)
  process.exit(ok ? 0 : 1)
} else if (cmd === "cleanup") {
  requireCleanMain()
  const named = args.filter((a) => !a.startsWith("--"))
  const branches = named.length ? named : codexBranches().filter(isMerged)
  const wt = worktrees()
  for (const b of branches) {
    if (!isMerged(b)) {
      console.log(`- skip ${b}: not merged into main`)
      continue
    }
    const path = wt.get(b)
    if (path && path !== process.cwd()) {
      if (existsSync(path) && git(`-C "${path}" status --porcelain`)) {
        console.log(`- skip ${b}: worktree ${path} has uncommitted changes (report them, don't delete)`)
        continue
      }
      sh(`git worktree remove "${path}"`)
    }
    sh(`git branch -d ${b}`)
    console.log(`✔ removed ${b}${path ? ` and worktree ${path}` : ""}`)
  }
  sh("git worktree prune")
  // The integration is finished: next one starts with a fresh record.
  for (const f of ["merged.txt", "main-before.txt"]) if (existsSync(join(OUT, f))) rmSync(join(OUT, f))
} else {
  fail(`Unknown command "${cmd}". See the header of scripts/integrate.mjs.`)
}
