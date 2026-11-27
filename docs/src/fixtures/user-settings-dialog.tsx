import { Button } from "@/components/ui/button"
import { UserSettingsAccountView, UserSettingsAppearanceView, UserSettingsDialog, UserSettingsNotificationsView, UserSettingsView, type UserSettingsItem, type UserSettingsNotificationsViewProps } from "@/components/ui/user-settings-dialog"
import { bell, employee, globe, palette, sysHelp } from "@/lib/fiori-icons"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { defineFixtures, readPageOptions } from "../fixture-types"
import { appearanceItems, categories, notificationAdditional, notificationCustomLabel, notificationDetail, notificationEmail, notificationFallback,
  notificationGroupTitle, notificationHeader, notificationPush, panelHeight, panelWidth, settingsAccount, settingsCases, settingsHeader,
  type NotificationCase, type SettingsCase } from "./user-settings-dialog.cases"

const packs = { "de-DE": de, "zh-CN": zh, "ar-EG": ar }

export const settingsItems: readonly UserSettingsItem[] = [
  { ...categories.general, headerText: "General preferences", icon: globe,
    tabs: [
      { id: "language", text: "Language", content: <UserSettingsView><Button>Change language</Button></UserSettingsView> },
      { id: "region", text: "Region", content: <UserSettingsView><Button>Change region</Button></UserSettingsView> },
    ] },
  { ...categories.account, headerText: "Account", icon: employee,
    content: <UserSettingsAccountView account={settingsAccount} showManageAccount><div>Profile synchronized</div></UserSettingsAccountView> },
  { ...categories.appearance, headerText: "Appearance", icon: palette,
    content: <UserSettingsAppearanceView items={appearanceItems.map(item => ({ ...item, icon: palette }))} defaultValue="light" additionalContent={<div>Choose a theme.</div>} /> },
]
export const fixedSettings: readonly UserSettingsItem[] = [
  { ...categories.help, headerText: "Help", icon: sysHelp, content: <UserSettingsView><Button>Open help</Button></UserSettingsView> },
]

export function notificationSettings(variant: NotificationCase, onItemClick?: UserSettingsNotificationsViewProps["onItemClick"]): UserSettingsItem {
  const grouped = variant === "grouped" || variant === "demo"
  const custom = variant === "custom" || variant === "demo"
  return {
    ...categories.notifications, icon: bell, headerText: "Notifications",
    pages: [
      { id: "primary", text: "Notifications", content: <UserSettingsNotificationsView
        additionalContent={<span>{notificationAdditional}</span>}
        onItemClick={onItemClick}
        headerItems={custom ? [{ ...notificationHeader, endContent: <Button variant="transparent">{notificationCustomLabel}</Button> }] : undefined}
        items={[
          grouped ? { id: "channels", headerText: notificationGroupTitle, items: [notificationEmail, notificationPush] } : notificationEmail,
          ...(variant === "demo" ? [notificationFallback] : []),
        ]} /> },
      { id: "email", text: "Email preferences", secondary: true, content: <UserSettingsNotificationsView items={[notificationDetail]} /> },
      { id: "push", text: "Push preferences", secondary: true, content: <UserSettingsNotificationsView items={[notificationDetail]} /> },
    ],
  }
}

export default defineFixtures<SettingsCase>({
  name: "user-settings-dialog",
  cases: settingsCases,
  a11yDiffGroups: [{
    "cases": ["user-settings-dialog-general", "user-settings-dialog-account", "user-settings-dialog-appearance", "user-settings-dialog-search", "user-settings-dialog-empty", "user-settings-dialog-loading"],
    "diff": {
      "ignore": [],
      "pinnedPopupShell": { "kind": "settings-dialog", "name": "User Settings" },
      "reason": "Compare the pinned Dialog through PopupTemplate's shadow shell. H13 verifies the exact empty announcement outlets, form and icon scaffolding, side group, duplicate tab relation, Avatar initials and BusyIndicator representation."
    }
  }, {
    "cases": ["user-settings-dialog-notifications-primary", "user-settings-dialog-notifications-grouped", "user-settings-dialog-notifications-custom", "user-settings-dialog-notifications-secondary"],
    "diff": {
      "ignore": [],
      "pinnedPopupShell": { "kind": "settings-dialog", "name": "User Settings" },
      "reason": "Compare notification settings inside the pinned Dialog. H13c checks form-associated Switch and Button hosts, exact inert wrappers, the group ownership relation, and the keyboard stop added to the custom header row."
    }
  }],
  react: ({ active, search, empty, save, loading, styled, notifications }) => {
    const { locale, dir } = readPageOptions()
    const dialog = <div style={{ overflow: "hidden", padding: ".75rem" }}>
      <UserSettingsDialog open portal={false} preventInitialFocus
        style={{ width: panelWidth, height: panelHeight, maxWidth: "none", maxHeight: "none" }}
        headerText={settingsHeader} showSearchField={search} query={empty ? "absent" : undefined} saveMode={save}
        defaultValue={notifications ? "notifications" : active ?? "general"}
        defaultView={notifications === "secondary" ? "email" : undefined}
        classNames={styled ? { side: "settings-custom-side" } : undefined}
        items={notifications ? [...settingsItems, notificationSettings(notifications)]
          : loading ? settingsItems.map(item => item.id === "general" ? { ...item, loading: true } : item) : settingsItems}
        fixedItems={fixedSettings} />
    </div>
    return locale && Object.hasOwn(packs, locale)
      ? <FioriLocaleProvider locale={locale} dir={dir} texts={packs[locale as keyof typeof packs]}>{dialog}</FioriLocaleProvider>
      : dialog
  },
})
