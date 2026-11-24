// OpenUI5 1.154 is a dev-time visual oracle for controls absent from UI5 Web Components.
// UI5 Tooling serves the reference locally; no CDN is allowed in this harness.
import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { assertPopupsInCells } from "./visual-popup-cell"

const THEMES = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
const DENSITIES = ["cozy", "compact"] as const
const visualOnly = process.env.VISUAL_ONLY
const prefixes = visualOnly === undefined ? undefined : visualOnly.split(",").map((prefix) => prefix.trim()).filter(Boolean)
const matches = (id: string) => !prefixes || prefixes.some((prefix) => id.startsWith(prefix))
const referenceURL = `http://localhost:${Number(process.env.SAPUI5_PORT ?? 4174)}/index.html`
type CaseInfo = { id: string; tolerance: number }

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

async function keepReferenceOffline(page: Page) {
  const externalRequests: string[] = []
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url())
    if (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      await route.continue()
    } else {
      externalRequests.push(url.href)
      await route.abort()
    }
  })
  return externalRequests
}

// Match tests/visual.spec.ts: one full-page PNG, cells cropped with Playwright's rounding,
// pixelmatch threshold 0.1, exact dimensions, and a default maximum 2% differing pixels.
async function shoot(page: Page, url: string, ids?: string[]) {
  await page.goto(url, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("html[data-ready=true]", { timeout: 60_000 })
  await page.mouse.move(0, 0)
  await assertPopupsInCells(page)
  const boxes = await page.locator("[data-fixture]").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect()
    return {
      id: (element as HTMLElement).dataset.fixture!,
      x: rect.left + scrollX,
      y: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
    }
  }))
  const full = PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" }))
  const wanted = ids ? new Set(ids) : undefined
  const shots = new Map<string, PNG>()
  for (const box of boxes) {
    if (!matches(box.id)) continue
    if (wanted && !wanted.has(box.id)) continue
    const x = Math.floor(box.x), y = Math.floor(box.y)
    const width = Math.ceil(box.x + box.width) - x, height = Math.ceil(box.y + box.height) - y
    const cell = new PNG({ width, height })
    PNG.bitblt(full, cell, x, y, Math.min(width, full.width - x), Math.min(height, full.height - y), 0, 0)
    expect(shots.has(box.id), `Duplicate fixture id: ${box.id}`).toBe(false)
    shots.set(box.id, cell)
  }
  return shots
}

async function readCases(page: Page): Promise<CaseInfo[]> {
  return (await page.evaluate(() => (window as unknown as { __fixtures: CaseInfo[] }).__fixtures)).filter((fixture) => matches(fixture.id))
}

// The OpenUI5 reference renders the variant-list popover header slightly differently when several
// reference pages load in parallel (shared UI5 Tooling server under load; ~1 in 3 parallel loads).
// Run these comparisons one at a time; our side is unaffected either way.
test.describe.configure({ mode: "serial" })

for (const theme of THEMES) {
  for (const density of DENSITIES) {
    test(`${theme} ${density} matches SAPUI5`, async ({ context, page }) => {
      test.setTimeout(120_000)
      const referencePage = await context.newPage()
      const referenceErrors = watchErrors(referencePage)
      const ourErrors = watchErrors(page)
      const externalRequests = await keepReferenceOffline(referencePage)
      const query = `?theme=${theme}&density=${density}`
      try {
        const reference = await shoot(referencePage, `${referenceURL}${query}`)
        // React previews also show skipCompare cases; crop only the reference's compared cells.
        const ours = await shoot(page, `/index.html${query}&fixtures-sapui5`, [...reference.keys()])
        const cases = await readCases(page)
        const referenceCases = await readCases(referencePage)
        if (prefixes) expect(cases.length, `VISUAL_ONLY=${visualOnly}: no fixtures matched`).toBeGreaterThan(0)
        expect(await referencePage.evaluate(() => (window as any).sap.ui.version), "Pinned OpenUI5 reference").toBe("1.154.0")
        const ids = cases.map((fixture) => fixture.id).sort()
        if (!prefixes) expect(ids, "The smoke fixture must remain part of the comparison").toEqual(expect.arrayContaining([
          "sapui5-button-default", "sapui5-button-emphasized",
        ]))
        expect(referenceCases.map((fixture) => fixture.id).sort(), "Fixture definitions must agree").toEqual(ids)
        expect([...reference.keys()].sort(), "Every reference case must render").toEqual(ids)
        expect([...ours.keys()].sort(), "Every React case must render").toEqual(ids)
        expect(referenceErrors, "SAPUI5 reference logged errors").toEqual([])
        expect(ourErrors, "React fixtures logged errors").toEqual([])
        expect(externalRequests, "The SAPUI5 reference must work without a CDN").toEqual([])

        const dir = `test-results/visual-sapui5/${theme}-${density}`
        mkdirSync(dir, { recursive: true })
        const failures: string[] = []
        const report: Record<string, { ratio: number; size: string }> = {}
        for (const fixture of cases) {
          const a = ours.get(fixture.id)!
          const b = reference.get(fixture.id)!
          const key = `${theme}/${density}/${fixture.id}`
          if (a.width !== b.width || a.height !== b.height) {
            report[key] = { ratio: 1, size: `${a.width}x${a.height} vs SAPUI5 ${b.width}x${b.height}` }
            failures.push(`${fixture.id}: size ${a.width}x${a.height} vs SAPUI5 ${b.width}x${b.height}`)
            writeFileSync(`${dir}/${fixture.id}-ours.png`, PNG.sync.write(a))
            writeFileSync(`${dir}/${fixture.id}-sapui5.png`, PNG.sync.write(b))
            continue
          }
          const diff = new PNG({ width: a.width, height: a.height })
          const differing = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
          const ratio = differing / (a.width * a.height)
          report[key] = { ratio, size: `${a.width}x${a.height}` }
          if (ratio > fixture.tolerance) {
            failures.push(`${fixture.id}: ${(ratio * 100).toFixed(1)}% pixels differ`)
            writeFileSync(`${dir}/${fixture.id}-ours.png`, PNG.sync.write(a))
            writeFileSync(`${dir}/${fixture.id}-sapui5.png`, PNG.sync.write(b))
            writeFileSync(`${dir}/${fixture.id}-diff.png`, PNG.sync.write(diff))
          }
        }
        writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2))
        expect(failures, failures.join("\n")).toEqual([])
      } finally {
        await referencePage.close()
      }
    })
  }
}

