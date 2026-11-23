import * as React from "react"
import {
  AnalyticalTable, useAnalyticalTable, type AnalyticalTableBodyProps,
  type AnalyticalTableColumnDef, type AnalyticalTableInstance, type AnalyticalTableProps,
} from "@/components/ui/analytical-table"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import { defineDemo } from "./types"

type Inventory = { product: string; category: string; stock: number }
export const inventory: Inventory[] = Array.from({ length: 75 }, (_, index) => ({
  product: [`Alpine Tent`, `Trail Stove`, `Camp Lantern`, `Summit Pack`][index % 4] + (index < 4 ? "" : ` ${index + 1}`),
  category: ["Shelter", "Cooking", "Lighting", "Packs"][index % 4],
  stock: (29 + index * 13) % 74,
}))
export const columns: AnalyticalTableColumnDef<Inventory>[] = [
  { accessorKey: "product", header: "Product", width: 180, autoResizable: true },
  { accessorKey: "category", header: "Category", width: 140, headerTooltip: "Inventory category" },
  { accessorKey: "stock", header: "Stock", width: 140, hAlign: "End" },
]

const customColumns: AnalyticalTableColumnDef<Inventory>[] = [
  columns[0], columns[1],
  {
    ...columns[2], meta: { className: "analytical-table-stock", headerClassName: "analytical-table-stock-header" },
    cell: ({ value, defaultContent }) => <span className="flex items-center gap-2">
      <span aria-hidden="true" className="inline-block h-2 w-12 rounded bg-(--sapList_BorderColor)">
        <span className="block h-full rounded bg-(--sapChart_OrderedColor_1)" style={{ width: `${value}%` }} />
      </span>
      <button type="button" className="underline">{defaultContent}</button>
    </span>,
  },
]
function InventoryBody({ children }: AnalyticalTableBodyProps) {
  const { model } = useAnalyticalTable<Inventory>()
  // Attach inventory analytics metadata to the virtual rows without inserting
  // an element into the accessibility tree or reimplementing row layout.
  return <div className="contents" data-loaded-products={model.rows.length}>{children}</div>
}

export function CustomAnalyticalTable({ hostile = false }: { hostile?: boolean }) {
  const tableRef = React.useRef<AnalyticalTableInstance<Inventory>>(null)
  const [visibility, setVisibility] = React.useState<Record<string, boolean>>({})
  const [order, setOrder] = React.useState<string[]>([])
  const [sizing, setSizing] = React.useState<Record<string, number>>({})
  const [pinning, setPinning] = React.useState({ start: [] as string[], end: [] as string[] })
  const [empty, setEmpty] = React.useState(false)
  const [feedback, setFeedback] = React.useState("")
  const tools = { onColumnResize: ({ columnWidth }: { columnWidth: number }) => setFeedback(String(columnWidth)),
    onAutoResize: ({ width }: { width: number }) => setFeedback(String(width)),
    onColumnsReorder: ({ columnsNewOrder }: { columnsNewOrder: { id: string }[] }) => setFeedback(columnsNewOrder.map(column => column.id).join(",")) }
  return <div className="grid w-full max-w-xl gap-2" id="analytical-table-custom">
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => tableRef.current?.focusCell(20, 0)}>Focus product 20</button>
      <button type="button" onClick={() => tableRef.current?.resetColumnSizing()}>Reset widths</button>
      <button type="button" onClick={() => setVisibility(current => ({ category: current.category === false }))}>Toggle category</button>
      <button type="button" onClick={() => setEmpty(previous => !previous)}>Toggle products</button>
    </div>
    <FioriLocaleProvider locale="en-US" texts={{ "wcr:LIST_NO_DATA": "Inventory is empty" }}>
      <AnalyticalTable data={empty ? [] : inventory} columns={customColumns} aria-label="Custom inventory"
        tableRef={tableRef} tableOptions={{ getRowId: (_, index) => `product-${index}`, meta: { source: "inventory" } }}
        columnVisibility={visibility} onColumnVisibilityChange={setVisibility}
        columnOrder={order} onColumnOrderChange={setOrder} columnSizing={sizing} onColumnSizingChange={setSizing}
        columnPinning={pinning} onColumnPinningChange={setPinning}
        visibleRows={4} minRows={3} enableColumnFreeze retainColumnWidth {...tools}
        headerMenuItems={column => [{ id: "fit", text: "Reset inventory widths", onSelect: () => tableRef.current?.resetColumnSizing() },
          { id: "identify", text: "Identify column", onSelect: () => setFeedback(column.id) }]}
        texts={{ freezeColumn: "Keep column in view" }}
        classNames={{ "header-cell": "analytical-table-custom-header", cell: "analytical-table-custom-cell" }}
        components={{ Body: InventoryBody }}
        getRowProps={() => ({ className: "analytical-table-custom-row" })}
        getCellProps={cell => hostile && cell.column.id === "stock" ? {
          role: "button", "aria-selected": true, tabIndex: 4, id: "analytical-table-hostile",
          className: "analytical-table-merged-cell", style: { fontVariantNumeric: "tabular-nums" },
          onClick: () => setFeedback("Cell clicked"),
        } : { className: "analytical-table-merged-cell" }}
        NoDataComponent={({ defaultContent }) => <strong>{defaultContent}</strong>} />
    </FioriLocaleProvider>
    <output aria-label="Last column action">{feedback}</output>
  </div>
}

