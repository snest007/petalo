# Overlays

| Item | Summary |
| --- | --- |
| [action-sheet](#action-sheet) | Offer a short list of labeled actions from one button, with a bottom-aligned sheet on phones. |
| [adapt-filters-dialog](#adapt-filters-dialog) | Personalize filter fields, their order and values in a staged dialog before applying changes. |
| [dialog](#dialog) | Pause the current task for a focused decision, confirmation or contained editing task. |
| [menu](#menu) | Let users choose commands from an opened hierarchy of menu items. |
| [message-box](#message-box) | Interrupt the current task to report an outcome or obtain a decision. |
| [popover](#popover) | Show information or actions tied to an opener without leaving the current page. |
| [responsive-popover](#responsive-popover) | Keep contextual content anchored on desktop and tablet, then show it in a full-screen phone dialog. |
| [select-dialog](#select-dialog) | Search and select from a list with its own dialog and confirmation flow. |
| [toast](#toast) | Confirm a completed action or provide information in a non-disruptive message that disappears automatically. |
| [use-is-phone](#use-is-phone) | Reactive UI5-style touch/phone detection with a data-fiori-device override. |
| [user-menu](#user-menu) | Expose signed-in user information, user-specific actions and sign out from the profile entry point. |
| [user-settings-dialog](#user-settings-dialog) | Let users inspect their account and review or change settings in categories. |
| [value-help-dialog](#value-help-dialog) | Find business values through a searchable result table or define filter conditions in a dialog. |
| [view-settings-dialog](#view-settings-dialog) | Adjust a list or table view through sorting, grouping and predefined filter choices. |

## action-sheet

Offer a short list of labeled actions from one button, with a bottom-aligned sheet on phones.

### Use when

- Keep a short list of labeled actions anchored to its trigger on larger screens.
- Move those actions into a bottom-aligned dialog with Cancel on phones.

### Don't use when

- Commands need submenus or should follow the standard Fiori menu pattern. → [menu](overlays.md#menu)
- The overlay contains contextual fields or other mixed content. → [responsive-popover](overlays.md#responsive-popover)

Main exports: `ActionSheet`.

```bash
npx shadcn add @petalo/action-sheet
```

## adapt-filters-dialog

Personalize filter fields, their order and values in a staged dialog before applying changes.

### Use when

- Let users choose which filters appear in the filter bar and change their order.
- Let users find filters by name or group and edit conditions even for fields hidden from the bar.
- Use filters with render functions for condition editors, and handle onApply to commit values and visibleKeys.

### Don't use when

- Adjust sorting, grouping or predefined filter values for a list or table without personalizing filter fields. → [view-settings-dialog](overlays.md#view-settings-dialog)
- Edit currently visible criteria inline without changing filter visibility or order. → [filter-bar](navigation.md#filter-bar)
- Choose business values from a searchable result table or define conditions for one field. → [value-help-dialog](overlays.md#value-help-dialog)

Main exports: `AdaptFiltersDialog`.

```bash
npx shadcn add @petalo/adapt-filters-dialog
```

## dialog

Pause the current task for a focused decision, confirmation or contained editing task.

### Use when

- Ask users to confirm an action or supply input before returning to the main screen.
- Keep a contained editing task in a modal window when the surrounding page must remain blocked.
- Use state="negative" or "critical" for an alert dialog that needs immediate attention.

### Don't use when

- Show contextual content beside an opener. Use ResponsivePopover for a full-screen surface on phones. → [popover](overlays.md#popover), [responsive-popover](overlays.md#responsive-popover)
- Offer a hierarchy of commands without a form or confirmation task. → [menu](overlays.md#menu)
- Confirm a completed action transiently without requiring a response. → [toast](overlays.md#toast)
- Keep a contextual message visible alongside otherwise usable page content. → [message-strip](display.md#message-strip)
- Ask for a short confirmation or report an outcome with standard actions. → [message-box](overlays.md#message-box)

Main exports: `Dialog`, `DialogBody`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogTitle`, `DialogTrigger`.

```bash
npx shadcn add @petalo/dialog
```

## menu

Let users choose commands from an opened hierarchy of menu items.

### Use when

- Offer related commands from a button or contextual opener instead of navigating to another page.
- Group commands and expose submenus when actions have a hierarchy.
- Use MenuGroup checkMode="single" or "multiple" when menu commands represent checked choices.

### Don't use when

- Offer destination links from one opener. → [navigation-menu](navigation.md#navigation-menu)
- Make the common command available immediately beside the menu arrow. → [split-button](actions.md#split-button)
- Show mixed contextual information beside an opener or in a phone dialog. → [popover](overlays.md#popover), [responsive-popover](overlays.md#responsive-popover)
- Require a form or explicit confirmation before users resume the page. → [dialog](overlays.md#dialog)
- Show the signed-in user, account information, user settings and sign-out actions. → [user-menu](overlays.md#user-menu)

Main exports: `Menu`, `MenuContent`, `MenuGroup`, `MenuItem`, `MenuSeparator`, `MenuSub`, `MenuSubContent`, `MenuSubTrigger`, `MenuTrigger`.

```bash
npx shadcn add @petalo/menu
```

## message-box

Interrupt the current task to report an outcome or obtain a decision.

### Use when

- Ask for a short confirmation or show a semantic error with a small action set.
- Use useMessageBox for local Promise-based confirmation flows.

### Don't use when

- Collect input or show a dialog with a custom workflow. → [dialog](overlays.md#dialog)
- Give inline contextual guidance or brief nonblocking feedback. → [message-strip](display.md#message-strip), [toast](overlays.md#toast)

Main exports: `MessageBox`.

```bash
npx shadcn add @petalo/message-box
```

## popover

Show information or actions tied to an opener without leaving the current page.

### Use when

- Let users inspect details for a list item or edit related information while staying in context.
- Place lightweight content beside the element it describes and keep the background available.
- Add a header or footer only when the content needs a title or an action.

### Don't use when

- Require explicit input or confirmation and block interaction with the surrounding page. → [dialog](overlays.md#dialog)
- Present contextual content that takes more than one-third of the phone screen. → [responsive-popover](overlays.md#responsive-popover)
- Offer commands in menu rows or submenus rather than mixed contextual content. → [menu](overlays.md#menu)
- Keep selected-object details in a dedicated area beside the list. → [master-detail](floorplans.md#master-detail)

Main exports: `Popover`, `PopoverAnchor`, `PopoverBody`, `PopoverClose`, `PopoverContent`, `PopoverFooter`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger`.

```bash
npx shadcn add @petalo/popover
```

## responsive-popover

Keep contextual content anchored on desktop and tablet, then show it in a full-screen phone dialog.

### Use when

- Let users inspect or edit information related to an opener across desktop, tablet and phone.
- Use it when contextual content would take more than one-third of the phone screen.
- Provide a phone title and closing action through headerText and closeLabel, or replace the phone bars with phoneHeader and phoneFooter.

### Don't use when

- Keep lightweight contextual content anchored on every device and within one-third of the phone screen. → [popover](overlays.md#popover)
- Require a focused modal task and explicit confirmation on desktop as well as phone. → [dialog](overlays.md#dialog)
- Show commands in menu rows or submenus without mixed contextual content. → [menu](overlays.md#menu)
- Show a bottom-aligned list of actions with Cancel on phones. → [action-sheet](overlays.md#action-sheet)

Main exports: `ResponsivePopover`, `ResponsivePopoverAnchor`, `ResponsivePopoverContent`, `ResponsivePopoverTrigger`.

```bash
npx shadcn add @petalo/responsive-popover
```

## select-dialog

Search and select from a list with its own dialog and confirmation flow.

### Use when

- Choose one list item immediately or confirm several choices together.
- Show a focused list of suggestions with a separate search task.

### Don't use when

- Search several attributes in a results table or define conditions and ranges. → [value-help-dialog](overlays.md#value-help-dialog)
- Pick a suggestion by typing from an inline field. → [combobox](forms.md#combobox)

Main exports: `SelectDialog`.

```bash
npx shadcn add @petalo/select-dialog
```

## toast

Confirm a completed action or provide information in a non-disruptive message that disappears automatically.

### Use when

- Reassure users that an action completed without asking them to respond.
- Show information users can understand without leaving their current task.
- Adjust duration when needed; the default is 3000 milliseconds and the minimum is 500.

### Don't use when

- Keep a contextual message visible alongside otherwise usable page content. → [message-strip](display.md#message-strip)
- Explain an empty or unavailable content area with an illustration and recovery action. → [illustrated-message](display.md#illustrated-message)
- Require an explicit response. Use MessageBox for standard actions, or Dialog for a custom workflow. → [dialog](overlays.md#dialog), [message-box](overlays.md#message-box)
- Retain business-event updates so users can read, act on or dismiss them later. → [notification-list](navigation.md#notification-list)

Main exports: `Toast`.

```bash
npx shadcn add @petalo/toast
```

## use-is-phone

Reactive UI5-style touch/phone detection with a data-fiori-device override.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `useIsPhone`.

```bash
npx shadcn add @petalo/use-is-phone
```

## user-menu

Expose signed-in user information, user-specific actions and sign out from the profile entry point.

### Use when

- Let users inspect the current account and access settings, legal information or other user-specific actions.
- Open the account menu from the shell bar profile entry point without leaving the current page.
- Set showManageAccount only when a central profile-management destination exists.

### Don't use when

- Organize editable preferences across categories. → [user-settings-dialog](overlays.md#user-settings-dialog)
- Offer general object or page commands without signed-in user information. → [menu](overlays.md#menu)
- Let users switch between products rather than access their current user settings. → [product-switch](navigation.md#product-switch)

Main exports: `UserMenu`, `UserMenuItem`.

```bash
npx shadcn add @petalo/user-menu
```

## user-settings-dialog

Let users inspect their account and review or change settings in categories.

### Use when

- Group several user preferences by category and keep their settings in the same dialog.
- Open the preferences from a Settings action in UserMenu.

### Don't use when

- Show account information alongside sign-out and other short actions. → [user-menu](overlays.md#user-menu)
- Ask the user to confirm one independent operation. → [dialog](overlays.md#dialog)

Main exports: `UserSettingsAccountView`, `UserSettingsAppearanceView`, `UserSettingsDialog`, `UserSettingsNotificationsView`, `UserSettingsView`.

```bash
npx shadcn add @petalo/user-settings-dialog
```

## value-help-dialog

Find business values through a searchable result table or define filter conditions in a dialog.

### Use when

- Let users find business values among more than 200 entries or identify them by several searchable attributes.
- Let users select one or several matching records, or define ranges and filter conditions.
- Keep a distinct search-and-confirm task when a suggestion label alone cannot identify the right value.
- Supply columns, items and keyField; use selectionMode="multiple" with supportConditions for ranges, and onSearch for caller-filtered results.

### Don't use when

- Pick one of 2–12 predefined values without other attributes (sort alphabetically above 8), or enter text without a selection/search task. → [select](forms.md#select), [input](forms.md#input)
- Choose one suggestion by type-ahead across 20–200 options or accept free text without a separate search task. → [combobox](forms.md#combobox)
- Choose simple records in a searchable list dialog, or select several predefined values inline without conditions. → [multi-combobox](forms.md#multi-combobox), [select-dialog](overlays.md#select-dialog)
- Enter several caller-validated tokens, including values from datasets above 200, without a separate multiattribute search task. → [multi-input](forms.md#multi-input)
- Personalize which filter fields appear, their order and conditions across fields rather than select values for one field. → [adapt-filters-dialog](overlays.md#adapt-filters-dialog)

Main exports: `ValueHelpDialog`, `formatCondition`.

```bash
npx shadcn add @petalo/value-help-dialog
```

## view-settings-dialog

Adjust a list or table view through sorting, grouping and predefined filter choices.

### Use when

- Let users choose how a list or table is sorted without leaving its current page.
- Let users select grouping criteria and predefined filter values, then confirm the combined settings.
- Provide sortItems, groupItems and filterItems only for the settings the view supports.

### Don't use when

- Personalize filter-field visibility or order and edit conditions beyond predefined filter values. → [adapt-filters-dialog](overlays.md#adapt-filters-dialog)
- Set several criteria in a result-page header, as in a list report. → [filter-bar](navigation.md#filter-bar)
- Save and switch reusable table or filter settings rather than adjust only the current view. → [variant-management](navigation.md#variant-management)

Main exports: `ViewSettingsDialog`.

```bash
npx shadcn add @petalo/view-settings-dialog
```
