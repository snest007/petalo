import { SelectDialog } from "@ui5/webcomponents-react/SelectDialog"
import { ListItemStandard } from "@ui5/webcomponents-react/ListItemStandard"
import { defineFixtures } from "../fixture-types"
import { dialogItems, fixtureFrame, fixtureSurface, selectionCases } from "./select-dialog.cases"
import { pinWcrPopup } from "./wcr-popup-in-place"

export default defineFixtures({
  ...selectionCases,
  react: ({ multiple, selected, empty }) => <div style={fixtureFrame}>
    <SelectDialog ref={pinWcrPopup} style={fixtureSurface} open={false} headerText="Select status"
      selectionMode={multiple ? "Multiple" : "Single"} showClearButton={multiple} headerTextAlignCenter={multiple}
      numberOfSelectedItems={selected ? 1 : undefined}>
      {!empty && dialogItems.map(item => <ListItemStandard key={item.value} selected={selected && item.value === "open"}>{item.text}</ListItemStandard>)}
    </SelectDialog>
  </div>,
})
