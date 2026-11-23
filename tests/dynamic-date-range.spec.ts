import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const name = "Dynamic Date Range"

for (const dir of ["ltr", "rtl"]) {
  test(`DynamicDateRange opens, selects a preset and returns focus in ${dir}`, async ({ page }) => {
    await page.goto(`/?dir=${dir}#/dynamic-date-range`)
    const field = page.getByRole("textbox", { name: "Period", exact: true })
    await field.press("F4")
    const dialog = page.getByRole("dialog", { name })
    await expect(dialog.getByText("Today", { exact: true }).locator("xpath=ancestor::li")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(dialog.getByText("Yesterday", { exact: true }).locator("xpath=ancestor::li")).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(field).toHaveValue("Yesterday")
    await expect(field).toBeFocused()
    await field.press("Alt+ArrowDown")
    await expect(dialog).toBeVisible()
    await dialog.getByText("Date", { exact: true }).click()
    await expect(dialog.getByRole("button", { name: "Navigate Back" })).toBeFocused()
    await dialog.getByRole("button", { name: "Navigate Back" }).click()
    await expect(dialog.getByText("Date", { exact: true }).locator("xpath=ancestor::li")).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(field).toBeFocused()
  })
}

test("DynamicDateRange parses a typed expression and permits a registered preset", async ({ page }) => {
  await page.goto("/#/dynamic-date-range")
  const field = page.getByRole("textbox", { name: "Period", exact: true })
  await field.fill("Next 8 Weeks")
  await field.press("Enter")
  await expect(page.getByRole("status", { name: "Selected date expression" })).toHaveText("NEXTWEEKS")
  const custom = page.getByRole("textbox", { name: "Activity period" })
  await expect(custom).toHaveValue("Yesterday and today")
  await custom.press("F4")
  const dialog = page.getByRole("dialog", { name })
  await dialog.getByText("Today", { exact: true }).click()
  await expect(custom).toHaveValue("Today")
  await custom.press("F4")
  await dialog.getByText("Yesterday and today", { exact: true }).click()
  await expect(custom).toHaveValue("Yesterday and today")
})

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  test(`DynamicDateRange axe ${theme}`, async ({ page }) => {
    for (const density of ["cozy", "compact"]) {
      for (const dir of ["ltr", "rtl"]) {
        await page.goto(`/index.html?fixtures&only=dynamic-date-range-options&dir=${dir}&theme=${theme}&density=${density}`)
        await expect(page.getByRole("dialog", { name })).toBeVisible()
        const result = await new AxeBuilder({ page }).include('[aria-label="Dynamic Date Range"]').analyze()
        expect(result.violations).toEqual([])
      }
    }
  })
}
