import { expect, test } from "@playwright/test"

test("step keys, bounds, rollback and precision/range validation", async ({ page }) => {
  await page.goto("/index.html#/numeric-input")
  const demo = page.locator('main[data-docs-route="numeric-input"]')
  const field = demo.getByRole("textbox", { name: "Order quantity" })
  await field.focus()
  await expect(field).toHaveValue("5")
  await page.keyboard.press("ArrowUp")
  await expect(field).toHaveValue("6")
  await page.keyboard.press("Escape")
  await expect(field).toHaveValue("5")
  await page.keyboard.press("Shift+PageUp")
  await expect(field).toHaveValue("10")
  await page.keyboard.press("ArrowUp")
  await expect(field).toHaveValue("10")
  await page.keyboard.press("Enter")
  await page.keyboard.press("Control+Shift+ArrowDown")
  await expect(field).toHaveValue("0")
  await page.keyboard.press("Escape")
  await expect(field).toHaveValue("10")
  await field.fill("11")
  await page.keyboard.press("Enter")
  await expect(field).toHaveValue("11")
  await expect(field).toHaveAttribute("aria-invalid", "true")
  await expect(field).toHaveAccessibleDescription("Value State Error Invalid entry")
  await expect(demo.getByRole("status").filter({ hasText: "Invalid entry" })).toBeVisible()
  await field.fill("7")
  await demo.getByRole("textbox", { name: "Unit price" }).focus()
  await expect(field).not.toHaveAttribute("aria-invalid")
  await expect(field).toHaveValue("7")
})

test("German provider formats, parses and validates fractional digits", async ({ page }) => {
  await page.goto("/index.html#/numeric-input")
  const field = page.locator('main[data-docs-route="numeric-input"]').getByRole("textbox", { name: "Unit price" })
  await expect(field).toHaveValue("1.234,50")
  await field.fill("2.345,6")
  await page.keyboard.press("Enter")
  await expect(field).toHaveAttribute("aria-invalid", "true")
  await expect(field).toHaveValue("2.345,6")
  await field.fill("2.345,60")
  await page.keyboard.press("Enter")
  await expect(field).not.toHaveAttribute("aria-invalid")
  await page.keyboard.press("ArrowDown")
  await expect(field).toHaveValue("2.345,35")
})

test("slot styles preserve the native textbox and validation ownership", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=numeric-input-customise")
  const cell = page.locator('[data-fixture="numeric-input-customise"]')
  const field = cell.getByRole("textbox", { name: "Order quantity" })
  await expect(field).toHaveClass(/\bquantity-input\b/)
  await expect(field).not.toHaveAttribute("aria-invalid")
  await expect(field).not.toHaveAttribute("tabindex")
  await expect(cell.locator('[data-slot="numeric-input-field"]')).toHaveClass(/\bquantity-field\b/)
})

for (const locale of ["de-DE", "zh-CN", "ar-EG"]) {
  test(`NumericInput displays the same localized decimals as UI5 (${locale})`, async ({ browser, baseURL }) => {
    const direction = locale === "ar-EG" ? "rtl" : "ltr"
    const contexts = await Promise.all([browser.newContext({ locale }), browser.newContext({ locale })])
    try {
      const [react, ui5] = await Promise.all(contexts.map(context => context.newPage()))
      const suffix = `only=numeric-input-decimal&locale=${locale}&dir=${direction}`
      await Promise.all([react.goto(`${baseURL}/index.html?fixtures&${suffix}`), ui5.goto(`${baseURL}/ui5.html?${suffix}`)])
      await Promise.all([react, ui5].map(page => page.waitForSelector("html[data-ready=true]")))
      const field = ui5.getByRole("textbox", { name: "Order quantity" })
      await expect(react.getByRole("textbox", { name: "Order quantity" })).toHaveValue(await field.inputValue())
    } finally { await Promise.all(contexts.map(context => context.close())) }
  })
}
