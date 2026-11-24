# Data

| Item | Summary |
| --- | --- |
| [analytical-table](#analytical-table) | Compare wide or large datasets in a virtualized Fiori grid with configurable column widths, order, visibility and freezing. |
| [data-table](#data-table) | Render data-driven responsive tables with TanStack columns, sorting and optional row virtualization. |
| [list](#list) | Present a sequence of business items for browsing, navigation or selection without column comparison. |
| [object-identifier](#object-identifier) | Identify a business object with a primary title and supporting identifier or attributes. |
| [object-number](#object-number) | Display a business amount or quantity together with its unit and optional semantic state. |
| [object-status](#object-status) | Show the semantic state of a business object with status text and an optional icon. |
| [table](#table) | Compose responsive rows and cells when users compare and act on business items. |
| [timeline](#timeline) | Present object events and changes in chronological order. |
| [tree](#tree) | Browse or select hierarchical items through expandable parent-child nodes. |
| [upload-collection](#upload-collection) | Manage prepared or uploaded files with per-file status and lifecycle actions. |

## analytical-table

Compare wide or large datasets in a virtualized Fiori grid with configurable column widths, order, visibility and freezing.

### Use when

- Keep identifying columns visible while users scroll horizontally through measures.
- Let users resize, reorder and hide columns with controlled layout state.
- Load additional rows on scroll and move secondary columns into the row at narrower widths.
- Use the experimental Customise API for protected cell content, header menu actions and layout replacements.

### Don't use when

- Render a lighter data-driven table with sorting and responsive pop-in. → [data-table](data.md#data-table)
- Compose static rows and cells directly in JSX. → [table](data.md#table)

Main exports: `AnalyticalTable`, `AnalyticalTableCell`, `AnalyticalTableHeaderCell`, `AnalyticalTableRow`.

```bash
npx shadcn add @petalo/analytical-table
```

## data-table

Render data-driven responsive tables with TanStack columns, sorting and optional row virtualization.

### Use when

- Let users sort and compare flat business records through data-driven columns.
- Use virtualization when roughly 200 loaded rows of average complexity would be exceeded; rethink the design above 1,000 rows rather than mounting them all.
- Filter data in the caller before passing results; this wrapper supplies column sorting, not built-in column-filter editors.
- Supply data and columns, stable getRowId for selection, and virtualize with fixed rowHeight and virtualHeight when rendering only visible rows.

### Don't use when

- Compare wide analytical datasets with resizable, reorderable or frozen columns. → [analytical-table](data.md#analytical-table)
- Compose JSX rows and cells without data-driven sorting, keeping roughly 200 loaded rows of average complexity and rethinking the design above 1,000. → [table](data.md#table)
- Browse a few attributes per item or read chronological object events without aligned column comparison. → [list](data.md#list), [timeline](data.md#timeline)
- Expand and collapse a parent-child hierarchy; this wrapper renders flat rows. → [tree](data.md#tree)
- Inspect or edit fields of one object rather than compare repeated records. → [form](forms.md#form)

Main exports: `DataTable`, `createDataTableColumnHelper`.

```bash
npx shadcn add @petalo/data-table
```

## list

Present a sequence of business items for browsing, navigation or selection without column comparison.

### Use when

- Let users browse, navigate or select business items with a few attributes per item.
- Group a flat collection without introducing expandable parent-child relationships.
- Show standard item text and supporting attributes, or provide custom content for the same item task.
- Use selectionMode="single" or "multiple" for choices and growing="button" or "scroll" with onLoadMore for incremental loading.

### Don't use when

- Compare aligned row attributes: Table suits roughly 200 loaded rows of average complexity without built-in sorting; DataTable supplies sorting and virtualization, with a design rethink above 1,000. → [table](data.md#table), [data-table](data.md#data-table)
- Browse nested parent-child relationships that users must expand or collapse. → [tree](data.md#tree)
- Choose one field value: Select covers 2–12 fixed options without typing (sort alphabetically above 8), and ComboBox covers type-ahead across 20–200. → [select](forms.md#select), [combobox](forms.md#combobox)
- Read events and changes to an object in chronological order. → [timeline](data.md#timeline)
- Retain business-event updates with unread states and per-event actions rather than browse ordinary records. → [notification-list](navigation.md#notification-list)

Main exports: `List`, `ListItem`, `ListItemCustom`, `ListItemGroup`, `ListItemGroupHeader`, `ListItemStandard`.

```bash
npx shadcn add @petalo/list
```

## object-identifier

Identify a business object with a primary title and supporting identifier or attributes.

### Use when

- Help users distinguish a specific business object by its name and supporting identifier.
- Keep the primary identifier visible in the first table column; use ObjectAttribute for supporting title-and-value details.
- Use titleActive with titleHref or onTitlePress when the primary identity navigates to object details.

### Don't use when

- Provide a single navigation label without a supporting object identifier. → [link](display.md#link)
- Name a page or section with heading semantics rather than identify a business object. → [title](display.md#title)

Main exports: `ObjectAttribute`, `ObjectIdentifier`.

```bash
npx shadcn add @petalo/object-identifier
```

## object-number

Display a business amount or quantity together with its unit and optional semantic state.

### Use when

- Help users read and compare business amounts or quantities without separating their units.
- Keep the unit beside the amount unless every row shares it, each cell contains one amount, and the column header stays visible.
- Use emphasized for the most important number; set emphasized={false} when all numbers are equally important.

### Don't use when

- Describe an object state in words or with an icon rather than an amount. → [object-status](data.md#object-status)
- Show how much of a running process is complete on a 0–100% scale. → [progress-indicator](display.md#progress-indicator)

Main exports: `ObjectNumber`.

```bash
npx shadcn add @petalo/object-number
```

## object-status

Show the semantic state of a business object with status text and an optional icon.

### Use when

- Help users assess the state of an item, process or workflow at a glance.
- Keep status text next to the business object it describes, including in table cells and list items.
- Use state for semantic meaning, and active when pressing the status opens related details.

### Don't use when

- Highlight a category or condition as a compact enclosed marker rather than a labeled object state. → [tag](display.md#tag)
- Show a business amount or quantity with its unit rather than a textual state. → [object-number](data.md#object-number)
- Explain a warning or status change that applies to a page or section. → [message-strip](display.md#message-strip)

Main exports: `ObjectStatus`.

```bash
npx shadcn add @petalo/object-status
```

## table

Compose responsive rows and cells when users compare and act on business items.

### Use when

- Let users inspect and act on independent business items with several attributes aligned in columns.
- Keep roughly 200 loaded rows of average complexity; complexity changes that guideline, and rethink the design above 1,000 rows.
- Compose custom cell content directly when data-driven column sorting is not needed.
- Use overflowMode="popin" for secondary columns on narrow screens; selectionMode="single" or "multi" enables row actions and growing requests more rows.

### Don't use when

- Generate columns from data, offer built-in sorting, or virtualize rows; rethink nonvirtualized loading beyond roughly 200 rows and the design above 1,000. → [data-table](data.md#data-table)
- Browse a few attributes per item without aligned column comparison. → [list](data.md#list)
- Expose expandable parent-child relationships rather than flat rows. → [tree](data.md#tree)
- Pick one of 2–12 predefined field values without inspecting row attributes; sort alphabetically above 8. → [select](forms.md#select)
- Inspect or edit fields of one object rather than compare independent rows. → [form](forms.md#form)

Main exports: `Table`, `TableCell`, `TableGroupRow`, `TableHeaderCell`, `TableHeaderRow`, `TableRow`, `TableRowAction`, `TableRowActionNavigation`, `defaultTableTexts`.

```bash
npx shadcn add @petalo/table
```

## timeline

Present object events and changes in chronological order.

### Use when

- Help users review when an object changed or an event occurred.
- Show read-only system events or recorded posts with names, timestamps and optional collapsible groups.
- Use growing="Button" or "Scroll" with onLoadMore when users need to retrieve further entries.

### Don't use when

- Browse independent items whose order is not a chronology. → [list](data.md#list)
- Compare event attributes in columns or sort a data-driven history. → [data-table](data.md#data-table)

Main exports: `Timeline`, `TimelineGroupItem`, `TimelineItem`.

```bash
npx shadcn add @petalo/timeline
```

## tree

Browse or select hierarchical items through expandable parent-child nodes.

### Use when

- Let users browse or select items in a meaningful parent-child hierarchy.
- Keep relationships visible through expansion and collapse instead of flattening them into group headers.
- Use selectionMode="single" or "multiple" for selection and onItemToggle for expansion; expanded and onExpandedChange control individual nodes.

### Don't use when

- Present flat items or only group headers with one item level. → [list](data.md#list)
- Choose one nonhierarchical field value: Select covers 2–12 fixed options without typing (sort alphabetically above 8), and ComboBox covers type-ahead across 20–200. → [select](forms.md#select), [combobox](forms.md#combobox)
- Compare flat record attributes in columns: Table suits roughly 200 loaded rows without built-in sorting; DataTable adds sorting and virtualization, with a design rethink above 1,000. → [table](data.md#table), [data-table](data.md#data-table)

Main exports: `Tree`, `TreeItem`, `TreeItemCustom`.

```bash
npx shadcn add @petalo/tree
```

## upload-collection

Manage prepared or uploaded files with per-file status and lifecycle actions.

### Use when

- Let users review a collection of attachments and remove, retry or terminate individual uploads.
- Use UploadCollectionItem uploadState and progress for per-file feedback; handle onDropFiles and upload transport in the application.
- Keep filenames, thumbnails and descriptive metadata together for files before or after upload.

### Don't use when

- Select local files for a form without showing or managing an attachment collection. → [file-uploader](forms.md#file-uploader)
- Inspect images or videos through thumbnails without upload lifecycle actions. → [media-gallery](display.md#media-gallery)

Main exports: `UploadCollection`, `UploadCollectionItem`.

```bash
npx shadcn add @petalo/upload-collection
```
