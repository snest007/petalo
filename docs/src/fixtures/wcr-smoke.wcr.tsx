import { AnalyticalTable } from "@ui5/webcomponents-react/AnalyticalTable"
import { defineFixtures } from "../fixture-types"
import { columns, frame, smoke } from "./wcr-smoke.cases"

const tableColumns = columns.map(({ key, label }) => ({ accessor: key, Header: label, width: 160, disableResizing: true }))

export default defineFixtures({
  ...smoke,
  react: ({ rows }) => (
    <div style={frame}>
      <AnalyticalTable accessibleName="Inventory" columns={tableColumns} data={rows} visibleRows={5} />
    </div>
  ),
})
