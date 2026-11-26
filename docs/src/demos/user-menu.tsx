import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { UserSettingsDialog } from "@/components/ui/user-settings-dialog"
import { UserMenu, UserMenuItem } from "@/components/ui/user-menu"
import { actionSettings, globe, sysHelp } from "@/lib/fiori-icons"

import { fixedSettings, settingsItems } from "../fixtures/user-settings-dialog"
import { settingsHeader } from "../fixtures/user-settings-dialog.cases"
import { defineDemo } from "./types"

function UserMenuDemo() {
  const [open, setOpen] = React.useState(false)
  const [opener, setOpener] = React.useState<HTMLElement | null>(null)
  const [last, setLast] = React.useState("none")
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  return (
    <div className="flex items-center gap-3">
      <Avatar
        id="user-menu-demo-open"
        interactive
        size="XS"
        initials="JD"
        accessibleName="John Doe"
        onClick={(e) => {
          setOpener(e.currentTarget)
          setOpen((o) => !o)
        }}
      />
      <UserMenu
        id="user-menu-demo"
        open={open}
        onOpenChange={setOpen}
        opener={opener}
        account={{ titleText: "John Doe", subtitleText: "john.doe@example.com", avatarInitials: "JD" }}
        showManageAccount
        onManageAccountClick={() => setLast("manage")}
        onSignOutClick={() => setLast("sign out")}
        onItemClick={(v) => { setLast(v); if (v === "settings") setSettingsOpen(true) }}
      >
        <UserMenuItem value="settings" icon={actionSettings}>Settings</UserMenuItem>
        <UserMenuItem value="language" icon={globe} additionalText="English">Language</UserMenuItem>
        <UserMenuItem value="help" icon={sysHelp}>Help</UserMenuItem>
      </UserMenu>
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} opener={opener}
        headerText={settingsHeader} items={settingsItems} fixedItems={fixedSettings} showSearchField />
      <span id="user-menu-demo-last" className="text-(--sapContent_LabelColor)">{`Last action: ${last}`}</span>
    </div>
  )
}

export default defineDemo({
  category: "Overlays",
  docs: [{
    name: "user-menu",
    description: "An anchored account menu with profile details, actions and sign out.",
    props: [
      { name: "UserMenu.open / UserMenu.onOpenChange", type: "boolean / (open: boolean) => void", description: "Control account-menu visibility." },
      { name: "UserMenu.opener", type: "HTMLElement | null", description: "Element used to anchor the menu." },
      { name: "UserMenu.account", type: "UserMenuAccount", description: "Avatar and account details." },
      { name: "UserMenu.showManageAccount", type: "boolean", description: "Show the manage-account action." },
      { name: "UserMenu.onItemClick", type: "(value: string, event: { preventDefault: () => void }) => void", description: "Receive item activation; preventDefault keeps the menu open." },
      { name: "UserMenu.onSignOutClick", type: "(event: { preventDefault: () => void }) => void", description: "Handle sign out; preventDefault keeps the menu open." },
      { name: "UserMenu.footer", type: "ReactNode", description: "Replace the sign-out footer; null hides it." },
    ],
  }],
  title: "User Menu", order: 62, Demo: UserMenuDemo })
