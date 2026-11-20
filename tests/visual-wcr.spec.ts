import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

const themes = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
const densities = ["cozy", "compact"]
const passes = themes.flatMap((theme) => densities.map((density) => ({ theme, density, dir: "ltr" })))
passes.push({ theme: "sap_horizon", density: "cozy", dir: "rtl" })

type CaseInfo = { id: string; tolerance: number }
async function loadFixtures(page: Page, path: string) {
  await page.goto(path)
  await page.waitForSelector("html[data-ready=true]", { timeout: 60_000 })
  await page.mouse.move(0, 0)
  const fixtures: CaseInfo[] = await page.evaluate(() => (window as any).__fixtures)
  const ids = await page.locator("[data-fixture]").evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset.fixture))
  expect(ids).toEqual(fixtures.map((fixture) => fixture.id))
  expect(new Set(ids).size, "Fixture IDs must be unique").toBe(ids.length)
  return fixtures
}

async function shoot(page: Page, id: string) {
  return PNG.sync.read(await page.locator(`[data-fixture="${id}"]`).screenshot({ animations: "disabled", caret: "hide" }))
}

test.describe.configure({ mode: "default" })
for (const { theme, density, dir } of passes) {
  test(`${theme} ${density} ${dir} matches WCR`, async ({ page: ours, context }) => {
    test.setTimeout(120_000)
    const wcr = await context.newPage()
    const errors: string[] = []
    wcr.on("pageerror", (error) => errors.push(error.message))
    wcr.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })

    const query = `theme=${theme}&density=${density}&dir=${dir}`
    const [fixtures, reference] = await Promise.all([
      loadFixtures(ours, `/index.html?fixtures&ref=wcr&${query}`),
      loadFixtures(wcr, `/wcr.html?${query}`),
    ])
    expect(fixtures.length).toBeGreaterThan(0)
    expect([...reference].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...fixtures].sort((a, b) => a.id.localeCompare(b.id)))
    await expect(wcr.locator("html")).toHaveAttribute("data-sap-theme", theme)
    await expect(wcr.locator("[data-fixture]").first()).toHaveCSS("direction", dir)
    expect(await wcr.locator("body").getAttribute("data-ui5-compact-size") !== null).toBe(density === "compact")

    const properties = [
      ["--fiori-wcr-x-analyticaltable-headerborderwidth", "--_ui5wcr-AnalyticalTable-HeaderBorderWidth"],
      ["--fiori-wcr-x-analyticaltablerowheight", "--_ui5wcr-AnalyticalTableRowHeight"],
    ]
    for (const [oursProperty, wcrProperty] of properties) {
      const value = (page: Page, name: string) => page.locator("[data-fixture]").first()
        .evaluate((cell, prop) => getComputedStyle(cell).getPropertyValue(prop).trim(), name)
      const [actual, expected] = await Promise.all([value(ours, oursProperty), value(wcr, wcrProperty)])
      expect(expected, wcrProperty).not.toBe("")
      expect(actual, oursProperty).toBe(expected)
    }

    const output = `test-results/visual-wcr/${theme}-${density}${dir === "rtl" ? "-rtl" : ""}`
    mkdirSync(output, { recursive: true })
    const report: Record<string, { ours: string; wcr: string; ratio?: number }> = {}
    for (const { id, tolerance } of fixtures) {
      const [a, b] = await Promise.all([shoot(ours, id), shoot(wcr, id)])
      writeFileSync(`${output}/${id}-ours.png`, PNG.sync.write(a))
      writeFileSync(`${output}/${id}-wcr.png`, PNG.sync.write(b))
      const result: (typeof report)[string] = { ours: `${a.width}x${a.height}`, wcr: `${b.width}x${b.height}` }
      report[id] = result
      expect.soft(result.ours, `${id}: capture size`).toBe(result.wcr)
      if (result.ours !== result.wcr) continue

      const diff = new PNG({ width: a.width, height: a.height })
      const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
      result.ratio = count / (a.width * a.height)
      writeFileSync(`${output}/${id}-diff.png`, PNG.sync.write(diff))
      expect.soft(result.ratio, `${id}: fraction of differing pixels`).toBeLessThanOrEqual(tolerance)
    }
    writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2))
    expect(errors, "WCR console and page errors").toEqual([])
  })
}
