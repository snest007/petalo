import { Input, SuggestionItem } from "@/components/ui/input"
import { defineFixtures } from "../fixture-types"
import { suggestionData } from "../fixtures/input"

export default defineFixtures<{ rtl?: boolean }>({
  name: "input",
  a11yDiffGroups: [
    {
      "cases": [
        "input-suggestions-phone-rtl",
        "input-suggestions-phone"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/0/children/1",
          "/ours/ax/0/children/0/children/1/children/1",
          "/ours/ax/0/children/1/children/0",
          "/ui5/ax/0/children/1/children/0",
          "/ui5/ax/0/children/1/children/1/children/0",
          "/ui5/ax/0/children/1/children/1/children/0/children/0",
          "/ui5/ax/0/children/1/children/1/children/0/children/2",
          "/ui5/ax/0/children/2/children/0",
          "/ui5/ax/0/children/2/children/0/children/0",
          "/ui5/ax/0/children/2/children/0/children/0/children/0",
          "/ui5/ax/0/children/2/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/2/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/3/children/0/children/0/children/0",
          "/ui5/ax/0/children/3/children/1/children/0/children/0",
          "/ax/0/properties/focusable"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/1/children/1",
          "/ui5/ax/0/children/3/children/0",
          "/ui5/ax/0/children/3/children/1"
        ],
        "ui5FocusScaffolding": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/2/children/0/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/2/children/0/children/0/children/0/children/0/children/0/children/3",
          "/ui5/ax/0/children/4"
        ],
        "inputPhoneAlerts": true,
        "reason": "UI5's phone Popup exposes its covered opener, while the modal React surface hides it. Compare the active editor and its header, listbox, footer and actions. UI5's empty focus sentinels and empty global announcement outlets are popup infrastructure. React's dialog surface can receive fallback focus."
      }
    }
  ],
  cases: [
    { id: "input-suggestions-phone", props: {} },
    { id: "input-suggestions-phone-rtl", props: { rtl: true } },
  ],
  react: ({ rtl }) => <div dir={rtl ? "rtl" : undefined} style={{ width: 375, height: 667 }}>
    <Input aria-label="City" placeholder="City" showSuggestions defaultOpen defaultValue="Be" noTypeahead filter="StartsWith">
      {suggestionData.map((item) => <SuggestionItem key={item.text} {...item} />)}
    </Input>
  </div>,
})
