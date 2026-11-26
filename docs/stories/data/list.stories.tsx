import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs, useRef as useStoryRef } from "storybook/preview-api"
import { fn } from "storybook/test"
import { List, ListItemCustom, ListItemGroup, ListItemGroupHeader, ListItemStandard, type ListProps, type ListItemStandardProps } from "@/components/ui/list"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { calendar, email, product, settings } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"
import { FioriDropIndicator } from "@/lib/fiori-drag-and-drop"

type Item = ListItemStandardProps & { value: string; text: string; "data-moving"?: string; "data-active"?: string }
const fruits: Item[] = [{ value: "apples", text: "Apples" }, { value: "bananas", text: "Bananas" }, { value: "cherries", text: "Cherries" }]
function PositionedListDrop({ placement }: { placement: "Before" | "After" | "On" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = React.useState<{ owner: HTMLElement; target: HTMLElement } | null>(null)
  React.useLayoutEffect(() => {
    const owner = ref.current?.querySelector<HTMLElement>('[data-slot="list"]')
    const target = owner?.querySelectorAll<HTMLElement>('[data-slot="list-item"]')[1]
    if (owner && target) setNodes({ owner, target })
  }, [])
  return <div className="relative max-w-xs" ref={ref}><List aria-label="Fruit drop preview">{fruits.map((item) => <ListItemStandard key={item.value} {...item} />)}</List>{nodes && <FioriDropIndicator ownerReference={nodes.owner} targetReference={nodes.target} placement={placement} />}</div>
}

type Args = ListProps & { items: Item[]; customItems?: boolean; grouped?: boolean; onDetail?: (value: string) => void }
const base = fioriMeta({ name: "list", component: List })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: S2DocsPage } },
  args: { items: fruits, value: [], selectionMode: "none", separators: "all", growing: "none", indent: false, stickyHeader: false, loading: false, loadingDelay: 0, "aria-label": "Products", onValueChange: fn(), onItemClick: fn(), onItemDelete: fn(), onLoadMore: fn(), onMoveOver: fn(), onMove: fn(), onDetail: fn() },
  argTypes: {
    ...base.argTypes,
    selectionMode: { control: "select", options: ["none", "single", "singleStart", "singleEnd", "singleAuto", "multiple", "delete"] }, separators: { control: "inline-radio", options: ["all", "inner", "none"] }, growing: { control: "select", options: ["none", "button", "scroll"] }, accessibleRole: { control: "inline-radio", options: ["list", "listbox"] },
    value: { control: "object" }, defaultValue: { control: false }, items: { control: "object" }, headerText: { control: "text" }, footerText: { control: "text" }, noDataText: { control: "text" }, growingButtonText: { control: "text" }, deleteText: { control: "text" }, selectedText: { control: "text" }, notSelectedText: { control: "text" },
    indent: { control: "boolean" }, stickyHeader: { control: "boolean" }, loading: { control: "boolean" }, loadingDelay: { control: "number" }, customItems: { control: "boolean" }, grouped: { control: "boolean" }, header: { control: false },
    onValueChange: { control: false }, onItemClick: { control: false }, onItemDelete: { control: false }, onLoadMore: { control: false }, onMoveOver: { control: false }, onMove: { control: false }, onDetail: { control: false },
  },
  render: function ProductList(args: Args) {
    const [, updateArgs] = useArgs<Args>()
    // useArgs and this render's state share Storybook's hook context.
    const lastProductNumber = useStoryRef(fruits.length)
    const { items, customItems, grouped, onDetail, ...props } = args
    const row = (item: Item) => customItems ? <ListItemCustom key={item.value} value={item.value} type={item.type} disabled={item.disabled} highlight={item.highlight}><div className="flex w-full items-center justify-between gap-2"><span>{item.text}</span><Button onClick={() => onDetail?.(item.value)} aria-label={`Edit ${item.text}`}>Edit</Button></div></ListItemCustom> : <ListItemStandard key={item.value} {...item} onDetailClick={() => onDetail?.(item.value)} />
    return <List {...props} onValueChange={(value, detail) => { args.onValueChange?.(value, detail); updateArgs({ value }) }} onItemDelete={(value) => { args.onItemDelete?.(value); updateArgs({ items: items.filter((item) => item.value !== value) }) }} onLoadMore={() => { args.onLoadMore?.()
      // Keep identifiers above every existing or previously issued product number.
      const n = Math.max(lastProductNumber.current, ...items.map((item) => Number(/^product-(\d+)$/.exec(item.value)?.[1] ?? 0))) + 1
      lastProductNumber.current = n
      updateArgs({ items: [...items, { value: `product-${n}`, text: `Seasonal fruit ${n}` }] }) }} onMoveOver={(event) => { args.onMoveOver?.(event); if (event.destination.placement !== "On") event.preventDefault() }} onMove={(event) => {
      args.onMove?.(event)
      const source = event.source.element?.dataset.navKey
      const target = event.destination.element.dataset.navKey
      if (!source || !target || source === target || event.destination.placement === "On") return
      const moving = items.find((item) => item.value === source)
      if (!moving) return
      const next = items.filter((item) => item.value !== source)
      next.splice(next.findIndex((item) => item.value === target) + (event.destination.placement === "After" ? 1 : 0), 0, moving)
      updateArgs({ items: next })
    }}>{grouped ? <><ListItemGroup headerText="Core range">{items.slice(0, 2).map(row)}</ListItemGroup><ListItemGroup headerText="Seasonal range">{items.slice(2).map(row)}</ListItemGroup></> : items.map(row)}</List>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const NoSelection: Story = {}
export const Single: Story = { args: { selectionMode: "single", value: ["bananas"] } }
export const CancelSelection: Story = { args: { selectionMode: "single", value: ["bananas"], onBeforeValueChange: ({ item }) => item !== "cherries" } }
export const SingleStart: Story = { args: { selectionMode: "singleStart", value: ["bananas"] } }
export const SingleEnd: Story = { args: { selectionMode: "singleEnd", value: ["bananas"] } }
export const SingleAuto: Story = { args: { selectionMode: "singleAuto", value: ["bananas"] } }
export const Multiple: Story = { args: { selectionMode: "multiple", value: ["bananas"] } }
export const Delete: Story = { args: { selectionMode: "delete" } }
export const HeaderFooter: Story = { args: { headerText: "Fruits", footerText: "Fresh produce" } }
export const Icons: Story = { args: { items: [{ value: "calendar", text: "Calendar", icon: calendar }, { value: "email", text: "Email", icon: email }, { value: "settings", text: "Settings", icon: settings, iconEnd: true }] } }
export const Description: Story = { args: { items: [{ value: "laptop", text: "Laptop", description: "Dell XPS 15", icon: product, additionalText: "In stock", additionalTextState: "positive" }, { value: "monitor", text: "Monitor", description: "27 inch, 4K", additionalText: "Low stock", additionalTextState: "critical" }] } }
export const Avatars: Story = { args: { items: [{ value: "john", text: "John Doe", description: "Engineering", image: <Avatar initials="JD" size="S" /> }, { value: "anna", text: "Anna Brown", description: "Sales", image: <Avatar initials="AB" size="S" />, additionalText: "Away" }] } }
export const ActiveItems: Story = { args: { items: fruits.map((item) => ({ ...item, type: "active" })) } }
export const NavigationItems: Story = { args: { items: fruits.map((item) => ({ ...item, type: "navigation" })) } }
export const DetailItems: Story = { args: { items: fruits.map((item) => ({ ...item, type: "detail" })) } }
export const InactiveSelectableItems: Story = { args: { selectionMode: "multiple", items: fruits.map((item) => ({ ...item, type: "inactiveSelectable" })) } }
export const InactiveItems: Story = { args: { items: fruits.map((item) => ({ ...item, type: "inactive" })) } }
export const Navigated: Story = { args: { items: fruits.map((item, index) => ({ ...item, type: "navigation", navigated: index === 1 })) } }
export const DisabledItems: Story = { args: { items: fruits.map((item, index) => ({ ...item, disabled: index === 1 })) } }
export const AdditionalTextNone: Story = { args: { items: [{ value: "draft", text: "Draft", additionalText: "Unsubmitted", additionalTextState: "none" }] } }
export const AdditionalTextNegative: Story = { args: { items: [{ value: "blocked", text: "Order blocked", additionalText: "Payment overdue", additionalTextState: "negative" }] } }
export const AdditionalTextCritical: Story = { args: { items: [{ value: "low", text: "Low stock", additionalText: "Order soon", additionalTextState: "critical" }] } }
export const AdditionalTextPositive: Story = { args: { items: [{ value: "available", text: "Available", additionalText: "In stock", additionalTextState: "positive" }] } }
export const AdditionalTextInformation: Story = { args: { items: [{ value: "pending", text: "In process", additionalText: "Approval pending", additionalTextState: "information" }] } }
export const Highlights: Story = { args: { items: ["negative", "critical", "positive", "information"].map((state) => ({ value: state, text: `Order ${state}`, highlight: state as Item["highlight"] })) } }
export const MultipleDescription: Story = { args: { selectionMode: "multiple", value: ["bananas"], items: fruits.map((item) => ({ ...item, description: "Fresh produce" })) } }
export const InnerSeparators: Story = { args: { separators: "inner" } }
export const NoSeparators: Story = { args: { separators: "none" } }
export const Groups: Story = { args: { grouped: true } }
export const Empty: Story = { args: { items: [], headerText: "Products", noDataText: "No products available" } }
export const GrowingButton: Story = { args: { growing: "button" } }
export const GrowingScroll: Story = { args: { growing: "scroll", className: "max-h-48 overflow-auto" } }
export const Loading: Story = { args: { loading: true, loadingDelay: 0 } }
export const CustomItems: Story = { args: { customItems: true } }
export const CustomMultiple: Story = { args: { customItems: true, selectionMode: "multiple", value: ["bananas"] } }
export const CustomSingleStart: Story = { args: { customItems: true, selectionMode: "singleStart", value: ["bananas"] } }
export const DropBefore: Story = { render: () => <PositionedListDrop placement="Before" /> }
export const DropAfter: Story = { render: () => <PositionedListDrop placement="After" /> }
export const DropOn: Story = { render: () => <PositionedListDrop placement="On" /> }
export const DragAndDrop: Story = { args: { items: fruits.map((item) => ({ ...item, movable: true })) } }
export const MovableDisabled: Story = { args: { items: fruits.map((item, index) => ({ ...item, movable: true, disabled: index === 1 })) } }
export const Moving: Story = { args: { items: fruits.map((item, index) => ({ ...item, movable: true, "data-moving": index === 1 ? "" : undefined })) } }
export const MovableActiveRich: Story = { args: { selectionMode: "multiple", value: ["laptop"], items: [{ value: "laptop", text: "Laptop", description: "Dell XPS 15", icon: product, additionalText: "In stock", movable: true, "data-active": "" }] } }
export const MovableActiveMovingRich: Story = { args: { selectionMode: "multiple", value: ["laptop"], items: [{ value: "laptop", text: "Laptop", description: "Dell XPS 15", icon: product, additionalText: "In stock", movable: true, "data-active": "", "data-moving": "" }] } }
export const MovableRich: Story = { args: { selectionMode: "multiple", value: ["laptop"], items: [{ value: "laptop", text: "Laptop", description: "Dell XPS 15", icon: product, additionalText: "In stock", movable: true }] } }
export const LongText: Story = { args: { items: [{ value: "long", text: "Fresh produce from our regional suppliers for the coming season", description: "Available for delivery to distribution centres across the region" }], className: "max-w-xs" } }
export const Listbox: Story = { args: { accessibleRole: "listbox", selectionMode: "multiple", value: ["bananas"] } }
export const CustomTexts: Story = { args: { selectionMode: "multiple", growing: "button", growingButtonText: "More products", selectedText: "Included in shipment", notSelectedText: "Excluded from shipment", deleteText: "Remove product" } }
export const RTL: Story = { globals: { dir: "rtl" }, args: { selectionMode: "multiple" } }

// Current defaults are read from registry/ui/list.tsx and its shared calendar/input/clock primitives.
// UI5 keys come from the installed 2.28 English i18n defaults; non-identical wording is identified explicitly.
function S2DocsPage() {
  const textKeys = [
  {
    "prop": "growingButtonText",
    "text": "More",
    "key": "LOAD_MORE_TEXT"
  },
  {
    "prop": "deleteText",
    "text": "Delete",
    "key": "DELETE"
  },
  {
    "prop": "selectedText",
    "text": "Selected",
    "key": "LIST_ITEM_SELECTED"
  },
  {
    "prop": "notSelectedText",
    "text": "Not Selected",
    "key": "LIST_ITEM_NOT_SELECTED"
  },
  {
    "prop": "detailText",
    "text": "Edit",
    "key": "API extension; UI5 ListItemTemplate detail button has no text key"
  }
]
  return <><DocsPage /><section aria-label="Localization text keys"><h2>Localization text keys</h2><p>Override these props to translate built-in labels and announcements. English defaults below describe the current component API.</p><table><thead><tr><th>Text prop / key</th><th>UI5 reference key</th><th>English default</th></tr></thead><tbody>{textKeys.map((text) => <tr key={text.prop}><td><code>{text.prop}</code></td><td>{text.key}</td><td>{text.text}</td></tr>)}</tbody></table></section></>
}

export const CustomFocusDescription: Story = { render: () => <List aria-label="Custom produce" texts={{ customItem: "Produce row", singleControl: "Contains one action", selected: "Produce selected", notSelected: "Produce deselected" }} selectionMode="multiple"><ListItemCustom value="apple"><span>Apples</span><Button>Edit</Button></ListItemCustom></List> }
export const RTLCustomFocusDescription: Story = { ...CustomFocusDescription, globals: { dir: "rtl" } }
export const GrowingAccessibility: Story = { render: () => <List aria-label="Produce" growing="button" growingButtonText="Load produce" growingButtonName="Load produce" growingButtonDescription="Fetch additional fruit"><ListItemStandard value="apple">Apples</ListItemStandard></List> }
export const AccessibilityGroups: Story = { render: () => <List aria-label="Produce"><ListItemGroup headerText="Fruit"><ListItemStandard value="apple">Apples</ListItemStandard><ListItemStandard value="pear">Pears</ListItemStandard></ListItemGroup></List> }
export const RTLGroups: Story = { ...AccessibilityGroups, globals: { dir: "rtl" } }
export const HeaderAccessibility: Story = { render: () => <List aria-label="Produce"><ListItemGroupHeader accessibleName="Produce categories">Fruit group</ListItemGroupHeader><ListItemStandard value="apple" type="inactive">Apples</ListItemStandard></List> }
export const ItemAccessibility: Story = { render: () => <List aria-label="Produce" accessibleRole="listbox" selectionMode="single" defaultValue={["apple"]}><ListItemCustom value="apple" aria-label="Apples produce row" aria-posinset={2} aria-setsize={7}><span>Apples</span></ListItemCustom></List> }
export const RoleMenu: Story = { render: () => <List aria-label="Produce actions" accessibleRole="menu"><ListItemStandard value="buy" type="navigation">Buy produce</ListItemStandard></List> }
export const RoleTree: Story = { render: () => <List aria-label="Produce tree" accessibleRole="tree"><ListItemStandard value="fruit" type="inactive">Fruit</ListItemStandard></List> }
export const SelectedCustomOption: Story = { render: () => <List aria-label="Produce" accessibleRole="listbox" selectionMode="single" defaultValue={["apple"]}><ListItemCustom value="apple" role="option" aria-label="Apples"><span>Apples</span></ListItemCustom></List> }
export const RTLSelectedCustomOption: Story = { ...SelectedCustomOption, globals: { dir: "rtl" } }

export const German: Story = { globals: { locale: "de" } }
export const ModeTexts: Story = { args: { texts: { multiSelectable: "Choose several destinations", selected: "Chosen", notSelected: "Not chosen", groups: (groups, items) => `${groups} destination groups, ${items} choices` } } }
