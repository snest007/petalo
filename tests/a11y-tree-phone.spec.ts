import { existsSync, readFileSync, readdirSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { expect, test, type Page } from "@playwright/test"
import ts from "typescript"
import { staleCaseCoverage, treeBaselineDate } from "./a11y-tree-baseline"
import { writeMatrixCoverage } from "./a11y-tree-coverage"
import { allowedDifferences, compareCase, recordComparison, writeComparisonReport } from "./a11y-tree-normalize"

// Read the checked-in self-contained cases expressions without importing React
// renderers. Runtime coverage also checks both pages so no new case can disappear.
function phoneCaseIds() {
  const ids: string[] = []
  for (const file of readdirSync("docs/src/fixtures-phone").filter((name) => name.endsWith(".tsx"))) {
    const source = ts.createSourceFile(file, readFileSync(`docs/src/fixtures-phone/${file}`, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === "defineFixtures" && ts.isObjectLiteralExpression(node.arguments[0])) {
        const property = node.arguments[0].properties.find((member) => ts.isPropertyAssignment(member) && member.name.getText(source) === "cases") as ts.PropertyAssignment | undefined
        if (!property) throw new Error(`${file}: missing checked-in cases`)
        const javascript = ts.transpileModule(`var cases = (${property.initializer.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ESNext } }).outputText
        const context: { cases?: { id: string }[] } = {}
        runInNewContext(javascript, context, { timeout: 1000 })
        if (!Array.isArray(context.cases) || context.cases.some((entry) => typeof entry.id !== "string")) throw new Error(`${file}: invalid cases`)
        ids.push(...context.cases.map((entry) => entry.id))
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error("Phone case IDs must be nonempty and unique")
  return ids.sort()
}

const ids = phoneCaseIds()
const allowed = allowedDifferences("docs/src/fixtures-phone")
const query = "fixtures-phone&theme=sap_horizon&density=cozy"
const options = { viewport: { width: 375, height: 667 }, hasTouch: true }
const secondary = ["time-picker-inputs", "search-scopes", "shellbar-search-scopes"]
if (existsSync("tests/a11y-tree-baseline.json")) test("phone baseline has no removed cases", () => expect(staleCaseCoverage("phone/ltr", [...ids, ...secondary])).toEqual([]))

function diagnostics(page: Page) {
  const events: { channel: string; message: string }[] = []
  const append = (channel: string, message: string) => { if (events.length < 100) events.push({ channel, message }) }
  page.on("console", (message) => append(`console:${message.type()}`, message.text()))
  page.on("pageerror", (error) => append("runtime-error", error.message))
  page.on("requestfailed", (request) => append("request-failed", `${request.url()}: ${request.failure()?.errorText}`))
  page.on("response", (response) => { if (response.status() >= 400) append("http-error", `${response.status()} ${response.url()}`) })
  return async () => ({
    url: page.url(), events,
    runtime: await Promise.race([page.evaluate(() => {
      const elements: Element[] = []
      const collect = (root: ParentNode) => { for (const element of root.querySelectorAll("*")) { elements.push(element); if (element.shadowRoot) collect(element.shadowRoot) } }
      collect(document)
      return {
        ready: document.documentElement.dataset.ready ?? null,
        fixtures: [...document.querySelectorAll<HTMLElement>("[data-fixture]")].map((element) => element.dataset.fixture),
        activeElement: document.activeElement?.tagName,
        surfaces: elements.filter((element) => element.localName === "ui5-dialog" || element.getAttribute("role") === "dialog").map((element) => ({
          tag: element.localName, id: element.id, open: element.hasAttribute("open"), hidden: element.hasAttribute("hidden"),
          opacity: getComputedStyle(element).opacity, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
        })),
      }
    }).catch((error) => ({ unavailable: String(error) })),
    // A real renderer stall must not consume this test's remaining deadline and
    // erase the original side/URL/error record. This bounds diagnostics only.
    new Promise((resolve) => setTimeout(() => resolve({ unavailable: "Runtime probe did not respond within 2000ms" }), 2000))]),
  })
}

test.afterEach(() => writeComparisonReport())

test("phone fixture definitions agree with both runtime pages", async ({ browser }) => {
  const ours = await browser.newPage(options), reference = await browser.newPage(options)
  try {
    for (const [index, page] of [ours, reference].entries()) {
      await page.clock.setFixedTime(treeBaselineDate)
      await page.goto(`/${index ? "ui5" : "index"}.html?${query}`)
      await page.waitForSelector("html[data-ready=true]")
      const runtimeIds: string[] = await page.evaluate(() => (window as any).__fixtures.map((entry: any) => entry.id))
      expect(runtimeIds.sort(), index ? "native UI5 coverage" : "React coverage").toEqual(ids)
    }
    writeMatrixCoverage("phone/ltr", [...ids, ...secondary])
  } finally { await ours.close(); await reference.close() }
})

for (const id of [...ids, ...secondary].filter((id) => !process.env.E4_A11Y_CASE || id === process.env.E4_A11Y_CASE)) test(`phone accessibility tree ${id}`, async ({ browser }) => {
  test.setTimeout(90_000)
  const ours = await browser.newPage(options), reference = await browser.newPage(options)
  const readers = [diagnostics(ours), diagnostics(reference)]
  let stage = "React readiness"
  try {
    for (const [index, page] of [ours, reference].entries()) {
      await page.clock.setFixedTime(treeBaselineDate)
      stage = index ? "native UI5 readiness" : "React readiness"
      const isSecondary = secondary.includes(id)
      const isTimeView = id === "date-time-picker-phone-time"
      const kind = id === "time-picker-inputs" ? "time-picker" : id === "search-scopes" ? "search" : "shellbar-search"
      const fixture = isSecondary ? `${kind}-phone${kind === "time-picker" ? "" : "-scopes"}` : id
      await page.goto(`/${index ? "ui5" : "index"}.html?${query}&only=${fixture}${isSecondary || isTimeView ? "&interactive" : ""}`)
      await page.waitForSelector("html[data-ready=true]", { timeout: 30_000 })
      await expect(page.locator(`[data-fixture="${fixture}"]`)).toHaveCount(1)
      if (isTimeView) {
        // d1b-popups.tsx's document-wide timeView MutationObserver clicks on
        // every child mutation. SegmentedButton's correctly repeated announcement
        // creates another mutation, so that preparer enters a renderer loop.
        // Apply the fixture's same public opening/toggle actions once, then wait
        // for the owned time state; retain the real popup and its full AX tree.
        const holder = page.locator("#date-time-picker-phone-demo")
        if (index) await holder.locator("ui5-datetime-picker").evaluate((field: any) => { field.open = true })
        else await holder.locator('[data-slot="picker-field-icon"]').click()
        await expect((index ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"]')).last()).toBeVisible()
        const surface = index ? holder : page.locator('[role="dialog"]').last()
        const time = surface.getByRole("option", { name: "Time", exact: true })
        await time.click()
        await expect(time).toHaveAttribute("aria-selected", "true")
        await expect(surface.getByRole("spinbutton", { name: "Hours", exact: true })).toBeVisible()
        if (index) await holder.evaluate(async (node: any) => node.phoneRenderFinished())
        await page.evaluate(() => document.fonts.ready)
      }
      if (!isSecondary) {
        const dialog = (index ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"]')).last()
        await expect(dialog).toBeVisible()
        if (index) await expect(dialog).toHaveCSS("opacity", "1")
      } else {
        const holder = page.locator(`#${kind}-phone-demo`)
        if (kind === "time-picker") {
          await holder.locator("input").first().click()
          await expect(index ? holder.locator("ui5-time-selection-inputs") : page.locator('[data-slot="time-selection-inputs"]')).toBeVisible()
          if (index) await expect(holder.locator("ui5-popover[open]")).toHaveCSS("opacity", "1")
        } else {
          if (kind === "shellbar-search") {
            await holder.getByRole("button", { name: "Open Search", exact: true }).click()
            await expect(index ? page.locator("ui5-dialog[open]") : page.locator('[role="dialog"]')).toBeVisible()
            if (index) await expect(page.locator("ui5-dialog[open]")).toHaveCSS("opacity", "1")
          }
          await (index ? holder : kind === "search" ? holder : page.locator('[role="dialog"]')).getByRole("button", { name: "Select Scope", exact: true }).click()
          const active = index ? holder.locator('ui5-responsive-popover[id$="-scope-popover"] ui5-dialog[open]') : page.locator('[role="dialog"].fiori-search-phone-scope')
          await expect(active).toHaveCSS("width", "375px")
          await expect(active).toHaveCSS("height", "667px")
          if (index) await expect(active).toHaveCSS("opacity", "1")
        }
        if (index) await holder.evaluate(async (node: any) => node.phoneRenderFinished())
        await page.evaluate(() => document.fonts.ready)
      }
    }
    stage = "tree comparison"
    // Compare the isolated page, including portalled surfaces and parent dialogs.
    // The modal Input owns the active editor and hides the background field.
    // UI5's phone Popup exposes its covered opener in the page AX tree.
    const selector = id.startsWith("input-suggestions-phone") ? '[role="dialog"]' : "body"
    const differences = await compareCase(ours, reference, id, `phone/ltr/${id}`, allowed[id], selector)
    expect(differences.length, `${differences.length} difference lines; full capture: test-results/a11y-tree-report.json\n${differences.slice(0, 20).join("\n")}`).toBe(0)
  } catch (error) {
    if (stage !== "tree comparison") recordComparison(`phone/ltr/${id}`, {
      captured: false, readinessSide: stage, readinessError: String(error), differences: [String(error)],
      ours: await readers[0](), ui5: await readers[1](), diagnosticFilter: process.env.E4_A11Y_CASE,
    })
    throw error
  } finally { await ours.close(); await reference.close() }
})
