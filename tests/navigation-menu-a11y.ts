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

/** NavigationMenuItemTemplate.js leaves the native LI inside its anchor; the
 * same source forces role none even on a focusable nonlink LI. Verify the
 * precise role violation before comparing each corrected item as menuitem.
 * Popup.js adds aria-modal to the nonmodal desktop Popup and resolves the
 * hidden name to aria-label. The actual hidden title text remains compared.
 */
export function reconcileNavigationMenuFixture(ours: Capture, ui5: Capture) {
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
  let layout = content
  for (let i = 0; i < 3; i++) {
    const children = childrenOf(layout)
    expect(children).toHaveLength(1)
    layout = children[0]
  }
  const [listStart, nativeMenu, listEnd] = childrenOf(layout)
  expect([listStart, listEnd]).toEqual([sentinel, sentinel])
  expect(nativeMenu).toEqual(ax("menu", "", { orientation: "vertical" }, nativeMenu.children))

  const actualDialog = ours.ax[0]
  expect(actualDialog).toEqual(ax("dialog", title, { focusable: true, labelledby: [label(title)], modal: false }, actualDialog.children))
  expect(actualDialog.children).toHaveLength(2)
  expect(separateRowContent(actualDialog.children[0])).toEqual([heading])
  const actualMenu = actualDialog.children[1]
  expect(actualMenu).toEqual(ax("menu", "", { orientation: "vertical" }, actualMenu.children))
  expect(actualMenu.children).toHaveLength(4)
  expect(nativeMenu.children).toHaveLength(4)

  const nativeSnapshot = ui5.snapshot[0].children[1]
  const actualSnapshot = ours.snapshot[0].children[1]
  for (const snapshot of [nativeSnapshot, actualSnapshot]) {
    expect(snapshot.role).toBe("menu")
    expect(snapshot.children).toHaveLength(4)
  }
  for (const [index, text] of ["Home", "Workspace", "Help", "Archive"].entries()) {
    const name = `${text} Is Active`
    const link = index === 0 || index === 2
    const [inner] = childrenOf(nativeMenu.children[index])
    if (link) expect(inner).toEqual(ax("menuitem", name, { focusable: true }, inner.children))
    const row = link ? inner.children[0] : inner
    expect(row.role).toBe("listitem")
    expect(row.name).toBe(name)
    expect(row.properties?.level).toBe(1)
    expect(row.properties?.describedby).toEqual(index === 0 ? [label(""), label("Tag New")] : [label("")])
    delete row.properties!.level
    row.properties!.describedby = index === 0 ? [label("Tag New")] : undefined
    if (index !== 0) delete row.properties!.describedby
    const actualRow = actualMenu.children[index]
    const nativeText = row.children.flatMap(separateRowContent)
    const actualText = actualRow.children.flatMap(separateRowContent)
    if (index === 0) {
      // The tag is an accessible description on the same host. The redundant
      // child text is hidden from the accessible name computation for axe.
      expect(nativeText).toEqual([nodeText(text), nodeText("Tag"), nodeText("New"), nodeText("Is Active")])
      expect(row.description).toBe("Tag New")
      expect(actualText).toEqual([nodeText(text), nodeText("Is Active")])
      expect(actualRow.description).toBe("Tag New")
      // The ignored tag still resolves and contributes the complete AX
      // description. CDP omits the ignored target's own text projection.
      expect(actualRow.properties!.describedby).toEqual([label("")])
      row.properties!.describedby = [label("")]
      expect(row.properties!.labelledby).toEqual([label(text), label("Is Active")])
      expect(actualRow.properties!.labelledby).toBeUndefined()
      delete row.properties!.labelledby
    } else expect(actualText).toEqual(nativeText)
    row.children = actualRow.children
    row.role = "menuitem"
    nativeMenu.children[index] = row

    const native = nativeSnapshot.children[index], actual = actualSnapshot.children[index]
    if (link) {
      expect(native).toEqual({ role: "menuitem", name, states: [], children: [
        { role: "listitem", name, states: [], children: [], ...(index === 0 ? { text: "Home Tag New Is Active" } : {}) },
      ] })
      expect(actual).toEqual({ role: "menuitem", name, states: [], children: [] })
      native.children = []
    } else {
      expect(native).toEqual({ role: "listitem", name, states: [], children: [] })
      if (index === 3) {
        expect(row.properties!.disabled).toBe(true)
        expect(actual.states).toEqual(["[disabled]"])
        native.states = ["[disabled]"]
      }
      native.role = "menuitem"
    }
  }
  dialog.properties = actualDialog.properties
  dialog.children = [actualDialog.children[0], nativeMenu]
  ui5.ax[0] = dialog
}
