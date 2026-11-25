import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator } from "@playwright/test"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { build } from "vite"
import { aliases } from "../vite.aliases"
import { captureAX } from "./a11y-tree-normalize"

const cell = (grid: Locator, row: number, column: number) => grid.locator(`[data-grid-row="${row}"][data-grid-column="${column}"]`)
const resizer = (grid: Locator, id: string) => grid.locator(`[data-slot="analytical-table-resizer"][data-column="${id}"]`)
const width = async (part: Locator) => (await part.boundingBox())!.width

test.beforeEach(async ({ page }, info) => {
  if (info.title.startsWith("fixtures")) return
  await page.goto("/#/analytical-table")
  await expect(page.locator('main[data-docs-route="analytical-table"]')).toBeVisible()
})

for (const dir of ["ltr", "rtl"]) {
  test(`keyboard navigation, resize and Tab exit in ${dir}`, async ({ page }) => {
    const demo = page.locator(`#analytical-table-column-demo-${dir}`)
    const grid = demo.getByRole("grid")
    await demo.getByRole("button", { name: "Before grid" }).focus()
    await page.keyboard.press("Tab")
    const move = async (key: string, row: number, col: number) => {
      await page.keyboard.press(key)
      await expect(cell(grid, row, col)).toBeFocused()
    }
    const first = cell(grid, 0, 0)
    await expect(first).toBeFocused()
    const before = await width(first)
    await move(dir === "ltr" ? "Shift+ArrowRight" : "Shift+ArrowLeft", 0, 0)
    await expect.poll(() => width(first)).toBe(before + 16)
    await expect(demo.locator("output")).toHaveText(String(before + 16))
    await move(dir === "ltr" ? "ArrowRight" : "ArrowLeft", 0, 1)
    await move(dir === "ltr" ? "ArrowLeft" : "ArrowRight", 0, 0)
    await move("ArrowDown", 1, 0)
    await move("End", 1, 2)
    await move("Home", 1, 0)
    await move("PageDown", 4, 0)
    await move("PageUp", 1, 0)
    await move("ArrowUp", 0, 0)
    await move("Control+End", 75, 2)
    await expect(grid).toHaveAttribute("aria-rowcount", "75")
    await expect(grid.getByRole("row").last()).toHaveAttribute("aria-rowindex", "76")
    await move("Control+Home", 0, 0)
    await page.keyboard.press("Tab")
    await expect(demo.getByRole("button", { name: "After grid" })).toBeFocused()
  })
}

test("drag resize, auto-fit and reorder report results", async ({ page }) => {
  const demo = page.locator("#analytical-table-column-demo-ltr")
  const grid = demo.getByRole("grid")
  const header = grid.getByRole("columnheader", { name: "Product" })
  await expect.poll(() => width(header)).toBe(180)
  const grip = resizer(grid, "product")
  const box = (await grip.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 6)
  await page.mouse.down()
  await page.mouse.move(box.x + 37, box.y + 6, { steps: 4 })
  await page.mouse.up()
  await expect.poll(() => width(header)).toBeGreaterThan(210)
  await expect(demo.locator("output")).toHaveText(/^21[0-9](?:\.\d+)?$/)
  await grip.dblclick({ position: { x: 2, y: 6 } })
  await expect.poll(() => width(header)).toBeLessThan(180)
  const stock = grid.getByRole("columnheader", { name: "Stock" })
  await stock.dragTo(header, { sourcePosition: { x: 15, y: 15 }, targetPosition: { x: 15, y: 15 } })
  await expect(grid.getByRole("columnheader")).toHaveText(["Stock", "Product", "Category"])
  await expect(demo.locator("output")).toHaveText("stock,product,category")
})

test("freeze and unfreeze from the uncontrolled header menu", async ({ page }) => {
  const grid = page.locator("#analytical-table-column-demo-ltr").getByRole("grid")
  const category = grid.locator('[role="columnheader"][data-column-id="category"]')
  await category.focus()
  await page.keyboard.press("Enter")
  await page.getByRole("menuitem", { name: "Freeze Column" }).click()
  await expect(category).toHaveAttribute("data-frozen", "true")
  await expect(category).toHaveAttribute("aria-colindex", "1")
  await expect(category).toBeFocused()
  await page.keyboard.press("Space")
  await page.getByRole("menuitem", { name: "Unfreeze Column" }).click()
  await expect(category).not.toHaveAttribute("data-frozen", "true")
  await expect(category).toHaveAttribute("aria-colindex", "2")
})

test("controlled widths, order, visibility and pins in the Custom example", async ({ page }) => {
  const demo = page.locator("#analytical-table-custom")
  const grid = demo.getByRole("grid")
  const product = grid.locator('[role="columnheader"][data-column-id="product"]')
  const stock = grid.getByRole("columnheader", { name: "Stock" })
  await product.focus()
  await page.keyboard.press("Shift+ArrowRight")
  await expect.poll(() => width(product)).toBe(196)
  await demo.getByRole("button", { name: "Reset widths" }).click()
  await expect.poll(() => width(product)).toBe(180)
  await stock.dragTo(product, { sourcePosition: { x: 15, y: 15 }, targetPosition: { x: 15, y: 15 } })
  await expect(grid.getByRole("columnheader")).toHaveText(["Stock", "Product", "Category"])
  await demo.getByRole("button", { name: "Toggle category" }).click()
  await expect(grid).toHaveAttribute("aria-colcount", "2")
  await expect(grid.getByRole("columnheader", { name: "Category" })).toHaveCount(0)
  await product.click()
  await page.getByRole("menuitem", { name: "Identify column" }).click()
  await expect(demo.locator("output")).toHaveText("product")
  await product.click()
  await page.getByRole("menuitem", { name: "Keep column in view" }).click()
  await expect(product).toHaveAttribute("data-frozen", "true")
  await demo.getByRole("button", { name: "Focus product 20" }).click()
  await expect(cell(grid, 20, 0)).toBeFocused()
  const stockCell = cell(grid, 20, 1)
  await stockCell.focus()
  const nested = stockCell.getByRole("button")
  await expect(nested).toHaveAttribute("tabindex", "-1")
  await page.keyboard.press("F2")
  await expect(nested).toBeFocused()
  await page.keyboard.press("F2")
  await expect(stockCell).toBeFocused()
  await expect(stockCell).toHaveClass(/analytical-table-custom-cell/)
  await expect(stockCell).toHaveClass(/analytical-table-merged-cell/)
  await expect(stockCell.locator("..")).toHaveClass(/analytical-table-custom-row/)
  await demo.getByRole("button", { name: "Toggle products" }).click()
  await expect(grid.getByRole("gridcell")).toHaveText("Inventory is empty")
})

