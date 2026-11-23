import * as React from "react"
import { SplitterLayout, SplitterElement } from "@/components/ui/splitter-layout"
import { defineDemo } from "./types"

function Demo() {
  const [sizes, setSizes] = React.useState<readonly (number | undefined)[]>([])
  return <>
    <SplitterLayout style={{ width: "min(100%, 36rem)", height: "14rem" }}>
      <SplitterElement size="40%" minSize={80} className="p-4 bg-(--sapGroup_ContentBackground)">Editor</SplitterElement>
      <SplitterElement minSize={80} className="p-4 bg-(--sapGroup_ContentBackground)">Preview</SplitterElement>
    </SplitterLayout>
    <section className="mt-4">
      <h3>Customise</h3>
      <p>Style the experimental root, pane, separator, line and grip slots with <code>classNames</code>. Manage pane sizes in pixels with <code>sizes</code> and <code>onSizesChange</code>. Place your content inside <code>SplitterElement</code>.</p>
      <SplitterLayout vertical sizes={sizes} onSizesChange={setSizes} classNames={{ pane: "p-4" }} style={{ height: "15rem" }}>
        <SplitterElement size="50%" minSize={48}>Preview</SplitterElement>
        <SplitterElement minSize={48}>Details</SplitterElement>
      </SplitterLayout>
    </section>
  </>
}

export default defineDemo({
  category: "Layout", title: "SplitterLayout", order: 610,
  docs: [{
    name: "splitter-layout",
    description: "Resize adjacent panes using the separator. Press an arrow for 20 px, hold Shift for 1 px, and press Home or End to reach a limit.",
    props: [
      { name: "vertical", type: "boolean", description: "Stack the panes along the vertical axis." },
      { name: "sizes / defaultSizes", type: "(number | undefined)[]", description: "Pane sizes in pixels, excluding separators." },
      { name: "texts", type: "Partial<SplitterLayoutTexts>", description: "Override the separator’s accessible keyboard hint." },
    ],
  }],
  Demo,
})
