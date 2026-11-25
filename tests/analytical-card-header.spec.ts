import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const headerSlot = '[data-slot="analytical-card-header"]'
const fixture = '[data-fixture="analytical-card-header-positive"]'

for (const dir of ["ltr", "rtl"]) {
  test(`AnalyticalCardHeader preserves heading, label order and independent keyboard actions in ${dir}`, async ({ page }) => {
    await page.goto(`/?dir=${dir}#/analytical-card-header`)
    const demo = page.locator("#analytical-card-header-demo")
    const header = demo.getByRole("group", { name: /Net revenue/ })
    const details = header.getByRole("button", { name: "View details" })
    const headerActions = demo.getByLabel("Header activations")
    const detailActions = demo.getByLabel("Details activations")
    await expect(header).toHaveAttribute("aria-roledescription", "Card Header")
    await expect(header.getByRole("heading", { name: "Net revenue", level: 2 })).toBeVisible()
    await expect(header.getByRole("img", { name: "1,264.5M Ascending Good" })).toBeVisible()
    await expect(header).toHaveAccessibleName("Net revenue Current quarter EUR 1,264.5M Ascending Good Target 1,300.25M View details Compared with the previous quarter")
    const labels = await header.evaluate(node => node.getAttribute("aria-labelledby")!.split(/\s+/)
      .map(id => node.ownerDocument.getElementById(id)?.textContent))
    expect(labels).toEqual(["Net revenue", "Current quarter", "EUR", "1,264.5M", "Target1,300.25M", "View details", "Compared with the previous quarter"])

    await header.focus()
    await expect(header).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(headerActions).toHaveText("1")
    await page.keyboard.press("Space")
    await expect(headerActions).toHaveText("2")
    await page.keyboard.press("Tab")
    await expect(details).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(detailActions).toHaveText("1")
    await page.keyboard.press("Space")
    await expect(detailActions).toHaveText("2")
    await expect(headerActions).toHaveText("2")
    await details.click()
    await expect(detailActions).toHaveText("3")
    await expect(headerActions).toHaveText("2")
  })
}

for (const [locale, dir, roleDescription, trend, state] of [
  ["de-DE", "ltr", "Kartenkopf", "Aufsteigend", "Gut"],
  ["zh-CN", "ltr", "卡抬头", "升序", "良好"],
  ["ar-EG", "rtl", "مقدمة البطاقة", "تصاعدي", "جيد"],
] as const) {
  test(`AnalyticalCardHeader localizes KPI values and preserves overridable SAP phrases in ${locale}`, async ({ page, context }) => {
    const wcr = await context.newPage()
    try {
      const query = `only=analytical-card-header-positive&locale=${locale}&dir=${dir}`
      await Promise.all([page.goto(`/index.html?fixtures&ref=wcr&${query}`), wcr.goto(`/wcr.html?${query}`)])
      await Promise.all([page, wcr].map(tab => expect(tab.locator("html")).toHaveAttribute("data-ready", "true")))
      const format = new Intl.NumberFormat(locale)
      const normalize = (text: string) => text.replace(/\s+/g, " ").trim()
      const kpiName = normalize(`${format.format(1264.5)}M ${trend} ${state}`)
      for (const tab of [page, wcr]) {
        const cell = tab.locator(fixture)
        await expect(cell.getByRole("group")).toHaveAttribute("aria-roledescription", roleDescription)
        await expect(cell.getByRole("img", { name: kpiName, exact: true })).toBeVisible()
        await expect(cell.getByText(`${format.format(1300.25)}M`, { exact: true })).toBeVisible()
      }
      await expect(page.locator(fixture).locator(headerSlot)).toHaveCSS("direction", dir)
    } finally {
      await wcr.close()
    }
  })
}

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  test(`AnalyticalCardHeader axe ${theme}`, async ({ page }) => {
    await page.goto(`/?theme=${theme}#/analytical-card-header`)
    await expect(page.locator("#analytical-card-header-demo").locator(headerSlot)).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).include("#analytical-card-header-demo").analyze()
    expect(violations).toEqual([])
  })
}
