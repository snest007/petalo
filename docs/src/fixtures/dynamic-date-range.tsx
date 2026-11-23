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
      "cases": ["dynamic-date-range-options", "dynamic-date-range-amount", "dynamic-date-range-date-editor", "dynamic-date-range-period-editor", "dynamic-date-range-next-editor", "dynamic-date-range-date-time-editor", "dynamic-date-range-from-date-time-editor", "dynamic-date-range-to-date-time-editor"],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": { "kind": "popover", "name": "Dynamic Date Range" },
        "reason": "As in the SplitButton menu fixture, the pinned ResponsivePopover remains closed. Verify PopupTemplate's exact focusable host and two sentinels while comparing the named modal dialog and all of its options or editors."
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
