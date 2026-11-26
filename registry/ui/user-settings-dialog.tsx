// Portions derived from SAP UI5 Web Components Fiori 2.28.1.
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo. SPDX-License-Identifier: Apache-2.0
"use client"

import * as React from "react"
import { Avatar, type AvatarColorScheme } from "@/components/ui/avatar"
import { BusyIndicator } from "@/components/ui/busy-indicator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { List, ListItemCustom, ListItemGroup, ListItemStandard } from "@/components/ui/list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"
import { edit, globe, navBack, personPlaceholder, product, search, userSettings, type FioriIconData } from "@/lib/fiori-icons"
import { collatorIncludes, useFioriLocale, useFioriTexts, type FioriDirection } from "@/lib/fiori-locale"
import { cn } from "@/lib/utils"

const narrowQuery = "(width < 64rem)"
function subscribeNarrow(change: () => void) {
  const media = window.matchMedia(narrowQuery)
  media.addEventListener("change", change)
  return () => media.removeEventListener("change", change)
}
const readNarrow = () => window.matchMedia(narrowQuery).matches
const serverNarrow = () => false

type UserSettingsTab = { id: string; text: string; content: React.ReactNode }
type UserSettingsPage = UserSettingsTab & { secondary?: boolean }
type UserSettingsItem = {
  id: string
  text: string
  headerText?: string
  tooltip?: string
  icon?: FioriIconData | null
  accessibleName?: string
  disabled?: boolean
  loading?: boolean
  loadingReason?: string
  content?: React.ReactNode
  tabs?: readonly UserSettingsTab[]
  pages?: readonly UserSettingsPage[]
}

type UserSettingsDialogTexts = {
  name: string
  itemRole: string
  search: string
  searchIcon: string
  noResults: string
  noResultsAnnouncement: string
  oneResult: string
  manyResults: (count: number) => string
  back: string
  close: string
  save: string
  cancel: string
  content: string
  footer: string
  saveDescription: string
}
const defaultTexts: UserSettingsDialogTexts = {
  name: "User Settings", // UI5 USER_SETTINGS_DIALOG_ACCESSIBLE_NAME
  itemRole: "User Settings Item", // UI5 USER_SETTINGS_LIST_ARIA_ROLE_DESC
  search: "Search", // UserSettingsDialogTemplate.js search placeholder
  searchIcon: "Search", // UI5 ICON_SEARCH
  noResults: "No search results", // UI5 USER_SETTINGS_DIALOG_NO_SEARCH_RESULTS_TEXT
  noResultsAnnouncement: "No search results", // UI5 USER_SETTINGS_DIALOG_SEARCH_NO_RESULTS
  oneResult: "1 result available", // UI5 USER_SETTINGS_DIALOG_SEARCH_ONE_RESULT
  manyResults: count => `${count} results are available`, // UI5 USER_SETTINGS_DIALOG_SEARCH_MORE_RESULTS
  back: "Navigate Back", // UI5 ICON_NAV_BACK
  close: "Close", // UI5 USER_SETTINGS_DIALOG_CLOSE_BUTTON_TEXT
  save: "Save", // UI5 USER_SETTINGS_DIALOG_SAVE_BUTTON_TEXT
  cancel: "Cancel", // UI5 USER_SETTINGS_DIALOG_CANCEL_BUTTON_TEXT
  content: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  footer: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
  saveDescription: "Default Action", // UI5 BUTTON_ARIA_TYPE_EMPHASIZED
}
const textKeys = {
  name: "USER_SETTINGS_DIALOG_ACCESSIBLE_NAME",
  itemRole: "USER_SETTINGS_LIST_ARIA_ROLE_DESC",
  searchIcon: "ICON_SEARCH",
  noResults: "USER_SETTINGS_DIALOG_NO_SEARCH_RESULTS_TEXT",
  noResultsAnnouncement: "USER_SETTINGS_DIALOG_SEARCH_NO_RESULTS",
  oneResult: "USER_SETTINGS_DIALOG_SEARCH_ONE_RESULT",
  manyResults: "USER_SETTINGS_DIALOG_SEARCH_MORE_RESULTS",
  back: "ICON_NAV_BACK",
  close: "USER_SETTINGS_DIALOG_CLOSE_BUTTON_TEXT",
  save: "USER_SETTINGS_DIALOG_SAVE_BUTTON_TEXT",
  cancel: "USER_SETTINGS_DIALOG_CANCEL_BUTTON_TEXT",
  content: "DIALOG_CONTENT_ARIA_LABEL",
  footer: "DIALOG_FOOTER_ARIA_LABEL",
  saveDescription: "BUTTON_ARIA_TYPE_EMPHASIZED",
} as const

