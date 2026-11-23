import { placeInPlace } from "./ui5-popup-in-place"

/**
 * Use as the ref of a WCR MessageBox or Popover with open={false},
 * or pass its inner dialog/popover here if the wrapper owns the ref.
 * Keeping Popup.js out of the top layer also keeps its focus management from
 * disturbing other cases. UI5 still owns the surface styling and semantics.
 */
export function pinWcrPopup(popup: HTMLElement | null) {
  if (!popup) return
  if (popup.localName !== "ui5-dialog" && popup.localName !== "ui5-popover") {
    throw new Error(`Expected a WCR dialog or popover, received ${popup.localName}`)
  }
  placeInPlace(popup)
}
