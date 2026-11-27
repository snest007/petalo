import * as React from "react"
import { FioriDropIndicator } from "@/lib/fiori-drag-and-drop"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import ar from "../../../registry/i18n/ar.json"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import {
  Table,
  TableCell,
  TableGroupRow,
  TableHeaderCell,
  TableHeaderCellActionAI,
  TableHeaderRow,
  TableRow,
  TableRowAction,
  TableRowActionNavigation,
  type TableRowHighlight,
} from "@/components/ui/table"
import { deleteIcon, edit } from "@/lib/fiori-icons"

import { defineFixtures, readPageOptions } from "../fixture-types"

export type TableFixtureProps = {
  loading?: boolean
  interactive?: boolean
  selection?: "single" | "multi"
  selected?: string[]
  highlight?: boolean
  actions?: boolean
  navigated?: boolean
  group?: boolean
  noData?: boolean
  popin?: boolean
  growing?: boolean
  sort?: boolean
  alternate?: boolean
  aiAction?: boolean
  dropPlacement?: "Before" | "After" | "On"
}

// Deterministic data shared with table.ui5.ts.
export const TABLE_COLUMNS = [
  { id: "product", label: "Product", importance: 3 },
  { id: "supplier", label: "Supplier", importance: 1 },
  { id: "price", label: "Price", importance: 2, align: "End" as const },
]
export const TABLE_ROWS = [
  { key: "p1", product: "Notebook Basic 15", supplier: "Very Best Screens", price: "956.00 EUR" },
  { key: "p2", product: "Notebook Basic 17", supplier: "Very Best Screens", price: "1,249.00 EUR" },
  { key: "p3", product: "Ergo Screen E-I", supplier: "Smartcards", price: "230.00 EUR" },
  { key: "p4", product: "Flat Basic", supplier: "Technocom", price: "399.00 EUR" },
]
export const TABLE_HIGHLIGHTS: TableRowHighlight[] = ["negative", "critical", "positive", "information"]
export const TABLE_WIDTH = "32rem"
export const TABLE_POPIN_WIDTH = "16rem"

const unownedAIActionProps = { id: "unowned-ai-button", role: "switch", tabIndex: -1, "aria-label": "Unowned AI action" }
const packs = { "de-DE": de, "zh-CN": zh, "ar-EG": ar }

