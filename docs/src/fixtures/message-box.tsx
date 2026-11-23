import { MessageBox } from "@/components/ui/message-box"
import { defineFixtures } from "../fixture-types"
import { customActions, message, messageBoxCases } from "./message-box.cases"

export default defineFixtures({
  ...messageBoxCases,
  a11yDiffGroups: [
    {
      "cases": [
        "message-box-confirm"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/1/children/0",
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/1/children/1/children/0",
          "/ui5/ax/0/children/1/children/2/children/0",
          "/ui5/ax/0/children/1/children/3/children/0/children/0/children/0",
          "/ui5/ax/0/children/1/children/3/children/1/children/0/children/0",
          "/ax/0/properties/focusable"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/1/children/3/children/0",
          "/ui5/ax/0/children/1/children/3/children/1"
        ],
        "ui5FocusScaffolding": [
          "/ui5/ax/0",
          "/ui5/ax/0/children/1/children/0",
          "/ui5/ax/0/children/1/children/4"
        ],
        "messageBoxNameRef": true,
        "reason": "PopupTemplate exposes anonymous shadow hosts and empty focus sentinels. The React Dialog surface owns fallback focus. Compare the heading, message, regions, and every native action and state. WCR resolves the title and message references into the same computed name before rendering its native dialog."
      }
    },
    {
      "cases": [
        "message-box-custom-rtl"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/1/children/0",
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/1/children/2/children/0",
          "/ui5/ax/0/children/1/children/3/children/0/children/0/children/0",
          "/ui5/ax/0/children/1/children/3/children/1/children/0/children/0",
          "/ui5/ax/0/children/1/children/3/children/2/children/0/children/0",
          "/ax/0/properties/focusable"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/1/children/3/children/0",
          "/ui5/ax/0/children/1/children/3/children/1",
          "/ui5/ax/0/children/1/children/3/children/2"
        ],
        "ui5FocusScaffolding": [
          "/ui5/ax/0",
          "/ui5/ax/0/children/1/children/0",
          "/ui5/ax/0/children/1/children/4"
        ],
        "reason": "PopupTemplate exposes anonymous shadow hosts and empty focus sentinels. The React Dialog surface owns fallback focus. Compare the heading, message, regions, and every native action and state."
      }
    },
    {
      "cases": [
        "message-box-error",
        "message-box-information",
        "message-box-success",
        "message-box-warning"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/1/children/0",
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/1/children/2/children/0",
          "/ui5/ax/0/children/1/children/3/children/0/children/0/children/0",
          "/ax/0/properties/focusable"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/1/children/3/children/0"
        ],
        "ui5FocusScaffolding": [
          "/ui5/ax/0",
          "/ui5/ax/0/children/1/children/0",
          "/ui5/ax/0/children/1/children/4"
        ],
        "reason": "PopupTemplate exposes anonymous shadow hosts and empty focus sentinels. The React Dialog surface owns fallback focus. Compare the heading, message, regions, and every native action and state."
      }
    }
  ],
  react: ({ type, explicitActions, rtl, custom }) => <div className="overflow-hidden p-3" dir={rtl ? "rtl" : undefined}>
    <MessageBox open portal={false} type={type} actions={explicitActions ? customActions : undefined}
      emphasizedAction={explicitActions ? "Delete" : undefined} classNames={custom ? { body: "message-box-neutral-custom" } : undefined}>
      {message}
    </MessageBox>
  </div>,
})
