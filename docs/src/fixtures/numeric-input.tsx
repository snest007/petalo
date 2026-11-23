import { NumericInput, type NumericInputProps } from "@/components/ui/numeric-input"
import { defineFixtures, FIELD_WIDTH } from "../fixture-types"

type Props = Pick<NumericInputProps, "value" | "min" | "max" | "step" | "precision" | "disabled" | "readOnly" | "required" | "valueState" | "valueStateMessage"> & {
  rtl?: boolean; styled?: boolean
}

export default defineFixtures<Props>({
  name: "numeric-input",
  a11yDiffGroups: [
    {
      "cases": [
        "numeric-input-critical",
        "numeric-input-negative",
        "numeric-input-positive"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/0",
          "/ours/ax/0/children/0/children/0/children/0",
          "/ours/ax/0/children/0/children/0/children/0/children/1",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0"
        ],
        "reason": "NumericInputTemplate nests a form-associated Input with anonymous shadow and popup layout wrappers. The hosts repeat default validity and any disabled state. Compare the actual textbox, description relationship and all text."
      }
    },
    {
      "cases": [
        "numeric-input-customise",
        "numeric-input-decimal",
        "numeric-input-default",
        "numeric-input-required",
        "numeric-input-rtl"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/0",
          "/ours/ax/0/children/0/children/0/children/0",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0"
        ],
        "reason": "NumericInputTemplate nests a form-associated Input with anonymous shadow and popup layout wrappers. The hosts repeat default validity and any disabled state. Compare the actual textbox, description relationship and all text."
      }
    },
    {
      "cases": [
        "numeric-input-disabled",
        "numeric-input-readonly"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/0",
          "/ours/ax/0/children/0/children/0/children/0",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0"
        ],
        "reason": "NumericInputTemplate nests a form-associated Input with anonymous shadow and popup layout wrappers. The hosts repeat default validity and any disabled state. Compare the actual textbox, description relationship and all text."
      }
    },
    {
      "cases": [
        "numeric-input-information"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/0",
          "/ours/ax/0/children/0/children/0/children/0",
          "/ours/ax/0/children/0/children/0/children/0/children/1",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0"
        ],
        "numericInputMessage": { "state": "Value State Information", "message": "Estimated quantity" },
        "reason": "NumericInputTemplate nests a form-associated Input with anonymous shadow and popup layout wrappers. The hosts repeat default validity and any disabled state. Compare the actual textbox, description relationship and all text. NumericInputTemplate forwards a slot to Input; Input.ariaValueStateHiddenText reads that slot’s empty textContent instead of its assigned message. The React textbox keeps the consumer’s description."
      }
    }
  ],
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
