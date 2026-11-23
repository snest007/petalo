# Layout

| Item | Summary |
| --- | --- |
| [dynamic-page](#dynamic-page) | Compose a page with a structured title, collapsing header, scrolling content and optional finalizing footer. |
| [dynamic-side-content](#dynamic-side-content) | Keep supplementary context beside or below the main task without covering its content. |
| [flexible-column-layout](#flexible-column-layout) | Show up to three related pages in responsive list, detail and sub-detail columns. |
| [navigation-layout](#navigation-layout) | Compose a full-screen header, vertical navigation and page content with responsive navigation visibility. |
| [object-page](#object-page) | Compose one object’s categorized details with a dynamic header and anchor or tab navigation. |
| [page](#page) | Hold one application screen with a header bar, scrolling content and optional floating or fixed footer. |
| [splitter-layout](#splitter-layout) | Give users control over the space shared by adjacent content panes. |

## dynamic-page

Compose a page with a structured title, collapsing header, scrolling content and optional finalizing footer.

### Use when

- Work with business content while keeping essential context and page actions available as the header collapses.
- Build a freestyle full-screen page or a page inside one FlexibleColumnLayout column.
- Keep filters or supporting header information accessible through expansion and pinning; leave page actions available when the header is snapped.

### Don't use when

- Need only a header bar, scrolling content and footer without structured collapsing header content. → [page](layout.md#page)
- Organize one object into sections with anchor or tab navigation. → [object-page](layout.md#object-page)
- Start from a complete record-search page with saved filters, results and mass actions. → [list-report](floorplans.md#list-report)
- Show a product-home greeting or hero that scrolls away (5.75rem/92px minimum height; 24rem/384px recommended maximum). → [hero-banner](display.md#hero-banner)

Main exports: `DynamicPage`, `DynamicPageHeader`, `DynamicPageTitle`.

```bash
npx shadcn add @petalo/dynamic-page
```

## dynamic-side-content

Keep supplementary context beside or below the main task without covering its content.

### Use when

- Consult relevant supporting information while completing a task that remains possible without the side content.
- Let supporting content move below the main area as the container narrows instead of overlaying it.
- At widths of 720px or less, provide a toggleContents() trigger for hidden side content, or set sideContentVisibility="alwaysShow" to keep it below the main area.

### Don't use when

- Navigate between a record list, selected object and related sub-object as separate pages. → [flexible-column-layout](layout.md#flexible-column-layout)
- Place application navigation beside page content under a shared header. → [navigation-layout](layout.md#navigation-layout)
- Show essential object attributes or finalizing actions that users must access to complete the task. → [object-page](layout.md#object-page)

Main exports: `DynamicSideContent`.

```bash
npx shadcn add @petalo/dynamic-side-content
```

## flexible-column-layout

Show up to three related pages in responsive list, detail and sub-detail columns.

### Use when

- Browse a record list, its selected object and a related sub-object while retaining their relationship.
- Keep related pages adjacent when space permits: one column at 599px or less, up to two at 600–1023px and up to three at 1024px or more; resized columns stay at least 248px wide.
- Use useFlexibleColumnLayout to coordinate navigation levels and full-screen, exit-full-screen and close actions in a custom page composition.

### Don't use when

- Resize adjacent content panes without coordinating list and detail navigation. → [splitter-layout](layout.md#splitter-layout)
- Show noncritical supporting context beside or below one task instead of navigating between related pages. → [dynamic-side-content](layout.md#dynamic-side-content)
- Start from a complete searchable list, selected detail and sub-detail example. → [master-detail](floorplans.md#master-detail)
- Read or edit one object across sections without a list-detail navigation hierarchy. → [object-page](layout.md#object-page)
- Switch between application sections through vertical navigation. → [navigation-layout](layout.md#navigation-layout)

Main exports: `FlexibleColumnLayout`, `useFlexibleColumnLayout`.

```bash
npx shadcn add @petalo/flexible-column-layout
```

## navigation-layout

Compose a full-screen header, vertical navigation and page content with responsive navigation visibility.

### Use when

- Move between application sections through vertical navigation while keeping the current page beside it.
- Compose the header, navigation and content regions of an application screen yourself.
- Use mode="auto" to collapse navigation below 600px; wire onModeChange to close expanded navigation after selection on these screens.

### Don't use when

- Need navigation items only inside an application frame that already exists. → [side-navigation](navigation.md#side-navigation)
- Start from a wired frame with search, notifications, user menu and product switching. → [app-shell](floorplans.md#app-shell)
- Start from an application-entry scaffold with selected navigation and page placeholders. → [launchpad](floorplans.md#launchpad)
- Keep a record list and its selected detail visible as related pages. → [flexible-column-layout](layout.md#flexible-column-layout)
- Show supplementary context rather than application navigation beside a task. → [dynamic-side-content](layout.md#dynamic-side-content)

Main exports: `NavigationLayout`.

```bash
npx shadcn add @petalo/navigation-layout
```

## object-page

Compose one object’s categorized details with a dynamic header and anchor or tab navigation.

### Use when

- Read or edit one object’s details while moving between its categorized sections.
- Keep object identity, essential attributes and actions above related forms, item lists and notes.
- Use mode="anchor" for a continuous page or mode="tabs" to show one section at a time.

### Don't use when

- Show only one section without editable header content or section navigation. → [dynamic-page](layout.md#dynamic-page), [page](layout.md#page)
- Start from a complete display/edit page with sample fields, items, notes and Save/Cancel handling. → [object-page-floorplan](floorplans.md#object-page-floorplan)
- Find records with filters or keep a list beside its selected detail. → [list-report](floorplans.md#list-report), [flexible-column-layout](layout.md#flexible-column-layout)
- Guide unfamiliar object creation through 3–8 validated steps and a review screen. → [wizard-page](floorplans.md#wizard-page)
- Add noncritical contextual information beside existing object content instead of making it an object section. → [dynamic-side-content](layout.md#dynamic-side-content)

Main exports: `ObjectPage`, `ObjectPageHeader`, `ObjectPageHeaderFacet`, `ObjectPageSection`, `ObjectPageSubSection`.

```bash
npx shadcn add @petalo/object-page
```

## page

Hold one application screen with a header bar, scrolling content and optional floating or fixed footer.

### Use when

- Complete a task on one screen while keeping its header and footer separate from the scrolling content.
- Provide a page container without an expandable, structured header.
- Give the parent a fixed height; use noScrolling when a child owns scrolling and fixedFooter when the footer must dock below content.

### Don't use when

- Keep filters or structured context in a header that collapses while the page content scrolls. → [dynamic-page](layout.md#dynamic-page)
- Organize one object’s details with section navigation and an object header. → [object-page](layout.md#object-page)
- Start from a complete guided creation page with 3–8 steps, validation and review. → [wizard-page](floorplans.md#wizard-page)

Main exports: `Page`.

```bash
npx shadcn add @petalo/page
```

## splitter-layout

Give users control over the space shared by adjacent content panes.

### Use when

- Resize a preview beside an editor or above a related panel.
- Set a minimum size on panes that need to remain usable while resizing.

### Don't use when

- Navigate among responsive list, detail and sub-detail pages. → [flexible-column-layout](layout.md#flexible-column-layout)

Main exports: `SplitterElement`, `SplitterLayout`.

```bash
npx shadcn add @petalo/splitter-layout
```
