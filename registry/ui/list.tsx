// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { createPortal } from "react-dom"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

// UI5 2.28 List fastNavigation metadata; UI5Element.onEnterDOM marks this root unless overridden.

import { useFioriDragAndDrop, type FioriMoveHandlers } from "@/lib/fiori-drag-and-drop"

import { accept, decline, edit, slimArrowRight } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import type { FioriIconData } from "@/lib/fiori-icons"

// Mirrors ui5-list / ui5-li / ui5-li-custom / ui5-li-group (Horizon).
// The List owns selection, roving focus (UI5 ItemNavigation: ↑/↓, Home/End, PageUp/PageDown by 10,
// no wrap) and Tab forwarding: Tab from an item (or its last tabbable content) leaves the list,
// Shift+Tab from an item leaves it backwards, re-entering focuses the previously focused item.
// F2 moves focus between an item and its content. Styles: registry/styles/components/list.css.

type ListSelectionMode = "none" | "single" | "singleStart" | "singleEnd" | "singleAuto" | "multiple" | "delete"
type ListItemType = "active" | "inactive" | "inactiveSelectable" | "detail" | "navigation"
type ListItemHighlight = "none" | "negative" | "critical" | "positive" | "information"
type ListSeparators = "all" | "inner" | "none"
type ListGrowing = "none" | "button" | "scroll"
type ListAdditionalTextState = "none" | "negative" | "critical" | "positive" | "information"
type ListAccessibleRole = "list" | "listbox" | "menu" | "tree"

type ListTexts = {
  selected: string; notSelected: string; active: string; customItem: string
  required: string; disabled: string; readonly: string; empty: string
  singleControl: string; multipleControls: string; buttonType: string; linkType: string
  listDescription: string; groupHeader: string; selectable: string; multiSelectable: string; deletable: string
  checkboxLabel: string; radioLabel: string; loadMore: string; delete: string
  inactive: string; navigation: string; detail: string
  growing?: string
  interactiveDescription?: string
  groups?: (count: number, items: number) => string
  listboxGroups?: (count: number) => string
  groupDescription: (groups: number, items: number) => string
  listboxGroupDescription: (groups: number) => string
}
const defaultListTexts: ListTexts = {
  selected: "Selected", // UI5 LIST_ITEM_SELECTED
  notSelected: "Not Selected", // UI5 LIST_ITEM_NOT_SELECTED
  active: "Is Active", // UI5 LIST_ITEM_ACTIVE
  customItem: "List Item", // UI5 LISTITEMCUSTOM_TYPE_TEXT
  required: "Required", // UI5 ACC_STATE_REQUIRED
  disabled: "Disabled", // UI5 ACC_STATE_DISABLED
  readonly: "Read Only", // UI5 ACC_STATE_READONLY
  empty: "Empty", // UI5 ACC_STATE_EMPTY
  singleControl: "Includes element", // UI5 ACC_STATE_SINGLE_CONTROL
  multipleControls: "Includes elements", // UI5 ACC_STATE_MULTIPLE_CONTROLS
  buttonType: "Button", // UI5 BUTTON_ROLE_DESCRIPTION
  linkType: "Link", // UI5 LINK_ROLE_DESCRIPTION
  listDescription: "List with interactive items. To move to the content, press F2.", // UI5 LIST_ROLE_DESCRIPTION
  groupHeader: "Group Header", // UI5 GROUP_HEADER_TEXT
  selectable: "Contains Selectable Items", // UI5 ARIA_LABEL_LIST_SELECTABLE
  multiSelectable: "Contains Multi-Selectable Items", // UI5 ARIA_LABEL_LIST_MULTISELECTABLE
  deletable: "Contains Deletable Items", // UI5 ARIA_LABEL_LIST_DELETABLE
  checkboxLabel: "Multiple Selection Mode", // UI5 ARIA_LABEL_LIST_ITEM_CHECKBOX
  radioLabel: "Item Selection.", // UI5 ARIA_LABEL_LIST_ITEM_RADIO_BUTTON
  loadMore: "More", // UI5 LOAD_MORE_TEXT
  delete: "Delete", // UI5 DELETE
  // UI5 ListItemStandardTemplate.js:listItemContent announces enum values (no i18n key).
  inactive: "Inactive", navigation: "Navigation", detail: "Detail",
  groupDescription: (groups, items) => `contains ${formatListCount(groups)} sub groups with ${formatListCount(items)} items`, // UI5 LIST_ROLE_LIST_GROUP_DESCRIPTION
  listboxGroupDescription: (groups) => `contains ${formatListCount(groups)} sub groups`, // UI5 LIST_ROLE_LISTBOX_GROUP_DESCRIPTION
}
const defaultListTextsKeys = {
  selectable: "ARIA_LABEL_LIST_SELECTABLE", multiSelectable: "ARIA_LABEL_LIST_MULTISELECTABLE",
  deletable: "ARIA_LABEL_LIST_DELETABLE", delete: "DELETE", selected: "LIST_ITEM_SELECTED",
  notSelected: "LIST_ITEM_NOT_SELECTED", loadMore: "LOAD_MORE_TEXT", listDescription: "LIST_ROLE_DESCRIPTION",
  groupDescription: "LIST_ROLE_LIST_GROUP_DESCRIPTION", listboxGroupDescription: "LIST_ROLE_LISTBOX_GROUP_DESCRIPTION",
  groupHeader: "GROUP_HEADER_TEXT",
} as const
function formatListCount(count: number) { return new Intl.NumberFormat(typeof navigator === "undefined" ? "en" : navigator.language).format(count) }

type CustomAccessibilityInfo = {
  type?: string; description?: string; required?: boolean; disabled?: boolean; readonly?: boolean; children?: Node[]
}
/** Port CustomAnnouncement.js:getCustomAnnouncement. Custom DOM hosts can expose
 * accessibilityInfo, or data-ui5-acc-text, exactly as native custom content does.
 */
