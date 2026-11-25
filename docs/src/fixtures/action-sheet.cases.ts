// Inputs shared with the installed WCR reference.
export type SheetCase = { headerText?: string; custom?: boolean; hideCancel?: boolean }

export const sheetHeader = "File actions"
export const longSheetHeader = "Actions for archived documents and attachments in the quarterly compliance report for all registered accounts and pending regional approval workflows"

export const sheetCases = {
  name: "action-sheet",
  reference: "wcr",
  cases: [
    { id: "action-sheet-default", props: { headerText: sheetHeader } },
    { id: "action-sheet-customise", props: { headerText: sheetHeader, custom: true } },
    { id: "action-sheet-without-cancel", props: { headerText: sheetHeader, hideCancel: true } },
    { id: "action-sheet-without-title", props: {} },
    { id: "action-sheet-long-title", props: { headerText: longSheetHeader } },
  ],
} as const

export const sheetActions = [
  { id: "open", label: "Open file", icon: "document" },
  { id: "copy", label: "Make a copy", icon: "copy" },
  { id: "share", label: "Share file" },
  { id: "archive", label: "Archive file", disabled: true },
] as const
