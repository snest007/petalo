import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Input, InputIcon, SuggestionItem, SuggestionItemGroup, type InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { search } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "input", component: Input })
const meta = {
  ...base,
  args: { value: "SAP SE", placeholder: "Enter a company", valueState: "none", disabled: false, readOnly: false, required: false, "aria-label": "Company", onChange: fn() },
  argTypes: {
    ...base.argTypes,
    value: { ...base.argTypes?.value, control: "text" },
    placeholder: { control: "text" },
    valueState: { ...base.argTypes?.valueState, control: "select", options: ["none", "negative", "critical", "positive", "information"] },
    valueStateMessage: { ...base.argTypes?.valueStateMessage, control: "text" },
    disabled: { control: "boolean" }, readOnly: { control: "boolean" }, required: { control: "boolean" },
    type: { control: "select", options: ["text", "search", "email", "password", "tel", "url"] },
    icon: { ...base.argTypes?.icon, control: false }, onChange: { ...base.argTypes?.onChange, control: false },
  },
  render: function ControlledInput(args: InputProps) {
    const [, updateArgs] = useArgs<InputProps>()
    return <Input {...args} onChange={(event) => { args.onChange?.(event); updateArgs({ value: event.target.value }) }} />
  },
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Empty: Story = { args: { value: "" } }
export const None: Story = { args: { valueState: "none" } }
export const Negative: Story = { args: { valueState: "negative" } }
export const Critical: Story = { args: { valueState: "critical" } }
export const Positive: Story = { args: { valueState: "positive" } }
export const Information: Story = { args: { valueState: "information" } }
export const Disabled: Story = { args: { disabled: true } }
export const ReadOnly: Story = { args: { readOnly: true } }
export const Required: Story = { args: { required: true } }
export const WithIcon: Story = { args: { type: "search", placeholder: "Search products", value: "", icon: <InputIcon><Icon icon={search} /></InputIcon> } }
export const LongText: Story = { args: { value: "Northwind Trading Company — International Procurement Division" } }
export const CustomTexts: Story = { args: { valueState: "negative", valueStateMessage: "Enter a registered company name." } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const LabelledField: Story = { render: function CompanyField() {
  const [value, setValue] = React.useState("")
  return <div className="grid max-w-md gap-2"><Label htmlFor="input-company" required showColon>Company</Label><Input id="input-company" required value={value} onChange={(event) => setValue(event.target.value)} placeholder="Company name" /></div>
} }

export const AccessibleDescription: Story = { args: { "aria-description": "Use the supplier number" } }
export const RTLAccessibleDescription: Story = { args: { "aria-description": "Use the supplier number" }, globals: { dir: "rtl" } }

export const Suggestions: Story = {
  render: () => <Input showSuggestions defaultOpen aria-label="City" defaultValue="Be" filter="StartsWith">
    <SuggestionItem text="Berlin" additionalText="DE" />
    <SuggestionItem text="Bern" additionalText="CH" />
  </Input>,
}
export const SuggestionsCustomise: Story = {
  render: () => <Input showSuggestions defaultOpen aria-label="Shipping city" classNames={{ additionalText: "tabular-nums" }}>
    <SuggestionItemGroup headerText="Europe">
      <SuggestionItem text="Berlin" additionalText="DE" renderContent={({ defaultContent }) => defaultContent} />
    </SuggestionItemGroup>
  </Input>,
}
export const SuggestionsRTL: Story = { ...SuggestionsCustomise, globals: { dir: "rtl" } }
export const SuggestionsValueState: Story = {
  render: () => <Input showSuggestions defaultOpen aria-label="City" defaultValue="Be" noTypeahead filter="StartsWith"
    valueState="negative" valueStateMessage="Check the shipping address.">
    <SuggestionItem text="Berlin" additionalText="DE" />
    <SuggestionItem text="Bern" additionalText="CH" />
  </Input>,
}
