"use client"

// Derived from WCR 2.28.2 ColumnHeaderModal.js and UI5 PopupTemplate.js,
// ListTemplate.js and ListItemStandardTemplate.js. SPDX-License-Identifier: Apache-2.0.
import * as React from "react"
import { Icon } from "@/components/ui/icon"
import type { FioriIconData } from "@/lib/fiori-icons"

export type AnalyticalMenuAction = {
  id: string
  text: string
  icon?: FioriIconData
  run: () => void
}

type Props = {
  id: string
  anchorId: string
  rtl: boolean
  align: "start" | "center" | "end"
  className?: string
  beforeFilter: AnalyticalMenuAction[]
  afterFilter: AnalyticalMenuAction[]
  filter?: { text: string; content: React.ReactNode }
  activeText: string
  close: () => void
}

const editorElements = "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]"
const items = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[role="menuitem"]')]

function MenuAction({ id, action, activeText }: { id: string; action: AnalyticalMenuAction; activeText: string }) {
  return <li role="menuitem" tabIndex={-1} className="fiori-li fiori-at-menu-item" data-actionable="" data-has-border="" data-menu-action=""
    aria-labelledby={`${id}-text ${id}-active`} aria-describedby={`${id}-desc`} onClick={action.run}>
    {action.icon && <Icon className="fiori-li__icon" icon={action.icon} />}
    <span role="presentation" className="fiori-at-menu-item-text">{action.text}</span>
    <span role="presentation" className="fiori-at-menu-active">{activeText}</span>
    <span id={`${id}-text`} hidden>{action.text}</span>
    <span id={`${id}-active`} hidden>{activeText}</span>
    <span id={`${id}-desc`} hidden />
  </li>
}

export function AnalyticalHeaderMenu({ id, anchorId, rtl, align, className, beforeFilter, afterFilter, filter, activeText, close }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef(close)
  closeRef.current = close
  React.useLayoutEffect(() => {
    const popup = ref.current
    const anchor = popup?.ownerDocument.getElementById(anchorId)
    if (!popup || !anchor) return
    const win = popup.ownerDocument.defaultView!
    const doc = popup.ownerDocument
    function position() {
      if (!popup || !anchor) return
      const rect = anchor.getBoundingClientRect()
      const { width, height } = popup.getBoundingClientRect()
      const start = align === "center" ? rect.left + (rect.width - width) / 2 :
        (align === "end") !== rtl ? rect.right - width : rect.left
      const top = rect.bottom + height <= win.innerHeight || rect.top < height ? rect.bottom : rect.top - height
      popup.style.left = `${Math.max(0, Math.min(start, win.innerWidth - width))}px`
      popup.style.top = `${Math.max(0, top)}px`
    }
    popup.showPopover()
    position()
    items(popup)[0]?.focus({ preventScroll: true })
    function outside(event: Event) {
      if (event.target instanceof Node && !popup!.contains(event.target) && !anchor!.contains(event.target)) closeRef.current()
    }
    doc.addEventListener("pointerdown", outside, true)
    doc.addEventListener("focusin", outside, true)
    const observer = new ResizeObserver(position)
    observer.observe(anchor)
    observer.observe(popup)
    win.addEventListener("resize", position)
    win.addEventListener("scroll", position, true)
    return () => {
      doc.removeEventListener("pointerdown", outside, true)
      doc.removeEventListener("focusin", outside, true)
      observer.disconnect()
      win.removeEventListener("resize", position)
      win.removeEventListener("scroll", position, true)
      if (popup.matches(":popover-open")) popup.hidePopover()
      if (popup.contains(doc.activeElement) || doc.activeElement === doc.body) anchor.focus({ preventScroll: true })
    }
  }, [anchorId, rtl, align])

  const dismiss = (event: React.KeyboardEvent) => {
    event.preventDefault()
    close()
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const row = target.closest<HTMLElement>('[role="menuitem"]')
    if (event.key === "Escape" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      dismiss(event)
      return
    }
    if (!row) return
    if (event.key === "Tab") {
      const editor = row.querySelector<HTMLElement>(editorElements)
      if (target === row && editor && !event.shiftKey) {
        event.preventDefault()
        editor.focus({ preventScroll: true })
      } else if (target !== row && event.shiftKey) {
        event.preventDefault()
        row.focus({ preventScroll: true })
      } else if (target === row || !target.nextElementSibling) {
        close()
      }
      return
    }
    if (event.key === "Enter") {
      if (row.hasAttribute("data-menu-action") && target === row) {
        event.preventDefault()
        row.click()
      } else dismiss(event)
      return
    }
    if (target !== row) return
    if (event.key === " ") event.preventDefault()
    const entries = items(event.currentTarget)
    const index = entries.indexOf(row)
    const next = event.key === "ArrowDown" ? Math.min(index + 1, entries.length - 1) :
      event.key === "ArrowUp" ? Math.max(0, index - 1) : event.key === "Home" ? 0 : event.key === "End" ? entries.length - 1 : -1
    if (next >= 0) {
      event.preventDefault()
      entries[next]?.focus({ preventScroll: true })
    }
  }
  const guard = <span className="fiori-at-menu-sentinel" tabIndex={-1} />
  const renderAction = (action: AnalyticalMenuAction) => <MenuAction key={action.id} id={`${id}-${action.id}`} action={action} activeText={activeText} />
  return <div ref={ref} id={id} tabIndex={-1} popover="manual" data-analytical-table-popup=""
    data-slot="analytical-table-header-menu" className={className} onKeyDown={onKeyDown}
    onKeyUp={event => {
      event.stopPropagation()
      const target = event.target as HTMLElement
      if (event.key === " " && target.hasAttribute("data-menu-action")) {
        event.preventDefault()
        target.click()
      }
    }}
    onClick={event => event.stopPropagation()}>
    {/* PopupTemplate.js wraps the list in a section with focus sentinels.
        ListTemplate.js nests .ui5-list-root, BusyIndicator and .ui5-list-container
        around the menu and its focus areas. */}
    <section>
      {guard}
      <div role="generic" className="fiori-at-menu-container">
        <div role="generic" className="fiori-at-menu-container">
          <div role="generic" className="fiori-at-menu-container">
            <div role="generic" className="fiori-at-menu-container">
              {guard}
              <ul role="menu">
                {beforeFilter.map(renderAction)}
                {filter && <li role="menuitem" tabIndex={-1} className="fiori-li fiori-at-menu-item" data-has-border=""
                  aria-labelledby={`${id}-filter-active`} aria-describedby={`${id}-filter-desc`}>
                  {filter.content}
                  <span role="presentation" className="fiori-at-menu-active">{`${filter.text} ${activeText}`}</span>
                  <span id={`${id}-filter-active`} hidden>{`${filter.text} ${activeText}`}</span>
                  <span id={`${id}-filter-desc`} hidden />
                </li>}
                {afterFilter.map(renderAction)}
              </ul>
              {guard}
            </div>
          </div>
        </div>
      </div>
      {guard}
    </section>
  </div>
}