function getCustomAnnouncement(element: Node | null, texts: ListTexts = defaultListTexts, options: { lessDetails?: boolean; rootInfo?: CustomAccessibilityInfo } = {}, root = true): string {
  if (!element) return ""
  if (element.nodeType === Node.TEXT_NODE) return element.textContent?.trim() ?? ""
  if (!(element instanceof HTMLElement)) return ""
  if (element.hasAttribute("data-ui5-acc-text")) return element.getAttribute("data-ui5-acc-text") ?? ""
  if (element.ariaHidden === "true" || !(element.checkVisibility() || getComputedStyle(element).display === "contents")) return root ? texts.empty : ""
  const supplied = options.rootInfo ?? (element as HTMLElement & { accessibilityInfo?: CustomAccessibilityInfo }).accessibilityInfo
  // Button.js:accessibilityInfo supplies its type, disabled state and text slot.
  // Native HTML alone has no such hook; recognize the owning Fiori Button host.
  const info = supplied ?? (element.dataset.slot === "button" ? {
    type: element.getAttribute("role") === "link" ? texts.linkType : texts.buttonType, disabled: (element as HTMLButtonElement).disabled,
    description: element.getAttribute("aria-description") ?? undefined,
    children: [...element.childNodes],
  } : undefined)
  const parts: string[] = []
  if (info?.type) parts.push(info.type)
  if (info?.description) parts.push(info.description)
  if (!options.lessDetails) {
    if (info?.required) parts.push(texts.required)
    if (info?.disabled) parts.push(texts.disabled)
    if (info?.readonly) parts.push(texts.readonly)
  }
  const children = info ? info.children ?? [] : (element.localName === "slot" ? (element as HTMLSlotElement).assignedNodes({ flatten: true }) : [...(element.shadowRoot?.childNodes ?? element.childNodes)])
  for (const child of children) {
    const description = getCustomAnnouncement(child, texts, { lessDetails: options.lessDetails }, false)
    if (description) parts.push(description)
  }
  if (root && (!parts.length || !options.lessDetails)) {
    const tabbables = [...element.querySelectorAll<HTMLElement>(TABBABLE)].filter((node) => node.checkVisibility() && node.ariaHidden !== "true" && node.getAttribute("tabindex") !== "-1")
    const tail = tabbables.length === 1 ? texts.singleControl : tabbables.length > 1 ? texts.multipleControls : !parts.length ? texts.empty : ""
    if (tail) { if (parts.length) parts.push("."); parts.push(tail) }
  }
  return parts.join(" ").trim()
}

const PAGE_SIZE = 10
const SINGLE_MODES: ListSelectionMode[] = ["single", "singleStart", "singleEnd", "singleAuto"]
const isSingle = (m: ListSelectionMode) => SINGLE_MODES.includes(m)
const TABBABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type ListCore = {
  rootRef: React.RefObject<HTMLDivElement | null>
  mode: ListSelectionMode
  itemRole: "listitem" | "option" | "treeitem" | "menuitem"
  isSelected: (value: string) => boolean
  /** source "component": the radio / check box was pressed (no item-click). */
  select: (value: string, selected: boolean) => void
  press: (value: string, type: ListItemType) => void
  remove: (value: string) => void
  currentKey: string | null
  setCurrentKey: (key: string) => void
  hasBorder: (key: string) => boolean
  forwardAfter: (e: React.KeyboardEvent) => void
  forwardBefore: () => void
  deleteText: string
  selectedText: string
  notSelectedText: string
  texts?: ListTexts
}

const ListCoreContext = React.createContext<ListCore | null>(null)

function useListCore() {
  const ctx = React.useContext(ListCoreContext)
  if (!ctx) throw new Error("List items must be rendered inside <List> or <Tree>.")
  return ctx
}

/** Items the user navigates among, in DOM order (disabled ones are skipped, as in UI5). */
function navItems(root: HTMLElement | null) {
  if (!root) return []
  return [...root.querySelectorAll<HTMLElement>("[data-nav-key]")].filter(
    (el) => el.closest('[data-slot="list"], [data-slot="tree"]') === root && !el.hasAttribute("data-disabled")
  )
}

/** Tabbable content inside an item's own row (not the item itself, not nested tree items). */
function tabbablesIn(item: HTMLElement) {
  const row = item.querySelector<HTMLElement>(":scope > [data-li-row]") ?? item
  return [...row.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el !== item && el.closest("[data-nav-key]") === item && !el.closest("[data-li-selection]")
  )
}

type CoreOptions = {
  mode: ListSelectionMode
  itemRole: ListCore["itemRole"]
  separators: ListSeparators
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[], detail: { item: string; selected: boolean }) => void
  onBeforeValueChange?: (detail: { item: string; selected: boolean }) => boolean | void
  onItemClick?: (value: string) => void
  onItemDelete?: (value: string) => void
  deleteText: string
  selectedText: string
  notSelectedText: string
  announceSelection?: (selected: boolean) => void
  growingButtonRef?: React.RefObject<HTMLDivElement | null>
}

/** Shared by List and Tree: selection state, roving tab stop, separators and Tab forwarding. */
function useListCoreValue(opts: CoreOptions) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const beforeRef = React.useRef<HTMLDivElement>(null)
  const afterRef = React.useRef<HTMLDivElement>(null)
  const forwarding = React.useRef(false)
  const [inner, setInner] = React.useState<string[]>(opts.defaultValue ?? [])
  const selected = opts.value ?? inner
  const selectedRef = React.useRef(selected)
  selectedRef.current = selected
  const optsRef = React.useRef(opts)
  optsRef.current = opts
  const [currentKey, setCurrentKey] = React.useState<string | null>(null)
  const [lastKey, setLastKey] = React.useState<string | null>(null)

  // Keep one tab stop: the current item if it still exists, else the first selected item, else the first.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = navItems(root)
    const keys = items.map((el) => el.dataset.navKey!)
    if (!currentKey || !keys.includes(currentKey)) {
      const sel = items.find((el) => el.hasAttribute("data-selected"))
      const next = sel?.dataset.navKey ?? keys[0] ?? null
      if (next !== currentKey) setCurrentKey(next)
    }
    const all = [...root.querySelectorAll<HTMLElement>("[data-nav-key]")].filter(
      (el) => el.closest('[data-slot="list"], [data-slot="tree"]') === root
    )
    const last = all.at(-1)?.dataset.navKey ?? null
    if (last !== lastKey) setLastKey(last)
  })

  const commit = React.useCallback((next: string[], item: string, isSel: boolean) => {
    // List.js:onSelectionRequested reverts a canceled selection before announcing it.
    if (optsRef.current.onBeforeValueChange?.({ item, selected: isSel }) === false) return
    if (optsRef.current.value === undefined) setInner(next)
    optsRef.current.onValueChange?.(next, { item, selected: isSel })
    // List.js:onSelectionRequested announces only an actual selection change;
    // reselecting Single or toggling to the existing Multiple value returns above.
    optsRef.current.announceSelection?.(isSel)
  }, [])

  const select = React.useCallback(
    (value: string, want: boolean) => {
      const { mode } = optsRef.current
      const cur = selectedRef.current
      if (isSingle(mode)) {
        if (cur.includes(value)) return // UI5 handleSingle: re-selecting is no change
        commit([value], value, true)
      } else if (mode === "multiple") {
        const has = cur.includes(value)
        if (has === want) return
        commit(want ? [...cur, value] : cur.filter((v) => v !== value), value, want)
      }
    },
    [commit]
  )

  const core: ListCore = {
    rootRef,
    mode: opts.mode,
    itemRole: opts.itemRole,
    isSelected: (v) => selected.includes(v),
    select,
    press: (value, type) => {
      if (type !== "inactiveSelectable") optsRef.current.onItemClick?.(value)
      if (optsRef.current.mode !== "delete" && optsRef.current.mode !== "none") select(value, !selectedRef.current.includes(value))
    },
    remove: (value) => optsRef.current.onItemDelete?.(value),
    currentKey,
    setCurrentKey,
    hasBorder: (key) => opts.separators === "all" || (opts.separators === "inner" && key !== lastKey),
    forwardAfter: (e) => {
      const growing = optsRef.current.growingButtonRef?.current
      if (growing) {
        e.preventDefault()
        growing.focus()
        return
      }
      // Focus the end marker without preventing Tab: the browser then moves on past the list.
      forwarding.current = true
      afterRef.current?.focus()
    },
    forwardBefore: () => {
      forwarding.current = true
      beforeRef.current?.focus()
    },
    deleteText: opts.deleteText,
    selectedText: opts.selectedText,
    notSelectedText: opts.notSelectedText,
  }

  const focusCurrent = () => {
    const items = navItems(rootRef.current)
    ;(items.find((el) => el.dataset.navKey === currentKey) ?? items[0])?.focus()
  }
  const focusArea = (which: "before" | "after") => (
    <div
      ref={which === "before" ? beforeRef : afterRef}
      tabIndex={0}
      className="fiori-list__focusarea"
      onFocus={() => {
        if (forwarding.current) {
          forwarding.current = false
          return
        }
        const growing = optsRef.current.growingButtonRef?.current
        if (which === "after" && growing) growing.focus()
        else focusCurrent()
      }}
    />
  )

  return { core, focusArea, focusCurrent }
}

