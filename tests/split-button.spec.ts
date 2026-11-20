import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("primary activation, cancellation and related menu commands", async ({ page }) => {
  await page.goto("/index.html#/split-button")
  const demo = page.locator('main[data-docs-route="split-button"]')
  const group = demo.getByRole("group", { name: /^Export PDF Split Button/ })
  const primary = group.getByRole("button", { name: "Export PDF" })
  const arrow = group.getByRole("button", { name: "Open Menu" })
  const menu = page.getByRole("menu", { name: "Export formats" })
  const result = demo.locator("output")

  await group.focus()
  await expect(group).toBeFocused()
  await expect(primary).toHaveAttribute("tabindex", "-1")
  await expect(arrow).toHaveAttribute("tabindex", "-1")
  await page.keyboard.down("Space")
  await page.keyboard.press("Escape")
  await page.keyboard.up("Space")
  await expect(result).toBeEmpty()
  await page.keyboard.press("Space")
  await expect(result).toHaveText("Selected: PDF")

  for (const shortcut of ["F4", "ArrowDown", "ArrowUp", "Alt+ArrowDown", "Alt+ArrowUp"]) {
    await group.focus()
    await expect(group).toBeFocused()
    await page.keyboard.press(shortcut)
    await expect(arrow).toHaveAttribute("aria-expanded", "true")
    await expect(menu.getByRole("menuitem", { name: "Export spreadsheet" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
    await expect(arrow).toBeFocused()
    await expect(arrow).toHaveAttribute("aria-expanded", "false")
  }

  await page.keyboard.press("Space")
  await expect(menu.getByRole("menuitem", { name: "Export spreadsheet" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(arrow).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(menu.getByRole("menuitem", { name: "Export spreadsheet" })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(menu.getByRole("menuitem", { name: "Export CSV" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(result).toHaveText("Selected: CSV")
  await expect(arrow).toBeFocused()
  await primary.click()
  await expect(result).toHaveText("Selected: PDF")
  await arrow.click()
  await expect(menu).toBeVisible()
})

test("RTL keeps the arrow at inline-end with the same F4 behavior", async ({ page }) => {
  await page.goto("/index.html?dir=rtl#/split-button")
  const group = page.locator('main[data-docs-route="split-button"]').getByRole("group", { name: /^Export PDF/ })
  const arrow = group.getByRole("button", { name: "Open Menu" })
  await expect(group).toHaveCSS("direction", "rtl")
  const primary = await group.getByRole("button", { name: "Export PDF" }).boundingBox()
  expect((await arrow.boundingBox())!.x).toBeLessThan(primary!.x)
  await group.focus()
  await page.keyboard.press("F4")
  await expect(page.getByRole("menu", { name: "Export formats" })).toBeVisible()
})

test("slot styles preserve group and arrow semantics against extra props", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=split-button-customise")
  const cell = page.locator('[data-fixture="split-button-customise"]')
  const group = cell.getByRole("group", { name: /^Export PDF Split Button/ })
  await expect(group).toHaveAttribute("tabindex", "0")
  await expect(group.getByRole("button", { name: "Export PDF" })).toHaveClass(/\bexport-primary\b/)
  await expect(group.getByRole("button", { name: "Open Menu" })).toHaveClass(/\bexport-arrow\b/)
  await expect(group.getByRole("button", { name: "Open Menu" })).toHaveAttribute("aria-haspopup", "menu")
})

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  test(`H8 fixtures pass axe in both densities and directions (${theme})`, async ({ page }) => {
    test.setTimeout(120_000)
    for (const density of ["cozy", "compact"]) {
      for (const dir of ["ltr", "rtl"]) {
        await page.goto(`/index.html?fixtures&theme=${theme}&density=${density}&dir=${dir}`)
        await page.waitForSelector("html[data-ready=true]")
        const axe = new AxeBuilder({ page }).include('[data-fixture^="split-button-"], [data-fixture^="button-badge-"], [data-fixture^="numeric-input-"]')
        // The existing suite checks contrast in Morning Horizon; disabled opacity is an SAP token.
        if (theme === "sap_horizon") axe.exclude("[disabled]").exclude("[data-disabled]")
        else axe.disableRules(["color-contrast"])
        const results = await axe.analyze()
        expect(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(node => node.target) })), `${theme}, ${density}, ${dir}`).toEqual([])
      }
    }
  })
}
