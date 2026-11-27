// Inputs shared by the Petalo and native SAP renderers.
export type NotificationCase = "primary" | "grouped" | "custom" | "secondary" | "demo"
export type SettingsCase = { active?: string; search?: boolean; empty?: boolean; save?: boolean; loading?: boolean; styled?: boolean; notifications?: NotificationCase }
export const settingsHeader = "Settings"
export const settingsAccount = { titleText: "Maya Chen", subtitleText: "maya.chen@example.com", description: "Product Designer", avatarInitials: "MC" }
export const categories = {
  general: { id: "general", text: "General", icon: "globe" },
  account: { id: "account", text: "Account", icon: "employee" },
  appearance: { id: "appearance", text: "Appearance", icon: "palette" },
  notifications: { id: "notifications", text: "Notifications", icon: "bell" },
  help: { id: "help", text: "Help", icon: "sys-help" },
} as const
export const appearanceItems = [
  { id: "light", text: "Morning Horizon", icon: "palette" },
  { id: "dark", text: "Evening Horizon", icon: "palette" },
] as const
export const panelWidth = "52rem"
export const panelHeight = "24rem"
export const notificationEmail = { itemKey: "email", text: "Email", bylineText: "Account updates", defaultChecked: true, navigable: true }
export const notificationPush = { itemKey: "push", text: "Push", navigable: true }
export const notificationFallback = { itemKey: "digest", text: "Digest", navigable: true }
export const notificationHeader = { itemKey: "delivery", text: "Delivery options", navigable: true }
export const notificationDetail = { itemKey: "mentions", text: "Mentions" }
export const notificationGroupTitle = "Channels"
export const notificationAdditional = "Choose how you receive updates."
export const notificationCustomLabel = "Preview delivery"
export const settingsCases: { id: string; props: SettingsCase }[] = [
  { id: "user-settings-dialog-general", props: {} },
  { id: "user-settings-dialog-account", props: { active: "account" } },
  { id: "user-settings-dialog-appearance", props: { active: "appearance", save: true } },
  { id: "user-settings-dialog-search", props: { search: true } },
  { id: "user-settings-dialog-empty", props: { search: true, empty: true, styled: true } },
  { id: "user-settings-dialog-loading", props: { loading: true } },
  { id: "user-settings-dialog-notifications-primary", props: { notifications: "primary" } },
  { id: "user-settings-dialog-notifications-grouped", props: { notifications: "grouped" } },
  { id: "user-settings-dialog-notifications-custom", props: { notifications: "custom" } },
  { id: "user-settings-dialog-notifications-secondary", props: { notifications: "secondary" } },
]
