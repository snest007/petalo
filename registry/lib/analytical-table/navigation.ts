// Derived from WCR 2.28.2 AnalyticalTable/hooks/useKeyboardNavigation.js and pluginHooks/useF2CellEdit.js.
// © SAP SE or an SAP affiliate company and UI5 contributors. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

export type Position = { row: number; column: number }
const navigationKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"])
const focusable = "a[href],button,input,select,textarea,summary,[tabindex],[contenteditable=true]"

export function useGridNavigation(
  grid: React.RefObject<HTMLDivElement | null>,
  rowCount: number,
  columnCount: number,
  rowHeight: number,
  pageSize: number,
  rtl: boolean,
  reveal: (position: Position) => void,
) {
  const [active, setActive] = React.useState<Position>()
  const editing = React.useRef<HTMLElement | null>(null)
  const pending = React.useRef<Position>(null)
  const savedTabIndexes = React.useRef(new WeakMap<HTMLElement, string | null>())
  const current = active && active.row <= rowCount && active.column < columnCount ? active : undefined
  const isActive = (row: number, column: number) => current?.row === row && current?.column === column
  function target({ row, column }: Position) {
    return grid.current?.querySelector<HTMLElement>(`[data-grid-row="${row}"][data-grid-column="${column}"]`)
  }
  function setDescendants(host: HTMLElement, enabled: boolean) {
    const focusables = [...host.querySelectorAll<HTMLElement>(focusable)]
    for (const element of focusables) {
      if (!savedTabIndexes.current.has(element)) savedTabIndexes.current.set(element, element.getAttribute("tabindex"))
      const original = savedTabIndexes.current.get(element)
      if (!enabled && element.tabIndex !== -1) element.tabIndex = -1
      if (enabled && original === null) element.removeAttribute("tabindex")
      if (enabled && original != null) element.setAttribute("tabindex", original)
    }
    return focusables.filter(element => element.tabIndex >= 0 && !element.matches(":disabled,[hidden]") && element.getClientRects().length > 0)
  }

  React.useLayoutEffect(() => {
    const viewport = grid.current
    if (!viewport) return
    const sync = () => viewport.querySelectorAll<HTMLElement>("[data-grid-column]").forEach(host => {
      if (host !== editing.current) setDescendants(host, false)
    })
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(viewport, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex"] })
    return () => observer.disconnect()
  }, [grid])

  React.useLayoutEffect(() => {
    if (pending.current) {
      const cell = target(pending.current)
      if (cell) {
        cell.focus({ preventScroll: true })
        pending.current = null
      }
    }
  })

  function focusCell(row: number, column: number) {
    if (row < 0 || row > rowCount || column < 0 || column >= columnCount) return
    const position = { row, column }
    pending.current = position
    reveal(position)
    setActive(position)
  }
  function onHostFocus(event: React.FocusEvent<HTMLDivElement>, row: number, column: number) {
    if (event.target === event.currentTarget && !isActive(row, column)) setActive({ row, column })
  }
  function onGridFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && columnCount && rowCount) focusCell(0, 0)
  }
  function onHostBlur(event: React.FocusEvent<HTMLDivElement>) {
    const host = event.currentTarget
    if (editing.current === host && !host.contains(event.relatedTarget)) {
      editing.current = null
      setDescendants(host, false)
      host.tabIndex = 0
    }
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>, row: number, column: number) {
    const host = event.currentTarget
    if (event.key === "F2") {
      event.preventDefault()
      if (editing.current === host) {
        editing.current = null
        setDescendants(host, false)
        host.tabIndex = 0
        host.focus()
      } else {
        const [first] = setDescendants(host, true)
        if (first) {
          editing.current = host
          host.tabIndex = -1
          first.focus()
        } else {
          setDescendants(host, false)
        }
      }
      return
    }
    if (editing.current === host || event.target !== host || !navigationKeys.has(event.key)) return
    event.preventDefault()
    const pageTop = Math.min(rowCount, Math.floor((grid.current?.scrollTop ?? 0) / rowHeight) + 1)
    const pageBottom = Math.min(rowCount, pageTop + pageSize - 1)
    switch (event.key) {
      case "ArrowLeft": return focusCell(row, column + (rtl ? 1 : -1))
      case "ArrowRight": return focusCell(row, column + (rtl ? -1 : 1))
      case "ArrowDown": return focusCell(row + 1, column)
      case "ArrowUp": return focusCell(row - 1, column)
      case "Home": return focusCell(event.ctrlKey ? 0 : row, 0)
      case "End": return focusCell(event.ctrlKey ? rowCount : row, columnCount - 1)
      case "PageUp": return focusCell(row <= 1 ? 0 : row <= pageTop ? Math.max(1, row - pageSize) : pageTop, column)
      case "PageDown": return focusCell(row === 0 ? 1 : row >= pageBottom ? Math.min(rowCount, row + pageSize) : pageBottom, column)
    }
  }

  return { active: current, isActive, focusCell, onHostFocus, onHostBlur, onGridFocus, onKeyDown }
}
