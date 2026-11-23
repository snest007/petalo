import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { Button } from "@/components/ui/button"
import { SelectDialog, type SelectDialogProps } from "@/components/ui/select-dialog"
import { dialogItems } from "../../src/fixtures/select-dialog.cases"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "select-dialog", component: SelectDialog })
const meta = {
  ...base,
  args: { items: dialogItems, headerText: "Select status", open: false, selectionMode: "single", showClearButton: false },
  argTypes: {
    ...base.argTypes,
    open: { control: "boolean" },
    selectionMode: { control: "select", options: ["single", "multiple"] },
    showClearButton: { control: "boolean" },
  },
  render: function SelectStatus(args: SelectDialogProps) {
    const [, update] = useArgs<SelectDialogProps>()
    return <><Button onClick={() => update({ open: true })}>Choose a status</Button>
      <SelectDialog {...args} onOpenChange={open => update({ open })} /></>
  },
} satisfies Meta<typeof SelectDialog>
export default meta
type Story = StoryObj<typeof meta>
const inlineDocs = { docs: { story: { inline: false, height: "480px" } } }
export const Playground: Story = {}
export const Single: Story = { args: { open: true }, parameters: inlineDocs }
export const Multiple: Story = { args: { open: true, selectionMode: "multiple", showClearButton: true, defaultValue: ["open"] }, parameters: inlineDocs }
export const RTL: Story = { ...Multiple, globals: { dir: "rtl" } }
export const Customise: Story = { args: { open: true, renderItem: ({ item, defaultContent }) => <span className={item.value === "open" ? "font-semibold" : undefined}>{defaultContent}</span> }, parameters: inlineDocs }
