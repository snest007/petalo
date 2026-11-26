import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/UserSettingsDialog.js"
import "@ui5/webcomponents-fiori/dist/UserSettingsItem.js"
import "@ui5/webcomponents-fiori/dist/UserSettingsView.js"
import "@ui5/webcomponents-fiori/dist/UserSettingsAccountView.js"
import "@ui5/webcomponents-fiori/dist/UserSettingsAppearanceView.js"
import "@ui5/webcomponents-fiori/dist/UserSettingsAppearanceViewItem.js"
import "@ui5/webcomponents-fiori/dist/UserMenuAccount.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents-icons/dist/employee.js"
import "@ui5/webcomponents-icons/dist/globe.js"
import "@ui5/webcomponents-icons/dist/palette.js"
import "@ui5/webcomponents-icons/dist/sys-help.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { placeInPlace } from "./ui5-popup-in-place"
import set from "./user-settings-dialog"
import { appearanceItems, categories, panelHeight, panelWidth, settingsAccount, settingsHeader } from "./user-settings-dialog.cases"

export default defineUi5(set, ({ active = "general", search, empty, save, loading }) => {
  const item = (id: keyof typeof categories, title: string, children: HTMLElement[]) =>
    h("ui5-user-settings-item", {
      text: categories[id].text, icon: categories[id].icon, selected: id === active,
      "header-text": title, loading: id === "general" && loading, slot: id === "help" ? "fixedItems" : undefined,
    }, ...children)
  const account = h("ui5-user-settings-account-view", { "show-manage-account": true },
    h("ui5-user-menu-account", { slot: "account", "title-text": settingsAccount.titleText,
      "subtitle-text": settingsAccount.subtitleText, description: settingsAccount.description, "avatar-initials": settingsAccount.avatarInitials }), h("div", {}, "Profile synchronized"))
  const appearance = h("ui5-user-settings-appearance-view", {}, h("div", { slot: "additionalContent" }, "Choose a theme."),
    ...appearanceItems.map(entry => h("ui5-user-settings-appearance-view-item", { text: entry.text, icon: entry.icon, selected: entry.id === "light" })))
  const host = h("ui5-user-settings-dialog", { "header-text": settingsHeader, "show-search-field": search, "save-mode": save },
    item("general", "General preferences", [
      h("ui5-user-settings-view", { slot: "tabs", text: "Language", selected: true }, h("ui5-button", {}, "Change language")),
      h("ui5-user-settings-view", { slot: "tabs", text: "Region" }, h("ui5-button", {}, "Change region")),
    ]),
    item("account", "Account", [account]),
    item("appearance", "Appearance", [appearance]),
    item("help", "Help", [h("ui5-user-settings-view", {}, h("ui5-button", {}, "Open help"))]))
  if (empty) (host as HTMLElement & { _searchValue: string })._searchValue = "absent"
  const frame = h("div", {}, host) as Ui5FixtureElement
  frame.style.cssText = "overflow:hidden;padding:.75rem"
  frame.fixtureReady = (async () => {
    // UI5Element.connectedCallback resolves this after the first shadow render,
    // including asynchronous theme and language setup.
    await (host as UI5Element)._domRefReadyPromise
    const dialog = host.shadowRoot?.querySelector<UI5Element>("ui5-dialog")
    if (!dialog) throw new Error("UserSettingsDialog inner dialog did not render")
    await dialog._domRefReadyPromise
    await renderFinished()
    placeInPlace(dialog)
    dialog.removeAttribute("popover")
    dialog.style.width = panelWidth
    dialog.style.height = panelHeight
    if (empty) {
      const field = host.shadowRoot?.querySelector<HTMLElement & { value: string }>("ui5-input")
      if (field) field.value = "absent"
    }
  })()
  return frame
})
