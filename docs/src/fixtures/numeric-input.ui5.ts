import "@ui5/webcomponents/dist/NumericInput.js"
import { defineUi5, FIELD_WIDTH, h } from "../fixture-types"
import { ui5State } from "./ui5-helpers"
import set from "./numeric-input"

export default defineUi5(set, ({ value, min, max, step, precision, valueState, valueStateMessage, required, disabled, readOnly, rtl }) => {
  const field = h("ui5-numeric-input", {
    "accessible-name": "Order quantity", value: value?.toString(), min: min?.toString(), max: max?.toString(),
    step: step?.toString(), "value-precision": precision?.toString(), "value-state": ui5State(valueState),
    required, disabled, readonly: readOnly, dir: rtl ? "rtl" : undefined,
  }, ...(valueStateMessage ? [h("span", { slot: "valueStateMessage" }, valueStateMessage)] : []))
  field.style.width = "100%"
  const frame = h("div", { dir: rtl ? "rtl" : undefined }, field)
  frame.style.width = FIELD_WIDTH
  return frame
})
