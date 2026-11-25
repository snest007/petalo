import * as React from "react"
import { DynamicDateRange, type DynamicDateRangeValue } from "@/components/ui/dynamic-date-range"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { defineFixtures, FIELD_WIDTH, readPageOptions, type FixtureCase } from "../fixture-types"
import { inPlace } from "./popover"

type Editor = "LASTDAYS" | "NEXTDAYS" | "DATE" | "DATERANGE" | "DATETIMERANGE" | "FROMDATETIME" | "TODATETIME"
type RangeCase = { value?: DynamicDateRangeValue; popup?: "options" | Editor; locale?: string }

export const options = "TODAY, YESTERDAY, TOMORROW, DATE, DATERANGE, LASTDAYS, LASTWEEKS, LASTMONTHS, NEXTDAYS, NEXTWEEKS, NEXTMONTHS"
export function optionsFor(popup: RangeCase["popup"]) {
  return popup && /DATETIME/.test(popup) ? options + ", " + popup : options
}

export const fixedDay = new Date(2026, 10, 18, 12)
export const fixedEndDay = new Date(2026, 10, 22, 12)

function RangeFixture({ value, popup }: RangeCase) {
  const frame = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const root = frame.current
    if (!root || !popup || popup === "options") return
    const select = () => {
      const row = root.querySelector<HTMLElement>(`[data-ddr-option="${popup}"]`)
      if (!row) return false
      row.click()
      return true
    }
    if (select()) return
    const observer = new MutationObserver(() => { if (select()) observer.disconnect() })
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [popup])
  return <div ref={frame} data-ddr-fixture={popup || "closed"} style={popup ? undefined : { width: FIELD_WIDTH }}>
    <DynamicDateRange aria-label="Period" options={optionsFor(popup)} defaultValue={value} open={!!popup} portal={false}
      classNames={{ root: popup ? "hidden" : "w-full", popover: popup ? "max-h-none" : undefined }} />
  </div>
}

