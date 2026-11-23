import "@ui5/webcomponents/dist/Input.js"
import "@ui5/webcomponents/dist/features/InputSuggestions.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type Input from "@ui5/webcomponents/dist/Input.js"

import { defineUi5, FIELD_WIDTH, h, type Ui5FixtureElement } from "../fixture-types"
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
      // Keep native Popup rendering and open-state announcements without top-layer
      // paint or autofocus across the shared fixture page.
      popup.openPopup = async () => {}
      await popup.definePromise
      const styles = new CSSStyleSheet()
      styles.replaceSync(`
        ui5-responsive-popover.ui5-suggestions-popover { display:flex !important; position:absolute !important;
          inset-block:100% auto !important; inset-inline:0 auto !important; transform:none !important;
          max-width:none !important; max-height:none !important; width:${FIELD_WIDTH}; }
      `)
      const root = el.shadowRoot!
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, styles]
      if (suggestions === "filtered") (el as Input & { typedInValue: string }).typedInValue = "Be"
      el.open = true
      await renderFinished()
      if (!root.adoptedStyleSheets.includes(styles)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, styles]
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
