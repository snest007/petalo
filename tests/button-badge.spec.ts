import { expect, test } from "@playwright/test"

test("the Button name includes localized count text and omits the attention dot", async ({ page }) => {
  await page.goto("/index.html#/button-badge")
  const demo = page.locator('main[data-docs-route="button-badge"]')
  await expect(demo.getByRole("button", { name: "Inbox 1 item", exact: true })).toBeVisible()
  await expect(demo.getByRole("button", { name: "Notifications 99+ items", exact: true })).toBeVisible()
  await expect(demo.getByRole("button", { name: "Approvals", exact: true })).toBeVisible()
})

test("badge styling and attempted ARIA overrides keep one named action", async ({ page }) => {
  await page.goto("/index.html?fixtures&only=button-badge-customise")
  const cell = page.locator('[data-fixture="button-badge-customise"]')
  const action = cell.getByRole("button", { name: "Notifications 12 items" })
  await expect(cell.getByRole("button")).toHaveCount(1)
  const badge = action.locator('[data-slot="button-badge"]')
  await expect(badge).toHaveClass(/\bbadge-root\b/)
  await expect(badge).not.toHaveAttribute("tabindex")
  await expect(badge.locator('[data-slot="button-badge-tag"]')).toHaveClass(/\bbadge-tag\b/)
})
