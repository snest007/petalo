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
  f2CellEdit = false,
) {
  const [active, setActive] = React.useState<Position>()
  const editing = React.useRef<HTMLElement | null>(null)
  const pending = React.useRef<Position>(null)
  const lastBodyRow = React.useRef<number>(null)
  const savedTabIndexes = React.useRef(new WeakMap<HTMLElement, string | null>())
  const current = active && active.row <= rowCount && active.column < columnCount ? active : undefined
  const isActive = (row: number, column: number) => current?.row === row && current?.column === column
  function target({ row, column }: Position) {
    return grid.current?.querySelector<HTMLElement>(`[data-grid-row="${row}"][data-grid-column="${column}"]`)
  }
  function setDescendants(host: HTMLElement, enabled: boolean) {
    const focusables = [...host.querySelectorAll<HTMLElement>(focusable)]
      .filter(element => !element.closest("[data-analytical-table-popup]"))
    const available: HTMLElement[] = []
    for (const element of focusables) {
      if (!savedTabIndexes.current.has(element)) savedTabIndexes.current.set(element, element.getAttribute("tabindex"))
      const original = savedTabIndexes.current.get(element)
      if (!enabled || element.matches(":disabled") || element.closest("[hidden],[inert],[aria-hidden=true]") ||
        element.getClientRects().length === 0) {
        if (element.tabIndex !== -1) element.tabIndex = -1
        continue
      }
      if (element.getAttribute("tabindex") !== original) {
        if (original === null) element.removeAttribute("tabindex")
        else if (original !== undefined) element.setAttribute("tabindex", original)
      }
      if (element.tabIndex >= 0) available.push(element)
    }
    return available
  }

  function setGridEditors(enabled: boolean, except?: HTMLElement) {
    if (!f2CellEdit) return
    // useF2CellEdit.useCallbackRef enables the registered editors across the
    // mounted body, so Tab can continue into an editor in a different cell.
    grid.current?.querySelectorAll<HTMLElement>("[data-grid-editor]").forEach(host => {
      if (host !== except) setDescendants(host, enabled)
    })
  }

  function exitEditor(host: HTMLElement) {
    editing.current = null
    setDescendants(host, false)
    setGridEditors(false, host)
    host.tabIndex = 0
    host.focus({ preventScroll: true })
  }

  React.useLayoutEffect(() => {
    const viewport = grid.current
    if (!viewport) return
    const sync = () => viewport.querySelectorAll<HTMLElement>("[data-grid-column]").forEach(host => {
      if (host !== editing.current) setDescendants(host, f2CellEdit && !!editing.current && host.hasAttribute("data-grid-editor"))
    })
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(viewport, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex"] })
    return () => observer.disconnect()
  }, [grid, f2CellEdit])

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
    if (row > 0) lastBodyRow.current = row
    if ((event.target === event.currentTarget || editing.current === event.currentTarget) && !isActive(row, column)) {
      setActive({ row, column })
    }
  }
  function onGridFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && columnCount && rowCount) focusCell(0, 0)
  }
  function onHostBlur(event: React.FocusEvent<HTMLDivElement>) {
    const host = event.currentTarget
    if (editing.current !== host || host.contains(event.relatedTarget)) return
    const next = f2CellEdit && event.relatedTarget instanceof Element ?
      event.relatedTarget.closest<HTMLElement>("[data-grid-editor]") : null
    if (next && grid.current?.contains(next) && next !== event.relatedTarget) {
      editing.current = next
      next.tabIndex = -1
      return
    }
    editing.current = null
    setDescendants(host, false)
    setGridEditors(false, host)
    host.tabIndex = current?.row === Number(host.dataset.gridRow) && current.column === Number(host.dataset.gridColumn) ? 0 : -1
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>, row: number, column: number) {
    const host = event.currentTarget
    const targetElement = event.target as Element
    if (targetElement.closest("[data-analytical-table-popup]")) return
    // useF2CellEdit.js toggles the owned cell and its focusable content.
    if ((event.key === "F2" || event.key === "Escape") && editing.current === host) {
      event.preventDefault()
      exitEditor(host)
      return
    }
    if (event.key === "F2") {
      if (f2CellEdit && event.target !== host) {
        event.preventDefault()
        exitEditor(host)
        return
      }
      const [first] = setDescendants(host, true)
      if (first) {
        event.preventDefault()
        editing.current = host
        host.tabIndex = -1
        setGridEditors(true, host)
        first.focus()
      } else {
        setDescendants(host, false)
      }
      return
    }
    const pageTop = Math.min(rowCount, Math.floor((grid.current?.scrollTop ?? 0) / rowHeight) + 1)
    if (f2CellEdit && event.key === "Tab" && event.target === host && rowCount) {
      // WCR moves between the header and the last focused body row in this
      // column. If that row left the rendered range, use the first visible row.
      if (event.shiftKey && row > 0) {
        event.preventDefault()
        lastBodyRow.current = row
        return focusCell(0, column)
      }
      if (!event.shiftKey && row === 0) {
        event.preventDefault()
        const remembered = lastBodyRow.current ?? 1
        return focusCell(target({ row: remembered, column }) ? remembered : Math.max(1, pageTop), column)
      }
    }
    if (editing.current === host || event.target !== host || !navigationKeys.has(event.key)) return
    event.preventDefault()
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

  return { active: current, isActive, isEditing: editing.current !== null, focusCell, onHostFocus, onHostBlur, onGridFocus, onKeyDown }
}
