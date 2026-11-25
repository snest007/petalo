import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { ActionSheet, type ActionSheetProps } from "@/components/ui/action-sheet"
import { actions } from "../../src/fixtures/action-sheet"
import { sheetHeader } from "../../src/fixtures/action-sheet.cases"
import { fioriMeta } from "../_lib/meta"

type Args = ActionSheetProps & { phone?: boolean }
const base = fioriMeta({ name: "action-sheet", component: ActionSheet })
const meta = {
  ...base,
  args: { trigger: "Actions", actions, headerText: sheetHeader, open: false, hideCancelButton: false },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, hideCancelButton: { control: "boolean" }, phone: { control: false, table: { disable: true } } },
  render: function Sheet({ phone, ...args }: Args) {
    const [, update] = useArgs<Args>()
    React.useLayoutEffect(() => {
      if (!phone) return
      const dataset = document.documentElement.dataset
      const previous = dataset.fioriDevice
      dataset.fioriDevice = "phone"
      return () => { if (previous === undefined) delete dataset.fioriDevice; else dataset.fioriDevice = previous }
    }, [phone])
    return <ActionSheet {...args} onOpenChange={open => update({ open })} />
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
const inlineDocs = { docs: { story: { inline: false, height: "360px" } } }
export const Playground: Story = {}
export const Open: Story = { args: { open: true }, parameters: inlineDocs }
export const Phone: Story = { args: { open: true, phone: true }, parameters: inlineDocs }
export const WithoutCancel: Story = { ...Phone, args: { ...Phone.args, hideCancelButton: true } }
export const RTL: Story = { ...Open, globals: { dir: "rtl" } }
export const Customise: Story = {
  args: { open: true, classNames: { surface: "min-w-60", action: "text-start" }, texts: { availableActions: "File commands" } },
  parameters: inlineDocs,
}
