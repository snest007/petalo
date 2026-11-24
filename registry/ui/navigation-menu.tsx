// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0
"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { ResponsivePopover, ResponsivePopoverAnchor, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { isF6NavigationKey } from "@/lib/fiori-f6"
import { arrowRight, decline, navBack, slimArrowRight, type FioriIconData } from "@/lib/fiori-icons"
import { useFioriLocale, useFioriTexts, type FioriDirection, type FioriTextKeys } from "@/lib/fiori-locale"
import { useIsPhone } from "@/lib/use-is-phone"
import { cn } from "@/lib/utils"

declare const process: { env: { NODE_ENV?: string } }

type NavigationMenuTexts = { menuLabel: string; active: string; back: string; cancel: string; close: string; header?: string; content?: string; footer?: string }
const defaultTexts: Required<NavigationMenuTexts> = {
  menuLabel: "Additional Navigation Items", // UI5 NAVIGATION_MENU_POPOVER_HIDDEN_TEXT
  active: "Is Active", // UI5 LIST_ITEM_ACTIVE
  back: "Navigate Back", // UI5 ICON_NAV_BACK (MenuItemTemplate.js back button's effective label)
  cancel: "Cancel", // UI5 MENU_CANCEL_BUTTON_TEXT
  close: "Decline", // UI5 RESPONSIVE_POPOVER_CLOSE_DIALOG_BUTTON
  header: "Header", // UI5 DIALOG_HEADER_ARIA_LABEL
  content: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  footer: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
}
const textKeys: FioriTextKeys<Required<NavigationMenuTexts>> = {
  menuLabel: "NAVIGATION_MENU_POPOVER_HIDDEN_TEXT",
  active: "LIST_ITEM_ACTIVE",
  back: (t, fallback) => t("ICON_NAV_BACK", () => t("MENU_BACK_BUTTON_ARIA_LABEL", fallback)),
  cancel: "MENU_CANCEL_BUTTON_TEXT",
  close: "RESPONSIVE_POPOVER_CLOSE_DIALOG_BUTTON",
  header: "DIALOG_HEADER_ARIA_LABEL",
  content: "DIALOG_CONTENT_ARIA_LABEL",
  footer: "DIALOG_FOOTER_ARIA_LABEL",
}

/** @experimental Styling slots apply to each corresponding part, including nested popovers. */
type NavigationMenuSlot = "root" | "trigger" | "surface" | "menu" | "item" | "text" | "icon" | "tag" | "indicator" | "back" | "cancel" | "close"
type NavigationMenuActivation = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
type NavigationMenuItemDetail = { text: string; href?: string; target?: string; hasSubmenu: boolean }
type OpenProps = { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }
type TriggerProps = Omit<ButtonProps, "asChild" | "children" | "role" | "aria-haspopup" | "aria-controls" | "aria-expanded">
type NavigationMenuProps = Omit<React.ComponentProps<"div">, "dir"> & OpenProps & {
  trigger: React.ReactNode
  triggerProps?: TriggerProps
  /** Accessible label for the root dialog. Prefer texts.menuLabel for a translation. */
  accessibleName?: string
  classNames?: Partial<Record<NavigationMenuSlot, string>>
  locale?: string
  dir?: FioriDirection
  texts?: Partial<NavigationMenuTexts>
  portal?: boolean
  /** Keep focus on the trigger or active element while the root surface opens. */
  preventInitialFocus?: boolean
  /** Runs after the item's onActivate, before opening a submenu or dismissing a leaf. Call preventDefault to cancel link navigation. */
  onItemClick?: (item: NavigationMenuItemDetail, event: NavigationMenuActivation) => void
}
type NavigationMenuItemProps = Omit<React.HTMLAttributes<HTMLElement>, "children" | "role" | "id" | "tabIndex" | "onClick"> & OpenProps & {
  text: string
  icon?: FioriIconData
  /** Noninteractive decoration. Its text describes the owning menu item. */
  tag?: React.ReactNode
  href?: string
  target?: string
  disabled?: boolean
  design?: "default" | "action"
  /** Overrides the visible text in the item name, including in the associated dialog label. */
  accessibleName?: string
  children?: React.ReactNode
  /** Runs before the root onItemClick. Call preventDefault to cancel the link's default action. */
  onActivate?: (event: NavigationMenuActivation) => void
  ref?: React.Ref<HTMLElement>
}

