# Kanban View Control

| ![Kanban Control](https://github.com/novalogica/pcf-kanban-control/blob/main/KanbanViewControl/screenshots/kanban-case-example.png) |
|:--:|
| *Figure 1: Kanban view displaying cases by priority.* |

This **PowerApps Component Framework (PCF)** control enables users to visualize records in a **Kanban** view.

## 📌 Features
- Dynamic Kanban board view.
- Dynamically shows columns based on the selected view.
- Supports **business process flows** and **Choice** columns.
- Drag-and-drop functionality.
- Lookup column support (including Persona-style display).
- **Quick filter** dropdowns and **custom sort** fields (configurable).
- **Date/time quick filters**: For DateTime and DateOnly fields, special filter options (Today, Last 7 days, Last 30 days, Custom range) with Fluent UI DatePicker.
- **Number/currency quick filters**: For numeric and currency fields, filter by Greater than, Less than, Greater/Less or equal, Between (min/max) with Fluent UI.
- Toast notifications for value updates.
- **Internationalization**: The control adapts to the app language (user's language setting); UI strings are localized (e.g. English, German).

## 🚀 Usage

After adding the control, configure the following properties:

## ⚙️ Configuration

All configurable properties come from the Control Manifest. Invalid JSON in text properties is reported in a **Configuration errors** banner above the board.

### Table of contents

- [View & column selection](#view--column-selection)
  - [Default View By](#default-view-by)
  - [Filter out Business Process Flows](#filter-out-business-process-flows)
  - [Business Process Flow Step Order](#business-process-flow-step-order)
  - [Hide View By if default View By set?](#hide-view-by-if-default-view-by-set)
- [Board layout & behaviour](#board-layout--behaviour)
  - [Allow moving cards](#allow-moving-cards)
  - [Show open in new tab button on card](#show-open-in-new-tab-button-on-card)
  - [Hide empty columns](#hide-empty-columns)
  - [Expand board to full width](#expand-board-to-full-width)
  - [Minimum column width](#minimum-column-width)
  - [Maximum column width](#maximum-column-width)
  - [Column widths](#column-widths)
  - [Allow creating new records from board](#allow-creating-new-records-from-board)
- [Card content & appearance](#card-content--appearance)
  - [Hide column field on card](#hide-column-field-on-card)
  - [Hidden fields on card](#hidden-fields-on-card)
  - [HTML fields on card](#html-fields-on-card)
  - [Allowed HTML tags on card](#allowed-html-tags-on-card)
  - [Allowed HTML attributes on card](#allowed-html-attributes-on-card)
  - [Hide label for fields on card](#hide-label-for-fields-on-card)
  - [Field display names on card](#field-display-names-on-card)
  - [Field highlights](#field-highlights)
  - [Field widths on card](#field-widths-on-card)
  - [Lookup fields as Persona on card](#lookup-fields-as-persona-on-card)
  - [Lookup Persona icon only on card](#lookup-persona-icon-only-on-card)
  - [E-Mail fields on card (as link)](#e-mail-fields-on-card-as-link)
  - [Phone fields on card (as link)](#phone-fields-on-card-as-link)
  - [Ellipsis fields on card](#ellipsis-fields-on-card)
- [Security (HTML on cards)](#security-html-on-cards)
- [Filters & sorting](#filters--sorting)
  - [Quick filter fields](#quick-filter-fields)
  - [Quick filter fields in popup](#quick-filter-fields-in-popup)
  - [Filter presets](#filter-presets)
  - [Sort fields](#sort-fields)
- [Notifications](#notifications)
  - [Notification Position](#notification-position)

---

## View & column selection

### Default View By

**Type:** Text

Pre-selects the initial view when the board loads. The value is matched against the **view label** (the text shown in the "View type" dropdown), e.g. the display name of a Choice option, a BPF name, or a Status Reason label. If no match is found, the first available view is used. Leave empty to start with the first view.

**Example:** Set the exact display name from the "View type" dropdown, e.g. `Priority - High` or `Lead to Opportunity`.

---

### Filter out Business Process Flows

**Type:** Text (JSON array)

List of **BPF names** to **exclude** from the "View type" dropdown. Only BPFs whose name is in this list are hidden. Invalid JSON is reported as a configuration error.

**Example:**

```json
["Old Sales Process", "Legacy BPF"]
```

---

### Business Process Flow Step Order

**Type:** Text (JSON array)

Defines the **column order** (stages) for business process flows. Each item has `"id"` (stage display name, e.g. `"Develop"`) and `"order"` (number; lower = further left). Stages not listed keep their default order. Invalid JSON is reported as a configuration error.

**Example:**

```json
[{"id":"Develop","order":2},{"id":"Propose","order":1},{"id":"Close","order":0}]
```

Use the stage **display name** as `id`. In the control configuration: *View > Custom Controls > Kanban View Control > Business Process Flow Step Order > Edit > Bind to a static value > Paste JSON*.

---

### Hide View By if default View By set?

**Type:** Yes/No

When **Yes**, the "View type" dropdown is hidden **only if** a default view (Default View By) is configured. Useful for a fixed board with a single view. Default: **No**.

---

## Board layout & behaviour

### Allow moving cards

**Type:** Yes/No

When **No**, drag-and-drop is disabled; cards cannot be moved between columns. Clicking a card still opens the record. Useful for read-only or approval boards. Default: **Yes**.

---

### Show open in new tab button on card

**Type:** Yes/No

When **Yes**, each card shows a button (top right) that opens the record in a new browser tab (_blank). Uses the Fluent UI icon OpenRegular. Default: **No**.

---

### Hide empty columns

**Type:** Yes/No

When **Yes**, columns that currently have no cards are hidden. Only columns that contain at least one record are shown. Default: **No**.

---

### Expand board to full width

**Type:** Yes/No

When **Yes**, the board uses the full available width and columns scale proportionally. When **No**, the board keeps a fixed layout. Default: **No**.

---

### Minimum column width

**Type:** Text (number)

Minimum width of each column in **pixels** (number as text, e.g. `300` or `400`). Also applies when "Expand board to full width" is enabled; horizontal scrolling is used if needed. Empty = default (400).

**Example:** `300` or `400`. Leave empty for default (400).

---

### Maximum column width

**Type:** Text (number)

Maximum width of each column (and cards) in **pixels** (e.g. `500` or `800`). Valid range 200–2000. Empty = no limit.

**Example:** `500` or `800`. Leave empty for no limit.

---

### Column widths

**Type:** Text (JSON array)

Sets the **width per column**. Each item: `"id"` (column id, e.g. BPF stage name like `"Develop"` or option value for choice/status) and `"width"` (pixels, 200–1200). Columns not listed use the global min/max values.

**Example:**

```json
[{"id":"Develop","width":280},{"id":"Propose","width":320}]
```

---

### Allow creating new records from board

**Type:** Yes/No

When **No**, the add (+) button in column headers is hidden and records cannot be created from the board. Default: **Yes**.

---

## Card content & appearance

### Hide column field on card

**Type:** Yes/No

When **Yes**, the field used for the current "View By" grouping (e.g. priority, status) is **not** shown on the card to avoid redundancy. Default: **No**.

---

### Hidden fields on card

**Type:** Text (JSON array or comma-separated)

**Logical field names** that are loaded with the dataset but **not** displayed on cards. Use to load data (e.g. for lookups) without showing it. Invalid JSON is interpreted as comma-separated.

**Example:**

```json
["estimatedvalue","createdon","ownerid"]
```

Or comma-separated: `estimatedvalue, createdon, ownerid`

---

### HTML fields on card

**Type:** Text (JSON array or comma-separated)

**Logical field names** whose value is rendered as **HTML** (sanitized with DOMPurify and configurable whitelist). For rich text or formatted content. See [Security (HTML on cards)](#security-html-on-cards) for tag/attribute whitelist.

**Example:**

```json
["description","customhtmlfield"]
```

---

### Allowed HTML tags on card

**Type:** Text (comma-separated)

**Allowed HTML tags** for HTML fields on the card. Default: `p,br,b,i,u,strong,em,a,ul,ol,li,table,thead,tbody,tr,th,td`. Empty = no tags (all HTML stripped). Add `style` only if needed and accept the security risk (see Security).

---

### Allowed HTML attributes on card

**Type:** Text (comma-separated)

**Allowed attributes** for HTML fields on the card (e.g. `href` for links). Default: `href`. Empty = no attributes.

---

### Hide label for fields on card

**Type:** Text (JSON array or comma-separated)

**Logical field names** for which the **label** is hidden on the card; only the value is shown. Useful for compact layouts. Invalid JSON is interpreted as comma-separated.

**Example:**

```json
["description","estimatedvalue"]
```

Or comma-separated.

---

### Field display names on card

**Type:** Text (JSON array)

Custom **display names (labels)** for fields on the card. Format: `{"logicalName":"...","displayName":"..."}`. Fields not listed keep their dataset display name. Invalid JSON is reported.

**Example:**

```json
[{"logicalName":"estimatedvalue","displayName":"Value"},{"logicalName":"description","displayName":"Description"}]
```

---

### Field highlights

**Type:** Text (JSON array)

Highlight fields when a value is set. Each item: `logicalName`, `color` (e.g. `#hex`), optional `type`. **First match per type** wins. **type**: `left` (default) = colored left border, `right` = right border, `cornerTopLeft`, `cornerTopRight`, `cornerBottomLeft`, `cornerBottomRight` = diagonal corner mark. Fields must be in the dataset columns.

**Example:**

```json
[{"logicalName":"ispriority","color":"#e81123","type":"left"},{"logicalName":"isblocked","color":"#ffaa00","type":"right"},{"logicalName":"isurgent","color":"#ff0","type":"cornerTopRight"}]
```

Supported colors: hex (`#ff0000`), RGB or CSS color names.

---

### Field widths on card

**Type:** Text (JSON array)

**Percentage width** of fields on the card (100 = full width, 50 = half). Fields not listed keep the default width. Invalid JSON is reported.

**Example:**

```json
[{"logicalName":"description","width":100},{"logicalName":"estimatedvalue","width":50}]
```

---

### Lookup fields as Persona on card

**Type:** Text (JSON array or comma-separated)

**Logical field names** for which lookup values are shown as **Persona** (image/initials). Other lookup fields are shown as a simple link.

**Example:**

```json
["ownerid","primarycontactid"]
```

Or comma-separated. For icon/initials only without text see **Lookup Persona icon only on card**.

---

### Lookup Persona icon only on card

**Type:** Text (JSON array or comma-separated)

**Logical field names** for which Persona is shown **icon/initials only** (no text). Only applies to fields also listed in **Lookup fields as Persona on card**.

---

### E-Mail fields on card (as link)

**Type:** Text (JSON array or comma-separated)

**Logical field names** that are shown as **clickable mailto links** (e.g. email of related contact). Use when the field displays an email but has type SingleLine.Text in the dataset.

**Example:**

```json
["parentcontactid_emailaddress1"]
```

Or comma-separated.

---

### Phone fields on card (as link)

**Type:** Text (JSON array or comma-separated)

**Logical field names** that are shown as **clickable tel links** (e.g. phone of related contact). Use when the field displays a phone number but has type SingleLine.Text in the dataset.

**Example:**

```json
["parentcontactid_telephone1"]
```

Or comma-separated.

---

### Ellipsis fields on card

**Type:** Text (JSON array or comma-separated)

**Logical field names** for which the value is shown with **text-overflow: ellipsis** (single line, overflow with …). Other fields use multi-line clamp.

**Example:**

```json
["description","title"]
```

Or comma-separated.

---

## Security (HTML on cards)

Content from **HTML fields on card** is sanitized with [DOMPurify](https://github.com/cure53/DOMPurify) before rendering. Only tags and attributes from **Allowed HTML tags on card** and **Allowed HTML attributes on card** are kept; scripts, event handlers (e.g. `onerror`, `onclick`) and unsafe markup are removed. This reduces the risk of Stored XSS.

- **Configurable whitelist** – Allow only the tags and attributes needed for your use case.
- **Shadow DOM** – HTML is rendered inside a Shadow Root.
- **Bound field** – The field is bound to Dataverse data. Sanitization happens inside the control; you can additionally control who can write to the field via security roles.

**Whitelist configuration (important)**

- **Trusted configuration only** – Allowed tags and attributes are set when the form is configured (app maker/admin). Do not let end users or untrusted systems change these settings.
- **No event handlers or inline style** – Do not add event attributes (e.g. `onclick`, `onerror`) or the `style` attribute to **Allowed HTML attributes on card** (that would allow XSS). Use the default `href` only, or add attributes like `target` if needed.
- **`style` tag is a significant security risk** – Allowing `style` in **Allowed HTML tags on card** enables embedded CSS. CSS can be abused for XSS, data exfiltration or UI manipulation. Only add it if the HTML content is fully trusted.
- **Links with `target="_blank"`** – If you add `target` to the allowed attributes, be aware of [tab-nabbing](https://owasp.org/www-community/attacks/Reverse_Tabnabbing). Prefer `rel="noopener"` (and optionally `rel="noreferrer"`) in stored HTML where possible.

**Keep dependencies up to date** – Update DOMPurify regularly (`npm update dompurify`) and run `npm audit`.

---

## Filters & sorting

### Quick filter fields

**Type:** Text (JSON array or comma-separated)

**Logical field names** to show as **quick filter dropdowns** above the board. All fields except Boolean are **multiselect**; Boolean remains single-select. **DateTime/DateOnly** get a **date filter UI**: (All), Today, Last 7 days, Last 30 days, Current calendar week, Current month, Current year, Next calendar week, Next month, Custom range. **Number/Currency** get a **number filter UI**: (All), Greater than, Less than, Greater/Less or equal, Between (min/max). Use the **exact column name** from the dataset. Only fields present in the dataset can be used. Invalid JSON is interpreted as comma-separated.

**Example:**

```json
["statuscode","prioritycode","ownerid","scheduledstart","createdon","estimatedvalue"]
```

Or comma-separated.

---

### Quick filter fields in popup

**Type:** Text (JSON array or comma-separated)

**Logical field names** that are shown in a **popup** (e.g. "More filters") instead of inline to save space. Must be a **subset** of **Quick filter fields**.

**Example:** `["ownerid","statuscode","scheduledstart"]`

---

### Filter presets

**Type:** Text (JSON array)

Predefined filters shown as a dropdown next to sorting. Each preset: `{"id":"unique-id","label":"Display name","filters":{"fieldLogicalName":"filterValue"}}`. For **multiselect** use an array as value; for Boolean use a single value. **The filter preset dropdown is only shown when this property is set.**

**Date fields:** `"today"`, `"last7"`, `"last30"`, `"currentMonth"`, `"currentYear"`, `"currentWeek"`, `"nextWeek"`, `"nextMonth"`, `"YYYY-MM-DD|YYYY-MM-DD"` or `{"start":"YYYY-MM-DD","end":"YYYY-MM-DD"}`.  
**Number/currency fields:** `"gt:123"`, `"lt:456"`, `"gte:0"`, `"lte:10000"`, `"between:100|5000"`.  
**Current user:** `{{currentUser}}` e.g. for `ownerid` (replaced at runtime by the signed-in user's display name).

**Example:**

```json
[
  {"id":"open","label":"Open","filters":{"statuscode":"1"}},
  {"id":"my-opportunities","label":"My Opportunities","filters":{"ownerid":"{{currentUser}}"}},
  {"id":"multi-status","label":"Multiple statuses","filters":{"statuscode":["1","2","3"]}},
  {"id":"this-week","label":"This week","filters":{"scheduledstart":"currentWeek"}},
  {"id":"jan-2025","label":"January 2025","filters":{"createdon":{"start":"2025-01-01","end":"2025-01-31"}}}
]
```

- `filters`: logical field name → single value (Boolean/single-select) or **array of values** (multiselect).
- **`{{currentUser}}`**: replaced by the signed-in user's display name (Dataverse systemuser.fullname), ideal for "My Opportunities" or "My cases".
- Date fields: `"today"`, `"last7"`, `"last30"`, `"currentWeek"`, `"currentMonth"`, `"currentYear"`, `"nextWeek"`, `"nextMonth"` or range as above.
- Number/currency: `"gt:123"`, `"lt:456"`, `"gte:0"`, `"lte:10000"`, `"between:100|5000"`.

---

### Sort fields

**Type:** Text (JSON array or comma-separated)

**Logical field names** for **custom sorting** (dropdown next to search). Only fields from the dataset. Ascending/descending is selectable in the UI. Invalid JSON is interpreted as comma-separated.

**Example:**

```json
["createdon","estimatedvalue","title"]
```

Or comma-separated.

---

## Notifications

### Notification Position

**Type:** Enum

Position where **toast messages** appear (e.g. after moving a card or on save failure). Options: **Top** (center), **Top Start** (left), **Top End** (right), **Bottom**, **Bottom Start**, **Bottom End**. Default: **Top End** (top right).

---

## View Types

The dropdown automatically adjusts to the associated dataset view. If a new **Choice** column is added, the control updates dynamically to reflect the new values. If the table has any active BPFs, they will appear as an option in the "View type" dropdown.

- Column Order: Card columns are reordered based on the dataset view's column order.

⚠ **Note:** If the **Status Reason** column is included in the view, only **active statuses** will be displayed.

## Card Behavior

The columns displayed on each card are **not hardcoded**. They are dynamically pulled from the dataset view, ensuring real-time adaptation to the dataset's structure.

You can still use standard **Edit Columns** and **Edit Filters** functionality.

- **Edit filters or search** will normally affect the items that appear in the kanban.
- **Edit Columns** can be used to add, remove or sort the columns that appear on the card as well as the "View Type" dropdown.

| ![Kanban columns example](https://github.com/novalogica/pcf-kanban-control/blob/main/KanbanViewControl/screenshots/kanban-case-columns-example.png) |
|:--:|
| *Figure 2: Dataset columns from example above* |

| ![Kanban View Type example()](https://github.com/novalogica/pcf-kanban-control/blob/main/KanbanViewControl/screenshots/kanban-case-view-type-example.png)|
|:--:|
| *Figure 3: View Type options based on choice columns* |

### 🔹 Additional Notes
- Lookup columns remain accessible from the card.
- Dragging a card to another column triggers a toast message indicating **success** or **failure** of the update.
- If the selected **View Type** is linked to a **business process flow**, the record will **not** move directly to another column. Instead, a popup will open, requiring a **manual stage update**.

### Configuration errors

If a JSON property contains invalid JSON, the control shows a **Configuration errors** banner above the board with the property name and error message. Properties validated as JSON: **Filter out Business Process Flows**, **Business Process Flow Step Order**, **Field display names on card**, **Field highlights**, **Field widths on card**, **Filter presets**. For **Quick filter fields** and **Sort fields**, an error is only reported when the value starts with `[` but is not valid JSON; otherwise comma-separated parsing is used. Fix the value in the control configuration to clear the banner.

## 📦 Deployment

Run the following commands to deploy the control:

#### 1. Create an authentication profile:
   ```sh
   pac auth create --url https://xyz.crm.dynamics.com
   ```
#### 2. List existing authentication profiles:
   ```sh
   pac auth list
   ```
#### 3. Switch to a specific authentication profile:
   ```sh
   pac auth select --index <index of the active profile>
   ```
#### 4. Ensure a valid connection and push the component:
   ```sh
   pac pcf push -pp <your publisher prefix>
   ```

## Contributions
Contributions to improve or enhance this control are welcome. If you encounter issues or have feature requests, please create an issue or submit a pull request in the repository.

---

### License
This control is licensed under the MIT License. See the LICENSE file for details.
