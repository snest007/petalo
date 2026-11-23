import { expect, test } from "@playwright/test"
import { popupOverflow } from "./visual-popup-cell"

test("popup containment detects a misplaced top-layer surface and its owning portal", async ({ page }) => {
  await page.setContent(`
    <div data-fixture="scratch" style="position:absolute;left:100px;top:100px;width:200px;height:120px">
      <button aria-controls="loose">Open</button>
      <div id="top-layer" popover="manual" style="position:fixed;inset:0 auto auto 0;margin:0;width:30px;height:20px">Top layer</div>
    </div>
    <div data-fixture="other" style="position:absolute;left:320px;top:100px;width:200px;height:120px">
      <div style="width:40px;height:40px;overflow:hidden;transform:translateZ(0)">
        <div role="dialog" style="position:fixed;inset:300px auto auto 0;width:30px;height:20px">Clipped</div>
      </div>
    </div>
    <div role="dialog" id="loose" style="position:fixed;left:320px;top:100px;width:30px;height:20px">Portal</div>
    <div data-fixture-owner="other" role="dialog" style="position:fixed;left:330px;top:100px;width:30px;height:20px">Owned</div>
  `)
  await page.locator("#top-layer").evaluate((el) => (el as HTMLElement).showPopover())
  expect(await page.evaluate(popupOverflow, { viewport: false })).toEqual([
    { caseId: "scratch", surface: "top-layer", pixels: 100 },
    { caseId: "scratch", surface: "loose", pixels: 50 },
  ])
  await page.locator('[data-fixture="scratch"]').evaluate((el) => el.setAttribute("data-fixture-popup-overflow", "Deliberate viewport overlay"))
  expect(await page.evaluate(popupOverflow, { viewport: false })).toEqual([])
})

test("E11 review detects a listbox popup owned via aria-controls", async ({ page }) => {
  await page.setContent(`
    <div data-fixture="combo" style="position:fixed;left:100px;top:100px;width:120px;height:100px">
      <input role="combobox" aria-controls="combo-list" aria-expanded="true">
    </div>
    <div data-fixture="next" style="position:fixed;left:240px;top:100px;width:100px;height:100px"></div>
    <div id="combo-list" role="listbox" style="position:fixed;left:240px;top:100px;width:80px;height:40px;background:red">
      <div role="option">Example</div>
    </div>
  `)
  await expect(page.getByRole("listbox")).toBeVisible()
  expect(await page.evaluate(popupOverflow, { viewport: false })).toEqual([
    { caseId: "combo", surface: "combo-list", pixels: 100 },
  ])
})

test("E11 review detects painted content escaping a contained popup", async ({ page }) => {
  await page.setContent(`
    <div data-fixture="dialog" style="position:fixed;left:100px;top:100px;width:120px;height:100px">
      <div role="dialog" id="surface" style="position:relative;width:80px;height:40px;overflow:visible">
        <div id="flyout-child" style="position:absolute;left:140px;top:0;width:80px;height:40px;background:red">Example</div>
      </div>
    </div>
    <div data-fixture="next" style="position:fixed;left:240px;top:100px;width:100px;height:100px"></div>
  `)
  await expect(page.locator("#flyout-child")).toBeVisible()
  expect(await page.evaluate(popupOverflow, { viewport: false })).toEqual(
    expect.arrayContaining([expect.objectContaining({ caseId: "dialog", pixels: 100 })]))
})
