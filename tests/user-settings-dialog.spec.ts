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
  const languagePanelId = await language.getAttribute("aria-controls")
  const regionPanelId = await region.getAttribute("aria-controls")
  expect(languagePanelId).toBeTruthy()
  expect(regionPanelId).toBeTruthy()
  expect(regionPanelId).not.toBe(languagePanelId)
  await expect(dialog(page).locator(`[id="${regionPanelId}"]`)).toHaveAttribute("role", "tabpanel")
  await language.focus()
  await expect(language).toBeFocused()
  await language.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
  await expect(region).toBeFocused()
  await region.press("Enter")
  await expect(region).toHaveAttribute("aria-selected", "true")
  await expect(dialog(page).getByRole("tabpanel", { name: "Region" })).toHaveAttribute("id", regionPanelId!)
  await expect(dialog(page).getByRole("button", { name: "Change region" })).toBeVisible()

  const search = dialog(page).getByRole("searchbox", { name: "Search" })
  await search.fill("Account")
  await expect(item(page, "Account")).toBeVisible()
  await expect(announcement(page)).toHaveText("1 result available")
  await search.fill("missing")
  await expect(dialog(page).getByText("No search results", { exact: true }).first()).toBeVisible()
  await expect(announcement(page)).toHaveText("No search results")
  await search.fill("")
  await expect(announcement(page)).toHaveText("5 results are available")
  const audit = await new AxeBuilder({ page }).include('[data-slot="user-settings-dialog"]').analyze()
  expect(audit.violations.map(violation => violation.id)).toEqual([])
  await search.press("Escape")
  await expect(dialog(page)).toHaveCount(0)
  await expect(opener(page)).toBeFocused()
})

for (const dir of ["ltr", "rtl"]) test(`notification switches and secondary navigation keep ownership in ${dir}`, async ({ page }) => {
  await page.goto(`/?dir=${dir}#/user-settings-dialog`)
  await opener(page).click()
  await item(page, "Notifications").click()
  const sheet = dialog(page)
  const root = sheet.getByRole("list", { name: "List of Notification Types", exact: true })
  const email = root.getByRole("listitem", { name: /^Email Account updates/ })
  const emailSwitch = email.getByRole("switch", { name: "Email Account updates", exact: true })
  const heading = sheet.getByRole("heading", { name: "Notifications", exact: true })
  const back = sheet.getByRole("button", { name: "Navigate Back" })
  await expect(emailSwitch).toBeChecked()
  await email.focus()
  await expect(email).toBeFocused()
  await email.press("Control+Space")
  await expect(emailSwitch).toBeChecked()
  await email.press("Space")
  await expect(emailSwitch).not.toBeChecked()
  await expect(heading).toBeVisible()
  await email.press("F2")
  await expect(emailSwitch).toBeFocused()
  await emailSwitch.press("Shift+Enter")
  await expect(emailSwitch).not.toBeChecked()
  await emailSwitch.press("Space")
  await expect(emailSwitch).toBeChecked()
  await emailSwitch.click()
  await expect(emailSwitch).not.toBeChecked()
  await expect(heading).toBeVisible()

  const custom = sheet.getByRole("button", { name: "Preview delivery" })
  const header = sheet.getByRole("group", { name: "Delivery options" })
  await custom.click()
  await expect(heading).toBeVisible()
  await expect(header.getByRole("switch")).toHaveCount(0)
  const push = root.getByRole("listitem", { name: /^Push/ })
  await push.focus()
  await expect(push).toBeFocused()
  await push.press("Enter")
  await expect(heading).toBeVisible()

  await email.focus()
  await expect(email).toBeFocused()
  await email.press("Enter")
  await expect(sheet.getByRole("heading", { name: "Email preferences" })).toBeVisible()
  const preferences = sheet.getByRole("list", { name: "List of Notification Preferences", exact: true })
  const mentions = preferences.getByRole("listitem", { name: /^Mentions/ })
  await expect(mentions).toBeFocused()
  await mentions.press("Space")
  await expect(mentions.getByRole("switch", { name: "Mentions" })).toBeChecked()
  await back.click()
  await expect(email).toBeFocused()
  await expect(emailSwitch).not.toBeChecked()

  const digest = root.getByRole("listitem", { name: /^Digest/ })
  await digest.click()
  await expect(sheet.getByRole("heading", { name: "Digest", exact: true })).toBeVisible()
  await expect(mentions.getByRole("switch", { name: "Mentions" })).toBeChecked()
  await back.click()
  await expect(digest).toBeFocused()
  await header.focus()
  await expect(header).toBeFocused()
  await header.press("F2")
  await expect(custom).toBeFocused()
  await custom.press("Enter")
  await expect(heading).toBeVisible()
  await custom.press("F2")
  await expect(header).toBeFocused()
  await header.press("Enter")
  await expect(sheet.getByRole("heading", { name: "Delivery options", exact: true })).toBeVisible()
  await back.click()
  await expect(header).toBeFocused()
  const audit = await new AxeBuilder({ page }).include('[data-slot="user-settings-dialog"]').analyze()
  expect(audit.violations.map(violation => violation.id)).toEqual([])
})

