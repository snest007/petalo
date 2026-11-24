import "@ui5/webcomponents/dist/Input.js"
import "@ui5/webcomponents/dist/features/InputSuggestions.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type Input from "@ui5/webcomponents/dist/Input.js"

import { defineUi5, FIELD_WIDTH, h, type Ui5FixtureElement } from "../fixture-types"
import { placeInPlace } from "./ui5-popup-in-place"
import { ui5State } from "./ui5-helpers"
import set, { suggestionData } from "./input"

export default defineUi5(set, ({ value, placeholder, valueState, disabled, readOnly, a11y, suggestions, rtl }) => {
  if (suggestions) {
    const items = suggestionData.map(({ text, additionalText }) => h("ui5-suggestion-item", { text, "additional-text": additionalText }))
    const el = h("ui5-input", { "accessible-name": "City", "show-suggestions": true, "no-typeahead": true,
      value: suggestions === "filtered" ? "Be" : undefined,
      filter: suggestions === "filtered" ? "StartsWith" : "None",
      "value-state": suggestions === "state" ? "Negative" : undefined },
      ...(suggestions === "grouped" ? [h("ui5-suggestion-item-group", { "header-text": "Europe" }, ...items)] : items)) as Input
    el.style.width = FIELD_WIDTH
    el.style.position = "relative"
    const frame = h("div", { dir: rtl ? "rtl" : undefined }, el) as Ui5FixtureElement
    frame.style.cssText = "overflow:hidden;padding:.75rem;width:14.625rem;box-sizing:border-box"
    if (suggestions !== "closed") frame.fixtureReady = (async () => {
      await customElements.whenDefined(el.localName)
      await el.definePromise
      await renderFinished()
      const popup = el.shadowRoot!.querySelector<HTMLElement & { openPopup: () => Promise<void>; definePromise: Promise<void> }>("ui5-responsive-popover")!
      await popup.definePromise
      // Popup.js and ResponsivePopover.handleOpenOnEnterDOM can call showPopover
      // independently of openPopup. Keep the native open state and paint in the cell.
      popup.showPopover = () => {}
      popup.openPopup = async () => {}
      const pin = () => {
        if (popup.matches(":popover-open")) popup.hidePopover()
        placeInPlace(popup)
        popup.style.setProperty("position", "absolute", "important")
        // Popover.js anchors to the opener's border box. Absolute positioning
        // starts at its padding box, so account for the native Horizon HC border.
        const { borderBlockEndWidth, borderInlineStartWidth } = getComputedStyle(el)
        popup.style.setProperty("inset-block-start", `calc(100% + ${borderBlockEndWidth})`, "important")
        popup.style.setProperty("inset-inline-start", `calc(-1 * ${borderInlineStartWidth})`, "important")
        popup.style.width = FIELD_WIDTH
      }
      pin()
      if (suggestions === "filtered") el.typedInValue = "Be"
      el.open = true
      await renderFinished()
      pin()
      const reserve = () => frame.style.setProperty("padding-bottom", `calc(.75rem + ${popup.offsetHeight}px)`)
      const observer = new ResizeObserver(reserve)
      observer.observe(popup)
      reserve()
    })()
    return frame
  }
  const prefix = `input-a11y-${a11y}`
  const el = h("ui5-input", {
    "accessible-name": a11y === "name" ? "Supplier identifier" : "Input",
    "accessible-name-ref": a11y === "name-ref" ? `${prefix}-label` : undefined,
    "accessible-description": a11y === "description" ? "Use the supplier number" : undefined,
    "accessible-description-ref": a11y === "description-ref" ? `${prefix}-description` : undefined,
    value, placeholder, "value-state": ui5State(valueState), disabled, readonly: readOnly })
  el.style.width = FIELD_WIDTH
  if (!a11y) return el
  return h("div", {}, h("span", { id: `${prefix}-label`, hidden: true }, "Supplier identifier"), h("span", { id: `${prefix}-description`, hidden: true }, "Use the supplier number"), el)
})
