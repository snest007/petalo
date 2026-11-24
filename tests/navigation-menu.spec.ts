import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const slot = (part: string) => `[data-slot="navigation-menu-${part}"]`
const fixture = '[data-fixture="navigation-menu-opener"]'
const menuLabel = "Additional Navigation Items"

async function openFixture(page: Page, dir: "ltr" | "rtl", native: boolean) {
  await page.goto(`${native ? "/ui5.html?" : "/?fixtures&"}dir=${dir}&only=navigation-menu-opener`)
  await page.waitForSelector("html[data-ready=true]")
  const trigger = page.locator(fixture).getByRole("button", { name: "Navigate" })
  await trigger.click()
  const row = (text: string) => native
    ? page.locator(`${fixture} ui5-navigation-menu-item[text="${text}"] li`).first()
    : page.locator(slot("item")).filter({ has: page.locator(slot("text"), { hasText: new RegExp(`^${text}$`) }) })
  await expect(row("Home")).toBeFocused()
  return { row, trigger }
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
