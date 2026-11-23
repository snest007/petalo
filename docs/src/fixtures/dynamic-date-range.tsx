import * as React from "react"
import { DynamicDateRange, type DynamicDateRangeValue } from "@/components/ui/dynamic-date-range"
import { defineFixtures, FIELD_WIDTH } from "../fixture-types"
import { inPlace } from "./popover"

type RangeCase = { value?: DynamicDateRangeValue; popup?: "options" | "LASTDAYS" | "DATE" | "DATERANGE" }

export const options = "TODAY, YESTERDAY, TOMORROW, DATE, DATERANGE, LASTDAYS, LASTWEEKS, LASTMONTHS, NEXTDAYS, NEXTWEEKS, NEXTMONTHS"
export const fixedDay = new Date(2026, 10, 18, 12)
export const fixedEndDay = new Date(2026, 10, 22, 12)

function RangeFixture({ value, popup }: RangeCase) {
  const frame = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (popup && popup !== "options") frame.current?.querySelector<HTMLElement>(`[data-ddr-option="${popup}"]`)?.click()
  }, [popup])
  return <div ref={frame} data-ddr-fixture={popup || "closed"} style={popup ? undefined : { width: FIELD_WIDTH }}>
    <DynamicDateRange aria-label="Period" options={options} defaultValue={value} open={!!popup} portal={false}
      classNames={{ root: popup ? "hidden" : "w-full", popover: popup ? "max-h-none" : undefined }} />
  </div>
}

export default defineFixtures<RangeCase>({
  name: "dynamic-date-range",
  cases: [
    { id: "dynamic-date-range-empty", props: {} },
    { id: "dynamic-date-range-today", props: { value: { operator: "TODAY" } } },
    { id: "dynamic-date-range-relative", props: { value: { operator: "LASTWEEKS", values: [3] } } },
    { id: "dynamic-date-range-date", props: { value: { operator: "DATE", values: [fixedDay] } } },
    { id: "dynamic-date-range-period", props: { value: { operator: "DATERANGE", values: [fixedDay, fixedEndDay] } } },
    { id: "dynamic-date-range-options", props: { popup: "options" } },
    { id: "dynamic-date-range-amount", props: { popup: "LASTDAYS", value: { operator: "LASTDAYS", values: [2] } } },
    { id: "dynamic-date-range-date-editor", props: { popup: "DATE", value: { operator: "DATE", values: [fixedDay] } } },
    { id: "dynamic-date-range-period-editor", props: { popup: "DATERANGE", value: { operator: "DATERANGE", values: [fixedDay, fixedEndDay] } } },
  ],
  react: props => props.popup ? <div className={inPlace}><RangeFixture {...props} /></div> : <RangeFixture {...props} />,
})
