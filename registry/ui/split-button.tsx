// Portions derived from SAP UI5 Web Components 2.28 (SplitButton), © SAP SE or an
// SAP affiliate company and UI5 contributors. SPDX-License-Identifier: Apache-2.0

"use client"

import * as React from "react"
import { Button, type ButtonProps, type ButtonTexts } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Menu, MenuTrigger } from "@/components/ui/menu"
import { slimArrowDown, type FioriIconData } from "@/lib/fiori-icons"
import { useFioriTexts } from "@/lib/fiori-locale"
import { cn } from "@/lib/utils"

// Bundlers inline NODE_ENV; installed browser projects do not require Node types.
declare const process: { env: { NODE_ENV?: string } }

const defaultTexts = {
  description: "Split Button", // UI5 SPLIT_BUTTON_DESCRIPTION
  keyboardHint: "Press Space or Enter to trigger default action and Alt + Arrow Down or F4 to trigger arrow action", // UI5 SPLIT_BUTTON_KEYBOARD_HINT
  arrowLabel: "Open Menu", // UI5 SPLIT_BUTTON_ARROW_BUTTON_TOOLTIP
}

const textKeys = {
  description: "SPLIT_BUTTON_DESCRIPTION",
  keyboardHint: "SPLIT_BUTTON_KEYBOARD_HINT",
  arrowLabel: "SPLIT_BUTTON_ARROW_BUTTON_TOOLTIP",
} as const

type SplitButtonTexts = typeof defaultTexts & { designTexts?: Partial<ButtonTexts> }
type SplitButtonDesign = NonNullable<ButtonProps["variant"]>
type SplitButtonSlot = "root" | "primary" | "arrow" | "label" | "icon" | "arrowIcon"

/**
 * @accessibility The group is the single Tab stop. Space and Enter activate the focused part,
 * defaulting to the primary action. Up, Down, Alt+Up, Alt+Down and F4 activate the arrow.
 * @accessibility aria-label augments the group's name. aria-haspopup and aria-keyshortcuts
 * describe the group. arrowHasPopup and activeArrowButton describe the native arrow button.
 */
type SplitButtonProps = Pick<React.ComponentProps<"div">, "id" | "dir" | "style" | "title" | "aria-label" | "aria-haspopup" | "aria-keyshortcuts" | "aria-describedby"> & {
  children?: React.ReactNode
  icon?: FioriIconData
  /** Accessible name for an icon-only primary action. */
  primaryLabel?: string
  /** Optional arrow popup type when composing a popup yourself. Defaults to menu. */
  arrowHasPopup?: React.AriaAttributes["aria-haspopup"]
  /** Expanded state of an externally composed popup. */
  arrowExpanded?: boolean
  /** ID of an externally composed popup controlled by the arrow. */
  arrowControls?: string
  design?: SplitButtonDesign
  disabled?: boolean
  activeArrowButton?: boolean
  defaultActiveArrowButton?: boolean
  onActiveArrowButtonChange?: (active: boolean) => void
  onClick?: (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLDivElement>) => void
  onArrowClick?: (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLDivElement>) => void
  /** MenuContent, with its MenuItems. The split button owns the menu trigger and open state. */
  menu?: React.ReactNode
  texts?: Partial<SplitButtonTexts>
  className?: string
  /** Experimental slot styling API. */
  classNames?: Partial<Record<SplitButtonSlot, string>>
}

const defaultDesignTexts: ButtonTexts = {
  positive: "Positive Action", // UI5 BUTTON_ARIA_TYPE_ACCEPT
  negative: "Negative Action", // UI5 BUTTON_ARIA_TYPE_REJECT
  emphasized: "Default Action", // UI5 BUTTON_ARIA_TYPE_EMPHASIZED
  attention: "Warning", // UI5 BUTTON_ARIA_TYPE_ATTENTION
}
const designTextKeys = {
  positive: "BUTTON_ARIA_TYPE_ACCEPT", negative: "BUTTON_ARIA_TYPE_REJECT",
  emphasized: "BUTTON_ARIA_TYPE_EMPHASIZED", attention: "BUTTON_ARIA_TYPE_ATTENTION",
} as const

