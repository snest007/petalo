// Derived from UI5 Web Components for React 2.28.2, AnalyticalTable/hooks/useDynamicColumnWidths.js.
// © SAP SE or an SAP affiliate company and UI5 contributors. SPDX-License-Identifier: Apache-2.0

export type ScaleWidthMode = "Default" | "Smart" | "Grow"

type WidthInput = {
  id: string
  minWidth?: number
  maxWidth?: number
  width?: number
  header: string
  sample: string[]
  headerString?: string
  cellString?: string
}

export const minimumColumnWidth = 60 // WCR defaults/Column/index.js DEFAULT_COLUMN_WIDTH.
const maximumGrowWidth = 700
const padding = 18 // WCR CELL_PADDING_PX includes cell padding, border and rounding buffer.

export function clampWidth(width: number, min = minimumColumnWidth, max = Infinity) {
  return Math.max(min, Math.min(max, width))
}

export function measureWidths(inputs: WidthInput[], width: number, mode: ScaleWidthMode, node: HTMLElement | null) {
  const css = node ? getComputedStyle(node) : undefined
  const canvas = node?.ownerDocument.createElement("canvas").getContext("2d")
  function measure(text: string, header: boolean) {
    if (!canvas || !css) return 0
    const family = header ? css.getPropertyValue("--fiori-wcr-x-analyticaltable-headerfontfamily").trim() : css.fontFamily
    canvas.font = `${css.fontSize} ${family || css.fontFamily}`
    return Math.ceil(canvas.measureText(text).width) + padding
  }
  const grow = mode === "Grow"
  const columns = inputs.map(input => {
    const floor = input.minWidth ?? minimumColumnWidth
    const ceiling = input.maxWidth ?? (grow ? maximumGrowWidth : Infinity)
    const header = Math.max(minimumColumnWidth, measure(input.headerString ?? input.header, true))
    const widths = input.sample.map(value => value ? measure(value, false) : 0)
    const content = input.cellString ? measure(input.cellString, false) :
      grow ? Math.max(0, ...widths) : widths.reduce((sum, size) => sum + size, 0) / (widths.length || 1)
    return { ...input, ceiling, floor, header, content, size: 0, shrinkFloor: floor }
  })
  const flexible = columns.filter(column => column.width === undefined)
  const total = () => columns.reduce((sum, column) => sum + column.size, 0)
  if (mode === "Default") {
    const fixed = columns.filter(column => column.width !== undefined)
    for (const column of fixed) column.size = clampWidth(column.width!, column.floor, column.ceiling)
    const share = (width - total()) / (flexible.length || 1)
    for (const column of flexible) column.size = clampWidth(share, column.floor, column.ceiling)
  } else {
    // calculateSmartAndGrowColumns: content-first weighted allocation, then distribute surplus.
    const contentFirst = flexible.filter(column => column.minWidth === undefined && column.content > column.header)
    const contentTotal = contentFirst.reduce((sum, column) => sum + column.content, 0)
    for (const column of columns) {
      column.shrinkFloor = clampWidth(column.header, column.floor, column.ceiling)
      if (grow) column.size = clampWidth(column.width ?? Math.max(column.content, column.header), column.floor, column.ceiling)
      else if (!contentFirst.includes(column)) column.size = clampWidth(column.width ?? column.header, column.floor, column.ceiling)
    }
    const available = width - total()
    if (!grow) for (const column of contentFirst) {
      const share = available > 0 ? Math.min(column.content, available * column.content / contentTotal) : 0
      column.size = clampWidth(Math.max(share, column.header), column.floor, column.ceiling)
    }
  }

  // Water-fill constrained columns. Stop when all flexible columns have reached their bounds.
  const shrinking = total() > width
  if (!grow || !shrinking) {
    let available = flexible.filter(column => shrinking ? column.size > column.shrinkFloor : column.size < column.ceiling)
    while (available.length) {
      const share = (width - total()) / available.length
      if (Math.abs(share) < 0.001) break
      for (const column of available) column.size = clampWidth(column.size + share, shrinking ? column.shrinkFloor : column.floor, column.ceiling)
      available = available.filter(column => shrinking ? column.size > column.shrinkFloor : column.size < column.ceiling)
    }
  }
  if (!grow && total() <= width + 0.5) {
    // fitColumnWidthsToWholePixels: give the remainder to the last unconstrained column.
    for (const column of columns) column.size = Math.floor(column.size)
    const lastFlexible = flexible.filter(column => column.maxWidth === undefined).at(-1)
    const remainder = Math.round(width) - total()
    if (lastFlexible && remainder > 0) lastFlexible.size += remainder
  }
  return Object.fromEntries(columns.map(column => [column.id, column.size]))
}
