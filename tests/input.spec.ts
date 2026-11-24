import { expect, test } from "@playwright/test"


test("input: sap_horizon pointer origin and canceled pointer preserve keyboard reentry", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=input-value&theme=sap_horizon")
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="input-value"]')
  const target = cell.locator('input').first()
  const owner = cell.locator('[data-slot="input"]').first()
  const painted = () => owner.evaluate((node) => {
    const css = getComputedStyle(node, "::after")
    return !["none", "normal"].includes(css.content) && css.display !== "none" && css.borderTopStyle !== "none" && Number.parseFloat(css.borderTopWidth) > 0
  })
  await target.click()
  await expect(target).toBeFocused()
  expect(await painted()).toBe(false)
  await cell.evaluate((node) => {
    const before = document.createElement("button"); before.id = "input-e4-before"; before.textContent = "Before field"
    node.before(before); before.focus()
  })
  const before = page.locator("#input-e4-before")
  await expect(before).toBeFocused()
  // A canceled pointer action changes modality without moving focus. The next
  // real Tab must independently restore keyboard origin before field reentry.
  await before.hover()
  await page.mouse.down(); await page.mouse.up()
  await page.keyboard.press("Tab")
  await expect(target).toBeFocused()
  expect(await painted()).toBe(true)
})

test("input: sap_horizon_hcb pointer origin and canceled pointer preserve keyboard reentry", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=input-value&theme=sap_horizon_hcb")
  await page.waitForSelector("html[data-ready=true]")
  const cell = page.locator('[data-fixture="input-value"]')
  const target = cell.locator('input').first()
  const owner = cell.locator('[data-slot="input"]').first()
  const painted = () => owner.evaluate((node) => {
    const css = getComputedStyle(node, "::after")
    return !["none", "normal"].includes(css.content) && css.display !== "none" && css.borderTopStyle !== "none" && Number.parseFloat(css.borderTopWidth) > 0
  })
  await target.click()
  await expect(target).toBeFocused()
  expect(await painted()).toBe(false)
  await cell.evaluate((node) => {
    const before = document.createElement("button"); before.id = "input-e4-before"; before.textContent = "Before field"
    node.before(before); before.focus()
  })
  const before = page.locator("#input-e4-before")
  await expect(before).toBeFocused()
  // A canceled pointer action changes modality without moving focus. The next
  // real Tab must independently restore keyboard origin before field reentry.
  await before.hover()
  await page.mouse.down(); await page.mouse.up()
  await page.keyboard.press("Tab")
  await expect(target).toBeFocused()
  expect(await painted()).toBe(true)
})


test("Input honors pointer and keyboard origin when an external action focuses it", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=input-value")
  await page.waitForSelector("html[data-ready=true]")
  const input = page.locator('[data-fixture="input-value"] input')
  await input.evaluate((node) => {
    const action = document.createElement("button"); action.id = "input-e4-external-focus"; action.textContent = "Focus input"
    action.addEventListener("click", () => node.focus()); node.closest('[data-fixture]')!.before(action)
  })
  const action = page.locator("#input-e4-external-focus")
  const painted = () => input.evaluate((node) => !["none", "normal"].includes(getComputedStyle(node.closest('[data-slot="input"]')!, "::after").content))
  await action.click()
  await expect(input).toBeFocused()
  expect(await painted()).toBe(false)
  await action.focus()
  await expect(action).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(input).toBeFocused()
  expect(await painted()).toBe(true)
})


for (const channel of ["name", "name-ref", "description", "description-ref"]) test(`Input ${channel} reaches the same native textbox as UI5`, async ({ browser }) => {
  const ours = await browser.newPage(), native = await browser.newPage()
  try {
    for (const [index, page] of [ours, native].entries()) {
      await page.goto(`/${index ? "ui5" : "index"}.html?${index ? "" : "fixtures&"}only=input-a11y-${channel}`)
      await page.waitForSelector("html[data-ready=true]")
      const input = page.locator(`[data-fixture="input-a11y-${channel}"]`).getByRole("textbox")
      await input.focus()
      await expect(input).toBeFocused()
      await expect(input).toHaveValue("SAP SE")
      if (channel.startsWith("name")) await expect(input).toHaveAccessibleName("Supplier identifier")
      else await expect(input).toHaveAccessibleDescription("Use the supplier number")
    }
  } finally { await Promise.all([ours.close(), native.close()]) }
})

