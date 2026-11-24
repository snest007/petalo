import * as React from "react"
import {
  AnalyticalTable, useAnalyticalTable, type AnalyticalTableBodyProps,
  type AnalyticalTableColumnDef, type AnalyticalTableInstance, type AnalyticalTableProps,
  type ColumnFiltersState, type ExpandedState, type GroupingState, type SortingState,
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
  columns[0], {
    ...columns[1],
    filterable: true,
    Grouped: ({ defaultContent }) => <strong>{defaultContent}</strong>,
    filter: (rows, [columnId], value) => rows.filter(row => row.getValue(columnId) === value),
    Filter: ({ value, setFilter, accessibleNameRef }) => (
      <select value={String(value ?? "")} aria-labelledby={accessibleNameRef}
        onChange={event => setFilter(event.target.value || undefined)}>
        <option value="">All categories</option>
        {["Shelter", "Cooking", "Lighting", "Packs"].map(category => <option key={category}>{category}</option>)}
      </select>
    ),
  }, {
    ...columns[2], sortable: true,
    sortType: (a, b) => a.original.stock % 10 - b.original.stock % 10 || a.original.stock - b.original.stock, meta: { className: "analytical-table-stock", headerClassName: "analytical-table-stock-header" },
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
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [filters, setFilters] = React.useState<ColumnFiltersState>([])
  const [groupBy, setGroupBy] = React.useState<GroupingState>([])
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
      <button type="button" onClick={() => setGroupBy(previous => previous.length ? [] : ["category"])}
        aria-pressed={groupBy.length > 0}>Group categories</button>
    </div>
    <FioriLocaleProvider locale="en-US" texts={{ "wcr:LIST_NO_DATA": "Inventory is empty" }}>
      <AnalyticalTable data={empty ? [] : inventory} columns={customColumns} aria-label="Custom inventory"
        tableRef={tableRef} tableOptions={{ getRowId: (_, index) => `product-${index}`, meta: { source: "inventory" } }}
        sorting={sorting} onSortingChange={setSorting} columnFilters={filters} onColumnFiltersChange={setFilters}
        groupBy={groupBy} onGroupByChange={setGroupBy}
        onSort={({ sortDirection }) => setFeedback(sortDirection)}
        onFilter={({ value }) => setFeedback(String(value ?? ""))}
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

const localizedInventory: Inventory[] = [
  { product: "Zebra", category: "Lighting", stock: 19 },
  { product: "Äland", category: "Lighting", stock: 40 },
  { product: "Berlin", category: "Lighting", stock: 14 },
  { product: "Alban", category: "Shelter", stock: 24 },
  { product: "Aland", category: "Shelter", stock: 24 },
]

export function AnalyticalTableSortFilterDemo({ dir }: Pick<AnalyticalTableProps<Inventory>, "dir">) {
  const [locale, setLocale] = React.useState("de-DE")
  const [query, setQuery] = React.useState("")
  const [disableGlobalFilter, setDisabled] = React.useState(false)
  const [feedback, setFeedback] = React.useState("")
  return <div id={`analytical-table-sort-filter-${dir ?? "ltr"}`} className="grid w-full max-w-xl gap-2">
    <div className="flex flex-wrap gap-3">
      <label>Locale <select value={locale} onChange={event => setLocale(event.target.value)}>
        <option value="de-DE">German</option><option value="sv-SE">Swedish</option>
      </select></label>
      <label>Search inventory <input value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label><input type="checkbox" checked={disableGlobalFilter} onChange={event => setDisabled(event.target.checked)} /> Disable search</label>
    </div>
    <AnalyticalTable data={localizedInventory} columns={columns} aria-label="Sort and filter inventory"
      locale={locale} dir={dir} enableMultiSort sortPriority={["product", "stock"]}
      sortable filterable globalFilter={query} onGlobalFilterChange={setQuery} disableGlobalFilter={disableGlobalFilter}
      visibleRows={5} minRows={3}
      onSort={({ sorting }) => setFeedback(sorting.map(({id, desc}) => `${id} ${desc ? "desc" : "asc"}`).join(", "))}
      onFilter={({ columnId, value }) => setFeedback(`${columnId} ${String(value ?? "")}`.trim())} />
    <output aria-label="Last sort or filter">{feedback}</output>
  </div>
}

const groupingData: Inventory[] = [
  { product: "Alpine Tent", category: "Shelter", stock: 1299.5 },
  { product: "Ridge Mat", category: "Shelter", stock: 260.75 },
  { product: "Trail Stove", category: "Cooking", stock: 54.75 },
  { product: "Trail Kettle", category: "Cooking", stock: 13.25 },
]
const groupingColumns: AnalyticalTableColumnDef<Inventory>[] = [
  columns[0],
  { ...columns[1],
    Grouped: ({ defaultContent }) => <strong data-group-title="">{defaultContent}</strong>,
    RepeatedValue: ({ value }) => <small data-repeated-category="">{String(value)}</small> },
  { ...columns[2], disableGroupBy: true, aggregateValue: (value) => Number(value) * 2,
    aggregate: (values) => values.reduce<number>((total, value) => total + Number(value), 0),
    Aggregated: ({ defaultContent }) => <strong data-aggregate="">{defaultContent}</strong> },
]

export function AnalyticalTableGroupingDemo({ dir, hostile = false }: Pick<AnalyticalTableProps<Inventory>, "dir"> & { hostile?: boolean }) {
  const [groupBy, setGroupBy] = React.useState<GroupingState>(["category"])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [query, setQuery] = React.useState("")
  const [data, setData] = React.useState(groupingData)
  const [feedback, setFeedback] = React.useState("")
  return <div id={`analytical-table-group-demo-${dir ?? "ltr"}`} className="grid w-full max-w-xl gap-2">
    <div className="flex flex-wrap gap-3">
      <label>Search grouped inventory <input value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button type="button" onClick={() => setData(previous => previous.map((row, index) => index === 0 ? { ...row, stock: row.stock + 10 } : row))}>Receive ten items</button>
    </div>
    <AnalyticalTable data={data} columns={groupingColumns} dir={dir} locale="de-DE" aria-label="Grouped inventory"
      groupable groupBy={groupBy} onGroupByChange={setGroupBy} expanded={expanded} onExpandedChange={setExpanded}
      globalFilter={query} minRows={3} visibleRows={6}
      onGroup={({ groupedColumns }) => setFeedback(groupedColumns.join(", "))}
      getRowProps={row => hostile && row.getIsGrouped() ? { role: "button", "aria-level": 9, "aria-expanded": false, id: "fake-group-row", tabIndex: 8 } : {}}
      getCellProps={cell => hostile && cell.getIsGrouped() ? { role: "button", "aria-expanded": false, id: "fake-group-cell", tabIndex: 9 } : {}} />
    <output aria-label="Grouped columns">{feedback}</output>
  </div>
}

export default defineDemo({
  category: "Data", title: "AnalyticalTable", order: 55,
  docs: [{
    name: "analytical-table",
    description: "A virtualized Fiori grid with resizable, reorderable, hideable and freezable columns, plus sorting, filtering, grouping and aggregation.",
    props: [
      { name: "columnSizing / columnOrder / columnVisibility / columnPinning", type: "TanStack v9 state", description: "Each slice has a matching default and onChange prop. Pins use the logical start edge." },
      { name: "sorting / columnFilters / globalFilter", type: "Controlled or uncontrolled state", description: "Use the matching defaults and change callbacks. The global query matches across eligible columns." },
      { name: "sortable / filterable / sortPriority", type: "boolean / boolean / string[]", description: "Offer header actions and order active multi-sort columns. Columns can opt in or out individually." },
      { name: "groupable / disableGroupBy", type: "boolean", description: "Offer Group and Ungroup in column header menus. A column can opt out with disableGroupBy." },
      { name: "groupBy / expanded", type: "GroupingState / ExpandedState", description: "Experimental controlled state with corresponding defaults and callbacks. Grouping uses ordered column IDs; expansion uses the model's generated row IDs." },
      { name: "scaleWidthMode", type: "Default | Smart | Grow", description: "Allocate widths evenly, prioritize typical content, or fit the longest sampled values." },
      { name: "visibleRowCountMode", type: "Fixed | Auto | AutoWithEmptyRows | Interactive", description: "Set viewport height from rows, available space, or the pointer resizer." },
      { name: "tableOptions / tableRef", type: "Partial<TableOptions> / Ref<AnalyticalTableInstance>", description: "Add engine options, scroll to a row or column, focus a cell, or reset sizing." },
      { name: "classNames / components / texts / locale", type: "Experimental extension API", description: "Style owned parts, arrange the virtual body and localize grid text." },
    ],
  }],
  Demo: () => <div className="grid gap-6">
    <AnalyticalTableColumnDemo />
    <AnalyticalTableColumnDemo dir="rtl" />
    <AnalyticalTableSortFilterDemo />
    <AnalyticalTableSortFilterDemo dir="rtl" />
    <AnalyticalTableGroupingDemo />
    <AnalyticalTableGroupingDemo dir="rtl" hostile />
    <section className="grid gap-2">
      <h3>Customise</h3>
      <p>Use <code>classNames</code> with the typed slot names or the <code>analytical-table-*</code> data attributes. Pinned and dragged columns expose <code>data-frozen</code> and <code>data-dragging</code>. ARIA names and descriptions target the inner grid.</p>
      <p>The experimental <code>components.Body</code> receives the virtual rows as children. Arrange those children in an inert layout. Use <code>useAnalyticalTable()</code> for the model, actions and protected row, header and cell getters. Render row and cell content within the supplied hosts. F2 moves focus into and out of a custom cell.</p>
      <p>Copy the Custom example into an app after installing <code>@petalo/analytical-table</code>. Import its parts and types from <code>components/ui/analytical-table</code>. Keep the replacement at the Body boundary when updating the registry item.</p>
      <p>The experimental column <code>Filter</code> slot receives the current value, a setter, the default editor and the label reference. The Custom example supplies a category selector and sorts stock by its final digit.</p>
      <p>Use the experimental column <code>Grouped</code>, <code>RepeatedValue</code> and <code>Aggregated</code> renderers to customize content inside the grid cells. The table owns the group disclosure, expanded states, level, names and keyboard handling. Add a built-in <code>aggregate</code> or a function. <code>aggregateValue</code> can transform leaf values before the outermost aggregate. The group example computes localized stock totals.</p>
      <h4>Custom</h4>
      <CustomAnalyticalTable />
    </section>
  </div>,
})
