// Derived from WCR 2.28.2 AnalyticalTable/hooks/useGroupBy.js and
// react-table/aggregations.js. SPDX-License-Identifier: Apache-2.0.
import { constructRow, type RowData } from "@tanstack/react-table"
import type { AnalyticalTableColumnDef, AnalyticalTableEngine, AnalyticalTableRowModel } from "@/components/ui/analytical-table"

type Aggregate = (leafValues: unknown[], groupedValues: unknown[]) => unknown

const sum = (values: unknown[]) => values.reduce<number>((total, value) => total + (typeof value === "number" ? value : 0), 0)

function extent(values: unknown[], compare: typeof Math.min) {
  let result = values[0] || 0
  for (const value of values) if (typeof value === "number") result = compare(result as number, value)
  return result
}

const aggregations = {
  sum: (_leaves, values) => sum(values),
  min: values => extent(values, Math.min),
  max: values => extent(values, Math.max),
  minMax: values => `${extent(values, Math.min)}..${extent(values, Math.max)}`,
  average: values => sum(values) / values.length,
  median: values => {
    if (!values.length) return null
    const ordered = [...values].sort((a, b) => Number(a) - Number(b))
    const middle = Math.floor(ordered.length / 2)
    return ordered.length % 2 ? ordered[middle] : ((ordered[middle - 1] as number) + (ordered[middle] as number)) / 2
  },
  unique: values => [...new Set(values)],
  uniqueCount: values => new Set(values).size,
  count: values => values.length,
} satisfies Record<string, Aggregate>

export type AnalyticalTableAggregate = keyof typeof aggregations | Aggregate

export function createAnalyticalGroupModel<T extends RowData>(table: AnalyticalTableEngine<T>) {
  let previous: readonly unknown[] | undefined
  let result: ReturnType<typeof table.getPreGroupedRowModel>
  return () => {
    const source = table.getPreGroupedRowModel()
    const grouping = table.atoms.grouping.get()
    const columns = table.getAllLeafColumns()
    const dependencies = [source, grouping, columns]
    if (previous && dependencies.every((value, index) => Object.is(value, previous![index]))) return result
    const groups = [...new Set(grouping)].filter(id => columns.some(column => column.id === id))
    if (!groups.length || !source.rows.length) {
      previous = dependencies
      return result = source
    }

    type GridRow = AnalyticalTableRowModel<T>
    const columnsById = new Map(columns.map(column => [column.id, column]))
    const flatRows: GridRow[] = []
    const rowsById: Record<string, GridRow> = Object.create(null)
    function register(row: GridRow) {
      flatRows.push(row)
      rowsById[row.id] = row
      return row
    }
    function groupRows(rows: GridRow[], depth = 0, parentId?: string): GridRow[] {
      const groupColumnId = groups[depth]
      if (!groupColumnId) return rows.map(row =>
        register(constructRow(table, row.id, row.original, row.index, depth, row.subRows, parentId)))

      // WCR groups on the string value. An own-key dictionary preserves its
      // integer key ordering while also accepting values like "__proto__".
      const buckets: Record<string, GridRow[]> = Object.create(null)
      for (const row of rows) {
        const value = String(row.getGroupingValue(groupColumnId))
        const bucket = buckets[value] ??= []
        bucket.push(row)
      }
      return Object.entries(buckets).map(([groupingValue, leaves], index) => {
        const key = `${encodeURIComponent(groupColumnId)}:${encodeURIComponent(groupingValue)}`
        let id = parentId ? `${parentId}>${key}` : key
        while (Object.hasOwn(source.rowsById, id) || Object.hasOwn(rowsById, id)) id += ">"
        const row = register(constructRow(table, id, leaves[0].original, index, depth, [], parentId))
        row.groupingColumnId = groupColumnId
        row.groupingValue = groupingValue
        row.subRows = groupRows(leaves, depth + 1, id)
        const values = new Map<string, unknown>()
        // useGroupBy.aggregateRowsToValues keeps pivot values and aggregates
        // deeper grouping columns only where the column requests an aggregate.
        row.getValue = <V>(columnId: string) => {
          if (!values.has(columnId)) {
            const column = columnsById.get(columnId)
            const definition = column?.columnDef as AnalyticalTableColumnDef<T> | undefined
            const groupDepth = groups.indexOf(columnId)
            const aggregate = definition?.aggregate
            if (groupDepth >= 0 && (groupDepth <= depth || !aggregate)) {
              values.set(columnId, leaves[0].getValue(columnId))
            } else if (column && aggregate) {
              const apply: Aggregate = typeof aggregate === "function" ? aggregate : aggregations[aggregate]
              const rawValues = leaves.map(leaf => leaf.getValue(columnId))
              const transform = depth === 0 ? definition?.aggregateValue : undefined
              const leafValues = transform ? rawValues.map((value, i) => transform(value, leaves[i], column)) : rawValues
              values.set(columnId, apply(leafValues, rawValues))
            } else {
              values.set(columnId, null)
            }
          }
          return values.get(columnId) as V
        }
        return row
      })
    }
    const rows = groupRows(source.rows)
    result = { rows, flatRows, rowsById }
    previous = dependencies
    return result
  }
}
