"use client"

// Derived from SAP UI5 Web Components for React 2.28.2, © SAP SE or an SAP affiliate
// company and UI5 contributors. SPDX-License-Identifier: Apache-2.0.
//
// Experimental extension contract for H1–H5:
// - tableOptions adds TanStack v9 features, row models and meta. tableRef exposes the
//   engine and imperative scroll/focus/reset actions. Grid semantics stay in this item.
// - Each public column state has controlled, default and change props.
// - Render functions receive the model, locale and default content. The owned parts
//   retain their role, identity, relationships, roving focus and event handlers.
// - useAnalyticalTable, the protected props getters, components keys, classNames and
//   data-slot names are public API. Replacement layouts arrange protected parts.
// - texts resolve from FioriLocaleProvider, with explicit overrides taking precedence.

import * as React from "react"
import {
  columnFilteringFeature, globalFilteringFeature, rowSortingFeature, columnGroupingFeature, rowExpandingFeature,
  columnOrderingFeature, columnPinningFeature, columnSizingFeature, columnVisibilityFeature,
  createExpandedRowModel, flexRender, tableFeatures, useTable,
  type Cell, type Column, type ColumnDef, type ColumnOrderState, type ColumnPinningState,
  type ColumnSizingState, type Header, type Row, type RowData, type TableOptions,
  type Updater, type ColumnVisibilityState, type SortingState, type ColumnFiltersState, type GroupingState, type ExpandedState,
} from "@tanstack/react-table"
import { defaultRangeExtractor, useVirtualizer, type ScrollToOptions } from "@tanstack/react-virtual"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { AnalyticalHeaderMenu } from "@/lib/analytical-table/header-menu"
import { createAnalyticalGroupModel, type AnalyticalTableAggregate } from "@/lib/analytical-table/grouping"
import { decline, filter as filterIcon, group2, navigationDownArrow, navigationRightArrow, pushpinOff, pushpinOn, sortAscending, sortDescending, type FioriIconData } from "@/lib/fiori-icons"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { formatNumber } from "@/lib/fiori-numbers"
import { cn } from "@/lib/utils"
import { clampWidth, measureWidths, minimumColumnWidth, type ScaleWidthMode } from "@/lib/analytical-table/layout"
import { useGridNavigation, type Position } from "@/lib/analytical-table/navigation"
import { analyticalModelOptions, createAnalyticalFilterModel, createAnalyticalSortModel, removeAnalyticalFilter,
  type AnalyticalTableFilter, type AnalyticalTableSortType } from "@/lib/analytical-table/sort-filter"
import { mergeHost, type HostProps } from "@/lib/analytical-table/owned-props"

const features = tableFeatures({
  columnFilteringFeature, globalFilteringFeature, rowSortingFeature, columnGroupingFeature, rowExpandingFeature,
  columnOrderingFeature, columnPinningFeature, columnSizingFeature, columnVisibilityFeature,
  columnMeta: {} as AnalyticalTableColumnMeta,
})
type Features = typeof features
type Table<T extends RowData> = ReturnType<typeof useTable<Features, T>>
export type AnalyticalTableEngine<T extends RowData> = import("@tanstack/react-table").Table<Features, T>
export type AnalyticalTableRowModel<T extends RowData> = Row<Features, T>
export type { AnalyticalTableAggregate, AnalyticalTableFilter, AnalyticalTableSortType }
export type { SortingState, ColumnFiltersState, GroupingState, ExpandedState } from "@tanstack/react-table"
type GridColumn<T extends RowData> = Column<Features, T>
type GridHeader<T extends RowData> = Header<Features, T, unknown>
type GridRow<T extends RowData> = Row<Features, T>
type GridCell<T extends RowData> = Cell<Features, T, unknown>
type Align = "Start" | "Center" | "End" | "Left" | "Right"
type VerticalAlign = "Top" | "Middle" | "Bottom"
export type AnalyticalTableSlot = "grid" | "header-row" | "header-cell" | "header-content" | "header-menu" |
  "body" | "row" | "cell" | "cell-content" | "resizer" | "vertical-resizer" | "empty-row" |
  "no-data" | "loading" | "header-filter" | "header-indicator" | "footer-row" | "footer-cell" | "sub-component" | "hidden-text" |
  "group-toggle" | "announcement"

export type AnalyticalTableColumnMeta = {
  className?: string
  headerClassName?: string
}

export type AnalyticalTableContentInfo<T extends RowData> = {
  table: Table<T>
  locale: string
  defaultContent: React.ReactNode
  webComponentsReactProperties: { locale: string; texts: AnalyticalTableTexts }
}

export type AnalyticalTableCellInfo<T extends RowData, V = unknown> = AnalyticalTableContentInfo<T> & { cell: Cell<Features, T, V>; row: GridRow<T>; column: GridColumn<T>; value: V }

type ColumnRenderKeys = "header" | "cell" | "footer"
type WithoutRenderers<Def> = Def extends unknown ? Omit<Def, ColumnRenderKeys> : never
type HeaderInfo<T extends RowData, V> = AnalyticalTableContentInfo<T> & { header: Header<Features, T, V>; column: GridColumn<T> }

export type AnalyticalTableFilterInfo<T extends RowData> = AnalyticalTableContentInfo<T> & {
  column: GridColumn<T>
  value: unknown
  setFilter: (value: unknown) => void
  accessibleNameRef: string
}

export type AnalyticalTableColumnDef<T extends RowData, V = unknown> = WithoutRenderers<ColumnDef<Features, T, V>> & {
  cell?: string | ((info: AnalyticalTableCellInfo<T, V> & ReturnType<Cell<Features, T, V>["getContext"]>) => React.ReactNode)
  header?: string | ((info: HeaderInfo<T, V>) => React.ReactNode)
  footer?: string | ((info: HeaderInfo<T, V>) => React.ReactNode)
  width?: number
  minWidth?: number
  maxWidth?: number
  hAlign?: Align
  vAlign?: VerticalAlign
  headerTooltip?: string
  headerLabel?: string
  cellLabel?: (info: AnalyticalTableCellInfo<T, V>) => string
  sortable?: boolean
  disableSortBy?: boolean
  sortType?: AnalyticalTableSortType<T>
  sortInverted?: boolean
  filterable?: boolean
  disableFilters?: boolean
  disableGlobalFilter?: boolean
  filter?: AnalyticalTableFilter<T>
  filterType?: AnalyticalTableFilter<T>
  /** Experimental content slot. Name the editor with accessibleNameRef. */
  Filter?: (info: AnalyticalTableFilterInfo<T>) => React.ReactNode
  disableResizing?: boolean
  disableDragAndDrop?: boolean
  interactiveElementName?: string | ((cell: GridCell<T>) => string)
  autoResizable?: boolean
  sticky?: "start"
  scaleWidthModeOptions?: { cellString?: string; headerString?: string }
  disableGroupBy?: boolean
  /** Experimental WCR-compatible group aggregation. */
  aggregate?: AnalyticalTableAggregate
  /** Transform an input to the outermost aggregate, following WCR useGroupBy. */
  aggregateValue?: (value: V, row: GridRow<T>, column: GridColumn<T>) => unknown
  /** Experimental content-only slots. The grid owns labels and the disclosure button. */
  Grouped?: (info: AnalyticalTableCellInfo<T, V>) => React.ReactNode
  RepeatedValue?: (info: AnalyticalTableCellInfo<T, V>) => React.ReactNode
  Aggregated?: (info: AnalyticalTableCellInfo<T, V>) => React.ReactNode
  aggregatedCell?: (info: AnalyticalTableCellInfo<T, V>) => React.ReactNode
  placeholderCell?: (info: AnalyticalTableCellInfo<T, V>) => React.ReactNode
}

export type AnalyticalTableInstance<T extends RowData> = {
  table: Table<T>
  /** Scroll to a zero-based index in the current row/visible column model. */
  scrollToRow(index: number, options?: ScrollToOptions): void
  scrollToColumn(index: number, options?: ScrollToOptions): void
  scrollTo(offset: number, align?: ScrollToOptions["align"]): void
  scrollToItem(index: number, align?: ScrollToOptions["align"]): void
  horizontalScrollTo(offset: number, align?: ScrollToOptions["align"]): void
  horizontalScrollToItem(index: number, align?: ScrollToOptions["align"]): void
  /** The grid header is row 0. Body data starts at row 1. */
  focusCell(row: number, column: number): void
  resetColumnSizing(): void
  toggleStickyColumn(id: string, sticky?: boolean): void
}

