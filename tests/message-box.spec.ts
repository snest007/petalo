import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("message box: initial focus, modal Tab loop, Escape result and focus return", async ({ page }) => {
  await page.goto("/#/message-box")
  const opener = page.getByRole("button", { name: "Review order" })
  await opener.click()
  const box = page.getByRole("alertdialog", { name: "Confirmation Submit this order for approval?" })
  const cancel = box.getByRole("button", { name: "Cancel" })
  const ok = box.getByRole("button", { name: "OK" })
  await expect(cancel).toBeFocused()
  await cancel.press("Tab")
  await expect(ok).toBeFocused()
  await ok.press("Escape")
  await expect(box).toBeHidden()
  await expect(opener).toBeFocused()
  await expect(page.locator('main[data-docs-route="message-box"] output')).toHaveText("Dismissed")
})

test("message box: imperative Promise resolves with the chosen action", async ({ page }) => {
  await page.goto("/#/message-box")
  const opener = page.getByRole("button", { name: "Delete draft" })
  await opener.click()
  const box = page.getByRole("alertdialog", { name: "Warning" })
  await expect(box.getByRole("button", { name: "Cancel" })).toBeFocused()
  await box.getByRole("button", { name: "Delete" }).click()
  await expect(box).toBeHidden()
  await expect(page.locator('main[data-docs-route="message-box"] output')).toHaveText("Delete")
  await expect(opener).toBeFocused()
})

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  for (const density of ["cozy", "compact"]) {
    test(`message box and input suggestion axe ${theme} ${density}`, async ({ page, browser }) => {
      for (const [ref, id, dir] of [["wcr", "message-box-confirm", "ltr"], ["wcr", "message-box-custom-rtl", "rtl"],
        ["ui5", "input-suggestions-grouped-rtl", "rtl"], ["ui5", "input-suggestions-state", "ltr"]]) {
        await page.goto(`/index.html?fixtures&ref=${ref}&only=${id}&theme=${theme}&density=${density}&dir=${dir}`)
        await page.waitForSelector("html[data-ready=true]")
        const scope = `[data-fixture="${id}"]`
        await expect(page.locator(scope)).toBeVisible()
        const results = await new AxeBuilder({ page }).include(scope).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
        expect(results.violations, id).toEqual([])
      }
      const phoneContext = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true })
      const phone = await phoneContext.newPage()
      try {
        const id = "input-suggestions-phone-rtl"
        await phone.goto(`/index.html?fixtures-phone&only=${id}&theme=${theme}&density=${density}&dir=rtl`)
        await expect(phone.getByRole("dialog", { name: "Available Values" })).toBeVisible()
        const results = await new AxeBuilder({ page: phone }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
        expect(results.violations, id).toEqual([])
      } finally { await phoneContext.close() }
    })
  }
}
