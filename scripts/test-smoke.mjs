#!/usr/bin/env node
import { ensureStorybookBuild, run, testSummary } from "./test-milestone.mjs"
import { checkExplicitPorts, reservePort } from "./free-port.mjs"

// Fixed smoke inventory. Keep scope here, rather than scattering grep lists in package.json.
const main = [
  // A public docs route covers navigation, install instructions and the shared docs shell.
  ["tests/a11y.spec.ts", "docs route button has no axe violations \\(sap_horizon\\)"],
  // A few stable field/action fixtures cover generated tokens in all themes/densities and RTL.
  ["tests/visual.spec.ts", "matches UI5$"],
  // Offline payload checks cover shadcn metadata, library file targets and block dependencies.
  ["tests/usage-guidance.spec.ts", "shadcn build preserves usage in both the registry payload and markdown docs"],
  ["tests/variants.spec.ts", "variants: registry item distributes the library and its type dependencies"],
  ["tests/f6-navigation.spec.ts", "f6: registry library and five blocks distribute the opt-in dependency"],
]
const storybook = [
  "tests-storybook/docs-globals.spec.ts", // lazy Docs iframe inheritance and manager globals
  "tests-storybook/named-controls.spec.ts", // shared accessible-name auditor guardrails
  "tests-storybook/pilots.spec.ts", // Controls, keyboard focus and semantics across six pilots
]

async function docsConsoleCheck() {
  // Reuse the docs build made by the main smoke run; Vite and Chromium are closed in finally.
  const { preview } = await import("vite")
  const { chromium } = await import("@playwright/test")
  let server, browser, reservation
  try {
    reservation = await reservePort("PORT", process.env.PORT, 4310)
    server = await preview({ preview: { port: reservation.port, host: "127.0.0.1", strictPort: true } })
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
    await page.goto(`${server.resolvedUrls.local[0]}#/button`)
    await page.waitForSelector('html[data-ready="true"]')
    await page.locator('main[data-docs-route="button"]').waitFor({ state: "visible" })
    await page.evaluate(() => document.fonts.ready)
    if (errors.length) throw new Error(errors.join("\n"))
    console.log("Docs route button rendered without console errors.")
    return true
  } catch (error) {
    console.error(`Docs route console check failed: ${error.message}`)
    return false
  } finally {
    try { await browser?.close() } finally {
      try {
        if (server) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
      } finally { reservation?.release() }
    }
  }
}

if (!await checkExplicitPorts(process.env, ["PORT", "SAPUI5_PORT", "STORYBOOK_PORT"])) process.exit(1)
const started = Date.now()
const registry = run("pnpm", ["registry:build"], { log: ".integration/smoke-registry.log" })
let ok = registry.ok
if (ok) {
  ok = testSummary([...main.map(([file]) => file), "--grep", main.map(([, title]) => title).join("|"), "--retries=0"], {
    env: { VISUAL_ONLY: "button-default,input-empty,input-value", STORYBOOK_ONLY: undefined },
    log: ".integration/smoke-main.log",
  }).ok
}
if (ok) ok = await docsConsoleCheck()
if (ok) ok = ensureStorybookBuild()
if (ok) ok = testSummary(["-c", "playwright.storybook.config.ts", ...storybook], {
  env: { PORT: undefined, STORYBOOK_ONLY: undefined, VISUAL_ONLY: undefined },
  log: ".integration/smoke-storybook.log",
}).ok
console.log(`Smoke ${ok ? "PASS" : "FAIL"} (${((Date.now() - started) / 1000).toFixed(1)}s) | Logs: .integration/smoke-*.log`)
process.exitCode = ok ? 0 : 1
