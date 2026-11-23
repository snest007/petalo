import "@ui5/webcomponents/dist/DynamicDateRange.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/Today.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/Yesterday.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/Tomorrow.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/SingleDate.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/DateRange.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/DateTimeRange.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/FromDateTime.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/ToDateTime.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/LastOptions.js"
import "@ui5/webcomponents/dist/dynamic-date-range-options/NextOptions.js"
import "@ui5/webcomponents-icons/dist/appointment-2.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type Ui5DynamicDateRange from "@ui5/webcomponents/dist/DynamicDateRange.js"
import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { optionsFor } from "./dynamic-date-range"
import { placeInPlace } from "./ui5-popup-in-place"

export default defineUi5(set, ({ value, popup }) => {
  const label = h("span", { id: `dynamic-date-range-${popup || value?.operator || "empty"}-label`, hidden: true }, "Period")
  const field = h("ui5-dynamic-date-range", { options: optionsFor(popup), "accessible-name-ref": label.id }) as Ui5DynamicDateRange
  if (value) {
    const values = value.values
    field.value = { operator: value.operator, values: values?.every(entry => entry instanceof Date) ? [...values] :
      values?.filter((entry): entry is number => typeof entry === "number") }
  }
  const frame = h("div", {}, label, field) as Ui5FixtureElement
  if (!popup) return frame

  frame.style.cssText = "display:flex;overflow:hidden;padding:.75rem"
  // A block host removes the anonymous inline line box above the pinned
  // surface; the native section itself remains the measured 35.625rem.
  field.style.display = "block"
  field.style.width = "max-content"
  frame.fixtureReady = (async () => {
    // The first renderFinished can settle before this custom element's own
    // template mounts. Wait for both actual surfaces before pinning the popup.
    await customElements.whenDefined(field.localName)
    await field.definePromise
    for (let frame = 0; !field.shadowRoot?.querySelector("ui5-responsive-popover") && frame < 120; frame++) {
      await new Promise(requestAnimationFrame)
    }
    await renderFinished()
    if (popup !== "options") {
      // Select the real UI5 editor without raising the native popover into the top layer.
      const editor = field.getOption(popup)
      Object.assign(field, { _currentOption: editor, currentValue: field.value })
      await renderFinished()
    }
    const root = field.shadowRoot!
    const fieldRoot = root?.querySelector<HTMLElement>(".ui5-dynamic-date-range-root")
    const surface = root?.querySelector<HTMLElement>("ui5-responsive-popover")
    if (!fieldRoot || !surface) throw new Error(`DynamicDateRange fixture ${popup} has no rendered popup surface`)
    fieldRoot.style.display = "none"
    placeInPlace(surface)
    surface.removeAttribute("popover")
    await renderFinished()
  })()
  return frame
})
