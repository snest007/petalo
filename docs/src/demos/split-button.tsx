import * as React from "react"
import { SplitButton } from "@/components/ui/split-button"
import { MenuContent, MenuItem } from "@/components/ui/menu"
import { defineDemo } from "./types"

function ExportExample() {
  const [format, setFormat] = React.useState("")
  return <div className="space-y-3">
    <SplitButton design="emphasized" onClick={() => setFormat("PDF")} menu={
      <MenuContent aria-labelledby={undefined} aria-label="Export formats" headerText="Export formats">
        <MenuItem onSelect={() => setFormat("Spreadsheet")}>Export spreadsheet</MenuItem>
        <MenuItem onSelect={() => setFormat("CSV")}>Export CSV</MenuItem>
      </MenuContent>
    }>Export PDF</SplitButton>
    <output className="block">{format && `Selected: ${format}`}</output>
    <section>
      <h3>Customise</h3>
      <p>The experimental <code>classNames</code> map styles the root, primary action, arrow, label and both icons. The group owns the tab stop and the arrow exposes its menu state.</p>
      <SplitButton classNames={{ primary: "min-w-28" }} disabled>Export draft</SplitButton>
    </section>
  </div>
}
export default defineDemo({
  category: "Actions", title: "SplitButton", order: 11,
  docs: [{
    name: "split-button", description: "Run a primary action or choose a related action from the arrow.",
    props: [
      { name: "design", type: "default | emphasized | transparent | positive | negative | attention", description: "Appearance of both actions.", defaultValue: "default" },
      { name: "activeArrowButton / defaultActiveArrowButton / onActiveArrowButtonChange", type: "boolean / boolean / (active: boolean) => void", description: "Control or initialize the arrow's menu state." },
      { name: "onClick / onArrowClick", type: "(event) => void", description: "Primary and secondary activation handlers." },
      { name: "menu", type: "ReactNode", description: "Compose with MenuContent and MenuItem." },
      { name: "texts", type: "Partial<SplitButtonTexts>", description: "Override the group description, keyboard hint or arrow name." },
      { name: "classNames", type: "Partial<Record<SplitButtonSlot, string>>", description: "Experimental styling of owned parts." },
    ],
  }],
  Demo: ExportExample,
})
