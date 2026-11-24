import * as React from "react"
import { AnalyticalTable } from "@ui5/webcomponents-react/AnalyticalTable"
import { useAnnounceEmptyCells, useStickyColumns } from "@ui5/webcomponents-react/AnalyticalTableHooks"
import { Cell } from "@ui5/webcomponents-react/dist/components/AnalyticalTable/defaults/Column/Cell.js"
import { ColumnHeaderModal } from "@ui5/webcomponents-react/dist/components/AnalyticalTable/defaults/Column/ColumnHeaderModal.js"
import { defineFixtures } from "../fixture-types"
import { fixtureInputs, headersFor, inventory } from "./analytical-table.cases"

import { pinWcrPopup } from "./wcr-popup-in-place"

function OpenColumnMenu({ children }: { children: React.ReactNode }) {
  const frame = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const node = frame.current
    if (!node) return
    let requested = false
    const sync = () => {
      const header = node.querySelector<HTMLElement>('[role="columnheader"]')
      if (header && !requested) {
        requested = true
        header.click()
      }
      const popup = node.querySelector<HTMLElement>('[data-component-name="ATHeaderPopover"]')
      if (!popup || popup.dataset.pinned) return
      popup.dataset.pinned = "true"
      // Pin the actual modal within the capture cell, independent of the opener's viewport position.
      pinWcrPopup(popup)
      popup.style.setProperty("position", "absolute", "important")
      // The live popover escapes the transformed header's stacking context in the top layer.
      // Raise that header container for the in-place capture so body cells paint below it.
      popup.closest('[role="columnheader"]')?.parentElement?.style.setProperty("z-index", "1")
      popup.style.setProperty("inset-inline-start", "0", "important")
      popup.style.setProperty("inset-block-start", "100%", "important")
    }
    const observer = new MutationObserver(sync)
    observer.observe(node, { subtree: true, childList: true })
    sync()
    return () => observer.disconnect()
  }, [])
  return <div ref={frame} style={{ position: "relative" }}>{children}</div>
}

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
        columns={headersFor(props.longHeader, props.aggregates).map(({ key, label }, index) => ({
          accessor: key, Header: label,
          ...(props.widths?.[index] === undefined ? {} : { width: props.widths[index] }),
          ...(props.aggregates ? {
            aggregate: key === "stock" ? "sum" : key === "reserve" ? "average" : undefined,
            Aggregated: (instance: Parameters<typeof Cell>[0]) => <Cell {...instance} cell={{ ...instance.cell,
              value: typeof instance.cell.value === "number" ?
                new Intl.NumberFormat("de-DE", { maximumFractionDigits: 20 }).format(instance.cell.value) : instance.cell.value,
            }} />,
          } : {}),
          sticky: props.frozen && index === 0 ? "start" : undefined,
          ...(props.openHeaderMenu ? { Popover: (instance: Parameters<typeof ColumnHeaderModal>[0]) => (
            <ColumnHeaderModal {...instance} popoverProps={{ ...instance.popoverProps, openerRef: { current: null! }, openerId: "" }} />
          ) } : {}),
          ...(props.sortable || props.filterable || props.groupable ? { headerLabel: label } : {}),
        }))}
        reactTableOptions={{ manualGlobalFilter: props.filtered, useControlledState: props.filtered ? (state: Record<string, unknown>) => ({ ...state, globalFilter: "unmatched product" }) : undefined, initialState: { hiddenColumns: props.hidden ?? [],
          globalFilter: props.filtered ? "unmatched product" : undefined,
          ...(props.groupBy ? { groupBy: props.groupBy } : {}),
          ...(props.expanded ? { expanded: Object.fromEntries(Object.entries(props.expanded).map(([id, value]) => [decodeURIComponent(id), value])) } : {}),
          ...(props.sorting ? { sortBy: props.sorting } : {}),
          ...(props.columnFilters ? { filters: props.columnFilters } : {}),
        } }}
        tableHooks={props.frozen ? sticky : props.emptyCell ? announceEmpty : undefined}
        groupable={props.groupable} sortable={props.sortable} filterable={props.filterable} alternateRowColor={props.alternate} scaleWidthMode={props.scaleWidthMode}
        visibleRows={5} minRows={3} onLoadMore={() => {}} visibleRowCountMode={props.countMode} loading={props.loading}
        noDataText={props.german ? "Keine Daten" : undefined} />
    return <div dir={props.rtl ? "rtl" : undefined} style={{ width: 480, height: props.height }}>
      {props.scaleWidthMode === "Smart" || props.scaleWidthMode === "Grow" ? <AfterFonts>{table}</AfterFonts> : props.openHeaderMenu ? <OpenColumnMenu>{table}</OpenColumnMenu> : table}
    </div>
  },
})
