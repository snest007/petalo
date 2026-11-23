import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { allowedDifferences, applyAllowedWrappers, captureAX, diffTree, reconcilePinnedPopupShell } from "./a11y-tree-normalize"

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
      const adjusted = applyAllowedWrappers(a, b, allowance?.ignore ?? [], allowance?.ui5FormHosts)
      let differences: string[]
      try {
        if (allowance?.pinnedPopupShell) {
          expect(id.startsWith("select-dialog-"), "H9 pinned Dialog fixture").toBe(true)
          reconcilePinnedPopupShell(adjusted.ours, adjusted.ui5, allowance.pinnedPopupShell)
        }
        differences = diffTree(adjusted.ours, adjusted.ui5, adjusted.leaves)
      } catch (error) {
        differences = [error instanceof Error ? error.message : String(error)]
      }
      writeFileSync(`${output}/${dir}-${id}.json`, JSON.stringify({ ours: a, wcr: b, differences, allowance }, null, 2))

      expect.soft(differences, `${id}: see ${output}`).toEqual([])
    }
  })
}
