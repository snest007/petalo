import { DataTable } from "@/components/ui/data-table"
import { defineFixtures } from "../fixture-types"
import { columns, frame, smoke } from "./wcr-smoke.cases"

const tableColumns = columns.map(({ key, label }) => ({ accessorKey: key, header: label, enableSorting: false }))

export default defineFixtures({
  ...smoke,
  react: ({ rows }) => (
    <div style={frame}>
      <DataTable aria-label="Inventory" columns={tableColumns} data={rows} sortTrigger="none" />
    </div>
  ),
})
