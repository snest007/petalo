# Display

| Item | Summary |
| --- | --- |
| [avatar](#avatar) | Represent people or business entities with recognizable images, initials or placeholders. |
| [busy-indicator](#busy-indicator) | Show that work is running when its completion percentage is unknown. |
| [card](#card) | Preview focused business content and offer access to its underlying page or task. |
| [carousel](#carousel) | Let users browse a sequence of images or other content pages. |
| [expandable-text](#expandable-text) | Keep prose within a character limit while letting users reveal the full text. |
| [hero-banner](#hero-banner) | Introduce a product home page with a greeting, context and task shortcuts. |
| [illustrated-message](#illustrated-message) | Explain an empty, unavailable or completed state with an illustration and a useful next step. |
| [link](#link) | Navigate through meaningful text to a page, anchor or external URL. |
| [locale](#locale) | Locale context, SAP-keyed text overrides, localized number formatting and parsing. |
| [media-gallery](#media-gallery) | Browse images and videos by selecting thumbnails and inspecting the selected media. |
| [message-strip](#message-strip) | Explain application messages in context within a page or section. |
| [panel](#panel) | Group information within a page in a section that can collapse to save space. |
| [progress-indicator](#progress-indicator) | Show a measured completion percentage for a running process. |
| [tag](#tag) | Draw attention to a category, condition or quantity with a compact enclosed marker. |
| [text](#text) | Display read-only body text in an application content area. |
| [title](#title) | Name pages and sections with explicit heading semantics. |

## avatar

Represent people or business entities with recognizable images, initials or placeholders.

### Use when

- Help users recognize a person, product or business entity consistently across the application.
- Use shape="circle" for people, shape="square" for business entities, and initials for 1–3 Latin letters when no photo exists.
- Show related people together with AvatarGroup, and provide meaningful alternative text for identity images.

### Don't use when

- Browse a sequence of pictures rather than represent one identity. → [carousel](display.md#carousel)
- Select image or video thumbnails to inspect the corresponding media. → [media-gallery](display.md#media-gallery)

Main exports: `Avatar`, `AvatarGroup`.

```bash
npx shadcn add @petalo/avatar
```

## busy-indicator

Show that work is running when its completion percentage is unknown.

### Use when

- Tell users to wait while an operation runs without a measurable completion percentage.
- Limit the busy state to the affected area so users can work elsewhere; wrapped content becomes inert while the indicator is shown.
- Use active to signal pending work and delay (1000ms by default) to avoid flashing during brief operations.

### Don't use when

- A running process has a measured completion value on a 0–100% scale. → [progress-indicator](display.md#progress-indicator)
- No operation is pending and an empty or unavailable area needs an explanation and next step. → [illustrated-message](display.md#illustrated-message)

Main exports: `BusyIndicator`.

```bash
npx shadcn add @petalo/busy-indicator
```

## card

Preview focused business content and offer access to its underlying page or task.

### Use when

- Give users a focused preview of the content or KPI most relevant to a business task.
- Let users perform a simple action or navigate to the underlying content from the preview.
- Compose CardHeader and CardContent; make the header interactive when it opens a meaningful related destination.

### Don't use when

- Group information inside a page and let users collapse it rather than preview an independent destination. → [panel](display.md#panel)
- Introduce a product home page with a greeting, context and task shortcuts. → [hero-banner](display.md#hero-banner)

Main exports: `Card`, `CardContent`, `CardHeader`.

```bash
npx shadcn add @petalo/card
```

## carousel

Let users browse a sequence of images or other content pages.

### Use when

- Let users browse ordered images or content pages with arrows, keyboard navigation or swipe.
- Present one item or a deliberate group at a time while preserving the sequence.

### Don't use when

- Select a thumbnail and inspect an image or video in a dedicated display area. → [media-gallery](display.md#media-gallery)
- Represent one person or business entity with a photo, initials or an icon. → [avatar](display.md#avatar)

Main exports: `Carousel`.

```bash
npx shadcn add @petalo/carousel
```

## expandable-text

Keep prose within a character limit while letting users reveal the full text.

### Use when

- Let users read a description in constrained space and reveal the rest when needed.
- Use maxCharacters (100 by default) with overflowMode="InPlace" or "Popover" to choose where the full text appears.

### Don't use when

- Show body text that already fits, or truncate it without offering a reveal action. → [text](display.md#text)
- Let users edit the prose rather than read it. → [textarea](forms.md#textarea)

Main exports: `ExpandableText`.

```bash
npx shadcn add @petalo/expandable-text
```

## hero-banner

Introduce a product home page with a greeting, context and task shortcuts.

### Use when

- Welcome users to a product home page and surface the context and tasks they need first.
- Place the hero below the shell bar, let it scroll away, and aim for a height of 5.75–24rem (92–384px).
- Supply the date or greeting through overlineText and headerText, and place supporting content and secondary buttons in the content and actions areas.

### Don't use when

- Preview one focused business topic with a route to its underlying content. → [card](display.md#card)
- Keep filters and page actions in a header that collapses while users work with business data. → [dynamic-page](layout.md#dynamic-page)

Main exports: `HeroBanner`.

```bash
npx shadcn add @petalo/hero-banner
```

## illustrated-message

Explain an empty, unavailable or completed state with an illustration and a useful next step.

### Use when

- Help users understand why content is empty or unavailable, or what a completed task means.
- Pair a solution-oriented title and description with a relevant illustration and recovery or next-step actions.
- Pass illustration and choose design="Auto" for container sizing; supply action children except when design="Base" hides them.

### Don't use when

- Explain in-page context while the surrounding content remains usable. → [message-strip](display.md#message-strip)
- Confirm a completed action briefly without requiring a response. → [toast](overlays.md#toast)
- Start from a ready-made page demonstrating no-data, no-results and loading-failure patterns. → [empty-states](floorplans.md#empty-states)
- An operation is still running and its completion percentage is unknown. → [busy-indicator](display.md#busy-indicator)

Main exports: `IllustratedMessage`.

```bash
npx shadcn add @petalo/illustrated-message
```

## link

Navigate through meaningful text to a page, anchor or external URL.

### Use when

- Let users open another page, jump to an anchor or follow an external URL.
- Describe the destination or outcome in the link text instead of using Click here.
- Use at most one supporting icon so the navigation label remains clear.

### Don't use when

- Submit data or trigger an explicit action. → [button](actions.md#button)
- Show non-interactive prose without a navigation target. → [text](display.md#text)
- Present an object title together with a supporting identifier. → [object-identifier](data.md#object-identifier)

Main exports: `Link`.

```bash
npx shadcn add @petalo/link
```

## locale

Locale context, SAP-keyed text overrides, localized number formatting and parsing.

Usage guidance has not been authored for this item yet; inspect its installed API before choosing it.

Main exports: `FioriLocaleProvider`, `collatorIncludes`, `normalizeLocaleDigits`, `parseNumber`.

```bash
npx shadcn add @petalo/locale
```

## media-gallery

Browse images and videos by selecting thumbnails and inspecting the selected media.

### Use when

- Let users choose an image or video thumbnail and inspect the corresponding item in a display area.
- Keep alternative views of the same object together, with responsive thumbnail placement and overflow access.
- Compose MediaGalleryItem children with thumbnails; use interactiveDisplayArea when pressing the selected media opens a detailed view.

### Don't use when

- Browse generic content pages in sequence without thumbnail selection. → [carousel](display.md#carousel)
- Show one identity photo, initials or placeholder for a person or entity. → [avatar](display.md#avatar)
- Manage attached files with upload status, deletion, retry or termination. → [upload-collection](data.md#upload-collection)

Main exports: `MediaGallery`, `MediaGalleryItem`.

```bash
npx shadcn add @petalo/media-gallery
```

## message-strip

Explain application messages in context within a page or section.

### Use when

- Keep users informed about a warning, status change or guidance that applies to the current page or section.
- Place the message close to the affected content so users can keep working and understand its scope.
- Use design for message severity; handle onClose in the application when users may dismiss the strip.

### Don't use when

- Confirm a completed action briefly without requiring a response. → [toast](overlays.md#toast)
- An empty or unavailable area needs an illustration and a recovery or next-step action. → [illustrated-message](display.md#illustrated-message)
- Require an explicit response. Use MessageBox for standard actions, or Dialog for a custom workflow. → [dialog](overlays.md#dialog), [message-box](overlays.md#message-box)
- Show the state of an individual object inside a table cell or list item. → [object-status](data.md#object-status)

Main exports: `MessageStrip`.

```bash
npx shadcn add @petalo/message-strip
```

## panel

Group information within a page in a section that can collapse to save space.

### Use when

- Let users reveal or hide related information within the current page.
- Keep a section title and its content together without implying navigation to another destination.
- Use fixed for always-visible content; use collapsed and onToggle when the application controls disclosure.

### Don't use when

- Provide a focused content preview with navigation or a task action. → [card](display.md#card)

Main exports: `Panel`.

```bash
npx shadcn add @petalo/panel
```

## progress-indicator

Show a measured completion percentage for a running process.

### Use when

- Help users track how much of a running process has completed when the amount is measurable.
- Use value on a 0–100 scale and displayValue when a task-specific completion label is clearer than a percentage.

### Don't use when

- Work is running but its completion percentage is unknown. → [busy-indicator](display.md#busy-indicator)
- Show a business amount or quantity with a unit rather than process completion. → [object-number](data.md#object-number)

Main exports: `ProgressIndicator`.

```bash
npx shadcn add @petalo/progress-indicator
```

## tag

Draw attention to a category, condition or quantity with a compact enclosed marker.

### Use when

- Help users spot a category, condition or quantity alongside surrounding content.
- Use design for semantic meaning or a consistent indication color; enable interactive when pressing the marker opens related information.

### Don't use when

- Show a number or attention dot attached to a button. → [button-badge](actions.md#button-badge)
- Describe a business object state with a label and status text rather than a category marker. → [object-status](data.md#object-status)
- Represent an already selected value that users can remove from a field. → [token](forms.md#token)

Main exports: `Tag`.

```bash
npx shadcn add @petalo/tag
```

## text

Display read-only body text in an application content area.

### Use when

- Let users read descriptions, explanations or other body content without an action attached.
- Use maxLines only when truncation is acceptable; leave it unset when users must read the full content.

### Don't use when

- Let users reveal prose that exceeds the available space. → [expandable-text](display.md#expandable-text)
- Name a page or section with heading semantics. → [title](display.md#title)
- Navigate to a destination when users activate the text. → [link](display.md#link)
- Provide a label associated with an input or form field. → [label](forms.md#label)
- Let users edit the prose. → [textarea](forms.md#textarea)

Main exports: `Text`.

```bash
npx shadcn add @petalo/text
```

## title

Name pages and sections with explicit heading semantics.

### Use when

- Help users understand the structure of a page by naming its sections.
- Use level for the semantic H1–H6 hierarchy and size for visual emphasis independently.

### Don't use when

- Show body prose without heading semantics. → [text](display.md#text)
- Identify a business object using a primary name and supporting identifier. → [object-identifier](data.md#object-identifier)
- Label an input or form field rather than name a section. → [label](forms.md#label)

Main exports: `Title`.

```bash
npx shadcn add @petalo/title
```
