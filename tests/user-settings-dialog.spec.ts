import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const demo = (page: Page) => page.locator("#user-settings-dialog-demo")
const opener = (page: Page) => demo(page).getByRole("button", { name: "Open user settings" })
const dialog = (page: Page) => page.getByRole("dialog", { name: "User Settings", exact: true })
const item = (page: Page, name: string) => dialog(page).getByRole("listitem", { name: new RegExp(name) })
const announcement = (page: Page) => dialog(page).locator('[data-slot="user-settings-announcement"]')

for (const dir of ["ltr", "rtl"]) test(`names, navigates and announces the user settings in ${dir}`, async ({ page }) => {
  await page.goto(`/?dir=${dir}#/user-settings-dialog`)
  await opener(page).click()
  await expect(dialog(page)).toBeVisible()
  const general = item(page, "General"), account = item(page, "Account")
  await expect(general).toBeFocused()
  await general.press("ArrowDown")
  await expect(account).toBeFocused()
  await account.press("Enter")
  await expect(dialog(page).getByRole("heading", { name: "Account" })).toBeVisible()
  await expect(dialog(page).getByRole("button", { name: "Manage Account" })).toBeVisible()
  await general.click()

  const language = dialog(page).getByRole("tab", { name: "Language" })
  const region = dialog(page).getByRole("tab", { name: "Region" })
  await language.focus()
  await expect(language).toBeFocused()
  await language.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
  await expect(region).toBeFocused()
  await region.press("Enter")
  await expect(region).toHaveAttribute("aria-selected", "true")
  await expect(dialog(page).getByRole("button", { name: "Change region" })).toBeVisible()

  const search = dialog(page).getByRole("searchbox", { name: "Search" })
  await search.fill("Account")
  await expect(item(page, "Account")).toBeVisible()
  await expect(announcement(page)).toHaveText("1 result available")
  await search.fill("missing")
  await expect(dialog(page).getByText("No search results", { exact: true }).first()).toBeVisible()
  await expect(announcement(page)).toHaveText("No search results")
  await search.fill("")
  await expect(announcement(page)).toHaveText("4 results are available")
  const audit = await new AxeBuilder({ page }).include('[data-slot="user-settings-dialog"]').analyze()
  expect(audit.violations.map(violation => violation.id)).toEqual([])
  await search.press("Escape")
  await expect(dialog(page)).toHaveCount(0)
  await expect(opener(page)).toBeFocused()
})

for (const dir of ["ltr", "rtl"]) test(`drills into a setting and returns focus in ${dir}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/?dir=${dir}#/user-settings-dialog`)
  await opener(page).click()
  await expect(item(page, "General")).toBeFocused()
  const account = item(page, "Account")
  await account.click()
  await expect(account).toHaveCount(0)
  const manage = dialog(page).getByRole("button", { name: "Manage Account" })
  await expect(manage).toBeFocused()
  await dialog(page).getByRole("button", { name: "Navigate Back" }).click()
  await expect(account).toBeFocused()
  await dialog(page).getByRole("button", { name: "Close", exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(opener(page)).toBeFocused()
})

test("UserMenu hands off Settings and the settings dialog returns focus to the profile", async ({ page }) => {
  await page.goto("/#/user-menu")
  const profile = page.locator("#user-menu-demo-open")
  await profile.click()
  const menu = page.getByRole("dialog", { name: "User menu for John Doe" })
  const settings = menu.getByRole("menuitem", { name: "Settings" })
  await expect(settings).toBeFocused()
  await settings.press("Enter")
  await expect(menu).toHaveCount(0)
  await expect(item(page, "General")).toBeFocused()
  await dialog(page).getByRole("button", { name: "Close", exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(profile).toBeFocused()
})

for (const [locale, name, manage, close] of [
  ["de-DE", "Benutzereinstellungen", "Konto verwalten", "Schließen"],
  ["zh-CN", "用户设置", "管理账户", "关闭"],
  ["ar-EG", "إعدادات المستخدم", "إدارة الحساب", "إغلاق"],
]) test(`matches native dialog and account labels in ${locale}`, async ({ browser }) => {
  const dir = locale === "ar-EG" ? "rtl" : "ltr"
  const query = `locale=${locale}&dir=${dir}&only=user-settings-dialog-account`
  const ours = await browser.newPage(), reference = await browser.newPage()
  try {
    await Promise.all([ours.goto(`/?fixtures&${query}`), reference.goto(`/ui5.html?${query}`)])
    await Promise.all([ours, reference].map(async page => {
      await page.waitForSelector("html[data-ready=true]")
      const cell = page.locator('[data-fixture="user-settings-dialog-account"]')
      await expect(cell.getByRole("dialog", { name, exact: true })).toBeVisible()
      // Native Account is slotted from outside the inner Dialog's shadow host.
      await expect(cell.getByRole("button", { name: manage, exact: true })).toBeVisible()
      await expect(cell.getByRole("button", { name: close, exact: true })).toBeVisible()
    }))
  } finally {
    await Promise.all([ours.close(), reference.close()])
  }
})
