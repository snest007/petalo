import * as React from "react"
import { AnalyticalTable } from "@ui5/webcomponents-react/AnalyticalTable"
import { useAnnounceEmptyCells, useStickyColumns } from "@ui5/webcomponents-react/AnalyticalTableHooks"
import { defineFixtures } from "../fixture-types"
import { fixtureInputs, headersFor, inventory } from "./analytical-table.cases"

const sticky = [useStickyColumns()]
const announceEmpty = [useAnnounceEmptyCells]

function AfterFonts({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  React.useLayoutEffect(() => {
    const css = getComputedStyle(document.documentElement)
    const size = css.getPropertyValue("--sapFontSize").trim()
    const families = ["--sapFontFamily", "--_ui5wcr-AnalyticalTable-HeaderFontFamily"].map(key => css.getPropertyValue(key).trim())
    let mounted = true
    // AnalyticalTable starts measuring eagerly when fonts.status is initially
    // loaded, even if no text has requested the 72 face yet. Request both faces
    // before mounting the content-based width fixtures.
    void Promise.all(families.map(family => document.fonts.load(`${size} ${family}`))).then(() => {
      if (mounted) setReady(true)
    })
    return () => { mounted = false }
  }, [])
  return ready ? children : null
}
export default defineFixtures({
  ...fixtureInputs,
  react: (props) => {
    const table = <AnalyticalTable accessibleName="Inventory" data={props.filtered ? [] : props.data ?? inventory}
        columns={headersFor(props.longHeader).map(({ key, label }, index) => ({
          accessor: key, Header: label, width: props.widths?.[index],
          sticky: props.frozen && index === 0 ? "start" : undefined,
        }))}
        reactTableOptions={{ manualGlobalFilter: props.filtered, useControlledState: props.filtered ? (state: Record<string, unknown>) => ({ ...state, globalFilter: "unmatched product" }) : undefined, initialState: { hiddenColumns: props.hidden ?? [],
          globalFilter: props.filtered ? "unmatched product" : undefined } }}
        tableHooks={props.frozen ? sticky : props.emptyCell ? announceEmpty : undefined}
        alternateRowColor={props.alternate} scaleWidthMode={props.scaleWidthMode}
        visibleRows={5} minRows={3} onLoadMore={() => {}} visibleRowCountMode={props.countMode} loading={props.loading}
        noDataText={props.german ? "Keine Daten" : undefined} />
    return <div dir={props.rtl ? "rtl" : undefined} style={{ width: 480, height: props.height }}>
      {props.scaleWidthMode === "Smart" || props.scaleWidthMode === "Grow" ? <AfterFonts>{table}</AfterFonts> : table}
    </div>
  },
})
