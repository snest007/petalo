import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { staleCaseCoverage, treeBaselineDate } from "./a11y-tree-baseline"
import { treeReportDirectory, treeReportFile, writeMatrixCoverage } from "./a11y-tree-coverage"
import { allowedDifferences, compareCase, pageAX, writeComparisonReport } from "./a11y-tree-normalize"

for (const direction of ["ltr", "rtl"] as const) test(`all Web Component accessibility trees ${direction}`, async ({ browser }) => {
    test.setTimeout(300_000)
    const ours = await browser.newPage(), reference = await browser.newPage()
    const allowed = allowedDifferences("docs/src/fixtures")
    try {
      await Promise.all([ours.clock.setFixedTime(treeBaselineDate), reference.clock.setFixedTime(treeBaselineDate)])
      const query = `theme=sap_horizon&density=cozy&dir=${direction}`
      await Promise.all([ours.goto(`/index.html?fixtures&${query}`), reference.goto(`/ui5.html?${query}`)])
      await Promise.all([ours.waitForSelector("html[data-ready=true]"), reference.waitForSelector("html[data-ready=true]")])
      const referenceIds = await reference.locator("[data-fixture]").evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset.fixture!))
      const oursIds: string[] = await ours.evaluate(() => (window as any).__fixtures.map((cell: any) => cell.id))
      expect(referenceIds.length).toBeGreaterThan(0)
      const rendererNames = readdirSync("docs/src/fixtures").filter((file) => file.endsWith(".ui5.ts")).map((file) => file.slice(0, -7))
      const pairedIds = oursIds.filter((id) => rendererNames.some((name) => id === name || id.startsWith(`${name}-`)))
      const unpairedIds = oursIds.filter((id) => !pairedIds.includes(id))
      mkdirSync(treeReportDirectory, { recursive: true })
      writeFileSync(`${treeReportDirectory}/a11y-tree-coverage-${direction}.json`, JSON.stringify({
        pairedIds: [...pairedIds].sort(), referenceIds: [...referenceIds].sort(), unpairedIds,
        unpairedReason: "No checked-in Web Component renderer for the owning fixture set; no reference was silently inferred.",
      }, null, 2))
      expect([...referenceIds].sort(), "Every paired React fixture needs exactly one native fixture, in both directions").toEqual([...pairedIds].sort())
      const directionalIds = direction === "ltr" ? referenceIds : referenceIds.filter((id) => /^(analytical-table|input-suggestions|split-button|button-badge|numeric-input|slider|step-input|carousel|calendar|date-picker|date-range-picker|date-time-picker|time-picker|segmented-button)/.test(id))
      writeMatrixCoverage(`webcomponents/${direction}`, directionalIds)
      if (!process.env.E4_A11Y_COMPONENT && existsSync("tests/a11y-tree-baseline.json")) expect(staleCaseCoverage(`webcomponents/${direction}`, directionalIds)).toEqual([])
      const ids = directionalIds.filter((id) => !process.env.E4_A11Y_COMPONENT || id.startsWith(`${process.env.E4_A11Y_COMPONENT}-`))
      expect(ids.length, "The selected matrix must compare at least one fixture").toBeGreaterThan(0)
      // The matrix has no actions: one settled Chromium tree per page, and a fresh locator snapshot per case.
      const [oursAX, referenceAX] = await Promise.all([pageAX(ours), pageAX(reference)])
      const failures: string[] = []
      for (const id of ids) {
        if (id === "list-custom-focused") {
          // Other focused/popup fixtures can take focus on the shared matrix page.
          // This state specifically tests CustomAnnouncement's focus-time name:
          // mount the existing owning fixture alone and capture its real focus.
          const focusedOurs = await browser.newPage(), focusedReference = await browser.newPage()
          try {
            await Promise.all([focusedOurs.clock.setFixedTime(treeBaselineDate), focusedReference.clock.setFixedTime(treeBaselineDate)])
            await focusedOurs.goto(`/index.html?fixtures&${query}&only=${id}`)
            await focusedOurs.waitForSelector("html[data-ready=true]")
            await expect(focusedOurs.locator(`[data-fixture="${id}"] [data-slot="list-item"]`)).toBeFocused()
            await focusedReference.goto(`/ui5.html?${query}&only=${id}`)
            await focusedReference.waitForSelector("html[data-ready=true]")
            await expect(focusedReference.locator(`[data-fixture="${id}"] ui5-li-custom li`)).toBeFocused()
            failures.push(...await compareCase(focusedOurs, focusedReference, id, `webcomponents/${direction}/${id}`, allowed[id]))
          } finally { await focusedOurs.close(); await focusedReference.close() }
        } else failures.push(...await compareCase(ours, reference, id, `webcomponents/${direction}/${id}`, allowed[id], undefined, { ours: oursAX, reference: referenceAX }))
      }
      expect(failures.length, `${failures.length} difference lines; full captures: ${treeReportFile}\n${failures.slice(0, 20).join("\n")}`).toBe(0)
    } finally { writeComparisonReport(); await Promise.all([ours.close(), reference.close()]) }
  })
