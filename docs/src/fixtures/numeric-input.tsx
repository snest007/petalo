import { NumericInput, type NumericInputProps } from "@/components/ui/numeric-input"
import { defineFixtures, FIELD_WIDTH } from "../fixture-types"

type Props = Pick<NumericInputProps, "value" | "min" | "max" | "step" | "precision" | "disabled" | "readOnly" | "required" | "valueState" | "valueStateMessage"> & {
  rtl?: boolean; styled?: boolean
}

export default defineFixtures<Props>({
  name: "numeric-input",
  cases: [
    { id: "numeric-input-default", props: { value: 1234 } },
    { id: "numeric-input-decimal", props: { value: -1234.5, precision: 2 } },
    { id: "numeric-input-disabled", props: { value: 18, disabled: true } },
    { id: "numeric-input-readonly", props: { value: 18, readOnly: true } },
    { id: "numeric-input-required", props: { required: true, value: 18 } },
    { id: "numeric-input-negative", props: { value: 18, max: 10, valueState: "negative" } },
    { id: "numeric-input-critical", props: { value: 18, valueState: "critical" } },
    { id: "numeric-input-positive", props: { value: 18, valueState: "positive" } },
    { id: "numeric-input-information", props: { value: 18, valueState: "information", valueStateMessage: "Estimated quantity" } },
    { id: "numeric-input-rtl", props: { value: -1234.5, precision: 2, rtl: true } },
    { id: "numeric-input-customise", props: { value: 25, styled: true } },
  ],
  react: ({ rtl, styled, ...props }) => <div dir={rtl ? "rtl" : undefined} style={{ width: FIELD_WIDTH }}>
    <NumericInput {...(styled ? { role: "spinbutton", tabIndex: 7, "aria-invalid": true } : {})} {...props} aria-label="Order quantity" dir={rtl ? "rtl" : undefined} className="w-full"
      classNames={styled ? { field: "quantity-field", input: "quantity-input" } : undefined} />
  </div>,
})