for (const dir of ["ltr", "rtl"]) {
  test(`virtual inventory uses absolute row indices and keeps keyboard editing in ${dir}`, async ({ page }) => {
    const demo = page.locator(`#analytical-table-virtual-${dir}`)
    const grid = demo.getByRole("grid")
    const heading = cell(grid, 0, 0)
    await heading.focus()
    await expect(grid).toHaveAccessibleDescription(/F2/)
    await heading.press("Tab")
    const first = cell(grid, 1, 0)
    await expect(first).toBeFocused()
    await expect(first).toHaveAccessibleName(/includes input and button/i)
    const input = first.getByRole("textbox", { name: "Product name" })
    await expect(input).toHaveAttribute("tabindex", "-1")
    await first.press("F2")
    await expect(input).toBeFocused()
    await input.press("Tab")
    const confirm = first.getByRole("button", { name: "Apply product name" })
    await expect(confirm).toBeFocused()
    await confirm.press("Escape")
    await expect(first).toBeFocused()
    await expect(input).toHaveAttribute("tabindex", "-1")
    await first.press("F2")
    await expect(input).toBeFocused()
    await input.press("F2")
    await expect(first).toBeFocused()
    await first.press("F2")
    await expect(input).toBeFocused()
    await input.fill("Travel Tent")
    await input.press("Tab")
    await expect(confirm).toBeFocused()
    await confirm.press("Enter")
    await expect(first).toHaveAccessibleName("Includes Input and button Travel Tent Apply")
    await expect(confirm).toBeFocused()
    await confirm.press("Tab")
    const next = cell(grid, 2, 0)
    const nextInput = next.getByRole("textbox", { name: "Product name" })
    await expect(nextInput).toBeFocused()
    await nextInput.press("Escape")
    await expect(next).toBeFocused()
    await next.press("ArrowUp")
    await expect(first).toBeFocused()
    const forward = dir === "ltr" ? "ArrowRight" : "ArrowLeft"
    await first.press(forward)
    await expect(cell(grid, 1, 1)).toBeFocused()
    await cell(grid, 1, 1).press("Shift+Tab")
    await expect(cell(grid, 0, 1)).toBeFocused()
    await cell(grid, 0, 1).press("Tab")
    await expect(cell(grid, 1, 1)).toBeFocused()

    await expect(cell(grid, 10, 1)).toHaveCount(0)
    for (let row = 2; row <= 10; row++) {
      await page.keyboard.press("ArrowDown")
      await expect(cell(grid, row, 1)).toBeFocused()
      await expect(cell(grid, row, 1).locator("..")).toHaveAttribute("aria-rowindex", String(row + 1))
    }
    await expect(cell(grid, 1, 1)).toHaveCount(0)
    for (let row = 9; row >= 1; row--) {
      await page.keyboard.press("ArrowUp")
      await expect(cell(grid, row, 1)).toBeFocused()
    }
  })
}

test("infinite scrolling requests one page per count and announces loading", async ({ page }) => {
  const demo = page.locator("#analytical-table-virtual-ltr")
  const grid = demo.getByRole("grid")
  const top = demo.getByRole("button", { name: "Scroll to first product" })
  const end = demo.getByRole("button", { name: "Scroll to last loaded product" })
  const requests = demo.getByRole("status", { name: "Page requests" })
  const loading = demo.getByRole("button", { name: "Finish loading products" })
  await expect(grid).toHaveAttribute("aria-rowcount", "-1")
  await demo.getByRole("checkbox", { name: "Show total products" }).check()
  await expect(grid).toHaveAttribute("aria-rowcount", "75")
  await end.click()
  await expect(requests).toHaveText("1")
  await expect(demo.getByRole("status", { name: "Scroll event" })).toHaveText("Scrolled 15 loaded products")
  await expect(grid).toHaveAttribute("aria-busy", "true")
  await expect(grid.getByRole("row", { name: /please wait/i })).toHaveCount(1)
  await expect(demo.locator('[data-slot="busy-indicator"]')).toHaveAttribute("inert", "")
  await expect(demo.getByRole("progressbar")).toHaveCount(0)
  await expect(loading).toBeEnabled()
  await top.click()
  await expect.poll(() => grid.evaluate(node => node.scrollTop)).toBe(0)
  await end.click()
  await expect(grid.locator('[role="row"][aria-rowindex="16"]').getByRole("textbox", { name: "Product name" })).toHaveValue("Camp Lantern 15")
  await expect(requests).toHaveText("1")
  await loading.click()
  await expect(grid).not.toHaveAttribute("aria-busy", "true")
  await expect(grid.getByRole("row", { name: /please wait/i })).toHaveCount(0)
  await end.click()
  await expect(requests).toHaveText("2")
  await expect(demo.getByRole("status", { name: "Scroll event" })).toHaveText("Scrolled 30 loaded products")
})

