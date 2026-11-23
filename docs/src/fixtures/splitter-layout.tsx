import { SplitterElement, SplitterLayout } from "@/components/ui/splitter-layout"
import { defineFixtures } from "../fixture-types"
import { frame, paneStyle, splitterCases } from "./splitter-layout.cases"

export default defineFixtures({
  ...splitterCases,
  react: ({ vertical, fixed, three }) => <SplitterLayout vertical={vertical} style={frame} classNames={{ pane: "min-w-0" }}>
    <SplitterElement size={vertical ? 120 : three ? 112 : 168} minSize={48} resizable={!fixed} style={paneStyle}><span style={{ padding: "1rem" }}>Editor</span></SplitterElement>
    <SplitterElement size={three ? 112 : undefined} minSize={48} resizable={!fixed} style={paneStyle}><span style={{ padding: "1rem" }}>Preview</span></SplitterElement>
    {three && <SplitterElement minSize={48} style={paneStyle}><span style={{ padding: "1rem" }}>Outline</span></SplitterElement>}
  </SplitterLayout>,
})
