import { expect, test } from "@playwright/test"
import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { build } from "vite"
import ts from "typescript"

// Filled from the actual consumer coverage attachments. Each owning test checks
// that its assigned public points still execute; the inventory test rejects a
// new functional declaration without a real consumer proof.
const customizationProofs = {
  "AnalyticalTable.className": "analytical-table-custom",
  "AnalyticalTable.NoDataComponent": "analytical-table-custom",
  "AnalyticalTable.LoadingComponent": "analytical-table-custom",
  "AnalyticalTable.renderRowSubComponent": "analytical-table-custom",
  "AnalyticalTableRow.className": "analytical-table-custom",
  "AnalyticalTableRow.children": "analytical-table-custom",
  "AnalyticalTableCell.className": "analytical-table-custom",
  "AnalyticalTableCell.children": "analytical-table-custom",
  "AnalyticalTableHeaderCell.className": "analytical-table-custom",
  "AnalyticalTableHeaderCell.children": "analytical-table-custom",
  "SelectDialog.className": "select-dialog",
  "SelectDialog.renderItem": "select-dialog",
  "SplitterLayout.className": "splitter-layout",
  "SplitterLayout.children": "splitter-layout",
  "SplitterElement.className": "splitter-layout",
  "SplitterElement.children": "splitter-layout",
  "Input.children": "h7-input-custom",
  "SuggestionItem.className": "h7-input-custom",
  "SuggestionItem.renderContent": "h7-input-custom",
  "SuggestionItemGroup.children": "h7-input-custom",
  "SuggestionItemGroup.className": "h7-input-custom",
  "MessageBox.className": "h7-message-box-custom",
  "MessageBox.children": "h7-message-box-custom",
  "MessageBox.icon": "h7-message-box-custom",
  "ToolbarButton.badge": "h8-badge-custom",
  "ToggleButton.badge": "h8-badge-custom",
  "SplitButton.menu": "split-button",
  "SplitButton.className": "split-button",
  "SplitButton.children": "split-button",
  "NumericInput.className": "numeric-input",
  "ButtonBadge.className": "button-badge",
  "Button.badge": "button-badge",
  "AdaptFiltersDialog.className": "adapt-filter-custom",
  "Avatar.badge": "shell-bar",
  "Avatar.className": "shell-bar",
  "AvatarGroup.children": "avatar",
  "AvatarGroup.className": "avatar",
  "AvatarGroup.overflowButton": "avatar",
  "Bar.children": "page",
  "Bar.className": "page",
  "Bar.endContent": "page",
  "Bar.startContent": "bar",
  "Breadcrumbs.children": "dynamic-page",
  "Breadcrumbs.className": "dynamic-page",
  "BreadcrumbsItem.children": "dynamic-page",
  "BreadcrumbsItem.className": "dynamic-page",
  "BusyIndicator.children": "busy-indicator",
  "BusyIndicator.className": "busy-indicator",
  "Button.asChild": "adapt-filter-custom",
  "Button.children": "adapt-filter-custom",
  "Button.className": "adapt-filter-custom",
  "Calendar.className": "date-picker",
  "Calendar.legend": "calendar",
  "CalendarLegend.children": "calendar",
  "CalendarLegend.className": "calendar",
  "CalendarLegendItem.className": "calendar",
  "Card.children": "card",
  "Card.className": "card",
  "CardContent.children": "card",
  "CardContent.className": "card",
  "CardHeader.action": "card",
  "CardHeader.additionalText": "card",
  "CardHeader.avatar": "card",
  "CardHeader.className": "card",
  "CardHeader.subtitleText": "card",
  "CardHeader.titleText": "card",
  "Carousel.children": "carousel",
  "Carousel.className": "carousel",
  "Checkbox.className": "checkbox",
  "Checkbox.text": "checkbox",
  "ColorPalette.children": "color-picker",
  "ColorPalette.className": "color-picker",
  "ColorPaletteItem.className": "color-picker",
  "ColorPalettePopover.children": "color-palette-popover",
  "ColorPalettePopover.className": "color-palette-popover",
  "ColorPicker.className": "color-picker",
  "ComboBox.children": "combobox",
  "ComboBox.className": "combobox",
  "ComboBox.valueStateMessage": "combobox",
  "ComboBox.wrapperClassName": "combobox",
  "ComboBoxItemGroup.children": "combobox",
  "DataTable.className": "data-table-empty",
  "DataTable.columns.cell": "data-table-custom",
  "DataTable.columns.header": "data-table-empty",
  "DataTable.noData": "data-table-empty",
  "DataTable.rowActions": "data-table-custom",
  "DatePicker.className": "date-picker",
  "DatePicker.valueStateMessage": "date-picker",
  "DatePicker.wrapperClassName": "date-picker",
  "DateRangePicker.className": "date-range-picker",
  "DateRangePicker.valueStateMessage": "date-range-picker",
  "DateRangePicker.wrapperClassName": "date-range-picker",
  "DateTimePicker.className": "date-time-picker",
  "DateTimePicker.valueStateMessage": "date-time-picker",
  "DateTimePicker.wrapperClassName": "date-time-picker",
  "Dialog.children": "popup-controls-custom",
  "DialogBody.children": "dialog",
  "DialogBody.className": "dialog",
  "DialogClose.asChild": "popup-controls-custom",
  "DialogClose.children": "popup-controls-custom",
  "DialogClose.className": "popup-controls-custom",
  "DialogContent.asChild": "popup-controls-custom",
  "DialogContent.children": "popup-controls-custom",
  "DialogContent.className": "popup-controls-custom",
  "DialogDescription.asChild": "popup-controls-custom",
  "DialogDescription.children": "popup-controls-custom",
  "DialogDescription.className": "popup-controls-custom",
  "DialogFooter.children": "dialog",
  "DialogFooter.className": "dialog",
  "DialogHeader.children": "dialog",
  "DialogHeader.className": "dialog",
  "DialogOverlay.asChild": "popup-controls-custom",
  "DialogOverlay.children": "popup-controls-custom",
  "DialogOverlay.className": "popup-controls-custom",
  "DialogTitle.asChild": "popup-controls-custom",
  "DialogTitle.children": "popup-controls-custom",
  "DialogTitle.className": "popup-controls-custom",
  "DialogTrigger.asChild": "popup-controls-custom",
  "DialogTrigger.children": "popup-controls-custom",
  "DialogTrigger.className": "popup-controls-custom",
  "DynamicPage.children": "dynamic-page",
  "DynamicPage.className": "dynamic-page",
  "DynamicPage.contentClassName": "dynamic-page",
  "DynamicPage.footer": "dynamic-page",
  "DynamicPage.header": "dynamic-page",
  "DynamicPage.subheader": "dynamic-page",
  "DynamicPage.title": "dynamic-page",
  "DynamicPageHeader.children": "dynamic-page",
  "DynamicPageHeader.className": "dynamic-page",
  "DynamicPageTitle.actions": "object-page",
  "DynamicPageTitle.breadcrumbs": "dynamic-page",
  "DynamicPageTitle.children": "dynamic-page",
  "DynamicPageTitle.className": "object-page",
  "DynamicPageTitle.heading": "object-page",
  "DynamicPageTitle.navigationActions": "object-page",
  "DynamicPageTitle.snappedHeading": "object-page",
  "DynamicPageTitle.snappedSubheading": "object-page",
  "DynamicPageTitle.subheading": "object-page",
  "DynamicSideContent.children": "dynamic-side-content",
  "DynamicSideContent.className": "dynamic-side-content",
  "DynamicSideContent.sideContent": "dynamic-side-content",
  "ExpandableText.className": "expandable-text",
  "FileUploader.className": "file-uploader",
  "FileUploader.valueStateMessage": "file-uploader",
  "FilterBar.children": "filter-bar",
  "FilterBar.className": "filter-bar",
  "FilterBar.variant": "filter-bar",
  "FilterBar.variantManagement": "filter-bar",
  "FilterBarItem.children": "filter-bar",
  "FilterBarItem.className": "filter-bar",
  "FilterBarItem.label": "filter-bar",
  "FilterBarToggle.className": "render-helpers-custom",
  "FilterDefinition.render": "adapt-filter-custom",
  "FlexibleColumnLayout.className": "flexible-column-layout",
  "FlexibleColumnLayout.endColumn": "flexible-column-layout",
  "FlexibleColumnLayout.midColumn": "flexible-column-layout",
  "FlexibleColumnLayout.startColumn": "flexible-column-layout",
  "Form.children": "object-page",
  "Form.className": "object-page",
  "Form.header": "object-page",
  "FormGroup.children": "form",
  "FormGroup.className": "form",
  "FormItem.children": "object-page",
  "FormItem.className": "object-page",
  "FormItem.label": "object-page",
  "HeroBanner.actions": "hero-banner",
  "HeroBanner.children": "hero-banner",
  "HeroBanner.className": "hero-banner",
  "HeroBanner.endContent": "hero-banner",
  "Icon.className": "upload-collection",
  "IllustratedMessage.children": "illustrated-message",
  "IllustratedMessage.className": "illustrated-message",
  "IllustratedMessage.subtitleText": "illustrated-message",
  "IllustratedMessage.titleText": "illustrated-message",
  "Input.className": "adapt-filter-custom",
  "Input.icon": "adapt-filter-custom",
  "Input.valueStateMessage": "adapt-filter-custom",
  "Input.wrapperClassName": "adapt-filter-custom",
  "InputIcon.children": "adapt-filter-custom",
  "InputIcon.className": "adapt-filter-custom",
  "Label.asChild": "toolbar",
  "Label.children": "toolbar",
  "Label.className": "toolbar",
  "Link.children": "link",
  "Link.className": "link",
  "List.children": "render-helpers-custom",
  "List.className": "render-helpers-custom",
  "List.header": "render-helpers-custom",
  "ListItem.additionalText": "render-helpers-custom",
  "ListItem.children": "select-slots-custom",
  "ListItem.className": "render-helpers-custom",
  "ListItem.description": "render-helpers-custom",
  "ListItem.image": "render-helpers-custom",
  "ListItem.text": "render-helpers-custom",
  "ListItemCustom.children": "tabs",
  "ListItemCustom.className": "tabs",
  "ListItemGroup.children": "list",
  "ListItemGroup.className": "list",
  "ListItemGroup.header": "list",
  "ListItemGroupHeader.children": "list",
  "ListItemGroupHeader.className": "list",
  "ListItemStandard.additionalText": "render-helpers-custom",
  "ListItemStandard.children": "select-slots-custom",
  "ListItemStandard.className": "render-helpers-custom",
  "ListItemStandard.description": "render-helpers-custom",
  "ListItemStandard.image": "render-helpers-custom",
  "ListItemStandard.text": "render-helpers-custom",
  "MediaGallery.children": "media-gallery",
  "MediaGallery.className": "media-gallery",
  "MediaGallery.overflowText": "media-gallery",
  "MediaGalleryItem.children": "media-gallery",
  "MediaGalleryItem.className": "media-gallery",
  "MediaGalleryItem.thumbnail": "media-gallery",
  "Menu.children": "side-navigation",
  "MenuContent.asChild": "side-navigation",
  "MenuContent.children": "side-navigation",
  "MenuContent.className": "side-navigation",
  "MenuGroup.asChild": "side-navigation",
  "MenuGroup.children": "side-navigation",
  "MenuGroup.className": "side-navigation",
  "MenuItem.additionalText": "side-navigation",
  "MenuItem.asChild": "side-navigation",
  "MenuItem.children": "side-navigation",
  "MenuItem.className": "side-navigation",
  "MenuSeparator.asChild": "select-slots-custom",
  "MenuSeparator.children": "select-slots-custom",
  "MenuSeparator.className": "menu",
  "MenuSub.children": "side-navigation",
  "MenuSubContent.asChild": "side-navigation",
  "MenuSubContent.children": "side-navigation",
  "MenuSubContent.className": "side-navigation",
  "MenuSubTrigger.asChild": "side-navigation",
  "MenuSubTrigger.children": "side-navigation",
  "MenuSubTrigger.className": "side-navigation",
  "MenuTrigger.asChild": "menu",
  "MenuTrigger.children": "menu",
  "MenuTrigger.className": "menu",
  "MessageStrip.children": "message-strip",
  "MessageStrip.className": "message-strip",
  "MessageStrip.icon": "message-strip",
  "MultiComboBox.children": "multi-combobox",
  "MultiComboBox.className": "multi-combobox",
  "MultiComboBox.valueStateMessage": "multi-combobox",
  "MultiComboBox.wrapperClassName": "multi-combobox",
  "MultiComboBoxItemGroup.children": "multi-combobox",
  "MultiInput.children": "render-helpers-custom",
  "MultiInput.className": "render-helpers-custom",
  "MultiInput.tokens": "multi-input",
  "MultiInput.valueStateMessage": "render-helpers-custom",
  "MultiInput.wrapperClassName": "render-helpers-custom",
  "NavigationLayout.children": "navigation-layout",
  "NavigationLayout.className": "navigation-layout",
  "NavigationLayout.header": "navigation-layout",
  "NavigationLayout.sideContent": "navigation-layout",
  "NotificationList.children": "notification-list",
  "NotificationList.className": "notification-list",
  "NotificationListGroupItem.children": "notification-list",
  "NotificationListGroupItem.className": "notification-list",
  "NotificationListItem.avatar": "notification-list",
  "NotificationListItem.children": "notification-list",
  "NotificationListItem.className": "notification-list",
  "NotificationListItem.footnotes": "notification-list",
  "NotificationListItem.menu": "notification-list",
  "ObjectAttribute.className": "object-status",
  "ObjectAttribute.text": "object-status",
  "ObjectAttribute.title": "object-status",
  "ObjectIdentifier.className": "object-status",
  "ObjectIdentifier.text": "object-status",
  "ObjectIdentifier.title": "object-status",
  "ObjectNumber.className": "object-status",
  "ObjectNumber.number": "object-status",
  "ObjectNumber.unit": "object-status",
  "ObjectPage.children": "object-page",
  "ObjectPage.className": "object-page",
  "ObjectPage.contentClassName": "object-page",
  "ObjectPage.footer": "object-page",
  "ObjectPage.header": "object-page",
  "ObjectPage.title": "object-page",
  "ObjectPageHeader.avatar": "object-page",
  "ObjectPageHeader.children": "object-page",
  "ObjectPageHeader.className": "object-page",
  "ObjectPageHeaderFacet.children": "object-page",
  "ObjectPageHeaderFacet.className": "object-page",
  "ObjectPageHeaderFacet.title": "object-page",
  "ObjectPageSection.children": "object-page",
  "ObjectPageSection.className": "object-page",
  "ObjectPageSubSection.actions": "object-page",
  "ObjectPageSubSection.children": "object-page",
  "ObjectPageSubSection.className": "object-page",
  "ObjectStatus.className": "object-status",
  "ObjectStatus.text": "object-status",
  "ObjectStatus.title": "object-status",
  "Page.children": "page",
  "Page.className": "page",
  "Page.footer": "page",
  "Page.header": "page",
  "Panel.children": "panel",
  "Panel.className": "panel",
  "Panel.contentClassName": "panel",
  "Panel.header": "panel",
  "Panel.headerText": "panel",
  "PickerField.children": "picker-field-custom",
  "PickerField.className": "picker-field-custom",
  "PickerField.footer": "picker-field-custom",
  "PickerField.phoneFooter": "picker-field-custom",
  "PickerField.popoverClassName": "picker-field-custom",
  "PickerField.valueStateMessage": "picker-field-custom",
  "PickerField.wrapperClassName": "picker-field-custom",
  "PickerPopoverBody.children": "time-picker",
  "PickerPopoverBody.footer": "time-picker",
  "PickerPopoverBody.message": "select-slots-custom",
  "Popover.children": "render-helpers-custom",
  "PopoverAnchor.asChild": "popover",
  "PopoverAnchor.children": "popover",
  "PopoverAnchor.className": "popover",
  "PopoverBody.children": "popover",
  "PopoverBody.className": "popover",
  "PopoverClose.asChild": "render-helpers-custom",
  "PopoverClose.children": "render-helpers-custom",
  "PopoverClose.className": "render-helpers-custom",
  "PopoverContent.asChild": "render-helpers-custom",
  "PopoverContent.children": "render-helpers-custom",
  "PopoverContent.className": "render-helpers-custom",
  "PopoverFooter.children": "popover",
  "PopoverFooter.className": "popover",
  "PopoverHeader.children": "popover",
  "PopoverHeader.className": "popover",
  "PopoverTitle.children": "popover",
  "PopoverTitle.className": "popover",
  "PopoverTrigger.asChild": "render-helpers-custom",
  "PopoverTrigger.children": "render-helpers-custom",
  "PopoverTrigger.className": "render-helpers-custom",
  "ProductSwitch.children": "product-switch",
  "ProductSwitch.className": "product-switch",
  "ProductSwitchItem.className": "product-switch",
  "ProductSwitchItem.image": "product-switch",
  "ProgressIndicator.className": "progress-indicator",
  "RadioGroup.asChild": "radio-group",
  "RadioGroup.children": "radio-group",
  "RadioGroup.className": "radio-group",
  "RadioGroupItem.className": "radio-group",
  "RadioGroupItem.text": "radio-group",
  "RangeSlider.className": "slider",
  "RatingIndicator.className": "rating-indicator",
  "ResponsivePopover.children": "responsive-custom",
  "ResponsivePopoverAnchor.asChild": "responsive-custom",
  "ResponsivePopoverAnchor.children": "responsive-custom",
  "ResponsivePopoverAnchor.className": "responsive-custom",
  "ResponsivePopoverContent.asChild": "responsive-custom",
  "ResponsivePopoverContent.children": "responsive-custom",
  "ResponsivePopoverContent.className": "responsive-custom",
  "ResponsivePopoverContent.phoneClassName": "responsive-custom",
  "ResponsivePopoverContent.phoneFooter": "responsive-custom",
  "ResponsivePopoverContent.phoneHeader": "responsive-custom",
  "ResponsivePopoverTrigger.asChild": "responsive-custom",
  "ResponsivePopoverTrigger.children": "responsive-custom",
  "ResponsivePopoverTrigger.className": "responsive-custom",
  "Search.action": "search",
  "Search.children": "search",
  "Search.className": "search",
  "SearchItem.actions": "search",
  "SearchItem.className": "search",
  "SearchItem.image": "search",
  "SearchItemGroup.children": "search",
  "SearchItemGroup.className": "search",
  "SegmentedButton.children": "segmented-button",
  "SegmentedButton.className": "segmented-button",
  "SegmentedButtonItem.asChild": "segmented-button",
  "SegmentedButtonItem.children": "segmented-button",
  "SegmentedButtonItem.className": "segmented-button",
  "SegmentedButtonItem.icon": "segmented-button",
  "Select.children": "select",
  "SelectContent.children": "select",
  "SelectContent.className": "select",
  "SelectGroup.asChild": "select",
  "SelectGroup.children": "select",
  "SelectGroup.className": "select",
  "SelectItem.asChild": "select",
  "SelectItem.children": "select",
  "SelectItem.className": "select",
  "SelectLabel.asChild": "select",
  "SelectLabel.children": "select",
  "SelectLabel.className": "select",
  "SelectSeparator.asChild": "select-slots-custom",
  "SelectSeparator.children": "select-slots-custom",
  "SelectSeparator.className": "select-slots-custom",
  "SelectTrigger.children": "select",
  "SelectTrigger.className": "select",
  "SelectTrigger.valueStateMessage": "select",
  "SelectTrigger.wrapperClassName": "select",
  "SelectValue.asChild": "select-slots-custom",
  "SelectValue.children": "select-slots-custom",
  "SelectValue.className": "select",
  "SelectValue.placeholder": "select-slots-custom",
  "ShellBar.assistant": "shell-bar",
  "ShellBar.branding": "shell-bar",
  "ShellBar.children": "shell-bar",
  "ShellBar.className": "shell-bar",
  "ShellBar.content": "shell-bar",
  "ShellBar.profile": "shell-bar",
  "ShellBar.search": "shell-bar",
  "ShellBar.startButton": "shell-bar",
  "ShellBarBadge.className": "render-helpers-custom",
  "ShellBarBranding.children": "shell-bar",
  "ShellBarBranding.className": "shell-bar",
  "ShellBarBranding.logo": "shell-bar",
  "ShellBarItem.className": "shell-bar",
  "ShellBarMenuButton.children": "shell-bar",
  "ShellBarMenuButton.className": "shell-bar",
  "ShellBarMenuButton.logo": "shell-bar",
  "ShellBarMenuButton.menu": "shell-bar",
  "ShellBarMenuButton.secondaryTitle": "shell-bar",
  "ShellBarSearch.action": "shell-bar",
  "ShellBarSearch.children": "select-slots-custom",
  "ShellBarSearch.className": "shell-bar",
  "SideNavigation.children": "side-navigation",
  "SideNavigation.className": "side-navigation",
  "SideNavigation.fixedItems": "side-navigation",
  "SideNavigation.header": "side-navigation",
  "SideNavigationGroup.children": "side-navigation",
  "SideNavigationGroup.className": "side-navigation",
  "SideNavigationItem.children": "side-navigation",
  "SideNavigationItem.className": "side-navigation",
  "SideNavigationItem.tag": "side-navigation",
  "SideNavigationSubItem.className": "side-navigation",
  "SideNavigationSubItem.tag": "side-navigation",
  "Slider.className": "slider",
  "StepInput.className": "step-input",
  "StepInput.valueStateMessage": "step-input",
  "StepInput.wrapperClassName": "step-input",
  "Switch.className": "switch",
  "Table.children": "render-helpers-custom",
  "Table.className": "render-helpers-custom",
  "Table.noData": "render-helpers-custom",
  "TableCell.children": "table",
  "TableCell.className": "table",
  "TableGroupRow.children": "table",
  "TableGroupRow.className": "table",
  "TableHeaderCell.action": "render-helpers-custom",
  "TableHeaderCell.children": "render-helpers-custom",
  "TableHeaderCell.className": "render-helpers-custom",
  "TableHeaderRow.children": "render-helpers-custom",
  "TableHeaderRow.className": "render-helpers-custom",
  "TableRow.actions": "table",
  "TableRow.children": "table",
  "TableRow.className": "table",
  "Tabs.children": "tabs",
  "Tabs.className": "tabs",
  "Tabs.overflowButton": "tabs",
  "Tabs.startOverflowButton": "tabs",
  "TabsContent.children": "tabs",
  "TabsContent.className": "tabs",
  "TabsList.children": "tabs",
  "TabsList.className": "tabs",
  "TabsSeparator.children": "select-slots-custom",
  "TabsSeparator.className": "tabs",
  "TabsTrigger.additionalText": "tabs",
  "TabsTrigger.children": "tabs",
  "TabsTrigger.className": "tabs",
  "Tag.children": "tag",
  "Tag.className": "tag",
  "Tag.icon": "tag",
  "Text.children": "wizard",
  "Text.className": "wizard",
  "TextArea.className": "textarea",
  "TextArea.valueStateMessage": "textarea",
  "TextArea.wrapperClassName": "textarea",
  "TimePicker.className": "time-picker",
  "TimePicker.valueStateMessage": "time-picker",
  "TimePicker.wrapperClassName": "time-picker",
  "TimeSelectionClocks.className": "time-picker",
  "Timeline.children": "timeline",
  "Timeline.className": "timeline",
  "Timeline.header": "timeline",
  "Timeline.infoBar": "timeline",
  "TimelineGroupItem.children": "timeline",
  "TimelineGroupItem.className": "timeline",
  "TimelineItem.children": "timeline",
  "TimelineItem.className": "timeline",
  "Title.children": "title",
  "Title.className": "title",
  "Toast.children": "toast",
  "Toast.className": "toast",
  "ToggleButton.children": "toggle-button",
  "ToggleButton.className": "toggle-button",
  "Token.className": "tokenizer",
  "Tokenizer.children": "tokenizer",
  "Tokenizer.className": "tokenizer",
  "Tokenizer.contentClassName": "tokenizer",
  "Toolbar.children": "render-helpers-custom",
  "Toolbar.className": "render-helpers-custom",
  "ToolbarButton.asChild": "toolbar",
  "ToolbarButton.children": "toolbar",
  "ToolbarButton.className": "toolbar",
  "ToolbarButton.overflowText": "toolbar",
  "ToolbarItem.children": "render-helpers-custom",
  "ToolbarItem.className": "render-helpers-custom",
  "ToolbarSeparator.children": "select-slots-custom",
  "ToolbarSeparator.className": "toolbar",
  "ToolbarSpacer.children": "select-slots-custom",
  "ToolbarSpacer.className": "toolbar",
  "Tree.children": "tree",
  "Tree.className": "tree",
  "Tree.header": "tree",
  "TreeItem.additionalText": "tree",
  "TreeItem.children": "tree",
  "TreeItem.className": "tree",
  "TreeItem.text": "tree",
  "TreeItemCustom.children": "tree",
  "TreeItemCustom.className": "tree",
  "TreeItemCustom.content": "tree",
  "UploadCollection.children": "upload-collection",
  "UploadCollection.className": "upload-collection",
  "UploadCollection.header": "upload-collection",
  "UploadCollection.noDataDescription": "upload-collection",
  "UploadCollection.noDataText": "upload-collection",
  "UploadCollectionItem.children": "upload-collection",
  "UploadCollectionItem.className": "upload-collection",
  "UploadCollectionItem.thumbnail": "upload-collection",
  "UserMenu.asChild": "user-menu",
  "UserMenu.children": "user-menu",
  "UserMenu.className": "user-menu",
  "UserMenu.footer": "user-menu",
  "UserMenu.infoArea": "user-menu",
  "UserMenuItem.additionalText": "user-menu",
  "UserMenuItem.children": "user-menu",
  "UserMenuItem.className": "user-menu",
  "ValueHelpDialog.children": "value-help-dialog",
  "ValueHelpDialog.className": "value-help-dialog",
  "VariantManagement.className": "variant-custom",
  "ViewSettingsDialog.children": "view-settings-dialog",
  "ViewSettingsDialog.className": "view-settings-dialog",
  "Wizard.children": "wizard",
  "Wizard.className": "wizard",
  "WizardStep.children": "wizard"
} as const
const nonFunctionalCustomizations = {
  "AdditionalText.text": "list.tsx exports this shared Tree implementation helper with the comment not meant for direct use; ListItemStandard.additionalText and TreeNode.additionalText are the public slots.",
  "CardHeader.children": "CardHeader renders its own title/subtitle/avatar/action children after spreading native div props; use its named slots.",
  "ProductSwitchItem.children": "ProductSwitchItem renders its text/subtitle/image slots after spreading native props, replacing inherited children.",
  "SearchItem.children": "SearchItem renders its text/description/image/actions after spreading native li props, replacing inherited children.",
  "Checkbox.asChild": "CheckboxProps explicitly omits consumer children; the inherited Radix flag cannot select a caller host.",
  "RadioGroupItem.asChild": "RadioGroupItemProps explicitly omits consumer children; the inherited Radix flag cannot select a caller host.",
  "Switch.asChild": "SwitchProps explicitly omits consumer children; the inherited Radix flag cannot select a caller host.",
  "ObjectIdentifier.children": "ObjectIdentifier renders its title/text after spreading native div props, replacing inherited children.",
  "ObjectAttribute.children": "ObjectAttribute renders its title/text after spreading native span props, replacing inherited children.",
  "ObjectNumber.children": "ObjectNumber renders its number/unit/state text after spreading native span props, replacing inherited children.",
  "ObjectStatus.children": "ObjectStatus renders its icon/text/state text after spreading native span props, replacing inherited children.",
  "Calendar.children": "Calendar renders its owned header and Gregorian day/month/year grids after spreading native div props, replacing inherited children.",
  "DatePicker.children": "DatePicker renders its owned Calendar as PickerField children; inherited input children cannot replace it.",
  "DateRangePicker.children": "DateRangePicker renders its owned Calendar as PickerField children; inherited input children cannot replace it.",
  "DateTimePicker.children": "DateTimePicker renders its owned Calendar and TimeSelectionClocks as PickerField children, replacing inherited input children.",
  "TimePicker.children": "TimePicker renders its owned TimeSelectionClocks as PickerField children, replacing inherited input children.",
  "TimeSelectionClocks.children": "TimeSelectionClocks renders owned time sliders after spreading native div props, replacing inherited children.",
  "TextArea.children": "TextArea owns native textarea value/defaultValue and validation siblings; inherited children are not a supported rendering slot.",
  "Slider.children": "Slider renders owned tracks/thumb/ticks after spreading native div props, replacing inherited children.",
  "RangeSlider.children": "RangeSlider renders owned tracks/thumbs/ticks after spreading native div props, replacing inherited children.",
  "ColorPicker.children": "ColorPicker renders owned slider/input controls after spreading native div props, replacing inherited children.",
  "ExpandableText.children": "ExpandableText renders its text and expansion controls after spreading native div props, replacing inherited children.",
  "FileUploader.children": "FileUploader renders owned input/button/message elements after spreading native div props, replacing inherited children.",
  "RatingIndicator.children": "RatingIndicator renders owned rating icons after spreading native div props, replacing inherited children.",
  "StepInput.children": "StepInput renders owned input and increment/decrement controls after spreading native input props, replacing inherited children.",
  "VariantManagement.children": "VariantManagement renders its owned trigger/list/dialog surfaces after spreading native div props, replacing inherited children.",
} as const
const excludedCustomizationPoints = {
  "SelectTrigger.asChild": "E4 section 5 explicitly excludes the inherited desktop multi-child Slot API-shape failures; no supported caller host is supplied by this path.",
  "SelectContent.asChild": "E4 section 5 explicitly excludes the inherited desktop multi-child Slot API-shape failures; the four original failures remain follow-up work.",
} as const

