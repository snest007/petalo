import { expect } from "@playwright/test"

type AX = {
  role: string
  name: string
  description?: string
  properties: Record<string, unknown>
  children: AX[]
}
type Snapshot = { role: string; name?: string; text?: string; states: string[]; children: Snapshot[] }
type Capture = { ax: AX[]; snapshot: Snapshot[] }

const generic = (properties: AX["properties"] = {}, children: AX[] = []): AX =>
  ({ role: "generic", name: "", properties, children })

function at<Node extends { children: Node[] }>(roots: Node[], path: number[]) {
  const index = path.at(-1)!
  const siblings = path.slice(0, -1).reduce((nodes, position) => nodes[position].children, roots)
  return { node: siblings[index], siblings, index }
}

export function reconcileUserSettingsDialog(ours: Capture, ui5: Capture, id: string) {
  const fixture = /^user-settings-dialog-(general|account|appearance|search|empty|loading)$/.exec(id)?.[1]
  if (!fixture) throw new Error("Pinned settings shell requires an H13 fixture")
  const [actual] = ours.ax
  const [native] = ui5.ax
  const [content] = actual.children
  const [nativeContent] = native.children
  const [nativeSide] = nativeContent.children
  const [side] = content.children
  // The native generic side in UserSettingsDialogTemplate.js drops its role
  // description in AX. React assigns the group role that exposes it.
  expect(nativeSide).toEqual(generic({}, nativeSide.children))
  expect(side).toEqual({ ...generic({ roledescription: "User Settings Item" }, side.children), role: "group" })
  expect(side.children[0]).toMatchObject({ role: "heading", name: "Settings" })
  expect(nativeSide.children[0].children[0]).toMatchObject({ role: "heading", name: "Settings" })
  side.role = "generic"
  side.properties = {}
  const snapshotContent = ours.snapshot[0].children[0]
  const snapshotSide = snapshotContent.children[0]
  expect(snapshotSide).toEqual({ role: "group", states: [], children: snapshotSide.children })
  expect(snapshotSide.children[0]).toMatchObject({ role: "heading", name: "Settings" })
  snapshotContent.children.splice(0, 1, ...snapshotSide.children)

  if (fixture !== "empty") {
    const nativeLists = nativeSide.children.slice(fixture === "search" ? 2 : 1)
    expect(nativeLists).toHaveLength(2)
    for (const host of nativeLists) {
      // ListTemplate.js wraps the scroll area twice. The before/after
      // focus guards stay in the tree and compare at their equivalent depth.
      const [root] = host.children
      const [wrapper] = root.children
      const [scrollArea] = wrapper.children
      expect(host).toEqual(generic({}, [root]))
      expect(root).toEqual(generic({}, [wrapper]))
      expect(wrapper).toEqual(generic({}, [scrollArea]))
      expect(scrollArea.children).toHaveLength(4)
      expect(scrollArea.children[2]).toMatchObject({ role: "list", name: "Contains Selectable Items" })
      for (const index of [0, 3]) expect(scrollArea.children[index]).toEqual(generic({ focusable: true }))
      host.children[0] = scrollArea
    }
  }

  // The pinned Dialog never opens, so Popup.js has no native announcement
  // outlets. Assert the empty React outlets. The open-dialog tests exercise them.
  const outlets = fixture === "empty" ? 0 : fixture === "appearance" ? 3 : 2
  expect(actual.children).toHaveLength(2 + outlets)
  expect(ours.snapshot[0].children).toHaveLength(2 + outlets)
  for (let index = 0; index < outlets; index++) {
    expect(actual.children.pop()).toEqual({
      ...generic({ atomic: true, live: "polite", relevant: "additions text" }), role: "alert",
    })
    expect(ours.snapshot[0].children.pop()).toEqual({ role: "alert", states: [], children: [] })
  }

  const buttons: [string, number[]][] = fixture === "appearance"
    ? [["Save", [0, 1, 0, 0, 0, 0]], ["Cancel", [0, 1, 0, 1, 0, 0]]]
    : [["Close", [0, 1, 0, 0, 0]]]
  if (fixture === "account") buttons.push(["Manage Account", [0, 0, 1, 1, 4]])
  if (["general", "search", "empty"].includes(fixture)) buttons.push(["Change language", [0, 0, 1, 2, 0, 0, 0, 0]])
  for (const [name, path] of buttons) {
    const { node: host, siblings, index } = at(ui5.ax, path)
    const [button] = host.children
    // Button.js is form-associated. CDP reports invalid=false on both
    // the anonymous custom-element host and the real native button.
    expect(host).toEqual(generic({ invalid: "false" }, [button]))
    expect(button).toMatchObject({ role: "button", name, properties: { invalid: "false", focusable: true } })
    siblings[index] = button
  }

  if (fixture === "search" || fixture === "empty") {
    const searchOutlet = content.children.pop()
    expect(searchOutlet).toEqual(generic({ atomic: false, live: "polite", relevant: "additions text" }))
    const { node: host } = at(ui5.ax, [0, 0, 0, 1])
    const [root] = host.children
    const [before, input, ...icons] = root.children
    expect(host).toEqual(generic({ invalid: "false" }, [root]))
    expect(root).toEqual(generic({}, [before, input, ...icons]))
    expect(before).toEqual(generic())
    expect(input).toMatchObject({ role: "searchbox", name: "Search", properties: { invalid: "false", focusable: true } })
    // InputTemplate.js marks its slotted icon wrapper and clear decoration
    // tabindex=-1. Neither is a keyboard stop or an independent button.
    expect(icons).toEqual([generic({ focusable: true })])
    const { node: tooltip, siblings: actualHeader, index } = at(ours.ax, [0, 0, 0, 1, 1])
    expect(tooltip).toEqual({ ...generic(), description: "Search" })
    actualHeader.splice(index, 1)
    nativeSide.children[1] = input
  }

  if (["general", "search", "empty"].includes(fixture)) {
    // TabInStripTemplate.js points every tab at the one live panel. Verify
    // the inactive tab's duplicate; the selected tab's relation stays compared.
    const { node: tab } = at(ui5.ax, [0, 0, 1, 1, 0, 1])
    expect(tab).toMatchObject({ role: "tab", name: "Region", properties: { selected: false } })
    expect(tab.properties.controls).toEqual([{ role: "tabpanel", name: "Language", ignored: false, valid: true }])
    delete tab.properties.controls
  }

  if (fixture === "account") {
    // AvatarTemplate.js renders initials inside the already named image.
    // Verify the duplicate in the native capture and keep the image name.
    const { node: avatar } = at(ui5.ax, [0, 0, 1, 1, 0, 0])
    expect(avatar).toMatchObject({ role: "image", name: "Avatar MC" })
    expect(avatar.children).toEqual([{ ...generic(), role: "StaticText", name: "MC" }])
    avatar.children.pop()
    const { node: snapshot } = at(ui5.snapshot, [0, 0, 6])
    expect(snapshot).toMatchObject({ role: "img", name: "Avatar MC", text: "MC" })
    delete snapshot.text
  }

  if (fixture === "appearance") {
    const actualList = at(ours.ax, [0, 0, 3, 0, 2])
    const nativeList = at(ui5.ax, [0, 0, 1, 1, 1, 0, 0, 0, 2])
    for (const { node, siblings: scrollArea } of [actualList, nativeList]) {
      // ListTemplate.js and List both have these guards around the actual
      // list. Here the whole view nests at a different depth in each tree.
      expect(scrollArea).toHaveLength(4)
      expect(node).toMatchObject({ role: "list", name: "Contains Selectable Items" })
      expect(scrollArea.pop()).toEqual(generic({ focusable: true }))
      expect(scrollArea.shift()).toEqual(generic({ focusable: true }))
    }
  }

  if (fixture === "loading") {
    // BusyIndicatorTemplate.js has a named progressbar but no busy host state.
    // Preserve the React state and compare its contents as in the native tree.
    const { node: busy } = at(ours.ax, [0, 0, 2])
    expect(busy).toEqual(generic({ busy: 1 }, busy.children))
    busy.properties = {}
    const { node: progress } = at(ours.ax, [0, 0, 2, 0, 0])
    expect(progress).toMatchObject({ role: "progressbar", name: "Please wait", description: "Please wait" })
    delete progress.description
    const { node: nativeProgress, siblings } = at(ui5.ax, [0, 0, 1, 1, 0, 0, 0])
    // BusyIndicatorTemplate.js adds an empty tab redirect after its progressbar.
    expect(siblings).toEqual([nativeProgress, generic({ focusable: true })])
    expect(nativeProgress).toMatchObject({ role: "progressbar", name: "Please wait" })
    siblings.pop()
  }
}
