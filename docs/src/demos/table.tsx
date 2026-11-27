import * as React from "react"
import type { FioriMoveDetail } from "@/lib/fiori-drag-and-drop"

import { DataTable, createDataTableColumnHelper } from "@/components/ui/data-table"
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
import { Button } from "@/components/ui/button"
import { deleteIcon, edit } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

type Product = { id: string; name: string; supplier: string; price: number; status: TableRowHighlight }
const SUPPLIERS = ["Very Best Screens", "Smartcards", "Technocom", "Red Point Stores"]
const STATUS: TableRowHighlight[] = ["none", "positive", "critical", "negative", "information"]
const makeProducts = (from: number, count: number): Product[] =>
  Array.from({ length: count }, (_, k) => {
    const i = from + k
    return {
      id: `P${String(i + 1).padStart(4, "0")}`,
      name: `Product ${i + 1}`,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      price: Math.round(((i * 37) % 1000) * 100 + 999) / 100,
      status: STATUS[i % STATUS.length],
    }
  })
const fmt = (n: number) => `${n.toFixed(2)} EUR`

function SelectionTable() {
  const [mode, setMode] = React.useState<"multi" | "single">("multi")
  const [selected, setSelected] = React.useState<string[]>(["P0002"])
  const [rows, setRows] = React.useState(() => makeProducts(0, 6))
  const [log, setLog] = React.useState("")
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Button id="table-mode-multi" aria-pressed={mode === "multi"} onClick={() => setMode("multi")}>Multi</Button>
        <Button id="table-mode-single" aria-pressed={mode === "single"} onClick={() => { setMode("single"); setSelected((s) => s.slice(0, 1)) }}>Single</Button>
      </div>
      <Table
        id="table-products"
        aria-label="Products"
        selectionMode={mode}
        selectedRows={selected}
        onSelectionChange={setSelected}
        rowActionCount={2}
        growing="button"
        onLoadMore={() => setRows((r) => [...r, ...makeProducts(r.length, 3)])}
        onRowClick={(key) => setLog(`Row: ${key}`)}
        className="max-h-96 overflow-auto"
      >
        <TableHeaderRow sticky>
          <TableHeaderCell importance={2}>Product</TableHeaderCell>
          <TableHeaderCell>Supplier</TableHeaderCell>
          <TableHeaderCell horizontalAlign="End" width="10rem">Price</TableHeaderCell>
        </TableHeaderRow>
        {rows.map((p, i) => (
          <TableRow
            key={p.id}
            rowKey={p.id}
            interactive
            navigated={i === 2}
            highlight={p.status}
            actions={
              <>
                <TableRowAction icon={edit} text="Edit" onClick={() => setLog(`Edit: ${p.id}`)} />
                <TableRowAction icon={deleteIcon} text="Delete" onClick={() => setLog(`Delete: ${p.id}`)} />
              </>
            }
          >
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.supplier}</TableCell>
            <TableCell>{fmt(p.price)}</TableCell>
          </TableRow>
        ))}
      </Table>
      <p className="text-(--sapContent_LabelColor)">
        Selected: <b id="table-selected">{selected.join(", ") || "none"}</b> · <span id="table-log">{log}</span>
      </p>
    </div>
  )
}

