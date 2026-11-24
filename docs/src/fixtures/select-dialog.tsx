import { SelectDialog } from "@/components/ui/select-dialog"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { defineFixtures, readPageOptions } from "../fixture-types"
import { dialogItems, fixtureFrame, fixtureSurface, selectionCases } from "./select-dialog.cases"

const localizedTexts = { "de-DE": de, "zh-CN": zh, "ar-EG": ar }

export default defineFixtures({
  ...selectionCases,
  a11yDiffGroups: [
    {
      "cases": [
        "select-dialog-single"
      ],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": {
          "kind": "dialog",
          "name": "Select status"
        },
        "selectDialogShape": "single",
        "reason": "Pinned WCR Dialog exposes PopupTemplate's exact closed host and focus guards. The SelectDialog fixture shape verifies the empty announcement outlets, form hosts and search-tooltip representation. All owned roles, text, relationships and interactive descendants remain compared."
      }
    },
    {
      "cases": [
        "select-dialog-multiple",
        "select-dialog-custom"
      ],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": {
          "kind": "dialog",
          "name": "Select status"
        },
        "selectDialogShape": "multiple",
        "reason": "Pinned WCR Dialog exposes PopupTemplate's exact closed host and focus guards. The SelectDialog fixture shape verifies the empty announcement outlets, form hosts and search-tooltip representation. All owned roles, text, relationships and interactive descendants remain compared."
      }
    },
    {
      "cases": [
        "select-dialog-selected"
      ],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": {
          "kind": "dialog",
          "name": "Select status"
        },
        "selectDialogShape": "selected",
        "reason": "Pinned WCR Dialog exposes PopupTemplate's exact closed host and focus guards. The SelectDialog fixture shape verifies the empty announcement outlets, form hosts and search-tooltip representation. All owned roles, text, relationships and interactive descendants remain compared."
      }
    },
    {
      "cases": [
        "select-dialog-empty"
      ],
      "diff": {
        "ignore": [],
        "pinnedPopupShell": {
          "kind": "dialog",
          "name": "Select status"
        },
        "selectDialogShape": "empty",
        "reason": "Pinned WCR Dialog exposes PopupTemplate's exact closed host and focus guards. The SelectDialog fixture shape verifies the empty announcement outlets, form hosts and search-tooltip representation. All owned roles, text, relationships and interactive descendants remain compared."
      }
    }
  ],
  react: ({ multiple, selected, empty, custom }) => {
    const locale = readPageOptions().locale
    const dialog = <div style={fixtureFrame}>
      <SelectDialog open portal={false} style={fixtureSurface} headerText="Select status"
        items={empty ? [] : dialogItems} selectionMode={multiple ? "multiple" : "single"}
        showClearButton={multiple} headerTextAlignCenter={multiple} defaultValue={selected ? ["open"] : undefined}
        classNames={{ item: "text-start" }} renderItem={({ defaultContent }) => defaultContent}
        getItemProps={custom ? () => ({ role: "button", id: "foreign", tabIndex: 13, "aria-selected": true }) : undefined} />
    </div>
    if (!locale || !Object.hasOwn(localizedTexts, locale)) return dialog
    return <FioriLocaleProvider locale={locale} texts={localizedTexts[locale as keyof typeof localizedTexts]}>{dialog}</FioriLocaleProvider>
  },
})
