import AxeBuilder from "@axe-core/playwright"
import { devices, expect, test, type Locator, type Page } from "@playwright/test"

const slot = (part: string) => `[data-slot="navigation-menu-${part}"]`
const fixture = '[data-fixture="navigation-menu-opener"]'
const menuLabel = "Additional Navigation Items"

async function openFixture(page: Page, dir: "ltr" | "rtl", native: boolean, locale?: string, center = false) {
  const query = new URLSearchParams({ dir, only: "navigation-menu-opener", ...(locale ? { locale } : {}) })
  await page.goto(`${native ? "/ui5.html?" : "/?fixtures&"}${query}`)
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator(fixture)
  if (center) await cell.evaluate((node) => { node.style.margin = "15rem 24rem" })
  const trigger = cell.getByRole("button", { name: "Navigate" })
  await trigger.click()
  const row = (text: string) => native
    ? page.locator(`${fixture} ui5-navigation-menu-item[text="${text}"] li`).first()
    : page.locator(slot("item")).filter({ has: page.locator(slot("text"), { hasText: new RegExp(`^${text}$`) }) })
  await expect(row("Home")).toBeFocused()
  return { row, trigger }
}

async function bounds(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

for (const dir of ["ltr", "rtl"] as const) {
  test(`live desktop ${dir} opens at inline end and aligns the nested surface`, async ({ browser }) => {
    const measures = []
    for (const native of [true, false]) {
      const page = await browser.newPage()
      try {
        const { row, trigger } = await openFixture(page, dir, native, undefined, true)
        const opener = await bounds(trigger)
        const root = native ? page.locator(`${fixture} .ui5-navigation-menu[open]`) : page.locator(`${slot("surface")}:not([data-submenu])`)
        const rootBox = await bounds(root)
        await page.keyboard.press("ArrowDown")
        const workspace = row("Workspace")
        await expect(workspace).toBeFocused()
        const owner = await bounds(workspace)
        await page.keyboard.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
        await expect(row("Settings")).toBeFocused()
        const child = await bounds(native ? page.locator(`${fixture} .ui5-menu-rp-sub-menu[open]`) : page.locator(`${slot("surface")}[data-submenu]`))
        measures.push({
          rootInline: dir === "rtl" ? opener.x - rootBox.x - rootBox.width : rootBox.x - opener.x - opener.width,
          rootCenter: rootBox.y + rootBox.height / 2 - opener.y - opener.height / 2,
          childInline: dir === "rtl" ? owner.x - child.x - child.width : child.x - owner.x - owner.width,
          childTop: child.y - owner.y,
          childWidth: child.width,
          childHeight: child.height,
        })
      } finally { await page.close() }
    }
    const [reference, actual] = measures
    for (const metric of Object.keys(reference) as (keyof typeof reference)[]) {
      expect(Math.abs(actual[metric] - reference[metric]), `${metric}: ${JSON.stringify(measures)}`).toBeLessThanOrEqual(1)
    }
  })
}

// UI5 2.28 text bundles: NavigationMenu.js, MenuItem.js, Dialog.js and icons/v4/nav-back.js.
const phoneLocales = [
  { locale: "en-US", dir: "ltr", menu: menuLabel, active: "Is Active", back: "Navigate Back", cancel: "Cancel", close: "Decline", regions: ["Header", "Content", "Footer"] },
  { locale: "de-DE", dir: "ltr", menu: "Weitere Navigationselemente", active: "Ist aktiv", back: "Zurück navigieren", cancel: "Abbrechen", close: "Ablehnen", regions: ["Kopfzeile", "Inhalt", "Fußzeile"] },
  { locale: "zh-CN", dir: "ltr", menu: "附加导航项目", active: "处于活动状态", back: "向后导航", cancel: "取消", close: "拒绝", regions: ["页眉", "内容", "页脚"] },
  { locale: "ar-EG", dir: "rtl", menu: "بنود التنقل الإضافية", active: "نشط", back: "التنقل للخلف", cancel: "إلغاء", close: "رفض", regions: ["المقدمة", "المحتوى", "التذييل"] },
] as const

for (const labels of phoneLocales) for (const native of [true, false]) {
  test(`${native ? "UI5" : "React"} phone ${labels.locale} names the dialog actions and can return from a submenu`, async ({ browser }) => {
    const context = await browser.newContext({ ...devices["Pixel 7"], locale: labels.locale })
    try {
      const page = await context.newPage()
      const { row, trigger } = await openFixture(page, labels.dir, native, labels.locale)
      // ResponsivePopoverTemplate forwards a name reference across a shadow boundary
      // on phones. The React dialog resolves that same title on its own host.
      const rootHost = page.locator(`${fixture} .ui5-navigation-menu`)
      const root = native ? rootHost.locator("ui5-dialog").getByRole("dialog") : page.getByRole("dialog", { name: labels.menu, exact: true })
      const decline = (native ? rootHost : root).getByRole("button", { name: labels.close, exact: true })
      await expect(decline).toBeVisible()
      if (native) {
        const tree = await root.ariaSnapshot()
        expect(tree).toMatch(/^- dialog:/)
        expect(tree).toContain(labels.menu)
      }
      await expect(row("Home")).toHaveAccessibleName(`Home ${labels.active}`)
      if (native) {
        const link = page.locator(`${fixture} ui5-navigation-menu-item[text=Home] a`)
        await expect(link).toHaveAccessibleName(`Home ${labels.active}`)
        await expect(link).not.toBeFocused()
      } else await expect(row("Home")).toHaveAttribute("tabindex", "0")
      await page.keyboard.press("ArrowDown")
      await expect(row("Workspace")).toBeFocused()
      const expand = labels.dir === "rtl" ? "ArrowLeft" : "ArrowRight"
      await page.keyboard.press(expand)
      await expect(row("Settings")).toBeFocused()
      await expect(row("Workspace")).toHaveAttribute("aria-expanded", "true")
      const nested = page.getByRole("dialog", { name: "Workspace", exact: true })
      const nestedHost = page.locator(`${fixture} ui5-navigation-menu-item[text=Workspace] .ui5-menu-rp-sub-menu`)
      const [header, content, footer] = labels.regions.map((name) => nested.getByRole("region", { name, exact: true }))
      // Playwright's scoped DOM selectors can't follow the native dialog's
      // assigned slots out of its shadow tree. Confirm region names on the
      // dialog and query the native slotted controls through their popup host.
      const back = (native ? nestedHost : header).getByRole("button", { name: labels.back, exact: true })
      const cancel = (native ? nestedHost : footer).getByRole("button", { name: labels.cancel, exact: true })
      for (const region of [header, content, footer]) await expect(region).toBeVisible()
      await expect((native ? nestedHost : content).getByRole("menu")).toBeVisible()
      await expect(back).toBeVisible()
      await expect(cancel).toBeVisible()
      await page.keyboard.press("ArrowDown")
      await expect(row("More")).toBeFocused()
      await back.click()
      await expect(nested).not.toBeVisible()
      await expect(row("Workspace")).toHaveAttribute("aria-expanded", "false")
      if (native) await row("Workspace").focus()
      await expect(row("Workspace")).toBeFocused()
      await page.keyboard.press(expand)
      await expect(row("Settings")).toBeFocused()
      await cancel.click()
      await expect(root).not.toBeVisible()
      await expect(trigger).toBeFocused()
      await trigger.click()
      await expect(decline).toBeVisible()
      await decline.click()
      await expect(root).not.toBeVisible()
      await expect(trigger).toBeFocused()
      if (!native) {
        await trigger.click()
        await expect(row("Home")).toBeFocused()
        await page.keyboard.press("ArrowDown")
        await expect(row("Workspace")).toBeFocused()
        await page.keyboard.press(expand)
        await expect(row("Settings")).toBeFocused()
        expect((await new AxeBuilder({ page }).include(slot("surface")).analyze()).violations).toEqual([])
        await row("Settings").click()
        await expect(page).toHaveURL(/#navigation-menu-settings$/)
        await expect(trigger).toBeFocused()
      }
    } finally { await context.close() }
  })
}

for (const dir of ["ltr", "rtl"] as const) for (const native of [true, false]) {
  test(`${native ? "UI5" : "React"} ${dir} roves through three levels and returns focus`, async ({ page }) => {
    const { row, trigger } = await openFixture(page, dir, native)
    const expand = dir === "rtl" ? "ArrowLeft" : "ArrowRight"
    const collapse = dir === "rtl" ? "ArrowRight" : "ArrowLeft"
    await row("Workspace").hover()
    // NavigationMenuTemplate leaves the root mouseover unwired.
    await expect(row("Home")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(row("Workspace")).toBeFocused()
    await page.keyboard.press(expand)
    await expect(row("Settings")).toBeFocused()
    await expect(row("Workspace")).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("ArrowDown")
    await expect(row("More")).toBeFocused()
    await page.keyboard.press(expand)
    await expect(row("Reporting")).toBeFocused()
    await page.keyboard.press(collapse)
    await expect(row("More")).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(row("Workspace")).toBeFocused()
    await page.keyboard.press("End")
    await expect(row("Archive")).toBeFocused()
    await expect(row("Archive")).toHaveAttribute("aria-disabled", "true")
    await page.keyboard.press("Tab")
    await expect(trigger).toBeFocused()
  })
}

test("native actions preserve href defaults, callback order and cancellation", async ({ page }) => {
  await page.goto("/#/navigation-menu")
  const demo = page.locator("#navigation-menu-demo")
  const trigger = demo.getByRole("button", { name: "Navigate" })
  const leaf = demo.getByRole("menuitem", { name: "Home Is Active" })
  const parent = demo.getByRole("menuitem", { name: "Workspace Is Active" })
  const result = demo.locator("output").first()
  await trigger.click()
  await expect(leaf).toBeFocused()
  await expect(leaf).toHaveAttribute("href", "#navigation-menu-home")
  await expect(leaf).toHaveAccessibleDescription("Tag New")
  await page.keyboard.press("Enter")
  await expect(result).toHaveText("item:Home root:Home")
  await expect(trigger).toBeFocused()
  await expect(page).not.toHaveURL(/#navigation-menu-home$/)
  await trigger.click()
  await expect(leaf).toBeFocused()
  await page.keyboard.press("Space")
  await expect(page).toHaveURL(/#navigation-menu-home$/)
  await expect(trigger).toBeFocused()
  await page.evaluate(() => history.replaceState(history.state, "", "#/navigation-menu"))
  await demo.getByRole("checkbox", { name: "Cancel link navigation" }).check()
  await trigger.click()
  await leaf.click()
  await expect(result).toHaveText("item:Home root:Home")
  await expect(trigger).toBeFocused()
  await expect(page).not.toHaveURL(/#navigation-menu-home$/)
  await trigger.click()
  await parent.click()
  await expect(result).toHaveText("item:Workspace root:Workspace")
  const child = demo.getByRole("menuitem", { name: "Settings Is Active" })
  await expect(child).toBeFocused()
  await child.click()
  await expect(page).toHaveURL(/#navigation-menu-settings$/)
  await expect(trigger).toBeFocused()
  await trigger.click()
  const external = demo.getByRole("menuitem", { name: "Help Is Active" })
  await expect(external).toHaveAttribute("target", "_blank")
  const newTab = page.waitForEvent("popup")
  await external.click()
  await (await newTab).close()
  await expect(trigger).toBeFocused()
})

test("open root and submenu are accessible", async ({ page }) => {
  const { row } = await openFixture(page, "ltr", false)
  const dialog = page.getByRole("dialog", { name: menuLabel })
  await expect(dialog.getByRole("menu")).toBeVisible()
  await expect(row("Home")).toHaveAccessibleName("Home Is Active")
  await expect(row("Home")).toHaveAccessibleDescription("Tag New")
  await expect(row("Workspace")).toHaveAttribute("aria-haspopup", "menu")
  await row("Workspace").click()
  const nested = page.getByRole("dialog", { name: "Workspace" })
  await expect(nested.getByRole("menu")).toBeVisible()
  await expect(row("Workspace")).toHaveAttribute("aria-controls", (await nested.getByRole("menu").getAttribute("id"))!)
  expect((await new AxeBuilder({ page }).include(slot("surface")).analyze()).violations).toEqual([])
})
