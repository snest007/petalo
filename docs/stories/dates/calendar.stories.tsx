import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Calendar, CalendarLegend, CalendarLegendItem, type CalendarProps } from "@/components/ui/calendar"
import { fioriMeta } from "../_lib/meta"

const day = (date: number) => new Date(2024, 2, date)
const base = fioriMeta({ name: "calendar", component: Calendar })
const meta = {
  ...base,
  args: { selectedDates: [day(12)], selectionMode: "single", hideWeekNumbers: false, initialPicker: "day", "aria-label": "Delivery date", onSelectedDatesChange: fn(), onFocusedDateChange: fn() },
  argTypes: {
    ...base.argTypes,
    selectionMode: { ...base.argTypes?.selectionMode, control: "inline-radio", options: ["single", "multiple", "range"] },
    initialPicker: { control: "select", options: ["day", "month", "year", "yearrange"] },
    selectionLevel: { control: "select", options: ["day", "month", "year"] },
    locale: { ...base.argTypes?.locale, control: "text" }, hideWeekNumbers: { control: "boolean" },
    firstDayOfWeek: { control: "select", options: [0, 1, 2, 3, 4, 5, 6] }, autoFocus: { control: "boolean" },
    selectedDates: { ...base.argTypes?.selectedDates, control: false }, defaultSelectedDates: { control: false },
    focusedDate: { control: false }, defaultFocusedDate: { control: false },
    minDate: { ...base.argTypes?.minDate, control: false }, maxDate: { ...base.argTypes?.maxDate, control: false },
    specialDates: { control: false }, legend: { control: false }, labels: { control: false }, isDateDisabled: { control: false },
    onSelectedDatesChange: { ...base.argTypes?.onSelectedDatesChange, control: false }, onFocusedDateChange: { control: false },
  },
  render: function DeliveryCalendar(args: CalendarProps) {
    const [, updateArgs] = useArgs<CalendarProps>()
    return <Calendar key={`${args.initialPicker}-${args.selectionLevel}`} {...args} onSelectedDatesChange={(selectedDates) => { args.onSelectedDatesChange?.(selectedDates); updateArgs({ selectedDates }) }} />
  },
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Single: Story = {}
export const Today: Story = { args: { selectedDates: [] } }
export const Range: Story = { args: { selectionMode: "range", selectedDates: [day(5), day(14)] } }
export const Multiple: Story = { args: { selectionMode: "multiple", selectedDates: [day(5), day(6), day(21)] } }
export const MinMax: Story = { args: { minDate: day(8), maxDate: day(25) } }
export const NoWeekNumbers: Story = { args: { hideWeekNumbers: true } }
export const SpecialDates: Story = { args: { specialDates: [{ date: day(4), type: "Type01" }, { date: day(13), type: "Type05" }, { date: day(20), type: "NonWorking" }, { date: day(23), type: "Working" }], legend: <CalendarLegend><CalendarLegendItem type="Type01" text="Holiday" /><CalendarLegendItem type="Type05" text="Training" /></CalendarLegend> } }
export const MonthPicker: Story = { args: { initialPicker: "month" } }
export const YearPicker: Story = { args: { initialPicker: "year" } }
export const YearRangePicker: Story = { args: { initialPicker: "yearrange" } }
export const DisabledDates: Story = { args: { isDateDisabled: (date) => date.getDay() === 0 || date.getDay() === 6 } }
export const Localized: Story = { args: { locale: "en-GB" } }
export const CustomTexts: Story = { args: { texts: { selected: "Delivery date selected", previousButtonShortcut: "PageUp", nextButtonShortcut: "PageDown" }, labels: { nextMonth: "Next delivery month", previousMonth: "Previous delivery month", monthButton: (month) => `Delivery month ${month}`, yearRangeButton: (from, to) => `Delivery years from ${from} to ${to}` } } }
export const RTL: Story = { globals: { dir: "rtl" } }

export const German: Story = { globals: { locale: "de" } }
export const Arabic: Story = { globals: { locale: "ar", dir: "rtl" } }

export const ShortcutTexts: Story = { args: { texts: { monthShortcut: "F4", nextShortcut: "Pageup", previousShortcut: "Pagedown" } } }

export const LegendCustomOnly: Story = { render: () => <CalendarLegend hideToday hideSelectedDay hideWorkingDay hideNonWorkingDay><CalendarLegendItem type="Type17" text="Delivery" /><CalendarLegendItem type="Type20" text="Stocktake" /></CalendarLegend> }
