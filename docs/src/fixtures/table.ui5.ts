import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import "@ui5/webcomponents/dist/Table.js"
import "@ui5/webcomponents/dist/TableHeaderRow.js"
import "@ui5/webcomponents/dist/TableHeaderCell.js"
import "@ui5/webcomponents/dist/TableHeaderCellActionAI.js"
import "@ui5/webcomponents/dist/TableRow.js"
import "@ui5/webcomponents/dist/TableCell.js"
import "@ui5/webcomponents/dist/TableGroupRow.js"
import "@ui5/webcomponents/dist/TableSelectionMulti.js"
import "@ui5/webcomponents/dist/TableSelectionSingle.js"
import "@ui5/webcomponents/dist/TableGrowing.js"
import "@ui5/webcomponents/dist/TableRowAction.js"
import "@ui5/webcomponents/dist/TableRowActionNavigation.js"
import "@ui5/webcomponents-icons/dist/edit.js"
import "@ui5/webcomponents-icons/dist/ai.js"
import "@ui5/webcomponents-icons/dist/delete.js"
import "@ui5/webcomponents-icons/dist/navigation-right-arrow.js"
import "@ui5/webcomponents-icons/dist/sort-ascending.js"
import "@ui5/webcomponents-icons/dist/sort-descending.js"

import { defineUi5, h, type Ui5FixtureElement } from "../fixture-types"
import set, { TABLE_COLUMNS, TABLE_POPIN_WIDTH, TABLE_ROWS, TABLE_WIDTH } from "./table"

export default defineUi5(set, ({ selection, selected, actions, navigated, group, noData, popin, growing, sort, alternate, dropPlacement, interactive, loading, aiAction }) => {
  const rows = noData ? [] : TABLE_ROWS
  const row = (r: (typeof TABLE_ROWS)[number], i: number) =>
    h(
      "ui5-table-row",
      { "row-key": r.key, navigated: navigated && i === 1, interactive },
      ...TABLE_COLUMNS.map((c) => h("ui5-table-cell", {}, r[c.id as keyof typeof r])),
      ...(actions
        ? [
            h("ui5-table-row-action", { slot: "actions", icon: "edit", text: "Edit" }),
            h("ui5-table-row-action", { slot: "actions", icon: "delete", text: "Delete" }),
            h("ui5-table-row-action-navigation", { slot: "actions", interactive: true }),
          ]
        : [])
    )
  const features: HTMLElement[] = []
  if (selection === "multi") features.push(h("ui5-table-selection-multi", { slot: "features", selected: selected?.join(" ") }))
  if (selection === "single") features.push(h("ui5-table-selection-single", { slot: "features", selected: selected?.[0] }))
  if (growing) features.push(h("ui5-table-growing", { slot: "features", mode: "Button" }))
  const body = group
    ? [
        h("ui5-table-group-row", {}, "Very Best Screens"),
        ...rows.slice(0, 2).map(row),
        h("ui5-table-group-row", {}, "Others"),
        ...rows.slice(2).map((r, i) => row(r, i + 2)),
      ]
    : rows.map(row)
  const table = h(
    "ui5-table",
    {
      "accessible-name": "Products",
      loading,
      "loading-delay": "0",
      "overflow-mode": popin ? "Popin" : "Scroll",
      "row-action-count": actions ? "3" : undefined,
      "alternate-row-colors": alternate,
    },
    ...features,
    h(
      "ui5-table-header-row",
      { slot: "headerRow" },
      ...TABLE_COLUMNS.map((c) =>
        h(
          "ui5-table-header-cell",
          {
            importance: String(c.importance),
            "min-width": popin ? "7rem" : undefined,
            "horizontal-align": c.align,
            "sort-indicator": sort && c.id === "product" ? "Ascending" : sort && c.id === "price" ? "Descending" : undefined,
          },
          c.label,
          ...(aiAction && c.id === "supplier" ? [h("ui5-table-header-cell-action-ai", { slot: "action" })] : [])
        )
      )
    ),
    ...body
  )
  table.style.width = popin ? TABLE_POPIN_WIDTH : TABLE_WIDTH
  if (dropPlacement) {
    ;(table as Ui5FixtureElement).fixtureReady = (async () => {
      while (!table.isConnected || !table.shadowRoot?.querySelector("ui5-drop-indicator")) await new Promise(requestAnimationFrame)
      await renderFinished()
      await document.fonts.ready
      const indicator = table.shadowRoot!.querySelector("ui5-drop-indicator") as HTMLElement & { targetReference: HTMLElement; placement: string }
      indicator.targetReference = table.querySelectorAll<HTMLElement>("ui5-table-row")[1]
      indicator.placement = dropPlacement
      await renderFinished()
      await new Promise(requestAnimationFrame)
    })()
  }
  return table
})