const defaultTexts = {
  noData: "No data", // WCR LIST_NO_DATA
  noDataFiltered: "No data found. Try adjusting the filter settings.", // WCR NO_DATA_FILTERED
  selectRow: "To select the row, press the spacebar.", // WCR SELECT_PRESS_SPACE
  unselectRow: "To deselect the row, press the spacebar.", // WCR UNSELECT_PRESS_SPACE
  selectAll: "To select all rows, press the spacebar.", // WCR SELECT_ALL_PRESS_SPACE
  unselectAll: "To deselect all rows, press the spacebar.", // WCR UNSELECT_ALL_PRESS_SPACE
  expandRow: "To expand the row, press the spacebar.", // WCR EXPAND_PRESS_SPACE
  collapseRow: "To collapse the row, press the spacebar.", // WCR COLLAPSE_PRESS_SPACE
  fixedColumn: "Fixed Column", // WCR FIXED_COLUMN
  freezeColumn: "Freeze Column", // WCR FREEZE_COLUMN
  unfreezeColumn: "Unfreeze Column", // WCR UNFREEZE_COLUMN
  dragToResize: "Drag to resize", // WCR DRAG_TO_RESIZE
  pleaseWait: "Please wait", // WCR PLEASE_WAIT
  moveToContent: "To move to the content, press F2.", // WCR MOVE_TO_CONTENT_F2
  includesContent: (name: string) => `Includes ${name}`, // WCR INCLUDES_X
  busy: "Busy", // WCR TablePlaceholder.js aria-valuetext
  sortAscending: "Sort Ascending", // WCR SORT_ASCENDING
  sortDescending: "Sort Descending", // WCR SORT_DESCENDING
  clearSorting: "Clear Sorting", // WCR CLEAR_SORTING
  group: "Group", // WCR GROUP
  ungroup: "Ungroup", // WCR UNGROUP
  grouped: "Grouped", // WCR GROUPED
  expandNode: "Expand Node", // WCR EXPAND_NODE
  collapseNode: "Collapse Node", // WCR COLLAPSE_NODE
  rowExpanded: "Row expanded", // WCR ROW_EXPANDED
  rowCollapsed: "Row collapsed", // WCR ROW_COLLAPSED
  groupValue: (value: string, count: string) => `${value} (${count})`, // WCR defaults/Column/Cell.js
  filter: "Filter", // WCR FILTER
  filtered: "Filtered", // WCR FILTERED
  menuItemActive: "Is Active", // UI5 LIST_ITEM_ACTIVE, used by WCR ColumnHeaderModal
  clearFilter: "Clear", // UI5 INPUT_CLEAR_ICON_ACC_NAME, used by WCR DefaultFilterComponent
  emptyCell: "Empty", // UI5 ARIA_LABEL_EMPTY_CELL
}
export type AnalyticalTableTexts = typeof defaultTexts
const textKeys = {
  selectRow: "wcr:SELECT_PRESS_SPACE", unselectRow: "wcr:UNSELECT_PRESS_SPACE",
  selectAll: "wcr:SELECT_ALL_PRESS_SPACE", unselectAll: "wcr:UNSELECT_ALL_PRESS_SPACE",
  expandRow: "wcr:EXPAND_PRESS_SPACE", collapseRow: "wcr:COLLAPSE_PRESS_SPACE",
  noData: "wcr:LIST_NO_DATA", noDataFiltered: "wcr:NO_DATA_FILTERED",
  fixedColumn: "wcr:FIXED_COLUMN", freezeColumn: "wcr:FREEZE_COLUMN", unfreezeColumn: "wcr:UNFREEZE_COLUMN",
  dragToResize: "wcr:DRAG_TO_RESIZE", pleaseWait: "wcr:PLEASE_WAIT",
  sortAscending: "wcr:SORT_ASCENDING", sortDescending: "wcr:SORT_DESCENDING",
  clearSorting: "wcr:CLEAR_SORTING", filter: "wcr:FILTER", filtered: "wcr:FILTERED",
  menuItemActive: "LIST_ITEM_ACTIVE", clearFilter: "INPUT_CLEAR_ICON_ACC_NAME",
  group: "wcr:GROUP", ungroup: "wcr:UNGROUP", grouped: "wcr:GROUPED",
  expandNode: "wcr:EXPAND_NODE", collapseNode: "wcr:COLLAPSE_NODE",
  rowExpanded: "wcr:ROW_EXPANDED", rowCollapsed: "wcr:ROW_COLLAPSED",
  emptyCell: "ARIA_LABEL_EMPTY_CELL", moveToContent: "wcr:MOVE_TO_CONTENT_F2", includesContent: "wcr:INCLUDES_X",
}

export type AnalyticalTableHeaderMenuItem = { id: string; text: string; onSelect: () => void }
type EmptyReason = "Empty" | "Filtered"
type EmptyInfo<T extends RowData> = AnalyticalTableContentInfo<T> & { noDataText: string; noDataReason: EmptyReason }
export type AnalyticalTableBodyProps = { children: React.ReactNode }
export type AnalyticalTableComponents = { Body: React.ComponentType<AnalyticalTableBodyProps> }

export type AnalyticalTableProps<T extends RowData> = Omit<HostProps, "children"> & {
  data: T[]
  columns: AnalyticalTableColumnDef<T, any>[]
  tableOptions?: Partial<TableOptions<Features, T>> & { _features?: Partial<Features> & Record<string, unknown> }
  tableRef?: React.Ref<AnalyticalTableInstance<T>>
  columnSizing?: ColumnSizingState
  defaultColumnSizing?: ColumnSizingState
  onColumnSizingChange?: (sizing: ColumnSizingState) => void
  columnOrder?: ColumnOrderState
  defaultColumnOrder?: ColumnOrderState
  onColumnOrderChange?: (order: ColumnOrderState) => void
  columnVisibility?: ColumnVisibilityState
  defaultColumnVisibility?: ColumnVisibilityState
  onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void
  columnPinning?: ColumnPinningState
  defaultColumnPinning?: ColumnPinningState
  onColumnPinningChange?: (pinning: ColumnPinningState) => void
  /** Experimental grouping state. Column IDs are ordered from outer to inner. */
  groupBy?: GroupingState
  defaultGroupBy?: GroupingState
  onGroupByChange?: (groupBy: GroupingState) => void
  groupable?: boolean
  disableGroupBy?: boolean
  onGroup?: (detail: { column: GridColumn<T>; groupedColumns: GroupingState; isGrouped: boolean }) => void
  expanded?: ExpandedState
  defaultExpanded?: ExpandedState
  onExpandedChange?: (expanded: ExpandedState) => void
  onRowExpandChange?: (detail: { row: GridRow<T>; column: GridColumn<T> | undefined }) => void
  sorting?: SortingState
  defaultSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  columnFilters?: ColumnFiltersState
  defaultColumnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  globalFilter?: string
  defaultGlobalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  /** WCR-named alias for the controlled global query. */
  globalFilterValue?: string
  sortable?: boolean
  filterable?: boolean
  disableGlobalFilter?: boolean
  enableMultiSort?: boolean
  /** The ordered IDs passed to WCR's useOrderedMultiSort hook. */
  sortPriority?: readonly string[]
  onSort?: (detail: { column: GridColumn<T>; sortDirection: "asc" | "desc" | "clear"; sorting: SortingState }) => void
  onFilter?: (detail: { columnId: string; value: unknown; filters: ColumnFiltersState }) => void
  initialState?: { hiddenColumns?: string[] }
  classNames?: Partial<Record<AnalyticalTableSlot, string>>
  components?: Partial<AnalyticalTableComponents>
  getRowProps?: (row: GridRow<T>) => HostProps
  getCellProps?: (cell: GridCell<T>) => HostProps
  getHeaderProps?: (header: GridHeader<T>) => HostProps
  /** Header menu items run within the same menu as Freeze/Unfreeze. */
  headerMenuItems?: (column: GridColumn<T>, table: Table<T>) => readonly AnalyticalTableHeaderMenuItem[]
  /** Enable the WCR useStickyColumns menu contribution. Initially sticky columns are also freeze-enabled. */
  enableColumnFreeze?: boolean
  onStickyColumnsChange?: (change: { column: GridColumn<T>; sticky: boolean; stickyColumns: string[] }) => void
  onColumnResize?: (change: { columnWidth: number; header: GridColumn<T> }) => void
  onAutoResize?: (change: { columnId: string; width: number; event: React.MouseEvent }) => void
  onColumnsReorder?: (change: { columnsNewOrder: GridColumn<T>[]; column: GridColumn<T> }) => void
  scaleWidthMode?: ScaleWidthMode
  retainColumnWidth?: boolean
  rowHeight?: number
  headerRowHeight?: number
  alternateRowColor?: boolean
  minRows?: number
  visibleRows?: number
  defaultVisibleRows?: number
  onVisibleRowsChange?: (visibleRows: number) => void
  visibleRowCountMode?: "Fixed" | "Auto" | "AutoWithEmptyRows" | "Interactive"
  loading?: boolean
  loadingDelay?: number
  alwaysShowBusyIndicator?: boolean
  noDataText?: string
  noDataReason?: EmptyReason
  NoDataComponent?: React.ComponentType<EmptyInfo<T>>
  LoadingComponent?: React.ComponentType<AnalyticalTableContentInfo<T>>
  renderRowSubComponent?: (info: AnalyticalTableContentInfo<T> & { row: GridRow<T> }) => React.ReactNode
  announceEmptyCells?: boolean
  texts?: Partial<AnalyticalTableTexts>
  locale?: string
  /** aria-label, aria-labelledby, aria-describedby and aria-details target the inner grid. */
}