/** Arrow / Home / End / PageUp / PageDown between items (UI5 ItemNavigation, static behaviour). */
function handleNavigationKey(e: React.KeyboardEvent, core: ListCore, opts?: { growingButton?: HTMLElement | null }) {
  const root = core.rootRef.current
  const target = e.target as HTMLElement
  const item = target.closest<HTMLElement>("[data-nav-key]")
  if (!root || !item || e.altKey || e.ctrlKey || e.metaKey) return
  const items = navItems(root)
  const idx = items.indexOf(item)
  if (idx === -1) return
  const onItem = target === item
  if (!onItem) {
    // Focus is on content inside the item: ↑/↓ go to the same content element of the adjacent item.
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    const own = tabbablesIn(item)
    const at = own.indexOf(target)
    if (at === -1) return
    const withContent = items.filter((el) => tabbablesIn(el).length > 0)
    const next = withContent[withContent.indexOf(item) + (e.key === "ArrowUp" ? -1 : 1)]
    if (!next) return
    e.preventDefault()
    const f = tabbablesIn(next)
    f[Math.min(at, f.length - 1)].focus()
    return
  }
  const growing = opts?.growingButton
  let next = idx
  switch (e.key) {
    case "ArrowDown":
      if (growing && idx === items.length - 1) {
        e.preventDefault()
        growing.focus()
        return
      }
      next = Math.min(idx + 1, items.length - 1)
      break
    case "ArrowUp":
      next = Math.max(idx - 1, 0)
      break
    case "Home":
      next = 0
      break
    case "End":
      if (growing && idx === items.length - 1) {
        e.preventDefault()
        growing.focus()
        return
      }
      next = items.length - 1
      break
    case "PageUp":
      next = Math.max(idx - PAGE_SIZE, 0)
      break
    case "PageDown":
      next = Math.min(idx + PAGE_SIZE, items.length - 1)
      break
    default:
      return
  }
  e.preventDefault()
  items[next].focus()
}

// ---------------------------------------------------------------------------------------------
// List

/**
 * @accessibility aria-label / aria-labelledby name the internal list/listbox. accessibleRole chooses listitem or option semantics. ListItemCustom preserves owned roles, selection state and roving tabindex; selectedText/notSelectedText and deleteText/detailText name item actions.
 * @accessibility Items form one Tab stop. Up/Down, Home/End and PageUp/Down move items. Enter/Space activates or selects; Delete requests deletion. Tab enters custom controls and returns to list navigation; movable items request order changes with Ctrl/Cmd+arrows or Home/End.
 */
type ListProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & FioriMoveHandlers & {
  texts?: Partial<ListTexts>
  /** Locale used by the default group-count descriptions. */
  locale?: string
  selectionMode?: ListSelectionMode
  /** Values of the selected items (controlled). Every mode uses an array; single modes hold at most one. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[], detail: { item: string; selected: boolean }) => void
  /** Return false to keep the previous selection and suppress its announcement. */
  onBeforeValueChange?: (detail: { item: string; selected: boolean }) => boolean | void
  /** Fired when an item is activated (click, Enter, Space), unless its type is inactive / detail. */
  onItemClick?: (value: string) => void
  /** Delete mode: the item's delete button was pressed (or Delete pressed on the item). */
  onItemDelete?: (value: string) => void
  headerText?: string
  /** Custom header content; replaces `headerText`. */
  header?: React.ReactNode
  footerText?: string
  /** Shown when the list has no items. */
  noDataText?: string
  separators?: ListSeparators
  /** Adds 2rem padding around the list. */
  indent?: boolean
  stickyHeader?: boolean
  growing?: ListGrowing
  growingButtonText?: string
  /** aria-label on the growing button (UI5 accessibilityAttributes.growingButton.name). */
  growingButtonName?: string
  /** aria-description on the growing button (UI5 accessibilityAttributes.growingButton.description). */
  growingButtonDescription?: string
  onLoadMore?: () => void
  loading?: boolean
  loadingDelay?: number
  /** Role on the inner ul; inherited item roles follow UI5 List.js:LIST_ACCESSIBLE_ROLE_TO_ITEM_ROLE. */
  accessibleRole?: ListAccessibleRole
  /** Tooltip of the delete buttons (default "Delete"). */
  deleteText?: string
  /** Screen-reader texts used to announce selection on list items. */
  selectedText?: string
  notSelectedText?: string
}

