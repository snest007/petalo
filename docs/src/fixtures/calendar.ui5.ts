import "@ui5/webcomponents/dist/Calendar.js"
import "@ui5/webcomponents/dist/CalendarDate.js"
import "@ui5/webcomponents/dist/CalendarDateRange.js"
import "@ui5/webcomponents/dist/SpecialCalendarDate.js"
import "@ui5/webcomponents/dist/CalendarLegend.js"
import "@ui5/webcomponents/dist/CalendarLegendItem.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-left.js"
import "@ui5/webcomponents-icons/dist/slim-arrow-right.js"

import { defineUi5, h } from "../fixture-types"
import set, { SPECIAL, CUSTOM_LEGEND } from "./calendar"

const modes = { single: "Single", multiple: "Multiple", range: "Range" }

export default defineUi5(set, ({ dates = [], mode = "single", min, max, hideWeekNumbers, picker, special, legendOnly }) => {
  if (legendOnly) {
    const custom = legendOnly === "custom"
    return h("ui5-calendar-legend", {
      "hide-today": custom,
      "hide-selected-day": custom,
      "hide-working-day": custom,
      "hide-non-working-day": custom,
    }, ...(custom ? CUSTOM_LEGEND.map(item => h("ui5-calendar-legend-item", item)) : []))
  }
  const children =
    mode === "range"
      ? [h("ui5-date-range", { "start-value": dates[0], "end-value": dates[1] })]
      : dates.map((value) => h("ui5-date", { value }))
  if (special) {
    children.push(...SPECIAL.map((s) => h("ui5-special-date", { slot: "specialDates", value: s.value, type: s.type })))
    children.push(
      h(
        "ui5-calendar-legend",
        { slot: "calendarLegend" },
        h("ui5-calendar-legend-item", { type: "Type01", text: "Holiday" }),
        h("ui5-calendar-legend-item", { type: "Type05", text: "Training" })
      )
    )
  }
  const cal = h(
    "ui5-calendar",
    {
      "format-pattern": "yyyy-MM-dd",
      "primary-calendar-type": "Gregorian",
      "selection-mode": modes[mode],
      "min-date": min,
      "max-date": max,
      "hide-week-numbers": hideWeekNumbers,
    },
    ...children
  )
  // _currentPicker is UI5's (private) property for the shown picker; DatePicker sets it the same way.
  if (picker) (cal as HTMLElement & { _currentPicker: string })._currentPicker = picker
  return cal
})
