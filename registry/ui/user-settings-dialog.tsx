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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar"
import { edit, globe, navBack, personPlaceholder, product, search, slimArrowRight, userSettings, type FioriIconData } from "@/lib/fiori-icons"
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
type NotificationRoute = {
  pages: ReadonlyMap<string, string>
  origin: { page: string | null; destination: string; row: HTMLElement }
}
const NotificationPageContext = React.createContext<{
  secondary: boolean
  navigate: (item: UserSettingsNotificationItem, row: HTMLElement) => void
} | null>(null)
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
  const [visitedViews, setVisitedViews] = React.useState(() => new Map<string, string | null | undefined>())
  const [notificationRoutes, setNotificationRoutes] = React.useState(() => new Map<string, NotificationRoute>())
  const [internalQuery, setInternalQuery] = React.useState(defaultQuery)
  const [drilledIn, setDrilledIn] = React.useState(false)
  const [announceSearch, setAnnounceSearch] = React.useState(false)
  const [announcementSequence, bumpAnnouncement] = React.useReducer((sequence: number) => sequence + 1, 0)
  const surface = React.useRef<HTMLDivElement>(null)
  const body = React.useRef<HTMLDivElement>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  const pendingFocus = React.useRef<"content" | "list" | null>(null)
  const notificationFocus = React.useRef<{ category: string; page: string | null; row?: HTMLElement } | null>(null)
  const open = openProp ?? internalOpen
  const all = [...items, ...fixedItems]
  const active = all.find(item => item.id === (value ?? internalValue)) ?? all[0]
  const activeValue = active?.id
  const itemView = active ? views[active.id] : undefined
  const selectedView = view !== undefined ? view : itemView === undefined ? defaultView : itemView
  const page = active?.pages?.find(tab => tab.id === selectedView)
  const query = queryProp ?? internalQuery
  const matches = (item: UserSettingsItem) => collatorIncludes(item.text, query, resolved.locale)
  const filtered = items.filter(matches)
  const fixed = fixedItems.filter(matches)
  const count = filtered.length + fixed.length

  // UserSettingsDialogTemplate.js switches its selected slot while the
  // supplied category views remain connected. Keep each visited React tree.
  React.useLayoutEffect(() => {
    const next = new Map<string, string | null | undefined>()
    if (open) {
      for (const item of all) {
        if (item === active) next.set(item.id, selectedView)
        else if (visitedViews.has(item.id)) next.set(item.id, visitedViews.get(item.id))
      }
    }
    const activeChanged = open && activeValue !== undefined
      && (!visitedViews.has(activeValue) || visitedViews.get(activeValue) !== selectedView)
    if (next.size !== visitedViews.size || activeChanged) setVisitedViews(next)
  })

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
    const target = notificationFocus.current
    if (!open) {
      pendingFocus.current = null
      notificationFocus.current = null
      if (notificationRoutes.size) setNotificationRoutes(new Map())
    } else if (target && target.category !== activeValue) {
      notificationFocus.current = null
    } else if (target && (selectedView ?? null) === target.page && !active?.loading) {
      notificationFocus.current = null
      if (target.row && body.current?.contains(target.row) && target.row.getClientRects().length) {
        target.row.focus()
        return
      }
      pendingFocus.current = "content"
    }
    if (!pendingFocus.current) return
    if (pendingFocus.current === "list") {
      pendingFocus.current = null
      focusSetting()
    } else if (!active?.loading) {
      pendingFocus.current = null
      const candidates = body.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-notification-row]:not([aria-disabled="true"])')
      const first = [...(candidates ?? [])].find(target => target.getClientRects().length
        && !target.matches(".fiori-list__focusarea") && !target.closest("[inert]"))
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
  const drillIn = () => {
    if (narrow) {
      pendingFocus.current = "content"
      setDrilledIn(true)
    }
  }
  const goBack = () => {
    if (page?.secondary) {
      const origin = active && notificationRoutes.get(active.id)?.origin
      if (active && origin?.destination === page.id) {
        if (selectView(origin.page)) notificationFocus.current = { category: active.id, page: origin.page, row: origin.row }
      } else if (selectView(null)) pendingFocus.current = "content"
    } else {
      pendingFocus.current = "list"
      setDrilledIn(false)
    }
  }
  const navigateNotification = (notification: UserSettingsNotificationItem, row: HTMLElement) => {
    if (!active) return
    // UserSettingsNotificationsView.js:_navigateToSecondaryView uses the
    // matching sibling ID, then the first secondary view with the row's title.
    const secondary = active.pages?.filter(candidate => candidate.secondary && candidate !== page) ?? []
    const matched = secondary.find(candidate => candidate.id === notification.itemKey)
    const destination = matched ?? secondary[0]
    if (!destination || !selectView(destination.id)) return
    const from = page ?? active.pages?.[0]
    setNotificationRoutes(current => {
      const pages = new Map(current.get(active.id)?.pages)
      if (from && !pages.has(from.id)) pages.set(from.id, from.text)
      pages.set(destination.id, matched?.text || notification.text)
      return new Map(current).set(active.id, {
        pages, origin: { page: page?.id ?? null, destination: destination.id, row },
      })
    })
    notificationFocus.current = { category: active.id, page: destination.id }
  }
  const renderPane = (item?: UserSettingsItem) => {
    const selected = item === active
    const paneView = selected ? selectedView : item && visitedViews.get(item.id)
    const panePage = item?.pages?.find(view => view.id === paneView)
    const tabs = panePage ? undefined : item?.tabs
    const visitedPages = item && notificationRoutes.get(item.id)?.pages
    const shownPage = panePage ?? (!tabs?.length ? item?.pages?.[0] : undefined)
    const heading = panePage ? visitedPages?.get(panePage.id) ?? panePage.text : item?.headerText
    const hidden = !selected || (narrow && !drilledIn)
    return (
      <div key={item?.id} data-slot="user-settings-pane" data-sap-ui-fastnavgroup={selected ? "true" : undefined}
        className={cn("fiori-user-settings__pane", classNames?.pane)} hidden={hidden} inert={hidden || undefined}>
        {item && <>
          <div data-slot="user-settings-pane-header" className={cn("fiori-user-settings__pane-header", classNames?.paneHeader)}>
            {(narrow || panePage?.secondary) && <Button data-slot="user-settings-back" className={classNames?.back}
              variant="transparent" size="icon" aria-label={texts.back} onClick={goBack}><Icon icon={navBack} /></Button>}
            {heading && <h2>{heading}</h2>}
          </div>
          <div data-slot="user-settings-body" className={cn("fiori-user-settings__body", classNames?.body)} ref={selected ? body : undefined}>
            {item.loading ? <BusyIndicator active delay={0} aria-description={item.loadingReason} className="fiori-user-settings__busy" /> : null}
            {!item.loading && tabs?.length ? <Tabs value={tabs.find(tab => tab.id === paneView)?.id ?? tabs[0].id}
                onValueChange={selectView} contentBackground="transparent">
                <TabsList>{tabs.map(tab => <TabsTrigger key={tab.id} value={tab.id}>{tab.text}</TabsTrigger>)}</TabsList>
                {tabs.map(tab => <TabsContent value={tab.id} key={tab.id}>{tab.content}</TabsContent>)}
              </Tabs> : null}
            {item.pages?.filter(candidate => candidate === shownPage || visitedPages?.has(candidate.id)).map(candidate => {
              const visible = candidate === shownPage && !item.loading
              return <div key={candidate.id} className="fiori-user-settings__page" hidden={!visible} inert={!visible || undefined}>
                <NotificationPageContext.Provider value={{
                  secondary: !!candidate.secondary,
                  navigate: (notification, row) => { if (selected && visible) navigateNotification(notification, row) },
                }}>{candidate.content ?? item.pages?.[0]?.content ?? item.content}</NotificationPageContext.Provider>
              </div>
            })}
            {!item.loading && !tabs?.length && !shownPage ? item.content : null}
          </div>
        </>}
      </div>
    )
  }
  const list = (entries: readonly UserSettingsItem[], fixedList = false) => !!entries.length && (
    <List selectionMode="single" value={activeValue ? [activeValue] : []} separators="none"
      className={cn(fixedList ? "fiori-user-settings__fixed" : "fiori-user-settings__items", fixedList ? classNames?.fixedList : classNames?.list)}
      data-settings-list={fixedList ? "fixed" : "main"} data-sap-ui-fastnavgroup="false"
      onBeforeValueChange={({ item: id }) => {
        const item = entries.find(setting => setting.id === id)
        return !!item && onValueChange?.(id, item) !== false
      }}
      onValueChange={([next]) => {
        if (value === undefined) setInternalValue(next)
        drillIn()
      }}
      onItemClick={id => { if (id === activeValue) drillIn() }}>
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
          {active ? all.filter(item => item === active || visitedViews.has(item.id)).map(renderPane) : renderPane()}
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
      onBeforeValueChange={({ item }) => onValueChange?.(item)}
      onValueChange={([next]) => { if (value === undefined) setLocalValue(next) }}>
      {items.map(item => "items" in item ? <ListItemGroup key={item.id} headerText={item.headerText}>{item.items.map(row)}</ListItemGroup> : row(item))}
    </List>
  </UserSettingsView>
}

