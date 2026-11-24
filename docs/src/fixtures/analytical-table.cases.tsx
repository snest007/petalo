import * as React from "react"

// Neutral inputs shared by petalo and WCR. The oracle imports no registry implementation.
export const inventory = [
  { product: "Alpine Tent", category: "Shelter", stock: "24" },
  { product: "Trail Stove", category: "Cooking", stock: "18" },
  { product: "Camp Lantern", category: "Lighting", stock: "32" },
  { product: "Summit Pack", category: "Packs", stock: "12" },
  { product: "Ridge Mat", category: "Sleeping", stock: "27" },
]
export type Inventory = {
  product: string; category: string; stock: string | number; reserve?: number
  subRows?: Inventory[]
  blocked?: boolean
  highlight?: "None" | "Positive" | "Negative" | "Critical" | "Information"
}
export const treeInventory: Inventory[] = [
  { product: "Camping", category: "Outdoors", stock: 40, subRows: [
    { product: "Shelter", category: "Outdoors", stock: 24, subRows: [
      { product: "Alpine Tent", category: "Outdoors", stock: 24 },
    ] },
    { product: "Trail Stove", category: "Cooking", stock: 16 },
  ] },
  { product: "Camp Lantern", category: "Lighting", stock: 12 },
]
export const highlightedInventory = inventory.map((row,index) => ({
  ...row,
  highlight: (["None","Positive","Negative","Critical","Information"] as const)[index],
}))
export const detailStyle = { padding: ".375rem .5rem", whiteSpace: "nowrap" as const }
export function inventoryDetail(product: string) {
  return <div style={detailStyle}><button type="button" style={{ padding: 0, border: 0, background: "transparent", color: "inherit", font: "inherit" }}>Inspect {product}</button></div>
}
export const groupInventory: Inventory[] = [
  { product: "Alpine Tent", category: "Shelter", stock: 1299.5, reserve: 24.25 },
  { product: "Ridge Mat", category: "Shelter", stock: 260.75, reserve: 19.25 },
  { product: "Trail Stove", category: "Cooking", stock: 54.75, reserve: 30.5 },
  { product: "Trail Kettle", category: "Cooking", stock: 13.25, reserve: 8 },
]
export const inventoryColumns = [
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" },
] as const

export const virtualInventory: Inventory[] = Array.from({ length: 10_000 }, (_, index) => ({
  product: `Product ${index + 1}`, category: inventory[index % inventory.length].category, stock: String(index + 1),
}))

export function inventoryEditor(product: string, ref?: React.Ref<HTMLInputElement>) {
  return <input ref={ref} aria-label="Product name" defaultValue={product}
    style={{ font: "inherit", minWidth: 0, width: "8rem", padding: ".125rem .25rem", color: "var(--sapField_TextColor)",
      background: "var(--sapField_Background)", border: "1px solid var(--sapField_BorderColor)" }} />
}

type FixtureScroll = {
  scrollToItem(index: number, align: "start"): void
  horizontalScrollTo(offset: number, align: "start"): void
}
export function InventoryFixtureViewport({ instance, scroll, edit, children }: {
  instance: React.RefObject<FixtureScroll | null>
  scroll?: "vertical" | "horizontal"
  edit?: boolean
  children: React.ReactNode
}) {
  const frame = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (!scroll && !edit) return
    const node = frame.current
    if (!node) return
    let frameId: number
    let finished = false
    const ready = () => {
      if (finished) return true
      if (scroll === "vertical" && instance.current && node.querySelector('[aria-rowindex="2"]')) {
        finished = true
        instance.current.scrollToItem(5_000, "start")
      } else if (scroll === "horizontal" && instance.current && node.querySelector('[aria-rowindex="2"]')) {
        finished = true
        instance.current.horizontalScrollTo(60, "start")
      } else if (edit) {
        const target = node.querySelector<HTMLElement>('[role="gridcell"]:has(input)')
        if (target) {
          finished = true
          target.focus({ preventScroll: true })
          target.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", code: "F2", bubbles: true, cancelable: true }))
        }
      }
      return finished
    }
    // A forwarded WCR ref can exist before its lazy body has mounted. Wait
    // for the first rendered row, then use the component's actual controller.
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => { if (ready()) observer.disconnect() })
    })
    if (!ready()) observer.observe(node, { childList: true, subtree: true })
    return () => { observer.disconnect(); cancelAnimationFrame(frameId) }
  }, [instance, scroll, edit])
  return <div ref={frame} style={{ width: 480 }}>{children}</div>
}

