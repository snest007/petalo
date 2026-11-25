import * as React from "react"
import { AnalyticalCardHeader, NumericSideIndicator } from "@/components/ui/analytical-card-header"
import { Card } from "@/components/ui/card"
import { defineDemo } from "./types"

function Demo() {
  const [actions, setActions] = React.useState({ header: 0, detail: 0 })
  return <div id="analytical-card-header-demo" className="grid gap-3">
    <Card accessibleName="Revenue overview" className="w-96 max-w-full">
      <AnalyticalCardHeader titleText="Net revenue" titleTextLevel={2} subtitleText="Current quarter"
        unitOfMeasurement="EUR" value={1264.5} scale="M" trend="up" state="positive"
        description="Compared with the previous quarter" onClick={() => setActions(a => ({ ...a, header: a.header + 1 }))}
        classNames={{ value: "tabular-nums" }}>
        <NumericSideIndicator titleText="Target" number={1300.25} unit="M" />
        <button type="button" onClick={() => setActions(a => ({ ...a, detail: a.detail + 1 }))}>View details</button>
      </AnalyticalCardHeader>
    </Card>
    <output aria-label="Header activations">{actions.header}</output>
    <output aria-label="Details activations">{actions.detail}</output>
    <section>
      <h3>Customise</h3>
      <p>Style the named parts with the experimental <code>classNames</code> map. Pass a number to apply locale formatting
        or a string to supply an already formatted value. Place a <code>NumericSideIndicator</code> or a named action
        in the supporting indicators.</p>
    </section>
  </div>
}

export default defineDemo({
  title: "AnalyticalCardHeader", category: "Display", order: 51, Demo,
  docs: [{ name: "analytical-card-header", description: "Show a primary KPI, its trend, and supporting indicators in a Card.",
    props: [
      { name: "value / numberFormat", type: "number | string / Intl.NumberFormatOptions", description: "Format a number for the resolved locale or display a preformatted string." },
      { name: "state / trend", type: "IndicatorState / IndicatorTrend", description: "Set the semantic color and trend announcement." },
      { name: "children / classNames", type: "ReactNode / Partial<Record<Slot, string>>", description: "Compose side indicators and style the library-owned parts." },
    ] }],
})