type MenuState = {
  scope: string
  dir: FioriDirection
  texts: Required<NavigationMenuTexts>
  phone: boolean
  classes: NavigationMenuProps["classNames"]
  portal: boolean
  dismissals: Map<string, { depth: number; close: () => void }>
  close: () => void
  onItemClick: NavigationMenuProps["onItemClick"]
}
const MenuContext = React.createContext<MenuState | null>(null)
type MenuLevel = {
  depth: number
  submenu: boolean
  hasIcons: boolean
  close: () => void
  submenus: Map<string, () => void>
}
const LevelContext = React.createContext<MenuLevel | null>(null)

function useOpenState({ open, defaultOpen = false, onOpenChange }: OpenProps) {
  const [localOpen, setLocalOpen] = React.useState(defaultOpen)
  const isOpen = open ?? localOpen
  const change = React.useCallback((next: boolean) => {
    if (next === isOpen) return
    if (open === undefined) setLocalOpen(next)
    onOpenChange?.(next)
  }, [open, isOpen, onOpenChange])
  return [isOpen, change] as const
}

function protectedProps<T extends object>(props: T, part: string, owned: readonly string[]): T {
  const result = { ...props } as Record<string, unknown>
  for (const key of owned) {
    if (result[key] === undefined) continue
    if (process.env.NODE_ENV !== "production") console.warn(`NavigationMenu.${part}: ignored ownership prop ${key}`)
    delete result[key]
  }
  return result as T
}
const ownedTrigger = ["asChild", "dangerouslySetInnerHTML", "id", "role", "tabIndex", "aria-controls", "aria-expanded", "aria-haspopup", "data-slot", "data-navigation-menu-scope"]
const ownedItem = ["dangerouslySetInnerHTML", "id", "role", "tabIndex", "onClick", "aria-label", "aria-labelledby", "aria-disabled", "aria-expanded", "aria-haspopup", "aria-controls", "aria-hidden", "aria-checked", "aria-selected", "data-slot", "data-state", "data-disabled", "data-design"]
const menuSelector = '[data-slot="navigation-menu-menu"]'
const rows = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]')]
  .filter((row) => row.closest(menuSelector) === menu)
const hasModifiers = (e: Pick<KeyboardEvent, "altKey" | "ctrlKey" | "metaKey" | "shiftKey">) => e.altKey || e.ctrlKey || e.metaKey || e.shiftKey
const isSpace = (e: NavigationMenuActivation) => "key" in e && (e.key === " " || e.key === "Spacebar") && !hasModifiers(e)
const isEnter = (e: React.KeyboardEvent) => e.key === "Enter" && Number(e.shiftKey) + Number(e.altKey) + Number(e.ctrlKey || e.metaKey) <= 1

