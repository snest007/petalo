import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { Button } from "@/components/ui/button"
import { UserSettingsDialog, type UserSettingsDialogProps } from "@/components/ui/user-settings-dialog"
import { fixedSettings, settingsItems } from "../../src/fixtures/user-settings-dialog"
import { settingsHeader } from "../../src/fixtures/user-settings-dialog.cases"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "user-settings-dialog", component: UserSettingsDialog })
const meta = {
  ...base,
  args: { items: settingsItems, fixedItems: fixedSettings, headerText: settingsHeader, open: false, showSearchField: false, saveMode: false },
  argTypes: { ...base.argTypes, open: { control: "boolean" }, showSearchField: { control: "boolean" }, saveMode: { control: "boolean" } },
  render: function Settings(args: UserSettingsDialogProps) {
    const [, update] = useArgs<UserSettingsDialogProps>()
    return <><Button onClick={() => update({ open: true })}>Open settings</Button>
      <UserSettingsDialog {...args} onOpenChange={open => update({ open })}
        onCancel={() => update({ open: false })} onSave={() => update({ open: false })} /></>
  },
} satisfies Meta<UserSettingsDialogProps>
export default meta
type Story = StoryObj<typeof meta>
const inlineDocs = { docs: { story: { inline: false, height: "520px" } } }
export const Playground: Story = {}
export const Account: Story = { args: { open: true, defaultValue: "account" }, parameters: inlineDocs }
export const Appearance: Story = { args: { open: true, defaultValue: "appearance", saveMode: true }, parameters: inlineDocs }
export const Search: Story = { args: { open: true, showSearchField: true }, parameters: inlineDocs }
export const EmptySearch: Story = { ...Search, args: { ...Search.args, defaultQuery: "absent" } }
export const Loading: Story = {
  args: { open: true, items: settingsItems.map(item => item.id === "general" ? { ...item, loading: true } : item) },
  parameters: inlineDocs,
}
export const RTL: Story = { ...Search, globals: { dir: "rtl" } }
export const Customise: Story = {
  args: { open: true, defaultValue: "general", classNames: { paneHeader: "bg-(--sapPageHeader_Background)" }, texts: { name: "Preferences" } },
  parameters: inlineDocs,
}
