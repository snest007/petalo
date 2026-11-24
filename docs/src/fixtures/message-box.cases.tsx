import type { FixtureSet } from "../fixture-types"

const types = ["Confirm", "Error", "Information", "Success", "Warning"] as const
export const message = "Review this order before continuing."
type Case = { type: typeof types[number]; explicitActions?: boolean; rtl?: boolean; custom?: boolean }
export const messageBoxCases: Pick<FixtureSet<Case>, "name" | "reference" | "cases"> = {
  name: "message-box",
  reference: "wcr",
  cases: [
    ...types.map((type) => ({ id: `message-box-${type.toLowerCase()}`, props: { type } })),
    { id: "message-box-custom-rtl", props: { type: "Warning", explicitActions: true, rtl: true, custom: true } },
  ],
}
export const customActions = ["Delete", "Cancel", "Retry"]
