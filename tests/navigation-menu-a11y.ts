import { expect } from "@playwright/test"

type Node = {
  role: string
  name?: string
  description?: string
  text?: string
  states?: string[]
  properties?: Record<string, unknown>
  children: Node[]
}
type Capture = { ax: Node[]; snapshot: Node[] }

const ax = (role: string, name = "", properties = {}, children: Node[] = []): Node => ({ role, name, properties, children })
const label = (text: string) => ({ text, valid: true })
const generic = (children: Node[]): Node => ax("generic", "", {}, children)
const nodeText = (name: string) => ax("StaticText", name)
const sentinel = ax("generic", "", { focusable: true })

function childrenOf(node: Node, properties = {}) {
  expect(node).toEqual(ax("generic", "", properties, node?.children))
  return node.children
}

function separateRowContent(node: Node) {
  return node.role === "generic" ? childrenOf(node) : [node]
}

function nativeList(content: Node, wrapperCount: number) {
  let layout = content
  for (let i = 0; i < wrapperCount; i++) {
    const children = childrenOf(layout)
    expect(children).toHaveLength(1)
    layout = children[0]
  }
  const entries = childrenOf(layout)
  expect(entries).toHaveLength(3)
  const [start, list, end] = entries
  expect([start, end]).toEqual([sentinel, sentinel])
  expect(list).toEqual(ax("menu", "", { orientation: "vertical" }, list.children))
  return list
}

function reconcileRow(ours: Node, native: Node, actualSnapshot: Node, nativeSnapshot: Node, text: string, link: boolean) {
  const active = "Is Active"
  const name = `${text} ${active}`
  const tagged = text === "Home"
  const disabled = text === "Archive"
  const expanded = text === "Workspace" && ours.properties?.expanded === true
  if (link) expect(native).toEqual(ax("menuitem", name, { focusable: true }, native.children))
  const row = link ? native.children[0] : native
  expect(row.role).toBe("listitem")
  expect(row.name).toBe(name)
  expect(row.properties?.level).toBe(1)
  expect(row.properties?.describedby).toEqual(tagged ? [label(""), label("Tag New")] : [label("")])
  const nativeText = row.children.flatMap(separateRowContent)
  const actualText = ours.children.flatMap(separateRowContent)
  if (tagged) {
    // The redundant child text is hidden from the name computation. The
    // description target still resolves with its full text.
    expect(nativeText).toEqual([nodeText(text), nodeText("Tag"), nodeText("New"), nodeText(active)])
    expect(actualText).toEqual([nodeText(text), nodeText(active)])
    expect(row.description).toBe("Tag New")
    expect(ours.description).toBe("Tag New")
    expect(ours.properties!.describedby).toEqual([label("")])
    expect(row.properties!.labelledby).toEqual([label(text), label(active)])
    expect(ours.properties!.labelledby).toBeUndefined()
    delete row.properties!.labelledby
    row.properties!.describedby = [label("")]
  } else {
    delete row.properties!.describedby
    expect(actualText).toEqual(nativeText)
  }
  delete row.properties!.level
  if (expanded) {
    // Native MenuItemTemplate sets hasPopup/expanded but doesn't link the
    // composed popup. Verify our link resolves to the named submenu's menu.
    expect(row.properties!.hasPopup).toBe("menu")
    expect(row.properties!.expanded).toBe(true)
    expect(row.properties!.controls).toBeUndefined()
    expect(ours.properties!.controls).toEqual([{ role: "menu", name: "", ignored: false, valid: true }])
    row.properties!.controls = ours.properties!.controls
  }
  row.children = ours.children
  row.role = "menuitem"

  const snapshot = { role: "listitem", name, states: [], children: [], ...(tagged ? { text: "Home Tag New Is Active" } : {}) }
  if (link) {
    expect(nativeSnapshot).toEqual({ role: "menuitem", name, states: [], children: [snapshot] })
    nativeSnapshot.children = []
  } else {
    // Chromium's snapshot omits menu states while the native role is listitem.
    expect(nativeSnapshot).toEqual(snapshot)
    nativeSnapshot.role = "menuitem"
    if (disabled) {
      expect(row.properties!.disabled).toBe(true)
      nativeSnapshot.states = ["[disabled]"]
    }
    if (expanded) nativeSnapshot.states = ["[expanded]"]
  }
  expect(actualSnapshot).toEqual(nativeSnapshot)
  return row
}

