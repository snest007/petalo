import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents/dist/Input.js"
import "@ui5/webcomponents/dist/features/InputSuggestions.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type Input from "@ui5/webcomponents/dist/Input.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import { suggestionData } from "../fixtures/input"
import set from "./input"

export default defineUi5(set, ({ rtl }) => {
  const el = h("ui5-input", { "accessible-name": "City", placeholder: "City", "show-suggestions": true, "no-typeahead": true,
    value: "Be", filter: "StartsWith" },
    ...suggestionData.map(({ text, additionalText }) => h("ui5-suggestion-item", { text, "additional-text": additionalText }))) as Input
  const frame = h("div", { dir: rtl ? "rtl" : undefined }, el) as Ui5FixtureElement
  frame.style.cssText = "width:375px;height:667px;overflow:hidden"
  frame.fixtureReady = (async () => {
    await customElements.whenDefined(el.localName)
    await el.definePromise
    await renderFinished()
    const popup = el.shadowRoot!.querySelector<HTMLElement & { definePromise: Promise<void> }>("ui5-responsive-popover")!
    await popup.definePromise
    await renderFinished()
    const dialog = popup.shadowRoot?.querySelector<HTMLElement & { definePromise: Promise<void> }>("ui5-dialog")
    if (!dialog) throw new Error("Input phone dialog was not rendered")
    await dialog.definePromise
    el.typedInValue = "Be"
    el.open = true
    await renderFinished()
  })()
  return frame
})
