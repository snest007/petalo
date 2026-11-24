// Derived from WCR 2.28.2 AnalyticalTable/react-table sortTypes, filterTypes and
// plugin-hooks/useSortBy, useFilters and useGlobalFilter. SPDX-License-Identifier: Apache-2.0.
import { collatorIncludes } from "@/lib/fiori-locale"
import { parseNumber } from "@/lib/fiori-numbers"
import { copyInstancePropertiesWithoutMemos, type RowData } from "@tanstack/react-table"
import type { AnalyticalTableColumnDef, AnalyticalTableEngine, AnalyticalTableRowModel } from "@/components/ui/analytical-table"

export type AnalyticalTableSortType<T extends RowData> =
  "alphanumeric" | "datetime" | "basic" | "string" | "number" |
  ((a: AnalyticalTableRowModel<T>, b: AnalyticalTableRowModel<T>, columnId: string, desc: boolean) => number)

export const analyticalModelOptions = Symbol("analytical-table-model")

type FilterName = "text" | "exactText" | "exactTextCase" | "includes" | "includesAll" | "includesSome" |
  "includesValue" | "exact" | "equals" | "between"
export type AnalyticalTableFilter<T extends RowData> = FilterName |
  (((rows: AnalyticalTableRowModel<T>[], ids: string[], value: any) => AnalyticalTableRowModel<T>[]) &
  { autoRemove?: (value: any) => boolean })

function compareValues(a: unknown, b: unknown, locale: string, mode: "alphanumeric" | "datetime" | "basic" | "string" | "number") {
  if (a === b) return 0
  if (a == null || b == null) return a == null ? -1 : 1
  const comparable = (value: unknown) => {
    if (value instanceof Date) return value.getTime()
    if (mode === "number" && typeof value === "string") {
      const parsed = parseNumber(value, locale)
      // WCR's number sort also supports display strings with a unit prefix or suffix.
      return Number.isNaN(parsed) ? Number(value.replace(/[^0-9.]/g, "")) : parsed
    }
    return typeof value === "number" ? value : String(value)
  }
  const left = comparable(a), right = comparable(b)
  if (typeof left === "number" && typeof right === "number") return left > right ? 1 : left < right ? -1 : 0
  return new Intl.Collator(locale, { sensitivity: "variant", numeric: mode === "alphanumeric", caseFirst: "upper" }).compare(String(left), String(right))
}

export function removeAnalyticalFilter<T extends RowData>(filter: AnalyticalTableFilter<T> | undefined, value: unknown) {
  if (value === undefined) return true
  if (typeof filter === "function") return filter.autoRemove?.(value) ?? false
  if (filter === "exact") return false
  if (filter === "equals") return value == null
  if (filter === "between") return !Array.isArray(value) || !value.some(bound => typeof bound === "number")
  if (filter === "includesAll" || filter === "includesSome" || filter === "includesValue" || filter === "includes") {
    return !value || (typeof value === "string" || Array.isArray(value)) && value.length === 0
  }
  return !value
}

function testValue(value: unknown, query: unknown, locale: string, filter: FilterName) {
  switch (filter) {
    case "text": return collatorIncludes(String(value), String(query), locale)
    case "exactText": return value === undefined || new Intl.Collator(locale, { sensitivity: "base" }).compare(String(value), String(query)) === 0
    case "exactTextCase": return value === undefined || String(value) === String(query)
    case "includes": return Array.isArray(value) ? value.includes(query) : typeof value === "string" && collatorIncludes(value, String(query), locale)
    case "includesAll":
    case "includesSome": {
      // WCR filterTypes.includesAll/includesSome call includes on both arrays and strings.
      if (!Array.isArray(query) || !(typeof value === "string" || Array.isArray(value)) || !value.length) return false
      const includes = (item: unknown) => Array.isArray(value)
        ? value.includes(item)
        : collatorIncludes(value, String(item), locale)
      return filter === "includesAll" ? query.every(includes) : query.some(includes)
    }
    case "includesValue": return Array.isArray(query) && query.includes(value)
    case "exact": return value === query
    case "equals": return value == query // WCR filterTypes.equals admits coercive equality.
    case "between": {
      if (!Array.isArray(query)) return true
      const [a, b] = query
      const min = typeof a === "number" ? a : -Infinity
      const max = typeof b === "number" ? b : Infinity
      // WCR filterTypes.between coerces numeric strings in its inclusive comparison.
      let number = value
      if (typeof value === "string" && value.trim()) {
        const localized = parseNumber(value, locale)
        number = Number.isNaN(localized) ? Number(value) : localized
      }
      return typeof number === "number" && number >= Math.min(min, max) && number <= Math.max(min, max)
    }
  }
}

type FilteredModel<T extends RowData> = ReturnType<AnalyticalTableEngine<T>["getPreFilteredRowModel"]>

function filteredModel<T extends RowData>(model: FilteredModel<T>, rows: AnalyticalTableRowModel<T>[]): FilteredModel<T> {
  if (model.rows === rows) return model
  return { rows, flatRows: rows, rowsById: Object.fromEntries(rows.map(row => [row.id, row])) }
}