// Like f6-navigation.spec.ts, this builds a real consumer in memory. It imports
// each owning fixture renderer and the distributed components; no production
// page, shared fixture helper or caller-side ARIA repair is added.
// Native WCR renderers have no registry customization surface.
const fixtureFiles = readdirSync("docs/src/fixtures")
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".wcr.tsx"))
  .filter((file) => /\bdefineFixtures(?:<[^>]+>)?\(\s*\{/.test(readFileSync(`docs/src/fixtures/${file}`, "utf8")))
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".")
const program = ts.createProgram(parsed.fileNames, parsed.options), checker = program.getTypeChecker()
const metadata: Record<string, Record<string, { props: string[]; content: string[]; declared: string[]; asChild: boolean }>> = {}
for (const file of program.getSourceFiles().filter((source) => /registry\/ui\/[^/]+\.tsx$/.test(source.fileName))) {
  const module = checker.getSymbolAtLocation(file)
  if (!module) continue
  const entries: Record<string, { props: string[]; content: string[]; declared: string[]; asChild: boolean }> = {}
  for (const symbol of checker.getExportsOfModule(module)) {
    if (!/^[A-Z]/.test(symbol.name) || /Context$|StateProvider$/.test(symbol.name)) continue
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
    if (!declaration) continue
    const signature = checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures()[0]
    const parameter = signature?.parameters[0]
    if (!parameter) continue
    const type = checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? declaration)
    const props = type.getProperties()
    const content = props.filter((property) => !/^on[A-Z]/.test(property.name) && /ReactNode|ReactElement|ComponentType/.test(checker.typeToString(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration ?? declaration)))).map((property) => property.name)
    const classes = props.filter((property) => /^(?:className|.*ClassName)$/.test(property.name)).map((property) => property.name)
    entries[symbol.name] = { props: classes, content, declared: [...classes, ...content, ...(props.some((property) => property.name === "asChild") ? ["asChild"] : [])], asChild: props.some((property) => property.name === "asChild") && props.some((property) => property.name === "children") }
  }
  if (Object.keys(entries).length) metadata[file.fileName.split("/").at(-1)!] = entries
}
let code: string, css: string
const names = fixtureFiles.map((file) => file.slice(0, -4))
const supplementalNames = ["analytical-table-custom", "data-table-custom", "data-table-empty", "picker-field-custom", "popup-controls-custom", "render-helpers-custom", "adapt-filter-custom", "responsive-custom", "select-slots-custom", "variant-custom", "h8-badge-custom", "h8-native-channels", "h7-input-custom", "h7-message-box-custom", "h7-hostile", "h7-value-state-links"]
test.beforeAll(async () => {
  const imports = Object.keys(metadata).map((file, index) => `import * as M${index} from ${JSON.stringify(resolve(`registry/ui/${file}`))};`).join("\n")
  const fixtures = fixtureFiles.map((file, index) => `import F${index} from ${JSON.stringify(resolve(`docs/src/fixtures/${file}`))};`).join("\n")
  const source = `
    import * as React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom';
    import {appointment2} from ${JSON.stringify(resolve("registry/lib/fiori-icons.ts"))};
    ${imports}\n${fixtures}
    const modules=[${Object.keys(metadata).map((_, i) => `M${i}`).join(",")}];
    const descriptors=${JSON.stringify(Object.values(metadata))}; const owners=new Map();
    modules.forEach((module,index)=>Object.entries(descriptors[index]).forEach(([name,points])=>{
      const previous=owners.get(module[name]); owners.set(module[name],{name,names:[...(previous?.names??[]),name],...points});
    }));
    function C(name,props,...children){const module=modules.find(m=>m[name]);if(!module)throw Error('Missing public component '+name);return h(module[name],props,...children)}
    const fixtures={${names.map((name, i) => `${JSON.stringify(name)}:F${i}`).join(",")}};
    const seen=new Set(); const wrappers=new Map(); const h=React.createElement; let root; let sequence=0;
    const button=text=>C('Button',{},text), text=value=>h('span',{},value);
    const optional={
      'Avatar.badge':text('Verified'), 'List.header':text('Custom list header'), 'ListItemGroup.header':text('Custom group header'),
      'Input.icon':C('InputIcon',{},button('Value help')),
      'ProductSwitchItem.image':h('img',{alt:'Product graphic',src:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}),
      'Search.action':button('Custom search action'), 'ShellBarSearch.action':button('Custom shell action'),
      'SearchItem.image':text('Custom search image'), 'SearchItem.actions':button('Custom suggestion action'),
      'UserMenu.infoArea':text('Custom account information'), 'UserMenu.footer':button('Custom footer'), 'UserMenuItem.additionalText':text('Custom item detail'),
      'SideNavigation.header':text('Custom navigation header'), 'SideNavigationItem.tag':text('New'), 'SideNavigationSubItem.tag':text('New'),
      'DynamicPage.subheader':text('Custom page subheader'),
      'DynamicPageTitle.children':text('Custom title content'),
      'DynamicPageTitle.navigationActions':button('Custom navigation action'), 'FilterBar.variantManagement':text('Custom variants'),
      'ToolbarButton.overflowText':text('Custom overflow label'), 'Form.header':text('Custom form header'),
      'ObjectPage.footer':button('Custom page footer'), 'ObjectPageSubSection.actions':button('Custom subsection action'),
      'Timeline.header':text('Custom timeline header'), 'Timeline.infoBar':text('Custom timeline information'), 'Tree.header':text('Custom tree header'),
      'UploadCollection.header':text('Custom upload header'), 'UploadCollection.noDataText':text('Custom empty title'), 'UploadCollection.noDataDescription':text('Custom empty description'),
      'MediaGallery.overflowText':count=>text('Custom '+count+' pictures'),
      'ValueHelpDialog.children':text('Custom value help content'), 'ViewSettingsDialog.children':text('Custom view settings content'),
    };
    for(const name of ['Input','TextArea','SelectTrigger','ComboBox','MultiComboBox','MultiInput','StepInput','DatePicker','DateRangePicker','DateTimePicker','TimePicker','FileUploader'])optional[name+'.valueStateMessage']=text('Custom validation detail');
    function PickerConsumer(){const [open,setOpen]=React.useState(true);return C('PickerField',{value:'2024-03-13',open,onOpenChange:setOpen,icon:appointment2,'aria-label':'Custom picker field',pickerLabel:'Custom picker dialog',valueState:'negative',valueStateMessage:text('Custom picker validation'),footer:button('Desktop footer'),phoneFooter:button('Phone footer'),popoverClassName:'custom-popup',wrapperClassName:'custom-wrapper',className:'custom-input'},C('Button',{tabIndex:0},'Custom picker content'))}
    const tableColumns=[{accessorKey:'name',id:'name',header:()=>text('Custom name'),cell:info=>text(info.getValue())}];
    const badge=()=>C('ButtonBadge',{design:'InlineText',text:'2'});
    let customAnalyticalMode=false;
    const supplemental={
      'analytical-table-custom':()=>h(React.Fragment,{},
        h('span',{id:'analytical-table-external-name'},'Analytical stock'),
        C('AnalyticalTable',{data:[{name:'Ada'}],columns:[{...tableColumns[0],headerLabel:'Item name',cellLabel:({value})=>'Item '+value,header:({header})=>
          h('span',{},'Custom name',h('template',{},customize(C('AnalyticalTableHeaderCell',{header,className:'consumer-header'},'Header content'),customAnalyticalMode,false)))}],
          'aria-labelledby':'analytical-table-external-name',minRows:1,
          components:{Body:function ProductBody({children}){
            const module=modules.find(m=>m.AnalyticalTable);
            module.useAnalyticalTable();
            const wrapped=React.Children.map(children,row=>React.cloneElement(row,{className:'consumer-row'},
              React.Children.map(row.props.children.flat().filter(Boolean),cell=>React.cloneElement(cell,{className:'consumer-cell',role:'presentation','aria-selected':true,tabIndex:9,id:'foreign-id'}))));
            return customize(wrapped, customAnalyticalMode, false);
          }},renderRowSubComponent:()=>'Order notes'}),
        C('AnalyticalTable',{data:[],columns:tableColumns,'aria-label':'Analytical stock empty',minRows:1,
          NoDataComponent:()=> 'No orders'}),
        C('AnalyticalTable',{data:[],columns:tableColumns,'aria-label':'Analytical stock loading',minRows:1,loading:true,
          LoadingComponent:()=> 'Loading orders'})),
      'h8-badge-custom':()=>h(React.Fragment,{},
        C('Button',{badge:C('ButtonBadge',{design:'InlineText',text:'1',texts:{oneItem:count=>count+' update'}})},'Inbox'),
        C('ToggleButton',{badge:badge(),defaultPressed:true},'Pinned'),
        C('Toolbar',{'aria-label':'Badge actions'},C('ToolbarButton',{badge:badge()},'Notifications'))),
      'h7-input-custom':()=>C('Input',{showSuggestions:true,defaultOpen:true,'aria-label':'City'},
        C('SuggestionItemGroup',{headerText:'Europe'}, h(modules.find(m=>m.Input).SuggestionItem,{text:'Berlin',additionalText:'DE',
          renderContent:({defaultContent})=>defaultContent}))),
      'h7-value-state-links':()=>C('Input',{showSuggestions:true,defaultOpen:true,defaultValue:'Be',
        'aria-label':'Shipping city',valueState:'negative',texts:{stateLinks:'Review two references',stateLinksMac:'Review two references'},
        valueStateMessage:h('span',{},h('a',{href:'#first'},'First link'),' ',h('a',{href:'#second'},'Second link'))},
        h(modules.find(m=>m.Input).SuggestionItem,{text:'Berlin'})),
      'h7-hostile':()=>h(React.Fragment,{},
        C('Input',{showSuggestions:true,defaultOpen:true,'aria-label':'City'},
          h(modules.find(m=>m.Input).SuggestionItem,{text:'Berlin',additionalText:'DE',role:'menuitem',
            id:'foreign-option',tabIndex:99,'aria-selected':true,renderContent:()=>h('em',{},'Berlin near the river')})),
        C('MessageBox',{open:true,portal:false,role:'region','aria-modal':false,tabIndex:99,'aria-labelledby':'foreign-title'},'Review order.')),
      'h7-message-box-custom':()=>C('MessageBox',{open:true,portal:false,icon:h('span',{},'?')},'Review order.'),
      'h8-native-channels':()=>h(React.Fragment,{},
        h('span',{id:'quantity-label'},'Stock quantity'),
        C('NumericInput',{'aria-label':'Order quantity',defaultValue:12,max:10,texts:{aboveMaximum:count=>'Maximum '+count}}),
        C('NumericInput',{'aria-labelledby':'quantity-label',defaultValue:1,min:2,texts:{belowMinimum:count=>'Minimum '+count}}),
        C('NumericInput',{'aria-label':'Decimals',defaultValue:5,precision:1,texts:{invalidFormat:places=>'Places '+places}}),
        C('SplitButton',{'aria-label':'export files','aria-haspopup':'dialog','aria-keyshortcuts':'F4', arrowHasPopup:'listbox',
          arrowExpanded:true, texts:{description:'Two actions',keyboardHint:'Press F4',arrowLabel:'More formats'}},'Export')),

      'data-table-custom':()=>C('DataTable',{data:[{name:'Ada'},{name:'Lin'}],columns:tableColumns,'aria-label':'Custom data table',selectionMode:'multi',defaultSelectedRows:['0'],sortTrigger:'click',rowActionCount:1,rowActions:row=>C('TableRowAction',{icon:appointment2,text:'Action '+row.name})}),
      'data-table-empty':()=>C('DataTable',{data:[],columns:tableColumns,'aria-label':'Custom empty data table',noData:text('Custom no rows')}),
      'picker-field-custom':()=>h(PickerConsumer),
      'popup-controls-custom':()=>C('Dialog',{defaultOpen:true},C('DialogTrigger',{},'Open dialog'),C('DialogOverlay',{},text('Custom overlay')),C('DialogContent',{portal:false},C('DialogTitle',{},'Custom dialog title'),C('DialogDescription',{},'Custom description'),C('DialogClose',{},'Close dialog'))),
      'render-helpers-custom':()=>h(React.Fragment,{},C('Popover',{defaultOpen:true},C('PopoverTrigger',{},'Open popover'),C('PopoverContent',{portal:false,'aria-label':'Custom popover'},C('PopoverClose',{},'Close popover'))),C('Toolbar',{'aria-label':'Custom toolbar'},C('ToolbarItem',{},button('Custom toolbar item'))),C('FilterBarToggle',{},'Toggle filters'),C('ShellBarBadge',{},'Custom badge'),C('List',{selectionMode:'single',defaultSelectedValues:['custom']},C('ListItemStandard',{value:'custom',text:text('Custom text'),description:text('Custom description'),additionalText:text('Custom additional'),image:text('Custom image')})),C('MultiInput',{'aria-label':'Custom suggestions',defaultOpen:true},h(modules.find(m=>m.MultiInput).SuggestionItem,{text:'Custom suggestion'})),C('Table',{'aria-label':'Custom empty table',noData:text('Custom table no data')},C('TableHeaderRow',{},C('TableHeaderCell',{action:button('Custom header action')},'Name')))),
      'adapt-filter-custom':()=>C('AdaptFiltersDialog',{open:true,onOpenChange:()=>{},filters:[{key:'name',label:'Custom filter',required:true,render:({id,disabled,valueState,valueStateMessage})=>h('div',{'data-custom-filter':'name'},C('Input',{id,disabled,valueState,valueStateMessage,'aria-label':'Custom filter field',defaultValue:'Ada'}))}],values:{name:[]},visibleKeys:['name'],onApply:()=>{},portal:false,modal:false,className:'custom-filter-dialog'}),
      'responsive-custom':()=>C('ResponsivePopover',{defaultOpen:true},C('ResponsivePopoverTrigger',{},'Open responsive'),C('ResponsivePopoverAnchor',{},text('Responsive anchor')),C('ResponsivePopoverContent',{portal:false,headerText:'Owned responsive title',phoneHeader:text('Custom phone header'),phoneFooter:button('Custom phone footer'),phoneClassName:'custom-phone'},button('Custom responsive content'))),
      'select-slots-custom':()=>h(React.Fragment,{},C('Select',{defaultOpen:true},C('SelectTrigger',{'aria-label':'Custom select'},C('SelectValue',{placeholder:text('Custom placeholder')},text('Custom value'))),C('SelectContent',{portal:false},C('SelectItem',{value:'first'},'First'),C('SelectSeparator',{},text('Custom separator')),C('SelectItem',{value:'second'},'Second'))),C('MenuSeparator',{},text('Custom menu separator')),C('PickerPopoverBody',{valueState:'negative',message:text('Custom body message')},text('Custom body content')),C('List',{selectionMode:'single',defaultSelectedValues:['custom']},C('ListItemStandard',{value:'custom'},text('Custom child title'))),C('Toolbar',{'aria-label':'Custom separator toolbar'},C('ToolbarSpacer',{},text('Custom spacer')),C('ToolbarSeparator',{},text('Custom separator'))),C('TabsSeparator',{},text('Custom tab separator')),C('ShellBarSearch',{'aria-label':'Custom shell suggestions',defaultOpen:true,defaultValue:'Ada'},C('SearchItem',{text:'Ada'}))),
      'variant-custom':()=>C('VariantManagement',{items:[{key:'standard',title:'Standard',favorite:true}],selectedKey:'standard',defaultOpen:'list',portal:false}),
    };
    Object.entries(supplemental).forEach(([name,render])=>fixtures[name]={cases:[{id:name,props:{}}],react:render});
    function Mark({point,children,...props}){React.useLayoutEffect(()=>{seen.add(point)},[point]);return h('span',{'data-custom-slot':point,...props},children)}
    function content(node,point,fill=false){
      if(typeof node==='string'||typeof node==='number')return h(Mark,{point},node);
      if(Array.isArray(node))return node.map((child,index)=>React.isValidElement(child)?React.cloneElement(customize(child,true,fill),{key:child.key??index}):content(child,point,fill));
      if(React.isValidElement(node))return customize(node,true,fill);
      return node;
    }
    function customize(node,custom=true,fill=false){
      if(Array.isArray(node))return node.map(child=>customize(child,custom,fill));
      if(!React.isValidElement(node))return node;
      if(node.type===React.Fragment)return React.cloneElement(node,{},customize(node.props.children,custom,fill));
      const descriptor=owners.get(node.type); const props={...node.props};
      if(descriptor){
        const name=descriptor.name;
        if(fill)for(const key of descriptor.content){const point=name+'.'+key;if(Object.hasOwn(optional,point))props[key]=optional[point]}
        if(!custom){if(props.children!==undefined)props.children=customize(props.children,false,fill);return React.cloneElement(node,props)}
        const record=key=>descriptor.names.forEach(alias=>seen.add(alias+'.'+key));
        if(name==='DataTable')props.columns=props.columns.map(column=>({...column,...Object.fromEntries(['header','cell'].filter(key=>typeof column[key]==='function').map(key=>[key,(...args)=>{seen.add('DataTable.columns.'+key);return content(column[key](...args),'DataTable.columns.'+key,fill)}]))}));
        if(name==='AdaptFiltersDialog')props.filters=props.filters.map(filter=>({...filter,render:(...args)=>{seen.add('FilterDefinition.render');return content(filter.render(...args),'FilterDefinition.render',fill)}}));
        for(const key of descriptor.props){props[key]=[props[key],'e4-custom-'+name+'-'+key].filter(Boolean).join(' ');record(key)}
        for(const key of descriptor.content){
          if(key==='children'){
            // Declarative children (items/rows/groups/tabs) keep their original
            // component types. Only their rendered leaves become custom JSX.
            if(props.children!==undefined){props.children=content(props.children,name+'.children',fill);record('children')}
          }else if(typeof props[key]==='function'){
            const render=props[key];props[key]=(...args)=>{record(key);return content(render(...args),name+'.'+key,fill)};
          }else if(props[key]!=null&&props[key]!==false){props[key]=content(props[key],name+'.'+key,fill);record(key)}

        }
        // Button.badge is a native-button slot. Exercise it on the real host;
        // the separate asChild proofs still exercise the single-child Slot path.
        if(descriptor.asChild && !props.badge && !['SelectTrigger','SelectContent'].includes(name)){
          // The card excludes only Select's four inherited multi-child Slot API
          // errors; dedicated existing tests cover its supported single host.
          const children=props.children;
          if(children!==undefined&&!props.asChild){
            const tag=/Button$|Trigger$|Close$/.test(name)?'button':name==='Label'?'label':name==='SelectValue'?'span':'div';
            const protectedHost=['DialogContent','PopoverContent','MenuItem','MenuSubTrigger','UserMenu','ResponsivePopoverContent'].includes(name);
            const hostile=protectedHost?{role:'presentation',id:'e4-foreign-host',tabIndex:13,...(/Menu/.test(name)&&name!=='UserMenu'?{'aria-checked':'mixed','aria-haspopup':'grid','aria-expanded':'mixed','aria-controls':'e4-foreign-target'}:{'aria-label':props['aria-label']!==undefined?'Foreign host name':undefined,'aria-labelledby':'e4-foreign-label','aria-describedby':'e4-foreign-description','aria-modal':false})}:{};
            props.asChild=true;props.children=h(tag,{'data-custom-host':name,...hostile},children);record('asChild');
          }else if(props.asChild)record('asChild');
        }
        return React.cloneElement(node,props);
      }
      if(typeof node.type==='function'){
        const Original=node.type;
        // Local fixture composition functions may themselves return the public
        // components. Invoke them as a real React wrapper, preserving hooks.
        if(!wrappers.has(Original))wrappers.set(Original,new Map());const modes=wrappers.get(Original),mode=custom+':'+fill;
        if(!modes.has(mode))modes.set(mode,function CustomFixture(p){return customize(Original(p),custom,fill)});
        return h(modes.get(mode),{...props,key:node.key});
      }
      if(props.children!==undefined)props.children=custom?content(props.children,'fixture.children',fill):customize(props.children,false,fill);
      return React.cloneElement(node,props);
    }
    const attributes=['role','aria-selected','aria-checked','aria-expanded','aria-sort','aria-rowindex','aria-colindex','aria-posinset','aria-setsize','aria-level','aria-haspopup','aria-required','aria-disabled','aria-invalid','tabindex'];
    function snapshot(){return [...document.querySelectorAll('body [data-slot]')].map(node=>({slot:node.getAttribute('data-slot'),tag:node.tagName,attrs:Object.fromEntries(attributes.filter(a=>node.hasAttribute(a)).map(a=>[a,node.getAttribute(a)])),id:!!node.id,refs:['aria-labelledby','aria-describedby','aria-controls','aria-activedescendant'].flatMap(a=>(node.getAttribute(a)||'').split(/\\s+/).filter(Boolean).map(id=>({attribute:a,id,valid:!!document.getElementById(id)})))}))}
    async function settledSnapshot(){let previous;for(let frame=0;frame<100;frame++){await new Promise(requestAnimationFrame);const current=snapshot(),value=JSON.stringify(current);if(value===previous)return current;previous=value}throw Error('Custom consumer semantic layout did not settle')}
    window.e4Customization={cases:name=>fixtures[name].cases.map(c=>c.id),seen:()=>[...seen].sort(),mount:(name,id,custom,fill=false)=>{
      if(root)flushSync(()=>root.unmount());document.getElementById('customization-root').replaceChildren();seen.clear();
      const fixture=fixtures[name],entry=fixture.cases.find(c=>c.id===id);root=createRoot(document.getElementById('customization-root'));
      customAnalyticalMode=custom;
      let output=fixture.react(entry.props);if(custom||fill)output=customize(output,custom,fill);flushSync(()=>root.render(output));return ++sequence;
    },snapshot,settledSnapshot,largeCombo:()=>{
      if(root)flushSync(()=>root.unmount());root=createRoot(document.getElementById('customization-root'));
      const Combo=modules.find(m=>m.ComboBox), children=Array.from({length:1000},(_,i)=>h(Combo.ComboBoxItem,{key:i,text:'Item '+(i+1)}));
      flushSync(()=>root.render(h(Combo.ComboBox,{'aria-label':'Large positions',noTypeahead:true},children)));
    }};
  `
  const entry = resolve("e4-customization-consumer.js"), virtual = "\0e4-customization-consumer"
  const result = await build({ configFile: false, publicDir: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("development") },
    resolve: { alias: [{ find: /^@\/components\/ui\//, replacement: resolve("registry/ui/") + "/" }, { find: /^@\/lib\//, replacement: resolve("registry/lib/") + "/" }] },
    plugins: [{ name: "e4-customization-consumer", resolveId: (id) => id === entry ? virtual : undefined, load: (id) => id === virtual ? source : undefined }],
    build: { write: false, minify: false, lib: { entry, formats: ["iife"], name: "E4Customization" } } })
  const output = Array.isArray(result) ? result[0] : result
  if (!("output" in output)) throw new Error("Expected an in-memory consumer build")
  const chunk = output.output.find((file) => file.type === "chunk")
  if (!chunk || chunk.type !== "chunk") throw new Error("Missing consumer bundle")
  code = chunk.code
  css = readFileSync("dist/index.html", "utf8").match(/href="([^"]+\.css)"/)![1]
})

type OwnedNode = { slot: string; tag: string; attrs: Record<string, string>; id: boolean; refs: { attribute: string; id: string; valid: boolean }[] }
async function mountHarness(page: import("@playwright/test").Page) {
  await page.route("**/e4-customization.html", (route) => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="en" data-theme="sap_horizon"><head><link rel="stylesheet" href="${css}"></head><body><div id="customization-root"></div><script>${code.replaceAll("</script", "<\\/script")}</script></body></html>` }))
  await page.goto("/e4-customization.html")
  await expect.poll(() => page.evaluate(() => typeof (window as any).e4Customization?.mount)).toBe("function")
}
for (const name of [...names, ...supplementalNames]) test(`functional customization keeps component-owned roles states idrefs and tabindex (${name})`, async ({ page }, info) => {
  test.setTimeout(120_000)
  const runtimeErrors: string[] = []; page.on("pageerror", (error) => runtimeErrors.push(error.message))
  await mountHarness(page)
  const ids: string[] = await page.evaluate((name) => (window as any).e4Customization.cases(name), name)
  const coverage = new Set<string>()
  for (const id of ids) for (const fill of [false, true]) {
    await page.evaluate(({ name, id, fill }) => (window as any).e4Customization.mount(name, id, false, fill), { name, id, fill })
    await page.evaluate(() => document.fonts.ready)
    const before: OwnedNode[] = await page.evaluate(() => (window as any).e4Customization.settledSnapshot())
    await page.evaluate(({ name, id, fill }) => (window as any).e4Customization.mount(name, id, true, fill), { name, id, fill })
    await page.evaluate(() => document.fonts.ready)
    expect(runtimeErrors, `${id}: custom consumer rendered without runtime errors`).toEqual([])
    const after: OwnedNode[] = await page.evaluate(() => (window as any).e4Customization.settledSnapshot())
    for (const point of await page.evaluate(() => (window as any).e4Customization.seen()) as string[]) coverage.add(point)
    for (const node of before.filter((entry) => Object.keys(entry.attrs).length || entry.id || entry.refs.length)) {
      const matches = after.filter((entry) => entry.slot === node.slot && Object.entries(node.attrs).every(([attribute, value]) => entry.attrs[attribute] === value) && (!node.id || entry.id))
      const requiredCount = before.filter((entry) => entry.slot === node.slot && JSON.stringify(entry.attrs) === JSON.stringify(node.attrs) && entry.id === node.id).length
      expect(matches.length, `${id}: custom output retained every ${node.slot} ${JSON.stringify(node.attrs)}`).toBeGreaterThanOrEqual(requiredCount)
      for (const relation of node.refs.filter((ref) => ref.valid)) expect(matches.some((entry) => entry.refs.some((ref) => ref.attribute === relation.attribute && ref.valid)), `${id}: ${node.slot} retains valid ${relation.attribute}`).toBe(true)
    }
    // A custom output cannot create dangling owning relationships. Native
    // fixture defects already present are kept in E4's separate tree ratchet.
    const oldInvalid = new Set(before.flatMap((node) => node.refs.filter((ref) => !ref.valid).map((ref) => `${node.slot}:${ref.attribute}`)))
    expect(after.flatMap((node) => node.refs.filter((ref) => !ref.valid && !oldInvalid.has(`${node.slot}:${ref.attribute}`)).map((ref) => `${node.slot}:${ref.attribute}`)), `${id}: custom relationships resolve to actual intended elements`).toEqual([])
  }
  expect(coverage.size, `${name}: custom props reached an actual public component`).toBeGreaterThan(0)
  for (const [point, consumer] of Object.entries(customizationProofs)) if (consumer === name) expect(coverage.has(point), `${name}: actual runtime proof for ${point}`).toBe(true)
  await info.attach("functional-customization-coverage", { body: JSON.stringify({ name, cases: ids, points: [...coverage].sort() }, null, 2), contentType: "application/json" })
})

test("every current functional public customization has an explicit consumer proof", () => {
  const declarations = Object.values(metadata).flatMap((module) => Object.entries(module).flatMap(([component, points]) => points.declared.map((point) => `${component}.${point}`)))
  declarations.push("DataTable.columns.header", "DataTable.columns.cell", "FilterDefinition.render")
  const classified = new Set([...Object.keys(customizationProofs), ...Object.keys(nonFunctionalCustomizations), ...Object.keys(excludedCustomizationPoints)])
  expect(declarations.filter((point) => !classified.has(point))).toEqual([])
  expect(Object.keys(customizationProofs).filter((point) => !declarations.includes(point))).toEqual([])
  expect(Object.keys(nonFunctionalCustomizations).filter((point) => !declarations.includes(point))).toEqual([])
  expect(Object.keys(excludedCustomizationPoints).filter((point) => !declarations.includes(point))).toEqual([])
})

test("repaired semantic custom hosts warn when hostile ownership props are ignored", async ({ page }) => {
  const warnings: string[] = []; page.on("console", (message) => { if (message.type() === "warning") warnings.push(message.text()) })
  await mountHarness(page)
  for (const [name, part] of [["dialog", "Dialog.Content"], ["popover", "Popover.Content"], ["menu", "Menu.Item"], ["user-menu", "Popover.Content"], ["responsive-popover", "Popover.Content"], ["label", "Label"]]) {
    const ids: string[] = await page.evaluate((name) => (window as any).e4Customization.cases(name), name)
    const id = name === "label" ? "label-custom-host" : ids[0]
    warnings.length = 0
    await page.evaluate(({ name, id }) => (window as any).e4Customization.mount(name, id, true), { name, id })
    await expect.poll(() => warnings.some((warning) => warning.includes(`${part}: ignored custom host ownership prop`))).toBe(true)
  }
  warnings.length = 0
  await page.evaluate(() => (window as any).e4Customization.mount("select-dialog", "select-dialog-custom", true))
  const row = page.getByRole("listitem").filter({ hasText: "In review" })
  await expect(row).not.toHaveAttribute("id", "foreign")
  for (const prop of ["role", "id", "tabIndex", "aria-selected"]) {
    expect(warnings.some(warning => warning.includes("SelectDialog: ignored item ownership prop " + prop))).toBe(true)
  }
  warnings.length = 0
  await page.evaluate(() => (window as any).e4Customization.mount("render-helpers-custom", "render-helpers-custom", true))
  await expect(page.getByRole("dialog", { name: "Custom popover", exact: true })).toBeVisible()
  expect(warnings.some((warning) => warning.includes("Popover.Content: ignored custom host ownership prop aria-label"))).toBe(true)
})

test("ComboBox position placeholders keep native raw digits for Arabic navigator and count 1000", async ({ browser }) => {
  const context = await browser.newContext({ locale: "ar-EG" }), page = await context.newPage()
  try {
    await mountHarness(page)
    await page.evaluate(() => (window as any).e4Customization.largeCombo())
    const input = page.getByRole("combobox", { name: "Large positions" })
    await input.focus(); await page.keyboard.press("F4")
    await expect(input).toHaveValue("Item 1")
    await expect(page.locator('[data-slot="combobox-announcement"]')).toHaveText("List item 1 of 1000")
    await page.keyboard.press("End")
    await expect(input).toHaveValue("Item 1000")
    await expect(page.locator('[data-slot="combobox-announcement"]')).toHaveText("List item 1000 of 1000")
  } finally { await context.close() }
})

test("phone custom responsive and PickerField slots retain dialog names references focus and footer controls", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message))
  await mountHarness(page)
  await page.evaluate(() => document.documentElement.dataset.fioriDevice = "phone")
  await page.evaluate(() => (window as any).e4Customization.mount("responsive-custom", "responsive-custom", true))
  const responsive = page.getByRole("dialog", { name: "Owned responsive title", exact: true })
  await expect(responsive).toBeVisible()
  await expect(responsive).toHaveAttribute("aria-modal", "true")
  await expect(responsive.getByText("Custom phone header", { exact: true })).toBeVisible()
  await expect(responsive.getByRole("button", { name: "Custom phone footer", exact: true })).toBeVisible()
  const target = await responsive.getAttribute("aria-labelledby")
  expect(target).toBeTruthy()
  await expect(page.locator(`[id="${target}"]`)).toHaveText("Owned responsive title")
  const responsivePoints = await page.evaluate(() => (window as any).e4Customization.seen()) as string[]
  await page.evaluate(() => (window as any).e4Customization.mount("picker-field-custom", "picker-field-custom", true))
  const picker = page.getByRole("dialog", { name: "Custom picker dialog", exact: true })
  await expect(picker).toBeVisible()
  await expect(picker).toHaveAttribute("aria-modal", "true")
  const content = picker.getByRole("button", { name: "Custom picker content", exact: true })
  await expect(content).toBeFocused()
  await expect(picker.getByRole("button", { name: "Phone footer", exact: true })).toBeVisible()
  // The modal makes the background field inert in AX; its owned relation still
  // has to resolve while custom phone content is open.
  const input = page.locator('[data-slot="picker-field"] input')
  await expect(input).toHaveAttribute("aria-invalid", "true")
  const description = await input.getAttribute("aria-describedby")
  expect(description).toBeTruthy()
  await expect(page.locator(`[id="${description}"]`)).toHaveText("Custom picker validation")
  await page.keyboard.press("Escape")
  await expect(picker).toHaveCount(0)
  expect(errors).toEqual([])
  const pickerPoints = await page.evaluate(() => (window as any).e4Customization.seen()) as string[]
  await info.attach("functional-customization-coverage", { body: JSON.stringify({ name: "phone-custom-slots", cases: ["responsive-custom", "picker-field-custom"], points: [...new Set([...responsivePoints, ...pickerPoints])] }), contentType: "application/json" })
})

test("DataTable custom header cell and row-action callbacks keep sorting selection row indices and grid keyboard focus", async ({ page }) => {
  await mountHarness(page)
  await page.evaluate(() => (window as any).e4Customization.mount("data-table-custom", "data-table-custom", true))
  const grid = page.getByRole("grid", { name: "Custom data table", exact: true })
  const header = grid.getByRole("columnheader", { name: "Custom name", exact: true })
  await expect(header).not.toHaveAttribute("aria-sort")
  const row = grid.getByRole("row").filter({ hasText: "Ada" })
  await expect(row).toHaveAttribute("aria-rowindex", "2")
  await expect(row).toHaveAttribute("aria-selected", "true")
  await expect(row.getByRole("gridcell").filter({ hasText: "Ada" })).toBeVisible()
  await expect(row.getByRole("button", { name: "Action Ada", exact: true })).toBeVisible()
  await page.keyboard.press("Tab")
  await expect(row).toBeFocused()
  await page.keyboard.press("ArrowUp")
  const headerRow = grid.locator('[data-slot="table-header-row"]')
  await expect(headerRow).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(headerRow.locator("[data-selection-cell]")).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(header).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(header).toHaveAttribute("aria-sort", "ascending")
  await page.keyboard.press("ArrowDown")
  await expect(row.getByRole("gridcell", { name: "Ada", exact: true })).toBeFocused()
})

test("H8 native names, relationships and text overrides reach their owning controls", async ({ page }) => {
  await mountHarness(page)
  await page.evaluate(() => (window as any).e4Customization.mount("h8-native-channels", "h8-native-channels", false))
  const group = page.getByRole("group", { name: "Export export files Two actions Press F4" })
  await expect(group).toHaveAttribute("aria-haspopup", "dialog")
  await expect(group).toHaveAttribute("aria-keyshortcuts", "F4")
  const arrow = group.getByRole("button", { name: "More formats" })
  await expect(arrow).toHaveAttribute("aria-haspopup", "listbox")
  await expect(arrow).toHaveAttribute("aria-expanded", "true")
  for (const [name, message] of [["Order quantity", "Maximum 10"], ["Stock quantity", "Minimum 2"]]) {
    await expect.poll(() => page.getByRole("textbox", { name }).evaluate((node: HTMLInputElement) => node.validationMessage)).toBe(message)
  }
  const decimals = page.getByRole("textbox", { name: "Decimals" })
  await decimals.fill("5.00")
  await decimals.press("Enter")
  await expect.poll(() => decimals.evaluate((node: HTMLInputElement) => node.validationMessage)).toBe("Places 1")

  await page.evaluate(() => (window as any).e4Customization.mount("h8-badge-custom", "h8-badge-custom", true))
  await expect(page.getByRole("button", { name: "Inbox 1 update" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Pinned 2 items" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("toolbar", { name: "Badge actions" }).getByRole("button", { name: "Notifications 2 items" })).toBeVisible()
})

test("AnalyticalTable protects custom cell semantics and preserves native grid naming", async ({ page }) => {
  await mountHarness(page)
  const warnings: string[] = []
  page.on("console", message => { if (message.type() === "warning") warnings.push(message.text()) })
  await page.evaluate(() => (window as any).e4Customization.mount("analytical-table-custom", "analytical-table-custom", true))
  const grid = page.getByRole("grid", { name: "Analytical stock", exact: true })
  await expect(grid).toHaveAttribute("aria-rowcount", "1")
  await expect(grid.getByRole("columnheader", { name: "Item name" })).toBeVisible()
  const cell = grid.getByRole("gridcell", { name: "Item Ada", exact: true })
  await expect(cell).toHaveClass(/consumer-cell/)
  await expect(cell).toHaveAttribute("aria-colindex", "1")
  await expect(cell).toHaveAttribute("tabindex", "-1")
  await expect(cell).not.toHaveAttribute("id", "foreign-id")
  await expect(cell).not.toHaveAttribute("aria-selected")
  for (const attribute of ["role", "aria-selected", "tabIndex", "id"]) expect(warnings.some(message =>
    message.includes(`AnalyticalTable cell: ignored owned prop "${attribute}"`))).toBe(true)
  await expect(page.getByRole("grid", { name: "Analytical stock empty" }).getByRole("gridcell")).toHaveText("No orders")
  await expect(page.getByRole("progressbar", { name: "Please wait" })).toHaveText("Loading orders")
})

test("H7 content slots protect option and alertdialog ownership", async ({ page }) => {
  const warnings: string[] = []
  page.on("console", (message) => { if (message.type() === "warning") warnings.push(message.text()) })
  await mountHarness(page)
  await page.evaluate(() => (window as any).e4Customization.mount("h7-hostile", "h7-hostile", false))
  const option = page.getByRole("option", { name: "Berlin near the river" })
  await expect(option).toBeVisible()
  await expect(option).toHaveAttribute("tabindex", "-1")
  await expect(option).toHaveAttribute("aria-selected", "false")
  await expect(page.locator("#foreign-option")).toHaveCount(0)
  const box = page.getByRole("alertdialog", { name: "Confirmation Review order." })
  await expect(box).toHaveAttribute("aria-modal", "true")
  await expect(box).toHaveAttribute("tabindex", "-1")
  for (const [part, props] of [["Input.SuggestionItem", ["id", "role", "tabIndex", "aria-selected"]],
    ["MessageBox", ["role", "tabIndex", "aria-modal", "aria-labelledby"]]] as const) {
    for (const prop of props) expect(warnings).toContainEqual(expect.stringContaining(`${part}: ignored custom host ownership prop ${prop}`))
  }
})

test("H7 value-state links announce a shortcut and lead back into the suggestions", async ({ page }) => {
  await mountHarness(page)
  await page.evaluate(() => (window as any).e4Customization.mount("h7-value-state-links", "h7-value-state-links", false))
  const input = page.getByRole("textbox", { name: "Shipping city" })
  await input.focus()
  await expect(input).toHaveAccessibleDescription("Suggestions Available Value State Error First link Second link Review two references")
  const modifier = await page.evaluate(() => /Mac/.test(navigator.platform) ? "Meta" : "Control")
  await input.press(`${modifier}+Alt+F8`)
  const first = page.getByRole("link", { name: "First link" })
  const second = page.getByRole("link", { name: "Second link" })
  await expect(first).toBeFocused()
  await first.press("Tab")
  await expect(second).toBeFocused()
  await second.press("ArrowDown")
  await expect(input).toBeFocused()
  await expect(input).toHaveValue("Berlin")
  await expect(page.getByRole("option", { name: "Berlin" })).toHaveAttribute("aria-selected", "true")
})