export default defineFixtures<RangeCase>({
  name: "dynamic-date-range",
  a11yDiffGroups: [
    {
      "cases": ["dynamic-date-range-empty", "dynamic-date-range-today", "dynamic-date-range-relative", "dynamic-date-range-date", "dynamic-date-range-period"],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0"
        ],
        "ui5FormHosts": ["/ui5/ax/0/children/0/children/0/children/0"],
        "reason": "DynamicDateRangeInputTemplate delegates to the form-associated UI5 Input. Remove the inert unnamed template wrappers and the exact Input shadow host's implicit invalid=false per the NumericInput precedent. The textbox and both focusable icon hosts stay in the comparison."
      }
    },
    {
      "cases": ["dynamic-date-range-options"],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": {"kind": "popover", "name": "Dynamic Date Range"},
        "dynamicDateRangeEditor": true,
        "reason": "ListTemplate projects preset text before the named entries. Verify the duplicate text, sentinels, state-free wrappers and empty local selection outlet while comparing every list item."
      }
    },
    {
      "cases": ["dynamic-date-range-amount", "dynamic-date-range-next-editor", "dynamic-date-range-date-time-editor"],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/1/children/1",
          "/ui5/ax/0/children/0/children/7/children/0",
          "/ui5/ax/0/children/0/children/7/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/7/children/0/children/1/children/0/children/0"
        ],
        "ui5FormHosts": ["/ui5/ax/0/children/0/children/1/children/0", "/ui5/ax/0/children/0/children/7/children/0/children/0", "/ui5/ax/0/children/0/children/7/children/0/children/1"],
        "pinnedPopupShell": {"kind": "popover", "name": "Dynamic Date Range"},
        "dynamicDateRangeEditor": true,
        "reason": "LastNextTemplate and DateTimeRangeTemplate leave visible labels unassociated. Check the exact native StepInput and DateTimePicker icon hosts and React controls, names and relations before aligning their shapes. Header and footer remain compared."
      }
    },
    {
      "cases": ["dynamic-date-range-date-editor", "dynamic-date-range-period-editor"],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/1/children/1",
          "/ui5/ax/0/children/0/children/4/children/0",
          "/ui5/ax/0/children/0/children/4/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/4/children/0/children/1/children/0/children/0"
        ],
        "ui5FormHosts": ["/ui5/ax/0/children/0/children/1/children/0", "/ui5/ax/0/children/0/children/4/children/0/children/0", "/ui5/ax/0/children/0/children/4/children/0/children/1"],
        "pinnedPopupShell": {"kind": "popover", "name": "Dynamic Date Range"},
        "dynamicDateRangeEditor": true,
        "reason": "CalendarHeaderTemplate uses the spaced shortcut and Popup.js allocates announcements only on actual open. Compare the exact shortcut and the empty local Calendar alert. Header and footer remain compared."
      }
    },
    {
      "cases": ["dynamic-date-range-from-date-time-editor", "dynamic-date-range-to-date-time-editor"],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/1/children/1",
          "/ui5/ax/0/children/0/children/5/children/0",
          "/ui5/ax/0/children/0/children/5/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/5/children/0/children/1/children/0/children/0",
          "/ui5/ax/0/children/0/children/2/children/0/children/0",
          "/ui5/ax/0/children/0/children/2/children/1/children/0",
          "/ui5/ax/0/children/0/children/3/children/0"
        ],
        "ui5FormHosts": ["/ui5/ax/0/children/0/children/1/children/0", "/ui5/ax/0/children/0/children/5/children/0/children/0", "/ui5/ax/0/children/0/children/5/children/0/children/1"],
        "pinnedPopupShell": {"kind": "popover", "name": "Dynamic Date Range"},
        "dynamicDateRangeEditor": true,
        "reason": "FromDateTimeTemplate leaves SegmentedButton unnamed. Keep option semantics and compare the exact added group name, the Calendar shortcut and empty announcement outlets. Header and footer remain compared."
      }
    }
  ],
  cases: ([
    { id: "dynamic-date-range-empty", props: {} },
    { id: "dynamic-date-range-today", props: { value: { operator: "TODAY" } } },
    { id: "dynamic-date-range-relative", props: { value: { operator: "LASTWEEKS", values: [3] } } },
    { id: "dynamic-date-range-date", props: { value: { operator: "DATE", values: [fixedDay] } } },
    { id: "dynamic-date-range-period", props: { value: { operator: "DATERANGE", values: [fixedDay, fixedEndDay] } } },
    { id: "dynamic-date-range-options", props: { popup: "options" } },
    { id: "dynamic-date-range-amount", props: { popup: "LASTDAYS", value: { operator: "LASTDAYS", values: [2] } } },
    { id: "dynamic-date-range-date-editor", props: { popup: "DATE", value: { operator: "DATE", values: [fixedDay] } } },
    { id: "dynamic-date-range-period-editor", props: { popup: "DATERANGE", value: { operator: "DATERANGE", values: [fixedDay, fixedEndDay] } } },
    { id: "dynamic-date-range-next-editor", props: { popup: "NEXTDAYS", value: { operator: "NEXTDAYS", values: [2] } } },
    { id: "dynamic-date-range-date-time-editor", props: { popup: "DATETIMERANGE", value: { operator: "DATETIMERANGE", values: [fixedDay, fixedEndDay] } } },
    { id: "dynamic-date-range-from-date-time-editor", props: { popup: "FROMDATETIME", value: { operator: "FROMDATETIME", values: [fixedDay] } } },
    { id: "dynamic-date-range-to-date-time-editor", props: { popup: "TODATETIME", value: { operator: "TODATETIME", values: [fixedEndDay] } } },
    ...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `dynamic-date-range-l10n-${locale}`, props: { locale, value: { operator: "DATE", values: [fixedDay] } } })),
  ] satisfies FixtureCase<RangeCase>[]).filter(fixture => !fixture.id.includes("-l10n-") ||
    ("locale" in fixture.props && typeof location !== "undefined" && fixture.props.locale === readPageOptions().locale)),
  react: props => {
    const fixture = <RangeFixture {...props} />
    if (props.locale) return <FioriLocaleProvider locale={props.locale} texts={props.locale === "de-DE" ? de : props.locale === "zh-CN" ? zh : ar}>{fixture}</FioriLocaleProvider>
    return props.popup ? <div className={inPlace}>{fixture}</div> : fixture
  },
})