type UserSettingsNotificationItem = {
  itemKey: string
  text: string
  bylineText?: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  navigable?: boolean
  /** Maps UI5 ListItemCustom.accessibleName to the owned list row. The switch uses title and byline. */
  accessibleName?: string
  endContent?: React.ReactNode
}
type UserSettingsNotificationGroup = {
  id: string
  headerText: string
  items: readonly UserSettingsNotificationItem[]
}
type UserSettingsNotificationsTexts = { list: string; preferences: string }
const notificationDefaults: UserSettingsNotificationsTexts = {
  list: "List of Notification Types", // UI5 USER_SETTINGS_NOTIFICATIONS_LIST_LABEL
  preferences: "List of Notification Preferences", // UI5 USER_SETTINGS_NOTIFICATIONS_PREFERENCES_LIST_LABEL
}
const notificationKeys = {
  list: "USER_SETTINGS_NOTIFICATIONS_LIST_LABEL",
  preferences: "USER_SETTINGS_NOTIFICATIONS_PREFERENCES_LIST_LABEL",
} as const
/** Experimental part styling. Rows and switches retain their owned semantics. */
type UserSettingsNotificationsSlot = "additionalContent" | "list" | "group" | "form" | "row" | "title" | "byline" | "end" | "switch" | "arrow"
type UserSettingsNotificationsViewProps = Omit<UserSettingsViewProps, "children"> & {
  items: readonly (UserSettingsNotificationItem | UserSettingsNotificationGroup)[]
  headerItems?: readonly UserSettingsNotificationItem[]
  additionalContent?: React.ReactNode
  /** Defaults to the enclosing dialog page's secondary state. */
  secondary?: boolean
  /** Return false to veto automatic navigation to the item's secondary page. */
  onItemClick?: (item: UserSettingsNotificationItem) => boolean | void
  onCheckedChange?: (itemKey: string, checked: boolean) => void
  locale?: string
  texts?: Partial<UserSettingsNotificationsTexts>
  classNames?: Partial<Record<UserSettingsNotificationsSlot, string>>
}