function PopinTable() {
  return (
    <div className="resize-x overflow-hidden" style={{ width: "22rem" }}>
      <Table id="table-popin" aria-label="Popin products" overflowMode="popin" alternateRowColors rowActionCount={1}>
        <TableHeaderRow>
          <TableHeaderCell importance={3} minWidth="8rem">Product</TableHeaderCell>
          <TableHeaderCell importance={1} minWidth="9rem">Supplier</TableHeaderCell>
          <TableHeaderCell importance={2} minWidth="7rem" horizontalAlign="End">Price</TableHeaderCell>
        </TableHeaderRow>
        <TableGroupRow>Screens</TableGroupRow>
        {makeProducts(0, 3).map((p) => (
          <TableRow key={p.id} rowKey={p.id} actions={<TableRowActionNavigation />}>
            <TableCell>{p.name}</TableCell>
            <TableCell>
              <input aria-label={`Supplier of ${p.name}`} defaultValue={p.supplier} className="w-full border border-(--sapField_BorderColor) px-1" />
            </TableCell>
            <TableCell>{fmt(p.price)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}

const col = createDataTableColumnHelper<Product>()
const columns = col.columns([
  col.accessor("id", { header: "ID", meta: { width: "7rem" } }),
  col.accessor("name", { header: "Product" }),
  col.accessor("supplier", { header: "Supplier" }),
  col.accessor("price", { header: "Price", cell: (c) => fmt(c.getValue()), meta: { horizontalAlign: "End" } }),
])
const bigData = makeProducts(0, 10_000)
const smallData = makeProducts(0, 5)

function DataTables() {
  const [sel, setSel] = React.useState<string[]>([])
  return (
    <div className="grid gap-6">
      <DataTable
        id="table-data-menu"
        aria-label="Sortable products"
        data={smallData}
        columns={columns}
        getRowId={(r) => r.id}
        selectionMode="multi"
        selectedRows={sel}
        onSelectionChange={setSel}
      />
      <DataTable
        id="table-data-click"
        aria-label="Click-sortable products"
        data={smallData}
        columns={columns}
        getRowId={(r) => r.id}
        sortTrigger="click"
      />
      <DataTable
        id="table-data-virtual"
        aria-label="10000 products"
        data={bigData}
        columns={columns}
        getRowId={(r) => r.id}
        virtualize
        rowHeight={45}
        virtualHeight="20rem"
        selectionMode="single"
      />
    </div>
  )
}

function MovableTables() {
  const [rows, setRows] = React.useState(() => makeProducts(0, 4))
  const [data, setData] = React.useState(() => makeProducts(0, 100))
  const [allow, setAllow] = React.useState(true)
  const [reorder, setReorder] = React.useState(true)
  const [log, setLog] = React.useState("")
  const [virtualLog, setVirtualLog] = React.useState("")
  const nativeEvent = React.useRef<Event | null>(null)
  const [nativeOver, setNativeOver] = React.useState(false)
  const move = (event: FioriMoveDetail, update: React.Dispatch<React.SetStateAction<Product[]>>, report: (value: string) => void) => {
    const source = event.source.element?.dataset.rowKey ?? event.source.element?.id
    const target = event.destination.element.dataset.rowKey
    const placement = event.destination.placement
    report(`${source} ${placement} ${target}`)
    if (!reorder || !source || !target || source === target || placement === "On") return
    update((current) => {
      const item = current.find((row) => row.id === source)
      if (!item) return current
      const next = current.filter((row) => row.id !== source)
      const index = next.findIndex((row) => row.id === target) + (placement === "After" ? 1 : 0)
      next.splice(index, 0, item)
      return next
    })
  }
  return <div className="grid gap-2">
    <p>Drag rows to reorder. Table modifier keys continue to move focus. Virtual drag targets are the rendered rows.</p>
    <div className="flex gap-2">
      <Button id="table-move-allow" aria-pressed={allow} onClick={() => setAllow(!allow)}>Accept drops</Button>
      <Button id="table-move-reorder" aria-pressed={reorder} onClick={() => setReorder(!reorder)}>Reorder data</Button>
    </div>
    <Table id="table-movable" aria-label="Movable products" onDragOver={(event) => { nativeEvent.current = event.nativeEvent }} onMoveOver={(event) => {
      setNativeOver(event.originalEvent === nativeEvent.current)
      if (allow && event.source.element && event.destination.placement !== "On") event.preventDefault()
    }} onMove={(event) => move(event, setRows, setLog)}>
      <TableHeaderRow><TableHeaderCell>Product</TableHeaderCell><TableHeaderCell>Supplier</TableHeaderCell></TableHeaderRow>
      {rows.map((row) => <TableRow key={row.id} rowKey={row.id} movable={row.id !== "P0004"}>
        <TableCell>{row.id === "P0004" ? <span id="table-movable-nested-source" draggable>{row.name}</span> : row.name}</TableCell><TableCell>{row.supplier}</TableCell>
      </TableRow>)}
    </Table>
    <span id="table-move-log" data-native-over={nativeOver}>{log}</span>
    <DataTable id="table-data-movable" aria-label="Virtual movable products" data={data} columns={columns} getRowId={(row) => row.id}
      rowMovable={(row) => row.id !== "P0001"} selectionMode="single" virtualize rowHeight={45} virtualHeight="12rem" overscan={0} sortTrigger="none"
      onMoveOver={(event) => { if (event.source.element && event.destination.placement !== "On") event.preventDefault() }}
      onMove={(event) => move(event, setData, setVirtualLog)} />
    <span id="table-data-move-log">{virtualLog}</span>
  </div>
}

function AIHeaderTable() {
  const [narrow, setNarrow] = React.useState(false)
  const [showSource, setShowSource] = React.useState(false)
  return (
    <section className="grid gap-2" aria-label="AI column header example">
      <div>
        <Button aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>Narrow table</Button>
      </div>
      <Table id="table-ai-action" aria-label="Supplier data" overflowMode="popin"
        style={{ width: narrow ? "10rem" : "22rem" }}>
        <TableHeaderRow>
          <TableHeaderCell minWidth="8rem" importance={2} sortIndicator="ascending">Product</TableHeaderCell>
          <TableHeaderCell minWidth="8rem" action={<TableHeaderCellActionAI onClick={() => setShowSource(true)} />}>Supplier</TableHeaderCell>
        </TableHeaderRow>
        <TableRow rowKey="notebook" interactive onClick={() => setShowSource(false)}>
          <TableCell>Notebook</TableCell>
          <TableCell>Best Screens</TableCell>
        </TableRow>
      </Table>
      {showSource && <p role="status">Supplier suggested from vendor records.</p>}
      <p>Customise the AI action with <code>className</code> or <code>classNames.icon</code>, and set <code>texts.generatedByAI</code> on the table to override its label.</p>
    </section>
  )
}

function TableDemo() {
  return (
    <div id="table-demo" className="grid gap-6">
      <SelectionTable />
      <PopinTable />
      <AIHeaderTable />
      <Table id="table-empty" aria-label="Empty" noDataText="No products found">
        <TableHeaderRow>
          <TableHeaderCell>Product</TableHeaderCell>
          <TableHeaderCell>Supplier</TableHeaderCell>
        </TableHeaderRow>
      </Table>
      <DataTables />
      <MovableTables />
    </div>
  )
}

export default defineDemo({
  category: "Data",
  docs: [
    {
      name: "table",
      description: "Fiori tables with row selection, popins, growing and caller-managed moves.",
      props: [
        { name: "Table.selectionMode", type: "none | single | multi", description: "Row selection model.", defaultValue: "none" },
        { name: "Table.selectedRows", type: "string[]", description: "Controlled selected row keys." },
        { name: "Table.onSelectionChange", type: "(selectedRows: string[]) => void", description: "Receive selected row keys." },
        { name: "Table.overflowMode", type: "scroll | popin", description: "Horizontal overflow behavior.", defaultValue: "scroll" },
        { name: "Table.growing", type: "button | scroll", description: "Offer explicit or scroll-triggered loading." },
        { name: "Table.onLoadMore", type: "() => void", description: "Request additional rows." },
        { name: "TableHeaderCellActionAI", type: "TableHeaderCell.action", description: "Identify an AI-generated column and open its source details from the header or a pop-in." },
      ],
    },
    {
      name: "data-table",
      description: "Data-driven tables with TanStack columns, sorting and optional virtualization.",
      fixtureSet: "table",
      props: [
        { name: "DataTable.data", type: "TData[]", description: "Rows to render." },
        { name: "DataTable.columns", type: "DataTableColumnDef<TData, any>[]", description: "TanStack column definitions." },
        { name: "DataTable.getRowId", type: "(row: TData, index: number) => string", description: "Stable key used for selection." },
        { name: "DataTable.sortTrigger", type: "menu | click | none", description: "How users sort a column.", defaultValue: "menu" },
        { name: "DataTable.onSortingChange", type: "(sorting: SortingState) => void", description: "Receive controlled sorting changes." },
        { name: "DataTable.virtualize", type: "boolean", description: "Render only visible rows; provide a fixed row height and viewport height.", defaultValue: "false" },
      ],
    },
  ],
 title: "Table", order: 200, Demo: TableDemo })
