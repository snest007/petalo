import { AnalyticalTable, type AnalyticalTableColumnDef } from "@/components/ui/analytical-table"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de"
import { defineFixtures } from "../fixture-types"
import { fixtureInputs, headersFor, inventory, type Inventory } from "./analytical-table.cases"

export default defineFixtures({
  ...fixtureInputs,
  react: (props) => {
    const columns: AnalyticalTableColumnDef<Inventory>[] = headersFor(props.longHeader).map(({ key, label }, index) => ({
      accessorKey: key, header: label, width: props.widths?.[index],
      sticky: props.frozen && index === 0 ? "start" : undefined,
    }))
    const grid = <AnalyticalTable aria-label="Inventory" data={props.filtered ? [] : props.data ?? inventory} columns={columns}
      dir={props.rtl ? "rtl" : undefined} initialState={{ hiddenColumns: props.hidden }}
      alternateRowColor={props.alternate} scaleWidthMode={props.scaleWidthMode}
      defaultVisibleRows={5} minRows={3} visibleRowCountMode={props.countMode} loading={props.loading}
      noDataReason={props.filtered ? "Filtered" : "Empty"} announceEmptyCells={props.emptyCell}
      classNames={props.neutral ? { row: "inventory-row", cell: "inventory-cell" } : undefined}
      components={props.neutral ? { Body: ({ children }) => children } : undefined} />
    return <div style={{ width: 480, height: props.height }}>
      {props.german ? <FioriLocaleProvider locale="de-DE" texts={{ "wcr:LIST_NO_DATA": de["wcr:LIST_NO_DATA"] }}>{grid}</FioriLocaleProvider> : grid}
    </div>
  },
})
