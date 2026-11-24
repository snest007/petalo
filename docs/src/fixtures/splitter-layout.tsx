import { SplitterElement, SplitterLayout } from "@/components/ui/splitter-layout"
import { defineFixtures } from "../fixture-types"
import { automaticContent, automaticFrame, automaticWidths, frame, paneStyle, splitterCases } from "./splitter-layout.cases"

export default defineFixtures({
  ...splitterCases,
  a11yDiff: {
    "splitter-layout-automatic": {
      "ignore": ["/ax/0/children/1/value"],
      "reason": "WCR Splitter/index.js omits aria-valuenow, so Chromium reports 50. H9 reports the actual position. The paired LTR and RTL behavior tests verify this exact separator and its value."
    }
  },
  react: ({ vertical, fixed, three, automatic }) => automatic ? <SplitterLayout style={automaticFrame}>
    {automaticWidths.map(width => <SplitterElement key={width} minSize={48} style={paneStyle}>{automaticContent(width)}</SplitterElement>)}
  </SplitterLayout> : <SplitterLayout vertical={vertical} style={frame} classNames={{ pane: "min-w-0" }}>
    <SplitterElement size={vertical ? 120 : three ? 112 : 168} minSize={48} resizable={!fixed} style={paneStyle}><span style={{ padding: "1rem" }}>Editor</span></SplitterElement>
    <SplitterElement size={three ? 112 : undefined} minSize={48} resizable={!fixed} style={paneStyle}><span style={{ padding: "1rem" }}>Preview</span></SplitterElement>
    {three && <SplitterElement minSize={48} style={paneStyle}><span style={{ padding: "1rem" }}>Outline</span></SplitterElement>}
  </SplitterLayout>,
})
