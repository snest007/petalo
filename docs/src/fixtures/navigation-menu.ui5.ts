import "@ui5/webcomponents-fiori/dist/Assets.js"
import "@ui5/webcomponents-fiori/dist/NavigationMenu.js"
import "@ui5/webcomponents-fiori/dist/NavigationMenuItem.js"
import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/Tag.js"
import "@ui5/webcomponents-icons/dist/home.js"

import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set from "./navigation-menu"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"

type NativeMenu = HTMLElement & { opener: HTMLElement; open: boolean }

export default defineUi5(set, ({ rtl, interaction }) => {
  const menu = h("ui5-navigation-menu", {},
    h("ui5-navigation-menu-item", { text: "Home", icon: "home", href: "#navigation-menu-home" }, h("ui5-tag", { slot: "tag" }, "New")),
    h("ui5-navigation-menu-item", { text: "Workspace" },
      h("ui5-navigation-menu-item", { text: "Settings", href: "#navigation-menu-settings" }),
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
  frame.fixtureReady = (async () => {
    while (!menu.isConnected || !menu.shadowRoot?.querySelector(".ui5-navigation-menu")) await new Promise(requestAnimationFrame)
    await renderFinished()
    // Popup.onEnterDOM puts even closed surfaces behind the native top-layer visibility flag.
    // This static cell shows the installed menu's list without opening or taking focus.
    menu.shadowRoot!.querySelector(".ui5-navigation-menu")!.removeAttribute("popover")
  })()
  return frame
})
