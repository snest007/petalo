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
