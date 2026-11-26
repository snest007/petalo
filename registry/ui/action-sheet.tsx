// Portions derived from UI5 Web Components for React 2.28.2 and UI5 Web Components 2.28.1.
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo. SPDX-License-Identifier: Apache-2.0
"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { PopoverBody } from "@/components/ui/popover"
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from "@/components/ui/responsive-popover"
import type { FioriIconData } from "@/lib/fiori-icons"
import { useFioriLocale, useFioriTexts, type FioriDirection } from "@/lib/fiori-locale"
import { useIsPhone } from "@/lib/use-is-phone"
import { cn } from "@/lib/utils"

declare const process: { env: { NODE_ENV?: string } }

type ActionSheetTexts = {
  availableActions: string
  itemPosition: (position: number, total: number) => string
  cancel: string
  cancelDescription: string
  header: string
  content: string
  footer: string
}

const defaultTexts: ActionSheetTexts = {
  availableActions: "Available Actions", // WCR AVAILABLE_ACTIONS
  itemPosition: (position, total) => `Item ${position} of ${total}`, // WCR X_OF_Y
  cancel: "Cancel", // WCR CANCEL
  cancelDescription: "Negative Action", // UI5 BUTTON_ARIA_TYPE_REJECT
  header: "Header", // UI5 DIALOG_HEADER_ARIA_LABEL
  content: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  footer: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
}
const textKeys = {
  availableActions: "wcr:AVAILABLE_ACTIONS",
  itemPosition: "wcr:X_OF_Y",
  cancel: "wcr:CANCEL",
  cancelDescription: "BUTTON_ARIA_TYPE_REJECT",
  header: "DIALOG_HEADER_ARIA_LABEL",
  content: "DIALOG_CONTENT_ARIA_LABEL",
  footer: "DIALOG_FOOTER_ARIA_LABEL",
} as const

type ActionSheetAction = {
  id: string
  label: string
  icon?: FioriIconData
  disabled?: boolean
  /** Overrides the action name while retaining its localized position. */
  accessibleName?: string
}
type ActionSheetSlot = "root" | "trigger" | "surface" | "header" | "title" | "content" | "footer" | "actions" | "action" | "icon" | "cancel"
type ActionSheetTriggerProps = Pick<ButtonProps, "className" | "variant" | "size" | "disabled" | "title" | "aria-label" | "aria-describedby">
/** @accessibility aria-label, aria-labelledby, aria-describedby and aria-description name or describe the popup. The trigger and action buttons keep their native semantics. */
type ActionSheetProps = Pick<React.ComponentProps<"div">, "id" | "className" | "style" | "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-description"> & {
  trigger: React.ReactNode
  triggerProps?: ActionSheetTriggerProps
  actions: readonly ActionSheetAction[]
  onAction?: (action: ActionSheetAction, event: React.MouseEvent<HTMLButtonElement>) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Visible only on phones. */
  headerText?: string
  hideCancelButton?: boolean
  /** Experimental styles for component-owned parts. */
  classNames?: Partial<Record<ActionSheetSlot, string>>
  texts?: Partial<ActionSheetTexts>
  locale?: string
  dir?: FioriDirection
  portal?: boolean
  preventInitialFocus?: boolean
}

const ownedTriggerProps = ["asChild", "children", "dangerouslySetInnerHTML", "id", "role", "tabIndex", "aria-hidden", "aria-controls", "aria-expanded", "aria-haspopup", "data-slot"] as const
function protectTrigger(props?: ActionSheetTriggerProps) {
  const safe = { ...props } as Record<string, unknown>
  for (const key of ownedTriggerProps) {
    if (safe[key] === undefined) continue
    if (process.env.NODE_ENV !== "production") console.warn(`ActionSheet.trigger: ignored ownership prop ${key}`)
    delete safe[key]
  }
  return safe as ActionSheetTriggerProps
}

