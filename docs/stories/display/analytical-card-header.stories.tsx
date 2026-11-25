import type { Meta, StoryObj } from "@storybook/react-vite"
import { AnalyticalCardHeader, NumericSideIndicator, type AnalyticalCardHeaderProps } from "@/components/ui/analytical-card-header"
import { Card } from "@/components/ui/card"
import { fioriMeta } from "../_lib/meta"

const meta = {
  ...fioriMeta({ name: "analytical-card-header", component: AnalyticalCardHeader }),
  args: { titleText: "Net revenue", titleTextLevel: 2, subtitleText: "Current quarter", unitOfMeasurement: "EUR",
    value: 1264.5, scale: "M", trend: "up", state: "positive" },
  argTypes: {
    titleText: { control: "text" }, subtitleText: { control: "text" }, value: { control: "number" },
    scale: { control: "text" }, trend: { control: "select", options: ["none", "up", "down"] },
    state: { control: "select", options: ["none", "neutral", "positive", "critical", "negative"] },
  },
  render: args => <Card accessibleName="Revenue overview" className="w-96 max-w-full">
    <AnalyticalCardHeader {...args}>
      <NumericSideIndicator titleText="Target" number={1300.25} unit="M" />
      <NumericSideIndicator titleText="Deviation" number={-2.75} unit="%" state="critical" />
    </AnalyticalCardHeader>
  </Card>,
} satisfies Meta<AnalyticalCardHeaderProps>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Downward: Story = { args: { value: -84.2, trend: "down", state: "negative" } }
export const Warning: Story = { args: { value: 91.8, trend: "none", state: "critical" } }
export const Neutral: Story = { args: { value: 0, trend: "none", state: "neutral" } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const Customise: Story = {
  args: { classNames: { value: "tabular-nums", description: "italic" }, description: "Compared with the previous quarter" },
}