function StaticTableDrop({ children, placement }: { children: React.ReactNode; placement?: "Before" | "After" | "On" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [elements, setElements] = React.useState<{ owner: HTMLElement; target: HTMLElement } | null>(null)
  React.useLayoutEffect(() => {
    if (!placement || !ref.current) return
    const owner = ref.current.querySelector<HTMLElement>('[data-slot="table"]')!
    setElements({ owner, target: owner.querySelectorAll<HTMLElement>('[data-slot="table-row"]')[1] })
  }, [placement])
  return <div ref={ref} style={{ position: "relative" }}>{children}{elements && <FioriDropIndicator ownerReference={elements.owner} targetReference={elements.target} placement={placement} />}</div>
}

export default defineFixtures<TableFixtureProps>({
  name: "table",
  a11yDiff: {
    "table-ai-header": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/0/children/1/children/0"
      ],
      "ui5FormHosts": [
        "/ui5/ax/0/children/1/children/0/children/1/children/0/children/0"
      ],
      "reason": "TableHeaderCellActionBaseTemplate.js nests a form-associated UI5 Button inside the AI action host. Unwrap the exact anonymous wrappers and the host that repeats the inner button's default validity. Compare the actual button and all of its semantics."
    },
    "table-ai-popin": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ours/ax/0/children/0/children/1/children/0/children/2/children/0",
        "/ui5/ax/0/children/1/children/0/children/2/children/0",
        "/ui5/ax/0/children/1/children/1/children/2/children/1",
        "/ui5/ax/0/children/1/children/2/children/2/children/1",
        "/ui5/ax/0/children/1/children/3/children/2/children/1",
        "/ui5/ax/0/children/1/children/4/children/2/children/1"
      ],
      "ui5FormHosts": [
        "/ui5/ax/0/children/1/children/1/children/2/children/1/children/0",
        "/ui5/ax/0/children/1/children/2/children/2/children/1/children/0",
        "/ui5/ax/0/children/1/children/3/children/2/children/1/children/0",
        "/ui5/ax/0/children/1/children/4/children/2/children/1/children/0"
      ],
      "reason": "TableCell.js:_popinHeaderNodes clones the header action into each row. Unwrap each anonymous action wrapper and the form-associated UI5 Button hosts that repeat their inner button's default validity. Keep the row pop-in labels and all button semantics."
    },
    "table": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-actions": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/1/children/0/children/3/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/0/children/3/children/0",
        "/ui5/ax/0/children/1/children/1/children/3/children/0",
        "/ui5/ax/0/children/1/children/1/children/3/children/1",
        "/ui5/ax/0/children/1/children/1/children/3/children/2",
        "/ui5/ax/0/children/1/children/2/children/3/children/0",
        "/ui5/ax/0/children/1/children/2/children/3/children/1",
        "/ui5/ax/0/children/1/children/2/children/3/children/2",
        "/ui5/ax/0/children/1/children/3/children/3/children/0",
        "/ui5/ax/0/children/1/children/3/children/3/children/1",
        "/ui5/ax/0/children/1/children/3/children/3/children/2",
        "/ui5/ax/0/children/1/children/4/children/3/children/0",
        "/ui5/ax/0/children/1/children/4/children/3/children/1",
        "/ui5/ax/0/children/1/children/4/children/3/children/2"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-alternate": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-drop-indicator-after": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/5",
        "/ui5/ax/0/children/1/children/5/children/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-drop-indicator-before": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/5",
        "/ui5/ax/0/children/1/children/5/children/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-drop-indicator-on": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/5",
        "/ui5/ax/0/children/1/children/5/children/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-group": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-growing": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/3/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-interactive": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-loading": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/2/children/0",
        "/ours/ax/0/children/0/children/2/children/0/children/0/children/0",
        "/ours/ax/0/children/0/children/2/children/0/children/0/children/0/children/0",
        "/ours/ax/0/children/0/children/2/children/0/children/0/children/0/children/1",
        "/ours/ax/0/children/0/children/2/children/0/children/0/children/0/children/2",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/5",
        "/ui5/ax/0/children/1/children/5/children/0",
        "/ui5/ax/0/children/1/children/5/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/5/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/5/children/0/children/0/children/0/children/1",
        "/ui5/ax/0/children/1/children/5/children/0/children/0/children/0/children/2"
      ],
      "reason": "UI5 TableTemplate.js nests BusyIndicator under role=grid, violating axe aria-required-children. Relocate its complete loading overlay after its exact owning grid, preserving the progressbar and native focus sentinel with every channel/descendant/order. All busy, row/inert, spinner-description and focus-sentinel differences remain compared. React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order.",
      "tableLoadingOverlay": {
        "gridName": "Products",
        "progressbarName": "Please wait",
        "ax": "/ax/1/children/5",
        "snapshot": "/snapshot/0/children/5"
      }
    },
    "table-multi": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/0/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/1/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/2/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/3/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/4/children/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-multi-all": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/0/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/1/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/2/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/3/children/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/1/children/4/children/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-no-data": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-popin": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/1/children/0/children/2/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/1/children/0/children/2/children/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-single": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/1/children/0/children/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "table-sorted": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0"
      ],
      "reason": "React/DOM difference in table: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    }
  },
  cases: [
    { id: "table", props: {} },
    { id: "table-loading", props: { loading: true } },
    { id: "table-interactive", props: { interactive: true }, interact: { selector: '[data-slot="table-row"]', ui5Selector: "ui5-table-row" } },
    { id: "table-drop-indicator-before", props: { dropPlacement: "Before" } },
    { id: "table-drop-indicator-after", props: { dropPlacement: "After" } },
    { id: "table-drop-indicator-on", props: { dropPlacement: "On" } },
    { id: "table-sorted", props: { sort: true } },
    { id: "table-multi", props: { selection: "multi", selected: ["p1", "p3"] } },
    { id: "table-multi-all", props: { selection: "multi", selected: ["p1", "p2", "p3", "p4"] } },
    { id: "table-single", props: { selection: "single", selected: ["p2"] } },
    { id: "table-actions", props: { actions: true, navigated: true } },
    { id: "table-group", props: { group: true } },
    { id: "table-alternate", props: { alternate: true } },
    { id: "table-no-data", props: { noData: true } },
    { id: "table-popin", props: { popin: true } },
    { id: "table-ai-header", props: { aiAction: true, sort: true } },
    { id: "table-ai-popin", props: { aiAction: true, popin: true } },
    { id: "table-growing", props: { growing: true } },
    { id: "table-highlight", props: { highlight: true } },
  ],
  // ui5-table 2.28 has no row highlight (sap.m.Table's status bar); our highlight follows ui5-li's,
  // so there's nothing to compare it with. Checked by screenshot only.
  skipCompare: ["table-highlight"],
  react: ({ selection, selected, highlight, actions, navigated, group, noData, popin, growing, sort, alternate, dropPlacement, interactive, loading, aiAction }) => {
    const rows = noData ? [] : TABLE_ROWS
    const renderRow = (r: (typeof TABLE_ROWS)[number], i: number) => (
      <TableRow
        key={r.key}
        rowKey={r.key}
        interactive={interactive}
        navigated={navigated && i === 1}
        highlight={highlight ? TABLE_HIGHLIGHTS[i] : undefined}
        actions={
          actions && (
            <>
              <TableRowAction icon={edit} text="Edit" />
              <TableRowAction icon={deleteIcon} text="Delete" />
              <TableRowActionNavigation interactive />
            </>
          )
        }
      >
        {TABLE_COLUMNS.map((c) => (
          <TableCell key={c.id}>{r[c.id as keyof typeof r]}</TableCell>
        ))}
      </TableRow>
    )
    const table = (
      <StaticTableDrop placement={dropPlacement}>
      <Table
        aria-label="Products"
        loading={loading}
        loadingDelay={0}
        style={{ width: popin ? TABLE_POPIN_WIDTH : TABLE_WIDTH }}
        overflowMode={popin ? "popin" : "scroll"}
        selectionMode={selection ?? "none"}
        selectedRows={selected}
        rowActionCount={actions ? 3 : 0}
        alternateRowColors={alternate}
        growing={growing ? "button" : undefined}
      >
        <TableHeaderRow>
          {TABLE_COLUMNS.map((c) => (
            <TableHeaderCell
              key={c.id}
              importance={c.importance}
              minWidth={popin ? "7rem" : undefined}
              horizontalAlign={c.align}
              sortIndicator={sort && c.id === "product" ? "ascending" : sort && c.id === "price" ? "descending" : undefined}
              action={aiAction && c.id === "supplier" ? <TableHeaderCellActionAI {...unownedAIActionProps}
                className="fixture-ai-action" classNames={{ icon: "fixture-ai-action-icon" }} /> : undefined}
            >
              {c.label}
            </TableHeaderCell>
          ))}
        </TableHeaderRow>
        {group ? (
          <>
            <TableGroupRow>Very Best Screens</TableGroupRow>
            {rows.slice(0, 2).map(renderRow)}
            <TableGroupRow>Others</TableGroupRow>
            {rows.slice(2).map((r, i) => renderRow(r, i + 2))}
          </>
        ) : (
          rows.map(renderRow)
        )}
      </Table>
      </StaticTableDrop>
    )
    const { locale, dir } = readPageOptions()
    return aiAction && locale && Object.hasOwn(packs, locale)
      ? <FioriLocaleProvider locale={locale} dir={dir} texts={packs[locale as keyof typeof packs]}>{table}</FioriLocaleProvider>
      : table
  },
})