function reconcileSubmenu(ours: Node, native: Node, actualSnapshot: Node, nativeSnapshot: Node) {
  const [actual] = childrenOf(ours)
  const [dialog] = childrenOf(native, { focusable: true })
  expect(actual).toEqual(ax("dialog", "Workspace", { focusable: true, modal: false }, actual.children))
  expect(dialog).toEqual(ax("dialog", "Workspace", { modal: true }, dialog.children))
  expect(actual.children).toHaveLength(1)
  expect(dialog.children).toHaveLength(3)
  const [start, content, end] = dialog.children
  expect([start, end]).toEqual([sentinel, sentinel])
  const [actualMenu] = actual.children
  const menu = nativeList(content, 4)
  const [referenceMenuSnapshot] = nativeSnapshot.children
  const [actualMenuSnapshot] = actualSnapshot.children
  expect(actualMenu).toEqual(ax("menu", "", { orientation: "vertical" }, actualMenu.children))
  for (const node of [menu, actualMenu, referenceMenuSnapshot, actualMenuSnapshot]) expect(node.children).toHaveLength(2)
  for (const [index, text] of ["Settings", "More"].entries()) {
    const [row] = childrenOf(menu.children[index])
    menu.children[index] = reconcileRow(actualMenu.children[index], row, actualMenuSnapshot.children[index], referenceMenuSnapshot.children[index], text, index === 0)
  }
  dialog.properties = actual.properties
  dialog.children = [menu]
  expect(actualSnapshot).toEqual(nativeSnapshot)
  return generic([dialog])
}

/** NavigationMenuItemTemplate leaves the native LI inside its anchor and
 * forces role none on a focusable LI. Popup.js adds aria-modal to nonmodal
 * popovers. Verify exact topology, property values and names on both sides. */
export function reconcileNavigationMenuFixture(ours: Capture, ui5: Capture, expanded: boolean) {
  const title = "Additional Navigation Items"
  expect(ours.ax).toHaveLength(1)
  expect(ui5.ax).toHaveLength(1)
  const [host] = childrenOf(ui5.ax[0])
  const nested = childrenOf(host, { focusable: true })
  expect(nested).toHaveLength(1)
  const [dialog] = nested
  expect(dialog).toEqual(ax("dialog", title, { modal: true }, dialog.children))
  expect(dialog.children).toHaveLength(4)
  const [start, heading, content, end] = dialog.children
  expect([start, end]).toEqual([sentinel, sentinel])
  expect(heading).toEqual(nodeText(title))
  const nativeMenu = nativeList(content, 3)

  const actualDialog = ours.ax[0]
  expect(actualDialog).toEqual(ax("dialog", title, { focusable: true, labelledby: [label(title)], modal: false }, actualDialog.children))
  // With the nested surface inline, the root layout wrapper is represented
  // as an extra unnamed AX generic around the root label and menu.
  if (expanded) expect(actualDialog.children).toHaveLength(1)
  const actualContent = expanded ? childrenOf(actualDialog.children[0]) : actualDialog.children
  expect(actualContent).toHaveLength(2)
  expect(separateRowContent(actualContent[0])).toEqual([heading])
  const actualMenu = actualContent[1]
  expect(actualMenu).toEqual(ax("menu", "", { orientation: "vertical" }, actualMenu.children))
  expect(actualMenu.children).toHaveLength(expanded ? 5 : 4)
  expect(nativeMenu.children).toHaveLength(4)

  const nativeSnapshot = ui5.snapshot[0].children[1]
  const actualSnapshot = ours.snapshot[0].children[1]
  for (const snapshot of [nativeSnapshot, actualSnapshot]) {
    expect(snapshot.role).toBe("menu")
    expect(snapshot.children).toHaveLength(expanded ? 5 : 4)
  }
  const adjustedRows: Node[] = []
  for (const [index, text] of ["Home", "Workspace", "Help", "Archive"].entries()) {
    const children = childrenOf(nativeMenu.children[index])
    expect(children).toHaveLength(expanded && index === 1 ? 2 : 1)
    const actualIndex = expanded && index > 1 ? index + 1 : index
    adjustedRows.push(reconcileRow(actualMenu.children[actualIndex], children[0], actualSnapshot.children[actualIndex], nativeSnapshot.children[actualIndex], text, index === 0 || index === 2))
    // Native nests the open dialog under its owner host. The React positioner
    // is the following sibling in the static fixture; compare the full dialog.
    if (expanded && index === 1) {
      adjustedRows.push(reconcileSubmenu(actualMenu.children[2], children[1], actualSnapshot.children[2], nativeSnapshot.children[2]))
    }
  }
  nativeMenu.children = adjustedRows
  dialog.properties = actualDialog.properties
  const children = [actualContent[0], nativeMenu]
  dialog.children = expanded ? [generic(children)] : children
  ui5.ax[0] = dialog
}