function SplitButton({
  children, icon, primaryLabel, arrowHasPopup, arrowExpanded, arrowControls, design = "default", disabled = false,
  activeArrowButton, defaultActiveArrowButton = false, onActiveArrowButtonChange,
  onClick, onArrowClick, menu, texts: textOverrides, className, classNames, id, dir, style, title,
  "aria-label": groupLabel, "aria-haspopup": groupPopup, "aria-keyshortcuts": shortcuts,
  "aria-describedby": describedBy, ...extra
}: SplitButtonProps) {
  const texts = useFioriTexts(defaultTexts, textKeys, textOverrides)
  const buttonTexts = useFioriTexts(defaultDesignTexts, designTextKeys, textOverrides?.designTexts)
  const labelId = React.useId()
  const hintId = React.useId()
  const arrowRef = React.useRef<HTMLButtonElement>(null)
  const [internalOpen, setInternalOpen] = React.useState(defaultActiveArrowButton)
  const [primaryPressed, setPrimaryPressed] = React.useState(false)
  const [arrowPressed, setArrowPressed] = React.useState(false)
  const spaceTarget = React.useRef<"primary" | "arrow" | null>(null)
  const open = activeArrowButton ?? internalOpen
  const labelText = typeof children === "string" || typeof children === "number" ? children : primaryLabel
  const labelInContent = labelText === undefined && children != null

  if (process.env.NODE_ENV !== "production" && Object.keys(extra).some((key) =>
    key === "role" || key === "tabIndex" || key.startsWith("aria-"))) {
    console.warn("SplitButton owns its group role, tab stop and action relationships.")
  }

  function setOpen(next: boolean) {
    if (activeArrowButton === undefined) setInternalOpen(next)
    onActiveArrowButtonChange?.(next)
  }

  function invokeArrow(event: Parameters<NonNullable<SplitButtonProps["onArrowClick"]>>[0]) {
    onArrowClick?.(event)
    if (menu && !event.defaultPrevented) setOpen(!open)
  }

  function resetPressed() {
    spaceTarget.current = null
    setPrimaryPressed(false)
    setArrowPressed(false)
  }

  // SplitButton.js/_onKeyDown and _onKeyUp: the group owns both keyboard actions.
  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled || event.defaultPrevented || !event.currentTarget.contains(event.target as Node)) return
    const { key, ctrlKey, metaKey, altKey, shiftKey } = event
    const arrow = event.target === arrowRef.current
    if (!ctrlKey && !metaKey && !shiftKey && (key === "ArrowDown" || key === "ArrowUp" || (key === "F4" && !altKey))) {
      invokeArrow(event)
      event.preventDefault()
      setArrowPressed(true)
    } else if (!ctrlKey && !metaKey && !altKey && !shiftKey && key === "Enter") {
      if (arrow) { invokeArrow(event); setArrowPressed(true) }
      else { onClick?.(event); setPrimaryPressed(true) }
      event.preventDefault()
    } else if (!ctrlKey && !metaKey && !altKey && !shiftKey && key === " ") {
      event.preventDefault()
      if (!event.repeat) spaceTarget.current = arrow ? "arrow" : "primary"
      if (arrow) setArrowPressed(true)
      else setPrimaryPressed(true)
    } else if (key === "Shift" || key === "Escape") {
      if (spaceTarget.current) event.preventDefault()
      resetPressed()
    }
  }

  function keyUp(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled || !event.currentTarget.contains(event.target as Node)) return
    if (event.key === " ") {
      const target = spaceTarget.current
      if (target === "arrow") invokeArrow(event)
      else if (target === "primary") onClick?.(event)
      event.preventDefault()
      resetPressed()
    } else if (["Enter", "F4", "ArrowUp", "ArrowDown"].includes(event.key)) {
      resetPressed()
    }
  }

  const arrow = (
    <Button
      ref={arrowRef}
      data-slot="split-button-arrow"
      data-active={open || arrowPressed || undefined}
      variant={design}
      size="icon"
      tabIndex={disabled ? undefined : -1}
      disabled={disabled}
      title={texts.arrowLabel}
      aria-haspopup={arrowHasPopup ?? "menu"}
      aria-expanded={menu ? open || arrowPressed : arrowExpanded ?? (open || arrowPressed)}
      {...(!menu && { "aria-controls": arrowControls })}
      texts={buttonTexts}
      className={cn("fiori-split-button__arrow", classNames?.arrow)}
      onClick={(event) => { event.stopPropagation(); invokeArrow(event) }}
    ><Icon data-slot="split-button-arrow-icon" icon={slimArrowDown} className={classNames?.arrowIcon} /></Button>
  )

  const group = (
    <div
      id={id} dir={dir} style={style}
      data-slot="split-button" data-design={design} data-disabled={disabled || undefined}
      data-active-arrow={open || undefined}
      role="group"
      tabIndex={disabled ? -1 : 0}
      aria-labelledby={`${labelId} ${hintId}`}
      aria-label={title}
      aria-haspopup={groupPopup}
      aria-keyshortcuts={shortcuts}
      aria-describedby={describedBy}
      className={cn("fiori-split-button", className, classNames?.root)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) resetPressed()
      }}
      onKeyDownCapture={keyDown}
      onKeyUpCapture={keyUp}
    >
      <Button
        data-slot="split-button-primary" data-active={primaryPressed || undefined}
        variant={design} size={children == null && icon ? "icon" : "default"}
        tabIndex={disabled ? undefined : -1} disabled={disabled}
        aria-label={primaryLabel} title={title} texts={buttonTexts}
        className={cn("fiori-split-button__primary", classNames?.primary)}
        onClick={(event) => { event.stopPropagation(); onClick?.(event) }}
      >
        {icon && <Icon icon={icon} data-slot="split-button-icon" className={classNames?.icon} />}
        <span id={labelInContent ? labelId : undefined} data-slot="split-button-label" className={cn("fiori-split-button__label", classNames?.label)}><bdi>{children}</bdi></span>
      </Button>
      {menu
        ? <MenuTrigger asChild onPointerDown={(event) => {
          // SplitButtonTemplate opens on click, after the complete pointer gesture.
          event.preventDefault()
          if (!disabled) arrowRef.current?.focus()
        }}>{arrow}</MenuTrigger>
        : arrow}
      {/* SplitButtonTemplate.js names the group with the primary text and localized hint. */}
      <span className="fiori-split-button__hidden" id={hintId}>{groupLabel} {texts.description} {texts.keyboardHint}</span>
      {!labelInContent && <span className="fiori-split-button__hidden" id={labelId}>{labelText}</span>}
    </div>
  )

  return menu ? <Menu modal={false} open={open && !disabled} onOpenChange={setOpen} dir={dir === "rtl" || dir === "ltr" ? dir : undefined}>{group}{menu}</Menu> : group
}

export { SplitButton, type SplitButtonProps, type SplitButtonTexts, type SplitButtonDesign, type SplitButtonSlot }
