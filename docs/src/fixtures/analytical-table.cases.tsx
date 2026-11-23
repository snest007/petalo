// Neutral inputs shared by petalo and WCR. The oracle imports no registry implementation.
export const inventory = [
  { product: "Alpine Tent", category: "Shelter", stock: "24" },
  { product: "Trail Stove", category: "Cooking", stock: "18" },
  { product: "Camp Lantern", category: "Lighting", stock: "32" },
  { product: "Summit Pack", category: "Packs", stock: "12" },
  { product: "Ridge Mat", category: "Sleeping", stock: "27" },
]
export type Inventory = typeof inventory[number]
export const inventoryColumns = [
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" },
] as const

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
  ["loading", { data: [], loading: true }],
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
  ["empty-cell", { emptyCell: true, data: [{ ...inventory[0], category: "" }, ...inventory.slice(1)] }],
]
export const fixtureInputs = {
  name: "analytical-table", reference: "wcr" as const,
  cases: cases.map(([name, props]) => ({ id: `analytical-table-${name}`, props })),
}

export const headersFor = (longHeader?: boolean) => inventoryColumns.map(({ key, label }, index) => ({
  key, label: index === 0 && longHeader ? "Product identification and description" : label,
}))
