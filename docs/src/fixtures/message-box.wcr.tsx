import { MessageBox } from "@ui5/webcomponents-react/MessageBox"
import { defineFixtures } from "../fixture-types"
import { pinWcrPopup } from "./wcr-popup-in-place"
import { customActions, message, messageBoxCases } from "./message-box.cases"

export default defineFixtures({
  ...messageBoxCases,
  react: ({ type, explicitActions, rtl }) => <div style={{ overflow: "hidden", padding: ".75rem" }} dir={rtl ? "rtl" : undefined}>
    <MessageBox ref={pinWcrPopup} open={false} type={type} actions={explicitActions ? customActions : undefined}
      emphasizedAction={explicitActions ? "Delete" : undefined}>
      {message}
    </MessageBox>
  </div>,
})
