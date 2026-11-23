import { SelectDialog } from "@/components/ui/select-dialog"
import { defineFixtures } from "../fixture-types"
import { dialogItems, fixtureFrame, fixtureSurface, selectionCases } from "./select-dialog.cases"

export default defineFixtures({
  ...selectionCases,
  react: ({ multiple, selected, empty, custom }) => <div style={fixtureFrame}>
    <SelectDialog open portal={false} style={fixtureSurface} headerText="Select status"
      items={empty ? [] : dialogItems} selectionMode={multiple ? "multiple" : "single"}
      showClearButton={multiple} headerTextAlignCenter={multiple} defaultValue={selected ? ["open"] : undefined}
      classNames={{ item: "text-start" }} renderItem={({ defaultContent }) => defaultContent}
      getItemProps={custom ? () => ({ role: "button", id: "foreign", tabIndex: 13, "aria-selected": true }) : undefined} />
  </div>,
})
