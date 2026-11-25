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
  await page.clock.install()
  await dialog.getByText("Open", { exact: true }).click()
  await expect(dialog.locator("[aria-live=polite][data-slot=select-dialog-announcement]")).toHaveText("Selected Items 1")
  const search = dialog.getByRole("searchbox", { name: "Search" })
  await search.fill("Closed")
  await expect(dialog.getByText("Open", { exact: true })).toHaveCount(0)
  await dialog.getByText("Closed", { exact: true }).click()
  const announcement = dialog.locator("[aria-live=polite][data-slot=select-dialog-announcement]")
  await expect(announcement).toHaveText("Selected Items 2")
  await page.clock.fastForward(3000)
  await expect(announcement).toHaveText("")
  await expect(dialog.getByText("Selected: 2")).toBeVisible()
  const confirm = dialog.getByRole("button", { name: "Select", exact: true })
  await expect(confirm).toHaveAccessibleDescription("Default Action")
  await confirm.click()
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

for (const direction of ["ltr", "rtl"]) test(`SelectDialog custom content keeps selection and keyboard ownership (${direction})`, async ({ page }) => {
  await page.goto(`/index.html?fixtures&ref=wcr&only=select-dialog-custom&dir=${direction}`)
  const row = page.getByText("In review", { exact: true }).locator("xpath=ancestor::li")
  await expect(row).toHaveAttribute("role", "listitem")
  await expect(row).not.toHaveAttribute("id", "foreign")
  await expect(row).not.toHaveAttribute("tabindex", "13")
  await row.focus()
  await page.keyboard.press("Space")
  await expect(row).toHaveAttribute("data-selected", "")
})

test("SelectDialog exposes the translated search, confirmation and selection summary", async ({ page: ours, context }) => {
  const wcr = await context.newPage()
  try {
    for (const [locale, direction, search, select, description, selected, active] of [
      ["de-DE", "ltr", "Suchen", "Auswählen", "Standardaktion", "Ausgewählt", "Ist aktiv"],
      ["zh-CN", "ltr", "搜索", "选择", "缺省操作", "已选择", "处于活动状态"],
      ["ar-EG", "rtl", "بحث", "تحديد", "الإجراء الافتراضي", "محدد", "نشط"],
    ]) {
      const query = `only=select-dialog-selected&locale=${locale}&dir=${direction}`
      await Promise.all([ours.goto(`/index.html?fixtures&ref=wcr&${query}`), wcr.goto(`/wcr.html?${query}`)])
      for (const page of [ours, wcr]) {
        await page.locator("html[data-ready=true]").waitFor({ state: "attached" })
        // The WCR dialog's native shadow <section> does not contain the slotted
        // controls in DOM containment, even though they are its AX descendants.
        const cell = page.locator('[data-fixture="select-dialog-selected"]')
        await expect(cell.getByRole("dialog", { name: "Select status", exact: true })).toBeVisible()
        await expect(cell.getByRole("searchbox", { name: search, exact: true })).toBeVisible()
        await expect(cell.getByRole("button", { name: select, exact: true })).toHaveAccessibleDescription(description)
        await expect(cell.getByText(`${selected}: 1`, { exact: true })).toBeVisible()
        await expect(cell.getByRole("listitem", { name: `Open ${active}`, exact: true })).toBeVisible()
      }
    }
  } finally {
    await wcr.close()
  }
})
