// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { collatorIncludes, useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"

// UI5 InputPopoverTemplate/Popup.onEnterDOM: the standalone value-state message is a Popup scope.

import { alert, error, information, sysEnter2 } from "@/lib/fiori-icons"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { useIsPhone } from "@/lib/use-is-phone"

// Record input origin before a pointer-opened popup mounts its Input. UI5 Input.css.js
// paints pointer focus too; document modality enforces AGENTS rule 5, including autofocus.
const inputFocusModality = new WeakMap<Document, { keyboard: boolean }>()
function getInputFocusModality(owner: Document) {
  let state = inputFocusModality.get(owner)
  if (!state) {
    state = { keyboard: true }
    const current = state
    owner.addEventListener("keydown", () => { current.keyboard = true }, true)
    owner.addEventListener("pointerdown", () => { current.keyboard = false }, true)
    inputFocusModality.set(owner, current)
  }
  return state
}
if (typeof document !== "undefined") getInputFocusModality(document)

type ValueState = "none" | "negative" | "critical" | "positive" | "information"

const valueStateIcons = { negative: error, critical: alert, positive: sysEnter2, information: information }
const valueStateDefaultText: Record<Exclude<ValueState, "none">, string> = {
  negative: "Invalid entry", // UI5 VALUE_STATE_ERROR
  critical: "Warning issued", // UI5 VALUE_STATE_WARNING
  positive: "Entry successfully validated", // UI5 VALUE_STATE_SUCCESS
  information: "Informative entry", // UI5 VALUE_STATE_INFORMATION
}
type InputTexts = typeof valueStateDefaultText
const valueStateTextKeys = { negative: "VALUE_STATE_ERROR", critical: "VALUE_STATE_WARNING", positive: "VALUE_STATE_SUCCESS", information: "VALUE_STATE_INFORMATION" } as const
function useValueStateTexts(texts?: Partial<InputTexts>) { return useFioriTexts(valueStateDefaultText, valueStateTextKeys, texts) }

/**
 * @accessibility Tab reaches the inner native input. Connect Label.htmlFor to Input.id, or pass aria-label / aria-labelledby; these native ARIA props land on the input, not its visual wrapper.
 * @accessibility aria-description passes to the inner native input (UI5 accessibleDescription); aria-labelledby / aria-describedby pass reference channels to that same input.
 * @accessibility aria-describedby on the input is merged with the focused value-state message id. Negative sets aria-invalid; valueStateMessage is the overridable role=status message. Read-only and disabled fields hide that message.
 */
type InputFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  valueState?: ValueState
  /**
   * Text shown below the field while it has focus (Fiori's value state message).
   * Defaults to SAP's standard text for the state; pass `null` to hide it.
   */
  valueStateMessage?: React.ReactNode | null
  /** Trailing content inside the field, e.g. a value-help <InputIcon>. */
  icon?: React.ReactNode
  wrapperClassName?: string
  /** UI5 value-state texts; explicit valueStateMessage has precedence. */
  texts?: Partial<InputTexts>
  classNames?: Partial<Record<InputSlot, string>>
}

