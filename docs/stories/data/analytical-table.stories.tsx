import type { Meta, StoryObj } from "@storybook/react-vite"
import { AnalyticalTable } from "@/components/ui/analytical-table"
import { AnalyticalTableSortFilterDemo, columns, CustomAnalyticalTable, inventory } from "../../src/demos/analytical-table"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "analytical-table", component: AnalyticalTable<(typeof inventory)[number]> })
const meta = {
  ...base,
  args: { columns, data: inventory.slice(0, 10), visibleRows: 4, minRows: 3, "aria-label": "Inventory" },
  argTypes: {
    ...base.argTypes,
    scaleWidthMode: { control: "select", options: ["Default", "Smart", "Grow"] },
    visibleRowCountMode: { control: "select", options: ["Fixed", "Auto", "AutoWithEmptyRows", "Interactive"] },
    alternateRowColor: { control: "boolean" },
    loading: { control: "boolean" },
    noDataText: { control: "text" },
  },
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
} satisfies Meta<typeof AnalyticalTable<(typeof inventory)[number]>>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const AlternateRows: Story = { args: { alternateRowColor: true } }
export const SmartWidths: Story = { args: { scaleWidthMode: "Smart", columns: columns.map(({ width: _width, ...column }) => column) } }
export const GrowWidths: Story = { args: { scaleWidthMode: "Grow", columns: columns.map(({ width: _width, ...column }) => column) } }
export const FrozenColumn: Story = { args: { enableColumnFreeze: true, defaultColumnPinning: { start: ["product"], end: [] } } }
export const HiddenColumn: Story = { args: { defaultColumnVisibility: { category: false } } }
export const SizedColumn: Story = { args: { defaultColumnSizing: { product: 220 } } }
export const LongHeader: Story = { args: { columns: [{ ...columns[0], header: "Product identification and detailed description" }, ...columns.slice(1)] } }
export const InteractiveHeight: Story = { args: { visibleRowCountMode: "Interactive" } }
export const AutoEmptyRows: Story = {
  args: { data: inventory.slice(0, 2), visibleRowCountMode: "AutoWithEmptyRows" },
  render: args => <div style={{ height: 220 }}><AnalyticalTable {...args} /></div>,
}
export const Empty: Story = { args: { data: [] } }
export const Filtered: Story = { args: { data: [], noDataReason: "Filtered" } }
export const Loading: Story = { args: { data: [], loading: true } }
export const RTL: Story = { args: { dir: "rtl", defaultColumnPinning: { start: ["product"], end: [] } } }
export const German: Story = { args: { data: [], locale: "de-DE", texts: { noData: "Keine Daten" } } }
export const Styled: Story = { args: { classNames: { cell: "tabular-nums" }, columnOrder: ["stock", "product", "category"] } }
export const CustomContent: Story = { args: { columns: columns.map(column => ({ ...column, cell: ({ defaultContent }) => <strong>{defaultContent}</strong> })) } }
export const Custom: Story = { render: () => <CustomAnalyticalTable /> }


export const SortAscending: Story = { args: { sortable: true, defaultSorting: [{ id: "product", desc: false }] } }
export const SortDescending: Story = { args: { sortable: true, defaultSorting: [{ id: "stock", desc: true }] } }
export const MultiSort: Story = { args: { sortable: true, enableMultiSort: true, sortPriority: ["category", "stock"],
  defaultSorting: [{ id: "category", desc: false }, { id: "stock", desc: true }] } }
export const ColumnFilter: Story = { args: { filterable: true, defaultColumnFilters: [{ id: "product", value: "tent" }] } }
export const ColumnFilterEmpty: Story = { args: { filterable: true, defaultColumnFilters: [{ id: "product", value: "missing" }] } }
export const SortFilterMenu: Story = { render: () => <AnalyticalTableSortFilterDemo /> }
export const SortFilterRTL: Story = { render: () => <AnalyticalTableSortFilterDemo dir="rtl" /> }