/** Experimental styling for owned parts. */
type UserSettingsDialogSlot = "surface" | "content" | "side" | "sideHeader" | "search" | "list" | "fixedList" | "item" | "pane" | "paneHeader" | "back" | "body" | "footer"
type UserSettingsCloseReason = "close" | "escape"
/** Native ARIA names and descriptions apply to the dialog surface. Each setting's accessibleName supplements its visible label. */
type UserSettingsDialogProps = Pick<React.ComponentProps<"div">, "id" | "className" | "style" | "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-description"> & {
  items: readonly UserSettingsItem[]
  fixedItems?: readonly UserSettingsItem[]
  headerText?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  opener?: HTMLElement | null
  value?: string
  defaultValue?: string
  onValueChange?: (id: string, item: UserSettingsItem) => boolean | void
  view?: string | null
  defaultView?: string
  onViewChange?: (id: string | null) => boolean | void
  showSearchField?: boolean
  query?: string
  defaultQuery?: string
  onQueryChange?: (value: string) => void
  saveMode?: boolean
  onSave?: () => void
  onCancel?: () => void
  onBeforeClose?: (reason: UserSettingsCloseReason) => boolean | void
  texts?: Partial<UserSettingsDialogTexts>
  locale?: string
  dir?: FioriDirection
  classNames?: Partial<Record<UserSettingsDialogSlot, string>>
  portal?: boolean
  preventInitialFocus?: boolean
}

