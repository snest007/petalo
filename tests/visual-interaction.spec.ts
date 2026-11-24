// Interaction-state pixel comparison against the installed UI5 2.28 reference.
import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { assertPopupsInCells } from "./visual-popup-cell"

const THEMES = ["sap_horizon", "sap_horizon_hcb"]
const CASES = [
  ...["default", "emphasized", "transparent", "positive", "negative", "attention"].map((design) => `button-${design}`),
  "toggle-button-default", "toggle-button-default-pressed", "segmented-button", "checkbox-text",
  "radio-group-text", "switch", "input-value", "select", "combobox-value", "link-default",
  "tabs-text", "list-basic", "table-interactive", "side-navigation-flat", "shell-bar-interaction",
  "menu-interaction", "card-interactive", "panel-expanded",
]
const visualOnly = process.env.VISUAL_ONLY
const prefixes = visualOnly === undefined ? undefined : visualOnly.split(",").map((prefix) => prefix.trim()).filter(Boolean)
const selectedCases = prefixes ? CASES.filter((id) => prefixes.some((prefix) => id.startsWith(prefix))) : CASES
type CaseInfo = { id: string; tolerance: number; interact?: { selector?: string; ui5Selector?: string } }
type State = "focus" | "hover" | "active"
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

async function open(page: Page, url: string, id: string) {
  await page.goto(url)
  await page.waitForSelector("html[data-ready=true]")
  await expect(page.locator("[data-fixture]")).toHaveCount(1)
  await expect(page.locator("[data-fixture]")).toHaveAttribute("data-fixture", id)
  await page.mouse.move(0, 0)
}

async function target(page: Page, id: string, selector?: string, ui5 = false) {
  const cell = page.locator(`[data-fixture="${id}"]`)
  if (selector) return cell.locator(selector).first()
  // Playwright pierces open shadow roots. UI5's first keyboard stop is often its internal
  // native element; point the mouse at its component host while keeping the same tab stop.
  const focusable = cell.locator(FOCUSABLE).filter({ visible: true }).first()
  await expect(focusable).toBeVisible()
  if (!ui5) return focusable
  await focusable.evaluate((el) => {
    const root = el.getRootNode()
    const host = root instanceof ShadowRoot ? root.host : el
    host.setAttribute("data-interaction-target", "")
  })
  return cell.locator("[data-interaction-target]")
}