function ActionSheet({
  trigger, triggerProps, actions, onAction, open: openProp, defaultOpen = false, onOpenChange,
  headerText, hideCancelButton = false, className, classNames, texts: overrides, locale, dir,
  portal = true, preventInitialFocus = false, id, style,
  "aria-label": label, "aria-labelledby": labelledBy, "aria-describedby": describedBy, "aria-description": description,
}: ActionSheetProps) {
  const phone = useIsPhone()
  const { dir: localeDir, localized, hasProvider } = useFioriLocale(locale)
  const texts = useFioriTexts(defaultTexts, textKeys, overrides, locale)
  const root = React.useRef<HTMLDivElement>(null)
  const rows = React.useRef<HTMLDivElement>(null)
  const [localOpen, setLocalOpen] = React.useState(defaultOpen)
  const open = openProp ?? localOpen
  const direction = dir ?? (localized || hasProvider ? localeDir : undefined)
  const [inheritedDir, setInheritedDir] = React.useState<FioriDirection>("ltr")
  React.useLayoutEffect(() => {
    const node = root.current
    if (direction || !node) return
    const update = () => setInheritedDir(getComputedStyle(node).direction === "rtl" ? "rtl" : "ltr")
    update()
    const observer = new MutationObserver(update)
    for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
      observer.observe(parent, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    }
    return () => observer.disconnect()
  }, [direction])
  const changeOpen = (next: boolean) => {
    if (openProp === undefined) setLocalOpen(next)
    onOpenChange?.(next)
  }

  const hasCancel = phone && !hideCancelButton
  const cancelIndex = actions.length
  const [focused, setFocused] = React.useState<string | null>()
  const firstEnabled = actions.findIndex(action => !action.disabled)
  const previousIndex = focused === null ? (hasCancel ? cancelIndex : -1) : actions.findIndex(action => action.id === focused && !action.disabled)
  const activeIndex = previousIndex >= 0 ? previousIndex : firstEnabled < 0 && hasCancel ? cancelIndex : firstEnabled
  const lastIndex = actions.length - (hasCancel ? 0 : 1)
  const focus = (index: number) => rows.current?.querySelector<HTMLButtonElement>(`[data-action-index="${index}"]`)?.focus()

  // WCR ActionSheet/index.js handleKeyDown navigates the source indices and includes Cancel on phones.
  // The native disabled button (ButtonTemplate.js) cannot take focus.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action-index]")
    if (!button || !rows.current?.contains(button)) return
    const rtl = rows.current.matches(":dir(rtl)")
    const index = Number(button.dataset.actionIndex)
    let next: number
    switch (event.key) {
      case "ArrowDown":
      case rtl ? "ArrowLeft" : "ArrowRight": next = Math.min(index + 1, lastIndex); break
      case "ArrowUp":
      case rtl ? "ArrowRight" : "ArrowLeft": next = Math.max(0, index - 1); break
      case "PageDown": next = Math.min(index + 5, lastIndex); break
      case "PageUp": next = Math.max(0, index - 5); break
      case "Home": next = 0; break
      case "End": next = lastIndex; break
      default: return
    }
    event.preventDefault()
    focus(next)
  }
  const triggerOptions = protectTrigger(triggerProps)
  const surfaceDir = direction ?? inheritedDir
  const list = <div ref={rows} data-slot="action-sheet-actions" role="application" className={classNames?.actions} onKeyDown={handleKeyDown}>
    {actions.map((action, index) => <Button key={action.id} variant="transparent" data-slot="action-sheet-action"
      className={cn("justify-start", classNames?.action)} disabled={action.disabled} data-disabled={action.disabled || undefined}
      data-action-index={index} tabIndex={action.disabled ? undefined : activeIndex === index ? 0 : -1}
      // WCR ActionSheetButton adds the position to each accessible name. The total excludes Cancel.
      aria-label={`${action.accessibleName ?? action.label} ${texts.itemPosition(index + 1, actions.length)}`}
      onFocus={() => setFocused(action.id)} onClick={(event) => { changeOpen(false); onAction?.(action, event) }}>
      {action.icon && <Icon icon={action.icon} data-slot="action-sheet-icon" className={classNames?.icon} />}
      <bdi>{action.label}</bdi>
    </Button>)}
    {hasCancel && <Button variant="negative" data-slot="action-sheet-cancel" className={classNames?.cancel}
      texts={{ negative: texts.cancelDescription }} tabIndex={activeIndex === cancelIndex ? 0 : -1}
      data-action-index={cancelIndex} onFocus={() => setFocused(null)} onClick={() => changeOpen(false)}>{texts.cancel}</Button>}
  </div>

  return <div ref={root} id={id} style={style} dir={direction} data-slot="action-sheet"
    data-state={open ? "open" : "closed"} data-device={phone ? "phone" : "desktop"} className={cn("inline-flex", classNames?.root, className)}>
    <ResponsivePopover open={open} onOpenChange={changeOpen} dir={surfaceDir} modal={phone}>
      <ResponsivePopoverTrigger asChild><Button {...triggerOptions} data-slot="action-sheet-trigger"
        className={cn(triggerOptions.className, classNames?.trigger)}>{trigger}</Button></ResponsivePopoverTrigger>
      <ResponsivePopoverContent portal={portal} data-slot="action-sheet-surface" data-device={phone ? "phone" : "desktop"}
        className={cn("fiori-action-sheet", classNames?.surface)}
        phoneClassName="inset-auto inset-x-0 bottom-0 m-0 h-auto rounded-(--fiori-wcr-actionsheet-mobileheaderborderradius)" side={surfaceDir === "rtl" ? "left" : "right"}
        // Popup.js emits aria-modal for its dialog role. The desktop popover still dismisses on an outside click.
        aria-modal={true} aria-label={label ?? texts.availableActions} aria-labelledby={labelledBy} aria-describedby={describedBy} aria-description={description}
        phoneHeader={<div data-slot="action-sheet-header" role="region" aria-label={texts.header} className={classNames?.header}>
          {headerText && <h1 data-slot="action-sheet-title" className={classNames?.title}>{headerText}</h1>}
        </div>}
        // ResponsivePopoverTemplate.js projects a footer slot even when empty.
        phoneFooter={<div data-slot="action-sheet-footer" role="region" aria-label={texts.footer} className={classNames?.footer} />}
        onKeyDown={(event) => { if (event.key === "Tab") event.preventDefault() }}
        onOpenAutoFocus={(event) => {
          if (!preventInitialFocus && activeIndex < 0) return
          event.preventDefault()
          if (!preventInitialFocus) focus(activeIndex)
        }}>
        {phone ? <div role="region" aria-label={texts.content} data-slot="action-sheet-content" className={classNames?.content}>{list}</div>
          : <PopoverBody data-slot="action-sheet-content" className={classNames?.content}>{list}</PopoverBody>}
      </ResponsivePopoverContent>
    </ResponsivePopover>
  </div>
}

export { ActionSheet, type ActionSheetAction, type ActionSheetProps, type ActionSheetSlot, type ActionSheetTexts }
