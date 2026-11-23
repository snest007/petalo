import type { Meta, StoryObj } from "@storybook/react-vite"
import { SplitterLayout, SplitterElement } from "@/components/ui/splitter-layout"
import { automaticContent, automaticFrame, automaticWidths, paneStyle } from "../../src/fixtures/splitter-layout.cases"
import { fioriMeta } from "../_lib/meta"

const base = fioriMeta({ name: "splitter-layout", component: SplitterLayout })
const meta = {
  ...base,
  args: { vertical: false },
  argTypes: { ...base.argTypes, vertical: { control: "boolean" } },
  render: args => <SplitterLayout {...args} style={{ height: 224, width: "min(100%, 320px)" }}>
    <SplitterElement size="50%" minSize={48}>Editor</SplitterElement>
    <SplitterElement minSize={48}>Preview</SplitterElement>
  </SplitterLayout>,
} satisfies Meta<typeof SplitterLayout>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Vertical: Story = { args: { vertical: true } }
export const RTL: Story = { globals: { dir: "rtl" } }
export const Customise: Story = { args: { classNames: { pane: "p-4" } } }
export const Automatic: Story = {
  render: args => <SplitterLayout {...args} style={automaticFrame}>
    {automaticWidths.map(width => <SplitterElement key={width} minSize={48} style={paneStyle}>{automaticContent(width)}</SplitterElement>)}
  </SplitterLayout>,
}
