import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { NavigationMenu, NavigationMenuItem, type NavigationMenuProps } from "@/components/ui/navigation-menu"
import { Tag } from "@/components/ui/tag"
import { home } from "@/lib/fiori-icons"
import { fioriMeta } from "../_lib/meta"

function Destinations() {
  return <>
    <NavigationMenuItem text="Home" icon={home} href="#navigation-menu-home" tag={<Tag>New</Tag>} />
    <NavigationMenuItem text="Workspace">
      <NavigationMenuItem text="Settings" href="#navigation-menu-settings" />
      <NavigationMenuItem text="Reporting" href="#navigation-menu-reporting" />
    </NavigationMenuItem>
    <NavigationMenuItem text="Help" href="about:blank" target="_blank" design="action" />
    <NavigationMenuItem text="Archive" href="#navigation-menu-archive" disabled />
  </>
}

const meta = {
  ...fioriMeta({ name: "navigation-menu", component: NavigationMenu }),
  args: { trigger: "Navigate" },
  render: (args) => <NavigationMenu {...args}><Destinations /></NavigationMenu>,
} satisfies Meta<NavigationMenuProps>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Navigate" }))
    await expect(within(canvasElement.ownerDocument.body).getByRole("dialog", { name: "Additional Navigation Items" })).toBeVisible()
  },
}
export const Customise: Story = {
  render: function Controlled(args) {
    const [open, setOpen] = React.useState(false)
    return <NavigationMenu {...args} open={open} onOpenChange={setOpen} classNames={{ item: "outline-offset-2" }}>
      <Destinations />
    </NavigationMenu>
  },
}
export const RTL: Story = { globals: { dir: "rtl" } }