/** Native aria-label/aria-labelledby apply to the inner ul (UI5 ListTemplate.js).
 * aria-description and resolved aria-describedby text compose its aria-description
 * with the component-owned descriptions (UI5 List.js:ariaDescriptionText).
 */
function List({
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  onBeforeValueChange,
  onItemClick,
  onItemDelete,
  onMoveOver,
  onMove,
  headerText,
  header,
  footerText,
  noDataText,
  separators = "all",
  indent,
  stickyHeader,
  growing = "none",
  growingButtonText: growingButtonTextProp,
  growingButtonName,
  growingButtonDescription,
  onLoadMore,
  loading,
  loadingDelay = 1000,
  accessibleRole = "list",
  deleteText: deleteTextProp,
  selectedText: selectedTextProp,
  notSelectedText: notSelectedTextProp,
  texts: textsProp,
  locale: localeProp,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-description": ariaDescription,
  "aria-describedby": ariaDescriptionRef,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  ...props
}: ListProps) {
  const { locale } = useFioriLocale(localeProp)
  const defaults = React.useMemo(() => {
    const number = new Intl.NumberFormat(locale)
    return { ...defaultListTexts,
      groupDescription: (groups: number, items: number) => `contains ${number.format(groups)} sub groups with ${number.format(items)} items`,
      listboxGroupDescription: (groups: number) => `contains ${number.format(groups)} sub groups` }
  }, [locale])
  const t = useFioriTexts(defaults, defaultListTextsKeys, {
    ...textsProp, loadMore: growingButtonTextProp ?? textsProp?.loadMore ?? textsProp?.growing,
    delete: deleteTextProp ?? textsProp?.delete, selected: selectedTextProp ?? textsProp?.selected,
    notSelected: notSelectedTextProp ?? textsProp?.notSelected,
    listDescription: textsProp?.listDescription ?? textsProp?.interactiveDescription,
    groupDescription: textsProp?.groupDescription ?? textsProp?.groups,
    listboxGroupDescription: textsProp?.listboxGroupDescription ?? textsProp?.listboxGroups,
  }, localeProp)
  const id = React.useId()
  const [announcement, setAnnouncement] = React.useState({ text: "", sequence: 0 })
  const [announcementTarget, setAnnouncementTarget] = React.useState<HTMLElement | null>(null)
  const announceSelection = (selected: boolean) => setAnnouncement((old) => ({ text: selected ? t.selected : t.notSelected, sequence: old.sequence + 1 }))
  const growingRef = React.useRef<HTMLDivElement>(null)
  const { core, focusArea } = useListCoreValue({
    mode: selectionMode,
    itemRole: accessibleRole === "listbox" ? "option" : accessibleRole === "tree" ? "treeitem" : accessibleRole === "menu" ? "menuitem" : "listitem",
    separators,
    value,
    defaultValue,
    onValueChange,
    onBeforeValueChange,
    onItemClick,
    onItemDelete,
    deleteText: t.delete,
    selectedText: t.selected,
    notSelectedText: t.notSelected,
    announceSelection,
    growingButtonRef: growing === "button" ? growingRef : undefined,
  })
  core.texts = t
  React.useEffect(() => setAnnouncementTarget(core.rootRef.current?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? document.body), [])
  React.useEffect(() => {
    if (!announcement.text) return
    // InvisibleMessage.js:announce clears the announcement after 3000 ms.
    const timer = setTimeout(() => setAnnouncement((old) => old.sequence === announcement.sequence ? { ...old, text: "" } : old), 3000)
    return () => clearTimeout(timer)
  }, [announcement])
  const dragAndDrop = useFioriDragAndDrop({
    rootRef: core.rootRef,
    kind: "list",
    // List._dragAndDropHandler uses top-level List.items; grouped children are represented by their group.
    getItems: () => [...(core.rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="list-item"], [data-slot="list-item-group"], [data-slot="list-item-group-header"]') ?? [])].filter((item) => item.closest('[data-slot="list"]') === core.rootRef.current && !item.parentElement?.closest('[data-slot="list-item-group"]')),
    onMoveOver,
    onMove,
    dragHandlers: { onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop },
  })
  const hasData = React.Children.toArray(children).length > 0
  const [structure, setStructure] = React.useState({ groups: 0, items: 0, interactive: false })
  React.useLayoutEffect(() => {
    const root = core.rootRef.current
    if (!root) return
    const update = () => {
      const groups = [...root.querySelectorAll<HTMLElement>('[data-slot="list-item-group"]')].filter((group) => group.closest('[data-slot="list"]') === root)
      const items = [...root.querySelectorAll<HTMLElement>('[data-slot="list-item"]')].filter((item) => item.closest('[data-slot="list"]') === root)
      // List.js:_hasInteractiveItems / _getDescriptionForGroups inspect slotted
      // content; custom React children retain the same generated descriptions.
      const next = { groups: groups.length, items: groups.reduce((count, group) => count + items.filter((item) => item.closest('[data-slot="list-item-group"]') === group).length, 0),
        interactive: selectionMode === "delete" || items.some((item) => item.dataset.itemType === "detail" || item.hasAttribute("data-custom") && tabbablesIn(item).some((control) => control.checkVisibility())) }
      setStructure((old) => old.groups === next.groups && old.items === next.items && old.interactive === next.interactive ? old : next)
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "tabindex", "data-item-type", "data-custom"] })
    return () => observer.disconnect()
  }, [selectionMode, core.rootRef])
  const [referencedDescription, setReferencedDescription] = React.useState("")
  React.useLayoutEffect(() => {
    if (!ariaDescriptionRef) { setReferencedDescription(""); return }
    const root = core.rootRef.current?.getRootNode() as Document | ShadowRoot | undefined
    if (!root) return
    const update = () => setReferencedDescription(ariaDescriptionRef.trim().split(/\s+/).map((target) => root.getElementById(target)?.textContent?.trim()).filter(Boolean).join(" "))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["id"] })
    return () => observer.disconnect()
  }, [ariaDescriptionRef, core.rootRef])
  const headerId = `${id}-header`
  const modeId = `${id}-mode`
  const modeText = hasData ? (isSingle(selectionMode) ? t.selectable : selectionMode === "multiple" ? t.multiSelectable : selectionMode === "delete" ? t.deletable : undefined) : undefined
  const contentDescription = accessibleRole === "list" && structure.interactive ? t.listDescription : undefined
  const groupDescription = structure.groups ? accessibleRole === "list" ? t.groupDescription(structure.groups, structure.items) : accessibleRole === "listbox" ? t.listboxGroupDescription(structure.groups) : undefined : undefined
  // List.js:ariaDescriptionText resolves accessibleDescriptionRef before composing
  // the list's owned interactive/group text on ListTemplate.js's ul aria-description.
  const description = [contentDescription, referencedDescription || ariaDescription, groupDescription].filter(Boolean).join(" ") || undefined
  const labelledBy =
    ariaLabelledBy ?? (ariaLabel ? undefined : cn(modeText && modeId, !header && headerText && headerId) || undefined)

  // Scroll growing: load more when the end marker comes into view after the user has scrolled.
  const startRef = React.useRef<HTMLSpanElement>(null)
  const endRef = React.useRef<HTMLSpanElement>(null)
  const onLoadMoreRef = React.useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore
  React.useEffect(() => {
    if (growing !== "scroll" || !startRef.current || !endRef.current) return
    let startOut = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const start = new IntersectionObserver(([e]) => (startOut = !e.isIntersecting))
    const end = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      clearTimeout(timer)
      timer = setTimeout(() => startOut && onLoadMoreRef.current?.(), 250)
    })
    start.observe(startRef.current)
    end.observe(endRef.current)
    return () => {
      start.disconnect()
      end.disconnect()
      clearTimeout(timer)
    }
  }, [growing])

  const [moreActive, setMoreActive] = React.useState(false)
  const loadMore = () => onLoadMoreRef.current?.()

  const body = (
    <div className="fiori-list__container">
      {header}
      {!header && headerText && (
        <header id={headerId} className="fiori-list__header">
          {headerText}
        </header>
      )}
      <div className="fiori-list__scroll">
        <span ref={startRef} aria-hidden className="fiori-list__marker" />
        {hasData && focusArea("before")}
        {modeText && (
          <span id={modeId} className="sr-only">
            {modeText}
          </span>
        )}
        <ul
          role={accessibleRole}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-description={description}
          aria-multiselectable={accessibleRole === "listbox" && selectionMode === "multiple" ? true : undefined}
          className="fiori-list__ul"
          onKeyDown={(e) => {
            if (!e.defaultPrevented && !dragAndDrop.handleKeyDown(e)) handleNavigationKey(e, core, { growingButton: growingRef.current })
          }}
        >
          {children}
          {!hasData && noDataText && (
            <li tabIndex={0} role={core.itemRole} className="fiori-list__nodata">
              <div className="fiori-list__nodata-text">{noDataText}</div>
            </li>
          )}
        </ul>
        {growing === "button" && (
          <div className="fiori-list__growing">
            <div
              ref={growingRef}
              id={`${id}-growing`}
              role="button"
              tabIndex={0}
              aria-label={growingButtonName}
              aria-labelledby={growingButtonName ? undefined : `${id}-growing-text`}
              aria-describedby={growingButtonDescription ? `${id}-growing-description` : undefined}
              data-active={moreActive ? "" : undefined}
              className="fiori-list__growing-inner"
              onClick={loadMore}
              onPointerDown={() => setMoreActive(true)}
              onPointerUp={() => setMoreActive(false)}
              onPointerLeave={() => setMoreActive(false)}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault()
                  setMoreActive(true)
                } else if (e.key === "Enter") {
                  e.preventDefault()
                  loadMore()
                  setMoreActive(true)
                } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
                  e.preventDefault()
                  const items = navItems(core.rootRef.current)
                  if (e.key === "ArrowUp") items.at(-1)?.focus()
                  else (items.find((el) => el.dataset.navKey === core.currentKey) ?? items[0])?.focus()
                }
                // Plain Tab continues past the list (there is no end marker after the growing button).
              }}
              onKeyUp={(e) => {
                if (e.key === " ") loadMore()
                setMoreActive(false)
              }}
            >
              {loading && <BusyIndicator active delay={loadingDelay} size="M" className="fiori-list__growing-busy" />}
              <span id={`${id}-growing-text`} className="fiori-list__growing-text">
                {t.loadMore}
              </span>
            </div>
            {growingButtonDescription && <span id={`${id}-growing-description`} className="sr-only">{growingButtonDescription}</span>}
          </div>
        )}
        {footerText && <footer className="fiori-list__footer">{footerText}</footer>}
        {hasData && growing !== "button" && focusArea("after")}
        <span ref={endRef} aria-hidden className="fiori-list__marker" />
      </div>
    </div>
  )

  return (
    <ListCoreContext.Provider value={core}>
      <div
        ref={core.rootRef}
        data-slot="list" data-sap-ui-fastnavgroup="true"
        data-selection-mode={selectionMode}
        data-separators={separators}
        data-indent={indent ? "" : undefined}
        data-sticky-header={stickyHeader ? "" : undefined}
        data-growing={growing}
        className={cn("fiori-list", className)}
        {...dragAndDrop.handlers}
        {...props}
      >
        {loading && growing !== "button" ? (
          <BusyIndicator active delay={loadingDelay} className="fiori-list__busy">
            {body}
          </BusyIndicator>
        ) : (
          body
        )}
        {dragAndDrop.indicator}
      </div>
      {announcementTarget && createPortal(<span data-slot="list-announcement" data-owner={props.id} className="sr-only" role="alert" aria-live="polite" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></span>, announcementTarget)}
    </ListCoreContext.Provider>
  )
}

