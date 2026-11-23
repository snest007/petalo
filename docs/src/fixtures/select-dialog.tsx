import { SelectDialog } from "@/components/ui/select-dialog"
import { defineFixtures } from "../fixture-types"
import { dialogItems, fixtureFrame, fixtureSurface, selectionCases } from "./select-dialog.cases"

export default defineFixtures({
  ...selectionCases,
  a11yDiffGroups: [
    {
      "cases": ["select-dialog-single", "select-dialog-multiple", "select-dialog-selected", "select-dialog-custom", "select-dialog-empty"],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": { "kind": "dialog", "name": "Select status" },
        "reason": "Like the SplitButton menu fixture, pinning the closed WCR Dialog keeps PopupTemplate's focusable group, closed block layer and sentinels in CDP. Verify those exact nodes, then compare the named modal surface and its complete content."
      }
    }
  ],
  react: ({ multiple, selected, empty, custom }) => <div style={fixtureFrame}>
    <SelectDialog open portal={false} style={fixtureSurface} headerText="Select status"
      items={empty ? [] : dialogItems} selectionMode={multiple ? "multiple" : "single"}
      showClearButton={multiple} headerTextAlignCenter={multiple} defaultValue={selected ? ["open"] : undefined}
      classNames={{ item: "text-start" }} renderItem={({ defaultContent }) => defaultContent}
      getItemProps={custom ? () => ({ role: "button", id: "foreign", tabIndex: 13, "aria-selected": true }) : undefined} />
  </div>,
})
