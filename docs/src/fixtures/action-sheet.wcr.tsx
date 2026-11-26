import "@ui5/webcomponents-icons/dist/copy.js"
import "@ui5/webcomponents-icons/dist/document.js"

import { ActionSheet } from "@ui5/webcomponents-react/ActionSheet"
import { Button } from "@ui5/webcomponents-react/Button"
import { isPhone } from "@ui5/webcomponents-base/dist/Device.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type { ComponentRef } from "react"
import { defineFixtures } from "../fixture-types"
import { sheetActions, sheetCases, type SheetCase } from "./action-sheet.cases"
import { placeInPlace } from "./ui5-popup-in-place"

function pinSheet(host: ComponentRef<typeof ActionSheet> | null) {
  if (!host) return
  // Use the native renderer and its WCR styling. Keep the popup closed so it
  // cannot take focus or escape the fixture into the browser's top layer.
  if (!isPhone()) {
    placeInPlace(host)
    return
  }
  void renderFinished().then(() => {
    const dialog = host.shadowRoot?.querySelector<HTMLElement>("ui5-dialog")
    if (!dialog) throw new Error("ActionSheet's phone dialog did not render")
    placeInPlace(dialog)
    dialog.removeAttribute("popover")
  })
}

export default defineFixtures<SheetCase>({
  ...sheetCases,
  cases: [...sheetCases.cases],
  react: ({ hideCancel, headerText }) => <div style={{ overflow: "hidden", padding: ".75rem", width: "20rem", boxSizing: "border-box" }}>
    <ActionSheet ref={pinSheet} headerText={headerText} hideCancelButton={hideCancel}
      style={{ width: "100%" }} open={false}>
      {sheetActions.map(action => <Button key={action.id} disabled={"disabled" in action ? action.disabled : undefined}
        icon={"icon" in action ? action.icon : undefined}>{action.label}</Button>)}
    </ActionSheet>
  </div>,
})
