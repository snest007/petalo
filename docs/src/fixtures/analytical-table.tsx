import * as React from "react"
import { AnalyticalTable, type AnalyticalTableColumnDef } from "@/components/ui/analytical-table"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de"
import { defineFixtures } from "../fixture-types"
import { fixtureInputs, headersFor, inventory, inventoryDetail, type Inventory } from "./analytical-table.cases"

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
  a11yDiffGroups: [
    {
      "cases": [
        "analytical-table-select-single-row",
        "analytical-table-select-single-rowselector",
        "analytical-table-row-highlight"
      ],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0/children/0"
        ],
        "analyticalTableHeaderText": 0,
        "reason": "ColumnHeader/index.js uses an ARIA label and two inert wrappers for this synthetic column. Petalo also renders the same text for axe empty-table-header. Check the exact label and duplicate text while comparing the remaining header."
      }
    },
    {
      "cases": [
        "analytical-table-select-multiple-row",
        "analytical-table-select-multiple-rowselector"
      ],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0/children/1"
        ],
        "reason": "ColumnHeader/index.js adds two unnamed generic wrappers for a synthetic column. Compare the same heading, text and checkbox semantics after removing those inert wrappers."
      }
    },
    {
      "cases": [
        "analytical-table-details-expanded",
        "analytical-table-details-included-expandable"
      ],
      "diff": {
        "ignore": [
          "/ax/0/children/0/children/1/children/0/children/0/children/1/children/0/children/0/name",
          "/snapshot/0/children/1/children/0/children/1/children/0/name",
          "/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0/name",
          "/snapshot/0/children/1/children/1/children/0/children/0/name",
          "/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0/properties/expanded",
          "/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0/name",
          "/snapshot/0/children/1/children/2/children/0/children/0/name",
          "/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0/properties/expanded",
          "/ax/0/children/0/children/1/children/0/children/3/children/0/children/0/children/0/name",
          "/snapshot/0/children/1/children/3/children/0/children/0/name",
          "/ax/0/children/0/children/1/children/0/children/3/children/0/children/0/children/0/properties/expanded",
          "/ax/0/children/0/children/1/children/0/children/4/children/0/children/0/children/0/name",
          "/snapshot/0/children/1/children/4/children/0/children/0/name",
          "/ax/0/children/0/children/1/children/0/children/4/children/0/children/0/children/0/properties/expanded"
        ],
        "reason": "Expandable.js names the UI5 Button only on focus and supplies expanded only when true. Petalo keeps a name and both expansion states. Cell text, description and expansion still compare. The generic form-associated shadow host is inert. RowSubComponent.js leaves a focusable div directly under the row. Petalo uses a gridcell to give it the required role and compares its full interactive contents.",
        "ui5FormHosts": [
          "/ui5/ax/0/children/0/children/1/children/0/children/0/children/1/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/3/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/4/children/0/children/0/children/0"
        ],
        "analyticalTableDetailRows": [
          0
        ]
      }
    }
  ],
  a11yDiff: {
      "analytical-table-row-navigation": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0/children/3/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/3/children/0/children/0/children/0"
      ],
      "analyticalTableHeaderText": 3,
      "reason": "ColumnHeader/index.js uses an ARIA label and two inert wrappers for this synthetic column. Petalo also renders the same text for axe empty-table-header. Check the exact label and duplicate text while comparing the remaining header."
    },
    "analytical-table-select-disabled": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0/children/0",
        "/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/properties/invalid",
        "/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/name",
        "/snapshot/0/children/1/children/0/children/0/children/0/name",
        "/ui5/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/children/0"
      ],
      "reason": "useRowDisableSelection removes the Select All action but leaves its instruction. The UI5 disabled checkbox has no name and holds an inert shadow wrapper. Petalo names it with its column name and removes the inactive instruction. Petalo renders the existing column name as real header text for axe empty-table-header. Chromium sets implicit invalid=false on the native button, and checked and disabled still compare.",
      "analyticalTableDisabledSelection": true,
      "analyticalTableHeaderText": 0
    },
    "analytical-table-tree-collapsed": {
      "ignore": [
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/snapshot/0/children/1/children/0/states/0",
        "/ax/0/children/0/children/1/children/0/children/1/properties/level",
        "/snapshot/0/children/1/children/1/states/0",
        "/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/children/0/name",
        "/snapshot/0/children/1/children/0/children/0/children/0/name",
        "/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/children/0/properties/expanded"
      ],
      "reason": "useStyling.getRowProps omits tree hierarchy on rows. Petalo exposes level and expansion at the treegrid row, verified against both implementations by the paired tree-row spec. Expandable.js names the UI5 Button only on focus and supplies expanded only when true. Petalo keeps a name and both expansion states. Cell text, description and expansion still compare. The generic form-associated shadow host is inert.",
      "ui5FormHosts": [
        "/ui5/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/children/0"
      ]
    },
    "analytical-table-tree-expanded": {
      "ignore": [
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/snapshot/0/children/1/children/0/states/0",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/snapshot/0/children/1/children/0/states/1",
        "/ax/0/children/0/children/1/children/0/children/1/properties/expanded",
        "/snapshot/0/children/1/children/1/states/0",
        "/ax/0/children/0/children/1/children/0/children/1/properties/level",
        "/snapshot/0/children/1/children/1/states/1",
        "/ax/0/children/0/children/1/children/0/children/2/properties/level",
        "/snapshot/0/children/1/children/2/states/0",
        "/ax/0/children/0/children/1/children/0/children/3/properties/level",
        "/snapshot/0/children/1/children/3/states/0",
        "/ax/0/children/0/children/1/children/0/children/4/properties/level",
        "/snapshot/0/children/1/children/4/states/0",
        "/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/children/0/name",
        "/snapshot/0/children/1/children/0/children/0/children/0/name",
        "/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0/name",
        "/snapshot/0/children/1/children/1/children/0/children/0/name"
      ],
      "reason": "useStyling.getRowProps omits tree hierarchy on rows. Petalo exposes level and expansion at the treegrid row, verified against both implementations by the paired tree-row spec. Expandable.js names the UI5 Button only on focus and supplies expanded only when true. Petalo keeps a name and both expansion states. Cell text, description and expansion still compare. The generic form-associated shadow host is inert.",
      "ui5FormHosts": [
        "/ui5/ax/0/children/0/children/1/children/0/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0"
      ]
    },
    "analytical-table-select-tree-partial": {
      "ignore": [
        "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0/children/1",
        "/ax/0/children/0/children/1/children/0/children/0/properties/expanded",
        "/snapshot/0/children/1/children/0/states/0",
        "/ax/0/children/0/children/1/children/0/children/0/properties/level",
        "/snapshot/0/children/1/children/0/states/1",
        "/ax/0/children/0/children/1/children/0/children/1/properties/expanded",
        "/snapshot/0/children/1/children/1/states/0",
        "/ax/0/children/0/children/1/children/0/children/1/properties/level",
        "/snapshot/0/children/1/children/1/states/1",
        "/ax/0/children/0/children/1/children/0/children/2/properties/level",
        "/snapshot/0/children/1/children/2/states/0",
        "/ax/0/children/0/children/1/children/0/children/3/properties/level",
        "/snapshot/0/children/1/children/3/states/0",
        "/ax/0/children/0/children/1/children/0/children/4/properties/level",
        "/snapshot/0/children/1/children/4/states/0",
        "/ax/0/children/0/children/1/children/0/children/0/children/1/children/0/children/0/name",
        "/snapshot/0/children/1/children/0/children/1/children/0/name",
        "/ax/0/children/0/children/1/children/0/children/1/children/1/children/0/children/0/name",
        "/snapshot/0/children/1/children/1/children/1/children/0/name"
      ],
      "reason": "useStyling.getRowProps omits tree hierarchy on rows. Petalo exposes level and expansion at the treegrid row, verified against both implementations by the paired tree-row spec. Expandable.js names the UI5 Button only on focus and supplies expanded only when true. Petalo keeps a name and both expansion states. Cell text, description and expansion still compare. The generic form-associated shadow host is inert.",
      "ui5FormHosts": [
        "/ui5/ax/0/children/0/children/1/children/0/children/0/children/1/children/0/children/0",
        "/ui5/ax/0/children/0/children/1/children/0/children/1/children/1/children/0/children/0"
      ]
    },
    "analytical-table-details-visible": {
      "ignore": [],
      "reason": "RowSubComponent.js leaves a focusable div directly under the row. Petalo uses a gridcell to give it the required role and compares its full interactive contents.",
      "analyticalTableDetailRows": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "analytical-table-details-included-height": {
      "ignore": [],
      "reason": "RowSubComponent.js leaves a focusable div directly under the row. Petalo uses a gridcell to give it the required role and compares its full interactive contents.",
      "analyticalTableDetailRows": [
        0,
        1,
        2
      ]
    },
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
      isTreeTable={props.tree} selectionMode={props.selectionMode} selectionBehavior={props.selectionBehavior}
      defaultSelectedRowIds={props.selected} indeterminateRowSelection={props.indeterminate}
      isRowSelectable={props.disableSelection ? row => !row.original.blocked : undefined}
      subComponentsBehavior={props.detail}
      renderRowSubComponent={props.detail ? ({ row }) => inventoryDetail(row.original.product) : undefined}
      withRowHighlight={props.highlight} withNavigationHighlight={props.navigation}
      markNavigatedRow={props.navigation ? row => row.id === "1" : undefined}
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
