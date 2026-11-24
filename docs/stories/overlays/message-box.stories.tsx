import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { Button } from "@/components/ui/button"
import { MessageBox, type MessageBoxProps } from "@/components/ui/message-box"
import { fioriMeta } from "../_lib/meta"

const meta = {
  ...fioriMeta({ name: "message-box", component: MessageBox }),
  args: { open: false, type: "Confirm", children: "Submit this order for approval?" },
  argTypes: {
    open: { control: "boolean" },
    type: { control: "select", options: ["Confirm", "Error", "Information", "Success", "Warning"] },
  },
  render: function MessageBoxStory(args: MessageBoxProps) {
    const [, updateArgs] = useArgs<MessageBoxProps>()
    return <>
      <Button onClick={() => updateArgs({ open: true })}>Show message</Button>
      <MessageBox {...args} onOpenChange={(open) => updateArgs({ open })} />
    </>
  },
} satisfies Meta<MessageBoxProps>
export default meta
type Story = StoryObj<typeof meta>
const iframe = { docs: { story: { inline: false, height: "400px" } } }
export const Playground: Story = {}
export const Confirm: Story = { args: { open: true }, parameters: iframe }
export const Error: Story = { args: { open: true, type: "Error" }, parameters: iframe }
export const Information: Story = { args: { open: true, type: "Information" }, parameters: iframe }
export const Success: Story = { args: { open: true, type: "Success" }, parameters: iframe }
export const Warning: Story = { args: { open: true, type: "Warning" }, parameters: iframe }
export const Customise: Story = {
  args: { open: true, initialFocus: "Cancel", actions: ["Delete", "Cancel"], emphasizedAction: "Delete",
    classNames: { body: "break-words" }, children: <>Delete draft <strong>4711</strong>?</> },
  parameters: iframe,
}
export const RTL: Story = { ...Customise, globals: { dir: "rtl" } }