function NavigationMenu({
  trigger, triggerProps, children, className, classNames, onItemClick, accessibleName, texts: textOverrides, locale, dir,
  open, defaultOpen, onOpenChange, portal = true, preventInitialFocus = false, ...props
}: NavigationMenuProps) {
  const [isOpen, change] = useOpenState({ open, defaultOpen, onOpenChange })
  const scope = React.useId()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const phone = useIsPhone()
  const dismissals = React.useRef<MenuState["dismissals"]>(new Map()).current
  const { dir: localeDir, hasProvider, localized } = useFioriLocale(locale)
  const explicitDir = dir ?? (localized || hasProvider ? localeDir : undefined)
  const [inheritedDir, setInheritedDir] = React.useState<FioriDirection>("ltr")
  const direction = explicitDir ?? inheritedDir
  React.useLayoutEffect(() => {
    const node = rootRef.current
    if (explicitDir || !node) return
    const update = () => setInheritedDir(getComputedStyle(node).direction === "rtl" ? "rtl" : "ltr")
    update()
    const observer = new MutationObserver(update)
    for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
      observer.observe(parent, { attributes: true, attributeFilter: ["dir", "style", "class"] })
    }
    return () => observer.disconnect()
  }, [explicitDir])
  const texts = useFioriTexts<Required<NavigationMenuTexts>>(defaultTexts, textKeys, textOverrides, locale)
  const { className: triggerClassName, onClick, ref: passedTriggerRef, ...buttonProps } = protectedProps(triggerProps ?? {}, "Trigger", ownedTrigger)
  const { ref, ...rootProps } = props
  const setRoot = React.useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }, [ref])
  const setTrigger = React.useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node
    if (typeof passedTriggerRef === "function") passedTriggerRef(node)
    else if (passedTriggerRef) passedTriggerRef.current = node
  }, [passedTriggerRef])
  const close = React.useCallback(() => change(false), [change])
  React.useLayoutEffect(() => {
    // OpenedPopupsRegistry.js closes the deepest opened surface even when
    // the owning row has focus. Native phone MenuItem Escape closes the tree.
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !dismissals.size || !(event.target instanceof Element)) return
      if (event.target.closest("[data-navigation-menu-scope]")?.getAttribute("data-navigation-menu-scope") !== scope) return
      event.stopImmediatePropagation()
      if (hasModifiers(event)) return
      if (phone) close()
      else [...dismissals.values()].sort((a, b) => a.depth - b.depth).at(-1)?.close()
    }
    document.addEventListener("keydown", onEscape, true)
    return () => document.removeEventListener("keydown", onEscape, true)
  }, [dismissals, close, phone, scope])
  const state = { scope, dir: direction, texts, phone, classes: classNames, portal, dismissals, close, onItemClick }
  const menuId = `${scope}-menu`
  return (
    <div {...rootProps} ref={setRoot} dir={explicitDir} data-slot="navigation-menu" className={cn(classNames?.root, className)}>
      <MenuContext.Provider value={state}>
        <ResponsivePopover dir={direction} open={isOpen} onOpenChange={change}>
          <ResponsivePopoverAnchor asChild>
            <Button {...buttonProps} ref={setTrigger} data-slot="navigation-menu-trigger" data-navigation-menu-scope={scope}
              className={cn(classNames?.trigger, triggerClassName)} aria-haspopup="menu" aria-expanded={isOpen}
              aria-controls={isOpen ? menuId : undefined} onClick={(event) => {
                onClick?.(event)
                if (!event.defaultPrevented) change(!isOpen)
              }}>{trigger}</Button>
          </ResponsivePopoverAnchor>
          <NavigationMenuSurface id={menuId} title={accessibleName ?? texts.menuLabel} close={close} owner={triggerRef} preventInitialFocus={preventInitialFocus}>
            {children}
          </NavigationMenuSurface>
        </ResponsivePopover>
      </MenuContext.Provider>
    </div>
  )
}

