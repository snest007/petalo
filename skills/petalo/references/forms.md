# Forms

| Item | Summary |
| --- | --- |
| [checkbox](#checkbox) | Select independent options, including choices reviewed before submission. |
| [color-palette](#color-palette) | Choose a predefined color from swatches kept visible in the page. |
| [color-palette-popover](#color-palette-popover) | Choose a predefined color in an on-demand anchored surface. |
| [color-picker](#color-picker) | Choose an arbitrary color visually or enter its channel values. |
| [combobox](#combobox) | Choose one suggested value by typing, with filtering and optional free-text entry. |
| [file-uploader](#file-uploader) | Select local files for a caller-managed upload flow. |
| [form](#form) | Arrange related labels and fields for one record in responsive groups. |
| [input](#input) | Enter one line of text, a number or a formatted string. |
| [label](#label) | Give a form field a persistent, accessible name. |
| [multi-combobox](#multi-combobox) | Select several predefined options from a filterable list and display selections as tokens. |
| [multi-input](#multi-input) | Collect several values as caller-managed tokens, with suggestions and optional value help. |
| [numeric-input](#numeric-input) | Edit a localized number in a plain textbox with keyboard stepping. |
| [radio-group](#radio-group) | Choose one mutually exclusive answer while keeping every option visible. |
| [rating-indicator](#rating-indicator) | Collect an icon-based rating or display an aggregate rating. |
| [select](#select) | Choose one value from a short predefined list without entering free text. |
| [slider](#slider) | Adjust one value or a numeric interval along a visual scale. |
| [step-input](#step-input) | Enter an exact number or adjust it by a predefined step. |
| [switch](#switch) | Turn a setting on or off with an immediate effect. |
| [textarea](#textarea) | Enter editable prose across multiple lines. |
| [token](#token) | Represent one previously selected value as a selectable, removable item. |
| [tokenizer](#tokenizer) | Manage keyboard navigation, selection and overflow for existing tokens. |

## checkbox

Select independent options, including choices reviewed before submission.

### Use when

- Let users select or deselect independent options or accept an unambiguous statement.
- Keep all options visible when users need to compare them before choosing.
- Collect changes that users review and confirm before submission.
- Use checked="indeterminate" for a parent option when only some child options are selected.

### Don't use when

- Apply an on/off setting immediately. → [switch](forms.md#switch)
- Choose exactly one answer from a visible set. → [radio-group](forms.md#radio-group)
- Activate or deactivate a secondary toolbar feature. → [toggle-button](actions.md#toggle-button)
- Run an explicit action rather than select an option. → [button](actions.md#button)
- Adjust a numeric value along a visual scale rather than choose categorical options. → [slider](forms.md#slider)

Main exports: `Checkbox`.

```bash
npx shadcn add @petalo/checkbox
```

## color-palette

Choose a predefined color from swatches kept visible in the page.

### Use when

- Let users choose from predefined colors while keeping the swatches visible.
- Keep each swatch tied to its fixed color rather than changing it with the theme.
- Enable showDefaultColor, showRecentColors or showMoreColors only when those choices are allowed.

### Don't use when

- Show predefined colors only after opening a contextual chooser. → [color-palette-popover](forms.md#color-palette-popover)
- Choose an arbitrary color or enter its channel values directly. → [color-picker](forms.md#color-picker)

Main exports: `ColorPalette`, `ColorPaletteItem`.

```bash
npx shadcn add @petalo/color-palette
```

## color-palette-popover

Choose a predefined color in an on-demand anchored surface.

### Use when

- Let users open a contextual chooser to select a predefined color.
- Keep the swatches near the opener while preserving space in the page.
- Enable showMoreColors when users may choose a color outside the supplied palette.

### Don't use when

- Keep predefined color swatches visible without opening a surface. → [color-palette](forms.md#color-palette)
- Work directly with arbitrary colors or channel values rather than start from swatches. → [color-picker](forms.md#color-picker)

Main exports: `ColorPalettePopover`.

```bash
npx shadcn add @petalo/color-palette-popover
```

## color-picker

Choose an arbitrary color visually or enter its channel values.

### Use when

- Let users choose a color beyond a predefined set of swatches.
- Support visual selection and direct hexadecimal, RGB or HSL channel entry.
- Use simplified when users need only visual selection and hexadecimal entry.

### Don't use when

- Choose only predefined colors that stay visible in the page. → [color-palette](forms.md#color-palette)
- Choose predefined colors in an on-demand anchored chooser. → [color-palette-popover](forms.md#color-palette-popover)

Main exports: `ColorPicker`.

```bash
npx shadcn add @petalo/color-picker
```

## combobox

Choose one suggested value by typing, with filtering and optional free-text entry.

### Use when

- Let users find one suggested value by typing, typically across 20–200 options.
- Use the picker arrow to show choices before the user types. Validate the committed value when selection from the list is required.
- Keep selection in a field when one suggestion label is enough to identify the value.
- Choose filter for the supplied ComboBoxItem entries; onCommit receives text and onSelectionChange reports a matched item or null.

### Don't use when

- Choose one of 2–12 predefined options without typing or free text; sort alphabetically above 8. Use Input for free text with optional suggestions. → [select](forms.md#select), [input](forms.md#input)
- Collect several values: fewer than 200 predefined options need MultiComboBox; free-form, caller-validated entries or datasets above 200 need MultiInput. → [multi-combobox](forms.md#multi-combobox), [multi-input](forms.md#multi-input)
- Find a value above 200 entries, search several attributes, or define conditions in a separate search task. → [value-help-dialog](overlays.md#value-help-dialog)
- Browse business items with List or expand a hierarchy with Tree rather than choose a field value. → [list](data.md#list), [tree](data.md#tree)
- Submit a content-search query with optional scopes rather than choose a field value. → [search](navigation.md#search)

Main exports: `ComboBox`, `ComboBoxItem`, `ComboBoxItemGroup`.

```bash
npx shadcn add @petalo/combobox
```

## file-uploader

Select local files for a caller-managed upload flow.

### Use when

- Let users choose a local file, or drop files into a field, for upload.
- Prefer it for single-file selection; let the application perform the upload and report its outcome.
- Use accept to filter the native chooser and maxFileSize to reject oversized selections; validate file types, including dropped files, in the caller.

### Don't use when

- Manage an existing collection with individual deletion, upload status and retry actions. → [upload-collection](data.md#upload-collection)
- Run an action unrelated to selecting files. → [button](actions.md#button)

Main exports: `FileUploader`.

```bash
npx shadcn add @petalo/file-uploader
```

## form

Arrange related labels and fields for one record in responsive groups.

### Use when

- Let users inspect or edit related fields of one record in a consistent layout.
- Group fields by meaning and keep their labels aligned as available width changes.
- Use accessibleMode="edit" for editable fields; the default display mode presents label-value pairs.

### Don't use when

- Compare repeated records in rows rather than fields of one record. → [table](data.md#table), [data-table](data.md#data-table)
- Guide users through 3–8 steps: use Wizard within an existing page or Wizard Page for a complete creation page. → [wizard](navigation.md#wizard), [wizard-page](floorplans.md#wizard-page)
- Submit or validate data automatically; provide caller-owned submission and validation.

Main exports: `Form`, `FormGroup`, `FormItem`.

```bash
npx shadcn add @petalo/form
```

## input

Enter one line of text, a number or a formatted string.

### Use when

- Let users enter a name, number, password, URL, phone number or email address in one line.
- Keep a visible field label; use a placeholder only for a hint or example.
- Use valueState and valueStateMessage to explain validation issues and how to resolve them.
- Offer optional suggestions while allowing a free-text value with showSuggestions and SuggestionItem. On phones, edit in a full-screen dialog.

### Don't use when

- Enter prose across multiple lines. → [textarea](forms.md#textarea)
- Enter a date, range or time, or provide a custom picker with caller-owned parsing. → [date-picker](dates.md#date-picker), [date-range-picker](dates.md#date-range-picker), [date-time-picker](dates.md#date-time-picker), [time-picker](dates.md#time-picker), [picker-field](dates.md#picker-field)
- Choose one predefined value: use Select for 2–12 options, ComboBox for type-ahead across 20–200 options, or ValueHelpDialog above 200 entries or for several searchable attributes. → [select](forms.md#select), [combobox](forms.md#combobox), [value-help-dialog](overlays.md#value-help-dialog)
- Edit a locale-aware number with NumericInput, use StepInput for increment and decrement buttons, or use Slider for a visual scale. → [numeric-input](forms.md#numeric-input), [step-input](forms.md#step-input), [slider](forms.md#slider)
- Collect several values: use MultiComboBox for fewer than 200 predefined options, or MultiInput for caller-validated entries and datasets above 200. → [multi-combobox](forms.md#multi-combobox), [multi-input](forms.md#multi-input)

Main exports: `Input`, `InputIcon`, `SuggestionItem`, `SuggestionItemGroup`.

```bash
npx shadcn add @petalo/input
```

## label

Give a form field a persistent, accessible name.

### Use when

- Let users identify a field before entering or selecting its value.
- Keep the label visible while the field contains data; a placeholder does not replace it.
- Connect htmlFor to the field id and use required to show a required-field marker.

### Don't use when

- Present prose that does not name a field. → [text](display.md#text)
- Introduce a page, section or group heading. → [title](display.md#title)

Main exports: `Label`.

```bash
npx shadcn add @petalo/label
```

## multi-combobox

Select several predefined options from a filterable list and display selections as tokens.

### Use when

- Let users select several predefined values from fewer than 200 options while typing narrows the list.
- Keep selected values visible as tokens and prevent unmatched text from becoming selected options.
- Offer selection of the whole set only when it helps the task.
- Control selectedValues with onSelectionChange separately from typed value; noValidation allows unmatched text but does not select it.

### Don't use when

- Choose one value: Select covers 2–12 fixed options without typing (sort alphabetically above 8), ComboBox covers type-ahead across 20–200, and Input covers text without suggestions. → [select](forms.md#select), [combobox](forms.md#combobox), [input](forms.md#input)
- Collect arbitrary or caller-validated entries, or work with a dataset above 200; provide caller-managed tokens and optional value help. → [multi-input](forms.md#multi-input)
- Search above 200 business entries by several attributes or define ranges and conditions. → [value-help-dialog](overlays.md#value-help-dialog)
- Navigate and remove existing tokens without adding values through a choice list. → [tokenizer](forms.md#tokenizer)

Main exports: `MultiComboBox`, `MultiComboBoxItem`, `MultiComboBoxItemGroup`.

```bash
npx shadcn add @petalo/multi-combobox
```

## multi-input

Collect several values as caller-managed tokens, with suggestions and optional value help.

### Use when

- Let users collect several free-form or application-validated values, including choices from datasets above 200.
- Offer suggestions or connect a separate value-help surface when users need help identifying an entry.
- Keep creation and validation of tokens in the application; the field does not choose a predefined option set for the caller.
- Create tokens in onCommit, supply tokens and handle onTokenDelete; showValueHelpIcon and onValueHelpTrigger connect a caller-supplied surface.

### Don't use when

- Select only predefined options from fewer than 200 values and let the control manage selected option tokens. → [multi-combobox](forms.md#multi-combobox)
- Collect one value: use Input for free text with optional suggestions, ComboBox for type-ahead across 20–200, or Select for 2–12 fixed options without typing (sort alphabetically above 8). → [input](forms.md#input), [combobox](forms.md#combobox), [select](forms.md#select)
- Provide the actual search across several attributes or condition editor, especially above 200 entries; the field only opens the caller-supplied surface. → [value-help-dialog](overlays.md#value-help-dialog)
- Inspect and remove existing tokens without entering new values. → [tokenizer](forms.md#tokenizer)

Main exports: `MultiInput`, `SuggestionItem`.

```bash
npx shadcn add @petalo/multi-input
```

## numeric-input

Edit a localized number in a plain textbox with keyboard stepping.

### Use when

- Enter quantities, rates or other numbers with locale-aware grouping, decimal places and bounds.
- Allow direct editing with keyboard stepping and retain invalid entries for correction.

### Don't use when

- Show increment and decrement buttons alongside the editable value. → [step-input](forms.md#step-input)
- Enter identifiers, postal codes or phone numbers, where leading zeros and exact characters matter. → [input](forms.md#input)

Main exports: `NumericInput`.

```bash
npx shadcn add @petalo/numeric-input
```

## radio-group

Choose one mutually exclusive answer while keeping every option visible.

### Use when

- Let users compare visible answers and select exactly one.
- Keep option labels clear enough to distinguish the mutually exclusive choices.
- Provide an accessible group name and a label for every RadioGroupItem.

### Don't use when

- Select independent options or multiple answers. → [checkbox](forms.md#checkbox)
- Collapse a predefined list of 2–12 options instead of showing every answer; sort alphabetically above 8. → [select](forms.md#select)
- Switch compact related view or setting options rather than answer a form question. → [segmented-button](actions.md#segmented-button)
- Run an explicit action rather than select an answer. → [button](actions.md#button)
- Adjust a numeric value along a visual scale rather than choose categorical options. → [slider](forms.md#slider)

Main exports: `RadioGroup`, `RadioGroupItem`.

```bash
npx shadcn add @petalo/radio-group
```

## rating-indicator

Collect an icon-based rating or display an aggregate rating.

### Use when

- Let users evaluate an item with a row of rating icons.
- Show an average or overall rating without editing it using displayOnly.
- Name the rating subject clearly so users understand what they are evaluating.

### Don't use when

- Adjust a numeric setting along a continuous or stepped range. → [slider](forms.md#slider)

Main exports: `RatingIndicator`.

```bash
npx shadcn add @petalo/rating-indicator
```

## select

Choose one value from a short predefined list without entering free text.

### Use when

- Let users choose one predefined value from 2–12 options without entering free text.
- Keep options collapsed when users do not need to compare every answer at once.
- Order options meaningfully; sort alphabetically when there are more than 8 options.
- Offer a useful initial choice with defaultValue, or control value with onValueChange.

### Don't use when

- Narrow one choice by typing, typically across 20–200 options, or accept free text with suggestions; use Input when no suggestions or choice list is needed. → [combobox](forms.md#combobox), [input](forms.md#input)
- Collect several values: fewer than 200 predefined options need MultiComboBox; caller-validated entries or datasets above 200 need MultiInput. → [multi-combobox](forms.md#multi-combobox), [multi-input](forms.md#multi-input)
- Find a value above 200 entries, search several attributes, or define conditions. → [value-help-dialog](overlays.md#value-help-dialog)
- Keep every form answer visible with RadioGroup, change compact related views with SegmentedButton, or create and manage saved views with VariantManagement. → [radio-group](forms.md#radio-group), [segmented-button](actions.md#segmented-button), [variant-management](navigation.md#variant-management)
- Browse business items with List, expand a hierarchy with Tree, or inspect repeated row attributes with Table rather than choose a field value. → [list](data.md#list), [tree](data.md#tree), [table](data.md#table)

Main exports: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectSeparator`, `SelectTrigger`, `SelectValue`.

```bash
npx shadcn add @petalo/select
```

## slider

Adjust one value or a numeric interval along a visual scale.

### Use when

- Let users adjust settings such as volume or brightness without typing an exact number.
- Use Slider for one value and RangeSlider for lower and upper bounds.
- Show the current value, unit and scale bounds so the adjustment has a clear meaning.
- Set min, max and step to the valid range and required precision; use showTooltip for handle values.

### Don't use when

- Enter an exact quantity using explicit increment and decrement controls. → [step-input](forms.md#step-input)
- Enter a number without needing a visual scale. → [input](forms.md#input)
- Choose categorical answers rather than a numeric value. → [radio-group](forms.md#radio-group), [checkbox](forms.md#checkbox)
- Give an icon-based evaluation such as a star rating. → [rating-indicator](forms.md#rating-indicator)

Main exports: `RangeSlider`, `Slider`.

```bash
npx shadcn add @petalo/slider
```

## step-input

Enter an exact number or adjust it by a predefined step.

### Use when

- Let users enter a quantity precisely or increase and decrease it in predictable increments.
- Support direct number entry as well as the step buttons and keyboard.
- Set min, max, step and valuePrecision to match valid business quantities.

### Don't use when

- Enter a localized number with keyboard stepping and no visible step buttons. → [numeric-input](forms.md#numeric-input)
- Adjust a value approximately along a visual range, such as volume or brightness. → [slider](forms.md#slider)
- Enter a static identifier such as a postal code or phone number. → [input](forms.md#input)

Main exports: `StepInput`.

```bash
npx shadcn add @petalo/step-input
```

## switch

Turn a setting on or off with an immediate effect.

### Use when

- Let users turn a setting on or off and see the change take effect immediately.
- Place a descriptive label above or before the switch so both states have a clear meaning.
- Prefer the default icons over text inside the track to avoid localization problems.

### Don't use when

- Review settings before submission, select independent options or express an ambiguous on/off statement. → [checkbox](forms.md#checkbox)
- Activate or deactivate a secondary toolbar feature. → [toggle-button](actions.md#toggle-button)

Main exports: `Switch`.

```bash
npx shadcn add @petalo/switch
```

## textarea

Enter editable prose across multiple lines.

### Use when

- Let users write comments, descriptions or other text that needs multiple lines.
- Keep a visible label and enough visible rows to understand the text being edited.
- Use growing and growingMaxRows for expansion, or maxLength with counterMode when a character limit matters.

### Don't use when

- Enter a value that fits on one line. → [input](forms.md#input)
- Read prose that is already fully visible and cannot be edited. → [text](display.md#text)
- Read prose with an in-place option to reveal more text. → [expandable-text](display.md#expandable-text)

Main exports: `TextArea`.

```bash
npx shadcn add @petalo/textarea
```

## token

Represent one previously selected value as a selectable, removable item.

### Use when

- Let users recognize and remove a value they have already selected.
- Keep each token label concise and specific to the selected value.
- Use readOnly when the selected value must remain visible without a delete action.

### Don't use when

- Navigate, select or delete a group of selected values with overflow handling. → [tokenizer](forms.md#tokenizer)
- Show a category or status label that is not a removable selection. → [tag](display.md#tag)

Main exports: `Token`.

```bash
npx shadcn add @petalo/token
```

## tokenizer

Manage keyboard navigation, selection and overflow for existing tokens.

### Use when

- Let users inspect, select and remove a group of values already represented by tokens.
- Keep overflowed values reachable through the more-items indicator.
- Remove caller-owned tokens in onTokenDelete after users request deletion.

### Don't use when

- Enter new free-form or caller-validated values with optional suggestions. → [multi-input](forms.md#multi-input)
- Add values from a predefined filterable option list. → [multi-combobox](forms.md#multi-combobox)
- Show only one independently managed selected value. → [token](forms.md#token)

Main exports: `Tokenizer`.

```bash
npx shadcn add @petalo/tokenizer
```
