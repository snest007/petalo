import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { execFileSync, spawnSync } from "node:child_process"
import { devices, expect, test, type Locator, type Page } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { formatNumber, formatPercent, parseNumber } from "../registry/lib/fiori-numbers"
import { collatorIncludes, formatSapText } from "../registry/lib/fiori-locale"
import AxeBuilder from "@axe-core/playwright"
import { formatPickerDate } from "../registry/ui/date-picker"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FioriLocaleProvider, useFioriLocale, useFioriTexts } from "../registry/lib/fiori-locale"
import { Card, CardContent } from "../registry/ui/card"
import { auditFailure } from "../scripts/changed-scope.mjs"

const de = JSON.parse(readFileSync("registry/i18n/de.json", "utf8"))
const locales = ["de-DE", "zh-CN", "ar-EG"]
const components = ["calendar", "dynamic-date-range", "date-picker", "date-time-picker", "time-picker", "step-input", "slider"]
const e5Evidence = process.env.E5_EVIDENCE ?? "test-results/i18n"

interface AuditGroup { component: string; owner: string; reference?: "wcr"; rows: { key: string; source: string; status: string; english: string; englishSource: string; triage?: string }[] }
type AuditBaseline = Record<string, { owner: string; gapCount: number; okKeys: string[] }>
function readSourceAudit(): AuditGroup[] {
  // The complete source/reference inventory exceeds execFileSync's default 1 MiB.
  // Preserve every row instead of truncating the audit consumed by the ratchet.
  const script = "scripts/i18n-audit.mjs"
  const result = spawnSync(process.execPath, [script, "--json"], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 })
  const failure = auditFailure(script, result)
  if (failure) throw new Error(failure)
  return (JSON.parse(result.stdout) as { audit: AuditGroup[] }).audit
}
function auditRatchetProblems(audit: AuditGroup[], baseline: AuditBaseline) {
  const problems: string[] = []
  for (const group of audit) {
    const entry = baseline[group.component]
    const gaps = group.rows.filter(row => row.status === "gap").length
    const okKeys = group.rows.filter(row => row.status === "ok" || row.status === "fixed in E5").map(row => row.key).sort()
    if (!entry) { if (gaps) problems.push(`${group.component}: new component has ${gaps} unowned gaps`); continue }
    if (entry.owner !== group.owner) problems.push(`${group.component}: owner must remain ${group.owner}`)
    if (gaps !== entry.gapCount) problems.push(`${group.component}: gap count ${gaps} differs from baseline ${entry.gapCount}; ${gaps < entry.gapCount ? "lower the owning baseline in the same commit" : "new gaps are forbidden"}`)
    for (const key of entry.okKeys) if (!okKeys.includes(key)) problems.push(`${group.component}/${key}: previously implemented key became gap or disappeared`)
    if (JSON.stringify(okKeys) !== JSON.stringify(entry.okKeys)) problems.push(`${group.component}: update the implemented key inventory with the owning baseline`)
  }
  for (const component of Object.keys(baseline)) if (!audit.some(group => group.component === component)) problems.push(`${component}: baseline component disappeared from audit`)
  return problems
}

test.describe("i18n source audit", () => {
  // These tests share one audit. A load failure is reported by the first test
  // and skips its dependents, including the pack regeneration test.
  test.describe.configure({ mode: "serial" })
  let audit: AuditGroup[]
  test.beforeAll(() => { audit = readSourceAudit() })

  test("i18n audit assigns the Calendar pilot to P2a and leaves time controls in P2", () => {
    for (const group of audit.filter((group) => group.reference !== "wcr")) expect(group.owner, group.component).toMatch(/^P(?:2a|[1-6])$/)
    expect(audit.filter(group => group.owner === "P2a").map(group => group.component).sort()).toEqual(["calendar", "date-picker", "date-range-picker", "date-time-picker"])
    for (const name of ["time-picker", "picker-field"]) expect(audit.find(group => group.component === name)?.owner, name).toBe("P2")
  })

  test("i18n audit ratchet guards owning gap counts and every implemented key", () => {
    const baseline = JSON.parse(readFileSync("tests/i18n-audit-baseline.json", "utf8")) as AuditBaseline
    expect(auditRatchetProblems(audit, baseline)).toEqual([])
    for (const group of audit) {
      expect(group.owner, group.component).toMatch(group.reference === "wcr" ? /^H(?:10|[0-9])$/ : /^P(?:2a|[1-6])$/)
      expect(group.rows.filter(row => row.status === "gap").every(row => row.triage), `${group.component}: preserve gap triage`).toBe(true)
    }
    for (const key of ["BUTTON_BADGE_ONE_ITEM", "BUTTON_BADGE_MANY_ITEMS"]) {
      expect(audit.find(group => group.component === "button")?.rows.find(row => row.key === key)?.status).toBe("fixed in E5")
      expect(audit.find(group => group.component === "split-button")?.rows.find(row => row.key === key)?.status).toBe("not rendered")
      expect(de[key]).toBeTruthy()
    }
    expect(audit.find(group => group.component === "numeric-input")?.rows.find(row => row.key === "NUMBERINPUT_DEC_ICON_TITLE")?.status).toBe("not rendered")
    // Exercise regressions against the real source inventory: a gap reduction needs
    // a baseline reduction, and swapping one fixed/gap row cannot hide a lost key.
    const component = audit.find(group => group.rows.some(row => row.status === "gap") && group.rows.some(row => row.status === "fixed in E5"))!
    const changed = structuredClone(component)
    changed.rows.find(row => row.status === "gap")!.status = "fixed in E5"
    expect(auditRatchetProblems([changed], { [component.component]: baseline[component.component] })).toContainEqual(expect.stringContaining("lower the owning baseline in the same commit"))
    const fixed = changed.rows.find((row, index) => component.rows[index].status === "fixed in E5")!
    fixed.status = "gap"
    expect(auditRatchetProblems([changed], { [component.component]: baseline[component.component] })).toContainEqual(expect.stringContaining(`${fixed.key}: previously implemented key became gap`))
    const regressed = structuredClone(component)
    regressed.rows.find(row => row.status === "fixed in E5")!.status = "gap"
    expect(auditRatchetProblems([regressed], { [component.component]: baseline[component.component] })).toContainEqual(expect.stringContaining("new gaps are forbidden"))
    // The native WC contract must survive the sap.m bundle's colliding key.
    for (const name of ["combobox", "select"]) {
      const position = audit.find(group => group.component === name)!.rows.find(row => row.key === "LIST_ITEM_POSITION")!
      expect(position.english).toBe("List item {0} of {1}")
      expect(position.englishSource).toContain("@ui5/webcomponents/dist/generated/i18n/i18n-defaults.js:132")
    }
  })

  test("packs regenerate deterministically and contain audited registry and WCR keys", () => {
    test.setTimeout(30_000)
    const files = () => readdirSync("registry/i18n").sort().map(name => [name, readFileSync(`registry/i18n/${name}`, "utf8")])
    execFileSync(process.execPath, ["scripts/build-i18n-packs.mjs"])
    const before = files()
    execFileSync(process.execPath, ["scripts/build-i18n-packs.mjs"])
    expect(files()).toEqual(before)
    const rendered = new Set(audit.flatMap(group => group.rows.filter(row => row.source === "wcr" || row.status !== "gap").map(row => row.key)))
    const analyticalTable = audit.find(group => group.component === "analytical-table")!
    const wcrKeys = analyticalTable.rows.map(row => row.key)
    expect(wcrKeys).toHaveLength(43)
    expect(wcrKeys).toContain("wcr:LIST_NO_DATA")
    expect(analyticalTable.rows.every(row => row.source === "wcr" && row.key.startsWith("wcr:"))).toBe(true)
    const packs = readdirSync("registry/i18n").filter(name => name.endsWith(".json") && name !== "registry-items.json")
    expect(packs).toHaveLength(48)
    for (const name of packs) {
      const pack = JSON.parse(readFileSync(`registry/i18n/${name}`, "utf8"))
      for (const key of Object.keys(pack)) expect(rendered.has(key), `${name}/${key}`).toBe(true)
      for (const key of wcrKeys) expect(typeof pack[key], `${name}/${key}`).toBe("string")
    }
    expect(de["wcr:LIST_NO_DATA"]).toBe("Keine Daten")
  })
})

