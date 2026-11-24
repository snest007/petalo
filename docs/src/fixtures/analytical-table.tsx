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
    // Static fixtures keep the exact menu mounted and painted. Cancel its
    // top-layer entry synchronously before another fixture can take focus.
    const pin = (event: Event) => {
      if (event.target instanceof HTMLElement && event.target.hasAttribute("data-analytical-table-popup")) event.preventDefault()
    }
    node.addEventListener("beforetoggle", pin, true)
    let requested = false
    const open = () => {
      const header = node.querySelector<HTMLElement>('[role="columnheader"]')
      if (header && !requested) {
        requested = true
        header.click()
      }
      const popup = node.querySelector<HTMLElement>("[data-analytical-table-popup]")
      if (popup?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
    }
    const observer = new MutationObserver(open)
    observer.observe(node, { subtree: true, childList: true })
    open()
    return () => {
      observer.disconnect()
      node.removeEventListener("beforetoggle", pin, true)
    }
  }, [])
  return <div ref={frame} style={{ position: "relative" }}>
    <style>{`
      :is([data-fixture="analytical-table-sort-filter-open"], [data-fixture="analytical-table-group-menu-open"]) [data-analytical-table-popup] {
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
  a11yDiff: {
    "analytical-table-group-collapsed": {
      "ignore": [
        "/ax/0/children/0/role",
        "/ax/0/children/0/properties/required",
        "/snapshot/0/role",
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/ax/0/children/0/children/1/children/0/children/1/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/1/properties/level",
        "/snapshot/0/children/1/children/0/states/0",
        "/snapshot/0/children/1/children/1/states/0"
      ],
      "reason": "WCR uses grid and omits group hierarchy in useStyling.getRowProps. H3 uses treegrid because aria-expanded and aria-level require it on rows. Chromium adds a required=false default for treegrid. The paired group-row spec checks the exact roles, implicit required state and row states while preserving WCR cell states and names."
    },
    "analytical-table-group-expanded": {
      "ignore": [
        "/ax/0/children/0/role",
        "/ax/0/children/0/properties/required",
        "/snapshot/0/role",
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/ax/0/children/0/children/1/children/0/children/3/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/3/properties/level",
        "/snapshot/0/children/1/children/0/states/0",
        "/snapshot/0/children/1/children/0/states/1",
        "/snapshot/0/children/1/children/3/states/0"
      ],
      "reason": "WCR uses grid and omits group hierarchy in useStyling.getRowProps. H3 uses treegrid because aria-expanded and aria-level require it on rows. Chromium adds a required=false default for treegrid. The paired group-row spec checks the exact roles, implicit required state and row states while preserving WCR cell states and names."
    },
    "analytical-table-group-nested": {
      "ignore": [
        "/ax/0/children/0/role",
        "/ax/0/children/0/properties/required",
        "/snapshot/0/role",
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/ax/0/children/0/children/1/children/0/children/1/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/1/properties/level",
        "/ax/0/children/0/children/1/children/0/children/3/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/3/properties/level",
        "/ax/0/children/0/children/1/children/0/children/4/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/4/properties/level",
        "/snapshot/0/children/1/children/0/states/0",
        "/snapshot/0/children/1/children/0/states/1",
        "/snapshot/0/children/1/children/1/states/0",
        "/snapshot/0/children/1/children/1/states/1",
        "/snapshot/0/children/1/children/3/states/0",
        "/snapshot/0/children/1/children/4/states/0"
      ],
      "reason": "WCR uses grid and omits group hierarchy in useStyling.getRowProps. H3 uses treegrid because aria-expanded and aria-level require it on rows. Chromium adds a required=false default for treegrid. The paired group-row spec checks the exact roles, implicit required state and row states while preserving WCR cell states and names."
    },
    "analytical-table-group-de-aggregates": {
      "ignore": [
        "/ax/0/children/0/role",
        "/ax/0/children/0/properties/required",
        "/snapshot/0/role",
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/ax/0/children/0/children/1/children/0/children/1/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/1/properties/level",
        "/snapshot/0/children/1/children/0/states/0",
        "/snapshot/0/children/1/children/1/states/0"
      ],
      "reason": "WCR uses grid and omits group hierarchy in useStyling.getRowProps. H3 uses treegrid because aria-expanded and aria-level require it on rows. Chromium adds a required=false default for treegrid. The paired group-row spec checks the exact roles, implicit required state and row states while preserving WCR cell states and names."
    }
  },
  react: (props) => {
    const columns: AnalyticalTableColumnDef<Inventory>[] = headersFor(props.longHeader, props.aggregates).map(({ key, label }, index) => ({
      accessorKey: key, header: label, width: props.widths?.[index],
      aggregate: props.aggregates ? key === "stock" ? "sum" : key === "reserve" ? "average" : undefined : undefined,
      sticky: props.frozen && index === 0 ? "start" : undefined,
    }))
    const grid = <AnalyticalTable<Inventory> aria-label="Inventory" data={props.filtered ? [] : props.data ?? inventory} columns={columns}
      dir={props.rtl || props.aggregates && document.documentElement.dir === "rtl" ? "rtl" : undefined} initialState={{ hiddenColumns: props.hidden }}
      groupable={props.groupable} defaultGroupBy={props.groupBy} defaultExpanded={props.expanded}
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
