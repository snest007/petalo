# Navigation

| Item | Summary |
| --- | --- |
| [bar](#bar) | Arrange page or dialog header and footer content in start, centered and end areas. |
| [breadcrumbs](#breadcrumbs) | Show the current location and let users return to ancestors in the navigation path. |
| [f6-navigation](#f6-navigation) | Opt-in UI5 fast navigation between page groups, with scoped roots, Popup containers, shadows and slots. |
| [filter-bar](#filter-bar) | Let users limit a result collection by several criteria in the page header. |
| [navigation-menu](#navigation-menu) | Offer related navigation destinations from a single opener. |
| [notification-list](#notification-list) | Collect business-event updates that users may read, act on or dismiss without interrupting their task. |
| [product-switch](#product-switch) | Let users choose another product from a grid of labeled product entries. |
| [search](#search) | Find content by submitting a query, optionally with scopes and suggestions. |
| [shell-bar](#shell-bar) | Provide a consistent product header with branding and global entry points. |
| [side-navigation](#side-navigation) | Provide the main navigation between modules or destinations within a product. |
| [tabs](#tabs) | Switch between content facets or prominent filtered views within the current page. |
| [toolbar](#toolbar) | Group related actions and controls in a horizontal row with keyboard navigation and responsive overflow. |
| [variant-management](#variant-management) | Save, select and maintain named views of filter or table personalization settings. |
| [variants](#variants) | Controlled FilterBar view state, Save/Save As and Manage operations, default views and an optional localStorage persistence adapter. |
| [wizard](#wizard) | Guide users through a task in reachable steps inside an existing page or custom workflow. |

## bar

Arrange page or dialog header and footer content in start, centered and end areas.

### Use when

- Keep a title centered while navigation or actions occupy the start and end of a header or footer.
- Place page-level footer actions in a footer or floating footer.
- Use design="header", "subheader", "footer" or "floating-footer" to match the surrounding region.

### Don't use when

- Group related actions with arrow-key navigation and responsive overflow. → [toolbar](navigation.md#toolbar)
- Provide a universal product header with branding, global search, notifications and profile access. → [shell-bar](navigation.md#shell-bar)

Main exports: `Bar`.

```bash
npx shadcn add @petalo/bar
```

## breadcrumbs

Show the current location and let users return to ancestors in the navigation path.

### Use when

- Help users understand their location after drilling down and return to an ancestor.
- Use a consistent hierarchy across pages; for fixed hierarchies, show the same path regardless of how users arrived.

### Don't use when

- Choose application modules or primary destinations rather than return along a location path. → [side-navigation](navigation.md#side-navigation)
- Switch between content facets within the current page. → [tabs](navigation.md#tabs)

Main exports: `Breadcrumbs`, `BreadcrumbsItem`.

```bash
npx shadcn add @petalo/breadcrumbs
```

## f6-navigation

Opt-in UI5 fast navigation between page groups, with scoped roots, Popup containers, shadows and slots.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `installF6Navigation`, `useF6Navigation`.

```bash
npx shadcn add @petalo/f6-navigation
```

## filter-bar

Let users limit a result collection by several criteria in the page header.

### Use when

- Help users narrow objects in a list report or other result page using several filter criteria.
- Let users combine a keyword search with typed fields, then inspect the active-filter summary.
- Use liveMode for updates after committed condition changes; otherwise use onGo for manual search.

### Don't use when

- Filter a table inside an object-page section rather than a result-page header. → [view-settings-dialog](overlays.md#view-settings-dialog)
- Find items in a list using only a keyword query. → [search](navigation.md#search)
- Personalize only filter-field visibility, order and conditions in a separate dialog. → [adapt-filters-dialog](overlays.md#adapt-filters-dialog)
- Manage named saved views rather than edit the current filter criteria. → [variant-management](navigation.md#variant-management)
- Guide users through data-entry steps rather than filter a result collection. → [wizard](navigation.md#wizard)

Main exports: `FilterBar`, `FilterBarItem`, `FilterBarToggle`, `filterExpandedSummary`, `filterSummary`.

```bash
npx shadcn add @petalo/filter-bar
```

## navigation-menu

Offer related navigation destinations from a single opener.

### Use when

- Group destinations into nested submenus.
- Show native links, including destinations that open in a new tab.

### Don't use when

- Show action commands or checkable options. → [menu](overlays.md#menu)
- Keep the application's destinations visible beside the page. → [side-navigation](navigation.md#side-navigation)

Main exports: `NavigationMenu`, `NavigationMenuItem`.

```bash
npx shadcn add @petalo/navigation-menu
```

## notification-list

Collect business-event updates that users may read, act on or dismiss without interrupting their task.

### Use when

- Keep users informed about relevant reminders, alerts or workflow updates they can revisit.
- Group related events and distinguish unread state and importance so users can decide what needs attention.
- Provide item actions or dismissal only when they are useful for the event.

### Don't use when

- Confirm a completed action transiently without keeping an event collection. → [toast](overlays.md#toast)
- Browse ordinary business items rather than event-triggered updates. → [list](data.md#list)

Main exports: `NotificationList`, `NotificationListGroupItem`, `NotificationListItem`.

```bash
npx shadcn add @petalo/notification-list
```

## product-switch

Let users choose another product from a grid of labeled product entries.

### Use when

- Give users access to other products from the shell bar product-switch entry point.
- Identify each destination with a product title and optional subtitle, icon or image.

### Don't use when

- Navigate modules or destinations within the current product. → [side-navigation](navigation.md#side-navigation)
- Inspect the signed-in user or access account settings and sign out. → [user-menu](overlays.md#user-menu)

Main exports: `ProductSwitch`, `ProductSwitchItem`.

```bash
npx shadcn add @petalo/product-switch
```

## search

Find content by submitting a query, optionally with scopes and suggestions.

### Use when

- Let users find content or business objects by typing a query instead of browsing every item.
- Offer product-wide or cross-product search from the shell bar, or keyword search within a list.
- Group suggestions with SearchItemGroup; when no results page exists and a group exceeds five results, use action to offer progressive loading.

### Don't use when

- Narrow a result collection by several separate criteria rather than a keyword alone. → [filter-bar](navigation.md#filter-bar)
- Choose one suggested field value rather than submit a content-search query. → [combobox](forms.md#combobox)

Main exports: `Search`, `SearchItem`, `SearchItemGroup`, `ShellBarSearch`.

```bash
npx shadcn add @petalo/search
```

## shell-bar

Provide a consistent product header with branding and global entry points.

### Use when

- Let users recognize the product and reach global search, notifications, profile and other products from every screen.
- Keep global functions available while the page content or navigation target changes.
- Provide search through ShellBarSearch and use profile, notification and product-switch callbacks to open the appropriate surfaces.

### Don't use when

- Group actions that apply to page content or selected table items. → [toolbar](navigation.md#toolbar)
- Arrange a local page or dialog header/footer in start, center and end areas without global product functions. → [bar](navigation.md#bar)

Main exports: `ShellBar`, `ShellBarBadge`, `ShellBarBranding`, `ShellBarItem`, `ShellBarMenuButton`, `ShellBarSpacer`.

```bash
npx shadcn add @petalo/shell-bar
```

## side-navigation

Provide the main navigation between modules or destinations within a product.

### Use when

- Let users move between multiple application destinations from a persistent vertical navigation.
- Group related destinations and expose sub-items when the navigation has a hierarchy.
- Label the first destination Home and link it to the entry page; keep any footer action focused on the essential task.

### Don't use when

- Offer related destinations from a single opener without a persistent sidebar. → [navigation-menu](navigation.md#navigation-menu)
- Switch facets of content within one page rather than application destinations. → [tabs](navigation.md#tabs)
- Switch to a different product rather than navigate within the current one. → [product-switch](navigation.md#product-switch)
- Show the current location and return to ancestors in its navigation path. → [breadcrumbs](navigation.md#breadcrumbs)
- Arrange the shell, navigation and content regions rather than provide navigation items. → [navigation-layout](layout.md#navigation-layout)

Main exports: `SideNavigation`, `SideNavigationGroup`, `SideNavigationItem`, `SideNavigationSubItem`.

```bash
npx shadcn add @petalo/side-navigation
```

## tabs

Switch between content facets or prominent filtered views within the current page.

### Use when

- Let users browse different facets of a business object without leaving its page.
- Offer prominent filters above a list, optionally with counts for all items and each filtered view.
- Use overflowMode="startAndEnd" when tabs represent process states whose order must stay visible.

### Don't use when

- Choose compact related options that change the same view or setting rather than distinct content sections. → [segmented-button](actions.md#segmented-button)
- Navigate application modules or primary destinations rather than facets within one page. → [side-navigation](navigation.md#side-navigation)
- Guide users through task steps and control which steps they can reach. → [wizard](navigation.md#wizard)
- Show a location path and let users return to its ancestors. → [breadcrumbs](navigation.md#breadcrumbs)

Main exports: `Tabs`, `TabsContent`, `TabsList`, `TabsSeparator`, `TabsTrigger`.

```bash
npx shadcn add @petalo/tabs
```

## toolbar

Group related actions and controls in a horizontal row with keyboard navigation and responsive overflow.

### Use when

- Let users act on page content or selected items from one labeled group of controls.
- Keep secondary controls reachable through an overflow popover when the available width shrinks.
- Use overflowPriority="neverOverflow" on ToolbarButton or ToolbarItem for main actions that must remain visible.

### Don't use when

- Arrange a header or footer with independent start, centered and end content without toolbar navigation or overflow. → [bar](navigation.md#bar)
- Provide product branding and global search, notifications or profile access on every screen. → [shell-bar](navigation.md#shell-bar)

Main exports: `Toolbar`, `ToolbarButton`, `ToolbarItem`, `ToolbarSeparator`, `ToolbarSpacer`.

```bash
npx shadcn add @petalo/toolbar
```

## variant-management

Save, select and maintain named views of filter or table personalization settings.

### Use when

- Let users return to recurring combinations of filter values or table settings through saved views.
- Let users organize views through naming, favorites, defaults and sharing when the application supports them.
- Handle onSelect, onSave and onManage in the host application; this control does not persist or retrieve view settings itself.

### Don't use when

- Choose one of 2–12 fixed predefined views without creating or managing saved settings; sort alphabetically above 8. → [select](forms.md#select)
- Edit current filter criteria without saving or managing reusable views. → [filter-bar](navigation.md#filter-bar)
- Adjust sorting, grouping or predefined filter values for the current view without saving it. → [view-settings-dialog](overlays.md#view-settings-dialog)

Main exports: `VariantManagement`.

```bash
npx shadcn add @petalo/variant-management
```

## variants

Controlled FilterBar view state, Save/Save As and Manage operations, default views and an optional localStorage persistence adapter.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `STANDARD_VARIANT_KEY`, `localStorageAdapter`, `useVariantState`.

```bash
npx shadcn add @petalo/variants
```

## wizard

Guide users through a task in reachable steps inside an existing page or custom workflow.

### Use when

- Help users complete a complex task by dividing it into guided steps; a wizard page typically has 3–8 steps.
- Let users revisit reached steps while the application keeps unreached steps disabled until their prerequisites are met.
- Use contentLayout="multipleSteps" to stack reached sections or "singleStep" to show only the selected section.

### Don't use when

- Start from a complete page with step validation, footer actions and a review/submit screen. → [wizard-page](floorplans.md#wizard-page)
- Edit fields together without needing a guided step sequence. → [form](forms.md#form)
- Browse independent content facets without controlling task progress. → [tabs](navigation.md#tabs)
- Narrow a result collection by filter criteria rather than complete a guided task. → [filter-bar](navigation.md#filter-bar)
- Trigger a standalone action without collecting inputs or tracking task steps. → [button](actions.md#button)

Main exports: `Wizard`, `WizardStep`.

```bash
npx shadcn add @petalo/wizard
```