type Case = {
  data?: Inventory[]
  scaleWidthMode?: "Default" | "Smart" | "Grow"
  widths?: number[]
  frozen?: boolean
  hidden?: string[]
  longHeader?: boolean
  alternate?: boolean
  loading?: boolean
  filtered?: boolean
  rtl?: boolean
  german?: boolean
  neutral?: boolean
  countMode?: "Fixed" | "Auto" | "AutoWithEmptyRows" | "Interactive"
  height?: number
  emptyCell?: boolean
  sortable?: boolean
  filterable?: boolean
  sorting?: { id: string; desc: boolean }[]
  columnFilters?: { id: string; value: string }[]
  openHeaderMenu?: boolean
  groupable?: boolean
  groupBy?: string[]
  expanded?: Record<string, boolean>
  aggregates?: boolean
  tree?: boolean
  selectionMode?: "None" | "Single" | "Multiple"
  selectionBehavior?: "Row" | "RowOnly" | "RowSelector"
  selected?: Record<string, boolean>
  indeterminate?: boolean
  disableSelection?: boolean
  detail?: "Expandable" | "Visible" | "IncludeHeight" | "IncludeHeightExpandable"
  highlight?: boolean
  navigation?: boolean
  scroll?: "vertical" | "horizontal"
  popIn?: "Block" | "Inline" | "WithoutHeader"
  edit?: boolean
  infinite?: boolean
}

