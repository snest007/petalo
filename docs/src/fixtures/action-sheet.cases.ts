// Inputs shared with the installed WCR reference.
export const sheetCases = {
  name: "action-sheet",
  reference: "wcr",
  cases: [
    { id: "action-sheet-default", props: {} },
    { id: "action-sheet-customise", props: { custom: true } },
    { id: "action-sheet-without-cancel", props: { hideCancel: true } },
  ],
} as const

export const sheetHeader = "File actions"
export const sheetActions = [
  { id: "open", label: "Open file", icon: "document" },
  { id: "copy", label: "Make a copy", icon: "copy" },
  { id: "share", label: "Share file" },
  { id: "archive", label: "Archive file", disabled: true },
] as const
