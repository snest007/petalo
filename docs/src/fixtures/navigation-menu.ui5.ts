import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/NavigationMenu.js"
import "@ui5/webcomponents-fiori/dist/NavigationMenuItem.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Tag.js"
import "@ui5/webcomponents-icons/dist/home.js"
import "@ui5/webcomponents-icons/dist/Assets.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set from "./navigation-menu"
import { placeInPlace, showShadowPopupInPlace } from "./ui5-popup-in-place"

type FixturePopover = HTMLElement & { open: boolean; openPopup: () => Promise<void> }
type NativeItem = HTMLElement & { _popover: FixturePopover | null }
type NativeMenu = HTMLElement & { opener: HTMLElement; open: boolean; _openItemSubMenu: (item: NativeItem, openedByMouse: boolean) => void }

export default defineUi5(set, ({ rtl, interaction, expanded }) => {
  const menu = h("ui5-navigation-menu", {},
    h("ui5-navigation-menu-item", { text: "Home", icon: expanded ? undefined : "home", href: "#navigation-menu-home" }, h("ui5-tag", { slot: "tag" }, "New")),
    h("ui5-navigation-menu-item", { text: "Workspace" },
      h("ui5-navigation-menu-item", { text: "Settings", icon: expanded ? "home" : undefined, href: "#navigation-menu-settings" }),
      h("ui5-navigation-menu-item", { text: "More" }, h("ui5-navigation-menu-item", { text: "Reporting", href: "#navigation-menu-reporting" }))),
    h("ui5-navigation-menu-item", { text: "Help", href: "about:blank", target: "_blank", design: "Action" }),
    h("ui5-navigation-menu-item", { text: "Archive", href: "#navigation-menu-archive", disabled: true })) as NativeMenu

  if (interaction) {
    const opener = h("ui5-button", {}, "Navigate") as HTMLElement & { accessibilityAttributes: { expanded: boolean; hasPopup: string } }
    opener.accessibilityAttributes = { expanded: false, hasPopup: "menu" }
    menu.opener = opener
    opener.addEventListener("click", () => { menu.open = true })
    const wrapper = h("div", { dir: rtl ? "rtl" : undefined }, opener, menu)
    wrapper.style.display = "inline-flex"
    return wrapper
  }
  const frame = showShadowPopupInPlace(menu, ".ui5-navigation-menu") as Ui5FixtureElement
  if (rtl) frame.dir = "rtl"
  if (expanded) Object.assign(frame.style, { width: "20rem", boxSizing: "border-box" })
  frame.fixtureReady = (async () => {
    while (!menu.isConnected || !menu.shadowRoot?.querySelector(".ui5-navigation-menu")) await new Promise(requestAnimationFrame)
    await renderFinished()
    // Popup.onEnterDOM puts even closed surfaces behind the native top-layer visibility flag.
    // This static cell shows the installed menu's list without opening or taking focus.
    const root = menu.shadowRoot!.querySelector<HTMLElement>(".ui5-navigation-menu")!
    root.removeAttribute("popover")
    if (!expanded) return
    root.style.width = "max-content"
    const workspace = menu.querySelector<NativeItem>('ui5-navigation-menu-item[text="Workspace"]')!
    while (!workspace._popover?.shadowRoot || !root.shadowRoot?.querySelector('[part="content"]')) await new Promise(requestAnimationFrame)
    const popup = workspace._popover
    // Retain Menu.js's open/selected state while suppressing top-layer entry and focus.
    // The paired live interaction test verifies positioning against the actual opener.
    popup.openPopup = async () => {}
    popup.showPopover = () => {}
    menu._openItemSubMenu(workspace, true)
    await renderFinished()
    popup.removeAttribute("popover")
    placeInPlace(popup)
    popup.style.setProperty("position", "absolute", "important")
    popup.style.setProperty("inset-block-start", "0", "important")
    popup.style.setProperty("inset-inline-start", "100%", "important")
    root.shadowRoot!.querySelector<HTMLElement>('[part="content"]')!.style.overflow = "visible"
    const list = menu.shadowRoot!.querySelector("ui5-list")!
    list.shadowRoot?.querySelectorAll<HTMLElement>("div,ul").forEach((node) => { node.style.overflow = "visible" })
  })()
  return frame
})
