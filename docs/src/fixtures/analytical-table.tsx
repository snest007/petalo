import * as React from "react"
import { AnalyticalTable, type AnalyticalTableColumnDef } from "@/components/ui/analytical-table"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de"
import { defineFixtures } from "../fixture-types"
import { fixtureInputs, headersFor, inventory, type Inventory } from "./analytical-table.cases"

function OpenColumnMenu({ children }: { children: React.ReactNode }) {
  const frame = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const node = frame.current
    if (!node) return
    let requested = false
    const open = () => {
      const header = node.querySelector<HTMLElement>('[role="columnheader"]')
      if (header && !requested) {
        requested = true
        header.click()
      }
      const popup = node.querySelector<HTMLElement>("[data-analytical-table-popup]")
      if (popup?.matches(":popover-open")) {
        // Match the pinned WCR fixture, which keeps its popup outside the top layer.
        if (popup.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
        popup.hidePopover()
      }
    }
    const observer = new MutationObserver(open)
    observer.observe(node, { subtree: true, childList: true })
    open()
    return () => observer.disconnect()
  }, [])
  return <div ref={frame} style={{ position: "relative" }}>
    <style>{`
      [data-fixture="analytical-table-sort-filter-open"] [data-analytical-table-popup] {
        display: block !important;
        position: absolute !important;
        inset: auto !important;
        inset-inline-start: 0 !important;
        inset-block-start: 100% !important;
        transform: none !important;
      }
    `}</style>
    {children}
  </div>
}

export default defineFixtures({
  ...fixtureInputs,
  react: (props) => {
    const columns: AnalyticalTableColumnDef<Inventory>[] = headersFor(props.longHeader).map(({ key, label }, index) => ({
      accessorKey: key, header: label, width: props.widths?.[index],
      sticky: props.frozen && index === 0 ? "start" : undefined,
    }))
    const grid = <AnalyticalTable aria-label="Inventory" data={props.filtered ? [] : props.data ?? inventory} columns={columns}
      dir={props.rtl ? "rtl" : undefined} initialState={{ hiddenColumns: props.hidden }}
      sortable={props.sortable} filterable={props.filterable} defaultSorting={props.sorting} defaultColumnFilters={props.columnFilters}
      alternateRowColor={props.alternate} scaleWidthMode={props.scaleWidthMode}
      defaultVisibleRows={5} minRows={3} visibleRowCountMode={props.countMode} loading={props.loading}
      noDataReason={props.filtered ? "Filtered" : undefined} announceEmptyCells={props.emptyCell}
      classNames={props.neutral ? { row: "inventory-row", cell: "inventory-cell" } : undefined}
      components={props.neutral ? { Body: ({ children }) => children } : undefined} />
    return <div style={{ width: 480, height: props.height }}>
      {props.german ? <FioriLocaleProvider locale="de-DE" texts={{ "wcr:LIST_NO_DATA": de["wcr:LIST_NO_DATA"] }}>{grid}</FioriLocaleProvider> : props.openHeaderMenu ? <OpenColumnMenu>{grid}</OpenColumnMenu> : grid}
    </div>
  },
})
