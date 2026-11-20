// Shared inputs only. H1 removes this temporary comparison of two different grids.
const rows = [
  { product: "Alpine Tent", category: "Shelter", stock: "24" },
  { product: "Trail Stove", category: "Cooking", stock: "18" },
  { product: "Camp Lantern", category: "Lighting", stock: "32" },
  { product: "Summit Pack", category: "Packs", stock: "12" },
  { product: "Ridge Mat", category: "Sleeping", stock: "27" },
]

export const columns = [
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" },
] as const

export const smoke = {
  name: "wcr-smoke",
  reference: "wcr",
  // AnalyticalTable and DataTable draw different headers, borders and rows.
  // H0 exercises the comparison; H1 replaces the pilot with parity fixtures.
  tolerance: 0.15,
  cases: [
    { id: "wcr-smoke-table", props: { rows } },
    { id: "wcr-smoke-empty", props: { rows: [] as typeof rows } },
  ],
} as const satisfies { name: string; reference: "wcr"; tolerance: number; cases: { id: string; props: { rows: typeof rows } }[] }

// Common capture box accommodates each grid's natural height and keeps the
// actual table metrics independent. The visual runner still checks exact size.
export const frame = { width: "30rem", height: "18.5rem" }
