import * as React from "react"
import { DynamicDateRange, type DynamicDateRangeOption, type DynamicDateRangeValue } from "@/components/ui/dynamic-date-range"
import { Label } from "@/components/ui/label"
import { addDays, startOfDay } from "@/lib/fiori-dates"
import { defineDemo } from "./types"

const yesterdayAndToday: DynamicDateRangeOption = {
  label: "Yesterday and today",
  format: () => "Yesterday and today",
  parse: text => text === "Yesterday and today" ? [] : undefined,
  toDates: (_, { now }) => [addDays(startOfDay(now), -1), new Date(+addDays(startOfDay(now), 1) - 1)],
}

function Demo() {
  const [value, setValue] = React.useState<DynamicDateRangeValue | null>({ operator: "TODAY" })
  return <div className="grid gap-4">
    <div>
      <Label htmlFor="dynamic-date-range-period">Period</Label>
      <div><DynamicDateRange id="dynamic-date-range-period" value={value} onValueChange={setValue} /></div>
      <output aria-label="Selected date expression">{value?.operator}</output>
    </div>
    <section>
      <h3>Customise</h3>
      <p>Register a domain option with <code>customOptions</code> or <code>DynamicDateRange.register()</code> and include its key in <code>options</code>. Use <code>toDates()</code> to resolve the range when the report runs. The experimental <code>classNames</code> map styles the parts.</p>
      <DynamicDateRange aria-label="Activity period" options={["TODAY", "RECENT_ACTIVITY"]}
        defaultValue={{ operator: "RECENT_ACTIVITY" }} customOptions={{ RECENT_ACTIVITY: yesterdayAndToday }} classNames={{ field: "tabular-nums" }} />
    </section>
  </div>
}

export default defineDemo({
  category: "Dates", title: "DynamicDateRange", order: 88,
  docs: [{
    name: "dynamic-date-range",
    description: "Use a relative date expression or a fixed calendar value in the same field.",
    props: [
      { name: "options", type: "string[] | string", description: "Ordered subset of standard or registered operators." },
      { name: "value", type: "DynamicDateRangeValue | null", description: "Controlled operator and its optional date or number values." },
      { name: "onValueChange", type: "(value: DynamicDateRangeValue | null) => void", description: "Commit a parsed or chosen expression." },
    ],
  }],
  Demo,
})
