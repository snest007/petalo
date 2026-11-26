import { ActionSheet, type ActionSheetProps } from "@/components/ui/action-sheet"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import { copy, document as documentIcon } from "@/lib/fiori-icons"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { defineFixtures, readPageOptions } from "../fixture-types"
import { inPlace } from "./popover"
import { sheetActions, sheetCases, type SheetCase } from "./action-sheet.cases"

const localizedTexts = { "de-DE": de, "zh-CN": zh, "ar-EG": ar }
const icons = { copy, document: documentIcon }
export const actions = sheetActions.map(action => ({ ...action, icon: "icon" in action ? icons[action.icon] : undefined }))
export const hostileTriggerProps = {
  role: "link", tabIndex: 9, id: "foreign-trigger", "aria-hidden": true, "aria-haspopup": "menu",
  "aria-controls": "foreign-popup", "aria-expanded": false, className: "hidden",
} as NonNullable<ActionSheetProps["triggerProps"]>

export default defineFixtures<SheetCase>({
  ...sheetCases,
  cases: [...sheetCases.cases],
  a11yDiffGroups: [{
    "cases": ["action-sheet-default", "action-sheet-customise", "action-sheet-without-cancel", "action-sheet-without-title", "action-sheet-long-title"],
    "diff": {
      "ignore": ["/ours/ax/0", "/ax/0/properties/focusable"],
      "ui5FocusScaffolding": ["/ui5/ax/0", "/ui5/ax/0/children/0/children/0", "/ui5/ax/0/children/0/children/2"],
      "ui5FormHosts": ["/ui5/ax/0/children/0/children/1/children/0", "/ui5/ax/0/children/0/children/1/children/1", "/ui5/ax/0/children/0/children/1/children/2"],
      "reason": "The pinned desktop PopupTemplate.js uses a focusable custom-element shell and two focus guards. Radix instead focuses the dialog root when no action can receive focus. The exact Button.js form-associated hosts duplicate the inner buttons' default validity. The dialog, application and all owned actions stay in the comparison."
    }
  }],
  react: ({ custom, hideCancel, headerText }) => {
    const { locale, dir } = readPageOptions()
    const sheet = <div className={`${inPlace} w-[20rem] [&_.fiori-popover-arrow]:hidden`}>
      <ActionSheet trigger="Actions" triggerProps={custom ? hostileTriggerProps : { className: "hidden" }}
        classNames={{ root: "w-full", surface: "w-[18.5rem]", action: custom ? "action-sheet-custom-action" : undefined }}
        className={custom ? "action-sheet-custom-root" : undefined}
        actions={actions} headerText={headerText} hideCancelButton={hideCancel} open portal={false} preventInitialFocus />
    </div>
    return locale && Object.hasOwn(localizedTexts, locale)
      ? <FioriLocaleProvider locale={locale} dir={dir} texts={localizedTexts[locale as keyof typeof localizedTexts]}>{sheet}</FioriLocaleProvider>
      : sheet
  },
})