export function AnalyticalTableColumnDemo({ dir, tableRef }: Pick<AnalyticalTableProps<Inventory>, "dir" | "tableRef">) {
  const [feedback, setFeedback] = React.useState("")
  return <div className="grid w-full max-w-xl gap-2" id={`analytical-table-column-demo-${dir ?? "ltr"}`}>
    <button type="button">Before grid</button>
    <AnalyticalTable data={inventory} columns={columns} aria-label="Inventory" dir={dir} tableRef={tableRef}
      visibleRows={4} minRows={3} alternateRowColor enableColumnFreeze
      onColumnResize={({ columnWidth }) => setFeedback(String(columnWidth))}
      onAutoResize={({ width }) => setFeedback(`Fitted ${width}`)}
      onColumnsReorder={({ columnsNewOrder }) => setFeedback(columnsNewOrder.map(column => column.id).join(","))} />
    <button type="button">After grid</button>
    <output aria-label="Last column action">{feedback}</output>
  </div>
}

export default defineDemo({
  category: "Data", title: "AnalyticalTable", order: 55,
  docs: [{
    name: "analytical-table",
    description: "A virtualized Fiori grid with resizable, reorderable, hideable and freezable columns.",
    props: [
      { name: "columnSizing / columnOrder / columnVisibility / columnPinning", type: "TanStack v9 state", description: "Each slice has a matching default and onChange prop. Pins use the logical start edge." },
      { name: "scaleWidthMode", type: "Default | Smart | Grow", description: "Allocate widths evenly, prioritize typical content, or fit the longest sampled values." },
      { name: "visibleRowCountMode", type: "Fixed | Auto | AutoWithEmptyRows | Interactive", description: "Set viewport height from rows, available space, or the pointer resizer." },
      { name: "tableOptions / tableRef", type: "Partial<TableOptions> / Ref<AnalyticalTableInstance>", description: "Add engine options, scroll to a row or column, focus a cell, or reset sizing." },
      { name: "classNames / components / texts / locale", type: "Experimental extension API", description: "Style owned parts, arrange the virtual body and localize grid text." },
    ],
  }],
  Demo: () => <div className="grid gap-6">
    <AnalyticalTableColumnDemo />
    <AnalyticalTableColumnDemo dir="rtl" />
    <section className="grid gap-2">
      <h3>Customise</h3>
      <p>Use <code>classNames</code> with the typed slot names or the <code>analytical-table-*</code> data attributes. Pinned and dragged columns expose <code>data-frozen</code> and <code>data-dragging</code>. ARIA names and descriptions target the inner grid.</p>
      <p>The experimental <code>components.Body</code> receives the virtual rows as children. Arrange those children in an inert layout. Use <code>useAnalyticalTable()</code> for the model, actions and protected row, header and cell getters. Render row and cell content within the supplied hosts. F2 moves focus into and out of a custom cell.</p>
      <p>Copy the Custom example into an app after installing <code>@petalo/analytical-table</code>. Import its parts and types from <code>components/ui/analytical-table</code>. Keep the replacement at the Body boundary when updating the registry item.</p>
      <h4>Custom</h4>
      <CustomAnalyticalTable />
    </section>
  </div>,
})
