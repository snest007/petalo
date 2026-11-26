import * as React from "react"
import { Button } from "@/components/ui/button"
import { UserSettingsDialog } from "@/components/ui/user-settings-dialog"
import { fixedSettings, settingsItems } from "../fixtures/user-settings-dialog"
import { settingsHeader } from "../fixtures/user-settings-dialog.cases"
import { defineDemo } from "./types"

function Demo() {
  const [open, setOpen] = React.useState(false)
  const opener = React.useRef<HTMLButtonElement>(null)
  return <div id="user-settings-dialog-demo">
    <Button ref={opener} onClick={() => setOpen(true)}>Open user settings</Button>
    <UserSettingsDialog open={open} onOpenChange={setOpen} opener={opener.current} headerText={settingsHeader}
      items={settingsItems} fixedItems={fixedSettings} showSearchField />
    <section className="mt-4">
      <h3>Customise</h3>
      <p>Supply categories and their content as items. Use the experimental <code>classNames</code> to style parts, and <code>texts</code> to override the dialog labels and search announcements.</p>
    </section>
  </div>
}
export default defineDemo({
  title: "UserSettingsDialog", category: "Overlays", order: 64,
  docs: [{
    name: "user-settings-dialog", description: "Navigate between account and preference views in a responsive dialog.",
    props: [
      { name: "items / fixedItems", type: "readonly UserSettingsItem[]", description: "Settings categories and their editable or read-only content." },
      { name: "value / onValueChange", type: "string / (id, item) => boolean | void", description: "Control the active category or reject a change." },
      { name: "saveMode", type: "boolean", description: "Expose Save and Cancel and let the application decide when to close." },
    ],
  }],
  Demo,
})