test("real VariantManagement and MDC Adapt Filters render, including an in-place dialog", async ({ page }) => {
  test.setTimeout(120_000)
  const errors = watchErrors(page)
  const externalRequests = await keepReferenceOffline(page)
  await page.goto(`${referenceURL}?demo`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("html[data-ready=true]", { timeout: 60_000 })
  const demo = page.locator("#sapui5-reference-demo")
  const variants = demo.locator("#sapui5-variant-management")
  await expect(variants).toHaveClass(/sapMVarMngmt/)
  await expect(variants).toContainText("Standard")
  const trigger = variants.getByRole("button", { name: "View Standard", exact: true })
  await trigger.focus()
  await expect(trigger).toBeFocused()
  // VariantManagement.js:onkeyup opens its real list for F4. Wait for the popup's
  // initial focus before sending Escape, including UI5's own deferred opening timer.
  await trigger.press("F4")
  const views = page.getByRole("listbox", { name: /^List of assigned Views$/i })
  await expect(views).toBeVisible()
  await expect(views.getByRole("option", { name: "My View", exact: true })).toBeVisible()
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect.poll(() => views.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await page.keyboard.press("Escape")
  await expect(views).not.toBeVisible()
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  const filters = demo.locator("#sapui5-filter-bar")
  await expect(filters).toBeVisible()
  await expect(filters.getByText("Name", { exact: true })).toBeVisible()
  await expect(filters.getByText("Country", { exact: true })).toBeVisible()
  await filters.getByRole("button", { name: /Adapt Filters/ }).click()
  const dialog = page.getByRole("dialog", { name: "Adapt Filters", exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("Country", { exact: true })).toBeVisible()
  await expect(dialog.getByText("Name", { exact: true })).toBeVisible()
  // Unselected fields live in the Add Filter picker, rather than the initial List rows.
  const addFilter = dialog.getByRole("combobox", { name: "Add Filter", exact: true })
  await expect(addFilter).toBeVisible()
  await addFilter.focus()
  await expect(addFilter).toBeFocused()
  await addFilter.press("F4")
  const city = page.getByRole("option", { name: "City", exact: true })
  await expect(city).toBeVisible()
  await addFilter.press("Escape")
  await expect(city).not.toBeVisible()

  const dialogId = await dialog.getAttribute("id")
  expect(dialogId).toBeTruthy()
  // sap/m/p13n/Popup.js:_createDialog uses a real sap.m.Dialog. Resolve that control
  // from its rendered id and exercise the fixture helper on the actual Adapt Filters surface.
  await page.evaluate(async (id) => {
    const sap = (window as any).sap
    await new Promise<void>((resolve, reject) => sap.ui.require(
      ["sap/ui/core/Element", "ref/popup-in-place"],
      async (Element: any, helper: any) => {
        try {
          const cell = document.createElement("div")
          cell.id = "sapui5-adapt-filters-in-place"
          cell.dataset.fixture = "sapui5-adapt-filters-helper"
          document.getElementById("root")!.append(cell)
          await helper.showPopupInPlace(Element.getElementById(id), cell)
          resolve()
        } catch (error) {
          reject(error)
        }
      },
      reject,
    ))
  }, dialogId)
  const placed = page.locator("#sapui5-adapt-filters-in-place > .sapMDialog")
  await expect(placed).toBeVisible()
  await expect(placed).toHaveCSS("position", "static")
  await expect(placed.getByText("Name", { exact: true })).toBeVisible()
  expect(errors, "Real SAPUI5 controls logged errors").toEqual([])
  expect(externalRequests, "Real SAPUI5 controls must work offline").toEqual([])
})
