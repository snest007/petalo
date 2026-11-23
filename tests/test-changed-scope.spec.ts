import { expect, test } from "@playwright/test"
import { auditFailure, classifyChanges, componentVisualSpecs, inventorySpecs, registrationOwnerProblems } from "../scripts/changed-scope.mjs"

const exists = (path: string) => ["registry/ui/button.tsx", "registry/ui/input.tsx"].includes(path)

test("test:changed: a new component runs the shared inventory specs without a full-suite fallback", () => {
  const files = ["registry/ui/new-widget.tsx", "registry/items/new-widget.json", "docs/src/fixtures/new-widget.tsx",
    "docs/src/fixtures/index.ts", "tests/a11y-tree-baseline.ts", "tests/i18n-audit-baseline.json",
    "docs/plan/a11y-audit.md", "docs/plan/i18n-audit.md", "registry/i18n/de.json", "registry/i18n/de.ts",
    "skills/petalo/references/forms.md", "scripts/i18n-audit.mjs", "README.md", "docs/plan/returns/H1.md"]
  const result = classifyChanges(files, files.slice(0, 3), exists)
  expect(result.shared).toEqual([])
  expect(result.newComponents).toEqual(["new-widget"])
  expect([...result.names]).toEqual(["new-widget"])
  for (const spec of inventorySpecs) expect(result.specs.has(spec), spec).toBe(true)
})

test("test:changed: inventory edits alone run the inventory specs; an existing component edit does not", () => {
  const inventoryOnly = classifyChanges(["tests/a11y-tree-baseline.ts"], [], exists)
  expect(inventoryOnly.shared).toEqual([])
  expect(inventoryOnly.inventory).toEqual(["tests/a11y-tree-baseline.ts"])
  expect([...inventoryOnly.specs].sort()).toEqual([...inventorySpecs].sort())

  const edit = classifyChanges(["registry/ui/input.tsx"], [], exists)
  expect(edit.newComponents).toEqual([])
  expect([...edit.names]).toEqual(["input"])
  expect(inventorySpecs.some((spec: string) => edit.specs.has(spec))).toBe(false)
})

test("test:changed: shared files and bookkeeping keep their existing behaviour", () => {
  expect(classifyChanges(["tests/a11y-tree-normalize.ts"], [], exists).shared).toEqual(["tests/a11y-tree-normalize.ts"])
  expect(classifyChanges(["scripts/build-i18n-packs.mjs"], [], exists).shared).toEqual(["scripts/build-i18n-packs.mjs"])
  expect(classifyChanges([".storybook/preview.tsx"], [], exists).shared).toEqual([".storybook/preview.tsx"])
  expect(classifyChanges(["docs/plan/README.md", "docs/plan/tasks/H1.md"], [], exists).bookkeepingOnly).toBe(true)
  // A new test helper or a new stylesheet outside a component is still shared.
  expect(classifyChanges(["registry/lib/new-util.ts"], ["registry/lib/new-util.ts"], exists).shared).toEqual(["registry/lib/new-util.ts"])
})

test("test:changed: preflight names the owner inventory for an unregistered component and fixture", () => {
  const file = "docs/src/fixtures/new-widget.tsx"
  expect(registrationOwnerProblems(["new-widget"], [{ id: "new-widget-default", file }])).toEqual([
    "new-widget: no P-card owner — add it to groups in tests/a11y-tree-baseline.ts",
    "new-widget-default (docs/src/fixtures/new-widget.tsx): no fixture P-card owner — add it to groups in tests/a11y-tree-baseline.ts or fix the fixture ID prefix",
  ])
  expect(registrationOwnerProblems(["button"], [{ id: "unknown-default", file }])).toHaveLength(1)
})

test("test:changed: registered component and fixture owners pass preflight", () => {
  expect(registrationOwnerProblems(["button"], [
    { id: "button-default", file: "docs/src/fixtures/button.tsx" },
    { id: "sapui5-button-default", file: "docs/src/fixtures-sapui5/sapui5-button.tsx" },
  ])).toEqual([])
})

