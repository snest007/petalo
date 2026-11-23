import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { captureAX } from "./a11y-tree-normalize"

const fixture = (variant = "horizontal", dir = "ltr", theme = "sap_horizon", density = "cozy") =>
  `/index.html?fixtures&ref=wcr&only=splitter-layout-${variant}&dir=${dir}&theme=${theme}&density=${density}`

for (const dir of ["ltr", "rtl"]) {
  test(`SplitterLayout holds its intrinsic automatic sizes and resizes in ${dir}`, async ({ page, context }) => {
    const wcr = await context.newPage()
    const cell = '[data-fixture="splitter-layout-automatic"]'
    await Promise.all([
      page.goto(fixture("automatic", dir)),
      wcr.goto(`/wcr.html?only=splitter-layout-automatic&dir=${dir}`),
    ])
    const ours = page.locator(`${cell} [data-slot="splitter-element"]`)
    const reference = wcr.locator(`${cell} [data-min-size]`)
    const separator = page.locator(cell).getByRole("separator")
    const referenceSeparator = wcr.locator(cell).getByRole("separator")
    for (const panes of [ours, reference]) {
      await expect(panes.nth(0)).toHaveCSS("flex", "0 0 162px")
      await expect(panes.nth(1)).toHaveCSS("flex", "0 0 322px")
      // Both layouts retain the observed extent when the contents grow.
      await panes.nth(0).locator(":scope > div").evaluate((content: HTMLElement) => { content.style.width = "125px" })
      await expect(panes.nth(0)).toHaveCSS("width", "162px")
      await expect(panes.nth(1)).toHaveCSS("width", "322px")
    }
    await expect(separator).toHaveAttribute("aria-valuenow", "29.4")
    await expect(referenceSeparator).not.toHaveAttribute("aria-valuenow", /./)
    for (const [canvas, value] of [[page, Math.fround(29.4)], [wcr, 50]] as const) {
      const { ax } = await captureAX(canvas, cell)
      expect(ax).toMatchObject([{ children: [{}, { role: "separator", value }, {}] }])
    }
    const increase = dir === "ltr" ? "ArrowRight" : "ArrowLeft"
    for (const [bar, panes] of [[separator, ours], [referenceSeparator, reference]] as const) {
      await bar.focus()
      await bar.press(increase)
      await expect(panes.nth(0)).toHaveCSS("width", "182px")
      await expect(panes.nth(1)).toHaveCSS("width", "302px")
      await expect(bar).toBeFocused()
    }
    await separator.press("Home")
    await expect(ours.nth(0)).toHaveCSS("width", "48px")
    await expect(separator).toHaveAttribute("aria-valuenow", "0")
    await separator.press("End")
    await expect(ours.nth(1)).toHaveCSS("width", "48px")
    await expect(separator).toHaveAttribute("aria-valuenow", "100")
    await expect(separator).toBeFocused()
  })

  test(`SplitterLayout keyboard bounds and steps in ${dir}`, async ({ page }) => {
    await page.goto(fixture("horizontal", dir))
    const separator = page.getByRole("separator", { name: "Press ARROW keys to move" })
    await expect(separator).toHaveAttribute("aria-valuenow", "50")
    await separator.focus()
    await separator.press("ArrowRight")
    await expect(separator).toHaveAttribute("aria-valuenow", dir === "ltr" ? "59.6" : "40.4")
    await separator.press("Home")
    await expect(separator).toHaveAttribute("aria-valuenow", "0")
    await separator.press(dir === "ltr" ? "Shift+ArrowRight" : "Shift+ArrowLeft")
    const firstPane = page.locator("[data-slot=splitter-element]").first()
    await expect(firstPane).toHaveCSS("width", "49px")
    await separator.press("End")
    await expect(separator).toHaveAttribute("aria-valuenow", "100")
    await expect(separator).toBeFocused()
  })
}

test("SplitterLayout drag clamps the adjacent panes and fixed panes lack a separator", async ({ page }) => {
  await page.goto(fixture("vertical"))
  const separator = page.getByRole("separator")
  await expect(separator).toHaveAttribute("aria-valuenow", "50")
  const rect = (await separator.boundingBox())!
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.down()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height + 155)
  await page.mouse.up()
  await expect(separator).toHaveAttribute("aria-valuenow", "100")
  await page.goto(fixture("fixed"))
  await expect(page.getByText("Preview")).toBeVisible()
  await expect(page.getByRole("separator")).toHaveCount(0)
})

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  test(`SplitterLayout axe ${theme}`, async ({ page }) => {
    for (const density of ["cozy", "compact"]) {
      for (const dir of ["ltr", "rtl"]) {
        await page.goto(fixture("horizontal", dir, theme, density))
        await expect(page.getByRole("separator")).toBeVisible()
        const result = await new AxeBuilder({ page }).include("[data-slot=splitter-layout]").analyze()
        expect(result.violations).toEqual([])
      }
    }
  })
}