export type AnalyticalTableContext<T extends RowData> = {
  model: { readonly rows: readonly GridRow<T>[]; readonly columns: readonly GridColumn<T>[]; readonly locale: string }
  state: Readonly<{ visibleRows: number; columnSizing: Readonly<ColumnSizingState>; columnOrder: readonly string[];
    sorting: ReadonlyArray<Readonly<SortingState[number]>>; columnFilters: ReadonlyArray<Readonly<ColumnFiltersState[number]>>;
    groupBy: readonly string[]; expanded: true | Readonly<Record<string, boolean>>;
    globalFilter: string; columnVisibility: Readonly<ColumnVisibilityState>; columnPinning: { readonly start: readonly string[]; readonly end: readonly string[] } }>
  actions: Pick<AnalyticalTableInstance<T>, "focusCell" | "scrollToRow" | "scrollToColumn" | "resetColumnSizing" | "toggleStickyColumn"> & {
    setSorting: (sorting: SortingState) => void
    setGroupBy: (groupBy: GroupingState) => void
    setExpanded: (expanded: ExpandedState) => void
    setColumnFilters: (filters: ColumnFiltersState) => void
    setGlobalFilter: (value: string) => void
  }
  getRowProps(row: GridRow<T>, extra?: HostProps): HostProps
  getCellProps(cell: GridCell<T>, extra?: HostProps): HostProps
  getHeaderProps(header: GridHeader<T>, extra?: HostProps): HostProps
}

const Context = React.createContext<AnalyticalTableContext<any> | null>(null)
export function useAnalyticalTable<T extends RowData>(): AnalyticalTableContext<T> {
  const context = React.useContext(Context)
  if (!context) throw new Error("useAnalyticalTable requires an AnalyticalTable.")
  return context
}

export function AnalyticalTableRow<T extends RowData>({ row, children, ...extra }: HostProps & { row: GridRow<T> }) {
  return <div {...useAnalyticalTable<T>().getRowProps(row, extra)}>{children}</div>
}
export function AnalyticalTableCell<T extends RowData>({ cell, children, ...extra }: HostProps & { cell: GridCell<T> }) {
  return <div {...useAnalyticalTable<T>().getCellProps(cell, extra)}>{children}</div>
}
export function AnalyticalTableHeaderCell<T extends RowData>({ header, children, ...extra }: HostProps & { header: GridHeader<T> }) {
  return <div {...useAnalyticalTable<T>().getHeaderProps(header, extra)}>{children}</div>
}

function useColumnState<T>(value: T | undefined, initial: () => T, onChange?: (next: T) => void) {
  const [internal, setInternal] = React.useState(initial)
  const state = value ?? internal
  const latest = React.useRef(state)
  latest.current = state
  function update(action: Updater<T>) {
    const next = typeof action === "function" ? (action as (previous: T) => T)(latest.current) : action
    if (value === undefined) {
      latest.current = next
      setInternal(next)
    }
    onChange?.(next)
  }
  return [state, update] as const
}

function columnId<T extends RowData>(definition: AnalyticalTableColumnDef<T>) {
  return definition.id ?? ("accessorKey" in definition ? String(definition.accessorKey).replaceAll(".", "_") : undefined) ??
    (typeof definition.header === "string" ? definition.header : "")
}

function useViewport(root: React.RefObject<HTMLDivElement | null>, grid: React.RefObject<HTMLDivElement | null>, dir: "ltr" | "rtl" | undefined) {
  const [viewport, setViewport] = React.useState({ width: 0, availableHeight: 0, rowHeight: 0, headerHeight: 0, rtl: dir === "rtl", fontsReady: false })
  React.useLayoutEffect(() => {
    const element = grid.current
    const parent = root.current?.parentElement
    if (!element || !parent) return
    const refresh = () => {
      const style = getComputedStyle(element)
      const measured = {
        width: element.clientWidth,
        availableHeight: parent.clientHeight,
        rowHeight: Number.parseFloat(style.getPropertyValue("--fiori-wcr-x-analyticaltablerowheight")) || 44,
        headerHeight: Number.parseFloat(style.getPropertyValue("--fiori-wcr-x-analyticaltableheaderrowheight")) || 44,
        rtl: style.direction === "rtl",
      }
      setViewport(previous => Object.entries(measured).every(([key, val]) => previous[key as keyof typeof measured] === val) ? previous : { ...previous, ...measured })
    }
    refresh()
    const observer = new ResizeObserver(refresh)
    observer.observe(element)
    observer.observe(parent)
    const attributes = new MutationObserver(refresh)
    attributes.observe(element.ownerDocument.documentElement, { attributes: true, subtree: true, attributeFilter: ["dir", "data-density", "data-theme"] })
    let live = true
    void element.ownerDocument.fonts.ready.then(() => {
      if (live) setViewport(previous => ({ ...previous, fontsReady: true }))
    })
    return () => { live = false; observer.disconnect(); attributes.disconnect() }
  }, [dir, grid, root])
  return viewport
}

const dragType = "application/x-petalo-analytical-table-column"
const slot = (name: AnalyticalTableSlot) => `analytical-table-${name}`