test("test:changed: an absent or unpaired new fixture does not select the visual spec", () => {
  const fixture = "docs/src/fixtures/new-widget.tsx"
  const reference = "docs/src/fixtures/new-widget.ui5.ts"
  expect(componentVisualSpecs("new-widget", exists, "")).toEqual([])
  expect(componentVisualSpecs("new-widget", (path) => path === fixture, "")).toEqual([])
  expect(componentVisualSpecs("new-widget", (path) => [fixture, reference].includes(path), "")).toEqual(["tests/visual.spec.ts"])
})

test("test:changed: failed audit diagnostics omit the child process stack", () => {
  const result = {
    pid: 1, output: [], status: 1, signal: null, stdout: "",
    stderr: "throw new Error(...)\n\nError: Accessibility audit ratchet increased:\nbutton.gap: 1 > 0\n    at file:///audit.mjs:1\n\nNode.js v24\n",
  }
  expect(auditFailure("scripts/a11y-audit.mjs", result)).toBe("scripts/a11y-audit.mjs: Accessibility audit ratchet increased:\nbutton.gap: 1 > 0")
})

test("free ports skip an existing server and explain an explicit busy port", async () => {
  const { createServer } = await import("node:net")
  const { reservePort } = await import("../scripts/free-port.mjs")
  const server = createServer()
  await new Promise<void>((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Missing TCP address")
  try {
    const reservation = await reservePort("PORT", undefined, address.port)
    try {
      expect(reservation.port).toBeGreaterThan(address.port)
      const competing = await reservePort("PORT", undefined, reservation.port)
      try { expect(competing.port).toBeGreaterThan(reservation.port) } finally { competing.release() }
    } finally { reservation.release() }
    await expect(reservePort("PORT", String(address.port), 4310)).rejects.toThrow(
      new RegExp(`PORT=${address.port} is busy\\.[\\s\\S]*(?:node\\s+${process.pid}\\b|PID ${process.pid}:.*node)`, "i"))
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())) }
})

test("port recovery gives one live caller the abandoned claim", async () => {
  const { spawn } = await import("node:child_process")
  const { mkdtempSync, rmSync } = await import("node:fs")
  const { tmpdir } = await import("node:os")
  const { join } = await import("node:path")
  const directory = mkdtempSync(join(tmpdir(), "petalo-port-recovery-"))
  const mod = './scripts/free-port.mjs'
  const node = (source: string) => spawn(process.execPath, ["--input-type=module", "-e", source],
    { env: { ...process.env, TMPDIR: directory } })
  const abandoned = node(`
    import { reservePort } from ${JSON.stringify(mod)}
    process.stdout.write(String((await reservePort("PORT", undefined, 49000)).port))
    setInterval(() => {}, 1000)
  `)
  try {
    const port = await new Promise<string>((resolve, reject) => {
      abandoned.stdout.once("data", data => resolve(String(data).trim()))
      abandoned.once("error", reject)
      abandoned.once("exit", code => reject(new Error(`Lease child exited ${code} before acquiring a port`)))
    })
    const stopped = new Promise<void>(resolve => abandoned.once("close", () => resolve()))
    abandoned.kill("SIGKILL")
    await stopped
    const recovery = node(`
      import assert from "node:assert/strict"
      import { reservePort } from ${JSON.stringify(mod)}
      const first = await reservePort("PORT", ${JSON.stringify(port)}, 49000)
      try {
        assert.equal(first.port, ${Number(port)})
        await assert.rejects(reservePort("PORT", ${JSON.stringify(port)}, 49000), /PORT=\\d+ is busy[\\s\\S]*PID/)
      } finally { first.release() }
    `)
    const errors: string[] = []
    recovery.stderr.on("data", data => errors.push(String(data)))
    const code = await new Promise((resolve, reject) => {
      recovery.once("error", reject)
      recovery.once("close", resolve)
    })
    expect(code, errors.join("")).toBe(0)
  } finally {
    if (abandoned.exitCode === null && abandoned.signalCode === null) abandoned.kill("SIGKILL")
    rmSync(directory, { recursive: true, force: true })
  }
})
