import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { SplitButton } from "@/components/ui/split-button"
import { MenuContent, MenuItem } from "@/components/ui/menu"
import { download } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "split-button", component: SplitButton })
const meta = {
  ...base,
  args: { children: "Export PDF", design: "default", disabled: false, activeArrowButton: false, onClick: fn(), onArrowClick: fn() },
  argTypes: {
    ...base.argTypes,
    children: { control: "text" },
    design: { control: "select", options: ["default", "emphasized", "transparent", "positive", "negative", "attention"] },
    activeArrowButton: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof SplitButton>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Emphasized: Story = { args: { design: "emphasized" } }
export const Positive: Story = { args: { design: "positive" } }
export const Negative: Story = { args: { design: "negative" } }
export const Attention: Story = { args: { design: "attention" } }
export const Transparent: Story = { args: { design: "transparent" } }
export const Disabled: Story = { args: { disabled: true } }
export const Active: Story = { args: { activeArrowButton: true } }
export const WithIcon: Story = { args: { icon: download } }
export const RTL: Story = { globals: { dir: "rtl" }, args: { icon: download } }
export const CustomTexts: Story = { args: { texts: { description: "Export actions", arrowLabel: "More formats" } } }
export const Customise: Story = { args: { classNames: { primary: "min-w-40" } } }
export const WithMenu: Story = {
  render: (args) => <SplitButton {...args} activeArrowButton={undefined} menu={
    <MenuContent aria-labelledby={undefined} aria-label="Export formats" headerText="Export formats">
      <MenuItem>Export spreadsheet</MenuItem>
      <MenuItem>Export CSV</MenuItem>
    </MenuContent>
  } />,
}
