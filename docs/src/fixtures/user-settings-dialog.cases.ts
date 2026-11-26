// Inputs shared by the Petalo and native SAP renderers.
export type SettingsCase = { active?: string; search?: boolean; empty?: boolean; save?: boolean; loading?: boolean; styled?: boolean }
export const settingsHeader = "Settings"
export const settingsAccount = { titleText: "Maya Chen", subtitleText: "maya.chen@example.com", description: "Product Designer", avatarInitials: "MC" }
export const categories = {
  general: { id: "general", text: "General", icon: "globe" },
  account: { id: "account", text: "Account", icon: "employee" },
  appearance: { id: "appearance", text: "Appearance", icon: "palette" },
  help: { id: "help", text: "Help", icon: "sys-help" },
} as const
export const appearanceItems = [
  { id: "light", text: "Morning Horizon", icon: "palette" },
  { id: "dark", text: "Evening Horizon", icon: "palette" },
] as const
export const panelWidth = "52rem"
export const panelHeight = "24rem"
export const settingsCases: { id: string; props: SettingsCase }[] = [
  { id: "user-settings-dialog-general", props: {} },
  { id: "user-settings-dialog-account", props: { active: "account" } },
  { id: "user-settings-dialog-appearance", props: { active: "appearance", save: true } },
  { id: "user-settings-dialog-search", props: { search: true } },
  { id: "user-settings-dialog-empty", props: { search: true, empty: true, styled: true } },
  { id: "user-settings-dialog-loading", props: { loading: true } },
]
