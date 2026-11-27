import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs, useRef as useStoryRef } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Table, TableCell, TableGroupRow, TableHeaderCell, TableHeaderCellActionAI, TableHeaderRow, TableRow, TableRowAction, TableRowActionNavigation, type TableProps, type TableRowHighlight } from "@/components/ui/table"
import { Toolbar, ToolbarButton, ToolbarSpacer } from "@/components/ui/toolbar"
import { Icon } from "@/components/ui/icon"
import { Title } from "@/components/ui/title"
import { deleteIcon, edit } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { FioriDropIndicator } from "@/lib/fiori-drag-and-drop"
import { fioriMeta } from "../_lib/meta"

type Product = { id: string; name: string; supplier: string; price: number }
const products: Product[] = [
  { id: "p1", name: "Notebook Basic 15", supplier: "Very Best Screens", price: 956 },
  { id: "p2", name: "Notebook Basic 17", supplier: "Very Best Screens", price: 1249 },
  { id: "p3", name: "Ergo Screen E-I", supplier: "Smartcards", price: 230 },
  { id: "p4", name: "Flat Basic", supplier: "Technocom", price: 399 },
]

function PositionedDropIndicator({ placement }: { placement: "Before" | "After" | "On" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = React.useState<{ owner: HTMLElement; target: HTMLElement } | null>(null)
  React.useLayoutEffect(() => {
    const owner = ref.current?.querySelector<HTMLElement>('[data-slot="table"]')
    const target = owner?.querySelectorAll<HTMLElement>('[data-slot="table-row"]')[1]
    if (owner && target) setNodes({ owner, target })
  }, [])
  return <div className="relative" ref={ref}><Table aria-label="Product drop preview"><TableHeaderRow><TableHeaderCell>Product</TableHeaderCell></TableHeaderRow>{products.map((item) => <TableRow key={item.id} rowKey={item.id} movable><TableCell>{item.name}</TableCell></TableRow>)}</Table>{nodes && <FioriDropIndicator ownerReference={nodes.owner} targetReference={nodes.target} placement={placement} />}</div>
}

type Args = TableProps & { items: Product[]; interactiveRows?: boolean; withActions?: boolean; groupRows?: boolean; showHighlights?: boolean; movable?: boolean; stickyHeader?: boolean; sorted?: boolean; onAction?: (action: string, id: string) => void }
const base = fioriMeta({ name: "table", component: Table })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { items: products, selectionMode: "none", selectedRows: [], selectionBehavior: "rowSelector", headerSelector: "selectAll", overflowMode: "scroll", loading: false, loadingDelay: 0, alternateRowColors: false, interactiveRows: false, withActions: false, groupRows: false, showHighlights: false, movable: false, stickyHeader: false, sorted: false, "aria-label": "Products", onSelectionChange: fn(), onRowClick: fn(), onLoadMore: fn(), onMoveOver: fn(), onMove: fn(), onAction: fn() },
  argTypes: {
    ...base.argTypes,
    selectionMode: { control: "inline-radio", options: ["none", "single", "multi"] }, selectionBehavior: { control: "inline-radio", options: ["rowSelector", "rowOnly"] }, headerSelector: { control: "inline-radio", options: ["selectAll", "clearAll"] }, overflowMode: { control: "inline-radio", options: ["scroll", "popin"] },
    selectedRows: { control: "object" }, defaultSelectedRows: { control: false }, items: { control: "object" }, loading: { control: "boolean" }, loadingDelay: { control: "number" }, alternateRowColors: { control: "boolean" }, growing: { control: "select", options: [undefined, "button", "scroll"] }, growingText: { control: "text" }, growingSubtext: { control: "text" }, noDataText: { control: "text" },
    interactiveRows: { control: "boolean" }, withActions: { control: "boolean" }, groupRows: { control: "boolean" }, showHighlights: { control: "boolean" }, movable: { control: "boolean" }, stickyHeader: { control: "boolean" }, sorted: { control: "boolean" }, stickyTop: { control: "text" },
    rowActionCount: { control: false }, gridRef: { table: { disable: true } }, virtualRows: { control: false }, noData: { control: false }, texts: { control: false }, onSelectionChange: { control: false }, onRowClick: { control: false }, onLoadMore: { control: false }, onMoveOver: { control: false }, onMove: { control: false }, onAction: { control: false },
  },
  render: function ProductsTable(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    // useArgs and this render's state share Storybook's hook context.
    const lastProductNumber = useStoryRef(products.length)
    const { items, interactiveRows, withActions, groupRows, showHighlights, movable, stickyHeader, sorted, onAction, ...props } = args
    const highlights: TableRowHighlight[] = ["negative", "critical", "positive", "information"]
    const row = (product: Product, index: number) => <TableRow key={product.id} rowKey={product.id} interactive={interactiveRows} movable={movable} navigated={withActions && index === 1} highlight={showHighlights ? highlights[index % highlights.length] : undefined} actions={withActions ? <><TableRowAction icon={edit} text={`Edit ${product.name}`} onClick={() => onAction?.("Edit", product.id)} /><TableRowAction icon={deleteIcon} text={`Delete ${product.name}`} onClick={() => { onAction?.("Delete", product.id); updateArgs({ items: items.filter((item) => item.id !== product.id) }) }} /><TableRowActionNavigation interactive text={`Open ${product.name}`} onClick={() => onAction?.("Open", product.id)} /></> : undefined}>
      <TableCell>{product.name}</TableCell><TableCell>{product.supplier}</TableCell><TableCell>{new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(product.price)}</TableCell>
    </TableRow>
    return <Table {...props} rowActionCount={withActions ? 3 : 0} onSelectionChange={(selectedRows) => { args.onSelectionChange?.(selectedRows); updateArgs({ selectedRows }) }} onLoadMore={() => { args.onLoadMore?.()
      // Keep identifiers above every existing or previously issued product number.
      const next = Math.max(lastProductNumber.current, ...items.map((item) => Number(/^p(\d+)$/.exec(item.id)?.[1] ?? 0))) + 1
      lastProductNumber.current = next
      updateArgs({ items: [...items, { id: `p${next}`, name: `Notebook Pro ${next}`, supplier: "Red Point Stores", price: 560 + next }] }) }} onMoveOver={(event) => { args.onMoveOver?.(event); if (event.destination.placement !== "On") event.preventDefault() }} onMove={(event) => {
      args.onMove?.(event)
      const source = event.source.element?.dataset.rowKey
      const target = event.destination.element.dataset.rowKey
      if (!source || !target || source === target || event.destination.placement === "On") return
      const moving = items.find((item) => item.id === source)
      if (!moving) return
      const next = items.filter((item) => item.id !== source)
      next.splice(next.findIndex((item) => item.id === target) + (event.destination.placement === "After" ? 1 : 0), 0, moving)
      updateArgs({ items: next })
    }}>
      <TableHeaderRow sticky={stickyHeader}><TableHeaderCell importance={3} minWidth="8rem" sortIndicator={sorted ? "ascending" : "none"}>Product</TableHeaderCell><TableHeaderCell importance={1} minWidth="9rem">Supplier</TableHeaderCell><TableHeaderCell importance={2} minWidth="7rem" horizontalAlign="End" sortIndicator={sorted ? "descending" : "none"}>Price</TableHeaderCell></TableHeaderRow>
      {groupRows ? <><TableGroupRow>Very Best Screens</TableGroupRow>{items.filter((item) => item.supplier === "Very Best Screens").map(row)}<TableGroupRow>Other suppliers</TableGroupRow>{items.filter((item) => item.supplier !== "Very Best Screens").map(row)}</> : items.map(row)}
    </Table>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const NoSelection: Story = {}
export const SingleSelection: Story = { args: { selectionMode: "single", selectedRows: ["p2"] } }
export const MultiSelection: Story = { args: { selectionMode: "multi", selectedRows: ["p1", "p3"] } }
export const AllSelected: Story = { args: { selectionMode: "multi", selectedRows: products.map((item) => item.id) } }
export const RowOnlySelection: Story = { args: { selectionMode: "multi", selectionBehavior: "rowOnly", selectedRows: ["p2"] } }
export const ClearAllSelector: Story = { args: { selectionMode: "multi", headerSelector: "clearAll", selectedRows: ["p1", "p3"] } }
export const InteractiveRows: Story = { args: { interactiveRows: true } }
export const Sorted: Story = { args: { sorted: true } }
export const RowActions: Story = { args: { withActions: true } }
export const GroupRows: Story = { args: { groupRows: true } }
export const AlternateRows: Story = { args: { alternateRowColors: true } }
export const Empty: Story = { args: { items: [] } }
export const Loading: Story = { args: { loading: true, loadingDelay: 0 } }
export const PopinOverflow: Story = { args: { overflowMode: "popin", className: "max-w-xs" } }
export const ScrollOverflow: Story = { args: { overflowMode: "scroll", className: "max-w-xs" } }
export const GrowingButton: Story = { args: { growing: "button" } }
export const GrowingScroll: Story = { args: { growing: "scroll", className: "max-h-60 overflow-auto" } }
export const Highlights: Story = { args: { showHighlights: true } }
export const DropBefore: Story = { render: () => <PositionedDropIndicator placement="Before" /> }
export const DropAfter: Story = { render: () => <PositionedDropIndicator placement="After" /> }
export const DropOn: Story = { render: () => <PositionedDropIndicator placement="On" /> }
export const DragAndDrop: Story = { args: { movable: true } }
export const StickyHeader: Story = { args: { stickyHeader: true, className: "max-h-60 overflow-auto", items: [...products, ...products.map((item) => ({ ...item, id: `${item.id}-extra` }))] } }
export const CustomTexts: Story = { args: { selectionMode: "multi", growing: "button", texts: { more: "Load more products", moreDescription: "Load the next products", selectAll: "Select all products", deselectAll: "Clear selected products", rowSelector: "Product selection", navigation: "Product details" } } }
export const RTL: Story = { globals: { dir: "rtl" }, args: { withActions: true, selectionMode: "multi" } }

export const AIColumnHeader: Story = {
  render: function AIColumnHeaderStory({ overflowMode }) {
    const [showSource, setShowSource] = React.useState(false)
    return <>
      <Table aria-label="Supplier data" overflowMode={overflowMode} style={{ width: overflowMode === "popin" ? "10rem" : "22rem" }}>
        <TableHeaderRow>
          <TableHeaderCell minWidth="8rem" importance={2} sortIndicator="ascending">Product</TableHeaderCell>
          <TableHeaderCell minWidth="8rem" action={<TableHeaderCellActionAI classNames={{ icon: "supplier-source-icon" }} onClick={() => setShowSource(true)} />}>Supplier</TableHeaderCell>
        </TableHeaderRow>
        <TableRow rowKey="notebook"><TableCell>Notebook</TableCell><TableCell>Best Screens</TableCell></TableRow>
      </Table>
      {showSource && <p role="status">Supplier suggested from vendor records.</p>}
    </>
  },
}
export const AIColumnPopin: Story = { ...AIColumnHeader, args: { overflowMode: "popin" } }

export const WithToolbar: Story = { render: function TableWithToolbar() {
  const [selected, setSelected] = React.useState<string[]>([])
  const [rows, setRows] = React.useState(products)
  return <div className="grid gap-2"><Toolbar aria-label="Product actions"><Title level="H2" size="H5">Products</Title><ToolbarSpacer /><ToolbarButton disabled={!selected.length} onClick={() => { setRows(rows.filter((item) => !selected.includes(item.id))); setSelected([]) }}><Icon icon={deleteIcon} />Delete selected</ToolbarButton></Toolbar><Table aria-label="Products" selectionMode="multi" selectedRows={selected} onSelectionChange={setSelected}><TableHeaderRow><TableHeaderCell>Product</TableHeaderCell><TableHeaderCell>Supplier</TableHeaderCell></TableHeaderRow>{rows.map((item) => <TableRow key={item.id} rowKey={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.supplier}</TableCell></TableRow>)}</Table></div>
} }

// Current defaults are read from registry/ui/table.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "texts.noData",
    "text": "No Data",
    "key": "TABLE_NO_DATA"
  },
  {
    "prop": "texts.more",
    "text": "More",
    "key": "TABLE_MORE"
  },
  {
    "prop": "texts.moreDescription",
    "text": "To load more rows, press Enter or Space",
    "key": "TABLE_MORE_DESCRIPTION"
  },
  {
    "prop": "texts.selection",
    "text": "Selection",
    "key": "TABLE_SELECTION"
  },
  {
    "prop": "texts.rowSelector",
    "text": "Row Selector",
    "key": "TABLE_ROW_SELECTOR"
  },
  {
    "prop": "texts.selectAll",
    "text": "Select All Rows",
    "key": "TABLE_SELECT_ALL_ROWS"
  },
  {
    "prop": "texts.deselectAll",
    "text": "Deselect All Rows",
    "key": "TABLE_DESELECT_ALL_ROWS"
  },
  {
    "prop": "texts.selectAllDescription",
    "text": "Select All Checkbox",
    "key": "TABLE_COLUMNHEADER_SELECTALL_DESCRIPTION"
  },
  {
    "prop": "texts.clearAllDescription",
    "text": "Clear All Button",
    "key": "TABLE_COLUMNHEADER_CLEARALL_DESCRIPTION"
  },
  {
    "prop": "texts.checked",
    "text": "Checked",
    "key": "CHECKBOX_CHECKED"
  },
  {
    "prop": "texts.notChecked",
    "text": "Not checked",
    "key": "CHECKBOX_NOT_CHECKED"
  },
  {
    "prop": "texts.disabled",
    "text": "Disabled",
    "key": "ACC_STATE_DISABLED"
  },
  {
    "prop": "texts.multiSelectable",
    "text": "Multi Selection Table",
    "key": "TABLE_MULTI_SELECTABLE"
  },
  {
    "prop": "texts.singleSelectable",
    "text": "Single Selection Table",
    "key": "TABLE_SINGLE_SELECTABLE"
  },
  {
    "prop": "texts.rowActions",
    "text": "Row Actions",
    "key": "TABLE_ROW_ACTIONS"
  },
  {
    "prop": "texts.rowPopin",
    "text": "Row Popin",
    "key": "TABLE_ROW_POPIN"
  },
  {
    "prop": "texts.columnHeaderRow",
    "text": "Column Header Row",
    "key": "TABLE_COLUMN_HEADER_ROW"
  },
  {
    "prop": "texts.groupRow",
    "text": "Group Row",
    "key": "TABLE_GROUP_ROW"
  },
  {
    "prop": "texts.moreActions",
    "text": "More Actions",
    "key": "TABLE_ROW_OVERFLOW_BUTTON"
  },
  {
    "prop": "texts.navigation",
    "text": "Navigation",
    "key": "TABLE_NAVIGATION"
  },
  {
    "prop": "texts.colon",
    "text": ":",
    "key": "LABEL_COLON"
  },
  {
    "prop": "texts.generatedByAI",
    "text": "Generated by AI",
    "key": "TABLE_GENERATED_BY_AI"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}

export const RTLLoading: Story = { ...Loading, globals: { dir: "rtl" } }