export function createAnalyticalFilterModel<T extends RowData>(table: AnalyticalTableEngine<T>) {
  let previous: readonly unknown[] | undefined
  let result: ReturnType<typeof table.getPreFilteredRowModel>
  return () => {
    const source = table.getPreFilteredRowModel()
    const filters = table.atoms.columnFilters.get()
    const global = table.atoms.globalFilter.get()
    const columns = table.getAllLeafColumns()
    const { locale, disableGlobalFilter } = (table.options.meta as Record<typeof analyticalModelOptions, { locale: string; disableGlobalFilter: boolean }>)[analyticalModelOptions]
    const dependencies = [source, filters, global, columns, locale, disableGlobalFilter, table.options.globalFilterFn]
    if (previous && dependencies.every((value, i) => Object.is(value, previous![i]))) return result
    previous = dependencies
    let rows = source.rows
    // useFilters applies each filter to the result of the previous one. A WCR-style
    // custom filter receives that entire set and may compare different rows.
    for (const { id, value } of filters ?? []) {
      const column = columns.find(column => column.id === id)
      if (!column) continue
      const def = column.columnDef as AnalyticalTableColumnDef<T>
      const filter = def.filter ?? def.filterType
      if (removeAnalyticalFilter(filter, value)) continue
      if (typeof filter === "function") rows = filter(rows, [id], value)
      else if (def.filterFn && def.filterFn !== "auto") {
        const match = column.getFilterFn()
        if (match) rows = rows.filter(row => match(row, id, value))
      } else rows = rows.filter(row => testValue(row.getValue(id), value, locale, filter ?? "text"))
    }
    if (!disableGlobalFilter && global != null && global !== "") {
      // useGlobalFilter checks all eligible fields, including hidden ones.
      const ids = columns.filter(column => column.accessorFn && column.columnDef.enableGlobalFilter !== false).map(column => column.id)
      const filterFn = table.options.globalFilterFn
      const match = filterFn && filterFn !== "auto" ? table.getGlobalFilterFn() : undefined
      rows = rows.filter(row => ids.some(id => match ? match(row, id, global) : testValue(row.getValue(id), global, locale, "text")))
    }
    result = filteredModel(source, rows)
    return result
  }
}

export function createAnalyticalSortModel<T extends RowData>(table: AnalyticalTableEngine<T>) {
  let previous: readonly unknown[] | undefined
  let result: ReturnType<typeof table.getPreSortedRowModel>
  return () => {
    const source = table.getPreSortedRowModel()
    const sorting = table.atoms.sorting.get()
    const columns = table.getAllLeafColumns()
    const { locale } = (table.options.meta as Record<typeof analyticalModelOptions, { locale: string }>)[analyticalModelOptions]
    const dependencies = [source, sorting, columns, locale]
    if (previous && dependencies.every((value, i) => Object.is(value, previous![i]))) return result
    previous = dependencies
    const rules = (sorting ?? []).flatMap(({ id, desc }) => {
      const column = columns.find(column => column.id === id)
      if (!column) return []
      const def = column.columnDef as AnalyticalTableColumnDef<T>
      const type = def.sortType ?? "alphanumeric"
      const sortFn = def.sortFn && def.sortFn !== "auto" ? column.getSortFn() : undefined
      const compare = (a: AnalyticalTableRowModel<T>, b: AnalyticalTableRowModel<T>) => typeof type === "function" ? type(a, b, id, desc) :
        sortFn ? sortFn(a, b, id) : compareValues(a.getValue(id), b.getValue(id), locale, type)
      return [{ compare, direction: desc !== Boolean(def.sortInverted ?? def.invertSorting) ? -1 : 1 }]
    })
    if (!rules.length) return result = source
    // WCR useSortBy.defaultOrderByFn uses the original indices as the final
    // tie-breaker, in the effective direction of the primary comparator.
    const compareRows = (a: AnalyticalTableRowModel<T>, b: AnalyticalTableRowModel<T>) => {
      for (const { compare, direction } of rules) {
        const difference = compare(a, b)
        if (difference) return difference * direction
      }
      return (a.index - b.index) * rules[0].direction
    }
    const flatRows: AnalyticalTableRowModel<T>[] = []
    function sortRows(rows: AnalyticalTableRowModel<T>[]): AnalyticalTableRowModel<T>[] {
      return [...rows].sort(compareRows).map(row => {
        const index = flatRows.push(row) - 1
        if (!row.subRows.length) return row
        // WCR useSortBy also sorts descendants. Clone the row before replacing
        // its children so clearing the sort recovers the original group order.
        const sorted = copyInstancePropertiesWithoutMemos(Object.create(Object.getPrototypeOf(row)), row) as typeof row
        sorted.subRows = sortRows(row.subRows)
        flatRows[index] = sorted
        return sorted
      })
    }
    const rows = sortRows(source.rows)
    result = { ...source, rows, flatRows }
    return result
  }
}
