import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@/components/ui/button"
import { ButtonBadge } from "@/components/ui/button-badge"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "button-badge", component: ButtonBadge })
const meta = {
  ...base,
  args: { design: "OverlayText", text: "5" },
  argTypes: {
    ...base.argTypes,
    design: { control: "select", options: ["InlineText", "OverlayText", "AttentionDot"] },
    text: { control: "text" },
  },
  render: args => <Button badge={<ButtonBadge {...args} />}>Notifications</Button>,
} satisfies Meta<typeof ButtonBadge>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Inline: Story = { args: { design: "InlineText", text: "1" } }
export const Overlay: Story = { args: { text: "99+" } }
export const Attention: Story = { args: { design: "AttentionDot" } }
export const Empty: Story = { args: { text: "" } }
export const Disabled: Story = { render: args => <Button disabled badge={<ButtonBadge {...args} />}>Notifications</Button> }
export const RTL: Story = { globals: { dir: "rtl" } }
export const CustomTexts: Story = { args: { texts: { manyItems: count => `${count} new notifications` } } }
export const Customise: Story = { args: { classNames: { tag: "tabular-nums" } } }
