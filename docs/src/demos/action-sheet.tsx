import * as React from "react"
import { ActionSheet } from "@/components/ui/action-sheet"
import { actions } from "../fixtures/action-sheet"
import { sheetHeader } from "../fixtures/action-sheet.cases"
import { defineDemo } from "./types"

function Demo() {
  const [lastAction, setLastAction] = React.useState("")
  return <div id="action-sheet-demo">
    <div className="flex items-center gap-2">
      <ActionSheet trigger="Actions" headerText={sheetHeader} actions={actions} onAction={action => setLastAction(action.label)} />
      <output aria-label="Last action">{lastAction}</output>
    </div>
    <section className="mt-4">
      <h3>Customise</h3>
      <p>Use <code>classNames</code> to style the surface and individual parts. Set <code>open</code> and <code>onOpenChange</code> to control visibility. The sheet keeps the action names, order and keyboard focus.</p>
    </section>
  </div>
}

export default defineDemo({
  category: "Overlays", title: "ActionSheet", order: 626,
  docs: [{
    name: "action-sheet", description: "Show a list of actions in a popover or a bottom sheet on phones.",
    props: [
      { name: "actions", type: "readonly ActionSheetAction[]", description: "Ordered actions with IDs, labels, optional icons and a disabled state." },
      { name: "headerText", type: "string", description: "Title displayed when the sheet opens on a phone." },
      { name: "onAction", type: "(action: ActionSheetAction, event: MouseEvent) => void", description: "Receive the action the user chose." },
    ],
  }],
  Demo,
})
