import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { build } from "vite"
import { aliases } from "../vite.aliases"

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
        expect(result.violations, path).toEqual([])
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