export function AnalyticalTable<T extends RowData>({
  data, columns, tableOptions, tableRef,
  columnSizing, defaultColumnSizing, onColumnSizingChange,
  columnOrder, defaultColumnOrder, onColumnOrderChange,
  columnVisibility, defaultColumnVisibility, onColumnVisibilityChange,
  columnPinning, defaultColumnPinning, onColumnPinningChange, initialState,
  className, classNames, components, getRowProps, getCellProps, getHeaderProps, headerMenuItems,
  enableColumnFreeze, onStickyColumnsChange, onColumnResize, onAutoResize, onColumnsReorder,
  sorting, defaultSorting, onSortingChange, columnFilters, defaultColumnFilters, onColumnFiltersChange,
  globalFilter, defaultGlobalFilter, onGlobalFilterChange, globalFilterValue,
  sortable = false, filterable = false, disableGlobalFilter = false, enableMultiSort = false,
  sortPriority, onSort, onFilter,
  groupBy, defaultGroupBy, onGroupByChange, groupable = false, disableGroupBy = false, onGroup,
  expanded, defaultExpanded, onExpandedChange, onRowExpandChange,
  retainColumnWidth = false, scaleWidthMode = "Default", rowHeight, headerRowHeight,
  alternateRowColor = false, minRows = 5, visibleRows, defaultVisibleRows = 15, onVisibleRowsChange,
  visibleRowCountMode = "Fixed", loading = false, loadingDelay, alwaysShowBusyIndicator = false,
  noDataText, noDataReason, NoDataComponent, LoadingComponent, renderRowSubComponent,
  announceEmptyCells = false, locale: localeProp, texts: textOverrides, dir,
  "aria-label": label, "aria-labelledby": labelledBy, "aria-describedby": describedBy, "aria-description": description, "aria-details": details,
  ref, ...rootProps
}: AnalyticalTableProps<T>) {
  const id = React.useId()
  const { locale, dir: localeDir, localized, hasProvider } = useFioriLocale(localeProp)
  const texts = useFioriTexts(defaultTexts, textKeys, textOverrides, localeProp)
  const direction = (dir ?? (localized || hasProvider ? localeDir : undefined)) as "ltr" | "rtl" | undefined
  const root = React.useRef<HTMLDivElement>(null)
  const grid = React.useRef<HTMLDivElement>(null)
  const viewport = useViewport(root, grid, direction)
  const rtl = viewport.rtl
  const [voiceOver, setVoiceOver] = React.useState(false)
  React.useEffect(() => setVoiceOver(/Mac|iPhone|iPad|iPod/.test(navigator.platform)), [])

  // useStickyColumns.js seeds pins from column definitions; the pinning state is authoritative thereafter.
  const [pinning, setPinning] = useColumnState(columnPinning, () => defaultColumnPinning ??
    tableOptions?.initialState?.columnPinning ??
    { start: columns.filter(column => column.sticky === "start").map(columnId), end: [] }, onColumnPinningChange)
  const [order, setOrder] = useColumnState(columnOrder, () => defaultColumnOrder ?? tableOptions?.initialState?.columnOrder ?? [], onColumnOrderChange)
  const [visibility, setVisibility] = useColumnState(columnVisibility, () => defaultColumnVisibility ??
    tableOptions?.initialState?.columnVisibility ?? Object.fromEntries((initialState?.hiddenColumns ?? []).map(key => [key, false])), onColumnVisibilityChange)
  const [sizing, setSizing] = useColumnState(columnSizing, () => defaultColumnSizing ?? tableOptions?.initialState?.columnSizing ?? {}, onColumnSizingChange)
  const [groupState, setGrouping] = useColumnState(groupBy, () => defaultGroupBy ?? tableOptions?.initialState?.grouping ?? [], onGroupByChange)
  const [expandedState, setExpanded] = useColumnState(expanded, () => defaultExpanded ?? tableOptions?.initialState?.expanded ?? {}, onExpandedChange)
  const [sortState, setSorting] = useColumnState(sorting, () => defaultSorting ?? tableOptions?.initialState?.sorting ?? [], onSortingChange)
  const [filterState, setFilters] = useColumnState(columnFilters, () => defaultColumnFilters ?? tableOptions?.initialState?.columnFilters ?? [], onColumnFiltersChange)
  const [globalQuery, setGlobalFilter] = useColumnState(globalFilter ?? globalFilterValue,
    () => defaultGlobalFilter ?? tableOptions?.initialState?.globalFilter ?? "", onGlobalFilterChange)
  const [requestedRows, setVisibleRows] = useColumnState(visibleRows, () => defaultVisibleRows, onVisibleRowsChange)
  const startsFrozen = columns.some(column => column.sticky === "start")
  const frozenMenu = enableColumnFreeze ?? startsFrozen
  const densityRow = rowHeight ?? (viewport.rowHeight || 44)
  const densityHeader = headerRowHeight ?? rowHeight ?? (viewport.headerHeight || densityRow)
  const priorWidth = React.useRef(viewport.width)
  const wasResized = React.useRef(false)
  React.useEffect(() => {
    if (priorWidth.current !== viewport.width && wasResized.current && !retainColumnWidth && columnSizing === undefined) {
      setSizing(defaultColumnSizing ?? {})
      wasResized.current = false
    }
    priorWidth.current = viewport.width
  }, [viewport.width, retainColumnWidth, columnSizing, defaultColumnSizing])

  const print = React.useCallback((value: unknown) => typeof value === "number" ?
    formatNumber(value, locale, { useGrouping: false, maxFractionDigits: 20 }) : String(value ?? ""), [locale])
  const baseWidths = React.useMemo(() => measureWidths(columns
    .filter(column => visibility[columnId(column)] !== false)
    .map(column => ({
      id: columnId(column),
      width: column.width ?? column.size,
      minWidth: column.minWidth ?? column.minSize,
      maxWidth: column.maxWidth ?? column.maxSize,
      header: typeof column.header === "string" ? column.header : column.headerLabel ?? "",
      ...column.scaleWidthModeOptions,
      sample: (scaleWidthMode !== "Default" && viewport.fontsReady ? data.slice(0, 20) : []).map((row, index) => print(
        "accessorFn" in column && column.accessorFn ? column.accessorFn(row, index) :
          "accessorKey" in column ? String(column.accessorKey).split(".").reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], row) : undefined,
      )),
    })), viewport.width, viewport.fontsReady && !(loading && !data.length) ? scaleWidthMode : "Default", grid.current),
    [columns, data, visibility, viewport, scaleWidthMode, loading, print])
  const definitions = React.useMemo(() => columns.map(column => ({
    ...column, minSize: column.minWidth ?? column.minSize ?? minimumColumnWidth,
    maxSize: column.maxWidth ?? column.maxSize ?? (scaleWidthMode === "Grow" ? 700 : Infinity),
    enableSorting: !column.disableSortBy && (column.sortable ?? column.enableSorting ?? sortable),
    enableGrouping: !column.disableGroupBy && column.enableGrouping !== false,
    enableColumnFilter: !column.disableFilters && (column.filterable ?? column.enableColumnFilter ?? filterable),
    enableGlobalFilter: !column.disableGlobalFilter && column.enableGlobalFilter !== false,
    sortDescFirst: column.sortDescFirst ?? false,
    invertSorting: column.sortInverted ?? column.invertSorting,
  })) as ColumnDef<Features, T, any>[], [columns, scaleWidthMode, sortable, filterable])
  const engineFeatures = {
    filteredRowModel: createAnalyticalFilterModel, groupedRowModel: createAnalyticalGroupModel,
    sortedRowModel: createAnalyticalSortModel, expandedRowModel: createExpandedRowModel(),
    ...tableOptions?.features, ...tableOptions?._features, ...features,
  }
  const table = useTable<Features, T>({
    ...tableOptions,
    features: engineFeatures,
    columns: definitions,
    data,
    meta: { ...tableOptions?.meta, [analyticalModelOptions]: { locale, disableGlobalFilter } },
    state: { ...tableOptions?.state, columnSizing: { ...baseWidths, ...sizing }, columnOrder: order, columnVisibility: visibility, columnPinning: pinning,
      grouping: groupState, expanded: expandedState,
      sorting: sortState, columnFilters: filterState, globalFilter: disableGlobalFilter ? "" : globalQuery },
    enableMultiSort, enableGlobalFilter: !disableGlobalFilter,
    enableGrouping: groupable && !disableGroupBy && !renderRowSubComponent,
    onGroupingChange: setGrouping, onExpandedChange: setExpanded,
    onColumnOrderChange: setOrder, onColumnVisibilityChange: setVisibility, onColumnPinningChange: setPinning,
    onColumnSizingChange: setSizing, onSortingChange: setSorting, onColumnFiltersChange: setFilters, onGlobalFilterChange: setGlobalFilter,
  })
  const rows = table.getRowModel().rows
  const grouped = groupState.some(id => table.getColumn(id) !== undefined)
  const visible = table.getVisibleLeafColumns()
  const headersById = new Map(table.getHeaderGroups().at(-1)?.headers.map(header => [header.column.id, header]) ?? [])
  const pinned = visible.filter(column => pinning.start.includes(column.id))
  const unpinned = visible.filter(column => !pinning.start.includes(column.id))
  const frozenSize = pinned.reduce((sum, column) => sum + column.getSize(), 0)
  // useStickyColumns.js keeps the configured pins when there is too little room to render them.
  const freezeActive = pinned.length > 0 && (!viewport.width || frozenSize + (unpinned.length ? minimumColumnWidth : 0) <= viewport.width)
  const ordered = [...pinned, ...unpinned]
  const pinnedCount = freezeActive ? pinned.length : 0
  const rowCount = rows.length
  const auto = visibleRowCountMode.startsWith("Auto")
  const availableBody = viewport.availableHeight - densityHeader
  const fitRows = auto && availableBody >= densityRow ? Math.max(1, Math.floor(availableBody / densityRow)) : requestedRows
  const viewportRows = visibleRowCountMode === "AutoWithEmptyRows" || (auto && !rowCount) ? fitRows :
    rowCount < fitRows ? Math.max(rowCount, minRows) : fitRows
  const bodyHeight = Math.max(0, viewportRows) * densityRow
  const footer = ordered.some(column => column.columnDef.footer != null)
  const virtualRows = React.useRef<ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLDivElement>>>(null)
  const virtualColumns = React.useRef<ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLDivElement>>>(null)
  function reveal(position: Position) {
    if (position.row > 0) virtualRows.current?.scrollToIndex(position.row - 1, { align: "auto" })
    if (position.column >= pinnedCount) virtualColumns.current?.scrollToIndex(position.column, { align: "auto" })
  }
  const nav = useGridNavigation(grid, rowCount, ordered.length, densityRow, Math.max(1, viewportRows), rtl, reveal)
  const rowVirtual = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: rowCount ? Math.max(rowCount, minRows, viewportRows) : 0,
    getScrollElement: () => grid.current, estimateSize: () => densityRow,
    getItemKey: index => rows[index]?.id ?? `empty-${index}`,
    overscan: Math.floor(fitRows / 2), paddingStart: densityHeader, scrollPaddingStart: densityHeader,
    rangeExtractor: range => keepIndexes(defaultRangeExtractor(range), nav.active?.row ? [nav.active.row - 1] : []),
  })
  const pendingHeaderFocus = React.useRef<string>(undefined)
  const colVirtual = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: ordered.length, getScrollElement: () => grid.current, horizontal: true, isRtl: rtl,
    estimateSize: index => ordered[index]?.getSize() ?? minimumColumnWidth,
    getItemKey: index => ordered[index]?.id ?? index, overscan: 10,
    scrollPaddingStart: freezeActive ? frozenSize : 0,
    rangeExtractor: range => keepIndexes(defaultRangeExtractor(range),
      [...Array.from({ length: pinnedCount }, (_, index) => index), ...(nav.active ? [nav.active.column] : []),
        ...ordered.flatMap((column, index) => column.id === pendingHeaderFocus.current ? [index] : [])]),
  })
  virtualRows.current = rowVirtual
  virtualColumns.current = colVirtual
  const widthSignature = ordered.map(column => `${column.id}:${column.getSize()}`).join("|")
  React.useLayoutEffect(() => { colVirtual.measure() }, [colVirtual, widthSignature])
  React.useLayoutEffect(() => { rowVirtual.measure() }, [rowVirtual, densityRow])

  const scrollToRow: AnalyticalTableInstance<T>["scrollToRow"] = (index, options) => rowVirtual.scrollToIndex(index, options)
  const scrollToColumn: AnalyticalTableInstance<T>["scrollToColumn"] = (index, options) => colVirtual.scrollToIndex(index, options)
  const resetColumnSizing = () => { wasResized.current = false; setSizing(defaultColumnSizing ?? {}) }
  function toggleStickyColumn(key: string, target = !pinning.start.includes(key)) {
    if (!table.getColumn(key)) return
    const next = pinning.start.filter(id => id !== key)
    setPinning({ start: target ? [...next, key] : next, end: [] })
  }
  React.useImperativeHandle(tableRef, () => ({
    table, scrollToRow, scrollToColumn, focusCell: nav.focusCell, resetColumnSizing, toggleStickyColumn,
    scrollTo: (offset, align) => rowVirtual.scrollToOffset(offset, { align }), scrollToItem: (index, align) => scrollToRow(index, { align }),
    horizontalScrollTo: (offset, align) => colVirtual.scrollToOffset(offset, { align }), horizontalScrollToItem: (index, align) => scrollToColumn(index, { align }),
  }))

  const [openColumn, setOpenColumn] = React.useState<string>()
  const [announcement, setAnnouncement] = React.useState({ text: "", revision: 0 })
  const [announcementActive, setAnnouncementActive] = React.useState(false)
  const announcementTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(announcementTimer.current), [])
  const [dropTarget, setDropTarget] = React.useState<string>()
  const [guide, setGuide] = React.useState<{ id: string; delta: number }>()
  const menuItems = new Map(ordered.map(column => [column.id, headerMenuItems?.(column, table) ?? []]))
  const virtualItems = new Map(colVirtual.getVirtualItems().map(item => [item.index, item]))
  const cellStyle = (index: number): React.CSSProperties => {
    const item = virtualItems.get(index)
    return {
      width: item?.size ?? ordered[index]?.getSize(),
      insetInlineStart: item?.start ?? 0,
      position: index < pinnedCount ? "sticky" : "absolute",
    }
  }
  const rowPositions = new Map(rowVirtual.getVirtualItems().map(item => [rows[item.index]?.id, item]))
  const rowIndexes = new Map(rows.map((row, index) => [row.id, index]))
  const columnIndexes = new Map(ordered.map((column, index) => [column.id, index]))
  const part = (name: AnalyticalTableSlot, base?: string) => ({ "data-slot": slot(name), className: cn(base, classNames?.[name]) })
  const headerId = (column: GridColumn<T>) => `${id}-head-${encodeURIComponent(column.id)}`
  const valueId = (cell: GridCell<T>) => `${id}-value-${encodeURIComponent(cell.id)}`
  const emptyId = `${id}-empty`
  React.useLayoutEffect(() => {
    const restore = pendingHeaderFocus.current
    if (restore && !openColumn) {
      pendingHeaderFocus.current = undefined
      const column = columnIndexes.get(restore)
      if (column !== undefined) nav.focusCell(0, column)
    }
  })
  const customColumns = new Map(columns.map(column => [columnId(column), column]))
  const isFrozen = (index: number) => index < pinnedCount
  const canFreeze = (column: GridColumn<T>) => frozenMenu && column.getCanPin()
  function definition(column: GridColumn<T>) { return column.columnDef as AnalyticalTableColumnDef<T> }
  function info(defaultContent: React.ReactNode): AnalyticalTableContentInfo<T> {
    return { table, defaultContent, locale, webComponentsReactProperties: { locale, texts } }
  }
  function isResizable(column: GridColumn<T>) { return !definition(column).disableResizing }

  function resize(column: GridColumn<T>, delta: number) {
    const def = definition(column)
    const width = clampWidth(column.getSize() + delta, def.minSize, def.maxSize)
    wasResized.current = true
    setSizing(previous => ({ ...previous, [column.id]: width }))
    onColumnResize?.({ columnWidth: width, header: column })
  }
  function autoResize(event: React.MouseEvent, column: GridColumn<T>) {
    if (!definition(column).autoResizable || !rowCount) return
    // useAutoResize measures rendered content and includes 2px for rounding and borders.
    const index = columnIndexes.get(column.id)
    const cells = [...(grid.current?.querySelectorAll<HTMLElement>(`[role="gridcell"][data-grid-column="${index}"]`) ?? [])]
    const widths = cells.map(cell => Array.from(cell.children).reduce((sum, child) => sum + child.scrollWidth, 0))
    if (!widths.length) return
    const def = definition(column)
    const width = clampWidth(Math.max(...widths) + 20, def.minSize, def.maxSize)
    onAutoResize?.({ columnId: column.id, width, event })
    if (!event.defaultPrevented) resize(column, width - column.getSize())
  }
  function onResizeStart(event: React.PointerEvent<HTMLDivElement>, column: GridColumn<T>) {
    if (!event.isPrimary || event.button !== 0) return
    event.preventDefault()
    const node = event.currentTarget
    const start = event.clientX
    let delta = 0
    node.setPointerCapture(event.pointerId)
    // useColumnResizing.js: dead zone, clamped guide, commit only on release.
    node.onpointermove = move => {
      const next = (move.clientX - start) * (rtl ? -1 : 1)
      if (Math.abs(next) < 3 && !delta) return
      const def = definition(column)
      delta = clampWidth(column.getSize() + next, def.minSize, def.maxSize) - column.getSize()
      setGuide({ id: column.id, delta })
    }
    const finish = (commit: boolean) => {
      node.onpointermove = node.onpointerup = node.onpointercancel = node.onlostpointercapture = null
      setGuide(undefined)
      if (commit && delta) resize(column, delta)
    }
    node.onpointerup = () => finish(true)
    node.onpointercancel = node.onlostpointercapture = () => finish(false)
  }
  function reorder(event: React.DragEvent, target: GridColumn<T>) {
    setDropTarget(undefined)
    if (!event.dataTransfer.types.includes(dragType) || pinning.start.includes(target.id)) return
    const source = table.getColumn(event.dataTransfer.getData(dragType))
    if (!source || source === target || pinning.start.includes(source.id) || definition(source).disableDragAndDrop) return
    event.preventDefault()
    // useDragAndDrop.js reconciles user order including hidden columns and inserts before the drop
    // target, except for a forward drop in RTL.
    const all = table.getAllLeafColumns()
    const next = all.map(column => column.id)
    const from = next.indexOf(source.id)
    const to = next.indexOf(target.id)
    next.splice(from, 1)
    next.splice(to > from && !rtl ? to - 1 : to, 0, source.id)
    setOrder(next)
    onColumnsReorder?.({ column: source, columnsNewOrder: next.map(key => table.getColumn(key)!) })
  }

  function toggleGroup(column: GridColumn<T>) {
    const isGrouped = !column.getIsGrouped()
    const groupedColumns = isGrouped ? [...groupState, column.id] : groupState.filter(id => id !== column.id)
    setGrouping(groupedColumns)
    onGroup?.({ column, groupedColumns, isGrouped })
    pendingHeaderFocus.current = column.id
    setOpenColumn(undefined)
  }

  function toggleGroupRow(row: GridRow<T>) {
    const next = !row.getIsExpanded()
    row.toggleExpanded(next)
    onRowExpandChange?.({ row, column: row.groupingColumnId ? table.getColumn(row.groupingColumnId) : undefined })
    // WCR useToggleRowExpand debounces the polite InvisibleMessage announcement.
    const text = next ? texts.rowExpanded : texts.rowCollapsed
    setAnnouncementActive(true)
    clearTimeout(announcementTimer.current)
    announcementTimer.current = setTimeout(() => {
      setAnnouncement(current => ({ text, revision: current.revision + 1 }))
      announcementTimer.current = setTimeout(() => setAnnouncement(current => ({ ...current, text: "" })), 3000)
    }, 200)
  }

  function hasColumnActions(column: GridColumn<T>) { return column.getCanSort() || column.getCanFilter() || column.getCanGroup() }
  function groupLabel(row: GridRow<T>) {
    if (!row.groupingColumnId) return undefined
    return texts.groupValue(print(row.getValue(row.groupingColumnId)), formatNumber(row.subRows.length, locale))
  }
  function printAggregate(value: unknown, aggregate: AnalyticalTableAggregate | undefined) {
    const format = (item: unknown) => typeof item === "number" ? formatNumber(item, locale, { maxFractionDigits: 20 }) : String(item ?? "")
    if (aggregate === "minMax" && typeof value === "string") {
      const parts = value.split("..")
      if (parts.length === 2) return parts.map(part => part && !Number.isNaN(Number(part)) ? format(Number(part)) : part).join("..")
    }
    return Array.isArray(value) ? value.map(format).join(",") : format(value)
  }
  function sortDirection(column: GridColumn<T>) {
    const state = sortState.find(item => item.id === column.id)
    return state ? state.desc ? "desc" : "asc" : undefined
  }
  function filterValue(column: GridColumn<T>) { return filterState.find(item => item.id === column.id)?.value }
  function isFiltered(column: GridColumn<T>) {
    const value = filterValue(column)
    // useA11y.setHeaderProps derives FILTERED from the filter value's length.
    return (typeof value === "string" || Array.isArray(value)) && value.length > 0
  }
  function sortColumn(column: GridColumn<T>, direction: "asc" | "desc" | "clear") {
    let next = sortState.filter(item => item.id !== column.id)
    if (direction !== "clear") {
      const entry = { id: column.id, desc: direction === "desc" }
      // ColumnHeaderModal calls toggleSortBy with explicit direction and the
      // column's multi-sort flag. Changing its direction preserves its priority.
      next = !column.getCanMultiSort() ? [entry] : sortState.some(item => item.id === column.id)
        ? sortState.map(item => item.id === column.id ? entry : item)
        : [...sortState, entry]
      if (sortPriority?.length && next.length > 1) {
        const ranked = [...new Set(sortPriority)].flatMap(id => next.filter(item => item.id === id))
        next = [...ranked, ...next.filter(item => !sortPriority.includes(item.id))]
      }
    }
    setSorting(next)
    onSort?.({ column, sortDirection: direction, sorting: next })
  }
  function updateFilter(column: GridColumn<T>, value: unknown) {
    const id = column.id
    const def = definition(column)
    const remove = removeAnalyticalFilter(def.filter ?? def.filterType, value)
    const next = remove ? filterState.filter(item => item.id !== id) :
      filterState.some(item => item.id === id) ? filterState.map(item => item.id === id ? { id, value } : item) :
        [...filterState, { id, value }]
    setFilters(next)
    // WCR tableReducer/setFilter reports the proposed filters and the edited column.
    onFilter?.({ columnId: id, value, filters: next })
  }

  function ownedHeader(header: GridHeader<T>, extra?: HostProps) {
    const column = header.column
    const index = columnIndexes.get(column.id) ?? 0
    const def = definition(column)
    const hasMenu = hasColumnActions(column) || canFreeze(column) || Boolean(menuItems.get(column.id)?.length)
    const name = def.headerLabel ?? (typeof def.header === "string" ? def.header : undefined)
    const sorted = sortDirection(column)
    const filtered = isFiltered(column)
    const grouped = column.getIsGrouped()
    const draggable = !def.disableDragAndDrop && !isFrozen(index) && !guide
    return mergeHost("header-cell", {
      ...part("header-cell", cn("fiori-at-header-cell", def.meta?.headerClassName)),
      id: headerId(column), role: "columnheader", "aria-colindex": index + 1,
      // WCR useStickyColumns.getHeaderProps supplies FIXED_COLUMN as the frozen header name.
      // WCR useA11y.setHeaderProps exposes sorting via aria-sort and appends
      // FILTERED to the name. The naming channel supplies its sort/filter announcements.
      "aria-label": isFrozen(index) ? texts.fixedColumn : [name, filtered && texts.filtered, grouped && texts.grouped].filter(Boolean).join(" ") || undefined,
      "aria-sort": sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined,
      "data-sorted": sorted, "data-filtered": filtered || undefined, "data-grouped": grouped || undefined,
      "aria-haspopup": hasMenu ? "menu" : undefined, "aria-expanded": hasMenu ? openColumn === column.id : undefined,
      "aria-controls": hasMenu ? `${headerId(column)}-menu` : undefined,
      tabIndex: !loading && nav.isActive(0, index) ? 0 : -1,
      draggable,
      "data-grid-row": 0, "data-grid-column": index, "data-column-id": column.id,
      "data-frozen": isFrozen(index) || undefined, "data-dragging": dropTarget === column.id || undefined,
      onFocus: event => nav.onHostFocus(event, 0, index), onBlur: nav.onHostBlur,
      onClick: event => { if (hasMenu && !(event.target as Element).closest(".fiori-at-sort-popup")) setOpenColumn(column.id) },
      onKeyUp: event => { if (event.target === event.currentTarget && event.key === " " && hasMenu) setOpenColumn(column.id) },
      onKeyDown: event => {
        if (event.target === event.currentTarget) {
          if (event.shiftKey && isResizable(column) && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault()
            resize(column, (event.key === "ArrowRight" ? 16 : -16) * (rtl ? -1 : 1))
            return
          }
          if (hasMenu && event.key === "Enter") { event.preventDefault(); setOpenColumn(column.id); return }
          if (hasMenu && event.key === " ") { event.preventDefault(); return }
        }
        nav.onKeyDown(event, 0, index)
      },
      onDragStart: event => {
        if (!draggable) { event.preventDefault(); return }
        event.dataTransfer.setData(dragType, column.id)
        event.dataTransfer.effectAllowed = "move"
      },
      onDragOver: event => {
        if (!isFrozen(index) && event.dataTransfer.types.includes(dragType)) { event.preventDefault(); setDropTarget(column.id) }
      },
      onDragLeave: event => { if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) setDropTarget(undefined) },
      onDragEnd: () => setDropTarget(undefined),
      onDrop: event => reorder(event, column),
    } as HostProps, getHeaderProps?.(header), extra)
  }

  function cellInfo(cell: GridCell<T>): AnalyticalTableCellInfo<T> {
    const value = cell.getValue()
    const defaultContent = cell.getIsGrouped() ? groupLabel(cell.row) :
      cell.getIsPlaceholder() ? null : cell.row.getIsGrouped() ? printAggregate(value, definition(cell.column).aggregate) : print(value)
    return { ...info(defaultContent), cell, value, row: cell.row, column: cell.column }
  }
  const context: AnalyticalTableContext<T> = {
    model: { rows, columns: ordered, locale },
    state: { visibleRows: requestedRows, columnSizing: sizing, columnOrder: order, columnVisibility: visibility, columnPinning: pinning,
      sorting: sortState, columnFilters: filterState, globalFilter: globalQuery, groupBy: groupState, expanded: expandedState },
    actions: { focusCell: nav.focusCell, scrollToRow, scrollToColumn, resetColumnSizing, toggleStickyColumn, setSorting, setColumnFilters: setFilters, setGlobalFilter, setGroupBy: setGrouping, setExpanded },
    getHeaderProps: ownedHeader,
    getRowProps: (row, extra) => {
      const index = rowIndexes.get(row.id) ?? 0
      return mergeHost("row", {
        ...part("row", "fiori-at-row"), role: "row", "aria-rowindex": index + 2, id: `${id}-row-${encodeURIComponent(row.id)}`,
        "data-grouped": row.getIsGrouped() || undefined,
        "aria-expanded": row.getIsGrouped() ? row.getIsExpanded() : undefined,
        "aria-level": row.getIsGrouped() ? row.depth + 1 : undefined,
        "data-alternate": alternateRowColor && index % 2 === 0 || undefined,
        style: { top: (rowPositions.get(row.id)?.start ?? densityHeader) - densityHeader, height: densityRow },
      } as HostProps, getRowProps?.(row), extra)
    },
    getCellProps: (cell, extra) => {
      const row = (rowIndexes.get(cell.row.id) ?? 0) + 1
      const column = columnIndexes.get(cell.column.id) ?? 0
      const def = definition(cell.column)
      const value = cell.getValue()
      const empty = announceEmptyCells && typeof value !== "number" && !value
      const group = cell.row.getIsGrouped()
      const expanded = group ? cell.row.getIsExpanded() : undefined
      // useA11y.setCellProps + useCanUseVoiceOver: value first, then the header on Apple platforms.
      const interactiveName = typeof def.interactiveElementName === "function" ? def.interactiveElementName(cell) : def.interactiveElementName
      const cellName = def.cellLabel?.(cellInfo(cell))
      const defaultContent = interactiveName ? cellInfo(cell).defaultContent : undefined
      const name = interactiveName ? `${texts.includesContent(interactiveName)} ${cellName ?? defaultContent ?? ""}` : cellName
      return mergeHost("cell", {
        ...part("cell", cn("fiori-at-cell", def.meta?.className)),
        role: "gridcell", id: `${valueId(cell)}-cell`, "aria-colindex": column + 1,
        "aria-label": name,
        // WCR useA11y.setCellProps attaches the expansion hint to every cell
        // of a group row since the keyboard cursor normally rests on a cell.
        "aria-expanded": expanded,
        "aria-describedby": group ? `${id}-hint-${expanded ? 5 : 4}` : undefined,
        "aria-labelledby": name === undefined ? [valueId(cell), voiceOver && headerId(cell.column), empty && emptyId].filter(Boolean).join(" ") : undefined,
        "data-grid-row": row, "data-grid-column": column, "data-column-id": cell.column.id,
        "data-frozen": isFrozen(column) || undefined,
        tabIndex: !loading && nav.isActive(row, column) ? 0 : -1,
        style: { ...cellStyle(column), justifyContent: def.hAlign?.toLowerCase(),
          alignItems: def.vAlign === "Top" ? "start" : def.vAlign === "Bottom" ? "end" : "center" },
        onFocus: event => nav.onHostFocus(event, row, column), onBlur: nav.onHostBlur,
        onKeyDown: event => {
          // useToggleRowExpand matches Enter, F4 and unshifted Space.
          if (group && event.target === event.currentTarget &&
            (event.key === "Enter" || event.code === "F4" || event.code === "Space" && !event.shiftKey)) {
            event.preventDefault()
            toggleGroupRow(cell.row)
            return
          }
          nav.onKeyDown(event, row, column)
        },
      } as HostProps, getCellProps?.(cell), extra)
    },
  }

  const renderedColumns = colVirtual.getVirtualItems()
  const totalWidth = colVirtual.getTotalSize()
  const emptyReason = noDataReason ?? (filterState.length || !disableGlobalFilter && globalQuery ? "Filtered" : "Empty")
  const noData = noDataText ?? (emptyReason === "Filtered" ? texts.noDataFiltered : texts.noData)
  const placeholder = loading && !rowCount && !alwaysShowBusyIndicator
  const Body = components?.Body
  const renderedRows = rowVirtual.getVirtualItems().map(item => {
    const row = rows[item.index]
    if (!row) return <div key={item.key} {...part("empty-row", "fiori-at-row")}
      data-alternate={alternateRowColor && item.index % 2 !== 0 || undefined}
      style={{ top: item.start - densityHeader, height: densityRow }}>
      {renderedColumns.map(col => <div key={col.key} className="fiori-at-cell" aria-hidden="true" style={cellStyle(col.index)} data-frozen={isFrozen(col.index) || undefined} />)}
    </div>
    const cells = new Map(row.getAllCells().map(cell => [cell.column.id, cell]))
    return <AnalyticalTableRow row={row} key={item.key}>
      {renderedColumns.map(col => {
        const cell = cells.get(ordered[col.index].id)
        if (!cell) return null
        const content = cellInfo(cell)
        const def = customColumns.get(cell.column.id)
        const fallback = def?.cell ?? tableOptions?.defaultColumn?.cell
        const group = cell.getIsGrouped()
        const repeat = cell.getIsPlaceholder()
        const custom = group ? def?.Grouped ?? fallback :
          repeat ? def?.RepeatedValue : cell.row.getIsGrouped() ? def?.Aggregated ?? def?.aggregatedCell ?? fallback : fallback
        const expand = cell.row.getIsExpanded()
        const toggleLabel = expand ? texts.collapseNode : texts.expandNode
        return <AnalyticalTableCell key={cell.id} cell={cell}>
          {group && <button {...part("group-toggle", "fiori-at-group-toggle")} type="button" title={toggleLabel}
            aria-label={toggleLabel} tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => toggleGroupRow(cell.row)}>
            <Icon icon={expand ? navigationDownArrow : navigationRightArrow} />
          </button>}
          {group && custom && <span {...part("hidden-text", "fiori-at-sr")} id={valueId(cell)} aria-hidden="true">{content.defaultContent}</span>}
          {(!repeat || custom) && <span {...part("cell-content", custom ? undefined : "fiori-at-ellipsis")} id={group && custom ? undefined : valueId(cell)}
            title={custom ? undefined : String(content.defaultContent ?? "")} aria-hidden={custom ? undefined : true}>
            {custom ? flexRender(custom, { ...cell.getContext(), ...content }) : content.defaultContent}
          </span>}
        </AnalyticalTableCell>
      })}
      {renderRowSubComponent && <div {...part("sub-component")} role="gridcell">
        {renderRowSubComponent({ ...info(null), row })}
      </div>}
    </AnalyticalTableRow>
  })
  return <Context.Provider value={context}>
    <div {...rootProps} data-slot="analytical-table" dir={direction} className={cn("fiori-at", className)} style={{ "--at-grid-height": `${densityHeader + bodyHeight + (footer ? densityHeader : 0)}px`, ...rootProps.style } as React.CSSProperties}
      ref={node => { root.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node }}>
      <div {...part("grid", "fiori-at-grid")} ref={grid} role={grouped ? "treegrid" : "grid"} aria-label={label} aria-labelledby={labelledBy}
        aria-describedby={describedBy} aria-description={[description, columns.some(column => column.interactiveElementName) && texts.moveToContent].filter(Boolean).join(" ") || undefined} aria-details={details} aria-rowcount={rowCount}
        aria-colcount={ordered.length} aria-multiselectable={false} data-fills-width={totalWidth >= viewport.width || undefined}
        data-grouped={grouped || undefined}
        tabIndex={!loading && !nav.active && rowCount ? 0 : -1} onFocus={nav.onGridFocus}
        style={{ height: densityHeader + bodyHeight + (footer ? densityHeader : 0),
          scrollPaddingInlineStart: freezeActive ? frozenSize : undefined,
          "--at-header-height": `${densityHeader}px`, "--at-row-height": `${densityRow}px`,
          "--at-content-height": `${bodyHeight + densityHeader}px`,
        } as React.CSSProperties}>
        <div {...part("header-row", "fiori-at-header-row")} role="row" aria-rowindex={1} style={{ width: totalWidth }}>
          {renderedColumns.map(item => {
            const column = ordered[item.index]
            const header = headersById.get(column.id)
            if (!header) return null
            const def = definition(column)
            const frozen = isFrozen(item.index)
            const configuredPin = pinning.start.includes(column.id)
            const extra = menuItems.get(column.id) ?? []
            const content = flexRender(def.header, { ...header.getContext(), ...info(typeof def.header === "string" ? def.header : column.id) }) ?? column.id
            const sorted = sortDirection(column)
            const filtered = isFiltered(column)
            const sortableHeader = column.getCanSort()
            const filterableHeader = column.getCanFilter()
            const hasActions = hasColumnActions(column)
            const open = openColumn === column.id
            const freeze = () => {
              toggleStickyColumn(column.id)
              onStickyColumnsChange?.({ column, sticky: !configuredPin,
                stickyColumns: configuredPin ? pinning.start.filter(key => key !== column.id) : [...pinning.start, column.id] })
            }
            const close = () => setOpenColumn(undefined)
            const restoreFocus = (event: Event) => {
              event.preventDefault()
              grid.current?.ownerDocument.getElementById(headerId(column))?.focus({ preventScroll: true })
            }
            const sortItems: { id: "asc" | "desc" | "clear"; text: string; icon: FioriIconData }[] = sortableHeader ? [
              { id: sorted === "asc" ? "clear" : "asc", text: sorted === "asc" ? texts.clearSorting : texts.sortAscending, icon: sorted === "asc" ? decline : sortAscending },
              { id: sorted === "desc" ? "clear" : "desc", text: sorted === "desc" ? texts.clearSorting : texts.sortDescending, icon: sorted === "desc" ? decline : sortDescending },
            ] : []
            const filterId = `${headerId(column)}-filter`
            const filterText = filterValue(column)
            const fieldRef = React.createRef<HTMLInputElement>()
            // DefaultFilterComponent forwards the label as the input's accessible name.
            const defaultFilter = <div aria-invalid="false">
              <Input ref={fieldRef} aria-label={texts.filter} aria-invalid="false" value={String(filterText ?? "")}
                onChange={event => updateFilter(column, event.target.value || undefined)}
                icon={filterText ? <InputIcon><button type="button" tabIndex={-1} aria-label={texts.clearFilter}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => { updateFilter(column, undefined); fieldRef.current?.focus() }}><Icon icon={decline} /></button></InputIcon> : undefined} />
            </div>
            const sortPopup = hasActions && open ? <AnalyticalHeaderMenu
              id={`${headerId(column)}-menu`} anchorId={headerId(column)} rtl={rtl} close={close}
              align={def.hAlign === "Center" ? "center" : def.hAlign === "End" || def.hAlign === (rtl ? "Left" : "Right") ? "end" : "start"}
              className={cn("fiori-at-sort-popup", classNames?.["header-menu"])} activeText={texts.menuItemActive}
              beforeFilter={sortItems.map(item => ({ ...item, run: () => { sortColumn(column, item.id); close() } }))}
              afterFilter={[
                ...(column.getCanGroup() ? [{ id: "group", icon: group2,
                  text: column.getIsGrouped() ? texts.ungroup : texts.group, run: () => toggleGroup(column) }] : []),
                ...extra.map(item => ({ ...item, run: () => { item.onSelect(); close() } })),
                ...(canFreeze(column) ? [{ id: "freeze", icon: configuredPin ? pushpinOff : pushpinOn,
                  text: configuredPin ? texts.unfreezeColumn : texts.freezeColumn, run: () => { freeze(); close() } }] : []),
              ]}
              // UI5 ListItemTemplate.js gives the .ui5-li-content div an ID. Keeping an ID on
              // the matching layout box lets Chromium expose it around the WCR ColumnHeaderModal FlexBox.
              filter={filterableHeader ? { text: texts.filter, content:
                <div {...part("header-filter", "fiori-li__content fiori-at-header-filter")} id={`${filterId}-content`}>
                  <div className="fiori-at-filter-content">
                    <Icon icon={filterIcon} />
                    <div className="fiori-at-filter-label" id={filterId}><span>{texts.filter}</span></div>
                    {def.Filter ? flexRender(def.Filter, { ...info(defaultFilter), column, value: filterText,
                      setFilter: value => updateFilter(column, value), accessibleNameRef: filterId }) : defaultFilter}
                  </div>
                </div>,
              } : undefined} /> : null
            const host = <div {...context.getHeaderProps(header)}>
              {/* WCR ColumnHeader/index.js: classes.header contains the title renderer and
                  classes.iconContainer as siblings inside the positioned content wrapper. */}
              <div {...part("header-content", "fiori-at-header-content")} style={{ textAlign: def.hAlign?.toLowerCase() as React.CSSProperties["textAlign"] }}>
                <div className="fiori-at-header-text" title={def.headerTooltip ?? (typeof content === "string" ? content : undefined)}>{content}</div>
                <div className="fiori-at-header-icons">
                  {filtered && <Icon {...part("header-indicator")} icon={filterIcon} />}
                  {sorted && <Icon {...part("header-indicator")} icon={sorted === "asc" ? sortAscending : sortDescending} />}
                  {column.getIsGrouped() && <Icon {...part("header-indicator")} icon={group2} />}
                </div>
              </div>
              {sortPopup}
            </div>
            return <div className="fiori-at-header-position" key={column.id} style={cellStyle(item.index)}
              data-frozen={frozen || undefined} data-frozen-edge={frozen && item.index === pinnedCount - 1 || undefined}>
              {!hasActions && (canFreeze(column) || extra.length > 0) ? <Menu dir={rtl ? "rtl" : "ltr"} modal={false}
                open={openColumn === column.id} onOpenChange={open => setOpenColumn(open ? column.id : undefined)}>
                {host}
                <MenuTrigger aria-hidden="true" tabIndex={-1} className="fiori-at-menu-anchor" />

                <MenuContent data-slot="analytical-table-header-menu" id={`${headerId(column)}-menu`} aria-labelledby={headerId(column)} className={classNames?.["header-menu"]} onCloseAutoFocus={restoreFocus}>
                  {extra.map(menuItem => <MenuItem key={menuItem.id} onSelect={menuItem.onSelect}>{menuItem.text}</MenuItem>)}
                  {canFreeze(column) && <MenuItem icon={configuredPin ? pushpinOff : pushpinOn} onSelect={freeze}>{configuredPin ? texts.unfreezeColumn : texts.freezeColumn}</MenuItem>}
                </MenuContent>
              </Menu> : host}
              {isResizable(column) && <div {...part("resizer", "fiori-at-resizer")} role="separator" aria-hidden="true"
                data-column={column.id} data-dragging={guide?.id === column.id || undefined}
                data-last={item.index === ordered.length - 1 || undefined}
                style={guide?.id === column.id ? { transform: `translateX(${guide.delta * (rtl ? -1 : 1)}px)` } : undefined}
                onPointerDown={event => onResizeStart(event, column)} onDoubleClick={event => autoResize(event, column)} />}
            </div>
          })}
        </div>
        {rowCount ? <div {...part("body", "fiori-at-body")} role="rowgroup" tabIndex={-1}>
          <div className="fiori-at-body-content" style={{ width: totalWidth, height: rowVirtual.getTotalSize() - densityHeader }}>
            {Body ? <Body>{renderedRows}</Body> : renderedRows}
          </div>
        </div> : <div role="row" tabIndex={loading ? -1 : 0} className="fiori-at-empty" style={{ height: bodyHeight, width: totalWidth || undefined }}>
          <div {...part(placeholder ? "loading" : "no-data", placeholder ? "fiori-at-placeholder" : "fiori-at-no-data")} role="gridcell">
            {placeholder ? <div role="progressbar" title={texts.pleaseWait} aria-valuetext={texts.busy}>
              {LoadingComponent ? <LoadingComponent {...info(null)} /> : Array.from({ length: minRows }, (_, index) =>
                <div data-slot="analytical-table-placeholder-row" key={index}>
                  {ordered.map(column => <div key={column.id} style={{ width: column.getSize() }}><span /></div>)}
                </div>)}
            </div> : NoDataComponent ? <NoDataComponent {...info(noData)} noDataText={noData} noDataReason={emptyReason} /> : noData}
          </div>
        </div>}
        {footer && <div {...part("footer-row", "fiori-at-footer")} role="row" style={{ width: totalWidth }}>
          {renderedColumns.map(item => {
            const header = headersById.get(ordered[item.index].id)
            return header && <div {...part("footer-cell", "fiori-at-cell")} key={header.id} role="gridcell"
              aria-colindex={item.index + 1} style={cellStyle(item.index)}>
              {flexRender(definition(header.column).footer, { ...header.getContext(), ...info(null) })}
            </div>
          })}
        </div>}
      </div>
      {loading && (rowCount > 0 || alwaysShowBusyIndicator) &&
        <BusyIndicator active delay={loadingDelay} className={cn("fiori-at-busy", classNames?.loading)} aria-label={texts.busy} />}
      {visibleRowCountMode === "Interactive" && <div {...part("vertical-resizer", "fiori-at-vertical-resizer")}
        role="separator" aria-hidden="true" title={texts.dragToResize} onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return
          const node = event.currentTarget
          const start = event.clientY
          node.setPointerCapture(event.pointerId)
          node.onpointermove = move => node.style.setProperty("--at-row-delta", `${move.clientY - start}px`)
          const finish = (end?: number) => {
            node.onpointermove = node.onpointerup = node.onpointercancel = node.onlostpointercapture = null
            node.style.removeProperty("--at-row-delta")
            if (end !== undefined) setVisibleRows(Math.max(1, Math.floor((bodyHeight + end - start) / densityRow)))
          }
          node.onpointerup = end => finish(end.clientY)
          node.onpointercancel = node.onlostpointercapture = () => finish()
        }} />}
    </div>
      {announcementActive && <span {...part("announcement", "fiori-at-sr")} role="alert" aria-live="polite" aria-atomic="true">
        <span key={announcement.revision}>{announcement.text}</span>
      </span>}
      {/* WCR index.js mounts the descriptions alongside the grid. Keep them available for name references. */}
      {[texts.selectRow, texts.unselectRow, texts.selectAll, texts.unselectAll, texts.expandRow, texts.collapseRow, texts.emptyCell].map((text, index) =>
        <span {...part("hidden-text", "fiori-at-sr")} key={index} id={index === 6 ? emptyId : `${id}-hint-${index}`}>{text}</span>)}
  </Context.Provider>
}

function keepIndexes(range: number[], keep: number[]) {
  return [...new Set([...range, ...keep])].sort((a, b) => a - b)
}