// ---------------------------------------------------------------------------------------------
// Items

type ItemBehaviourOptions = {
  value?: string
  type: ListItemType
  disabled?: boolean
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
  onKeyUp?: React.KeyboardEventHandler<HTMLElement>
  onClick?: React.MouseEventHandler<HTMLElement>
  onFocus?: React.FocusEventHandler<HTMLElement>
  onPointerDown?: React.PointerEventHandler<HTMLElement>
}

/** Behaviour shared by every selectable item (list items and tree items). */
function useListItemBehaviour(opts: ItemBehaviourOptions) {
  const core = useListCore()
  const autoId = React.useId()
  const value = opts.value ?? autoId
  const selected = core.isSelected(value)
  const [active, setActive] = React.useState(false)
  const pressable = opts.type === "active" || opts.type === "navigation"
  const inactive = opts.type === "inactive" || opts.type === "detail"
  const actionable = pressable && core.mode !== "delete"

  React.useEffect(() => {
    if (!active) return
    const off = () => setActive(false)
    document.addEventListener("pointerup", off)
    document.addEventListener("keyup", off)
    return () => {
      document.removeEventListener("pointerup", off)
      document.removeEventListener("keyup", off)
    }
  }, [active])

  const press = () => {
    if (opts.disabled || inactive) return
    core.press(value, opts.type)
  }
  // The item's own element: events coming from nested tree items are ignored.
  const own = (e: React.SyntheticEvent<HTMLElement>) => (e.target as HTMLElement).closest("[data-nav-key]") === e.currentTarget
  const contentFocused = (e: React.SyntheticEvent<HTMLElement>) => e.target !== e.currentTarget

  const handlers = {
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      opts.onFocus?.(e)
      if (!own(e)) return
      core.setCurrentKey(value)
      if (contentFocused(e)) setActive(false)
      else if (core.mode === "singleAuto" && opts.type !== "inactiveSelectable" && !opts.disabled) core.select(value, true)
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      opts.onKeyDown?.(e)
      if (e.defaultPrevented || !own(e)) return
      const item = e.currentTarget
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (!contentFocused(e)) core.forwardBefore()
        } else {
          const t = tabbablesIn(item)
          if (t.length === 0 || t.at(-1) === document.activeElement) core.forwardAfter(e)
        }
        return
      }
      if (e.key === "F2") {
        e.preventDefault()
        if (!contentFocused(e)) tabbablesIn(item)[0]?.focus()
        else item.focus()
        return
      }
      if (contentFocused(e)) return
      if (e.key === " ") e.preventDefault()
      if (e.key === "Enter") {
        e.preventDefault()
        press()
      }
      if ((e.key === " " || e.key === "Enter") && pressable && !opts.disabled) setActive(true)
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => {
      opts.onKeyUp?.(e)
      if (!own(e) || contentFocused(e)) return
      if (e.key === " ") press()
      if (e.key === " " || e.key === "Enter") setActive(false)
      if (core.mode === "delete" && e.key === "Delete" && !opts.disabled) core.remove(value)
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      opts.onPointerDown?.(e)
      if (!own(e) || opts.disabled) return
      if (pressable && !(e.target as HTMLElement).closest("button, a, input, select, textarea")) setActive(true)
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      opts.onClick?.(e)
      if (e.defaultPrevented || !own(e)) return
      const t = e.target as HTMLElement
      const interactive = t.closest("button, a, input, select, textarea, [role=button], [data-li-selection]")
      if (interactive && e.currentTarget.contains(interactive)) return
      press()
      if (document.activeElement !== e.currentTarget && !e.currentTarget.contains(document.activeElement)) e.currentTarget.focus()
    },
  }

  return { core, value, selected, active, actionable, inactive, handlers }
}

