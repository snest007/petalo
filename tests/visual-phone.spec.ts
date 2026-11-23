import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { assertPopupsInCells } from "./visual-popup-cell"

const THEMES = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
const DENSITIES = ["cozy", "compact"]
const visualOnly = process.env.VISUAL_ONLY
const prefixes = visualOnly === undefined ? undefined : visualOnly.split(",").map((prefix) => prefix.trim()).filter(Boolean)
const matches = (id: string) => !prefixes || prefixes.some((prefix) => id.startsWith(prefix))
// A separate, isolated 375×667 page per fixture opens the genuine native phone
// Dialog. Device forcing never shares a page with the desktop oracle fixtures.
for (const theme of THEMES) for (const density of DENSITIES) {
  test(`phone ${theme} ${density} matches UI5`, async ({ browser }) => {
    test.setTimeout(120_000)
    const ours = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
    const oracle = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
    const query = `fixtures-phone&theme=${theme}&density=${density}`
    await ours.goto(`/index.html?${query}`)
    await ours.waitForSelector("html[data-ready=true]")
    const cases = (await ours.evaluate(() => (window as any).__fixtures) as { id: string; tolerance: number }[]).filter((fixture) => matches(fixture.id))
    const states = ["time-picker-inputs", "search-scopes", "shellbar-search-scopes"].filter(matches)
    if (prefixes) expect(cases.length + states.length, `VISUAL_ONLY=${visualOnly}: no fixtures matched`).toBeGreaterThan(0)
    const directory = `test-results/visual-phone/${theme}-${density}`
    mkdirSync(directory, { recursive: true })
    const failures: string[] = []
    const report: Record<string, { ratio: number; size: string }> = {}
    for (const fixture of cases) {
      const shots = await Promise.all([ours, oracle].map(async (page, index) => {
        await page.goto(`/${index ? "ui5" : "index"}.html?${query}&only=${fixture.id}`)
        await page.waitForSelector("html[data-ready=true]")
        await expect(page.locator(`[data-fixture="${fixture.id}"]`)).toHaveCount(1)
        // Nested native menus keep their parent phone dialog open below the active surface.
        const dialog = (index ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"]')).last()
        await expect(dialog).toBeVisible()
        await expect(dialog).toHaveCSS("width", "375px")
        await expect(dialog).toHaveCSS("height", "667px")
        // Popup.js/openPopup temporarily sets .ui5-popup-opening; Popup.css.js
        // paints that host at opacity .1 even when animations are disabled.
        if (index) await expect(dialog).toHaveCSS("opacity", "1")
        await page.mouse.move(0, 666)
        await assertPopupsInCells(page, true)
        return PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }))
      }))
      const [a, b] = shots
      expect([a.width, a.height]).toEqual([375, 667])
      expect([b.width, b.height]).toEqual([375, 667])
      const diff = new PNG({ width: a.width, height: a.height })
      const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
      const ratio = count / (a.width * a.height)
      report[fixture.id] = { ratio, size: `${a.width}x${a.height}` }
      if (ratio > fixture.tolerance) {
        failures.push(`${fixture.id}: ${(ratio * 100).toFixed(1)}% pixels differ`)
        writeFileSync(`${directory}/${fixture.id}-ours.png`, PNG.sync.write(a))
        writeFileSync(`${directory}/${fixture.id}-ui5.png`, PNG.sync.write(b))
        writeFileSync(`${directory}/${fixture.id}-diff.png`, PNG.sync.write(diff))
      }
    }
    // Secondary surfaces use their real focus/button APIs; numeric time entry is
    // a Popover, while Search scopes are a separate full-screen phone Dialog.
    for (const state of states) {
      const buffers = await Promise.all([ours, oracle].map(async (page, index) => {
        const kind = state === "time-picker-inputs" ? "time-picker" : state === "search-scopes" ? "search" : "shellbar-search"
        await page.goto(`/${index ? "ui5" : "index"}.html?${query}&interactive&only=${kind}-phone${kind === "time-picker" ? "" : "-scopes"}`)
        await page.waitForSelector("html[data-ready=true]")
        const holder = page.locator(`#${kind}-phone-demo`)
        if (kind === "time-picker") {
          await holder.locator("input").first().click()
          await expect(index ? holder.locator("ui5-time-selection-inputs") : page.locator('[data-slot="time-selection-inputs"]')).toBeVisible()
          // The numeric entry surface is its own Popup, with the same genuine
          // .ui5-popup-opening opacity state as the full-screen Dialog above.
          if (index) await expect(holder.locator("ui5-popover[open]")).toHaveCSS("opacity", "1")
        } else {
          if (kind === "shellbar-search") {
            await holder.getByRole("button", { name: "Open Search", exact: true }).click()
            await expect(index ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"]')).toBeVisible()
            if (index) await expect(page.locator("ui5-dialog[open]")).toHaveCSS("opacity", "1")
          }
          await (index ? holder : kind === "search" ? holder : page.locator('[role="dialog"]')).getByRole("button", { name: "Select Scope", exact: true }).click()
          // Target the scope's own Dialog: the still-open parent Search Dialog
          // already has full-size geometry before the nested template renders.
          const active = index ? holder.locator('ui5-responsive-popover[id$="-scope-popover"] ui5-dialog[open]') : page.locator('[role="dialog"].fiori-search-phone-scope')
          await expect(active).toHaveCSS("width", "375px"); await expect(active).toHaveCSS("height", "667px")
          if (index) await expect(active).toHaveCSS("opacity", "1")
        }
        if (index) await holder.evaluate(async (node: any) => node.phoneRenderFinished())
        await page.evaluate(() => document.fonts.ready)
        await page.mouse.move(0, 666)
        return PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }))
      }))
      const [a, b] = buffers
      expect([a.width, a.height]).toEqual([375, 667]); expect([b.width, b.height]).toEqual([375, 667])
      const diff = new PNG({ width: a.width, height: a.height })
      const ratio = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height)
      report[state] = { ratio, size: `${a.width}x${a.height}` }
      if (ratio > 0.02) {
        failures.push(`${state}: ${(ratio * 100).toFixed(1)}% pixels differ`)
        writeFileSync(`${directory}/${state}-ours.png`, PNG.sync.write(a)); writeFileSync(`${directory}/${state}-ui5.png`, PNG.sync.write(b)); writeFileSync(`${directory}/${state}-diff.png`, PNG.sync.write(diff))
      }
    }
    writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2))
    await ours.close(); await oracle.close()
    expect(failures, failures.join("\n")).toEqual([])
  })
}
