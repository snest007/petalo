import type { Meta, StoryObj } from "@storybook/react-vite"
import { DynamicDateRange, type DynamicDateRangeProps } from "@/components/ui/dynamic-date-range"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "dynamic-date-range", component: DynamicDateRange })
const meta = {
  ...base,
  args: { "aria-label": "Period", defaultOpen: false },
  argTypes: { ...base.argTypes, defaultOpen: { control: "boolean" } },
} satisfies Meta<DynamicDateRangeProps>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Today: Story = { args: { defaultValue: { operator: "TODAY" } } }
export const Relative: Story = { args: { defaultValue: { operator: "LASTMONTHS", values: [3] } } }
export const Options: Story = { args: { defaultOpen: true }, parameters: { docs: { story: { inline: false, height: "700px" } } } }
export const RTL: Story = { ...Options, globals: { dir: "rtl" } }
export const Customise: Story = {
  args: {
    options: ["TODAY", "DATA_AVAILABLE_SINCE"],
    defaultValue: { operator: "DATA_AVAILABLE_SINCE" },
    customOptions: {
      DATA_AVAILABLE_SINCE: {
        label: "All available dates",
        format: () => "All available dates",
        parse: text => text === "All available dates" ? [] : undefined,
        toDates: (_, { now }) => [new Date(2024, 0, 1), now],
      },
    },
    classNames: { field: "tabular-nums" },
  },
}
