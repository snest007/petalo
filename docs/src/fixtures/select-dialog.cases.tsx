import type { FixtureCase } from "../fixture-types"

export const dialogItems = [
  { value: "open", text: "Open" },
  { value: "review", text: "In review" },
  { value: "closed", text: "Closed" },
]
type SelectDialogCase = { multiple?: boolean; selected?: boolean; empty?: boolean; custom?: boolean }
const cases: FixtureCase<SelectDialogCase>[] = [
  { id: "select-dialog-single", props: {} },
  { id: "select-dialog-multiple", props: { multiple: true } },
  { id: "select-dialog-selected", props: { multiple: true, selected: true } },
  { id: "select-dialog-custom", props: { multiple: true, custom: true } },
  { id: "select-dialog-empty", props: { empty: true } },
]

export const selectionCases = { name: "select-dialog", reference: "wcr" as const, cases }
export const fixtureFrame = { overflow: "hidden", padding: "0.75rem" }
export const fixtureSurface = { width: "25rem" }
