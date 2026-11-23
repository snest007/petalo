# Dates

| Item | Summary |
| --- | --- |
| [calendar](#calendar) | Select Gregorian dates in a calendar that remains visible. |
| [date-picker](#date-picker) | Enter or select one localized Gregorian date. |
| [date-range-picker](#date-range-picker) | Enter a localized Gregorian start and end date as one interval. |
| [date-time-picker](#date-time-picker) | Enter one localized Gregorian date and time together. |
| [picker-field](#picker-field) | Compose a custom text field and picker with caller-owned value rules. |
| [time-picker](#time-picker) | Enter or select a localized time without a date. |

## calendar

Select Gregorian dates in a calendar that remains visible.

### Use when

- Let users select one or more dates while keeping a calendar visible.
- Keep month and year navigation available when users need calendar context.
- Use selectionMode="multiple" for separate days or range for a contiguous interval; bound choices with minDate and maxDate.

### Don't use when

- Enter one localized date in a compact field with an on-demand calendar. → [date-picker](dates.md#date-picker)
- Enter a contiguous date range in a compact field. → [date-range-picker](dates.md#date-range-picker)
- Enter both a date and a time in one field. → [date-time-picker](dates.md#date-time-picker)

Main exports: `Calendar`, `CalendarLegend`, `CalendarLegendItem`.

```bash
npx shadcn add @petalo/calendar
```

## date-picker

Enter or select one localized Gregorian date.

### Use when

- Let users choose a single date without keeping a calendar permanently visible.
- Allow direct typing as well as selection from the calendar.
- Set formatPattern, minDate and maxDate to show the expected format and enforce valid dates.

### Don't use when

- Enter a start and end date as one interval. → [date-range-picker](dates.md#date-range-picker)
- Enter both a date and a time in one field. → [date-time-picker](dates.md#date-time-picker)
- Keep the calendar visible or select separate days. → [calendar](dates.md#calendar)
- Enter plain text without date or time parsing, or compose a custom picker with caller-owned value rules. → [input](forms.md#input), [picker-field](dates.md#picker-field)

Main exports: `DatePicker`, `formatPickerDate`, `parsePickerDate`.

```bash
npx shadcn add @petalo/date-picker
```

## date-range-picker

Enter a localized Gregorian start and end date as one interval.

### Use when

- Let users choose a contiguous date interval such as a booking or reporting period.
- Allow direct typing or selection of the start and end in the calendar.
- Set formatPattern, delimiter, minDate and maxDate to match the valid interval format and bounds.

### Don't use when

- Choose only one date. → [date-picker](dates.md#date-picker)
- Enter a date together with a time rather than a date interval. → [date-time-picker](dates.md#date-time-picker)
- Keep a calendar visible or select separate, non-contiguous days. → [calendar](dates.md#calendar)
- Enter plain text without date or time parsing, or compose a custom picker with caller-owned value rules. → [input](forms.md#input), [picker-field](dates.md#picker-field)

Main exports: `DateRangePicker`.

```bash
npx shadcn add @petalo/date-range-picker
```

## date-time-picker

Enter one localized Gregorian date and time together.

### Use when

- Let users specify both a date and a time for one event in a single field.
- Allow manual entry as well as calendar and clock selection; provide timezone context separately when needed.
- Set formatPattern for precision and minDate/maxDate for allowed dates; validate time restrictions in the caller.

### Don't use when

- Enter a date without a time. → [date-picker](dates.md#date-picker)
- Enter a time without a date. → [time-picker](dates.md#time-picker)
- Enter a start and end date as one interval. → [date-range-picker](dates.md#date-range-picker)
- Select dates in a permanently visible calendar without entering a time. → [calendar](dates.md#calendar)
- Enter plain text without date or time parsing, or compose a custom picker with caller-owned value rules. → [input](forms.md#input), [picker-field](dates.md#picker-field)

Main exports: `DateTimePicker`, `DateTimeSelection`.

```bash
npx shadcn add @petalo/date-time-picker
```

## picker-field

Compose a custom text field and picker with caller-owned value rules.

### Use when

- Let users type a custom value or choose it from a caller-supplied picker surface.
- Provide the picker content, text parsing and commit rules in the application.
- Supply value, open, onTextChange, onCommit and onOpenChange together with an icon and accessible picker labels.

### Don't use when

- Use built-in localized date, range, date-time or time parsing and selection. → [date-picker](dates.md#date-picker), [date-range-picker](dates.md#date-range-picker), [date-time-picker](dates.md#date-time-picker), [time-picker](dates.md#time-picker)
- Enter a plain single-line value without opening a picker. → [input](forms.md#input)

Main exports: `PickerField`, `PickerPopoverBody`, `examplePlaceholder`.

```bash
npx shadcn add @petalo/picker-field
```

## time-picker

Enter or select a localized time without a date.

### Use when

- Let users choose a time of day when the date is irrelevant or supplied separately.
- Allow direct typing as well as choosing hours, minutes and seconds in the picker.
- Set formatPattern to the required precision and 12-hour or 24-hour convention.

### Don't use when

- Enter both a date and a time together. → [date-time-picker](dates.md#date-time-picker)
- Enter plain text without date or time parsing, or compose a custom picker with caller-owned value rules. → [input](forms.md#input), [picker-field](dates.md#picker-field)

Main exports: `TimePicker`, `TimePickerClock`, `TimePickerFooter`, `TimeSelectionClocks`.

```bash
npx shadcn add @petalo/time-picker
```