const cases: [string, Case][] = [
  ["default", {}], ["alternate", { alternate: true }],
  ["scale-default", { scaleWidthMode: "Default", widths: [120] }],
  ["scale-smart", { scaleWidthMode: "Smart", data: [{ ...inventory[0], product: "Alpine Expedition Tent with extended vestibule" }, ...inventory.slice(1)] }],
  ["scale-grow", { scaleWidthMode: "Grow", data: [{ ...inventory[0], product: "Alpine Expedition Tent with extended vestibule" }, ...inventory.slice(1)] }],
  ["frozen", { frozen: true, widths: [140, 180, 220] }],
  ["hidden", { hidden: ["category"] }], ["resized", { widths: [212] }],
  ["long-header", { longHeader: true, widths: [95] }],
  ["fixed", { data: inventory.slice(0, 2), countMode: "Fixed" }],
  ["auto-empty-rows", { data: inventory.slice(0, 2), countMode: "AutoWithEmptyRows", height: 205 }],
  ["interactive", { countMode: "Interactive" }],
  // WCR TablePlaceholder needs concrete widths before the grid has measured its columns.
  ["loading", { data: [], loading: true, widths: [160, 160, 160] }],
  ["empty", { data: [] }],
  ["filtered", { filtered: true }],
  ["rtl", { rtl: true, frozen: true, widths: [140, 180, 220] }],
  ["de", { german: true, data: [] }],
  ["neutral-extension", { neutral: true }],
  ["sorted-asc", { sortable: true, sorting: [{ id: "product", desc: false }] }],
  ["sorted-desc", { sortable: true, sorting: [{ id: "product", desc: true }] }],
  ["multi-sorted", { sortable: true, sorting: [{ id: "category", desc: false }, { id: "stock", desc: true }],
    data: [{ ...inventory[0], category: "Lighting" }, ...inventory.slice(1)] }],
  ["column-filter", { filterable: true, columnFilters: [{ id: "product", value: "tent" }] }],
  ["column-filter-empty", { filterable: true, columnFilters: [{ id: "product", value: "missing" }] }],
  ["sort-filter-rtl", { rtl: true, sortable: true, filterable: true, sorting: [{ id: "product", desc: true }],
    columnFilters: [{ id: "product", value: "a" }] }],
  ["sort-filter-open", { sortable: true, filterable: true, openHeaderMenu: true }],
  ["group-collapsed", { groupable: true, groupBy: ["category"], data: groupInventory }],
  ["group-expanded", { groupable: true, groupBy: ["category"], expanded: { "category:Shelter": true }, data: groupInventory }],
  ["group-nested", { groupable: true, groupBy: ["category", "product"], expanded: { "category:Shelter": true, "category:Shelter>product:Tent": true },
    // WCR's Grouped Cell reference uses a raw row ID as an IDREF.
    data: groupInventory.map(row => ({ ...row, product: row.product.split(" ").at(-1)! })) }],
  ["group-de-aggregates", { groupable: true, groupBy: ["category"], aggregates: true, german: true, data: groupInventory }],
  ["group-menu-open", { groupable: true, openHeaderMenu: true }],
  ["tree-collapsed", { tree: true, data: treeInventory }],
  ["tree-expanded", { tree: true, data: treeInventory, expanded: { 0: true, "0.0": true } }],
  ...(["None", "Single", "Multiple"] as const).flatMap(selectionMode =>
    (["Row", "RowOnly", "RowSelector"] as const).map(selectionBehavior =>
      [`select-${selectionMode.toLowerCase()}-${selectionBehavior.toLowerCase()}`, {
        selectionMode, selectionBehavior, selected: selectionMode === "None" ? undefined : { "1": true },
      }] satisfies [string, Case])),
  ["select-tree-partial", { tree: true, data: treeInventory, expanded: { 0: true, "0.0": true },
    selectionMode: "Multiple", selected: { "0.1": true }, indeterminate: true }],
  ["select-disabled", { selectionMode: "Multiple", selectionBehavior: "RowSelector", selected: { "1": true },
    disableSelection: true, data: inventory.map((row, index) => ({ ...row, blocked: index === 0 })) }],
  ["details-expanded", { detail: "Expandable", expanded: { "0": true } }],
  ["details-visible", { detail: "Visible" }],
  ["details-included-height", { detail: "IncludeHeight", data: inventory.slice(0, 3) }],
  ["details-included-expandable", { detail: "IncludeHeightExpandable", expanded: { "0": true } }],
  ["row-highlight", { highlight: true, data: highlightedInventory }],
  ["row-navigation", { navigation: true }],
  ["virtual-middle", { scroll: "vertical", data: virtualInventory, widths: [160, 160, 160] }],
  ["virtual-frozen-horizontal", { scroll: "horizontal", frozen: true, widths: [140, 180, 220] }],
  ["pop-in-block", { popIn: "Block", widths: [310, 150, 170] }],
  ["pop-in-inline", { popIn: "Inline", widths: [310, 150, 170] }],
  ["pop-in-without-header", { popIn: "WithoutHeader", widths: [310, 150, 170] }],
  ["edit", { edit: true }],
  ["infinite-busy", { infinite: true, loading: true, data: virtualInventory.slice(0, 15), widths: [160, 160, 160] }],
  ["empty-cell", { emptyCell: true, data: [{ ...inventory[0], category: "" }, ...inventory.slice(1)] }],
]
export const fixtureInputs = {
  name: "analytical-table", reference: "wcr" as const,
  cases: cases.map(([name, props]) => ({ id: `analytical-table-${name}`, props })),
}

export const headersFor = (longHeader?: boolean, aggregates?: boolean) =>
  (aggregates ? [...inventoryColumns, { key: "reserve" as const, label: "Reserve" }] : inventoryColumns).map(({ key, label }, index) => ({
  key, label: index === 0 && longHeader ? "Product identification and description" : label,
}))
