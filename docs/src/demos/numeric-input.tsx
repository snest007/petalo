import { FioriLocaleProvider } from "@/lib/fiori-locale"
import { NumericInput } from "@/components/ui/numeric-input"
import { Label } from "@/components/ui/label"
import { defineDemo } from "./types"

export default defineDemo({
  category: "Forms", title: "NumericInput", order: 71,
  docs: [{
    name: "numeric-input", description: "Experimental (follows UI5). Edit localized numeric values with precision and range validation.",
    props: [
      { name: "value / defaultValue / onValueChange", type: "number / number / (value: number) => void", description: "A controlled or uncontrolled value, committed with Enter or on blur." },
      { name: "min / max / step / precision", type: "number", description: "Bounds, keyboard increment and required fractional digits." },
      { name: "locale", type: "string", description: "Override the locale for formatting and parsing." },
      { name: "valueState / defaultValueState / valueStateMessage", type: "ValueState / ValueState / string", description: "Control validation feedback and override its message." },
      { name: "classNames", type: "Partial<Record<NumericInputSlot, string>>", description: "Experimental styling of owned parts." },
    ],
  }],
  Demo: () => <div className="space-y-3">
    <div>
      <Label htmlFor="numeric-input-quantity">Order quantity</Label>
      <NumericInput id="numeric-input-quantity" defaultValue={5} min={0} max={10} />
    </div>
    <section>
      <h3>Customise</h3>
      <p>The experimental <code>classNames</code> map styles the root, field, input, message, message icon and description. The native input owns its role and validation relationships.</p>
      <FioriLocaleProvider locale="de-DE">
        <Label htmlFor="numeric-input-unit-price">Unit price</Label>
        <NumericInput id="numeric-input-unit-price" defaultValue={1234.5} precision={2} step={0.25}
          classNames={{ input: "tabular-nums" }} />
      </FioriLocaleProvider>
    </section>
  </div>,
})
