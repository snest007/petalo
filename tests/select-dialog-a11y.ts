import { expect } from "@playwright/test"

export type SelectDialogFixtureShape = "single" | "multiple" | "selected" | "empty"

type AX = {
  role: string
  name: string
  description?: string
  properties: Record<string, unknown>
  children: AX[]
}

const emptyGeneric = (properties: AX["properties"] = {}): AX =>
  ({ role: "generic", name: "", properties, children: [] })

/** Compare one closed, pinned WCR SelectDialog. The DOM offsets below are for
 * SelectDialog/index.js's Header, List and Footer only. Validate duplicated
 * shadow-host defaults before removing the wrapper, retaining the actual
 * heading, searchbox, buttons, list and selection controls for comparison. */
export function reconcileSelectDialogFixture(
  ours: { ax: AX[]; snapshot: unknown[] },
  reference: { ax: AX[] },
  shape: SelectDialogFixtureShape,
) {
  const multi = shape === "multiple" || shape === "selected"
  const [oursDialog] = ours.ax
  const [nativeDialog] = reference.ax
  expect(oursDialog.children).toHaveLength(4)
  expect(nativeDialog.children).toHaveLength(3)
  // List's owned announcement portal mounts on React even in an in-place
  // fixture. Popup.js registers WCR's announcement spans only when opened.
  // The real open-dialog selection announcement lifecycle is exercised separately.
  expect(oursDialog.children.pop()).toEqual({
    ...emptyGeneric({ atomic: true, live: "polite", relevant: "additions text" }),
    role: "alert",
  })
  const snapshot = ours.snapshot[0] as { children: unknown[] }
  expect(snapshot.children).toHaveLength(4)
  expect(snapshot.children.pop()).toEqual({ role: "alert", states: [], children: [] })
  if (multi) expect(oursDialog.children[1].children.pop()).toEqual(
    emptyGeneric({ atomic: true, live: "polite", relevant: "additions text" }),
  )

  const [nativeHeader, nativeBody, nativeFooter] = nativeDialog.children
  const searchIndex = multi ? 2 : 1
  const inputHost = nativeHeader.children[searchIndex]
  const [inputRoot] = inputHost.children
  const [preContent, searchbox, trailingIcon] = inputRoot.children
  expect(inputHost).toEqual({ ...emptyGeneric({ invalid: "false" }), children: [inputRoot] })
  expect(inputRoot).toEqual({ ...emptyGeneric(), children: [preContent, searchbox, trailingIcon] })
  expect(preContent).toEqual(emptyGeneric())
  expect(searchbox).toMatchObject({
    role: "searchbox", name: "Search", properties: { invalid: "false", focusable: true, editable: "plaintext" },
  })
  // InputTemplate places a decorative WCR Icon in its own focus wrapper.
  // Chromium puts the host's literal title in its generic name and the same
  // tooltip on React's span in its description. Keep the exact text channel.
  const [nativeTooltip] = trailingIcon.children
  const reactTooltip = oursDialog.children[0].children[searchIndex].children[0].children[1].children[0]
  expect(nativeTooltip).toEqual({ ...emptyGeneric(), name: "Search" })
  expect(reactTooltip).toEqual({ ...emptyGeneric(), description: "Search" })
  nativeTooltip.name = ""
  nativeTooltip.description = "Search"
  inputRoot.children.shift()
  inputHost.properties = {}

  const unwrapControl = (host: AX, role: "checkbox" | "button", name: string) => {
    const [control] = host.children
    const state = role === "checkbox" ? { focusable: true, invalid: "false" } : { invalid: "false" }
    expect(host).toEqual({ ...emptyGeneric(state), children: [control] })
    expect(control).toMatchObject({ role, name, properties: { focusable: true } })
    if (role === "button") expect(control.properties.invalid).toBe("false")
    return control
  }
  // ListTemplate nests two unnamed wrappers between the host and the
  // focus area. Align the before/after sentinels at their exact paths before
  // E11 checks the remaining state-free structural differences.
  const listHost = nativeBody.children[shape === "selected" ? 1 : 0]
  const [listRoot] = listHost.children
  const [listWrapper] = listRoot.children
  const [scrollArea] = listWrapper.children
  expect(listRoot).toEqual({ ...emptyGeneric(), children: [listWrapper] })
  expect(listWrapper).toEqual({ ...emptyGeneric(), children: [scrollArea] })
  const [before, , list, after] = scrollArea.children
  if (shape !== "empty") {
    for (const sentinel of [before, after]) expect(sentinel).toEqual(emptyGeneric({ focusable: true }))
  }
  listHost.children[0] = scrollArea

  if (multi) {
    nativeHeader.children[1] = unwrapControl(nativeHeader.children[1], "button", "Clear")
    expect(list).toMatchObject({ role: "list", name: "Contains Multi-Selectable Items" })
    expect(list.children).toHaveLength(3)
    for (const item of list.children) {
      expect(item.role).toBe("listitem")
      item.children[0] = unwrapControl(item.children[0], "checkbox", "Multiple Selection Mode")
    }
    nativeFooter.children[0] = unwrapControl(nativeFooter.children[0], "button", "Select")
  }
  const cancelIndex = multi ? 1 : 0
  nativeFooter.children[cancelIndex] = unwrapControl(nativeFooter.children[cancelIndex], "button", "Cancel")
}
