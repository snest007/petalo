import * as React from "react"
import { Input, SuggestionItem, SuggestionItemGroup, type InputSuggestionPreview } from "@/components/ui/input"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import { Label } from "@/components/ui/label"
import { defineDemo } from "./types"

function InputSuggestionsDemo() {
  const [preview, setPreview] = React.useState("")
  const [selection, setSelection] = React.useState("")
  const label = (item: InputSuggestionPreview) => "text" in item ? item.text : item.headerText
  return <section className="max-w-sm space-y-3">
    <h3>Customise</h3>
    <p>The experimental <code>classNames</code> map styles the input, suggestion surface, groups and items. Use <code>renderContent</code> for noninteractive option content. Input owns option IDs, roles and selection.</p>
    <FioriLocaleProvider texts={{ LIST_ITEM_POSITION: (index, count) => `Matching city ${index} of ${count}` }}>
      <div>
        <Label htmlFor="input-suggestions-city">Shipping city</Label>
        <Input id="input-suggestions-city" showSuggestions filter="StartsWith" defaultValue=""
          classNames={{ additionalText: "tabular-nums" }}
          onSuggestionItemPreview={(item) => setPreview(label(item))}
          onSelectionChange={(item) => setSelection(item ? label(item) : "")}>
          <SuggestionItemGroup headerText="Europe">
            <SuggestionItem text="Berlin" additionalText="DE" />
            <SuggestionItem text="Bern" additionalText="CH"
              renderContent={({ defaultContent }) => <span className="flex flex-1 justify-between">{defaultContent}</span>} />
            <SuggestionItem text="Paris" additionalText="FR" />
          </SuggestionItemGroup>
        </Input>
      </div>
    </FioriLocaleProvider>
    <output data-slot="input-demo-preview">{preview}</output>
    <output data-slot="input-demo-selection">{selection}</output>
  </section>
}

export default defineDemo({
  title: "Input suggestions", category: "Forms", order: 21,
  docs: [{ name: "input", description: "Offer grouped suggestions for free-text entry.",
    props: [
      { name: "Input.showSuggestions / filter / noTypeahead", type: "boolean / InputSuggestionFilter / boolean", description: "Show suggestions and filter by prefix, word prefix or substring." },
      { name: "Input.onSelectionChange / onSuggestionItemPreview", type: "(item, detail) => void", description: "Observe selection and preview. The detail includes the source and displayed value." },
      { name: "Input.onValueChange", type: "(value: string) => void", description: "Update a controlled value from typing or an accepted suggestion." },
      { name: "Input.open / defaultOpen / onOpenChange", type: "boolean / boolean / (open: boolean) => void", description: "Control the suggestion surface or let typing and selection manage it." },
    ] }],
  Demo: () => <div id="input-suggestions-demo"><InputSuggestionsDemo /></div>,
})