function UserSettingsDialog({
  items, fixedItems = [], headerText, open: openProp, defaultOpen = false, onOpenChange, opener,
  value, defaultValue, onValueChange, view, defaultView, onViewChange,
  showSearchField, query: queryProp, defaultQuery = "", onQueryChange,
  saveMode, onSave, onCancel, onBeforeClose, texts: overrides, locale, dir,
  className, classNames, id, style, portal = true, preventInitialFocus = false,
  "aria-label": label, "aria-labelledby": labelledBy, "aria-describedby": describedBy, "aria-description": description,
}: UserSettingsDialogProps) {
  const narrow = React.useSyncExternalStore(subscribeNarrow, readNarrow, serverNarrow)
  const resolved = useFioriLocale(locale)
  const texts = useFioriTexts(defaultTexts, textKeys, overrides, locale)
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [views, setViews] = React.useState<Record<string, string | null>>({})
  const [internalQuery, setInternalQuery] = React.useState(defaultQuery)
  const [drilledIn, setDrilledIn] = React.useState(false)
  const [announceSearch, setAnnounceSearch] = React.useState(false)
  const [announcementSequence, bumpAnnouncement] = React.useReducer((sequence: number) => sequence + 1, 0)
  const surface = React.useRef<HTMLDivElement>(null)
  const body = React.useRef<HTMLDivElement>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  const pendingFocus = React.useRef<"content" | "list" | null>(null)
  const open = openProp ?? internalOpen
  const all = [...items, ...fixedItems]
  const active = all.find(item => item.id === (value ?? internalValue)) ?? all[0]
  const activeValue = active?.id
  const itemView = active ? views[active.id] : undefined
  const selectedView = view !== undefined ? view : itemView === undefined ? defaultView : itemView
  const page = active?.pages?.find(tab => tab.id === selectedView)
  const tabs = !page ? active?.tabs : undefined
  const heading = page ? page.text : active?.headerText
  const query = queryProp ?? internalQuery
  const matches = (item: UserSettingsItem) => collatorIncludes(item.text, query, resolved.locale)
  const filtered = items.filter(matches)
  const fixed = fixedItems.filter(matches)
  const count = filtered.length + fixed.length

  const changeOpen = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const focusSetting = () => {
    const rows = [...(surface.current?.querySelectorAll<HTMLElement>("[data-settings-row]:not([data-disabled])") ?? [])]
      .filter(row => row.getClientRects().length)
    const target = rows.find(row => row.dataset.navKey === activeValue) ?? rows[0]
    target?.focus()
    return !!target
  }
  React.useLayoutEffect(() => {
    if (!open) pendingFocus.current = null
    if (!pendingFocus.current) return
    if (pendingFocus.current === "list") {
      pendingFocus.current = null
      focusSetting()
    } else if (!active?.loading) {
      pendingFocus.current = null
      const candidates = body.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      const first = [...(candidates ?? [])].find(target => target.getClientRects().length && !target.closest("[inert]"))
      if (first) first.focus()
      else if (body.current) {
        body.current.tabIndex = -1
        body.current.focus()
      }
    }
  })
  const changeQuery = (next: string) => {
    if (queryProp === undefined) setInternalQuery(next)
    onQueryChange?.(next)
    setAnnounceSearch(true)
    bumpAnnouncement()
  }
  const selectView = (next: string | null) => {
    if (!active || onViewChange?.(next) === false) return false
    if (view === undefined) setViews(current => ({ ...current, [active.id]: next }))
    return true
  }
  const activate = (next: string) => {
    const item = all.find(setting => setting.id === next)
    if (!item || item.disabled) return
    // UserSettingsDialog.js mirrors the selection, then drills in on each activation.
    if (next !== activeValue) {
      if (onValueChange?.(next, item) === false) return
      if (value === undefined) setInternalValue(next)
    }
    if (narrow) {
      pendingFocus.current = "content"
      setDrilledIn(true)
    }
  }
  const goBack = () => {
    if (page?.secondary) {
      if (selectView(null)) pendingFocus.current = "content"
    } else {
      pendingFocus.current = "list"
      setDrilledIn(false)
    }
  }
  const list = (entries: readonly UserSettingsItem[], fixedList = false) => !!entries.length && (
    <List selectionMode="single" value={activeValue ? [activeValue] : []} separators="none"
      className={cn(fixedList ? "fiori-user-settings__fixed" : "fiori-user-settings__items", fixedList ? classNames?.fixedList : classNames?.list)}
      data-settings-list={fixedList ? "fixed" : "main"} data-sap-ui-fastnavgroup="false" onItemClick={activate}>
      {entries.map(item => <ListItemStandard key={item.id} value={item.id} data-settings-row="" disabled={item.disabled}
        icon={item.icon === null ? undefined : item.icon ?? globe} type={narrow ? "navigation" : "active"}
        title={item.tooltip || item.text} aria-label={[item.text, item.accessibleName].filter(Boolean).join(" ")}
        className={cn(item.icon === null && !fixedList && items.some(setting => setting.icon !== null) && "fiori-user-settings__no-icon", classNames?.item)}
        text={item.text} />)}
    </List>
  )
  const announce = count === 0 ? texts.noResultsAnnouncement : count === 1 ? texts.oneResult : texts.manyResults(count)
  const portalDirection = dir ?? (resolved.localized || resolved.hasProvider ? resolved.dir : undefined)
  const escapeClose = (event: KeyboardEvent) => { if (onBeforeClose?.("escape") === false) event.preventDefault() }
  return <Dialog open={open} onOpenChange={changeOpen} modal={portal}>
    <DialogContent portal={portal} aria-modal="true" aria-label={label ?? texts.name} aria-labelledby={labelledBy}
      aria-describedby={describedBy} aria-description={description} dir={portalDirection} ref={surface} id={id} style={style}
      data-slot="user-settings-dialog" className={cn("fiori-user-settings h-full w-(--fiori-user-settings-width) max-w-(--fiori-user-settings-max-width) max-h-(--fiori-user-settings-max-height)", classNames?.surface, className)}
      onEscapeKeyDown={escapeClose}
      onOpenAutoFocus={event => {
        returnTo.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
        if (preventInitialFocus || focusSetting()) event.preventDefault()
      }}
      onCloseAutoFocus={event => {
        if (returnTo.current?.isConnected) {
          event.preventDefault()
          returnTo.current.focus()
        }
        returnTo.current = null
      }}>
      <DialogBody role="region" aria-label={texts.content} data-slot="user-settings-content" className={cn("fiori-user-settings__content", classNames?.content)}>
        <div className="fiori-user-settings__root">
          <div data-slot="user-settings-side" role="group" aria-roledescription={texts.itemRole} data-sap-ui-fastnavgroup="true"
            className={cn("fiori-user-settings__side", classNames?.side)} hidden={narrow && drilledIn}>
            <div data-slot="user-settings-side-header" className={cn("fiori-user-settings__side-header", classNames?.sideHeader)}>
              {headerText && <h1>{headerText}</h1>}
              {showSearchField && <Input type="search" aria-label={texts.search} placeholder={texts.search}
                value={query} onChange={event => changeQuery(event.target.value)} className={classNames?.search}
                icon={<span className="fiori-user-settings__search-icon" title={texts.searchIcon}><Icon icon={search} /></span>} />}
            </div>
            {count === 0 ? <div className="fiori-user-settings__empty">{texts.noResults}</div> : <>{list(filtered)}{list(fixed, true)}</>}
          </div>
          <div data-slot="user-settings-pane" data-sap-ui-fastnavgroup="true" className={cn("fiori-user-settings__pane", classNames?.pane)}
            hidden={narrow && !drilledIn}>
            {active && <>
              <div data-slot="user-settings-pane-header" className={cn("fiori-user-settings__pane-header", classNames?.paneHeader)}>
                {(narrow || page?.secondary) && <Button data-slot="user-settings-back" className={classNames?.back}
                  variant="transparent" size="icon" aria-label={texts.back} onClick={goBack}><Icon icon={navBack} /></Button>}
                {heading && <h2>{heading}</h2>}
              </div>
              <div data-slot="user-settings-body" className={cn("fiori-user-settings__body", classNames?.body)} ref={body}>
                {active.loading ? <BusyIndicator active delay={0} aria-description={active.loadingReason} className="fiori-user-settings__busy" />
                  : tabs?.length ? <Tabs value={tabs.find(tab => tab.id === selectedView)?.id ?? tabs[0].id}
                    onValueChange={selectView} contentBackground="transparent">
                    <TabsList>{tabs.map(tab => <TabsTrigger key={tab.id} value={tab.id}>{tab.text}</TabsTrigger>)}</TabsList>
                    {tabs.map(tab => <TabsContent value={tab.id} key={tab.id}>{tab.content}</TabsContent>)}
                  </Tabs> : page?.content ?? active.pages?.[0]?.content ?? active.content}
              </div>
            </>}
          </div>
        </div>
        {showSearchField && <div data-slot="user-settings-announcement" className="sr-only" aria-live="polite">{announceSearch && <span key={announcementSequence}>{announce}</span>}</div>}
      </DialogBody>
      <DialogFooter role="region" aria-label={texts.footer} data-slot="user-settings-footer" className={cn("fiori-user-settings__footer", classNames?.footer)}>
        <Toolbar design="transparent" role={saveMode ? "toolbar" : "presentation"} data-sap-ui-fastnavgroup="true">
          {saveMode ? [
            <ToolbarButton key="save" variant="emphasized" texts={{ emphasized: texts.saveDescription }} onClick={onSave}>{texts.save}</ToolbarButton>,
            <ToolbarButton key="cancel" variant="transparent" onClick={onCancel}>{texts.cancel}</ToolbarButton>,
          ] : <ToolbarButton variant="transparent" onClick={() => { if (onBeforeClose?.("close") !== false) changeOpen(false) }}>{texts.close}</ToolbarButton>}
        </Toolbar>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

declare const process: { env: { NODE_ENV?: string } }

type UserSettingsViewProps = Pick<React.ComponentProps<"div">, "className" | "style" | "children">
function UserSettingsView({ className, style, children, ...extra }: UserSettingsViewProps) {
  if (process.env.NODE_ENV !== "production") for (const key of Object.keys(extra)) {
    if (key === "role" || key === "id" || key === "tabIndex" || key.startsWith("aria-")) console.warn(`UserSettingsView: ignored ownership prop ${key}`)
  }
  return <div style={style} data-slot="user-settings-view" className={cn("fiori-user-settings__view", className)}>{children}</div>
}

type UserSettingsAccountViewTexts = { manage: string; edit: string }
const accountDefaults: UserSettingsAccountViewTexts = {
  manage: "Manage Account", // UI5 USER_SETTINGS_ACCOUNT_MANAGE_ACCOUNT_BUTTON_TXT
  edit: "Edit Avatar", // UI5 USER_SETTINGS_ACCOUNT_EDIT_AVATAR_TXT
}
const accountKeys = { manage: "USER_SETTINGS_ACCOUNT_MANAGE_ACCOUNT_BUTTON_TXT", edit: "USER_SETTINGS_ACCOUNT_EDIT_AVATAR_TXT" } as const
type UserSettingsAccountViewProps = UserSettingsViewProps & {
  account: { titleText?: string; subtitleText?: string; description?: string; avatarSrc?: string; avatarInitials?: string }
  showManageAccount?: boolean
  showEditButton?: boolean
  onManageAccountClick?: () => void
  onEditAvatarClick?: () => void
  texts?: Partial<UserSettingsAccountViewTexts>
}
function UserSettingsAccountView({ account, children, showManageAccount, showEditButton, onManageAccountClick, onEditAvatarClick, texts: overrides, ...props }: UserSettingsAccountViewProps) {
  const texts = useFioriTexts(accountDefaults, accountKeys, overrides)
  return <UserSettingsView {...props}>
    <div data-slot="user-settings-account" className="fiori-user-settings__account">
      <Avatar size="XL" initials={account.avatarInitials} src={account.avatarSrc} fallbackIcon={personPlaceholder}
        interactive={showEditButton} accessibleName={showEditButton ? texts.edit : undefined}
        title={showEditButton ? texts.edit : undefined} onClick={showEditButton ? onEditAvatarClick : undefined}
        badge={showEditButton && <Icon icon={edit} />} />
      {account.titleText && <span className="fiori-user-settings__account-title">{account.titleText}</span>}
      {account.subtitleText && <span className="fiori-user-settings__account-description">{account.subtitleText}</span>}
      {account.description && <span className="fiori-user-settings__account-description">{account.description}</span>}
      {showManageAccount && <Button className="fiori-user-settings__account-button" onClick={onManageAccountClick}><Icon icon={userSettings} />{texts.manage}</Button>}
    </div>
    {children}
  </UserSettingsView>
}

type UserSettingsAppearanceItem = { id: string; text: string; icon?: FioriIconData; colorScheme?: AvatarColorScheme; disabled?: boolean }
type UserSettingsAppearanceGroup = { id: string; headerText: string; items: readonly UserSettingsAppearanceItem[] }
type UserSettingsAppearanceViewProps = Omit<UserSettingsViewProps, "children"> & {
  items: readonly (UserSettingsAppearanceItem | UserSettingsAppearanceGroup)[]
  headerText?: string
  additionalContent?: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => boolean | void
}
function UserSettingsAppearanceView({ items, additionalContent, headerText, value, defaultValue, onValueChange, ...props }: UserSettingsAppearanceViewProps) {
  const [localValue, setLocalValue] = React.useState(defaultValue)
  const selected = value ?? localValue
  const row = (item: UserSettingsAppearanceItem) => <ListItemCustom key={item.id} value={item.id} aria-label={item.text} disabled={item.disabled}>
    <div data-slot="user-settings-appearance-item" className="fiori-user-settings__appearance-item">
      {/* UserSettingsAppearanceViewItem.js defaults to the product icon and Accent7. */}
      <Avatar size="S" shape="square" icon={item.icon ?? product} colorScheme={item.colorScheme ?? "accent7"} />
      <span className="fiori-user-settings__appearance-title">{item.text}</span>
    </div>
  </ListItemCustom>
  return <UserSettingsView {...props}>
    {additionalContent}
    <List headerText={headerText} selectionMode="single" value={selected ? [selected] : []} data-sap-ui-fastnavgroup="false"
      onValueChange={([next]) => { if (onValueChange?.(next) !== false && value === undefined) setLocalValue(next) }}>
      {items.map(item => "items" in item ? <ListItemGroup key={item.id} headerText={item.headerText}>{item.items.map(row)}</ListItemGroup> : row(item))}
    </List>
  </UserSettingsView>
}

export {
  UserSettingsDialog, UserSettingsView, UserSettingsAccountView, UserSettingsAppearanceView,
  type UserSettingsDialogProps, type UserSettingsDialogTexts, type UserSettingsDialogSlot,
  type UserSettingsCloseReason, type UserSettingsItem, type UserSettingsPage, type UserSettingsTab, type UserSettingsViewProps,
  type UserSettingsAccountViewProps, type UserSettingsAppearanceViewProps,
}
