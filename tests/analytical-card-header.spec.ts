import { AxeBuilder } from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { build } from "vite"
import { aliases } from "../vite.aliases"

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
    await header.getByRole("heading", { name: "Net revenue", level: 2 }).click()
    await expect(headerActions).toHaveText("3")
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

test.describe("AnalyticalCardHeader embedded action ownership", () => {
  let code: string
  let stylesheet: string

  test.beforeAll(async () => {
    const result = await build({
      configFile: false, publicDir: false, logLevel: "silent", resolve: { alias: aliases },
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
      build: { write: false, lib: {
        entry: resolve("tests/analytical-card-header-ownership.tsx"), formats: ["iife"], name: "AnalyticalCardHeaderOwnership",
      } },
    })
    const buildOutput = Array.isArray(result) ? result[0] : result
    if (!("output" in buildOutput)) throw new Error("Expected the embedded actions fixture bundle")
    const chunk = buildOutput.output.find(file => file.type === "chunk")
    if (!chunk || chunk.type !== "chunk") throw new Error("Missing the embedded actions fixture bundle")
    code = chunk.code
    stylesheet = readFileSync("dist/index.html", "utf8").match(/href="([^"]+\.css)"/)![1]
  })

  async function openFixture(page: Page, dir: "ltr" | "rtl") {
    const path = "/analytical-card-header-ownership.html"
    await page.route("**" + path, route => route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="en" dir="${dir}" data-theme="sap_horizon"><head><link rel="stylesheet" href="${stylesheet}"></head>
        <body><div id="root"></div><script>${code.replaceAll("</script", "<\\/script")}</script></body></html>`,
    }))
    await page.goto(path)
    const fixture = page.locator("#analytical-card-header-ownership")
    await expect(fixture.getByLabel("Header activations")).toHaveText("0")
    return fixture
  }

  for (const dir of ["ltr", "rtl"] as const) {
    test(`native disclosure toggles by mouse and keyboard in ${dir}`, async ({ page }) => {
      const fixture = await openFixture(page, dir)
      const disclosure = fixture.locator("details")
      const summary = disclosure.locator("summary")
      const headerActions = fixture.getByLabel("Header activations")
      await disclosure.getByText("Breakdown", { exact: true }).click()
      await expect(disclosure).toHaveAttribute("open", "")
      await expect(headerActions).toHaveText("0")
      await summary.focus()
      await expect(summary).toBeFocused()
      await page.keyboard.press("Enter")
      await expect(disclosure).not.toHaveAttribute("open")
      await expect(headerActions).toHaveText("0")
    })

    test(`a portaled menu item keeps its selection in ${dir}`, async ({ page }) => {
      const fixture = await openFixture(page, dir)
      const header = fixture.locator(headerSlot)
      const headerActions = fixture.getByLabel("Header activations")
      await header.getByRole("button", { name: "Actions", exact: true }).click()
      const item = page.getByRole("menuitem", { name: "Export", exact: true })
      await expect(item).toBeVisible()
      await expect(header.getByRole("menuitem")).toHaveCount(0)
      await expect(headerActions).toHaveText("0")
      await item.click()
      await expect(fixture.getByLabel("Menu selections")).toHaveText("1")
      await expect(item).toBeHidden()
      await expect(headerActions).toHaveText("0")
    })
  }
})
