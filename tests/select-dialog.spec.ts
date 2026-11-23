import { AxeBuilder } from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const demoUrl = "/#/select-dialog"
const output = "[data-docs-route=select-dialog] output"

test("SelectDialog single confirms one item and restores focus", async ({ page }) => {
  await page.goto(demoUrl)
  const opener = page.getByRole("button", { name: "Choose one status" })
  await opener.click()
  const dialog = page.getByRole("dialog", { name: "Select status" })
  await expect(dialog.getByText("Open", { exact: true }).locator("xpath=ancestor::li")).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(dialog.getByText("In review").locator("xpath=ancestor::li")).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(dialog).toHaveCount(0)
  await expect(page.locator(output)).toHaveText("In review")
  await expect(opener).toBeFocused()
})

test("SelectDialog retains filtered multi-selection, announces the count, clears and cancels", async ({ page }) => {
  await page.goto(demoUrl)
  const opener = page.getByRole("button", { name: "Choose several statuses" })
  await opener.click()
  const dialog = page.getByRole("dialog", { name: "Select status" })
  await dialog.getByText("Open", { exact: true }).click()
  await expect(dialog.locator("[aria-live=polite][data-slot=select-dialog-announcement]")).toHaveText("Selected Items 1")
  const search = dialog.getByRole("searchbox", { name: "Search" })
  await search.fill("Closed")
  await expect(dialog.getByText("Open", { exact: true })).toHaveCount(0)
  await dialog.getByText("Closed", { exact: true }).click()
  await expect(dialog.getByText("Selected: 2")).toBeVisible()
  await dialog.getByRole("button", { name: "Select", exact: true }).click()
  await expect(page.locator(output)).toHaveText("Open, Closed")
  await opener.click()
  await expect(search).toHaveValue("")
  await dialog.getByText("In review").click()
  await dialog.getByRole("button", { name: "Clear", exact: true }).click()
  await expect(dialog.getByText(/^Selected:/)).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(opener).toBeFocused()
  await expect(page.locator(output)).toHaveText("Open, Closed")
})

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  test(`SelectDialog axe ${theme}`, async ({ page }) => {
    for (const density of ["cozy", "compact"]) {
      for (const dir of ["ltr", "rtl"]) {
        await page.goto(`/index.html?fixtures&ref=wcr&only=select-dialog-selected&dir=${dir}&theme=${theme}&density=${density}`)
        await expect(page.getByRole("dialog", { name: "Select status" })).toBeVisible()
        const result = await new AxeBuilder({ page }).include("[data-select-dialog]").analyze()
        expect(result.violations).toEqual([])
      }
    }
  })
}

test("SelectDialog custom content keeps selection and keyboard ownership", async ({ page }) => {
  await page.goto("/index.html?fixtures&ref=wcr&only=select-dialog-custom")
  const row = page.getByText("In review", { exact: true }).locator("xpath=ancestor::li")
  await expect(row).toHaveAttribute("role", "listitem")
  await expect(row).not.toHaveAttribute("id", "foreign")
  await expect(row).not.toHaveAttribute("tabindex", "13")
  await row.focus()
  await page.keyboard.press("Space")
  await expect(row).toHaveAttribute("data-selected", "")
})