function NotificationRow({ item, header, classNames, onCheckedChange, onNavigate }: {
  item: UserSettingsNotificationItem
  header?: boolean
  classNames: UserSettingsNotificationsViewProps["classNames"]
  onCheckedChange: UserSettingsNotificationsViewProps["onCheckedChange"]
  onNavigate: (item: UserSettingsNotificationItem, row: HTMLElement) => void
}) {
  const [localChecked, setLocalChecked] = React.useState(item.defaultChecked ?? false)
  if (process.env.NODE_ENV !== "production") for (const key of Object.keys(item)) {
    if (key === "role" || key === "id" || key === "tabIndex" || key.startsWith("aria-")) console.warn(`UserSettingsNotificationsView: ignored ownership prop ${key}`)
  }
  const checked = item.checked ?? localChecked
  const hasEnd = React.Children.toArray(item.endContent).length > 0
  const name = [item.text, item.bylineText].filter(Boolean).join(" ")
  const change = (next: boolean) => {
    if (item.disabled) return
    if (item.checked === undefined) setLocalChecked(next)
    onCheckedChange?.(item.itemKey, next)
  }
  const navigate = (row: HTMLElement) => {
    if (item.navigable && !item.disabled) onNavigate(item, row)
  }
  const modified = (event: React.KeyboardEvent) => event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
  const keyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || item.disabled || modified(event)) return
    if (event.key === " ") event.preventDefault()
    if (event.key === "Enter" && item.navigable) {
      event.preventDefault()
      navigate(event.currentTarget)
    }
  }
  const keyUp = (event: React.KeyboardEvent<HTMLElement>) => {
    // UserSettingsNotificationsViewItem.js:_onkeyup keeps row Space separate
    // from the nested switch and only delegates when there is custom end content.
    if (event.target !== event.currentTarget || event.key !== " " || item.disabled || modified(event)) return
    if (hasEnd) navigate(event.currentTarget)
    else change(!checked)
  }
  const content = <div className="fiori-user-settings__notification-body" data-byline={item.text && item.bylineText ? "" : undefined}>
    <div className="fiori-user-settings__notification-label">
      {item.text && <span data-slot="user-settings-notification-title" className={cn("fiori-user-settings__notification-title", classNames?.title)}>{item.text}</span>}
      {item.bylineText && <span data-slot="user-settings-notification-byline" className={cn("fiori-user-settings__notification-byline", classNames?.byline)}>{item.bylineText}</span>}
    </div>
    {/* UserSettingsNotificationsViewItemTemplate.js isolates end-content clicks. */}
    <div data-slot="user-settings-notification-end" className={cn("fiori-user-settings__notification-end", classNames?.end)} onClick={event => event.stopPropagation()}>
      {hasEnd ? item.endContent : <Switch className={classNames?.switch} aria-label={name} checked={checked}
        disabled={item.disabled} onCheckedChange={change} onKeyDown={event => {
          if (modified(event) && (event.key === " " || event.key === "Enter")) event.preventDefault()
        }} />}
    </div>
  </div>
  const arrow = item.navigable && <Icon icon={slimArrowRight} className={cn("fiori-user-settings__notification-arrow", !header && "fiori-li__nav-icon", classNames?.arrow)} />
  if (header) return (
    <div role="form" data-slot="user-settings-notification-form" className={cn("fiori-user-settings__notification-form", classNames?.form)}>
      <div role="group" aria-label={name} aria-disabled={item.disabled || undefined} tabIndex={item.disabled ? -1 : 0}
        data-notification-row="" data-navigable={item.navigable ? "" : undefined}
        data-slot="user-settings-notification-row" className={cn("fiori-user-settings__notification-row", classNames?.row)}
        onClick={event => navigate(event.currentTarget)}
        onKeyDown={event => {
          if (event.key === "F2" && !modified(event)) {
            event.preventDefault()
            if (event.target === event.currentTarget) {
              event.currentTarget.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled]), a[href], [tabindex='0']")?.focus()
            } else event.currentTarget.focus()
          }
          keyDown(event)
        }}
        onKeyUp={keyUp}>
        {content}{arrow}
      </div>
    </div>
  )
  return <ListItemCustom value={item.itemKey} aria-label={item.accessibleName ?? name} disabled={item.disabled}
    type="active" data-notification-row=""
    data-navigable={item.navigable ? "" : undefined}
    className={cn("fiori-user-settings__notification-row", classNames?.row)}
    onKeyDown={keyDown} onKeyUp={keyUp}
    onClick={event => navigate(event.currentTarget)}>
    {/* The native item keeps ListItemCustom's Active type and overrides typeNavigation. */}
    {content}{arrow}
  </ListItemCustom>
}

