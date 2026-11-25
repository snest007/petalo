import { mkdirSync, writeFileSync } from "node:fs"
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { sheetCases } from "../docs/src/fixtures/action-sheet.cases"

const trigger = (page: Page) => page.locator("#action-sheet-demo").getByRole("button", { name: "Actions" })
const sheet = (page: Page) => page.getByRole("dialog", { name: "Available Actions" })
const action = (page: Page, name: RegExp) => sheet(page).getByRole("button", { name })

for (const dir of ["ltr", "rtl"]) test(`ActionSheet keeps the desktop action model in ${dir}`, async ({ page }) => {
  await page.goto(`/?dir=${dir}#/action-sheet`)
  await trigger(page).press("Enter")
  const first = action(page, /^Open file/)
  const copy = action(page, /^Make a copy/)
  const share = action(page, /^Share file/)
  const disabled = action(page, /^Archive file/)
  await expect(first).toBeFocused()
  await expect(sheet(page).getByRole("application")).toBeVisible()
  expect((await sheet(page).boundingBox())!.width).toBeLessThan(160)
  await expect(sheet(page).getByText("File actions")).toHaveCount(0)
  await expect(action(page, /^Cancel$/)).toHaveCount(0)
  await expect(disabled).toBeDisabled()
  await first.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
  await expect(copy).toBeFocused()
  await copy.press("ArrowDown")
  await expect(share).toBeFocused()
  await share.press("End")
  await expect(share).toBeFocused()
  await share.press("Tab")
  await expect(share).toBeFocused()
  await share.press("PageUp")
  await expect(first).toBeFocused()
  await first.press("Space")
  await expect(sheet(page)).toHaveCount(0)
  await expect(trigger(page)).toBeFocused()
  await expect(page.locator("#action-sheet-demo").getByLabel("Last action")).toHaveText("Open file")
  await trigger(page).click()
  await first.press("Escape")
  await expect(sheet(page)).toHaveCount(0)
  await expect(trigger(page)).toBeFocused()
  await trigger(page).click()
  await expect(first).toBeFocused()
  await page.getByRole("heading", { name: "ActionSheet", level: 1 }).click()
  await expect(sheet(page)).toHaveCount(0)
})

test.describe("ActionSheet on phones", () => {
  test.use({
    viewport: { width: 375, height: 667 }, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  })

  for (const dir of ["ltr", "rtl"]) test(`phone bottom sheet traps keys, cancels and returns focus in ${dir}`, async ({ page }) => {
    await page.goto(`/?dir=${dir}#/action-sheet`)
    await trigger(page).tap()
    const dialog = sheet(page)
    const first = action(page, /^Open file/)
    const cancel = action(page, /^Cancel$/)
    await expect(first).toBeFocused()
    await expect(dialog.getByRole("heading", { name: "File actions" })).toBeVisible()
    await expect(dialog.getByRole("region", { name: "Content" })).toBeVisible()
    const bounds = await dialog.boundingBox()
    expect(bounds?.width).toBe(375)
    expect(bounds!.y + bounds!.height).toBe(667)
    expect(bounds!.height).toBeLessThan(667)
    await first.press("PageDown")
    await expect(cancel).toBeFocused()
    await cancel.press("Shift+Tab")
    await expect(cancel).toBeFocused()
    await cancel.press("Home")
    await expect(first).toBeFocused()
    await first.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
    await expect(action(page, /^Make a copy/)).toBeFocused()
    await cancel.tap()
    await expect(dialog).toHaveCount(0)
    await expect(trigger(page)).toBeFocused()
    await expect(page.locator("#action-sheet-demo").getByLabel("Last action")).toBeEmpty()
    await trigger(page).tap()
    await expect(cancel).toBeFocused()
    await cancel.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(trigger(page)).toBeFocused()
  })

  const themes = ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]
  const passes = themes.flatMap(theme => ["cozy", "compact"].map(density => ({ theme, density, dir: "ltr" })))
  passes.push({ theme: "sap_horizon", density: "cozy", dir: "rtl" })
  for (const { theme, density, dir } of passes) test(`phone pixels match WCR in ${theme} ${density} ${dir}`, async ({ page, context }) => {
    const reference = await context.newPage()
    const query = `theme=${theme}&density=${density}&dir=${dir}`
    await Promise.all([page.goto(`/index.html?fixtures&ref=wcr&${query}`), reference.goto(`/wcr.html?${query}`)])
    await Promise.all([page, reference].map(tab => expect(tab.locator("html")).toHaveAttribute("data-ready", "true")))
    const output = `test-results/action-sheet/${theme}-${density}-${dir}`
    mkdirSync(output, { recursive: true })
    const stats: Record<string, { ours: string; wcr: string; difference?: number }> = {}
    for (const { id } of sheetCases.cases) {
      const cell = (tab: Page) => tab.locator(`[data-fixture="${id}"]`)
      const [ours, wcr] = await Promise.all([page, reference].map(async tab => PNG.sync.read(await cell(tab).screenshot({ animations: "disabled", caret: "hide" }))))
      const result = { ours: `${ours.width}x${ours.height}`, wcr: `${wcr.width}x${wcr.height}` }
      stats[id] = result
      expect.soft(result.ours, `${id} capture size`).toBe(result.wcr)
      writeFileSync(`${output}/${id}-ours.png`, PNG.sync.write(ours))
      writeFileSync(`${output}/${id}-wcr.png`, PNG.sync.write(wcr))
      if (result.ours !== result.wcr) continue
      const diff = new PNG({ width: ours.width, height: ours.height })
      const difference = pixelmatch(ours.data, wcr.data, diff.data, ours.width, ours.height, { threshold: .1 }) / (ours.width * ours.height)
      stats[id].difference = difference
      writeFileSync(`${output}/${id}-diff.png`, PNG.sync.write(diff))
      expect.soft(difference, `${id} pixel difference`).toBeLessThanOrEqual(.02)
    }
    writeFileSync(`${output}/report.json`, JSON.stringify(stats, null, 2))
  })

  for (const locale of ["de-DE", "zh-CN", "ar-EG"]) test(`compares WCR phone labels and action positions in ${locale}`, async ({ page, context }) => {
    const reference = await context.newPage()
    const dir = locale === "ar-EG" ? "rtl" : "ltr"
    const query = `only=action-sheet-default&locale=${locale}&dir=${dir}`
    await Promise.all([page.goto(`/index.html?fixtures&ref=wcr&${query}`), reference.goto(`/wcr.html?${query}`)])
    await Promise.all([page, reference].map(tab => expect(tab.locator("html")).toHaveAttribute("data-ready", "true")))
    const surface = (tab: Page) => tab.locator('[data-fixture="action-sheet-default"]').getByRole("dialog")
    const [actual, expected] = await Promise.all([page, reference].map(tab => surface(tab).ariaSnapshot()))
    expect(actual).toEqual(expected)
    const violations = await new AxeBuilder({ page }).include('[data-fixture="action-sheet-default"]').analyze()
    expect(violations.violations.map(item => item.id)).toEqual([])
  })
})
