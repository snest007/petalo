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

test("DynamicDateRange resolves the field name at the native input", async ({ page }) => {
  await page.goto("/#/dynamic-date-range")
  const field = page.locator("input#dynamic-date-range-period")
  await expect(field).toHaveAttribute("aria-labelledby", "dynamic-date-range-label")
  await expect(field).toHaveAccessibleName("Period")
  await field.press("F4")
  const dialog = page.getByRole("dialog", { name })
  await dialog.getByText("Date", { exact: true }).click()
  const header = dialog.getByRole("heading", { name: "Date", level: 2 })
  await expect(header).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Submit" })).toHaveAccessibleDescription("Default Action")
  await expect(dialog.getByRole("button", { name: "Navigate Back" })).toBeFocused()
})

test("DynamicDateRange date-time editor switches to the Time view after picking a date", async ({ page }) => {
  await page.goto("/#/dynamic-date-range")
  const field = page.getByRole("textbox", { name: "Period", exact: true })
  await field.press("F4")
  const dialog = page.getByRole("dialog", { name })
  await dialog.getByText("From (Date Time)", { exact: true }).click()
  const toggle = dialog.getByRole("listbox", { name: "Date / Time" })
  await expect(toggle.getByRole("option", { name: "Date" })).toHaveAttribute("aria-selected", "true")
  await dialog.getByRole("grid").getByRole("gridcell").filter({ hasText: /^15$/ }).click()
  await expect(toggle.getByRole("option", { name: "Time" })).toHaveAttribute("aria-selected", "true")
  await expect(dialog.getByRole("spinbutton", { name: "Hours" })).toBeVisible()
  await expect(dialog.locator('[data-slot="dynamic-date-range-preview"]')).toContainText("Selected: From")
})

for (const dir of ["ltr", "rtl"]) {
  test(`DynamicDateRange ${dir} keeps named amount, unit and range controls interactive`, async ({ page }) => {
    await page.goto(`/?dir=${dir}#/dynamic-date-range`)
    const demo = page.locator("#dynamic-date-range-demo")
    const field = demo.getByRole("textbox", { name: "Period", exact: true })
    const dialog = page.getByRole("dialog", { name })
    await field.press("F4")
    await dialog.getByRole("listitem", { name: /Last X Days/ }).click()
    const amount = dialog.getByRole("spinbutton", { name: "Value for X" })
    await expect(amount).toHaveAttribute("aria-valuemin", "1")
    await expect(amount).toHaveAttribute("aria-valuemax", "9999")
    await amount.press("ArrowUp")
    await expect(amount).toHaveValue("2")
    await dialog.getByRole("button", { name: "Increase", exact: true }).click()
    await expect(amount).toHaveValue("3")
    const unit = dialog.getByRole("combobox", { name: "Unit of Time" })
    await unit.press("Enter")
    await page.getByRole("option", { name: "Weeks", exact: true }).click()
    await expect(unit).toHaveText("Weeks")
    await dialog.getByRole("button", { name: "Submit" }).click()
    await expect(field).toHaveValue("Last 3 Weeks")
    await expect(field).toBeFocused()

    await field.press("F4")
    await dialog.getByRole("listitem", { name: /From \/ To \(Date and Time\)/ }).click()
    for (const label of ["From", "To"]) {
      const endpoint = dialog.getByRole("textbox", { name: label, exact: true })
      await endpoint.focus()
      await expect(endpoint).toBeFocused()
      await expect(endpoint).toHaveAttribute("aria-haspopup", "grid")
    }
    await expect(dialog.getByRole("button", { name: "Open Picker", exact: true })).toHaveCount(2)
    expect((await new AxeBuilder({ page }).include('[aria-label="Dynamic Date Range"]').analyze()).violations).toEqual([])
    await page.keyboard.press("Escape")
    await expect(field).toBeFocused()
  })

  for (const native of [true, false]) {
    test(`DynamicDateRange ${native ? "UI5" : "React"} ${dir} announces a picked day in the open editor`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(2026, 10, 18, 12))
      await page.goto(native ? `/ui5.html?only=dynamic-date-range-date&dir=${dir}` : `/?dir=${dir}#/dynamic-date-range`)
      await page.waitForSelector("html[data-ready=true]")
      const owner = page.locator(native ? '[data-fixture="dynamic-date-range-date"]' : "#dynamic-date-range-demo")
      const field = owner.getByRole("textbox", { name: "Period", exact: true })
      await field.press("F4")
      const dialog = page.getByRole("dialog", { name })
      const popup = native ? owner.locator("ui5-responsive-popover[open]") : dialog
      await expect(dialog).toBeVisible()
      await popup.getByRole("listitem", { name: /^Date Navigation/ }).click()
      const grid = popup.getByRole("grid")
      const target = grid.getByRole("gridcell", { name: /November 20, 2026/ })
      await target.press("Enter")
      await expect(target).toHaveAttribute("aria-selected", "true")
      const announcement = native
        ? page.locator(".ui5-invisiblemessage-assertive").filter({ hasText: /^Selected$/ })
        : dialog.locator('[data-slot="calendar-announcement"]')
      await expect(announcement).toHaveAttribute("aria-live", "assertive")
      await expect(announcement).toHaveText("Selected")
      await target.press("Shift+F4")
      await expect(popup.getByRole("gridcell", { name: "2027", exact: true })).toBeVisible()
      await popup.getByRole("button", { name: "Submit", exact: true }).click()
      await expect(field).toBeFocused()
    })
  }
}