test("provider texts reach real controls and component overrides win", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const demo = page.locator("#i18n-demo")
  await expect(demo.locator("#i18n-step input")).toHaveValue("1,5")
  await expect(demo.locator("#i18n-step [data-dir=inc]")).toHaveAttribute("title", de.NUMBERINPUT_INC_ICON_TITLE)
  await expect(demo.locator("#i18n-override [data-dir=inc]")).toHaveAttribute("title", "Component increase")
  await expect(demo.locator("#i18n-calendar").getByRole("button").first()).toHaveAttribute("title", `${de.CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_TITLE} (${de.CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_SHORTCUT})`)
  await expect(demo.locator("#i18n-table")).toContainText(de.TABLE_NO_DATA)
  await expect(demo.locator("#i18n-message button")).toHaveAttribute("aria-label", de.MESSAGE_STRIP_CLOSE_BUTTON_INFORMATION)
  await demo.locator("#i18n-combobox input").press("F4")
  await expect(page.locator("[data-slot=combobox-no-data]")).toHaveText(de.LIST_NO_DATA)
  await demo.locator("#i18n-combobox input").press("Escape")
  await demo.locator("#i18n-select button").click()
  await expect(page.locator("[data-slot=select-no-data]")).toHaveText(de.LIST_NO_DATA)
  await page.keyboard.press("Escape")
  await demo.locator("#i18n-dialog button").click()
  await expect(page.getByRole("dialog").getByRole("button", { name: de.MSGBOX_CLOSE, exact: true })).toBeVisible()
})

test("localized numeric input commits a decimal and formats display values", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const demo = page.locator("#i18n-demo")
  const input = demo.locator("#i18n-step input")
  await input.fill("2,25")
  await input.press("Enter")
  await expect(demo.getByTestId("i18n-value")).toHaveText("2.25")
  await expect(demo.locator("#i18n-slider .fiori-slider__tooltip input")).toHaveValue("0,5")
  await expect(demo.locator("#i18n-progress")).toContainText(formatPercent(0.5, "de-DE"))
  await expect(demo.locator("#i18n-number")).toContainText(formatNumber(1234.5, "de-DE"))
})

test("number parser preserves SAP grouping ambiguity and locale spacing rules", () => {
  expect(parseNumber("2,25", "de-DE")).toBe(2.25)
  expect(parseNumber("1.234,5", "de-DE")).toBe(1234.5)
  expect(parseNumber("1.23", "de-DE")).toBeNaN()
  expect(parseNumber("0.123", "de-DE")).toBeNaN()
  expect(parseNumber("1\u202f234,5", "fr-FR")).toBe(1234.5)
  for (const value of ["1.23", "0.123", "1.234e2"]) expect(parseNumber(value, "fr-FR")).toBeNaN()
  for (const locale of ["de-DE", "fr-FR", "en-US", "zh-CN"]) for (const value of ["50%", "50 %"]) expect(parseNumber(value, locale)).toBe(0.5)
  expect(parseNumber("50%", "ar-EG")).toBe(50)
  expect(parseNumber("2e309", "en-US")).toBe(Infinity)
  expect(parseNumber("0 123", "fr-FR")).toBe(123)
  expect(formatNumber(1234.5, "fr-FR")).toBe(new Intl.NumberFormat("fr-FR").format(1234.5))
  expect(parseNumber("١٬٢٣٤٫٥", "ar-EG")).toBe(1234.5)
})

test("SAP text formatting preserves argument order and literal apostrophes", () => {
  expect(formatSapText("You''ve selected {1}, then {0}.", ["A", "B"])).toBe("You've selected B, then A.")
  expect(formatSapText("'{0}' and {0}", ["A"])).toBe("{0} and A")
})

test("function fallback announcements preserve user labels without a second substitution", () => {
  const defaults = { view: (name: string) => `View ${name}` }
  const keys = { view: "VIEW_NAME" } as const
  function Announcement() { const texts = useFioriTexts(defaults, keys); return React.createElement("output", null, texts.view("{0}x")) }
  expect(renderToStaticMarkup(React.createElement(Announcement))).toBe("<output>View {0}x</output>")
  expect(renderToStaticMarkup(React.createElement(FioriLocaleProvider, { texts: { VIEW_NAME: "Ansicht {0}" } }, React.createElement(Announcement)))).toBe("<output>Ansicht {0}x</output>")
})

test("Card content resolves a nested provider before defaults while explicit Card text props win", () => {
  const nested = (texts?: { content: string }) => renderToStaticMarkup(React.createElement(FioriLocaleProvider, { texts: { ARIA_LABEL_CARD_CONTENT: "Outer content" } }, React.createElement(Card, { texts }, React.createElement(FioriLocaleProvider, { texts: { ARIA_LABEL_CARD_CONTENT: "Nested content" } }, React.createElement(CardContent)))))
  expect(nested()).toContain('aria-label="Nested content"')
  expect(nested({ content: "Explicit parent content" })).toContain('aria-label="Explicit parent content"')
})