/** The radio button / check box / delete button UI5 places before or after an item's content. */
function SelectionElement({
  core,
  value,
  selected,
  inactive,
  disabled,
}: {
  core: ListCore
  value: string
  selected: boolean
  inactive: boolean
  disabled?: boolean
}) {
  const mode = core.mode
  const off = inactive || disabled
  const texts = core.texts ?? defaultListTexts
  if (isSingle(mode) && mode !== "single" && mode !== "singleAuto") {
    // Drawn like ui5-radio-button but not focusable: the item is the focus stop (UI5 tabindex -1).
    return (
      <span
        // ListItemTemplate.js:selectionElement exposes the inner radio at tabindex=-1.
        role="radio"
        aria-label={texts.radioLabel}
        aria-checked={selected}
        aria-disabled={off || undefined}
        tabIndex={-1}
        data-li-selection=""
        data-state={selected ? "checked" : "unchecked"}
        data-disabled={off ? "" : undefined}
        className="fiori-radio fiori-li__selection"
        onKeyDown={(event) => { if (event.key === " ") event.preventDefault(); if (!off && event.key === "Enter") core.select(value, true) }}
        onKeyUp={(event) => { if (!off && event.key === " ") core.select(value, true) }}
        onClick={(e) => {
          e.stopPropagation()
          if (!off) core.select(value, true)
        }}
      >
        <span className="fiori-radio__inner">
          <svg className="fiori-radio__svg" focusable="false" aria-hidden="true">
            <circle className="fiori-radio__outer" cx="50%" cy="50%" r="50%" />
            <circle className="fiori-radio__dot" cx="50%" cy="50%" />
          </svg>
        </span>
      </span>
    )
  }
  if (mode === "multiple") {
    return (
      <span
        // ListItemTemplate.js:selectionElement exposes the checkbox, including required=false.
        role="checkbox"
        aria-label={texts.checkboxLabel}
        aria-checked={selected}
        aria-disabled={off || undefined}
        aria-required={false}
        tabIndex={-1}
        data-li-selection=""
        data-state={selected ? "checked" : "unchecked"}
        data-disabled={off ? "" : undefined}
        className="fiori-checkbox fiori-li__selection"
        // CheckBox.js:_onkeydown toggles Enter, _onkeyup toggles Space.
        onKeyDown={(event) => { if (event.key === " ") event.preventDefault(); if (!off && event.key === "Enter") core.select(value, !selected) }}
        onKeyUp={(event) => { if (!off && event.key === " ") core.select(value, !selected) }}
        onClick={(e) => {
          e.stopPropagation()
          if (!off) core.select(value, !selected)
        }}
      >
        <span className="fiori-checkbox__inner">
          <Icon icon={accept} className="fiori-checkbox__icon size-(--fiori-checkbox-icon-size)" />
        </span>
      </span>
    )
  }
  if (mode === "delete") {
    return (
      <div className="fiori-li__deletebtn">
        <Button
          variant="transparent"
          size="icon"
          title={core.deleteText}
          aria-label={core.deleteText}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            core.remove(value)
          }}
        >
          <Icon icon={decline} />
        </Button>
      </div>
    )
  }
  return null
}

type ListItemBaseProps = Omit<React.ComponentProps<"li">, "value" | "type" | "content"> & {
  /** Native aria-* apply to the li: role overrides the inherited role, aria-label
   * maps to UI5 accessibleName, and aria-posinset/aria-setsize map to accessibilityAttributes.
   * Description refs are combined with the component-owned selection description.
   */
  /** Identifies the item for selection, click and delete callbacks. */
  value?: string
  type?: ListItemType
  highlight?: ListItemHighlight
  /** Shows the navigation indicator at the end of the item. */
  navigated?: boolean
  disabled?: boolean
  /** Allows mouse dragging and Ctrl/Cmd+Arrow or Home/End move requests. */
  movable?: boolean
  /** Fired by the edit button of `type="detail"` items. */
  onDetailClick?: () => void
  /** Accessible name of the internal detail-action button; defaults to "Edit". API extension: UI5 ListItemTemplate renders an icon-only detail button without an i18n text key. */
  detailText?: string
}

