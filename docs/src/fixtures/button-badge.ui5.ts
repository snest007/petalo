import "@ui5/webcomponents/dist/Button.js"
import "@ui5/webcomponents/dist/ButtonBadge.js"
import "@ui5/webcomponents-icons/dist/bell.js"
import { defineUi5, h } from "../fixture-types"
import set from "./button-badge"

export default defineUi5(set, ({ design, text, icon, disabled, rtl }) =>
  h("ui5-button", { disabled, dir: rtl ? "rtl" : undefined, icon: icon ? "bell" : undefined, "accessible-name": icon ? "Notifications" : undefined },
    ...(icon ? [] : ["Notifications"]), h("ui5-button-badge", { slot: "badge", design, text })))