test("a text-only provider reaches picker and numeric native validity channels", async ({ page }) => {
  await page.goto("/#/i18n")
  const owner = page.locator("#i18n-text-only")
  for (const [id, message] of [["date", "Text-only date yyyy-MM-dd"], ["range", "Text-only range yyyy-MM-dd"], ["datetime", "Text-only date-time yyyy-MM-dd HH:mm:ss"], ["time", "Text-only time HH:mm:ss"]]) {
    await expect.poll(() => owner.locator(`#i18n-text-only-${id}`).evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(message)
  }
  const number = owner.locator("#i18n-text-only-step")
  await number.fill("1.23")
  await number.press("Enter")
  await expect.poll(() => number.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Text-only precision 1")
})

test("text-only providers translate empty Select and ComboBox lists", async ({ page }) => {
  await page.goto("/#/i18n")
  const combo = page.locator("#i18n-text-only-combobox input")
  await combo.press("F4")
  await expect(page.locator("[data-slot=combobox-no-data]")).toHaveText("Text-only empty")
  await combo.press("Escape")
  await page.locator("#i18n-text-only-select").getByRole("combobox").click()
  await expect(page.locator("[data-slot=select-no-data]")).toHaveText("Text-only empty")
})

for (const locale of ["de-DE", "ar-EG"]) test(`Select translates role, grouped counts and native item positions while text props win (${locale})`, async ({ page }) => {
  const translations = JSON.parse(readFileSync(`registry/i18n/${locale === "de-DE" ? "de" : "ar"}.json`, "utf8"))
  await page.goto(`/?locale=${locale}#/i18n`)
  const owner = page.locator("#i18n-select-announcements")
  const trigger = owner.getByRole("combobox")
  await expect(trigger).toHaveAttribute("aria-roledescription", translations.SELECT_ROLE_DESCRIPTION)
  const count = owner.locator('[data-slot="select-group-count"]')
  await expect(count).toHaveText(formatSapText(translations.SELECT_OPTIONS_IN_GROUPS, [4, 2]))
  await expect(trigger).toHaveAccessibleDescription(`Application description ${formatSapText(translations.SELECT_OPTIONS_IN_GROUPS, [4, 2])}`)
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await trigger.press("F4")
  const choices = page.getByRole("listbox", { name: "Grouped choices", exact: true })
  await expect(choices.getByRole("option", { name: "Standalone", exact: true })).toBeFocused()
  const announcement = page.getByRole("dialog").locator('[data-slot="select-announcement"]')
  await expect(announcement).toHaveAttribute("role", "alert")
  await expect(announcement).toHaveAttribute("aria-live", "polite")
  await expect(announcement).toHaveText(`Standalone ${formatSapText(translations.LIST_ITEM_POSITION, [1, 4])}`)
  await page.keyboard.press("ArrowDown")
  await expect(choices.getByRole("option", { name: "Alpha", exact: true })).toBeFocused()
  await expect(announcement).toHaveText(`Alpha ${formatSapText(translations.LIST_ITEM_POSITION, [2, 4])}`)
  await page.keyboard.press("Shift+B")
  await expect(choices.getByRole("option", { name: "Beta", exact: true })).toBeFocused()
  await expect(announcement).toHaveText(`Beta ${formatSapText(translations.LIST_ITEM_POSITION, [3, 4])}`)
  await page.keyboard.press("Escape")
  await expect(choices).toHaveCount(0)
  const custom = page.locator("#i18n-select-announcements-override")
  const customTrigger = custom.getByRole("combobox")
  await expect(customTrigger).toHaveAttribute("aria-roledescription", "Choice selector")
  await expect(customTrigger).toHaveAccessibleDescription("Choices 2; categories 1")
  await customTrigger.press("F4")
  await expect(page.getByRole("option", { name: "Alpha", exact: true })).toBeFocused()
  await expect(page.getByRole("dialog").locator('[data-slot="select-announcement"]')).toHaveText("Alpha Entry 1 among 2")
})

test("Tag composes translated hidden descriptions and preserves complete legacy overrides", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const descriptions = page.locator('#i18n-tag [data-slot="tag"] > .sr-only')
  await expect(descriptions).toHaveText([`${de.TAG_DESCRIPTION_TAG} ${de.TAG_ERROR}`, de.TAG_DESCRIPTION_TAG, "Component marker Component error", "Legacy complete description"])
})

test("closed Select Home and End change selection silently like UI5", async ({ browser }) => {
  for (const native of [false, true]) {
    const page = await browser.newPage()
    try {
      await page.goto(native ? "/ui5.html?only=select-a11y-groups" : "/?fixtures&only=select-a11y-groups")
      await page.waitForSelector("html[data-ready=true]")
      const cell = page.locator('[data-fixture="select-a11y-groups"]')
      const trigger = cell.getByRole("combobox")
      await trigger.focus()
      await expect(trigger).toBeFocused()
      const message = page.locator(native ? ".ui5-invisiblemessage-polite" : '[data-slot="select-announcement"]')
      for (const [key, value] of [["End", "China"], ["Home", "Germany"]]) {
        await trigger.press(key)
        await expect(trigger).toHaveText(value)
        if (native) await expect(message).toHaveText("")
        else await expect(message).toHaveCount(0)
      }
      await trigger.press("ArrowDown")
      await expect(trigger).toHaveText("France")
      await expect(message).toHaveText(/France/)
      await trigger.press("End")
      await expect(trigger).toHaveText("China")
      await expect(message).toHaveText(/France/) // silent keys preserve an earlier live message
    } finally { await page.close() }
  }
})

for (const component of ["select", "segmented-button"]) test(`${component} live announcement follows UI5's guarded 3000 ms cleanup`, async ({ browser }) => {
  for (const native of [false, true]) {
    const page = await browser.newPage()
    try {
      const id = component === "select" ? "select-a11y-groups" : component
      await page.goto(native ? `/ui5.html?only=${id}` : `/?fixtures&only=${id}`)
      await page.waitForSelector("html[data-ready=true]")
      const cell = page.locator(`[data-fixture="${id}"]`)
      const frozen = new Date()
      await page.clock.install({ time: frozen })
      await page.clock.pauseAt(frozen)
      const message = page.locator(native ? `.ui5-invisiblemessage-${component === "select" ? "polite" : "assertive"}` : `[data-slot="${component}-announcement"]`)
      const activate = async () => {
        if (component === "select") {
          const trigger = cell.getByRole("combobox")
          await trigger.focus()
          await trigger.press("ArrowDown")
        } else {
          const option = cell.getByRole("option").last()
          await option.focus()
          await option.press("Enter")
        }
      }
      await activate()
      await expect(message).toHaveText(component === "select" ? /France/ : "Selected")
      await page.clock.runFor(2000)
      await activate()
      await expect(message).toHaveText(component === "select" ? /China/ : "Selected")
      await page.clock.runFor(1000)
      // InvisibleMessage's earlier timer clears identical repeated text but leaves
      // a different, newer Select announcement until its own 3000 ms deadline.
      await expect(message).toHaveText(component === "select" ? /China/ : "")
      await page.clock.runFor(1999)
      await expect(message).toHaveText(component === "select" ? /China/ : "")
      await page.clock.runFor(1)
      await expect(message).toHaveText("")
    } finally { await page.close() }
  }
})

for (const locale of ["de-DE", "ar-EG"]) test(`SegmentedButton announces selection assertively and emits nothing on deselection (${locale})`, async ({ page }) => {
  const translations = JSON.parse(readFileSync(`registry/i18n/${locale === "de-DE" ? "de" : "ar"}.json`, "utf8"))
  await page.goto(`/?locale=${locale}#/i18n`)
  const owner = page.locator("#i18n-segmented")
  const beta = owner.getByRole("option", { name: "Beta", exact: true })
  const announcement = page.locator('[data-slot="segmented-button-announcement"][data-owner="Localized views"]')
  await expect(announcement).toHaveText("")
  await beta.focus()
  await expect(beta).toBeFocused()
  await beta.press("Space")
  await expect(beta).toHaveAttribute("aria-selected", "true")
  await expect(announcement).toHaveAttribute("aria-live", "assertive")
  await expect(announcement).toHaveAttribute("role", "alert")
  await expect(announcement).toHaveText(translations.LIST_ITEM_SELECTED)
  const message = await announcement.locator("span").elementHandle()
  await beta.press("Enter")
  await expect(beta).toHaveAttribute("aria-selected", "false")
  expect(await message!.evaluate(node => node.isConnected), "deselection must not replace the live message").toBe(true)
  const custom = page.locator("#i18n-segmented-override")
  await custom.getByRole("option", { name: "Beta", exact: true }).click()
  await expect(page.locator('[data-slot="segmented-button-announcement"][data-owner="Custom views"]')).toHaveText("Component selection")
  const controlled = page.locator("#i18n-segmented-controlled")
  await controlled.getByRole("option", { name: "Beta", exact: true }).click()
  await expect(controlled.getByRole("option", { name: "Beta", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(page.locator('[data-slot="segmented-button-announcement"][data-owner="Controlled views"]')).toHaveText(translations.LIST_ITEM_SELECTED)
  await expect(controlled.getByTestId("i18n-segmented-callback")).toHaveText("")
  const rejected = page.locator("#i18n-segmented-rejected")
  await rejected.getByRole("option", { name: "Beta", exact: true }).click()
  await expect(rejected.getByTestId("i18n-segmented-rejected-attempts")).toHaveText("1")
  await expect(rejected.getByRole("option", { name: "Alpha", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(rejected.getByRole("option", { name: "Beta", exact: true })).toHaveAttribute("aria-selected", "false")
  await expect(page.locator('[data-slot="segmented-button-announcement"][data-owner="Rejected views"]')).toHaveText("")
  await rejected.getByRole("option", { name: "Prevented", exact: true }).click()
  await expect(rejected.getByTestId("i18n-segmented-rejected-attempts")).toHaveText("1")
  await expect(page.locator('[data-slot="segmented-button-announcement"][data-owner="Rejected views"]')).toHaveText("")
})

test("ComboBox navigation announces translated groups and item positions with overridable texts", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-combobox-announcements")
  const input = owner.getByRole("combobox")
  const announcement = async (input: Locator) => {
    const listId = await input.getAttribute("aria-controls")
    return page.locator(`[data-slot="combobox-announcement"][data-owner="${listId?.replace(/-list$/, "")}"]`)
  }
  await input.press("F4")
  await expect(input).toHaveAttribute("aria-controls", /-list$/)
  const status = await announcement(input)
  await expect(status).toHaveText(`A ${formatSapText(de.LIST_ITEM_POSITION, [1, 3])}`)
  await input.press("ArrowUp")
  await expect(status).toHaveText(`${de.LIST_ITEM_GROUP_HEADER} {0}x`)
  await input.press("ArrowDown")
  await expect(status).toHaveText(`A ${formatSapText(de.LIST_ITEM_POSITION, [1, 3])}`)
  await input.press("ArrowDown")
  await expect(status).toHaveText(`B ${formatSapText(de.LIST_ITEM_POSITION, [2, 3])}`)
  await input.press("Escape")
  const custom = page.locator("#i18n-combobox-announcements-override")
  const customInput = custom.getByRole("combobox")
  await customInput.press("F4")
  await expect(customInput).toHaveAttribute("aria-controls", /-list$/)
  const customAnnouncement = await announcement(customInput)
  await expect(customAnnouncement).toHaveText("A Count 2; position 1")
  await custom.getByRole("combobox").press("ArrowUp")
  await expect(customAnnouncement).toHaveText("Category {0}x")
})

test.describe("phone locale selection paths", () => {
test.use({ userAgent: devices["iPhone 13"].userAgent, isMobile: true, hasTouch: true, viewport: { width: 375, height: 812 } })

test("phone Select translates all value-state types and preserves its legacy text override", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/?locale=de-DE#/i18n")
  for (const [state, key] of [["negative", "ERROR"], ["critical", "WARNING"], ["positive", "SUCCESS"], ["information", "INFORMATION"]]) {
    await page.locator(`#i18n-select-state-${state}`).getByRole("combobox").press("F4")
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    // Select.js/hasValueStateText and SelectPopoverTemplate omit Positive from
    // the phone header; the other three states render their translated type/body.
    if (state === "positive") await expect(dialog.locator('[data-value-state="positive"].fiori-value-state-message')).toHaveCount(0)
    else await expect(dialog).toContainText(`${de[`VALUE_STATE_TYPE_${key}`]} ${de[`VALUE_STATE_${key}`]}`)
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
  }
  await page.locator("#i18n-select-state-override").getByRole("combobox").press("F4")
  await expect(page.getByRole("dialog")).toContainText(`Legacy error ${de.VALUE_STATE_ERROR}`)
})

test("phone Select preserves no-provider matching and opts into locale collation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/?locale=de-DE#/i18n")
  await page.locator("#i18n-no-provider-match").getByRole("combobox").press("F4")
  let dialog = page.getByRole("dialog")
  let selected = dialog.getByRole("option", { name: "Zulu", exact: true })
  await selected.focus()
  await expect(selected).toBeFocused()
  await selected.press("a")
  await expect(selected).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.locator("#i18n-collation").getByRole("combobox", { name: "Collation select", exact: true }).press("F4")
  dialog = page.getByRole("dialog")
  selected = dialog.getByRole("option", { name: "Zulu", exact: true })
  await selected.focus()
  await expect(selected).toBeFocused()
  await selected.press("a")
  await expect(dialog.getByRole("option", { name: "Äland", exact: true })).toHaveAttribute("aria-selected", "true")
})
})

test("ValueHelpDialog counted titles use numbered keys and retain scalar/function overrides", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  await page.locator("#i18n-vhd-counted").getByRole("button").click()
  let dialog = page.getByRole("dialog", { name: "Counted value help", exact: true })
  await expect(dialog.getByRole("grid")).toHaveAccessibleName("Rows 2!")
  await expect(dialog.getByRole("tab", { name: "Selected 1!", exact: true })).toBeVisible()
  await expect(dialog.getByRole("tab", { name: "Conditions 1!", exact: true })).toBeVisible()
  await expect(dialog.getByRole("list", { name: "Total 2!", exact: true })).toBeVisible()
  await dialog.getByRole("searchbox").fill("not found")
  await dialog.getByRole("searchbox").press("Enter")
  await expect(dialog.getByRole("grid")).toHaveAccessibleName("Zero rows")
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.locator("#i18n-vhd-zero").getByRole("button").click()
  dialog = page.getByRole("dialog", { name: "Empty counted value help", exact: true })
  await expect(dialog.getByRole("tab", { name: "Zero selected", exact: true })).toBeVisible()
  await expect(dialog.getByRole("tab", { name: "Zero conditions", exact: true })).toBeVisible()
  await expect(dialog.getByRole("heading", { name: "Zero tokens", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.locator("#i18n-vhd-title-override").getByRole("button").click()
  dialog = page.getByRole("dialog", { name: "Custom counted value help", exact: true })
  await expect(dialog.getByRole("grid")).toHaveAccessibleName("Legacy rows (2)")
  await expect(dialog.getByRole("tab", { name: "Custom selected 1", exact: true })).toBeVisible()
  await expect(dialog.getByRole("tab", { name: "Custom conditions 1", exact: true })).toBeVisible()
  await expect(dialog.getByRole("list", { name: "Custom total 2", exact: true })).toBeVisible()
})

test("ValueHelpDialog retains no-provider search matching and localizes opted-in matching", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  await page.locator("#i18n-vhd-no-provider").getByRole("button").click()
  let dialog = page.getByRole("dialog", { name: "Unlocalized value help", exact: true })
  await expect(dialog.getByRole("grid")).toHaveAccessibleName("Items (2)")
  await expect(dialog.getByRole("tab", { name: "Search and Select (0)", exact: true })).toBeVisible()
  await dialog.getByRole("searchbox").fill("a")
  await dialog.getByRole("searchbox").press("Enter")
  await expect(dialog.locator("tbody tr[data-row]")).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await page.locator("#i18n-vhd-counted").getByRole("button").click()
  dialog = page.getByRole("dialog", { name: "Counted value help", exact: true })
  await dialog.getByRole("searchbox").fill("a")
  await dialog.getByRole("searchbox").press("Enter")
  await expect(dialog.locator("tbody tr[data-row]")).toHaveCount(1)
  await expect(dialog.locator("tbody tr[data-row]")).toContainText("Äther")
})

test("French numeric parser rejects foreign decimal syntax like the pinned formatter", async ({ page }) => {
  await page.goto("/ui5.html?locale=fr-FR&only=step-input")
  await page.waitForSelector("html[data-ready=true]")
  const texts = ["1.23", "0.123", "1.234e2", "50%", "50 %", "1\u202f234,5"]
  const native = await page.locator("ui5-step-input").evaluate((host: any, values) => values.map(text => ({ text, value: String(host._innerNumberInput.formatter.parse(text)) })), texts)
  for (const item of native) expect(String(parseNumber(item.text, "fr-FR")), item.text).toBe(item.value)
})

test("Calendar weekday labels use native CLDR format context in all E5 locales", async ({ browser }) => {
  for (const locale of locales) {
    const values: string[][] = []
    for (const native of [false, true]) {
      const page = await browser.newPage()
      await page.goto(native ? `/ui5.html?locale=${locale}&only=calendar-l10n-${locale}` : `/?fixtures&locale=${locale}&only=calendar-l10n-${locale}`)
      await page.waitForSelector("html[data-ready=true]")
      values.push((await page.locator(`[data-fixture="calendar-l10n-${locale}"]`).getByRole("columnheader").allTextContents()).slice(-7).map(text => text.trim()))
      await page.close()
    }
    expect(values[0], locale).toEqual(values[1])
  }
})

test("existing Wizard, Breadcrumbs, List and TextArea channels use SAP texts and preserve overrides", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const wizard = page.locator("#i18n-wizard")
  await expect(wizard.locator('[role="listitem"]').first()).toHaveAttribute("aria-label", formatSapText(de.WIZARD_STEP_ARIA_LABEL, [`1 {0}x ${de.WIZARD_STEP_ACTIVE} ${de.WIZARD_OPTIONAL_STEP_ARIA_LABEL}`]))
  await expect(wizard.locator('[role="listitem"]').nth(1)).toHaveAttribute("aria-label", formatSapText(de.WIZARD_STEP_ARIA_LABEL, [`2 Second ${de.WIZARD_STEP_INACTIVE}`]))
  await expect(page.locator('#i18n-wizard-override [role="listitem"]')).toHaveAttribute("aria-label", "Stage 1: Shipping")
  await expect(page.locator("#i18n-breadcrumbs").getByRole("link", { name: `Home ${formatSapText(de.BREADCRUMB_ITEM_POS, [1, 2])}`, exact: true })).toBeVisible()
  await expect(page.locator("#i18n-breadcrumbs").getByRole("link", { name: "Custom home 1 among 2", exact: true })).toBeVisible()
  const list = page.locator("#i18n-list .fiori-list__ul").first()
  await expect(list).toHaveAccessibleName(de.ARIA_LABEL_LIST_MULTISELECTABLE)
  await expect(list).toHaveAttribute("aria-description", formatSapText(de.LIST_ROLE_LIST_GROUP_DESCRIPTION, [1, 2]))
  await expect(list.locator("[data-slot=list-item-group-header]")).toHaveAttribute("aria-roledescription", de.GROUP_HEADER_TEXT)
  await expect(page.locator("#i18n-list .fiori-list__ul").nth(1)).toHaveAccessibleName("Custom deletable mode")
  await expect(page.locator("#i18n-list").getByRole("button", { name: "Remove row", exact: true })).toBeVisible()
  const note = page.locator("#i18n-textarea").getByRole("textbox", { name: "Required short note", exact: true })
  await expect.poll(() => note.evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe(de.FORM_TEXTFIELD_REQUIRED)
  await note.fill("ABCDE")
  await expect.poll(() => note.evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe(formatSapText(de.TEXTAREA_EXCEEDS_MAXLENGTH, [2]))
  await note.fill("ABC")
  await expect.poll(() => note.evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe("")
  await expect.poll(() => page.locator("#i18n-textarea").getByRole("textbox", { name: "Custom required note", exact: true }).evaluate((element: HTMLTextAreaElement) => element.validationMessage)).toBe("Please add a note")
})

test("Tokenizer deletion announces singular, plural and component override texts", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-token-deletion")
  await expect(owner.getByRole("listbox")).toHaveAttribute("aria-description", de.TOKENIZER_ARIA_LABEL)
  const first = owner.getByRole("option").first()
  await first.focus()
  await expect(first).toBeFocused()
  await first.press("Delete")
  await expect(owner.getByRole("alert")).toHaveText(de.TOKENIZER_TOKEN_DELETED_SINGULAR)
  await expect(owner.getByRole("option")).toHaveCount(2)
  const next = owner.getByRole("option").first()
  await next.focus()
  await expect(next).toBeFocused()
  await next.press("Control+a")
  await expect(owner.getByRole("option", { selected: true })).toHaveCount(2)
  await next.press("Delete")
  await expect(owner.getByRole("alert")).toHaveText(formatSapText(de.TOKENIZER_TOKEN_DELETED_PLURAL, [2]))
  const custom = page.locator("#i18n-token-deletion-override")
  await expect(custom.getByRole("listbox")).toHaveAccessibleName("Custom tokenizer")
  await custom.getByRole("option").focus()
  await expect(custom.getByRole("option")).toBeFocused()
  await custom.getByRole("option").press("Delete")
  await expect(custom.getByRole("alert")).toHaveText("Removed 1 selected tokens")
})

test("Card, FileUploader and ViewSettingsDialog translate their actual channels and retain text overrides", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const cards = page.locator("#i18n-card")
  await expect(cards.getByRole("region", { name: `${de.ARIA_ROLEDESCRIPTION_CARD} {0}x`, exact: true })).toBeVisible()
  await expect(cards.getByRole("group", { name: de.ARIA_LABEL_CARD_CONTENT, exact: true })).toBeVisible()
  await expect(cards.locator("[data-slot=card-header]").first().locator('[role="group"]')).toHaveAttribute("aria-roledescription", de.ARIA_ROLEDESCRIPTION_CARD_HEADER)
  await expect(cards.getByRole("region", { name: "Panel Custom card", exact: true })).toBeVisible()
  await expect(cards.getByRole("group", { name: "Panel content", exact: true })).toBeVisible()
  const files = page.locator("#i18n-file")
  await expect(files.locator("input[placeholder]").nth(0)).toHaveAttribute("placeholder", de.FILEUPLOADER_DEFAULT_PLACEHOLDER)
  await expect(files.locator("input[placeholder]").nth(1)).toHaveAttribute("placeholder", de.FILEUPLOADER_DEFAULT_MULTIPLE_PLACEHOLDER)
  const input = files.locator('input[aria-label="Required attachment"]')
  await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(de.FILEUPLOAER_VALUE_MISSING)
  await input.setInputFiles({ name: "proof.txt", mimeType: "text/plain", buffer: Buffer.from("proof") })
  await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("")
  await expect.poll(() => files.locator('input[aria-label="Custom attachment"]').evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Please attach a document")
  const owner = page.locator("#i18n-vsd")
  await owner.getByRole("button", { name: "Open localized view settings", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: de.VSD_DIALOG_TITLE_SORT, exact: true })
  await expect(dialog.getByRole("listitem")).toHaveAttribute("aria-label", formatSapText(de.VSD_FILTER_ITEM_LABEL_TEXT, ["Shipping", 1]))
  await dialog.getByRole("button", { name: de.VSD_RESET_BUTTON, exact: true }).click()
  await expect(dialog.getByRole("alert")).toHaveText(de.VSD_RESET_BUTTON_ACTION)
  await dialog.getByRole("button", { name: de.VSD_CANCEL_BUTTON, exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await owner.getByRole("button", { name: "Open custom view settings", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: de.VSD_RESET_BUTTON, exact: true }).click()
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Filters restored")
})

test("editable RangeSlider open numeric tooltip matches its owning native fixture", async ({ browser }) => {
  const shots: Buffer[] = []
  const evidence = `${e5Evidence}/range-open`
  mkdirSync(evidence, { recursive: true })
  for (const native of [false, true]) {
    const page = await browser.newPage()
    await page.goto(native ? "/ui5.html?only=slider-editable-range" : "/index.html?fixtures&only=slider-editable-range")
    await page.waitForSelector("html[data-ready=true]")
    const owner = page.locator('[data-fixture="slider-editable-range"]')
    const handle = owner.locator(native ? "ui5-slider-handle[handle-type=Start]" : '[data-handle="start"]')
    await handle.focus()
    await expect(handle).toBeFocused()
    await handle.press("F2")
    const input = owner.locator(native ? "ui5-slider-tooltip[data-sap-ui-start-value] input" : '[data-handle-tooltip="start"] input')
    await expect(input).toBeFocused()
    await expect(input).toHaveValue("0.5")
    await expect(input).toHaveAttribute("type", "number")
    const shot = await owner.screenshot({ animations: "disabled", caret: "hide" })
    shots.push(shot)
    writeFileSync(`${evidence}/${native ? "ui5" : "react"}.png`, shot)
    await page.close()
  }
  const [ours, ui5] = shots.map(shot => PNG.sync.read(shot))
  expect([ours.width, ours.height]).toEqual([ui5.width, ui5.height])
  const diff = new PNG({ width: ours.width, height: ours.height })
  const ratio = pixelmatch(ours.data, ui5.data, diff.data, ours.width, ours.height, { threshold: 0.1 }) / (ours.width * ours.height)
  writeFileSync(`${evidence}/diff.png`, PNG.sync.write(diff))
  writeFileSync(`${evidence}/report.json`, JSON.stringify({ ratio, width: ours.width, height: ours.height }, null, 2))
  expect(ratio).toBeLessThanOrEqual(0.02)
})

test("editable tooltip number keys retain native spinbutton behavior in localized editing", async ({ browser }) => {
  const values: Record<string, number[]> = {}
  for (const mode of ["ui5", "react", "localized"]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(mode === "localized" ? "/?locale=de-DE#/i18n" : mode === "ui5" ? "/ui5.html?only=slider-editable-range" : "/?fixtures&only=slider-editable-range")
    const owner = page.locator(mode === "localized" ? "#i18n-range" : '[data-fixture="slider-editable-range"]')
    if (mode === "ui5") await page.waitForSelector("html[data-ready=true]")
    const handle = owner.locator(mode === "ui5" ? "ui5-slider-handle[handle-type=Start]" : '[data-handle="start"]')
    await handle.focus()
    await expect(handle).toBeFocused()
    await handle.press("F2")
    const input = owner.locator(mode === "ui5" ? "ui5-slider-tooltip[data-sap-ui-start-value] input" : '[data-handle-tooltip="start"] input')
    await expect(input).toBeFocused()
    const result: number[] = []
    for (const key of ["ArrowUp", "ArrowDown"]) {
      await input.press(key)
      if (mode !== "ui5") await expect.poll(async () => parseNumber(await input.inputValue(), mode === "localized" ? "de-DE" : "en-US")).toBe(values.ui5[result.length])
      result.push(parseNumber(await input.inputValue(), mode === "localized" ? "de-DE" : "en-US"))
    }
    values[mode] = result
    if (mode === "localized") {
      await input.fill("invalid")
      await input.press("Enter")
      await expect(input).toHaveAttribute("aria-invalid", "true")
      await expect(input).toHaveAttribute("aria-valuenow", "0.5")
      const axe = await new AxeBuilder({ page }).include("#i18n-range").analyze()
      expect(axe.violations).toEqual([])
    }
    await context.close()
  }
  expect(values.react).toEqual(values.ui5)
  expect(values.localized).toEqual(values.ui5)
  mkdirSync(`${e5Evidence}/oracles`, { recursive: true })
  writeFileSync(`${e5Evidence}/oracles/tooltip-number-keys.json`, JSON.stringify(values, null, 2))
})

test("real Tokenizer text chooses locale plural categories", async ({ page }) => {
  for (const locale of ["en-US", "ru", "ar-EG"]) {
    await page.goto(`/?locale=${locale}&plurals#/i18n`)
    const owner = page.locator("#i18n-tokens")
    for (const count of [1, 2, 5]) {
      await owner.getByRole("combobox", { name: "Token count" }).selectOption(String(count))
      const category = new Intl.PluralRules(locale).select(count)
      await expect(owner.locator(".fiori-tokenizer__more")).toHaveText(`${count} ${category}`)
    }
  }
})

test("editable Slider commits locale decimals, retains focus and resets invalid values on F2", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-slider")
  const handle = owner.getByRole("slider")
  await handle.focus()
  await expect(handle).toBeFocused()
  await handle.press("F2")
  const input = owner.locator("input")
  await expect(input).toBeFocused()
  await input.fill("0,75")
  await input.press("Enter")
  await expect(owner.getByTestId("i18n-slider-value")).toHaveText("0.75")
  await expect(input).toBeFocused()
  await input.fill("3,5")
  await input.press("Enter")
  await expect(input).toHaveAttribute("aria-invalid", "true")
  await expect(owner.getByTestId("i18n-slider-value")).toHaveText("0.75")
  await input.press("F2")
  await expect(handle).toBeFocused()
  await expect(owner.locator("input")).not.toBeFocused()
  await handle.press("F2")
  await expect(owner.locator("input")).toHaveValue("0,75")
})

test("RTL slider keys follow the inherited DOM direction", async ({ page }) => {
  await page.goto("/?locale=ar-EG#/i18n")
  const handle = page.locator("#i18n-slider").getByRole("slider")
  await handle.focus()
  await expect(handle).toBeFocused()
  await handle.press("ArrowRight")
  await expect(handle).toHaveAttribute("aria-valuenow", "0.4")
  await handle.press("ArrowLeft")
  await expect(handle).toHaveAttribute("aria-valuenow", "0.5")
})

test("collation follows German and Swedish accent ordering", async ({ page }) => {
  expect(collatorIncludes("Straße", "strasse", "de-DE", true)).toBe(true)
  expect(collatorIncludes("Äland", "a", "de-DE", true)).toBe(true)
  expect(collatorIncludes("Äland", "a", "sv-SE", true)).toBe(false)
  for (const locale of ["de-DE", "sv-SE"]) {
    await page.goto(`/?locale=${locale}#/i18n`)
    const rows = page.locator("#i18n-sort [data-slot=table-row] [data-slot=table-cell]:first-child")
    await expect(rows).toHaveText(locale === "de-DE" ? ["Äland", "Aland", "Zulu"] : ["Aland", "Zulu", "Äland"])
    const select = page.locator("#i18n-collation [data-slot=select-trigger]")
    await select.focus()
    await select.press("a")
    await expect(select).toContainText(locale === "de-DE" ? "Äland" : "Aland")
  }
})

for (const locale of locales) {
  test(`native number and Gregorian date oracle ${locale}`, async ({ page }) => {
    await page.goto(`/ui5.html?locale=${locale}&only=step-input-l10n-${locale}`)
    await page.waitForSelector("html[data-ready=true]")
    const oracle = await page.locator("ui5-step-input").evaluate((host: any) => { const element = host._innerNumberInput; return ({
      display: element.innerInput.value,
      formatted: element.formatter.format(1234.5),
      parsed: element.formatter.parse(element.formatter.format(1234.5)),
      decimal: element.delimiter,
      group: element.groupSeparator,
      typedArabic: ["٢٫٢٥", "١٬٢٣٤٫٥", "2.25", "1,234.5"].map(text => ({ text, value: element.formatter.parse(text) })),
    }) })
    mkdirSync(`${e5Evidence}/oracles`, { recursive: true })
    writeFileSync(`${e5Evidence}/oracles/${locale}-number.json`, JSON.stringify(oracle, null, 2))
    expect(oracle.parsed).toBe(1234.5)
    expect(oracle.display).toBe(formatNumber(1.5, locale, { minFractionDigits: 1, maxFractionDigits: 1 }))
    const parserCases = ["50%", "50 %", "1.23", "0.123", "1.234e2", "2e309"]
    const parsed = await page.locator("ui5-step-input").evaluate((host: any, texts) => texts.map(text => ({ text, parsed: String(host._innerNumberInput.formatter.parse(text)) })), parserCases)
    for (const entry of parsed) expect(String(parseNumber(entry.text, locale)), `${locale}: ${entry.text}`).toBe(entry.parsed)
    await page.goto(`/ui5.html?locale=${locale}&only=date-picker-empty`)
    await page.waitForSelector("html[data-ready=true]")
    const date = await page.locator("ui5-date-picker").evaluate((element: any) => element.formatValue(new Date(2024, 2, 12)))
    writeFileSync(`${e5Evidence}/oracles/${locale}-date.json`, JSON.stringify({ locale, formatPattern: "MMM d, y", date }, null, 2))
    const dateLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
    expect(date).toBe(formatPickerDate(new Date(2024, 2, 12), "MMM d, y", dateLocale))
  })
}

test("Calendar RTL arrows preserve the pinned native chronological day model", async ({ browser }) => {
  const results: Record<string, string[]> = {}
  for (const [label, url] of [["react", "/index.html?dir=rtl&only=calendar-single&fixtures"], ["ui5", "/ui5.html?dir=rtl&only=calendar-single"]]) {
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForSelector("html[data-ready=true]")
    const cell = page.locator('[data-fixture="calendar-single"] [role=gridcell][tabindex="0"]')
    await cell.focus()
    await expect(cell).toBeFocused()
    const values = [await cell.innerText()]
    await cell.press("ArrowLeft")
    await expect(cell).toHaveText("11")
    await expect(cell).toBeFocused()
    values.push(await cell.innerText())
    await cell.press("ArrowRight")
    await expect(cell).toHaveText("12")
    values.push(await cell.innerText())
    results[label] = values
    await page.close()
  }
  expect(results.react).toEqual(results.ui5)
  mkdirSync(`${e5Evidence}/oracles`, { recursive: true })
  writeFileSync(`${e5Evidence}/oracles/calendar-rtl-keys.json`, JSON.stringify(results, null, 2))
})

async function rtlShots(page: Page, url: string, fixtureIds?: string[]) {
  await page.goto(url)
  await page.waitForSelector("html[data-ready=true]", { timeout: 30_000 })
  await page.mouse.move(0, 0)
  // Cells own their direction. Match visual.spec.ts's viewport origin for RTL screenshots.
  await page.evaluate(() => { document.documentElement.style.direction = "ltr" })
  await expect(page.locator("[data-fixture]").first()).toHaveCSS("direction", "rtl")
  const components = readdirSync("docs/src/fixtures").filter(file => file.endsWith(".ui5.ts"))
    .map(file => file.slice(0, -7)).sort((a, b) => b.length - a.length)
  const cells = await page.locator('[data-fixture]').evaluateAll((elements, { components, fixtureIds }) => {
    const seen = new Set<string>()
    return elements.flatMap(element => {
      const id = (element as HTMLElement).dataset.fixture!
      const component = components.find(name => id === name || id.startsWith(`${name}-`))
      if (fixtureIds ? !fixtureIds.includes(id) : !component || seen.has(component)) return []
      if (component) seen.add(component)
      const r = element.getBoundingClientRect()
      return [{ id, x: Math.floor(r.left + scrollX), y: Math.floor(r.top + scrollY), w: Math.ceil(r.right + scrollX) - Math.floor(r.left + scrollX), h: Math.ceil(r.bottom + scrollY) - Math.floor(r.top + scrollY) }]
    })
  }, { components, fixtureIds })
  const full = PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" }))
  return new Map(cells.map(cell => {
    const shot = new PNG({ width: cell.w, height: cell.h })
    PNG.bitblt(full, shot, cell.x, cell.y, cell.w, cell.h, 0, 0)
    return [cell.id, shot]
  }))
}

test("each component has a paired fixture in RTL", async ({ browser }) => {
  test.setTimeout(120_000)
  const a = await browser.newPage(), b = await browser.newPage()
  const ui5 = await rtlShots(b, "/ui5.html?dir=rtl")
  const ours = await rtlShots(a, "/index.html?dir=rtl&fixtures", [...ui5.keys()])
  const evidence = `${e5Evidence}/rtl`
  mkdirSync(evidence, { recursive: true })
  const failures: string[] = [], report: Record<string, string | number> = {}
  expect(ui5.size).toBeGreaterThan(60)
  for (const [id, ref] of ui5) {
    const shot = ours.get(id)
    if (!shot || shot.width !== ref.width || shot.height !== ref.height) { failures.push(`${id}: ${shot?.width}x${shot?.height} vs UI5 ${ref.width}x${ref.height}`); report[id] = failures.at(-1)!; continue }
    const diff = new PNG({ width: shot.width, height: shot.height })
    const ratio = pixelmatch(shot.data, ref.data, diff.data, shot.width, shot.height, { threshold: 0.1 }) / (shot.width * shot.height)
    report[id] = ratio
    if (ratio > 0.02) failures.push(`${id}: ${(ratio * 100).toFixed(2)}% pixels differ`)
    writeFileSync(`${evidence}/${id}-ours.png`, PNG.sync.write(shot))
    writeFileSync(`${evidence}/${id}-ui5.png`, PNG.sync.write(ref))
  }
  writeFileSync(`${evidence}/report.json`, JSON.stringify(report, null, 2))
  await Promise.all([a.close(), b.close()])
  expect(failures, failures.join("\n")).toEqual([])
})

for (const locale of locales) for (const theme of ["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"]) for (const density of ["cozy", "compact"]) {
  test(`localized fixtures ${locale} ${theme} ${density} match UI5`, async ({ browser }) => {
    test.setTimeout(120_000)
    const dir = locale === "ar-EG" ? "rtl" : "ltr"
    const a = await browser.newPage(), b = await browser.newPage()
    const failures: string[] = [], ratios: Record<string, number | string> = {}
    const evidence = `${e5Evidence}/localized/${locale}-${theme}-${density}`
    mkdirSync(evidence, { recursive: true })
    for (const component of components) {
      const id = `${component}-l10n-${locale}`
      const query = `?locale=${locale}&theme=${theme}&density=${density}&dir=${dir}&only=${id}`
      await Promise.all([a.goto(`/index.html${query}&fixtures`), b.goto(`/ui5.html${query}`)])
      await Promise.all([a.waitForSelector("html[data-ready=true]"), b.waitForSelector("html[data-ready=true]")])
      const [ours, ui5] = await Promise.all([a.locator(`[data-fixture="${id}"]`).screenshot({ animations: "disabled", caret: "hide" }), b.locator(`[data-fixture="${id}"]`).screenshot({ animations: "disabled", caret: "hide" })])
      writeFileSync(`${evidence}/${component}-ours.png`, ours)
      writeFileSync(`${evidence}/${component}-ui5.png`, ui5)
      const ap = PNG.sync.read(ours), bp = PNG.sync.read(ui5)
      if (ap.width !== bp.width || ap.height !== bp.height) {
        failures.push(`${component}: ${ap.width}x${ap.height} vs UI5 ${bp.width}x${bp.height}`)
        ratios[component] = failures.at(-1)!
        continue
      }
      const diff = new PNG({ width: ap.width, height: ap.height })
      const ratio = pixelmatch(ap.data, bp.data, diff.data, ap.width, ap.height, { threshold: 0.1 }) / (ap.width * ap.height)
      ratios[component] = ratio
      if (ratio > 0.02) failures.push(`${component}: ${(ratio * 100).toFixed(2)}% pixels differ`)
      writeFileSync(`${evidence}/${component}-diff.png`, PNG.sync.write(diff))
    }
    writeFileSync(`${evidence}/report.json`, JSON.stringify(ratios, null, 2))
    await Promise.all([a.close(), b.close()])
    expect(failures, failures.join("\n")).toEqual([])
  })
}

test("nested providers inherit texts and component locale/text props take precedence", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-precedence")
  await expect(owner.locator("#i18n-inherited")).toHaveValue("1.234,5")
  await expect(owner.locator("#i18n-nested")).toHaveValue("1\u202f234,5")
  await expect(owner.locator("#i18n-locale-prop")).toHaveValue("1,234.5")
  await expect(owner.locator("#i18n-nested").locator("xpath=../..").locator("[data-dir=inc]")).toHaveAttribute("title", "Inherited increase")
  await expect(owner.locator("#i18n-nested").locator("xpath=../..").locator("[data-dir=dec]")).toHaveAttribute("title", "Nested decrease")
  await expect(owner.locator("#i18n-locale-prop").locator("xpath=../..").locator("[data-dir=inc]")).toHaveAttribute("title", "Prop increase")
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
})

test("picker required, format and bounds texts reach native input validation without replacing value-state text", async ({ page }) => {
  await page.goto("/?locale=de-DE#/i18n")
  const owner = page.locator("#i18n-validation")
  for (const [id, missing, mismatch, under, over, pattern, value] of [
    ["date", "DATEPICKER_VALUE_MISSING", "DATEPICKER_PATTERN_MISSMATCH", "DATEPICKER_RANGE_UNDERFLOW", "DATEPICKER_RANGE_OVERFLOW", "yyyy-MM-dd", "2024-03-12"],
    ["range", "DATERANGE_VALUE_MISSING", "DATERANGE_PATTERN_MISMATCH", "DATERANGE_UNDERFLOW", "DATERANGE_OVERFLOW", "yyyy-MM-dd", "2024-03-12 - 2024-03-15"],
    ["datetime", "DATETIME_VALUE_MISSING", "DATETIME_PATTERN_MISMATCH", "DATETIME_RANGEUNDERFLOW", "DATETIME_RANGEOVERFLOW", "yyyy-MM-dd HH:mm:ss", "2024-03-12 15:25:40"],
    ["time", "TIMEPICKER_VALUE_MISSING", "TIMEPICKER_PATTERN_MISSMATCH", "", "", "HH:mm:ss", "15:25:40"],
  ]) {
    const input = owner.locator(`#i18n-${id}-validity`)
    await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[missing], [pattern]))
    await input.fill("invalid")
    await input.press("Enter")
    await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[mismatch], [pattern]))
    await expect(input.locator("xpath=../..").getByRole("status")).toContainText(de.VALUE_STATE_ERROR)
    if (under) {
      const suffix = id === "datetime" ? " 15:25:40" : ""
      await input.fill(`2024-03-01${suffix}`)
      await input.press("Enter")
      await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[under], [id === "datetime" ? "2024-03-08 00:00:00" : "2024-03-08"]))
      await input.fill(`2024-03-30${suffix}`)
      await input.press("Enter")
      await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe(formatSapText(de[over], [id === "datetime" ? "2024-03-25 00:00:00" : "2024-03-25"]))
    }
    await input.fill(value)
    await input.press("Enter")
    await expect.poll(() => input.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("")
  }
  await expect.poll(() => owner.locator("#i18n-date-validity-override").evaluate((element: HTMLInputElement) => element.validationMessage)).toBe("Use yyyy-MM-dd")
})

