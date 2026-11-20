import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { allowedDifferences, applyAllowedWrappers, captureAX, diffTree } from "./a11y-tree-normalize"

for (const dir of ["ltr", "rtl"]) {
  test(`WCR accessibility trees ${dir}`, async ({ page: ours, context }) => {
    const wcr = await context.newPage()
    const query = `theme=sap_horizon&density=cozy&dir=${dir}`
    await Promise.all([ours.goto(`/index.html?fixtures&ref=wcr&${query}`), wcr.goto(`/wcr.html?${query}`)])
    await Promise.all([ours, wcr].map((page) => page.waitForSelector("html[data-ready=true]")))
    const idsFor = (page: typeof ours) => page.locator("[data-fixture]").evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset.fixture!))
    const [ids, referenceIds] = await Promise.all([idsFor(ours), idsFor(wcr)])
    expect(ids.length).toBeGreaterThan(0)
    expect([...referenceIds].sort()).toEqual([...ids].sort())
    const allowed = allowedDifferences("docs/src/fixtures")
    const output = "test-results/a11y-tree-wcr"
    mkdirSync(output, { recursive: true })

    for (const id of ids) {
      const selector = `[data-fixture="${id}"]`
      const [a, b] = await Promise.all([captureAX(ours, selector), captureAX(wcr, selector)])
      const allowance = allowed[id]
      if (allowance) expect(allowance.reason.trim()).not.toBe("")
      const adjusted = applyAllowedWrappers(a, b, allowance?.ignore ?? [])
      const differences = diffTree(adjusted.ours, adjusted.ui5, adjusted.leaves)
      writeFileSync(`${output}/${dir}-${id}.json`, JSON.stringify({ ours: a, wcr: b, differences, allowance }, null, 2))

      // H0's temporary pilot compares two different grid implementations. Prove
      // that both real captures expose the data and that the comparator detects
      // their structural differences. H1 removes these pilot assertions.
      if (id === "wcr-smoke-table" || id === "wcr-smoke-empty") {
        expect(differences.length, id).toBeGreaterThan(0)
        for (const page of [ours, wcr]) {
          const grid = page.locator(selector).getByRole("grid", { name: "Inventory" })
          await expect(grid.getByRole("columnheader")).toHaveText(["Product", "Category", "Stock"])
          const cells = grid.getByRole("gridcell")
          if (id === "wcr-smoke-table") {
            await expect(cells).toHaveText([
              "Alpine Tent", "Shelter", "24",
              "Trail Stove", "Cooking", "18",
              "Camp Lantern", "Lighting", "32",
              "Summit Pack", "Packs", "12",
              "Ridge Mat", "Sleeping", "27",
            ])
          } else await expect(cells).toHaveText(/^No data$/i)
        }
      } else {
        expect.soft(differences, `${id}: see ${output}`).toEqual([])
      }
    }
  })
}