type ItemRenderOptions = ListItemBaseProps & {
  /** Explicit native-state fixture paint; roles, selection and tabindex remain owned. */
  "data-active"?: string
  /** data-* layout flags for the root (UI5 host attributes). */
  flags: Record<string, string | undefined>
  content: React.ReactNode
  /** Content rendered after `.fiori-li__content` (icon at the end). */
  afterContent?: React.ReactNode
  /** Pads the selection-element side (ui5-li / ui5-li-custom do, tree items don't). */
  padSelection: boolean
  /** Hides the radio / check box (ui5-tree-item-custom hide-selection-element). */
  hideSelectionElement?: boolean
}

function ListItemRoot({
  value: valueProp,
  type = "active",
  highlight = "none",
  navigated,
  disabled,
  movable = false,
  onDetailClick,
  detailText: detailTextProp,
  flags,
  content,
  afterContent,
  padSelection,
  className,
  onKeyDown,
  onKeyUp,
  onClick,
  onFocus,
  onBlur,
  onPointerDown,
  "aria-label": accessibleName,
  "aria-labelledby": externalNameRef,
  "aria-describedby": externalDescriptionRef,
  "data-active": activeFlag,
  ...props
}: ItemRenderOptions) {
  const { t } = useFioriLocale()
  const detailText = detailTextProp ?? t("UPLOADCOLLECTIONITEM_EDIT_BUTTON_TEXT", "Edit") // UI5 UPLOADCOLLECTIONITEM_EDIT_BUTTON_TEXT

  const { core, value, selected, active, actionable, inactive, handlers } = useListItemBehaviour({
    value: valueProp,
    type,
    disabled,
    onKeyDown,
    onKeyUp,
    onClick,
    onFocus,
    onPointerDown,
  })
  const contentId = React.useId()
  const descId = React.useId()
  const nameId = React.useId()
  const customId = React.useId()
  const [customText, setCustomText] = React.useState("")
  const listTexts = core.texts ?? defaultListTexts
  const custom = flags["data-custom"] !== undefined
  const nameText = [accessibleName, type === "active" && listTexts.active].filter(Boolean).join(" ")
  const mode = core.mode
  // UI5: only Multiple / Single / SingleStart / SingleEnd announce selection (not SingleAuto).
  const ariaSelected = mode === "multiple" || (isSingle(mode) && mode !== "singleAuto") ? selected : undefined
  const effectiveRole = props.role ?? core.itemRole
  const before = mode === "multiple" || mode === "singleStart"
  const after = mode === "singleEnd" || mode === "delete"
  const sel = <SelectionElement core={core} value={value} selected={selected} inactive={inactive} disabled={disabled} />
  return (
    <li
      {...props}
      data-slot="list-item"
      data-item-type={type}
      // UI5 ListItemTemplate uses movable independently of disabled; List._moveItem accepts programmatic focus moves.
      data-movable={movable ? "" : undefined}
      draggable={movable}
      data-nav-key={value}
      data-li-row=""
      data-selected={selected ? "" : undefined}
      data-actionable={actionable && !disabled ? "" : undefined}
      // Preserve the existing native-state fixture flag when spreading other
      // consumer attributes before the component-owned accessibility channels.
      data-active={activeFlag ?? (active && actionable ? "" : undefined)}
      data-has-border={core.hasBorder(value) ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-highlight={highlight !== "none" ? highlight : undefined}
      data-mode={mode}
      data-pad-selection={padSelection ? "" : undefined}
      {...flags}
      role={effectiveRole}
      tabIndex={props.tabIndex ?? (disabled ? -1 : core.currentKey === value ? 0 : -1)}
      // ListItem.js:_ariaSelected derives state from mode, and _accInfo uses
      // the effective item role. A caller's valid Option/TreeItem role keeps it.
      aria-selected={effectiveRole === "option" || effectiveRole === "treeitem" ? ariaSelected : undefined}
      aria-disabled={disabled || undefined}
      aria-labelledby={cn(customText && customId, externalNameRef, !custom && !accessibleName && !externalNameRef && contentId, nameId)}
      aria-describedby={cn(externalDescriptionRef, descId)}
      className={cn("fiori-li", className)}
      {...handlers}
      onFocus={(event) => {
        handlers.onFocus?.(event)
        // ListItemCustom.js:_onfocusin prepends CustomAnnouncement to the
        // existing labelled-by targets, and _onfocusout clears it again.
        if (custom && !accessibleName && !event.currentTarget.hasAttribute("data-moving")) {
          const content = event.currentTarget.querySelector<HTMLElement>(".fiori-li__content")
          // ListItemCustom.js:accessibilityInfo includes default-slot content and
          // _getDeleteButtonNodes; selection/detail controls are not content nodes.
          const deleteButtons = event.currentTarget.querySelectorAll<HTMLElement>(".fiori-li__deletebtn [data-slot='button']")
          setCustomText(getCustomAnnouncement(event.currentTarget, listTexts, { rootInfo: { type: listTexts.customItem, children: [...(content?.childNodes ?? []), ...deleteButtons] } }))
        }
      }}
      onBlur={(event) => { onBlur?.(event); if (custom && !accessibleName && !event.currentTarget.hasAttribute("data-moving")) setCustomText("") }}
    >
      {before && sel}
      {highlight !== "none" && <div className="fiori-li__highlight" />}
      <div id={contentId} className="fiori-li__content">
        {content}
      </div>
      {afterContent}
      {type === "detail" && (
        <div className="fiori-li__detailbtn">
          <Button
            variant="transparent"
            size="icon"
            aria-label={detailText}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              onDetailClick?.()
            }}
          >
            <Icon icon={edit} />
          </Button>
        </div>
      )}
      {type === "navigation" && <Icon icon={slimArrowRight} className="fiori-li__nav-icon" />}
      {navigated && <div className="fiori-li__navigated" />}
      {after && sel}
      <span id={nameId} className="sr-only">{nameText}</span>
      {customText && <span id={customId} hidden>{customText}</span>}
      <span id={descId} className="sr-only">{ariaSelected === undefined ? "" : selected ? core.selectedText : core.notSelectedText}</span>
    </li>
  )
}

type ListItemStandardProps = Omit<ListItemBaseProps, "children"> & {
  /** Title. `children` is used when omitted. */
  text?: React.ReactNode
  children?: React.ReactNode
  description?: React.ReactNode
  icon?: FioriIconData
  /** Shows `icon` at the end of the item instead of the beginning. */
  iconEnd?: boolean
  additionalText?: React.ReactNode
  additionalTextState?: ListAdditionalTextState
  /** An <Avatar> or <img> shown at the start (UI5 `image` slot). */
  image?: React.ReactNode
}