for (const locale of ["zh-CN", "ar-EG"]) test(`real DatePicker commits complete month names and accepts locale digits ${locale}`, async ({ page }) => {
  await page.goto(`/?locale=${locale}#/i18n`)
  const input = page.locator("#i18n-date input")
  await input.fill(locale === "ar-EG" ? "٢٠٢٤-٠٣-١٢" : "2024-03-12")
  await input.press("Enter")
  const formatterLocale = new Intl.Locale(locale, { calendar: "gregory", numberingSystem: "latn" }).toString()
  await expect(input).toHaveValue(formatPickerDate(new Date(2024, 2, 12), "MMM d, y", formatterLocale))
  await input.press("Enter")
  await expect(input).not.toHaveAttribute("aria-invalid", "true")
})

test("editable RangeSlider swaps endpoints and input focus like native UI5, and retains valid fractions", async ({ browser }) => {
  const results: Record<string, unknown> = {}
  for (const native of [false, true]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(native ? "/ui5.html?only=slider-editable-range" : "/?locale=en-US#/i18n")
    const owner = page.locator(native ? '[data-fixture="slider-editable-range"]' : "#i18n-range")
    if (native) {
      await page.waitForSelector("html[data-ready=true]")
      // Owner fixture config sets showTooltip/editableTooltip before mounting and awaits Render.renderFinished.
      await expect(owner.locator("ui5-range-slider")).toHaveAttribute("editable-tooltip", "")
    }
    const start = owner.locator(native ? "ui5-slider-handle[handle-type=Start]" : '[data-handle="start"]')
    const end = owner.locator(native ? "ui5-slider-handle[handle-type=End]" : '[data-handle="end"]')
    await expect(start).toHaveAttribute("aria-valuenow", "0.5")
    await expect(end).toHaveAttribute("aria-valuenow", "1.5")
    await start.focus()
    await expect(start).toBeFocused()
    if (native) await expect(owner.locator("ui5-slider-tooltip[data-sap-ui-start-value]")).toBeVisible()
    await start.press("F2")
    const input = owner.locator(native ? "ui5-slider-tooltip[data-sap-ui-start-value] input" : '[data-handle-tooltip="start"] input')
    const opposite = owner.locator(native ? "ui5-slider-tooltip[data-sap-ui-end-value] input" : '[data-handle-tooltip="end"] input')
    await expect(input).toBeFocused()
    await input.fill("1.75")
    await input.press("Enter")
    await expect(start).toHaveAttribute("aria-valuenow", "1.5")
    await expect(end).toHaveAttribute("aria-valuenow", "1.75")
    await expect(opposite).toBeFocused()
    await expect(opposite).toHaveValue("1.75")
    await opposite.fill("3.5")
    await opposite.press("Enter")
    await expect(end).toHaveAttribute("aria-valuenow", "1.75")
    await expect(opposite).toHaveAttribute("aria-invalid", "true")
    await opposite.press("F2")
    await expect(end).toBeFocused()
    await end.press("F2")
    await expect(opposite).toBeFocused()
    await expect(opposite).toHaveValue("1.75")
    results[native ? "ui5" : "react"] = { start: await start.getAttribute("aria-valuenow"), end: await end.getAttribute("aria-valuenow"), focusedValue: await opposite.inputValue() }
    if (!native) {
      expect(await opposite.evaluate(element => element.closest('[role="slider"]'))).toBeNull()
      const axe = await new AxeBuilder({ page }).include("#i18n-range").analyze()
      expect(axe.violations).toEqual([])
    }
    await context.close()
  }
  expect(results.react).toEqual(results.ui5)
  mkdirSync(`${e5Evidence}/oracles`, { recursive: true })
  writeFileSync(`${e5Evidence}/oracles/range-tooltip.json`, JSON.stringify(results, null, 2))
})

