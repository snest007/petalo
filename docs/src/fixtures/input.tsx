import * as React from "react"
import { Input, SuggestionItem, SuggestionItemGroup, type ValueState } from "@/components/ui/input"

import { defineFixtures } from "../fixture-types"

type Props = { suggestions?: "closed" | "open" | "grouped" | "filtered" | "state"; rtl?: boolean; value?: string; placeholder?: string; valueState?: ValueState; disabled?: boolean; readOnly?: boolean; a11y?: "name" | "name-ref" | "description" | "description-ref" }
export const suggestionData = [
  { text: "Berlin", additionalText: "DE" },
  { text: "Bern", additionalText: "CH" },
  { text: "Paris", additionalText: "FR" },
]

function SuggestionsFixture({ suggestions, rtl }: Props) {
  const frame = React.useRef<HTMLDivElement>(null)
  const open = suggestions !== "closed"
  React.useLayoutEffect(() => {
    const popup = frame.current?.querySelector<HTMLElement>("[data-slot=input-suggestion-popup]")
    if (!popup) return
    const reserve = () => frame.current?.style.setProperty("padding-bottom",
      `calc(.75rem + ${popup.offsetHeight}px)`)
    const observer = new ResizeObserver(reserve)
    observer.observe(popup)
    reserve()
    return () => observer.disconnect()
  }, [])
  const items = suggestionData.map((item) => <SuggestionItem key={item.text} {...item}
    renderContent={suggestions === "grouped" ? ({ defaultContent }) => defaultContent : undefined} />)
  return <div ref={frame} dir={rtl ? "rtl" : undefined} className="overflow-hidden p-3 w-[14.625rem]">
    <Input showSuggestions open={open} defaultValue={suggestions === "filtered" ? "Be" : ""} noTypeahead
      filter={suggestions === "filtered" ? "StartsWith" : "None"}
      valueState={suggestions === "state" ? "negative" : "none"}
      classNames={{ popup: "[inset-block-start:calc(100%_+_var(--input-suggestion-border-bottom,0px))] [inset-block-end:auto] max-h-none" }}
      aria-label="City">
      {suggestions === "grouped" ? <SuggestionItemGroup headerText="Europe">{items}</SuggestionItemGroup> : items}
    </Input>
  </div>
}

const states = ["negative", "critical", "positive", "information"] as const

export default defineFixtures<Props>({
  name: "input",
  a11yDiffGroups: [
    {
      "cases": [
        "input-suggestions-closed"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/1",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0"
        ],
        "reason": "InputTemplate and PopupTemplate use generic shadow hosts, duplicate form validity on the outer custom element and add empty List/Popup focus sentinels. Compare the native textbox, live text, popup and each option after unwrapping those exact nodes."
      }
    },
    {
      "cases": [
        "input-suggestions-filtered",
        "input-suggestions-grouped-rtl",
        "input-suggestions-open"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/1",
          "/ours/ax/0/children/0/children/4/children/0",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0"
        ],
        "ui5FocusScaffolding": [
          "/ui5/ax/0/children/0/children/1",
          "/ui5/ax/0/children/0/children/1/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0/children/0/children/0/children/3",
          "/ui5/ax/0/children/0/children/1/children/0/children/2"
        ],
        "reason": "InputTemplate and PopupTemplate use generic shadow hosts, duplicate form validity on the outer custom element and add empty List/Popup focus sentinels. Compare the native textbox, live text, popup and each option after unwrapping those exact nodes."
      }
    },
    {
      "cases": [
        "input-suggestions-state"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0",
          "/ours/ax/0/children/0",
          "/ours/ax/0/children/0/children/1",
          "/ours/ax/0/children/0/children/4",
          "/ours/ax/0/children/0/children/5/children/1",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/1/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0"
        ],
        "ui5FocusScaffolding": [
          "/ui5/ax/0/children/0/children/1",
          "/ui5/ax/0/children/0/children/1/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1/children/0/children/2/children/0/children/0/children/0/children/0/children/3",
          "/ui5/ax/0/children/0/children/1/children/0/children/3"
        ],
        "reason": "InputTemplate and PopupTemplate use generic shadow hosts, duplicate form validity on the outer custom element and add empty List/Popup focus sentinels. Compare the native textbox, live text, popup and each option after unwrapping those exact nodes."
      }
    }
  ],
  a11yDiff: {
    "input-a11y-description": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-a11y-description-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-a11y-name": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-a11y-name-ref": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0",
        "/ui5/ax/0/children/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-critical": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-disabled": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-empty": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-information": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-negative": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-positive": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-readonly": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ours/ax/0/children/0/children/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    },
    "input-value": {
      "ignore": [
        "/ours/ax/0",
        "/ours/ax/0/children/0",
        "/ui5/ax/0/children/0",
        "/ui5/ax/0/children/0/children/0"
      ],
      "reason": "React/DOM difference in input: these exact current-capture paths are unnamed, description-free, value-free generic wrappers with no properties. Unwrap only these wrappers and compare every descendant role, name, description, state and order."
    }
  },
  cases: [
    { id: "input-suggestions-closed", props: { suggestions: "closed" } },
    { id: "input-suggestions-open", props: { suggestions: "open" } },
    { id: "input-suggestions-grouped-rtl", props: { suggestions: "grouped", rtl: true } },
    { id: "input-suggestions-filtered", props: { suggestions: "filtered" } },
    { id: "input-suggestions-state", props: { suggestions: "state" } },
    { id: "input-empty", props: { placeholder: "Enter a name" } },
    { id: "input-value", props: { value: "SAP SE" } },
    ...(["name", "name-ref", "description", "description-ref"] as const).map((a11y) => ({ id: `input-a11y-${a11y}`, props: { value: "SAP SE", a11y } })),
    ...states.map((valueState) => ({ id: `input-${valueState}`, props: { value: "SAP SE", valueState } })),
    { id: "input-disabled", props: { value: "SAP SE", disabled: true } },
    { id: "input-readonly", props: { value: "SAP SE", readOnly: true } },
  ],
  react: ({ value, a11y, suggestions, rtl, ...p }) => {
    if (suggestions) return <SuggestionsFixture suggestions={suggestions} rtl={rtl} />
    const prefix = `input-a11y-${a11y}`
    return <div>
      {a11y && <span id={`${prefix}-label`} hidden>Supplier identifier</span>}
      {a11y && <span id={`${prefix}-description`} hidden>Use the supplier number</span>}
      <Input wrapperClassName="w-(--w)" defaultValue={value} valueStateMessage={null}
        aria-label={a11y === "name" ? "Supplier identifier" : "Input"}
        aria-labelledby={a11y === "name-ref" ? `${prefix}-label` : undefined}
        aria-description={a11y === "description" ? "Use the supplier number" : undefined}
        aria-describedby={a11y === "description-ref" ? `${prefix}-description` : undefined}
        {...p} />
    </div>
  },
})