test("infinite scrolling rearms when a page joins the same collapsed groups", async ({ page }) => {
  const demo = page.locator("#analytical-table-virtual-ltr")
  await demo.getByRole("checkbox", { name: "Group loaded products" }).check()
  const grid = demo.getByRole("treegrid")
  const group = grid.getByRole("row", { name: /^Shelter \(/ })
  const top = demo.getByRole("button", { name: "Scroll to first product" })
  const bottom = demo.getByRole("button", { name: "Scroll to last loaded product" })
  const complete = demo.getByRole("button", { name: "Finish loading products" })
  const requests = demo.getByRole("status", { name: "Page requests" })
  await expect(group).toHaveAccessibleName(/^Shelter \(4\)/)
  await expect(group).toHaveAttribute("aria-expanded", "false")
  await bottom.click()
  await expect(requests).toHaveText("1")
  await complete.click()
  await top.click()
  await expect(group).toHaveAccessibleName(/^Shelter \(8\)/)
  await expect(group).toHaveAttribute("aria-expanded", "false")
  await expect.poll(() => grid.evaluate(node => node.scrollTop)).toBe(0)
  await bottom.click()
  await expect(requests).toHaveText("2")
})

test("responsive pop-in retains the custom label and hides a secondary column", async ({ page }) => {
  const demo = page.locator("#analytical-table-custom")
  const grid = demo.getByRole("grid")
  const toggle = demo.getByRole("button", { name: "Narrow table" })
  await expect(grid.getByRole("columnheader")).toHaveText(["Product", "Category", "Stock"])
  await toggle.click()
  await expect(grid.getByRole("columnheader")).toHaveText(["Product"])
  const first = cell(grid, 1, 0)
  const header = first.locator('[data-slot="analytical-table-pop-in-header"]')
  const value = first.locator('[data-slot="analytical-table-pop-in-value"]')
  await expect(header).toHaveText("Inventory category:")
  await expect(value).toHaveText("Shelter")
  await expect(first).toHaveAccessibleName("Product Alpine Tent Inventory category: Shelter")
  const refs = (await first.getAttribute("aria-labelledby"))?.split(" ")
  expect(refs).toContain(await header.getAttribute("id"))
  expect(refs).toContain(await value.getAttribute("id"))
  await expect(first).toHaveRole("gridcell")
  await first.focus()
  await first.press("ArrowDown")
  await expect(cell(grid, 2, 0)).toBeFocused()
  await toggle.click()
  await expect(grid.getByRole("columnheader")).toHaveText(["Product", "Category", "Stock"])
  await expect(header).toHaveCount(0)
})

test("fixtures keep the frozen column and align the scrolled header and body", async ({ page }) => {
  await page.goto("/index.html?fixtures&ref=wcr")
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
  const fixture = page.locator('[data-fixture="analytical-table-virtual-frozen-horizontal"]')
  const grid = fixture.getByRole("grid")
  await expect.poll(() => grid.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
  const column = grid.locator('[role="columnheader"][data-frozen="true"]')
  const product = grid.locator('[role="gridcell"][data-frozen="true"]').first()
  const stock = grid.locator('[role="columnheader"][data-column-id="stock"]')
  const stockCell = grid.locator('[role="gridcell"][data-column-id="stock"]').first()
  await expect.poll(async () => (await column.boundingBox())?.x).toBe((await product.boundingBox())?.x)
  await expect.poll(async () => (await stock.boundingBox())?.x).toBe((await stockCell.boundingBox())?.x)
})

test("fixtures keep absolute indices, empty announcements and localized text", async ({ page }) => {
  await page.goto("/index.html?fixtures&ref=wcr")
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
  const fixture = (name: string) => page.locator(`[data-fixture="analytical-table-${name}"]`)
  const hidden = fixture("hidden").getByRole("grid")
  await expect(hidden).toHaveAttribute("aria-colcount", "2")
  await expect(hidden.getByRole("columnheader")).toHaveText(["Product", "Stock"])
  await expect(fixture("empty-cell").getByRole("gridcell").nth(1)).toHaveAccessibleName(/^(?:Category )?Empty$/)
  await expect(fixture("de").getByRole("gridcell")).toHaveText("Keine Daten")
  await expect(fixture("filtered").getByRole("gridcell")).toHaveText("No data found. Try adjusting the filter settings.")
  const interactive = fixture("interactive")
  const grip = interactive.locator('[data-slot="analytical-table-vertical-resizer"]')
  await grip.scrollIntoViewIfNeeded()
  const before = await interactive.getByRole("grid").evaluate(node => node.clientHeight)
  const box = (await grip.boundingBox())!
  await page.mouse.move(box.x + 100, box.y + 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y - 85, { steps: 4 })
  await page.mouse.up()
  await expect.poll(() => interactive.getByRole("grid").evaluate(node => node.clientHeight)).toBeLessThan(before)
})

for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) {
  for (const dir of ["ltr", "rtl"]) {
    test(`fixtures axe in ${theme} ${dir}`, async ({ page }) => {
      const query = `theme=${theme}&dir=${dir}`
      for (const path of [`/index.html?fixtures&ref=wcr&${query}`, `/wcr.html?${query}`]) {
        await page.goto(path)
        await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
        const result = await new AxeBuilder({ page }).include('[data-fixture^="analytical-table-"]')
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
        if (!path.startsWith("/wcr.html")) {
          expect(result.violations, path).toEqual([])
          continue
        }
        // WCR RowSubComponent.js has a focusable div as a direct row child,
        // useRowDisableSelection exposes an unnamed checkbox, and Expandable.js
        // names the Horizon buttons only after focus. PopIn.js leaves DOM text
        // from its three fragments adjacent ("Alpine TentType:Shelter"), while
        // useA11y constructs a spaced accessible name. Assert the raw WCR
        // rules and exact offending cells. Petalo must still be axe clean.
        const regularHorizon = theme === "sap_horizon" || theme === "sap_horizon_dark"
        expect(result.violations.map(({ id, nodes }) => [id, nodes.length]), path).toEqual([
          ["aria-required-children", 10], ["aria-toggle-field-name", 1], ...(regularHorizon ? [["button-name", 15]] : []),
          ["label-content-name-mismatch", 15],
        ])
        for (const { id, nodes } of result.violations) {
          for (const node of nodes) {
            if (id === "aria-required-children") {
              expect(node.html).toMatch(/^<div role="row" .*data-virtual-row-index=/)
              const related = node.any.flatMap(rule => rule.relatedNodes)
              expect(related).toHaveLength(1)
              expect(related[0]?.html).toMatch(/^<div data-subcomponent="true" data-subcomponent-row-index="\d+" tabindex="-1"/)
            } else if (id === "aria-toggle-field-name") {
              expect(node.html).toMatch(/^<div class="ui5-checkbox-root" role="checkbox" part="root" aria-checked="false" aria-disabled="true"/)
              expect(node.target.flat().join(" ")).toContain('[data-name="internal_selection_column"]')
            } else if (id === "label-content-name-mismatch") {
              expect(node.html).toMatch(/^<div role="gridcell" data-column-id-cell="product" .*aria-labelledby=.*data-is-first-column="true"/)
            } else {
              expect(node.html).toMatch(/^<button [^>]*class="ui5-button-root" [^>]*aria-label=""/)
              expect(JSON.stringify(node.target)).toMatch(/navigation-(?:right|down)-arrow/)
            }
          }
          if (id === "label-content-name-mismatch") {
            const cells = await Promise.all(nodes.map(node => {
              const [selector] = node.target
              expect(node.target).toHaveLength(1)
              if (typeof selector !== "string") throw new Error("Expected a light DOM pop-in cell")
              return page.locator(selector).evaluate(cell => ({
                fixture: cell.closest("[data-fixture]")?.getAttribute("data-fixture"),
                row: Number(cell.getAttribute("data-row-index")),
              }))
            }))
            expect(cells).toHaveLength(15)
            for (const mode of ["block", "inline", "without-header"]) {
              const rows = cells.filter(cell => cell.fixture === `analytical-table-pop-in-${mode}`).map(cell => cell.row)
              expect(rows.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
            }
          }
        }
      }
    })
  }
}

const sortDemo = (page: import("@playwright/test").Page, dir = "ltr") => page.locator(`#analytical-table-sort-filter-${dir}`)
const productCells = (grid: Locator) => grid.locator('[role="gridcell"][data-column-id="product"]')

test("sort and filter through the header menu with mouse and keyboard", async ({ page }) => {
  const demo = sortDemo(page)
  const grid = demo.getByRole("grid")
  const heading = grid.locator('[role="columnheader"][data-column-id="product"]')
  await heading.focus()
  await page.keyboard.press("Enter")
  const menu = grid.getByRole("menu")
  const ascending = menu.getByRole("menuitem", { name: /^Sort Ascending/ })
  await expect(ascending).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(heading).toBeFocused()
  await expect(heading).toHaveAttribute("aria-sort", "ascending")
  await expect(productCells(grid)).toHaveText(["Aland", "Äland", "Alban", "Berlin", "Zebra"])
  await heading.click()
  await menu.getByRole("menuitem", { name: /^Sort Descending/ }).click()
  await expect(heading).toHaveAttribute("aria-sort", "descending")
  await expect(productCells(grid).first()).toHaveText("Zebra")
  await heading.press("Space")
  await expect(menu.getByRole("menuitem", { name: /^Sort Ascending/ })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(menu.getByRole("menuitem", { name: /^Clear Sorting/ })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(heading).not.toHaveAttribute("aria-sort")
  await heading.press("Enter")
  const filter = menu.getByRole("textbox", { name: "Filter" })
  await filter.fill("aland")
  await expect(heading).toHaveAccessibleName("Product Filtered")
  await expect(productCells(grid)).toHaveText(["Äland", "Aland"])
  await expect(demo.locator("output")).toHaveText("product aland")
  await filter.press("Enter")
  await expect(menu).toHaveCount(0)
  await expect(heading).toBeFocused()
  await heading.press("Enter")
  await menu.getByRole("button", { name: "Clear" }).click()
  await expect(filter).toHaveValue("")
  await expect(heading).toHaveAccessibleName("Product")
  await filter.press("Escape")
  await expect(heading).toBeFocused()
  await expect(productCells(grid)).toHaveCount(5)
})

test("multi-sort applies declared priority and Swedish and German collation", async ({ page }) => {
  const demo = sortDemo(page)
  const grid = demo.getByRole("grid")
  for (const [column, action] of [["Stock", "Sort Descending"], ["Product", "Sort Ascending"]]) {
    await grid.getByRole("columnheader", { name: column, exact: true }).click()
    await grid.getByRole("menuitem", { name: new RegExp(`^${action}`) }).click()
  }
  await expect(demo.locator("output")).toHaveText("product asc, stock desc")
  await expect(grid.locator('[aria-sort="ascending"]')).toHaveText("Product")
  await expect(grid.locator('[aria-sort="descending"]')).toHaveText("Stock")
  await expect(productCells(grid)).toHaveText(["Aland", "Äland", "Alban", "Berlin", "Zebra"])
  await demo.getByRole("combobox", { name: "Locale" }).selectOption("sv-SE")
  await expect(productCells(grid)).toHaveText(["Aland", "Alban", "Berlin", "Zebra", "Äland"])
  const global = demo.getByRole("textbox", { name: "Search inventory" })
  await global.fill("aland")
  await expect(productCells(grid)).toHaveText(["Aland"])
  await demo.getByRole("combobox", { name: "Locale" }).selectOption("de-DE")
  await expect(productCells(grid)).toHaveText(["Aland", "Äland"])
  await global.fill("missing")
  await expect(grid.getByRole("gridcell")).toHaveText("No data found. Try adjusting the filter settings.")
  await demo.getByRole("checkbox", { name: "Disable search" }).check()
  await expect(productCells(grid)).toHaveCount(5)
  await demo.getByRole("checkbox", { name: "Disable search" }).uncheck()
  await expect(grid.getByRole("gridcell")).toHaveText("No data found. Try adjusting the filter settings.")
})

test("RTL filter popup restores the grid's roving focus", async ({ page }) => {
  const grid = sortDemo(page, "rtl").getByRole("grid")
  const heading = grid.getByRole("columnheader", { name: "Product", exact: true })
  await heading.focus()
  await page.keyboard.press("Enter")
  const menu = grid.getByRole("menu")
  const filterItem = menu.getByRole("menuitem", { name: /^Filter/ })
  await expect(menu.getByRole("menuitem", { name: /^Sort Ascending/ })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(menu.getByRole("menuitem", { name: /^Sort Descending/ })).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(filterItem).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(filterItem.getByRole("textbox", { name: "Filter" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(heading).toBeFocused()
  await page.keyboard.press("ArrowLeft")
  await expect(grid.getByRole("columnheader", { name: "Category", exact: true })).toBeFocused()
})

test("controlled sorting and the custom Filter renderer keep the owned menu and header", async ({ page }) => {
  const demo = page.locator("#analytical-table-custom")
  const grid = demo.getByRole("grid")
  const category = grid.locator('[role="columnheader"][data-column-id="category"]')
  await category.click()
  const row = grid.getByRole("menuitem", { name: /^Filter/ })
  await expect(row).toBeVisible()
  await row.getByRole("combobox", { name: "Filter" }).selectOption("Packs")
  await expect(category).toHaveAccessibleName("Category Filtered")
  await expect(grid.locator('[role="gridcell"][data-column-id="category"]').first()).toHaveText("Packs")
  await expect(demo.locator("output")).toHaveText("Packs")
  await page.keyboard.press("Escape")
  await expect(category).toBeFocused()
  const stock = grid.getByRole("columnheader", { name: "Stock", exact: true })
  await stock.click()
  await grid.getByRole("menuitem", { name: /^Sort Ascending/ }).click()
  await expect(stock).toHaveAttribute("aria-sort", "ascending")
  await expect(demo.locator("output")).toHaveText("asc")
  const values = await grid.locator('[role="gridcell"][data-column-id="stock"]').allTextContents()
  const digits = values.map(value => Number(value) % 10)
  expect(digits).toEqual([...digits].sort((a, b) => a - b))
})

test("fixtures: scroll 100,000 rows and 50 columns within a bounded frame sequence", async ({ page }, info) => {
  test.setTimeout(60_000)
  const entry = resolve("analytical-table-performance-test.js")
  const virtual = "\0analytical-table-performance-test"
  const source = `
    import { createElement as h } from "react";
    import { createRoot } from "react-dom/client";
    import { AnalyticalTable } from "@/components/ui/analytical-table";

    const data = Array.from({ length: 100_000 }, (_, id) => ({ id }));
    const columns = Array.from({ length: 50 }, (_, col) => ({
      id: String(col), header: "Measure " + col, width: 116,
      accessorFn: row => row.id * 50 + col,
    }));
    createRoot(document.getElementById("performance-example")).render(h(AnalyticalTable, {
      columns, data, visibleRows: 8, overscanCount: 2, overscanCountHorizontal: 2,
      "aria-label": "Wide inventory", defaultColumnPinning: { start: ["0"], end: [] },
    }));
  `
  const bundle = await build({
    configFile: false, publicDir: false, logLevel: "silent", resolve: { alias: aliases },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [{ name: "analytical-table-performance-test", resolveId: id => id === entry ? virtual : undefined,
      load: id => id === virtual ? source : undefined }],
    build: { write: false, lib: { entry, formats: ["iife"], name: "AnalyticalTablePerformanceTest" } },
  })
  const output = Array.isArray(bundle) ? bundle[0] : bundle
  const script = "output" in output && output.output.find(file => file.type === "chunk")?.code
  const css = readFileSync("dist/index.html", "utf8").match(/href="([^"]+\.css)"/)?.[1]
  if (!script || !css) throw new Error("Missing AnalyticalTable performance fixture assets")
  const path = "/analytical-table-performance-test.html"
  await page.route("**" + path, route => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: `<!doctype html><html lang="en" data-theme="sap_horizon">
      <head><link rel="stylesheet" href="${css}"></head><body>
        <main id="performance-example" style="width: 840px"></main>
        <script>${script.replaceAll("</script", "<\/script")}</script>
      </body></html>`,
  }))
  await page.goto(path)
  const grid = page.getByRole("grid", { name: "Wide inventory" })
  await expect(grid).toHaveAttribute("aria-rowcount", "100000")
  await expect(grid).toHaveAttribute("aria-colcount", "50")
  await expect(cell(grid, 1, 0)).toHaveText("0", { timeout: 25_000 })

  const result = await grid.evaluate(async viewport => {
    const vertical = viewport.scrollHeight - viewport.clientHeight
    const horizontal = viewport.scrollWidth - viewport.clientWidth
    const frames = 32
    const frame = () => new Promise<number>(resolve => requestAnimationFrame(resolve))
    const start = await frame()
    let maxRows = 0
    let maxColumns = 0
    for (let step = 1; step <= frames; step++) {
      viewport.scrollTo(horizontal * step / frames, vertical * step / frames)
      await frame()
      maxRows = Math.max(maxRows, viewport.querySelectorAll('[role="row"][aria-rowindex]').length)
      maxColumns = Math.max(maxColumns, viewport.querySelectorAll('[role="columnheader"]').length)
    }
    return { ms: await frame() - start, maxRows, maxColumns }
  })
  await expect(grid.locator('[aria-rowindex="100001"]')).toBeAttached()
  await expect(grid.locator('[role="columnheader"][aria-colindex="50"]')).toBeAttached()
  await expect(grid.locator('[role="columnheader"][aria-colindex="1"]')).toHaveAttribute("data-frozen", "true")
  const measurements = info.outputPath("virtual-scroll-measurements.json")
  writeFileSync(measurements, JSON.stringify(result))
  await info.attach("virtual-scroll-measurements", { contentType: "application/json", path: measurements })
  expect(result.maxRows).toBeLessThanOrEqual(16)
  expect(result.maxColumns).toBeLessThanOrEqual(16)
  expect(result.ms).toBeLessThan(4_000)
})

test("fixtures: built-in filters accept string cells from controlled state and custom editors", async ({ page }) => {
  const entry = resolve("analytical-table-filter-test.js")
  const virtual = "\0analytical-table-filter-test"
  const source = `
    import { createElement as h, useState } from "react";
    import { createRoot } from "react-dom/client";
    import { AnalyticalTable } from "@/components/ui/analytical-table";

    const { values, filter, query, locale } = window.filterCase;
    const data = values.map(value => ({ value }));
    const columns = [{
      accessorKey: "value", header: "Value", width: 180, filter,
      cell: ({ value }) => String(value),
      Filter: ({ value, setFilter, accessibleNameRef }) => h("select", {
        value: value === undefined ? "" : "match", "aria-labelledby": accessibleNameRef,
        onChange: event => setFilter(event.target.value ? query : undefined)
      }, h("option", { value: "" }, "Show all"), h("option", { value: "match" }, "Apply filter"))
    }];

    function FilterExample() {
      const [filters, setFilters] = useState([{ id: "value", value: query }]);
      return h(AnalyticalTable, {
        columns, data, filterable: true, locale, columnFilters: filters, onColumnFiltersChange: setFilters,
        "aria-label": "Filtered values", visibleRows: values.length, minRows: 1
      });
    }

    createRoot(document.getElementById("filter-example")).render(h(FilterExample));
  `
  const bundle = await build({
    configFile: false, publicDir: false, logLevel: "silent", resolve: { alias: aliases },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [{ name: "analytical-table-filter-test", resolveId: id => id === entry ? virtual : undefined,
      load: id => id === virtual ? source : undefined }],
    build: { write: false, lib: { entry, formats: ["iife"], name: "AnalyticalTableFilterTest" } },
  })
  const output = Array.isArray(bundle) ? bundle[0] : bundle
  const script = "output" in output && output.output.find(file => file.type === "chunk")?.code
  if (!script) throw new Error("Missing AnalyticalTable filter test bundle")
  const css = readFileSync("dist/index.html", "utf8").match(/href="([^"]+\.css)"/)?.[1]
  if (!css) throw new Error("Missing AnalyticalTable fixture stylesheet")

  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  const textValues = ["SAP Fiori", "SAP Analytics", "Other"]
  const cases = [
    // Reference values from WCR AnalyticalTable/react-table/filterTypes.js.
    { filter: "includesAll", values: textValues, query: ["SAP", "Fiori"], matches: ["SAP Fiori"] },
    { filter: "includesSome", values: textValues, query: ["Fiori", "Other"], matches: ["SAP Fiori", "Other"] },
    { filter: "between", values: ["2", "10", "20"], query: [1, 12], matches: ["2", "10"] },
    { filter: "includesAll", values: ["Äland Süd", "Aland Nord"], query: ["aland", "sud"], matches: ["Äland Süd"], locale: "de-DE" },
    { filter: "includesSome", values: [["SAP", "Fiori"], ["SAP", "Analytics"], ["Other"]], query: ["Fiori", "Other"], matches: ["SAP,Fiori", "Other"] },
    { filter: "between", values: ["2,5", "10,5", "20,5"], query: [12, 1], matches: ["2,5", "10,5"], locale: "de-DE" },
  ]
  for (const filterCase of cases) {
    await test.step(`${filterCase.filter}: ${filterCase.values.join(" / ")}`, async () => {
      const path = "/analytical-table-filter-test.html"
      await page.route("**" + path, route => route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html>
        <html lang="en" data-theme="sap_horizon"><head><link rel="stylesheet" href="${css}"></head>
        <body><main id="filter-example"></main><script>window.filterCase = ${JSON.stringify(filterCase)};</script>
        <script>${script.replaceAll("</script", "<\\/script")}</script></body></html>` }))
      await page.goto(path)
      const grid = page.getByRole("grid", { name: "Filtered values" })
      const values = grid.getByRole("gridcell")
      await expect(grid, errors.join("\n")).toBeVisible()
      await expect(values).toHaveText(filterCase.matches)
      const header = grid.getByRole("columnheader")
      await expect(header).toHaveAccessibleName("Value Filtered")
      await header.press("Enter")
      const editor = grid.getByRole("combobox", { name: "Filter" })
      await editor.selectOption("")
      await expect(values).toHaveText(filterCase.values.map(String))
      await expect(header).toHaveAccessibleName("Value")
      await editor.selectOption("match")
      await expect(values).toHaveText(filterCase.matches)
      await expect(header).toHaveAccessibleName("Value Filtered")
      await page.unroute("**" + path)
    })
  }
  expect(errors).toEqual([])
})

for (const dir of ["ltr", "rtl"]) {
  test(`group headers and rows retain focus, disclosure semantics and announcements in ${dir}`, async ({ page }) => {
    const demo = page.locator(`#analytical-table-group-demo-${dir}`)
    const grid = demo.locator('[data-slot="analytical-table-grid"]')
    const header = grid.getByRole("columnheader", { name: "Category Grouped" })
    await expect(header).toHaveAttribute("aria-colindex", "1")
    await header.focus()
    await header.press("Enter")
    const ungroup = grid.getByRole("menuitem", { name: /^Ungroup/ })
    await expect(ungroup).toBeFocused()
    await ungroup.press("Enter")
    const normal = grid.getByRole("columnheader", { name: "Category", exact: true })
    await expect(normal).toBeFocused()
    await expect(normal).toHaveAttribute("aria-colindex", "2")
    await normal.press("Space")
    const group = grid.getByRole("menuitem", { name: /^Group/ })
    await expect(group).toBeFocused()
    await group.press("Enter")
    await expect(header).toBeFocused()
    await expect(demo.getByRole("status", { name: "Grouped columns" })).toHaveText("category")
    await expect(grid.getByRole("columnheader", { name: "Stock" })).not.toHaveAttribute("aria-haspopup")

    const row = grid.getByRole("row", { name: /^Shelter \(2\)/ })
    await expect(row).toHaveAttribute("aria-level", "1")
    await expect(row).toHaveAttribute("aria-expanded", "false")
    const cell = row.getByRole("gridcell", { name: /^Shelter \(2\)/ })
    const expand = cell.getByRole("button", { name: "Expand Node" })
    await expect(expand).toHaveAttribute("tabindex", "-1")
    await expect(row).not.toHaveAttribute("id", "fake-group-row")
    await expect(cell).not.toHaveAttribute("id", "fake-group-cell")
    await header.press("ArrowDown")
    await expect(cell).toBeFocused()
    await cell.press("F4")
    await expect(cell).toBeFocused()
    await expect(row).toHaveAttribute("aria-expanded", "true")
    await expect(cell).toHaveAttribute("aria-expanded", "true")
    await expect(cell).toHaveAccessibleDescription("To collapse the row, press the spacebar.")
    await expect(cell.getByRole("button", { name: "Collapse Node" })).toBeVisible()
    await expect(demo.getByRole("alert")).toHaveText("Row expanded")
    await expect(grid.locator("[data-repeated-category]").first()).toHaveText("Shelter")

    await cell.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
    const adjacent = row.locator('[data-column-id="product"]')
    await expect(adjacent).toBeFocused()
    await adjacent.press("Shift+Space")
    await expect(row).toHaveAttribute("aria-expanded", "true")
    await adjacent.press("Space")
    await expect(row).toHaveAttribute("aria-expanded", "false")
    await expect(adjacent).toBeFocused()
    await expect(demo.getByRole("alert")).toHaveText("Row collapsed")
  })
}

test("groups recompute custom localized aggregates on filtering and data changes", async ({ page }) => {
  const demo = page.locator("#analytical-table-group-demo-ltr")
  const grid = demo.getByRole("treegrid")
  const stock = grid.getByRole("row", { name: /^Shelter/ }).locator("[data-aggregate]")
  await expect(stock).toHaveText("3.120,5")
  await demo.getByRole("button", { name: "Receive ten items" }).click()
  await expect(stock).toHaveText("3.140,5")
  const search = demo.getByRole("textbox", { name: "Search grouped inventory" })
  await search.fill("Ridge")
  await expect(grid.getByRole("row", { name: /^Shelter \(1\)/ })).toBeVisible()
  await expect(stock).toHaveText("521,5")
  await expect(grid.getByRole("row", { name: /^Cooking/ })).toHaveCount(0)
  await search.clear()
  await expect(stock).toHaveText("3.140,5")
})

for (const dir of ["ltr", "rtl"]) {
  test(`paired group rows expose their hierarchy while preserving WCR cell states in ${dir}`, async ({ page, context }) => {
    const reference = await context.newPage()
    try {
      const cases = {
        "group-collapsed": [[1, false], [1, false]],
        "group-expanded": [[1, true], null, null, [1, false]],
        "group-nested": [[1, true], [2, true], null, [2, false], [1, false]],
        "group-de-aggregates": [[1, false], [1, false]],
      } as const
      for (const [name, rows] of Object.entries(cases)) {
        const id = `analytical-table-${name}`
        const query = `theme=sap_horizon&dir=${dir}&only=${id}`
        await Promise.all([page.goto(`/index.html?fixtures&ref=wcr&${query}`), reference.goto(`/wcr.html?${query}`)])
        await Promise.all([page, reference].map(canvas => expect(canvas.locator("html")).toHaveAttribute("data-ready", "true")))
        const fixture = `[data-fixture="${id}"]`
        for (const [canvas, role, required] of [[page, "treegrid", false], [reference, "grid", undefined]] as const) {
          const { ax } = await captureAX(canvas, fixture)
          const [host] = ax as { children: { role: string; properties: { required?: boolean } }[] }[]
          expect(host.children[0].role).toBe(role)
          expect(host.children[0].properties.required).toBe(required)
        }
        const ours = page.locator(fixture).getByRole("treegrid").getByRole("row")
        const wcr = reference.locator(fixture).getByRole("grid").getByRole("row")
        await expect(ours).toHaveCount(rows.length + 1)
        await expect(wcr).toHaveCount(rows.length + 1)
        for (const [index, expected] of rows.entries()) {
          const row = ours.nth(index + 1)
          const nativeRow = wcr.nth(index + 1)
          await expect(nativeRow).not.toHaveAttribute("aria-level")
          await expect(nativeRow).not.toHaveAttribute("aria-expanded")
          if (expected === null) {
            await expect(row).not.toHaveAttribute("aria-level")
            await expect(row).not.toHaveAttribute("aria-expanded")
            continue
          }
          const [level, expanded] = expected
          await expect(row).toHaveAttribute("aria-level", String(level))
          await expect(row).toHaveAttribute("aria-expanded", String(expanded))
          for (const [node, canvas] of [[row, page], [nativeRow, reference]] as const) {
            const pivot = node.getByRole("gridcell").filter({ has: canvas.getByRole("button", {
              name: expanded ? "Collapse Node" : "Expand Node",
            }) })
            await expect(pivot).toHaveAttribute("aria-expanded", String(expanded))
            await expect(pivot).toHaveAccessibleName(/\(\d+\)/)
          }
        }
      }
    } finally {
      await reference.close()
    }
  })
}

for (const dir of ["ltr", "rtl"] as const) {
  test(`tree rows keep owned hierarchy, row details and selection in ${dir}`, async ({ page }) => {
    const demo = page.locator(`#analytical-table-row-demo-${dir}`)
    const grid = demo.getByRole("treegrid", { name: "Inventory hierarchy" })
    const camping = grid.getByRole("gridcell", { name: /^Camping(?: Product)?$/ })
    const parent = grid.getByRole("row").filter({ has: page.getByRole("gridcell", { name: /^Camping(?: Product)?$/ }) })
    await expect(parent).toHaveAttribute("aria-level", "1")
    await expect(parent).toHaveAttribute("aria-expanded", "false")
    await expect(parent).toHaveAttribute("aria-setsize", "2")
    await expect(parent).toHaveAttribute("aria-posinset", "1")
    await expect(camping).toHaveAttribute("aria-expanded", "false")
    await expect(demo.locator("#fake-tree-row, #fake-tree-cell")).toHaveCount(0)
    await camping.focus()
    await camping.press(dir === "rtl" ? "ArrowLeft" : "ArrowRight")
    const shelter = grid.getByRole("gridcell", { name: /^Shelter(?: Product)?$/ })
    await expect(shelter).toBeVisible()
    await expect(camping).toBeFocused()
    await expect(parent).toHaveAttribute("aria-expanded", "true")
    const inspector = grid.getByRole("button", { name: "Inspect Camping" })
    await expect(inspector).toBeVisible()
    await camping.press("ArrowDown")
    const panel = inspector.locator("xpath=ancestor::*[@data-slot='analytical-table-sub-component']")
    await expect(panel).toBeFocused()
    await panel.press("F2")
    await expect(inspector).toBeFocused()
    await inspector.press("F2")
    await expect(panel).toBeFocused()
    await panel.press("ArrowUp")
    await expect(camping).toBeFocused()
    await inspector.click()
    await expect(demo.getByLabel("Selected row IDs")).toBeEmpty()
    await expect(demo.locator('[data-slot="analytical-table-announcement"]')).toContainText("Row expanded")
    await shelter.focus()
    await shelter.press("+")
    await expect(grid.getByRole("gridcell", { name: /^Alpine Tent(?: Product)?$/ })).toBeVisible()
    await expect(grid.getByRole("row").filter({ has: page.getByRole("gridcell", { name: /^Alpine Tent(?: Product)?$/ }) })).toHaveAttribute("aria-level", "3")
    await shelter.press("-")
    await expect(grid.getByRole("gridcell", { name: /^Alpine Tent(?: Product)?$/ })).toHaveCount(0)
    await camping.press(dir === "rtl" ? "ArrowRight" : "ArrowLeft")
    await expect(parent).toHaveAttribute("aria-expanded", "false")
    await expect(inspector).toHaveCount(0)
    const selector = parent.locator('[data-selection-cell="true"]')
    await selector.press("Space")
    await expect(selector).toHaveAttribute("aria-selected", "true")
    await expect(demo.getByLabel("Selected row IDs")).toHaveText("0,0.0,0.0.0,0.1")
    await expect(demo.getByLabel("Row event")).toHaveText("Selected Camping")
    const disabled = grid.getByRole("row").filter({ has: page.getByRole("gridcell", { name: /^Camp Lantern(?: Product)?$/ }) }).locator("[data-selection-disabled]")
    await expect(disabled).toHaveAttribute("aria-disabled", "true")
    await disabled.press("Enter")
    await expect(demo.getByLabel("Selected row IDs")).toHaveText("0,0.0,0.0.0,0.1")
    const header = grid.getByRole("columnheader", { name: "Selection Column" })
    await expect(header).not.toHaveAttribute("data-selection-cell")
    await header.press("Enter")
    await expect(selector).toHaveAttribute("aria-selected", "true")
    await selector.press("Space")
    await expect(selector).toHaveAttribute("aria-selected", "false")
    await expect(demo.getByLabel("Selected row IDs")).toBeEmpty()
    await expect(demo.locator('[data-slot="analytical-table-announcement"]')).toContainText("deselected")
    await camping.click({ button: "right" })
    await expect(demo.getByLabel("Row event")).toHaveText("Camping: product")
  })
}

test("fixtures: select all, shift range, partial and single selection retain distinct modes", async ({ page }) => {
  const query = "/index.html?fixtures&ref=wcr&only=analytical-table-"
  const grid = page.getByRole("grid", { name: "Inventory" })
  await page.goto(query + "select-multiple-rowselector")
  const selectors = grid.locator('[role="gridcell"][data-selection-cell]')
  const countSelected = () => grid.locator('[role="row"][data-is-selected]')
  await expect(countSelected()).toHaveCount(1)
  await expect(grid.getByRole("columnheader", { name: "Selection Column" }).locator("[data-state=indeterminate]")).toBeVisible()
  await grid.getByRole("gridcell", { name: /^Alpine Tent(?: Product)?$/ }).click()
  await expect(countSelected()).toHaveCount(1)
  await selectors.nth(0).press("Enter")
  await expect(selectors.nth(0)).toHaveAttribute("aria-selected", "true")
  await selectors.nth(3).press("Shift+Space")
  await expect(countSelected()).toHaveCount(4)
  await grid.getByRole("columnheader", { name: "Selection Column" }).press("Space")
  await expect(countSelected()).toHaveCount(5)
  await page.goto(query + "select-single-rowonly")
  await expect(grid.getByRole("columnheader", { name: "Selection Column" })).toHaveCount(0)
  await expect(countSelected()).toHaveCount(1)
  const alpine = grid.getByRole("gridcell", { name: /^Alpine Tent(?: Product)?$/ })
  await alpine.press("Space")
  await expect(alpine).toHaveAttribute("aria-selected", "true")
  await expect(countSelected()).toHaveCount(1)
})

for (const dir of ["ltr", "rtl"] as const) {
  test(`fixtures: paired tree rows expose their hierarchy and disclosure names in ${dir}`, async ({ page, context }) => {
    const reference = await context.newPage()
    try {
      const fixture = "analytical-table-tree-expanded"
      const query = `theme=sap_horizon&dir=${dir}&only=${fixture}`
      await Promise.all([page.goto(`/index.html?fixtures&ref=wcr&${query}`), reference.goto(`/wcr.html?${query}`)])
      const canvas = [page, reference]
      for (const target of canvas) await expect(target.locator("html")).toHaveAttribute("data-ready", "true")
      const [actual, native] = canvas.map(target => target.locator(`[data-fixture="${fixture}"]`).getByRole("treegrid").getByRole("row"))
      for (const [index, [level, setsize, posinset]] of [[1, 2, 1], [2, 2, 1], [3, 1, 1], [2, 2, 2], [1, 2, 2]].entries()) {
        const row = actual.nth(index + 1)
        const nativeRow = native.nth(index + 1)
        await expect(row).toHaveAttribute("aria-level", String(level))
        await expect(row).toHaveAttribute("aria-setsize", String(setsize))
        await expect(row).toHaveAttribute("aria-posinset", String(posinset))
        await expect(nativeRow).not.toHaveAttribute("aria-level")
        await expect(nativeRow).not.toHaveAttribute("aria-expanded")
        if (index > 1) continue
        await expect(row).toHaveAttribute("aria-expanded", "true")
        const firstActual = row.getByRole("gridcell").first()
        const firstNative = nativeRow.getByRole("gridcell").first()
        for (const cell of [firstActual, firstNative]) await expect(cell).toHaveAttribute("aria-expanded", "true")
        await expect(firstActual.getByRole("button")).toHaveAccessibleName("Collapse Node")
        const nativeButton = firstNative.locator("ui5-button").getByRole("button")
        await expect(nativeButton).toHaveAccessibleName("")
        await nativeButton.focus()
        await expect(nativeButton).toHaveAccessibleName("Collapse Node")
      }
    } finally {
      await reference.close()
    }
  })
}
