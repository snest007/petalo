// Derived from WCR 2.28.2 AnalyticalTable/hooks/useRowSelect.js and
// pluginHooks/useIndeterminateRowSelection.js. SPDX-License-Identifier: Apache-2.0.
import type { RowData } from "@tanstack/react-table"
import type { AnalyticalTableRowModel } from "@/components/ui/analytical-table"

export type AnalyticalTableSelectedRows = Record<string, boolean>
export type AnalyticalTableSelectionMode = "None" | "Single" | "Multiple"
export type AnalyticalTableSelectionBehavior = "Row" | "RowOnly" | "RowSelector"
export type AnalyticalTableSubComponentsBehavior = "Expandable" | "Visible" | "IncludeHeight" | "IncludeHeightExpandable"

export function rowField(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((result, key) =>
    result !== null && typeof result === "object" ? (result as Record<string, unknown>)[key] : undefined, value)
}

export function selectRows<T extends RowData>(
  previous: AnalyticalTableSelectedRows,
  rows: readonly AnalyticalTableRowModel<T>[],
  checked: boolean,
  canSelect: (row: AnalyticalTableRowModel<T>) => boolean,
  descendants = false,
): AnalyticalTableSelectedRows {
  const selected = { ...previous }
  function visit(row: AnalyticalTableRowModel<T>) {
    if (canSelect(row)) {
      if (checked) Object.defineProperty(selected, row.id, { value: true, configurable: true, enumerable: true, writable: true })
      else delete selected[row.id]
    }
    if (descendants) row.subRows.forEach(visit)
  }
  rows.forEach(visit)
  return selected
}

export function rowChecked<T extends RowData>(
  row: AnalyticalTableRowModel<T>,
  selected: AnalyticalTableSelectedRows,
): boolean {
  return Object.hasOwn(selected, row.id) && selected[row.id]
}

// useIndeterminateRowSelection.getIndeterminate marks direct partial siblings
// and propagates their partial state through the ancestors in one traversal.
export function getIndeterminateRows<T extends RowData>(
  rows: readonly AnalyticalTableRowModel<T>[],
  selected: AnalyticalTableSelectedRows,
): ReadonlySet<string> {
  const result = new Set<string>()
  function visit(row: AnalyticalTableRowModel<T>): boolean {
    let selectedChildren = 0
    let partialDescendant = false
    for (const child of row.subRows) {
      if (rowChecked(child, selected)) selectedChildren++
      if (visit(child)) partialDescendant = true
    }
    const partial = partialDescendant || selectedChildren > 0 && selectedChildren < row.subRows.length
    if (partial) result.add(row.id)
    return partial
  }
  rows.forEach(visit)
  return result
}
