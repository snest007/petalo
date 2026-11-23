import { existsSync } from "node:fs"
import { staleCaseCoverage } from "./a11y-tree-baseline"
import { treeReportFile, writeMatrixCoverage } from "./a11y-tree-coverage"
import { expect, test } from "@playwright/test"
import { allowedDifferences, compareCase, pageAX, writeComparisonReport } from "./a11y-tree-normalize"

test("all OpenUI5 accessibility trees", async ({ browser }) => {
  test.setTimeout(180_000)
  const ours = await browser.newPage(), reference = await browser.newPage()
  const allowed = allowedDifferences("docs/src/fixtures-sapui5")
  try {
    const query = "theme=sap_horizon&density=cozy"
    await Promise.all([ours.goto(`/index.html?fixtures-sapui5&${query}`), reference.goto(`http://localhost:${Number(process.env.SAPUI5_PORT ?? 4174)}/index.html?${query}`)])
    await Promise.all([ours.waitForSelector("html[data-ready=true]"), reference.waitForSelector("html[data-ready=true]", { timeout: 60_000 })])
    expect(await reference.evaluate(() => (window as any).sap.ui.version)).toBe("1.154.0")
    const ids: string[] = await ours.evaluate(() => (window as any).__fixtures.map((cell: any) => cell.id))
    const nativeIds: string[] = await reference.evaluate(() => (window as any).__fixtures.map((cell: any) => cell.id))
    expect(ids.sort()).toEqual(nativeIds.sort())
    writeMatrixCoverage("openui5/ltr", ids)
    if (existsSync("tests/a11y-tree-baseline.json")) expect(staleCaseCoverage("openui5/ltr", ids)).toEqual([])
    const [oursAX, referenceAX] = await Promise.all([pageAX(ours), pageAX(reference)])
    const failures: string[] = []
    for (const id of ids) failures.push(...await compareCase(ours, reference, id, `openui5/ltr/${id}`, allowed[id], undefined, { ours: oursAX, reference: referenceAX }))
    expect(failures.length, `${failures.length} difference lines; full captures: ${treeReportFile}\n${failures.slice(0, 20).join("\n")}`).toBe(0)
  } finally { writeComparisonReport(); await Promise.all([ours.close(), reference.close()]) }
})
