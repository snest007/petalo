import { expect, test } from "@playwright/test"
import { staleCaseCoverage } from "./a11y-tree-baseline"
import { writeMatrixCoverage } from "./a11y-tree-coverage"
import { allowedDifferences, compareCase, pageAX, writeComparisonReport } from "./a11y-tree-normalize"

for (const dir of ["ltr", "rtl"]) {
  test(`WCR accessibility trees ${dir}`, async ({ page: ours, context }) => {
    const wcr = await context.newPage()
    const query = `theme=sap_horizon&density=cozy&dir=${dir}`
    const matrix = `wcr/${dir}`
    try {
      await Promise.all([ours.goto(`/index.html?fixtures&ref=wcr&${query}`), wcr.goto(`/wcr.html?${query}`)])
      await Promise.all([ours, wcr].map((page) => page.waitForSelector("html[data-ready=true]")))
      const idsFor = (page: typeof ours) => page.locator("[data-fixture]").evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset.fixture!))
      const [ids, referenceIds] = await Promise.all([idsFor(ours), idsFor(wcr)])
      expect(ids.length).toBeGreaterThan(0)
      expect([...referenceIds].sort()).toEqual([...ids].sort())
      writeMatrixCoverage(matrix, ids)
      const allowed = allowedDifferences("docs/src/fixtures")
      const [oursAX, referenceAX] = await Promise.all([pageAX(ours), pageAX(wcr)])
      const failures = staleCaseCoverage(matrix, ids)
      for (const id of ids) failures.push(...await compareCase(ours, wcr, id, `${matrix}/${id}`, allowed[id], undefined, { ours: oursAX, reference: referenceAX }))
      expect(failures, failures.slice(0, 20).join("\n")).toEqual([])
    } finally {
      writeComparisonReport()
      await wcr.close()
    }
  })
}