function NavigationMenuSurface({ id, title, owner, close, submenu = false, preventInitialFocus = false, children }: {
  id: string
  title: string
  owner: React.RefObject<HTMLElement | null>
  close: () => void
  submenu?: boolean
  preventInitialFocus?: boolean
  children: React.ReactNode
}) {
  const root = React.useContext(MenuContext)!
  const phone = root.phone
  const parent = React.useContext(LevelContext)
  const depth = parent ? parent.depth + 1 : 0
  const list = React.useRef<HTMLDivElement>(null)
  const setSurface = React.useCallback((node: HTMLDivElement | null) => {
    if (node) root.dismissals.set(id, { depth, close })
    else root.dismissals.delete(id)
  }, [root.dismissals, id, depth, close])
  const submenus = React.useRef(new Map<string, () => void>()).current
  const hasIcons = React.Children.toArray(children).some((child) => React.isValidElement<NavigationMenuItemProps>(child) && !!child.props.icon)
  const closeOnDismiss = React.useRef(true)
  const titleId = `${id}-label`
  const focusRow = () => list.current && rows(list.current)[0]?.focus({ preventScroll: true })

  // Menu.js/_itemKeyDown and MenuItem.js/_itemKeyDown give root and submenus distinct Tab defaults.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const menu = event.currentTarget
    const target = event.target
    if (!(target instanceof HTMLElement) || target.closest(menuSelector) !== menu || event.defaultPrevented || isF6NavigationKey(event)) return
    const { key } = event
    const tab = key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey
    if (tab) {
      if (!submenu) event.preventDefault()
      event.stopPropagation()
      close()
      return
    }
    if (hasModifiers(event)) return
    const items = rows(menu)
    const index = items.indexOf(target)
    if (index < 0) return
    if (submenu && key === (root.dir === "rtl" ? "ArrowRight" : "ArrowLeft")) {
      event.stopPropagation()
      close()
      return
    }
    let next: number
    switch (key) {
      case "ArrowUp": next = index - 1; break
      case "ArrowDown": next = index + 1; break
      case "Home": next = 0; break
      case "End": next = items.length - 1; break
      case "PageUp":
      case "PageDown": {
        const page = submenu ? 10 : Math.max(1, Math.round(menu.clientHeight / items[0].offsetHeight) - 1)
        next = index + (key === "PageUp" ? -page : page)
        break
      }
      default: return
    }
    event.preventDefault()
    event.stopPropagation()
    items[Math.max(0, Math.min(next, items.length - 1))]?.focus()
  }

  const visibleTitle = phone && submenu
  const desktopSubmenu = submenu && !phone
  const content = <>
    {!submenu && <span id={titleId} className="fiori-navigation-menu-hidden">{title}</span>}
    <LevelContext.Provider value={{ depth, hasIcons, submenu, close, submenus }}>
      <div id={id} ref={list} data-slot="navigation-menu-menu" className={cn("fiori-navigation-menu-list", root.classes?.menu)}
        role="menu" onKeyDown={onKeyDown} onFocus={(event) => {
          const items = rows(event.currentTarget)
          if (items.some((row) => row === event.target)) items.forEach((row) => { row.tabIndex = row === event.target ? 0 : -1 })
        }}>{children}</div>
    </LevelContext.Provider>
  </>
  return (
    <ResponsivePopoverContent ref={setSurface} data-slot="navigation-menu-surface" data-navigation-menu-scope={root.scope}
      data-navigation-menu-dir={root.dir} data-submenu={submenu ? "" : undefined} data-phone={phone ? "" : undefined}
      className={cn("fiori-navigation-menu-surface", root.classes?.surface)} portal={root.portal}
      // Popover.js defaults to End. MenuItemTemplate.js differs only in its Top alignment.
      side={root.dir === "rtl" ? "left" : "right"} align={submenu ? "start" : "center"} hideArrow
      aria-labelledby={desktopSubmenu ? undefined : titleId} aria-label={desktopSubmenu ? title : undefined}
      headerText="" closeLabel={root.texts.close}
      phoneHeader={submenu ? <div className="fiori-menu-phone__header" role="region" aria-label={root.texts.header}>
        <Button variant="transparent" data-slot="navigation-menu-back" className={root.classes?.back} aria-label={root.texts.back} onClick={close}><Icon icon={navBack} /></Button>
        <div id={visibleTitle ? titleId : undefined} className="fiori-menu-phone__title">{title}</div>
      </div> : <div className="fiori-responsive-popover__default-header" role="region" aria-label={root.texts.header}>
        <Button variant="transparent" data-slot="navigation-menu-close" className={root.classes?.close} aria-label={root.texts.close} onClick={close}><Icon icon={decline} /></Button>
      </div>}
      phoneFooter={submenu ? <div className="fiori-menu-phone__footer" role="region" aria-label={root.texts.footer}>
        <Button variant="transparent" data-slot="navigation-menu-cancel" className={root.classes?.cancel} onClick={root.close}>{root.texts.cancel}</Button>
      </div> : <div role="region" aria-label={root.texts.footer} />}
      onOpenAutoFocus={(event) => { event.preventDefault(); closeOnDismiss.current = true; if (!preventInitialFocus) focusRow() }}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        if (closeOnDismiss.current) owner.current?.focus({ preventScroll: true })
      }}
      // Popup.js closes native popovers on outside pointer gestures. Focus transferring
      // between this menu's portalled surfaces must leave their owners open.
      onFocusOutside={(event) => event.preventDefault()}
      onPointerDownOutside={(event) => {
        const target = event.target
        if (target instanceof HTMLElement && target.closest('[data-slot="navigation-menu-trigger"]') === owner.current) {
          event.preventDefault()
          return
        }
        if (target instanceof Element && target.closest("[data-navigation-menu-scope]")?.getAttribute("data-navigation-menu-scope") === root.scope) {
          if (!submenu) event.preventDefault()
          return
        }
        closeOnDismiss.current = false
      }}
      onEscapeKeyDown={(event) => {
        if (hasModifiers(event)) event.preventDefault()
      }}>
      {phone ? <div role="region" aria-label={root.texts.content}>{content}</div> : content}
    </ResponsivePopoverContent>
  )
}

