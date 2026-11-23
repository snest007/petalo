import * as React from "react"
import { Button } from "@/components/ui/button"
import { MessageBox, useMessageBox } from "@/components/ui/message-box"
import { defineDemo } from "./types"

function MessageBoxDemo() {
  const [open, setOpen] = React.useState(false)
  const [result, setResult] = React.useState("")
  const { show, box } = useMessageBox()
  return <div className="space-y-3">
    <Button onClick={() => setOpen(true)}>Review order</Button>
    <MessageBox open={open} onOpenChange={setOpen} type="Confirm" initialFocus="Cancel"
      onClose={(action) => setResult(action ?? "Dismissed")}>
      Submit this order for approval?
    </MessageBox>
    <section>
      <h3>Customise</h3>
      <p>Use the experimental <code>classNames</code> map to style the root, header, icon, title, body, text, footer and action. The box owns the alert dialog, region labels and action buttons. Pass message content as children.</p>
      <Button onClick={async () => {
        const action = await show({ type: "Warning", actions: ["Delete", "Cancel"], emphasizedAction: "Delete", initialFocus: "Cancel",
          children: <>Delete the draft <strong>Purchase request 4711</strong>?</>, classNames: { body: "break-words" } })
        setResult(action ?? "Dismissed")
      }}>Delete draft</Button>
      {box}
    </section>
    <output>{result}</output>
  </div>
}

export default defineDemo({
  title: "MessageBox", category: "Overlays", order: 125,
  docs: [{ name: "message-box", description: "A short modal message or confirmation with localized actions.",
    props: [
      { name: "type / actions / emphasizedAction", type: "MessageBoxType / string[] / string", description: "Select the semantic style, ordered actions and emphasized action." },
      { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open: boolean) => void", description: "Control visibility or let the box dismiss itself." },
      { name: "initialFocus / onClose", type: "string / (action?: string) => void", description: "Focus an action or descendant ID. Escape dismisses with undefined." },
      { name: "useMessageBox", type: "() => { show, box }", description: "Render box in the calling tree and await show(options) to receive the action." },
    ] }],
  Demo: MessageBoxDemo,
})