// Mirrors ui5-input (Horizon): bottom-border field, inner focus ring, value states with a
// message popover that appears while the field is focused.
function InputField({
  className,
  wrapperClassName,
  classNames,
  fieldContent,
  onMessageKeyDown,
  describeMessage = true,
  rootDir,
  open,
  valueState = "none",
  valueStateMessage,
  texts: textsProp,
  icon,
  disabled,
  readOnly,
  id,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputFieldProps & {
  fieldContent?: React.ReactNode
  rootDir?: string
  open?: boolean
  onMessageKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  describeMessage?: boolean
}) {
  const texts = useValueStateTexts(textsProp)
  const autoId = React.useId()
  const messageId = `${id ?? autoId}-vsm`
  const hasState = valueState !== "none"
  const message = valueStateMessage === undefined && hasState ? texts[valueState] : valueStateMessage
  const showMessage = hasState && message != null && !readOnly && !disabled

  return (
    <div
      onPointerDownCapture={(event) => event.currentTarget.setAttribute("data-pointer-focus", "")}
      onFocusCapture={(event) => {
        if (getInputFocusModality(event.currentTarget.ownerDocument).keyboard) event.currentTarget.removeAttribute("data-pointer-focus")
        else event.currentTarget.setAttribute("data-pointer-focus", "")
      }}
      onKeyDownCapture={(event) => event.currentTarget.removeAttribute("data-pointer-focus")}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute("data-pointer-focus") }}
      dir={rootDir}
      data-slot="input"
      data-suggestions-open={open || undefined}
      data-value-state={hasState ? valueState : undefined}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      data-icons={icon ? "" : undefined}
      style={{ "--fiori-field-icons": icon ? 1 : 0 } as React.CSSProperties}
      className={cn("fiori-field group/field my-(--fiori-input-margin-top-bottom)", classNames?.root, wrapperClassName)}
    >
      <input
        id={id}
        data-slot={fieldContent ? "input-field" : undefined}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={valueState === "negative" || undefined}
        aria-describedby={cn(ariaDescribedBy, describeMessage && showMessage && messageId) || undefined}
        className={cn("fiori-field__input", classNames?.field, className)}
        {...props}
      />
      {icon}
      {showMessage && (
        <div
          id={messageId}
          role="status"
          data-slot={fieldContent ? "input-value-state-message" : undefined}
          onKeyDown={onMessageKeyDown}
          data-popover=""
          data-sap-ui-fastnavgroup-container="true"
          data-value-state={valueState}
          className={cn(
            "fiori-value-state-message absolute start-0 top-full z-50 mt-1 hidden max-w-[22rem]",
            "group-focus-within/field:block", classNames?.message
          )}
        >
          <Icon icon={valueStateIcons[valueState]} />
          {message}
        </div>
      )}
      {fieldContent}
    </div>
  )
}

type InputIconProps = React.ComponentProps<"span">

/** Container for a trailing icon inside <Input icon={...}>. Wrap a <button> for value help. */
function InputIcon({ className, ...props }: InputIconProps) {
  return <span data-slot="input-icon" className={cn("fiori-field__icon", className)} {...props} />
}


const suggestionDefaults = {
  description: "Suggestions Available", // UI5 INPUT_SUGGESTIONS
  title: "All Items", // UI5 INPUT_SUGGESTIONS_TITLE
  popupLabel: "Available Values", // UI5 INPUT_AVALIABLE_VALUES
  oneHit: "1 result available", // UI5 INPUT_SUGGESTIONS_ONE_HIT
  moreHits: (count: number) => `${count} results are available`, // UI5 INPUT_SUGGESTIONS_MORE_HITS
  noHit: "No results", // UI5 INPUT_SUGGESTIONS_NO_HIT
  expanded: "Expanded", // UI5 INPUT_SUGGESTIONS_EXPANDED
  collapsed: "Collapsed", // UI5 INPUT_SUGGESTIONS_COLLAPSED
  ok: "OK", // UI5 INPUT_SUGGESTIONS_OK_BUTTON
  cancel: "Cancel", // UI5 INPUT_SUGGESTIONS_CANCEL_BUTTON
  position: (position: number, count: number) => `List item ${position} of ${count}`, // UI5 LIST_ITEM_POSITION
  groupHeader: "Group Header", // UI5 LIST_ITEM_GROUP_HEADER
  groups: (count: number) => `contains ${count} sub groups`, // UI5 LIST_ROLE_LISTBOX_GROUP_DESCRIPTION
  list: "Contains Selectable Items", // UI5 ARIA_LABEL_LIST_SELECTABLE
  groupDescription: "Group Header", // UI5 GROUP_HEADER_TEXT
  headerRegion: "Header", // UI5 DIALOG_HEADER_ARIA_LABEL
  contentRegion: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  footerRegion: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
  negativeType: "Value State Error", // UI5 VALUE_STATE_TYPE_ERROR
  criticalType: "Value State Warning", // UI5 VALUE_STATE_TYPE_WARNING
  positiveType: "Value State Success", // UI5 VALUE_STATE_TYPE_SUCCESS
  informationType: "Value State Information", // UI5 VALUE_STATE_TYPE_INFORMATION
  stateLink: "To move the focus to the link, press Ctrl+Alt+F8", // UI5 VALUE_STATE_LINK
  stateLinkMac: "To move the focus to the link, press Cmd+Option+F8", // UI5 VALUE_STATE_LINK_MAC
  stateLinks: "To go to the first link, press Ctrl+Alt+F8. To move to the next link, use Tab", // UI5 VALUE_STATE_LINKS
  stateLinksMac: "To go to the first link, press Cmd+Option+F8. To move to the next link, use Tab", // UI5 VALUE_STATE_LINKS_MAC
  defaultAction: "Default Action", // UI5 BUTTON_ARIA_TYPE_EMPHASIZED
}
const suggestionTextKeys = {
  description: "INPUT_SUGGESTIONS", title: "INPUT_SUGGESTIONS_TITLE", popupLabel: "INPUT_AVALIABLE_VALUES",
  oneHit: "INPUT_SUGGESTIONS_ONE_HIT", moreHits: "INPUT_SUGGESTIONS_MORE_HITS", noHit: "INPUT_SUGGESTIONS_NO_HIT",
  expanded: "INPUT_SUGGESTIONS_EXPANDED", collapsed: "INPUT_SUGGESTIONS_COLLAPSED",
  ok: "INPUT_SUGGESTIONS_OK_BUTTON", cancel: "INPUT_SUGGESTIONS_CANCEL_BUTTON",
  position: "LIST_ITEM_POSITION", groupHeader: "LIST_ITEM_GROUP_HEADER",
  groups: "LIST_ROLE_LISTBOX_GROUP_DESCRIPTION", list: "ARIA_LABEL_LIST_SELECTABLE", groupDescription: "GROUP_HEADER_TEXT",
  headerRegion: "DIALOG_HEADER_ARIA_LABEL", contentRegion: "DIALOG_CONTENT_ARIA_LABEL", footerRegion: "DIALOG_FOOTER_ARIA_LABEL",
  negativeType: "VALUE_STATE_TYPE_ERROR", criticalType: "VALUE_STATE_TYPE_WARNING",
  positiveType: "VALUE_STATE_TYPE_SUCCESS", informationType: "VALUE_STATE_TYPE_INFORMATION",
  stateLink: "VALUE_STATE_LINK", stateLinkMac: "VALUE_STATE_LINK_MAC",
  stateLinks: "VALUE_STATE_LINKS", stateLinksMac: "VALUE_STATE_LINKS_MAC",
  defaultAction: "BUTTON_ARIA_TYPE_EMPHASIZED",
} as const