for (const dir of ["ltr", "rtl"] as const) {
  test(`input suggestions ${dir}: preview, type ahead, selection and free text`, async ({ page }) => {
    await page.goto("/#/input")
    const demo = page.locator("#input-suggestions-demo")
    await demo.evaluate((element, direction) => { element.setAttribute("dir", direction) }, dir)
    const input = demo.getByRole("textbox", { name: "Shipping city" })
    await input.pressSequentially("be")
    await expect(input).toHaveValue("berlin")
    await expect.poll(() => input.evaluate((input: HTMLInputElement) => [input.selectionStart, input.selectionEnd])).toEqual([2, 6])
    const popup = demo.getByRole("dialog", { name: "Available Values" })
    const listbox = popup.getByRole("listbox", { name: "Contains Selectable Items" })
    const groupHeader = listbox.getByRole("group", { name: "Europe", exact: true })
    await expect(groupHeader).toHaveAttribute("aria-roledescription", "Group Header")
    await expect(listbox.getByRole("option")).toHaveCount(2)
    await expect(listbox.locator("b")).toHaveText(["Be", "Be"])
    await input.press("ArrowUp")
    await expect(demo.locator('[data-slot="input-demo-preview"]')).toHaveText("Europe")
    await input.press("ArrowDown")
    await expect(input).toHaveValue("Berlin")
    await expect(demo.getByRole("status").filter({ hasText: "Matching city" })).toHaveText("DE Matching city 1 of 2")
    await input.press("End")
    await expect(listbox.getByRole("option", { name: "Bern CH" })).toHaveAttribute("aria-selected", "true")
    await input.press("Enter")
    await expect(popup).toBeHidden()
    await expect(input).toHaveValue("Bern")
    await expect(input).toBeFocused()
    await expect(demo.locator('[data-slot="input-demo-selection"]')).toHaveText("Bern")
    await input.fill("New city")
    await expect(popup).toBeHidden()
    await expect(input).toHaveValue("New city")
  })
}

test("input suggestions: Escape restores typed text and pointer accepts the option", async ({ page }) => {
  await page.goto("/#/input")
  const demo = page.locator("#input-suggestions-demo")
  const input = demo.getByRole("textbox", { name: "Shipping city" })
  await input.fill("B")
  await expect(input).toHaveValue("Berlin")
  await input.press("Escape")
  await expect(input).toHaveValue("B")
  await expect(demo.getByRole("dialog")).toBeHidden()
  await input.fill("Be")
  await demo.getByRole("option", { name: "Bern CH" }).click()
  await expect(input).toHaveValue("Bern")
  await expect(input).toBeFocused()
})

test("input suggestions: phone edits live and Cancel restores the opening value", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true })
  try {
    await page.goto("/#/input")
    await page.locator("html").evaluate((element) => { element.dataset.fioriDevice = "phone" })
    const demo = page.locator("#input-suggestions-demo")
    const input = demo.getByRole("textbox", { name: "Shipping city" })
    await input.tap()
    const popup = demo.getByRole("dialog", { name: "Available Values" })
    const editor = popup.getByRole("textbox", { name: /Shipping city/ })
    await expect(popup).toHaveCSS("width", "375px")
    await expect(editor).toBeFocused()
    await editor.fill("Be")
    await expect(popup.getByRole("option")).toHaveCount(2)
    await popup.getByRole("button", { name: "Cancel" }).tap()
    await expect(popup).toBeHidden()
    await expect(input).toHaveValue("")
    await input.tap()
    await editor.fill("New city")
    await popup.getByRole("button", { name: "OK" }).tap()
    await expect(popup).toBeHidden()
    await expect(input).toHaveValue("New city")
  } finally { await page.close() }
})