function NavigationMenuItem({
  text, children, href, target, icon, tag, disabled = false, design = "default", accessibleName, ref,
  open, defaultOpen, onOpenChange, onActivate, className, onKeyDown, onKeyUp, onPointerMove,
  "aria-describedby": describedBy, ...props
}: NavigationMenuItemProps) {
  const menu = React.useContext(MenuContext)!
  const level = React.useContext(LevelContext)!
  const id = React.useId()
  const row = React.useRef<HTMLElement>(null)
  const hasSubmenu = !disabled && React.Children.count(children) > 0
  const [isOpen, change] = useOpenState({ open, defaultOpen, onOpenChange })
  const expanded = hasSubmenu && isOpen
  const submenuId = `${id}-submenu`
  const isLink = !!href && !disabled
  const external = !hasSubmenu && !!href && target === "_blank"
  const setRow = React.useCallback((node: HTMLElement | null) => {
    row.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }, [ref])
  const closeSiblings = () => level.submenus.forEach((close, key) => { if (key !== id) close() })
  const openSubmenu = () => { closeSiblings(); change(true) }
  React.useEffect(() => {
    if (!expanded) return
    const { submenus } = level
    submenus.set(id, () => change(false))
    return () => { submenus.delete(id) }
  }, [expanded, change, level.submenus, id])
  const activate = (event: NavigationMenuActivation) => {
    event.stopPropagation()
    if (disabled) {
      event.preventDefault()
      return
    }
    onActivate?.(event)
    menu.onItemClick?.({ text, href, target, hasSubmenu }, event)
    // NavigationMenuItem.js/_activate invokes the associated item's cancelable click
    // before opening the submenu or closing the leaf, even when click is canceled.
    if (hasSubmenu) openSubmenu()
    if (isLink && isSpace(event) && !event.defaultPrevented) {
      // NavigationMenuItem.js/_onkeyup dispatches a non-bubbling click for Space.
      // This preserves native URL/target handling without calling onActivate twice.
      row.current?.dispatchEvent(new MouseEvent("click"))
    }
    if (!hasSubmenu) menu.close()
  }
  const labelId = `${id}-text`
  const activeId = `${id}-active`
  const tagId = `${id}-tag`
  const common = {
    ...protectedProps(props, "Item", ownedItem),
    className: cn("fiori-navigation-menu-item", menu.classes?.item, className),
    ref: setRow,
    id,
    role: "menuitem",
    tabIndex: -1,
    "data-slot": "navigation-menu-item",
    "data-state": hasSubmenu ? expanded ? "open" : "closed" : undefined,
    "data-design": design,
    "data-disabled": disabled ? "" : undefined,
    "aria-label": accessibleName === undefined ? undefined : [accessibleName, menu.texts.active].filter(Boolean).join(" "),
    // A descriptive tag is hidden from the label calculation; use name-from-content
    // on a tagged row so the adjacent status text need not repeat the voice label.
    "aria-labelledby": accessibleName === undefined && tag == null ? `${labelId} ${activeId}` : undefined,
    "aria-describedby": [tag == null ? undefined : tagId, describedBy].filter(Boolean).join(" ") || undefined,
    "aria-haspopup": hasSubmenu ? "menu" : undefined,
    "aria-expanded": hasSubmenu ? expanded : undefined,
    "aria-controls": expanded ? submenuId : undefined,
    "aria-disabled": disabled || undefined,
    onClick: activate,
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target === event.currentTarget && !isF6NavigationKey(event)) {
        if (isSpace(event)) event.preventDefault()
        if (isEnter(event)) {
          activate(event)
          // NavigationMenuItem.js activates the row on Enter. The anchor's
          // native navigation is reserved for click and unmodified Space.
          event.preventDefault()
        }
        if (hasSubmenu && !hasModifiers(event) && event.key === (menu.dir === "rtl" ? "ArrowLeft" : "ArrowRight")) {
          event.stopPropagation()
          openSubmenu()
        }
      }
      onKeyDown?.(event)
    },
    onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target === event.currentTarget && isSpace(event)) {
        activate(event)
        event.preventDefault()
      }
      onKeyUp?.(event)
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (event.currentTarget !== (event.target as Element).closest('[data-slot="navigation-menu-item"]')) return
      // NavigationMenuTemplate.js leaves root hover unwired. MenuItem.js
      // _itemMouseOver focuses the row and closes sibling popovers in submenus.
      if (level.submenu && event.pointerType === "mouse") {
        event.currentTarget.focus({ preventScroll: true })
        closeSiblings()
      }
      onPointerMove?.(event)
    },
  } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>
  const body = <>
    {icon ? <Icon icon={icon} data-slot="navigation-menu-icon" className={cn("fiori-navigation-menu-icon", menu.classes?.icon)} />
      : level.hasIcons && <span aria-hidden="true" className="fiori-navigation-menu-icon-placeholder" />}
    <span id={labelId} data-slot="navigation-menu-text" className={cn("fiori-navigation-menu-text", menu.classes?.text)}>{text}</span>
    {tag != null && <span id={tagId} aria-hidden="true" data-slot="navigation-menu-tag" className={cn("fiori-navigation-menu-tag", menu.classes?.tag)}>{tag}</span>}
    {hasSubmenu || external ? <Icon icon={hasSubmenu ? slimArrowRight : arrowRight} data-slot="navigation-menu-indicator"
      className={cn("fiori-navigation-menu-indicator", external && "fiori-navigation-menu-external", menu.classes?.indicator)} /> : null}
    <span id={activeId} className="fiori-navigation-menu-hidden">{menu.texts.active}</span>
  </>
  const host = isLink ? <a {...common} href={href} target={target}>{body}</a> : <div {...common}>{body}</div>
  if (!hasSubmenu) return host
  return (
    <ResponsivePopover dir={menu.dir} open={expanded} onOpenChange={change}>
      <ResponsivePopoverAnchor asChild>{host}</ResponsivePopoverAnchor>
      <NavigationMenuSurface id={submenuId} title={accessibleName ?? text} submenu owner={row} close={() => change(false)}>
        {children}
      </NavigationMenuSurface>
    </ResponsivePopover>
  )
}

export {
  NavigationMenu, NavigationMenuItem,
  type NavigationMenuProps, type NavigationMenuItemProps, type NavigationMenuSlot,
  type NavigationMenuTexts, type NavigationMenuActivation, type NavigationMenuItemDetail,
}