type InputSuggestionTexts = typeof suggestionDefaults
type InputSlot = "root" | "field" | "message" | "popup" | "list" | "group" | "groupHeader" | "item" |
  "itemText" | "additionalText" | "phoneHeader" | "phoneField" | "phoneFooter"
type InputSuggestionFilter = "None" | "StartsWith" | "StartsWithPerTerm" | "Contains"
type InputSuggestion = { text: string; additionalText?: string }
type InputSuggestionPreview = InputSuggestion | { headerText: string }
type InputSuggestionDetail = { source: "keyboard" | "pointer" | "input"; value: string }
type SuggestionItemProps = InputSuggestion & {
  className?: string
  /** Experimental content renderer within the owned option. Keep rendered content noninteractive. */
  renderContent?: (info: InputSuggestion & { defaultContent: React.ReactNode; selected: boolean; query: string; locale: string }) => React.ReactNode
}
type SuggestionItemGroupProps = { headerText: string; children?: React.ReactNode; className?: string }

/** Declare a suggestion inside an Input. Input owns the option host and its semantics. */
function SuggestionItem(_props: SuggestionItemProps) { return null }
/** Declare a heading and its associated suggestion items inside an Input. */
function SuggestionItemGroup(_props: SuggestionItemGroupProps) { return null }

type InputProps = Omit<InputFieldProps, "texts"> & {
  texts?: Partial<InputTexts & InputSuggestionTexts>
  showSuggestions?: boolean
  filter?: InputSuggestionFilter
  noTypeahead?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string) => void
  onSelectionChange?: (item: InputSuggestionPreview | null, detail: InputSuggestionDetail) => void
  onSuggestionItemPreview?: (item: InputSuggestionPreview, detail: InputSuggestionDetail) => void
  onTypeAhead?: (item: InputSuggestion) => void
  locale?: string
}
declare const process: { env: { NODE_ENV?: string } }

function warnItemOwnership(part: string, props: object) {
  if (process.env.NODE_ENV === "production") return
  for (const key of Object.keys(props)) {
    if (key === "id" || key === "role" || key === "tabIndex" || key.startsWith("aria-")) {
      console.warn(`${part}: ignored custom host ownership prop ${key}`)
    }
  }
}

type Option = { id: string; item: SuggestionItemProps }
type Group = { id: string; group: SuggestionItemGroupProps; options: Option[] }
type Entry = Option | Group