async function keyboardFocused(target: Locator) {
  return target.evaluate((el) => {
    let focused = document.activeElement
    while (focused?.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement
    if (!focused?.matches(":focus-visible")) return false
    let current: Node | null = focused
    while (current) {
      if (current === el) return true
      const root: Node = current.getRootNode()
      current = current.parentNode ?? (root instanceof ShadowRoot ? root.host : null)
    }
    return false
  })
}

async function focusByKeyboard(page: Page, target: Locator) {
  await page.keyboard.press("Tab")
  await expect.poll(() => keyboardFocused(target), "Tab must reach the target with :focus-visible").toBe(true)
}

async function blur(page: Page) {
  await page.evaluate(() => {
    let active = document.activeElement as HTMLElement | null
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement as HTMLElement
    active?.blur()
  })
}

async function shot(page: Page, id: string) {
  await assertPopupsInCells(page)
  return PNG.sync.read(await page.locator(`[data-fixture="${id}"]`).screenshot({ animations: "disabled", caret: "hide" }))
}

// Keep a real test to report a bad filter even when selection would otherwise collect zero tests.
for (const theme of THEMES) for (const id of selectedCases.length ? selectedCases : [CASES[0]]) {
  test(`${theme} cozy ${id} interaction states match UI5`, async ({ browser }) => {
    if (prefixes) expect(selectedCases.length, `VISUAL_ONLY=${visualOnly}: no fixtures matched`).toBeGreaterThan(0)
    const ours = await browser.newPage()
    const ui5 = await browser.newPage()
    const query = `theme=${theme}&density=cozy&only=${encodeURIComponent(id)}`
    const dir = `test-results/visual-interaction/${theme}-cozy/${id}`
    mkdirSync(dir, { recursive: true })
    const report: Record<string, { ratio: number; size: string }> = {}
    const failures: string[] = []
    try {
      await Promise.all([open(ours, `/index.html?fixtures&${query}`, id), open(ui5, `/ui5.html?${query}`, id)])
      const cases: CaseInfo[] = await ours.evaluate(() => (window as any).__fixtures)
      expect(cases.map((c) => c.id)).toEqual([id])
      expect(cases[0].tolerance).toBe(0.02)
      const a = await target(ours, id, cases[0].interact?.selector)
      const b = await target(ui5, id, cases[0].interact?.ui5Selector, true)
      await Promise.all([expect(a).toBeVisible(), expect(b).toBeVisible()])
      if (id === "menu-interaction") {
        // Match the dedicated UI5 in-place fixture: popup boundary sentinels wrap a
        // modal popup, whereas this one isolated surface must allow Tab into its row.
        await ours.locator("[data-radix-focus-guard]").evaluateAll((guards) => guards.forEach((guard) => guard.setAttribute("tabindex", "-1")))
      }
      const compare = async (state: State) => {
        const [x, y] = await Promise.all([shot(ours, id), shot(ui5, id)])
        writeFileSync(`${dir}/${state}-ours.png`, PNG.sync.write(x))
        writeFileSync(`${dir}/${state}-ui5.png`, PNG.sync.write(y))
        const size = `${x.width}x${x.height} vs UI5 ${y.width}x${y.height}`
        if (x.width !== y.width || x.height !== y.height) {
          report[state] = { ratio: 1, size }
          failures.push(`${state}: size ${size}`)
          return
        }
        const diff = new PNG({ width: x.width, height: x.height })
        const ratio = pixelmatch(x.data, y.data, diff.data, x.width, x.height, { threshold: 0.1 }) / (x.width * x.height)
        report[state] = { ratio, size }
        if (ratio > 0.02) {
          writeFileSync(`${dir}/${state}-diff.png`, PNG.sync.write(diff))
          failures.push(`${state}: ${(ratio * 100).toFixed(2)}% pixels differ`)
        }
      }
      await Promise.all([focusByKeyboard(ours, a), focusByKeyboard(ui5, b)])
      await compare("focus")
      await Promise.all([blur(ours), blur(ui5)])
      await Promise.all([a.hover(), b.hover()])
      // Menu._itemMouseOver focuses its row. Compare hover independently of the
      // known desktop pointer-focus policy, on both pages, before any mouse press.
      await Promise.all([blur(ours), blur(ui5)])
      await compare("hover")
      await Promise.all([blur(ours), blur(ui5)])
      // E1 compares held-button appearance separately from the known UI5 desktop mouse-focus
      // ring difference. Button.css.js uses :focus-within on desktop; Button._onfocusout
      // cancels active, so blurring AFTER mouse down would erase the state under test.
      // Suppress only the native focus default symmetrically. Real mouse events still reach
      // every handler; theme/desktop CSS and the independent Tab focus pass stay untouched.
      await Promise.all([ours, ui5].map((page) => page.evaluate(() => {
        document.addEventListener("mousedown", (event) => event.preventDefault(), { capture: true, once: true })
      })))
      try {
        await Promise.all([ours.mouse.down(), ui5.mouse.down()])
        await expect.poll(() => a.evaluate((el) => el.matches(":active"))).toBe(true)
        await expect.poll(() => b.evaluate((el) => el.matches(":active"))).toBe(true)
        if (id.startsWith("button-") || id.startsWith("toggle-button-")) {
          await expect(b).toHaveAttribute("active", "")
          await Promise.all([expect(ours.locator("body")).toBeFocused(), expect(ui5.locator("body")).toBeFocused()])
        }
        await compare("active")
      } finally {
        await Promise.all([ours.mouse.up(), ui5.mouse.up()])
        await expect.poll(() => a.evaluate((el) => el.matches(":active"))).toBe(false)
        await expect.poll(() => b.evaluate((el) => el.matches(":active"))).toBe(false)
      }
      expect(failures, failures.join("\n")).toEqual([])
    } finally {
      writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2))
      await Promise.all([ours.close(), ui5.close()])
    }
  })
}
