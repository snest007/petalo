import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { NumericInput, type NumericInputProps } from "@/components/ui/numeric-input"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "numeric-input", component: NumericInput })
const meta = {
  ...base,
  args: { value: 5, precision: 0, min: 0, max: 10000, step: 1, "aria-label": "Quantity", onValueChange: fn() },
  argTypes: {
    ...base.argTypes,
    value: { control: "number" },
    precision: { control: "number" },
    step: { control: "number" },
    min: { control: "number" },
    max: { control: "number" },
    valueState: { control: "select", options: ["none", "negative", "critical", "positive", "information"] },
  },
  render: function Quantity(args: NumericInputProps) {
    const [, updateArgs] = useArgs<NumericInputProps>()
    return <NumericInput {...args} onValueChange={value => { args.onValueChange?.(value); updateArgs({ value }) }} />
  },
} satisfies Meta<typeof NumericInput>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const German: Story = { globals: { locale: "de" }, args: { value: 1234.5, precision: 2, step: 0.25 } }
export const Chinese: Story = { globals: { locale: "zh" }, args: { value: 1234.5, precision: 2 } }
export const RTL: Story = { globals: { locale: "ar", dir: "rtl" }, args: { value: -1234.5, precision: 2 } }
export const CustomTexts: Story = { args: { valueState: "critical", texts: { warningState: "Check quantity", critical: "Quantity is estimated" } } }
export const Customise: Story = { args: { classNames: { input: "tabular-nums" } } }