function readSuggestions(children: React.ReactNode, prefix: string): Entry[] {
  return React.Children.toArray(children).flatMap((child, index): Entry[] => {
    if (!React.isValidElement(child)) return []
    const id = `${prefix}-${encodeURIComponent(String(child.key ?? index))}`
    if (child.type === React.Fragment) return readSuggestions((child.props as { children?: React.ReactNode }).children, id)
    if (child.type === SuggestionItem) {
      const item = child.props as SuggestionItemProps
      warnItemOwnership("Input.SuggestionItem", item)
      return [{ id, item }]
    }
    if (child.type !== SuggestionItemGroup) return []
    const group = child.props as SuggestionItemGroupProps
    warnItemOwnership("Input.SuggestionItemGroup", group)
    return [{ id, group, options: readSuggestions(group.children, id).filter((entry): entry is Option => "item" in entry) }]
  })
}

function highlightMatch(text: string, query: string, locale: string): React.ReactNode {
  if (!query) return text
  const needle = query.toLocaleLowerCase(locale)
  const folded = text.toLocaleLowerCase(locale)
  const parts: React.ReactNode[] = []
  let from = 0
  for (let start = folded.indexOf(needle); start >= 0; start = folded.indexOf(needle, from)) {
    parts.push(text.slice(from, start), <b key={start}>{text.slice(start, start + query.length)}</b>)
    from = start + needle.length
  }
  return <>{parts}{text.slice(from)}</>
}

/** Add suggestions to a free-text input. Native ARIA names and descriptions still target its input. */
function Input({
  showSuggestions, filter, noTypeahead, open, defaultOpen, onOpenChange, onValueChange,
  onSelectionChange, onSuggestionItemPreview, onTypeAhead, locale, ...props
}: InputProps) {
  if (!showSuggestions) return <InputField {...props} onChange={onValueChange ? (event) => {
    props.onChange?.(event)
    onValueChange(event.currentTarget.value)
  } : props.onChange} />
  return <SuggestingInput {...props} {...{ filter, noTypeahead, open, defaultOpen, onOpenChange, onValueChange,
    onSelectionChange, onSuggestionItemPreview, onTypeAhead, locale }} />
}

