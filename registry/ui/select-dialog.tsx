"use client"

// Derived from UI5 Web Components for React 2.28.2 SelectDialog, © SAP SE or an
// SAP affiliate company and contributors. SPDX-License-Identifier: Apache-2.0.
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, type DialogContentProps } from "@/components/ui/dialog"
import { List, ListItemStandard, type ListProps } from "@/components/ui/list"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { decline, search } from "@/lib/fiori-icons"
import { collatorIncludes, useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { cn } from "@/lib/utils"

type SelectDialogItem = { value: string; text: string; description?: string; disabled?: boolean }
type SelectDialogSlot = "root" | "header" | "title" | "search" | "clear" | "body" | "selectionCount" | "list" | "item" | "footer" | "confirm" | "cancel"
type SelectDialogTexts = {
  cancel: string
  clear: string
  search: string
  select: string
  selected: string
  selectedItems: (count: number) => string
  clearSearch: string
  header: string
  body: string
  footer: string
}
type SelectDialogItemInfo = {
  item: SelectDialogItem
  selected: boolean
  locale: string
  defaultContent: string
}
type SelectDialogProps = Pick<DialogContentProps, "id" | "style" | "dir" | "className" | "portal" | "aria-label" | "aria-describedby" | "aria-description"> & {
  headerText: string
  items: readonly SelectDialogItem[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  selectionMode?: "single" | "multiple"
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: readonly string[]) => void
  searchValue?: string
  defaultSearchValue?: string
  onSearchValueChange?: (value: string) => void
  /** Search submission. When present, the caller supplies the resulting items. */
  onSearch?: (query: string) => void
  onSearchReset?: (previous: string) => void
  onConfirm?: (selected: readonly string[]) => void
  onCancel?: () => void
  onClear?: (previous: readonly string[]) => void
  rememberSelections?: boolean
  showClearButton?: boolean
  headerTextAlignCenter?: boolean
  numberOfSelectedItems?: number
  searchPlaceholder?: string
  confirmButtonText?: string
  growing?: ListProps["growing"]
  onLoadMore?: () => void
  locale?: string
  texts?: Partial<SelectDialogTexts>
  /** Experimental. Style the owned semantic parts. */
  classNames?: Partial<Record<SelectDialogSlot, string>>
  /** Experimental. Render row text content inside the owned List item. */
  renderItem?: (info: SelectDialogItemInfo) => React.ReactNode
  /** Experimental. Decorative styling and a click observer on the owned List item. */
  getItemProps?: (info: SelectDialogItemInfo) => React.ComponentProps<"li">
}

const defaults: SelectDialogTexts = {
  cancel: "Cancel", // WCR CANCEL
  clear: "Clear", // WCR CLEAR
  search: "Search", // WCR SEARCH
  select: "Select", // WCR SELECT
  selected: "Selected", // WCR SELECTED
  selectedItems: count => `Selected Items ${count}`, // WCR SELECTED_ITEMS
  clearSearch: "Clear", // UI5 INPUT_CLEAR_ICON_ACC_NAME
  header: "Header", // UI5 DIALOG_HEADER_ARIA_LABEL
  body: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  footer: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
}
const textKeys = {
  cancel: "wcr:CANCEL", clear: "wcr:CLEAR", search: "wcr:SEARCH", select: "wcr:SELECT",
  selected: "wcr:SELECTED", selectedItems: "wcr:SELECTED_ITEMS", clearSearch: "INPUT_CLEAR_ICON_ACC_NAME",
  header: "DIALOG_HEADER_ARIA_LABEL", body: "DIALOG_CONTENT_ARIA_LABEL", footer: "DIALOG_FOOTER_ARIA_LABEL",
}
const emptyValue: readonly string[] = []
const supportedRowProps = new Set(["className", "style", "onClick"])
declare const process: { env: { NODE_ENV?: string } }

function SelectDialog({
  headerText, items, open, defaultOpen = false, onOpenChange, selectionMode = "single",
  value, defaultValue = emptyValue, onValueChange, searchValue, defaultSearchValue = "",
  onSearchValueChange, onSearch, onSearchReset, onConfirm, onCancel, onClear,
  rememberSelections = false, showClearButton, headerTextAlignCenter, numberOfSelectedItems,
  searchPlaceholder, confirmButtonText, growing, onLoadMore, locale: localeProp, texts: overrides,
  className, classNames, dir, portal = true, renderItem, getItemProps, ...props
}: SelectDialogProps) {
  const { locale, dir: localeDir, localized, hasProvider } = useFioriLocale(localeProp)
  const texts = useFioriTexts(defaults, textKeys, overrides, localeProp)
  const [openState, setOpen] = React.useState(defaultOpen)
  const [valueState, setValue] = React.useState(defaultValue)
  const [searchState, setSearch] = React.useState(defaultSearchValue)
  const [announcement, setAnnouncement] = React.useState({ count: 0, sequence: 0 })
  const surface = React.useRef<HTMLDivElement>(null)
  const searchField = React.useRef<HTMLInputElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const effectiveOpen = open ?? openState
  const selected = value ?? valueState
  const query = searchValue ?? searchState
  const multi = selectionMode === "multiple"
  const count = numberOfSelectedItems ?? selected.length
  const formatNumber = new Intl.NumberFormat(locale)
  const visible = onSearch ? items : items.filter(item => collatorIncludes(item.text, query, locale) ||
    (item.description !== undefined && collatorIncludes(item.description, query, locale)))

  function updateValue(next: readonly string[]) {
    if (value === undefined) setValue(next)
    onValueChange?.(next)
  }

  function updateQuery(next: string) {
    if (searchValue === undefined) setSearch(next)
    onSearchValueChange?.(next)
  }

  function close(cancel: boolean) {
    if (cancel) onCancel?.()
    if (open === undefined) setOpen(false)
    onOpenChange?.(false)
  }

  // WCR SelectDialog.handleAfterClose resets search and optionally selection.
  const previouslyOpen = React.useRef(effectiveOpen)
  React.useEffect(() => {
    const wasOpen = previouslyOpen.current
    previouslyOpen.current = effectiveOpen
    if (!wasOpen || effectiveOpen) return
    setAnnouncement({ count: 0, sequence: 0 })
    onSearchReset?.(query)
    updateQuery("")
    if (!rememberSelections && selected.length) updateValue([])
  })

  return <Dialog open={effectiveOpen} modal={portal} onOpenChange={next => { if (!next) close(true) }}>
    <DialogContent {...props} data-select-dialog="" data-selection-mode={selectionMode}
      dir={dir ?? (localized || hasProvider ? localeDir : undefined)} portal={portal} ref={surface}
      className={cn("fiori-select-dialog", classNames?.root, className)}
      aria-label={props["aria-label"] ?? headerText} aria-labelledby={undefined} aria-modal={true}
      onOpenAutoFocus={event => {
        event.preventDefault()
        if (!portal) return
        opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        // WCR SelectDialog.handleAfterOpen moves initial focus to List.focusFirstItem.
        const target = surface.current?.querySelector<HTMLElement>('[data-slot="list-item"]:not([data-disabled])')
          ?? surface.current?.querySelector<HTMLElement>('input')
        target?.focus({ preventScroll: true })
      }}
      onCloseAutoFocus={event => {
        event.preventDefault()
        opener.current?.focus()
      }}>
      <DialogHeader role="region" aria-label={texts.header} data-sap-ui-fastnavgroup="true" className={cn("fiori-select-dialog__header", classNames?.header)}>
        <div className="fiori-select-dialog__grid" data-centered={headerTextAlignCenter || undefined}>
          {showClearButton && headerTextAlignCenter && <Button variant="transparent" aria-hidden="true" tabIndex={-1} className="fiori-select-dialog__balance">{texts.clear}</Button>}
          <DialogTitle className={cn("fiori-select-dialog__title", classNames?.title)}>{headerText}</DialogTitle>
          {showClearButton && <Button variant="transparent" className={cn("fiori-select-dialog__clear", classNames?.clear)}
            onClick={() => { onClear?.(selected); updateValue([]); setAnnouncement({ count: 0, sequence: 0 }) }}>{texts.clear}</Button>}
          {/* WCR SelectDialog/index.js uses a Search-type Input. Its search glyph
              responds to clicks and the field submits with Enter. */}
          <div data-slot="search" className={cn("fiori-select-dialog__search", classNames?.search)}>
            <Input ref={searchField} type="search" autoComplete="off"
              value={query} placeholder={searchPlaceholder ?? texts.search}
              aria-label={searchPlaceholder ?? texts.search}
              onChange={event => {
                const next = event.currentTarget.value
                if (!next && query) onSearchReset?.(query)
                updateQuery(next)
              }}
              onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault() }}
              onKeyUp={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) onSearch?.(event.currentTarget.value) }}
              icon={<>
                {query && <InputIcon role="button" tabIndex={-1} title={texts.clearSearch} aria-label={texts.clearSearch}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => { onSearchReset?.(query); updateQuery(""); searchField.current?.focus() }}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click() }
                  }}><Icon icon={decline} /></InputIcon>}
                <InputIcon tabIndex={-1} onMouseDown={event => event.preventDefault()}
                  onClick={() => onSearch?.(query)}><span title={texts.search}><Icon icon={search} /></span></InputIcon>
              </>}
            />
          </div>
        </div>
      </DialogHeader>
      <DialogBody role="region" aria-label={texts.body} className={cn("fiori-select-dialog__body", classNames?.body)}>
        {multi && count > 0 && <div className={cn("fiori-select-dialog__count", classNames?.selectionCount)}>{`${texts.selected}: ${formatNumber.format(count)}`}</div>}
        <List locale={locale} className={classNames?.list} selectionMode={selectionMode} value={[...selected]} growing={growing} onLoadMore={onLoadMore}
          onValueChange={(next, detail) => {
            const keep = multi ? selected.filter(key => !visible.some(item => item.value === key)) : []
            const selection = [...new Set([...keep, ...next])]
            updateValue(selection)
            if (multi) setAnnouncement(old => ({ count: selection.length, sequence: old.sequence + 1 }))
            else {
              onConfirm?.(selection.length ? selection : [detail.item])
              close(false)
            }
          }}>
          {visible.map(item => {
            const info: SelectDialogItemInfo = { item, locale, selected: selected.includes(item.value), defaultContent: item.text }
            const extra = getItemProps?.(info)
            if (extra && process.env.NODE_ENV !== "production") {
              for (const key of Object.keys(extra)) {
                if (!supportedRowProps.has(key)) console.warn("SelectDialog: ignored item ownership prop", key)
              }
            }
            return <ListItemStandard key={item.value} value={item.value} disabled={item.disabled} description={item.description}
              className={cn(classNames?.item, extra?.className)} style={extra?.style} onClick={extra?.onClick}>
              {renderItem?.(info) ?? info.defaultContent}
            </ListItemStandard>
          })}
        </List>
        {multi && <span className="sr-only" aria-live="polite" aria-atomic="true" data-slot="select-dialog-announcement">
          {announcement.count > 0 && <span key={announcement.sequence}>{texts.selectedItems(announcement.count)}</span>}
        </span>}
      </DialogBody>
      <DialogFooter role="region" aria-label={texts.footer} data-sap-ui-fastnavgroup="true" className={cn("fiori-select-dialog__footer", classNames?.footer)}>
        {multi && <Button variant="emphasized" className={classNames?.confirm} onClick={() => { onConfirm?.(selected); close(false) }}>{confirmButtonText ?? texts.select}</Button>}
        <Button variant="transparent" className={classNames?.cancel} onClick={() => close(true)}>{texts.cancel}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

export { SelectDialog, type SelectDialogProps, type SelectDialogItem, type SelectDialogItemInfo, type SelectDialogSlot, type SelectDialogTexts }