function UserSettingsNotificationsView({ items, headerItems, additionalContent, secondary, onItemClick, onCheckedChange, locale,
  texts: overrides, classNames, className, ...props }: UserSettingsNotificationsViewProps) {
  const page = React.useContext(NotificationPageContext)
  const texts = useFioriTexts(notificationDefaults, notificationKeys, overrides, locale)
  const navigate = (item: UserSettingsNotificationItem, row: HTMLElement) => {
    if (onItemClick?.(item) !== false) page?.navigate(item, row)
  }
  const row = (item: UserSettingsNotificationItem, header = false) =>
    <NotificationRow key={item.itemKey} item={item} header={header} classNames={classNames}
      onCheckedChange={onCheckedChange} onNavigate={navigate} />
  return <UserSettingsView {...props} className={cn("fiori-user-settings__notifications", className)}>
    {additionalContent != null && <div data-slot="user-settings-notification-additional" className={classNames?.additionalContent}>{additionalContent}</div>}
    {headerItems?.map(item => row(item, true))}
    <List aria-label={(secondary ?? page?.secondary) ? texts.preferences : texts.list} locale={locale}
      className={cn("fiori-user-settings__notification-list", classNames?.list)} data-sap-ui-fastnavgroup="false">
      {items.map(item => "items" in item
        ? <ListItemGroup key={item.id} headerText={item.headerText} className={classNames?.group}>{item.items.map(choice => row(choice))}</ListItemGroup>
        : row(item))}
    </List>
  </UserSettingsView>
}

export {
  UserSettingsDialog, UserSettingsView, UserSettingsAccountView, UserSettingsAppearanceView, UserSettingsNotificationsView,
  type UserSettingsDialogProps, type UserSettingsDialogTexts, type UserSettingsDialogSlot,
  type UserSettingsCloseReason, type UserSettingsItem, type UserSettingsPage, type UserSettingsTab, type UserSettingsViewProps,
  type UserSettingsAccountViewProps, type UserSettingsAppearanceViewProps,
  type UserSettingsNotificationsViewProps, type UserSettingsNotificationItem, type UserSettingsNotificationGroup, type UserSettingsNotificationsSlot,
  type UserSettingsNotificationsTexts,
}