function SuggestingInput({
  filter = "None", noTypeahead = false, open: controlledOpen, defaultOpen = false, onOpenChange,
  onValueChange, onSelectionChange, onSuggestionItemPreview, onTypeAhead, locale: localeProp,
  children, texts: overrides, value: controlledValue, defaultValue, disabled, readOnly, type,
  valueState = "none", valueStateMessage, classNames, dir, ref, onChange, onInput, onKeyDown, onFocus, onBlur,
  onClick, "aria-describedby": describedBy, ...props
}: InputProps) {
  const texts = useFioriTexts(suggestionDefaults, suggestionTextKeys, overrides, localeProp)
  const stateTexts = useValueStateTexts(overrides)
  const { locale, dir: localeDir, localized, hasProvider } = useFioriLocale(localeProp)
  const phone = useIsPhone()
  const id = React.useId()
  const input = React.useRef<HTMLInputElement>(null)
  const setInputRef = React.useCallback((node: HTMLInputElement | null) => {
    input.current = node
    if (typeof ref === "function") return ref(node)
    if (ref) ref.current = node
  }, [ref])
  const phoneInput = React.useRef<HTMLInputElement>(null)
  const list = React.useRef<HTMLUListElement>(null)
  const startValue = React.useRef("")
  const lastConfirmed = React.useRef<string | null>(null)
  const selection = React.useRef<[number, number] | undefined>(undefined)
  const lastSelection = React.useRef<InputSuggestionPreview | null>(null)
  const [localValue, setLocalValue] = React.useState(String(defaultValue ?? ""))
  const [localOpen, setLocalOpen] = React.useState(defaultOpen)
  const [query, setQuery] = React.useState<string | null>(null)
  const [display, setDisplay] = React.useState<string | null>(null)
  const [active, setActive] = React.useState<string | null>(null)
  const [match, setMatch] = React.useState<string | null>(null)
  const [announcement, setAnnouncement] = React.useState("")
  const [messageInfo, setMessageInfo] = React.useState({ text: "", links: 0, mac: false })
  const [phoneTitle, setPhoneTitle] = React.useState("")
  const [placement, setPlacement] = React.useState<"above" | "below">("below")

  const enabled = !disabled && !readOnly && type !== "number"
  const direction = dir ?? (hasProvider || localized ? localeDir : undefined)
  const value = String(controlledValue ?? localValue)
  const typed = query ?? value
  const fieldValue = display ?? value
  const compareLocale = localized ? locale : undefined
  const entries = readSuggestions(children, id)
  const allOptions = entries.flatMap((entry) => "item" in entry ? [entry] : entry.options)
  function matches(option: Option, text: string) {
    const label = option.item.text
    if (filter === "None") return true
    if (filter === "StartsWithPerTerm") return label.split(/\s+/).some((word) => collatorIncludes(word, text, compareLocale, true))
    return collatorIncludes(label, text, compareLocale, filter === "StartsWith")
  }
  const visible = entries.flatMap((entry): Entry[] => {
    if ("item" in entry) return matches(entry, typed) ? [entry] : []
    const options = entry.options.filter((option) => matches(option, typed))
    return options.length ? [{ ...entry, options }] : []
  })
  const positions = visible.flatMap((entry) => "item" in entry ? [entry] : [entry, ...entry.options])
  const options = positions.filter((entry): entry is Option => "item" in entry)
  const open = enabled && (controlledOpen ?? localOpen) && (phone || options.length > 0)
  const activeIndex = positions.findIndex((entry) => entry.id === active)
  const matchedIndex = positions.findIndex((entry) => entry.id === match)
  const activeField = phone && open ? phoneInput : input
  const count = allOptions.length
  const groupCount = visible.filter((entry) => "group" in entry).length
  const summary = count === 0 ? texts.noHit : count === 1 ? texts.oneHit : texts.moreHits(count)
  const counterText = `${value || open ? summary + " " : ""}${open ? texts.expanded : texts.collapsed}`
  const stateDescription = valueState !== "none" ? [
    texts[`${valueState}Type`],
    typeof valueStateMessage === "string" ? valueStateMessage
      : valueStateMessage === undefined && valueState !== "positive" ? stateTexts[valueState] : messageInfo.text,
  ].filter(Boolean).join(" ") : ""
  const linkHint = messageInfo.links === 0 ? undefined : messageInfo.links === 1
    ? (messageInfo.mac ? texts.stateLinkMac : texts.stateLink)
    : (messageInfo.mac ? texts.stateLinksMac : texts.stateLinks)
  const popupMessage = valueState !== "none" && (valueState !== "positive" || valueStateMessage != null)
    ? valueStateMessage === undefined ? stateTexts[valueState] : valueStateMessage : null

  React.useLayoutEffect(() => {
    const field = activeField.current
    const range = selection.current
    selection.current = undefined
    if (range && field?.selectionStart != null) field.setSelectionRange(...range)
  })

  React.useLayoutEffect(() => {
    if (!open || phone || !input.current || !list.current) return
    const field = input.current.parentElement!
    const popup = list.current.parentElement!
    function measure() {
      const box = field.getBoundingClientRect()
      const styles = getComputedStyle(field)
      // Popover.js anchors to the UI5 Input host's border box. The inline
      // React surface's absolute containing block starts inside that border.
      popup.style.setProperty("--input-suggestion-anchor-width", `${box.width}px`)
      popup.style.setProperty("--input-suggestion-border-start", styles.borderInlineStartWidth)
      popup.style.setProperty("--input-suggestion-border-top", styles.borderBlockStartWidth)
      popup.style.setProperty("--input-suggestion-border-bottom", styles.borderBlockEndWidth)
      const below = window.innerHeight - box.bottom
      const above = box.top
      const next = popup.scrollHeight > below && above > below ? "above" : "below"
      setPlacement(next)
      popup.style.setProperty("--input-suggestion-available-height", `${Math.max(0, next === "above" ? above : below)}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(field)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [open, phone, options.length])

  function getStateMessage() {
    return input.current?.parentElement?.querySelector<HTMLElement>(
      open ? '[data-slot="input-suggestion-message"]' : '[data-popover][role="status"]',
    )
  }

  React.useLayoutEffect(() => {
    const message = getStateMessage()
    const inspect = () => {
      const next = {
        text: message?.textContent?.trim() ?? "",
        links: message?.querySelectorAll("a[href]").length ?? 0,
        mac: /Mac/.test(navigator.platform),
      }
      setMessageInfo((prev) => prev.text === next.text && prev.links === next.links && prev.mac === next.mac ? prev : next)
    }
    inspect()
    if (!message) return
    const observer = new MutationObserver(inspect)
    observer.observe(message, { childList: true, attributes: true, attributeFilter: ["href"], characterData: true, subtree: true })
    return () => observer.disconnect()
  }, [valueState, valueStateMessage, open, phone])

  function changeOpen(next: boolean) {
    if (controlledOpen === undefined) setLocalOpen(next)
    if (next !== (controlledOpen ?? localOpen)) onOpenChange?.(next)
  }

  function update(next: string) {
    if (controlledValue === undefined) setLocalValue(next)
    if (next !== value) onValueChange?.(next)
  }

  function resetPreview() {
    setActive(null)
    setMatch(null)
    setDisplay(null)
    setAnnouncement("")
  }

  function finish(next?: string) {
    if (next !== undefined) {
      update(next)
      setQuery(next)
      lastConfirmed.current = next
      selection.current = [next.length, next.length]
    }
    changeOpen(false)
    resetPreview()
  }

  // Input.js/_input keeps the user's typed text separate from the selected completion suffix.
  function edit(event: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(event)
    if (event.defaultPrevented) return
    const text = event.currentTarget.value
    const native = event.nativeEvent as InputEvent
    const composing = native.isComposing
    const deleting = /^(delete|history)/.test(native.inputType ?? "")
    const canComplete = !noTypeahead && !deleting && !composing && !/Android/.test(navigator.userAgent)
      && event.currentTarget.selectionEnd === text.length
    const first = text && canComplete ? allOptions.find((option) => matches(option, text)
      && option.item.text.toLocaleLowerCase(locale).startsWith(text.toLocaleLowerCase(locale))) : undefined
    const completed = first ? text + first.item.text.slice(text.length) : text
    resetPreview()
    setQuery(text)
    update(text)
    if (lastSelection.current) {
      lastSelection.current = null
      onSelectionChange?.(null, { source: "input", value: text })
    }
    if (first) {
      setDisplay(completed)
      setMatch(first.id)
      if (completed !== text) {
        selection.current = [text.length, completed.length]
        onTypeAhead?.(first.item)
      }
    }
    if (!phone) changeOpen(!!text && allOptions.some((option) => matches(option, text)))
  }

  function preview(index: number) {
    const entry = positions[index]
    if (!entry) { resetPreview(); return }
    const item = "item" in entry ? entry.item : { headerText: entry.group.headerText }
    const next = "text" in item ? item.text : typed
    setActive(entry.id)
    setDisplay(next)
    setMatch(null)
    setAnnouncement("item" in entry
      ? [entry.item.additionalText, texts.position(options.indexOf(entry) + 1, options.length)].filter(Boolean).join(" ")
      : `${texts.groupHeader} ${entry.group.headerText}`)
    const prefix = next.toLocaleLowerCase(locale).startsWith(typed.toLocaleLowerCase(locale)) ? typed.length : 0
    selection.current = [prefix, next.length]
    lastSelection.current = item
    const detail: InputSuggestionDetail = { source: "keyboard", value: next }
    onSelectionChange?.(item, detail)
    onSuggestionItemPreview?.(item, detail)
    document.getElementById(entry.id)?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  function accept(option: Option, source: "keyboard" | "pointer") {
    if (lastSelection.current !== option.item) {
      lastSelection.current = option.item
      onSelectionChange?.(option.item, { source, value: option.item.text })
    }
    finish(option.item.text)
    if (!phone) input.current?.focus()
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented || event.nativeEvent.isComposing || !enabled) return
    const { key } = event
    const current = positions[activeIndex]
    // Input._handleCtrlAltF8 transfers focus to the message's first link.
    if (key === "F8" && event.altKey && (messageInfo.mac ? event.metaKey : event.ctrlKey)) {
      const first = getStateMessage()?.querySelector<HTMLAnchorElement>("a[href]")
      if (first) { event.preventDefault(); first.focus() }
      return
    }
    if (key === "Escape") {
      event.preventDefault()
      if (open) { event.stopPropagation(); finish(phone ? startValue.current : undefined) }
      else finish(lastConfirmed.current ?? startValue.current)
      return
    }
    if (!open || phone || event.altKey || event.ctrlKey || event.metaKey) return
    // InputSuggestions.js navigates group headers as well as options. Home/End and paging
    // are list navigation only after the user has left the initial text editing position.
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault()
      const index = activeIndex >= 0 ? activeIndex : matchedIndex
      if (key === "ArrowDown" && index < positions.length - 1) preview(index + 1)
      if (key === "ArrowUp" && index >= 0) preview(index - 1)
    } else if (activeIndex >= 0 && ["Home", "End", "PageUp", "PageDown"].includes(key)) {
      event.preventDefault()
      const destination = { Home: 0, End: positions.length - 1,
        PageUp: Math.max(0, activeIndex - 10), PageDown: Math.min(positions.length - 1, activeIndex + 10) }
      preview(destination[key as keyof typeof destination])
    } else if (key === " " && current && "item" in current) {
      event.preventDefault()
      accept(current, "keyboard")
    } else if (key === "Enter" || (key === "Tab" && !event.shiftKey)) {
      if (current && "group" in current && key === "Enter") { event.preventDefault(); return }
      const choice = current && "item" in current ? current : key === "Enter"
        ? options.find((option) => option.id === match || option.item.text.toLocaleLowerCase(locale) === fieldValue.toLocaleLowerCase(locale))
        : undefined
      if (key === "Enter" && choice) event.preventDefault()
      if (choice) accept(choice, "keyboard")
      else finish(key === "Enter" ? fieldValue : undefined)
    }
  }

  // UI5 valueStateNavigation.attachListeners connects links back to the input
  // and lets ArrowDown continue into the visible suggestions.
  function handleMessageKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[href]"))
    const index = links.findIndex((link) => link.contains(event.target as Node))
    if (index < 0) return
    if (event.key === "Tab") {
      const next = links[index + (event.shiftKey ? -1 : 1)]
      if (next) { event.preventDefault(); next.focus() }
      else {
        activeField.current?.focus()
        if (event.shiftKey) event.preventDefault()
        else finish()
      }
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()
      activeField.current?.focus()
      if (event.key === "ArrowDown" && open && !phone) preview(0)
    }
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation() }
  }

  function handleClick(event: React.MouseEvent<HTMLInputElement>) {
    onClick?.(event)
    if (event.defaultPrevented || !phone || !enabled) return
    startValue.current = value
    changeOpen(true)
  }

  const renderOption = (option: Option) => {
    const { item } = option
    const selected = active === option.id || match === option.id
    const defaultContent = <>
      <span data-slot="input-suggestion-text" className={classNames?.itemText}>{highlightMatch(item.text, typed, locale)}</span>
      {item.additionalText && <span data-slot="input-suggestion-additional-text" className={classNames?.additionalText}>{item.additionalText}</span>}
    </>
    const content = item.renderContent?.({ text: item.text, additionalText: item.additionalText, defaultContent, selected, query: typed, locale })
    return <li key={option.id} id={option.id} role="option" aria-selected={selected} tabIndex={-1}
      data-slot="input-suggestion-item" data-selected={selected || undefined} data-active={active === option.id || undefined}
      className={cn("fiori-input-suggestion-item", classNames?.item, item.className)}
      onMouseDown={(event) => event.preventDefault()} onClick={() => accept(option, "pointer")}>
      {item.renderContent ? content : defaultContent}
    </li>
  }
  const listbox = <>
    <span className="sr-only" id={`${id}-list-name`}>{texts.list}</span>
    <ul ref={list} role="listbox" aria-labelledby={`${id}-list-name`}
      aria-description={groupCount ? texts.groups(groupCount) : undefined} data-slot="input-suggestion-list" className={cn("fiori-input-suggestion-list", classNames?.list)}>
    {visible.map((entry) => "item" in entry ? renderOption(entry) : <li key={entry.id} role="none">
      <ul role="group" data-slot="input-suggestion-group" className={cn("fiori-input-suggestion-list", classNames?.group, entry.group.className)}>
        {/* ListItemGroupHeaderTemplate.js exposes the named Group on a div. */}
        <li role="none">
          <div id={entry.id} role="group" aria-roledescription={texts.groupDescription}
            aria-label={entry.group.headerText} data-active={active === entry.id || undefined}
            data-slot="input-suggestion-group-header" className={cn("fiori-input-suggestion-group-header", classNames?.groupHeader)}
            onMouseDown={(event) => event.preventDefault()}>
            {entry.group.headerText}
          </div>
        </li>
        {entry.options.map(renderOption)}
      </ul>
    </li>)}
  </ul></>
  // PopoverTemplate.js renders a header that exposes a nested banner in Chromium.
  // Group the message inside the dialog; Input.ariaValueStateHiddenText still
  // supplies the field description and the keyboard links stay on this host.
  const messageHeader = popupMessage != null && <div role={phone ? undefined : "group"} className="fiori-value-state-message" data-slot="input-suggestion-message" data-value-state={valueState} onKeyDown={handleMessageKey}>
    {valueState !== "none" && <Icon icon={valueStateIcons[valueState]} />}{popupMessage}
  </div>

  return <InputField {...props} disabled={disabled} readOnly={readOnly} type={type} dir={dir} rootDir={direction}
    value={fieldValue} valueState={valueState} valueStateMessage={open ? null : valueStateMessage} texts={overrides} classNames={classNames}
    ref={setInputRef}
    open={open}
    autoComplete={props.autoComplete ?? "off"}
    aria-haspopup={enabled ? "dialog" : props["aria-haspopup"]}
    aria-autocomplete={enabled ? "list" : props["aria-autocomplete"]}
    aria-describedby={cn(enabled && `${id}-suggestions`, stateDescription && `${id}-state-description`, linkHint && `${id}-state-links`, describedBy) || undefined}
    describeMessage={false} onMessageKeyDown={handleMessageKey} onChange={edit} onInput={onInput} onKeyDown={keyDown} onClick={handleClick}
    onFocus={(event) => { startValue.current = value; lastConfirmed.current = null; onFocus?.(event) }}
    onBlur={(event) => {
      onBlur?.(event)
      if (!phone && !event.currentTarget.parentElement?.contains(event.relatedTarget)) {
        finish(display !== null ? fieldValue : undefined)
      }
    }}
    fieldContent={<>
      {enabled && <>
        <span className="sr-only" id={`${id}-suggestions`}>{texts.description}</span>
        <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
        <span className="sr-only" aria-live="polite">{counterText}</span>
      </>}
      {linkHint && <span className="sr-only" id={`${id}-state-links`}>{linkHint}</span>}
      {stateDescription && <span className="sr-only" id={`${id}-state-description`}>{stateDescription}</span>}
      {open && (phone
        ? <DialogPrimitive.Root open>
          <DialogPrimitive.Content className={cn("fiori-input-suggestions-phone", classNames?.popup)}
            data-slot="input-suggestion-popup" aria-label={texts.popupLabel} aria-labelledby={undefined}
            aria-describedby={undefined} aria-modal="true" data-sap-ui-fastnavgroup-container="true"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              startValue.current = value
              setPhoneTitle(Array.from(input.current?.labels ?? [], (label) => label.textContent?.trim()).filter(Boolean).join(" "))
              phoneInput.current?.focus()
            }}
            onCloseAutoFocus={(event) => { event.preventDefault(); input.current?.blur() }}
            onEscapeKeyDown={(event) => { event.preventDefault(); finish(startValue.current) }}>
            <div className={cn("fiori-input-suggestions-phone__header", classNames?.phoneHeader)} data-slot="input-suggestion-phone-header" role="region" aria-label={texts.headerRegion}>
              <DialogPrimitive.Title asChild><h1>{phoneTitle || texts.title}</h1></DialogPrimitive.Title>
              <InputField ref={phoneInput} className={classNames?.phoneField} value={fieldValue} type={type}
                aria-label={phoneTitle || props["aria-label"] || texts.title} placeholder={props.placeholder}
                maxLength={props.maxLength} inputMode={props.inputMode} onChange={edit} onInput={onInput} onKeyDown={keyDown} />
              {messageHeader}
            </div>
            <div className="fiori-input-suggestions-phone__content" role="region" aria-label={texts.contentRegion}>{listbox}</div>
            <div className={cn("fiori-input-suggestions-phone__footer", classNames?.phoneFooter)} data-slot="input-suggestion-phone-footer" role="region" aria-label={texts.footerRegion}>
              <Button variant="emphasized" texts={{ emphasized: texts.defaultAction }} onClick={() => finish(fieldValue)}>{texts.ok}</Button>
              <Button variant="transparent" onClick={() => finish(startValue.current)}>{texts.cancel}</Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Root>
        : <div role="dialog" aria-modal="true" aria-label={texts.popupLabel} data-slot="input-suggestion-popup"
            data-placement={placement} data-sap-ui-fastnavgroup-container="true"
            className={cn("fiori-input-suggestions-popup", classNames?.popup)}>
            {messageHeader}{listbox}
          </div>)}
    </>}
  />
}

export { Input, InputIcon, SuggestionItem, SuggestionItemGroup, useValueStateTexts, valueStateIcons, valueStateDefaultText,
  type InputTexts, type InputProps, type ValueState, type InputSlot, type InputSuggestion,
  type InputSuggestionTexts, type InputSuggestionFilter, type InputSuggestionPreview, type InputSuggestionDetail,
  type SuggestionItemProps, type SuggestionItemGroupProps }