for (const [locale, primary, secondary] of [
  ["de-DE", "Liste der Benachrichtigungstypen", "Liste der Benachrichtigungseinstellungen"],
  ["zh-CN", "通知类型列表", "通知首选项列表"],
  ["ar-EG", "قائمة أنواع الإشعارات", "قائمة تفضيلات الإشعارات"],
]) test(`matches native notification list names in ${locale}`, async ({ browser }) => {
  const dir = locale === "ar-EG" ? "rtl" : "ltr"
  const ours = await browser.newPage(), reference = await browser.newPage()
  try {
    for (const [view, name] of [["primary", primary], ["secondary", secondary]]) {
      const id = `user-settings-dialog-notifications-${view}`
      const query = `locale=${locale}&dir=${dir}&only=${id}`
      await Promise.all([ours.goto(`/?fixtures&${query}`), reference.goto(`/ui5.html?${query}`)])
      await Promise.all([ours, reference].map(async page => {
        await page.waitForSelector("html[data-ready=true]")
        await expect(page.locator(`[data-fixture="${id}"]`).getByRole("list", { name, exact: true })).toBeVisible()
      }))
    }
  } finally {
    await Promise.all([ours.close(), reference.close()])
  }
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

for (const dir of ["ltr", "rtl"]) {
  for (const native of [true, false]) test(`${native ? "UI5" : "Petalo"} keeps an edited appearance choice across categories in ${dir}`, async ({ page }) => {
    const caseName = "user-settings-dialog-appearance"
    const route = native ? "/ui5.html?" : "/?fixtures&"
    await page.goto(`${route}only=${caseName}&dir=${dir}`)
    await page.waitForSelector("html[data-ready=true]")
    const cell = page.locator(`[data-fixture="${caseName}"]`)
    const evening = cell.getByRole("listitem", { name: /^Evening Horizon/ })
    const general = cell.getByRole("listitem", { name: /^General/ })
    const appearance = cell.getByRole("listitem", { name: /^Appearance/ })
    await expect(evening).toHaveAccessibleDescription("Not Selected")
    await evening.click()
    await expect(evening).toHaveAccessibleDescription("Selected")
    await general.click()
    await expect(cell.getByRole("heading", { name: "General preferences" })).toBeVisible()
    await expect(evening).toHaveCount(0)
    await appearance.click()
    await expect(cell.getByRole("heading", { name: "Appearance" })).toBeVisible()
    await expect(evening).toHaveAccessibleDescription("Selected")
  })

  test(`retains the edited appearance choice and category focus on narrow Back in ${dir}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/?dir=${dir}#/user-settings-dialog`)
    await opener(page).click()
    const appearance = item(page, "Appearance")
    await appearance.click()
    const evening = item(page, "Evening Horizon")
    await evening.click()
    await expect(evening).toHaveAccessibleDescription("Selected")
    await dialog(page).getByRole("button", { name: "Navigate Back" }).click()
    await expect(appearance).toBeFocused()
    await expect(evening).toHaveCount(0)
    await appearance.press("Enter")
    await expect(evening).toHaveAccessibleDescription("Selected")
  })
}

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