test("WCR AnalyticalTable uses SAP's localized empty text", async ({ page }) => {
  const translations = { "de-DE": ["Keine Daten", "ltr"], "zh-CN": ["无数据", "ltr"], "ar-EG": ["لا توجد بيانات", "rtl"] }
  for (const [locale, [message, dir]] of Object.entries(translations)) {
    await page.goto(`/wcr.html?locale=${locale}&dir=${dir}&only=analytical-table-empty`)
    await expect(page.locator("html")).toHaveAttribute("data-ready", "true")
    const cell = page.locator("[data-fixture=analytical-table-empty]")
    await expect(cell).toHaveAttribute("dir", dir)
    await expect(cell.getByRole("gridcell", { name: message, exact: true })).toBeVisible()
  }
})

test("WCR provider keys coexist with Web Component keys", () => {
  function Texts() {
    const { t } = useFioriLocale()
    return React.createElement("span", null, t("wcr:LIST_NO_DATA", ""), " / ", t("LIST_NO_DATA", ""))
  }
  const view = React.createElement(FioriLocaleProvider, {
    locale: "de-DE",
    texts: { ...de, "wcr:LIST_NO_DATA": "Keine Tabellendaten" },
  }, React.createElement(Texts))
  expect(renderToStaticMarkup(view)).toBe("<span>Keine Tabellendaten / Keine Daten</span>")
})