function AdditionalText({ text, state }: { text: React.ReactNode; state: ListAdditionalTextState }) {
  return (
    <span className="fiori-li__additional-text" data-state={state !== "none" ? state : undefined}>
      {text}
    </span>
  )
}

/** ui5-li */
function ListItemStandard({
  text,
  children,
  description,
  icon,
  iconEnd,
  additionalText,
  additionalTextState = "none",
  image,
  ...props
}: ListItemStandardProps) {
  const texts = useListCore().texts ?? defaultListTexts
  const title = text ?? children
  const hasTitle = title != null && title !== ""
  const additional = additionalText ? <AdditionalText text={additionalText} state={additionalTextState} /> : null
  return (
    <ListItemRoot
      {...props}
      padSelection
      flags={{
        "data-description": description ? "" : undefined,
        "data-has-title": hasTitle ? "" : undefined,
        "data-image": image ? "" : undefined,
        "data-icon-end": icon && iconEnd ? "" : undefined,
      }}
      content={
        <>
          {image && <div className="fiori-li__image">{image}</div>}
          {icon && !iconEnd && <Icon icon={icon} className="fiori-li__icon" />}
          <div className="fiori-li__text-wrapper">
            <span className="fiori-li__title">{title}</span>
            {description && (
              <div className="fiori-li__description-wrapper">
                <span className="fiori-li__desc">{description}</span>
                {additional}
              </div>
            )}
            {/* ListItemStandardTemplate.js:listItemContent includes the non-active type hint.
             * Separate its text from the title in React's inline DOM as Chromium does
             * when composing the native shadow content's accessible name. */}
            {props.type && props.type !== "active" && props.type !== "inactiveSelectable" && <span className="sr-only"> {texts[props.type]}</span>}
          </div>
          {!description && additional}
        </>
      }
      afterContent={icon && iconEnd ? <Icon icon={icon} className="fiori-li__icon" /> : undefined}
    />
  )
}

type ListItemCustomProps = ListItemBaseProps

/** ui5-li-custom: any content. Tab moves into the content; F2 toggles between item and content. */
function ListItemCustom({ children, ...props }: ListItemCustomProps) {
  return <ListItemRoot {...props} padSelection flags={{ "data-custom": "" }} content={children} />
}

type ListItemGroupHeaderProps = Omit<React.ComponentProps<"li">, "value"> & {
  /** Identifies the header for keyboard navigation. */
  value?: string
  /** UI5 accessibleName is appended to the visible title on the header li. Native aria-label overrides it. */
  accessibleName?: string
  texts?: { groupHeader?: string }
}

/** ui5-li-group-header: focusable in the arrow-key order, never selectable. */
function ListItemGroupHeader({ value: valueProp, className, children, onFocus, accessibleName, ownedGroup, texts, ...props }: ListItemGroupHeaderProps & { ownedGroup?: { id: string; label: string } }) {
  const { t } = useFioriLocale()
  const core = useListCore()
  const autoId = React.useId()
  const key = valueProp ?? autoId
  const titleRef = React.useRef<HTMLSpanElement>(null)
  const [titleText, setTitleText] = React.useState(typeof children === "string" ? children : "")
  React.useLayoutEffect(() => { setTitleText(titleRef.current?.textContent ?? "") }, [children])
  return (
    <li
      data-slot="list-item-group-header"
      data-nav-key={key}
      data-has-border={core.hasBorder(key) ? "" : undefined}
      role={core.itemRole === "option" ? undefined : "listitem"}
      // ListItemGroupHeaderTemplate.js names the visible title plus accessibleName.
      aria-label={[titleText, accessibleName].filter(Boolean).join(" ") || undefined}
      aria-roledescription={texts?.groupHeader ?? core.texts?.groupHeader ?? t("GROUP_HEADER_TEXT", "Group Header")}
      tabIndex={core.currentKey === key ? 0 : -1}
      className={cn("fiori-li-group-header", className)}
      onFocus={(e) => {
        onFocus?.(e)
        core.setCurrentKey(key)
      }}
      onKeyDown={(e) => {
        props.onKeyDown?.(e)
        if (e.defaultPrevented || e.key !== "Tab") return
        if (e.shiftKey) core.forwardBefore()
        else core.forwardAfter(e)
      }}
      {...props}
    >
      <div className="fiori-li-group-header__content">
        <span ref={titleRef} className="fiori-li-group-header__title">{children}</span>
      </div>
      {/* ListItemGroupTemplate.js: the header owns a named sub-list of sibling items. */}
      {ownedGroup && <div role="list" aria-label={ownedGroup.label} aria-owns={ownedGroup.id} />}
    </li>
  )
}

type ListItemGroupProps = Omit<React.ComponentProps<"li">, "value"> & {
  headerText?: string
  /** Custom header content; replaces `headerText`. */
  header?: React.ReactNode
}

/** ui5-li-group: a header followed by its items. */
function ListItemGroup({ headerText, header, className, children, ...props }: ListItemGroupProps) {
  const core = useListCore()
  const headerId = React.useId()
  const contentId = React.useId()
  const listbox = core.itemRole === "option"
  const hasHeader = !!(header ?? headerText)
  return (
    <li
      data-slot="list-item-group"
      role={listbox ? "group" : "none"}
      aria-labelledby={listbox && hasHeader ? headerId : undefined}
      className={cn("fiori-li-group", className)}
      {...props}
    >
      <ul role="none" className="fiori-li-group__ul">
        {hasHeader && <ListItemGroupHeader id={headerId} ownedGroup={listbox ? undefined : { id: contentId, label: headerText ?? "" }}>{header ?? headerText}</ListItemGroupHeader>}
        <div id={contentId}>{children}</div>
      </ul>
    </li>
  )
}

export {
  List,
  ListItemStandard,
  ListItemStandard as ListItem,
  ListItemCustom,
  ListItemGroup,
  ListItemGroupHeader,
  // Shared with Tree (registry/ui/tree.tsx); not meant for direct use.
  ListCoreContext,
  useListCoreValue,
  useListItemBehaviour,
  handleNavigationKey,
  SelectionElement,
  AdditionalText,
  isSingle,
  navItems,
  type ListProps,
  type ListTexts,
  type ListItemStandardProps,
  type ListItemCustomProps,
  type ListItemGroupProps,
  type ListItemGroupHeaderProps,
  type ListSelectionMode,
  type ListItemType,
  type ListItemHighlight,
  type ListSeparators,
  type ListGrowing,
  type ListAdditionalTextState,
  type ListAccessibleRole,
  type ListCore,
  type CustomAccessibilityInfo,
  getCustomAnnouncement,
}
