import { AnalyticalCardHeader } from "@ui5/webcomponents-react/AnalyticalCardHeader"
import { NumericSideIndicator } from "@ui5/webcomponents-react/NumericSideIndicator"
import { ValueColor } from "@ui5/webcomponents-react/enums/ValueColor"
import { defineFixtures, readPageOptions } from "../fixture-types"
import { actionStyle, kpiCases, kpiFrame, kpiLabels, kpiSides, type KpiCase } from "./analytical-card-header.cases"

const colors = { none: ValueColor.None, neutral: ValueColor.Neutral, positive: ValueColor.Good, critical: ValueColor.Critical, negative: ValueColor.Error }
const trends = { none: "None", up: "Up", down: "Down" } as const
export default defineFixtures<KpiCase>({
  name: "analytical-card-header",
  reference: "wcr",
  cases: kpiCases,
  react: ({ value, state = "none", trend = "none", details, custom }) => {
    const format = new Intl.NumberFormat(readPageOptions().locale ?? "en-US")
    const side = (indicator: typeof kpiSides[number], id?: string) => <NumericSideIndicator key={indicator.titleText} id={id}
      titleText={indicator.titleText} number={format.format(indicator.number)} unit={indicator.unit} state={colors[indicator.state]} />
    return <AnalyticalCardHeader style={kpiFrame} titleText="Net revenue" titleTextLevel={2} {...(details ? kpiLabels : {})}
      value={typeof value === "number" ? format.format(value) : value} state={colors[state]} trend={trends[trend]}
      onClick={custom ? () => {} : undefined}>
      {details && (custom ? <>
        {side(kpiSides[0], "analytical-card-header-custom-target")}
        <button type="button" style={actionStyle}>View details</button>
      </> : kpiSides.map(indicator => side(indicator)))}
    </AnalyticalCardHeader>
  },
})
