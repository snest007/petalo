import { AnalyticalCardHeader, NumericSideIndicator } from "@/components/ui/analytical-card-header"
import { FioriLocaleProvider, type FioriTexts } from "@/lib/fiori-locale"
import { defineFixtures, readPageOptions } from "../fixture-types"
import { actionStyle, kpiCases, kpiFrame, kpiLabels, kpiSides, type KpiCase } from "./analytical-card-header.cases"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"

const packs: Record<string, FioriTexts> = { "de-DE": de, "zh-CN": zh, "ar-EG": ar }
export default defineFixtures<KpiCase>({
  name: "analytical-card-header",
  reference: "wcr",
  cases: kpiCases,
  react: ({ value, state, trend, details, custom }) => {
    const { locale, dir } = readPageOptions()
    const header = <AnalyticalCardHeader style={kpiFrame} locale={locale} dir={dir} titleText="Net revenue" titleTextLevel={2}
      {...(details ? kpiLabels : {})} value={value} state={state} trend={trend}
      classNames={custom ? { value: "tracking-normal", sideIndicators: "items-start" } : undefined}
      onClick={custom ? () => {} : undefined}>
      {details && (custom ? <>
        <NumericSideIndicator id="analytical-card-header-custom-target" {...kpiSides[0]} />
        <button type="button" style={actionStyle}>View details</button>
      </> : kpiSides.map(side => <NumericSideIndicator key={side.titleText} {...side} />))}
    </AnalyticalCardHeader>
    return locale ? <FioriLocaleProvider locale={locale} dir={dir} texts={packs[locale]}>{header}</FioriLocaleProvider> : header
  },
})
