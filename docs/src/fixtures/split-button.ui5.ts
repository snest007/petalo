import "@ui5/webcomponents/dist/SplitButton.js"
import "@ui5/webcomponents/dist/Menu.js"
import "@ui5/webcomponents/dist/MenuItem.js"
import "@ui5/webcomponents-icons/dist/download.js"

import { defineUi5, h } from "../fixture-types"
import { showShadowPopupInPlace } from "./ui5-popup-in-place"
import set from "./split-button"

export default defineUi5(set, ({ design, disabled, icon, active, rtl, open }) => {
  const split = h("ui5-split-button", {
    design: design && design[0].toUpperCase() + design.slice(1), disabled,
    icon: icon ? "download" : undefined, dir: rtl ? "rtl" : undefined,
    "active-arrow-button": active || open,
  }, "Export PDF")
  if (!open) return split

  const menu = h("ui5-menu", { "accessible-name": "Export formats" },
    h("ui5-menu-item", { text: "Export as spreadsheet" }))
  const frame = showShadowPopupInPlace(menu, ".ui5-menu-rp", "10rem")
  frame.prepend(split)
  return frame
})
