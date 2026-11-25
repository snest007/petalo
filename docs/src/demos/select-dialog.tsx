import * as React from "react"
import { Button } from "@/components/ui/button"
import { SelectDialog } from "@/components/ui/select-dialog"
import { dialogItems } from "../fixtures/select-dialog.cases"
import { defineDemo } from "./types"

function Demo() {
  const [open, setOpen] = React.useState<"single" | "multiple" | null>(null)
  const [selection, setSelection] = React.useState<readonly string[]>([])
  return <>
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setOpen("single")}>Choose one status</Button>
      <Button onClick={() => setOpen("multiple")}>Choose several statuses</Button>
      <output aria-label="Confirmed statuses">{dialogItems.filter(item => selection.includes(item.value)).map(item => item.text).join(", ")}</output>
    </div>
    <SelectDialog headerText="Select status" items={dialogItems} selectionMode={open ?? "single"}
      open={open !== null} onOpenChange={next => { if (!next) setOpen(null) }} onConfirm={setSelection}
      showClearButton={open === "multiple"} />
    <section className="mt-4">
      <h3>Customise</h3>
      <p>Use the experimental <code>classNames</code> for style overrides. <code>renderItem</code> can add a visual status cue inside the row. <code>getItemProps</code> accepts class, style and an observational click handler. The list retains row names, IDs, selection and keyboard focus.</p>
    </section>
  </>
}
export default defineDemo({
  category: "Overlays", title: "SelectDialog", order: 625,
  docs: [{
    name: "select-dialog", description: "Filter a list and confirm one or several items.",
    props: [
      { name: "items", type: "SelectDialogItem[]", description: "Options with stable values and text labels." },
      { name: "selectionMode", type: "'single' | 'multiple'", description: "Confirm on selection or use a separate Select action." },
      { name: "onSearch", type: "(query: string) => void", description: "Supply the results yourself when using a backend." },
      { name: "onConfirm", type: "(values: readonly string[]) => void", description: "Receive the values of the confirmed items." },
    ],
  }],
  Demo,
})
