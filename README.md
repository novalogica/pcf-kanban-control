# Kanban View Control

| ![Kanban Control](https://github.com/novalogica/pcf-kanban-control/blob/main/KanbanViewControl/screenshots/kanban-case-example.png) |
|:--:|
| *Figure 1: Kanban view displaying cases by priority.* |

This **PowerApps Component Framework (PCF)** control enables users to visualize records in a **Kanban** view.

## 📌 Features
- Dynamic Kanban board view.
- Dynamically shows columns based on the selected view.
- Supports **business process flows** and **Choice** columns.
- Drag-and-drop functionality.
- Lookup column support (including Persona-style display).
- **Quick filter** dropdowns and **custom sort** fields (configurable).
- Toast notifications for value updates.

## 🚀 Usage

After adding the control, configure the following properties:

## ⚙️ Configuration

All configurable properties from the Control Manifest. Invalid JSON in text properties is reported in a **Configuration errors** banner above the board.

### View & column selection

| Property | Type | Description |
|----------|------|-------------|
| **Default View By** | Text | Pre-selects the initial view when the board loads. The value is matched against the **view label** (the text shown in the "View type" dropdown), e.g. the display name of a Choice option, a BPF name, or a Status Reason label. If no match is found, the first available view is used. Leave empty to start with the first view. |
| **Filter out Business Process Flows** | Text | **JSON array** of BPF **names** to exclude from the "View type" dropdown (e.g. `["Old Sales Process"]`). Only BPFs whose name is in this list are hidden. Invalid JSON is reported as a configuration error. |
| **Business Process Flow Step Order** | Text | **JSON array** to define a custom column order for business process flow stages. Each item has `"id"` (stage display name, e.g. `"Develop"`) and `"order"` (numeric; lower = left). Stages not listed keep their default order. Invalid JSON is reported as a configuration error. Example: `[{"id":"Develop","order":2},{"id":"Propose","order":1}]`. |
| **Hide View By if default View By set?** | Yes/No | When **Yes**, the "View type" dropdown is hidden **only if** a default view is configured. Use for a fixed, single-view board where users should not switch views. Default: **No**. |

### Board layout & behavior

| Property | Type | Description |
|----------|------|-------------|
| **Allow moving cards** | Yes/No | When **No**, drag-and-drop is disabled; cards cannot be moved between columns. Clicking a card still opens the record. Useful for read-only or approval boards. Default: **Yes**. |
| **Hide empty columns** | Yes/No | When **Yes**, columns that currently have no cards are hidden. The board only shows columns that contain at least one record. Default: **No**. |
| **Expand board to full width** | Yes/No | When **Yes**, the board uses the full available width and columns scale proportionally. When **No**, the board keeps a fixed layout. Default: **No**. |
| **Minimum column width** | Text | Minimum width of each column in **pixels** (number as text, e.g. `300` or `400`). Also applies when "Expand board to full width" is enabled; horizontal scrolling is used if needed. Leave empty for default (400). |
| **Maximum column width** | Text | Maximum width of each column (and cards) in **pixels** (e.g. `500` or `800`). Valid range 200–2000. Leave empty for no limit. |
| **Column widths** | Text | **JSON array** to set **width per column**. Each item: `"id"` (column id, e.g. BPF stage name like `"Develop"` or option value for choice/status columns) and `"width"` (pixels, 200–1200). Columns not listed use the global min/max. Example: `[{"id":"Develop","width":280},{"id":"Propose","width":320}]`. |
| **Allow creating new records from board** | Yes/No | When **No**, the add (+) button on each column header is hidden and users cannot create records from the board. Default: **Yes**. |

### Card content & appearance

| Property | Type | Description |
|----------|------|-------------|
| **Hide column field on card** | Yes/No | When **Yes**, the field that is used for the current "View By" grouping (e.g. priority, status) is **not** shown on the card, to avoid redundancy. Other fields are unchanged. Default: **No**. |
| **Hidden fields on card** | Text | Field **logical names** that are loaded with the dataset but **not shown** on cards. Use to fetch data (e.g. for lookups) without displaying it. **JSON array** (e.g. `["field1","field2"]`) or **comma-separated** list. Invalid JSON falls back to comma parsing. |
| **HTML fields on card** | Text | Field **logical names** whose value is rendered as **HTML** (not escaped). Use for rich text or formatted content. **JSON array** or comma-separated list. Only use with trusted data to avoid XSS. Invalid JSON falls back to comma parsing. |
| **Hide label for fields on card** | Text | Field **logical names** for which the **label** is hidden on the card; only the value is shown. **JSON array** or comma-separated list. Useful for compact layouts. Invalid JSON falls back to comma parsing. |
| **Field display names on card** | Text | **JSON array** of `{"logicalName":"fieldname","displayName":"Label"}`. Assigns custom display names (labels) to fields on the card. Fields not listed keep their dataset display name. Invalid JSON is reported. Example: `[{"logicalName":"estimatedvalue","displayName":"Wert"}]`. |
| **Field highlights** | Text | **JSON array** of `{"logicalName":"fieldname","color":"#hex","type":"left"}`. For any field type: **empty**/falsy = no highlight, **filled**/truthy = highlight. **First match per type** wins. Optional **type**: `left` (default) = colored left border, `right` = colored right border, `cornerTopRight` / `cornerBottomRight` = diagonal corner mark. Fields must be in the dataset columns. Invalid JSON is reported. Example: `[{"logicalName":"ispriority","color":"#e81123","type":"left"},{"logicalName":"isurgent","color":"#ff0","type":"cornerTopRight"}]`. |
| **Field widths on card** | Text | **JSON array** of `{"logicalName":"fieldname","width":number}`. Sets **percentage width** of fields on the card (100 = full width, 50 = half). Fields not listed use the default width. Invalid JSON is reported. Example: `[{"logicalName":"description","width":100},{"logicalName":"estimatedvalue","width":50}]`. |
| **Lookup fields as Persona on card** | Text | Field **logical names** for which lookup values are shown with **image/initials (Persona style)**. Other lookup fields are shown as a simple link. **JSON array** (e.g. `["ownerid"]`) or comma-separated list. |
| **Lookup Persona icon only on card** | Text | Field **logical names** for which Persona is shown **icon/initials only** (no text). Only applies to fields also listed in **Lookup fields as Persona on card**. **JSON array** or comma-separated list. |
| **E-Mail fields on card (as link)** | Text | Field **logical names** that are shown as **clickable mailto links** (e.g. E-Mail of related contact). Use when the field displays an e-mail but has type SingleLine.Text in the dataset. **JSON array** (e.g. `["parentcontactid_emailaddress1"]`) or comma-separated list. |
| **Phone fields on card (as link)** | Text | Field **logical names** that are shown as **clickable tel links** (e.g. phone of related contact). Use when the field displays a phone number but has type SingleLine.Text in the dataset. **JSON array** (e.g. `["parentcontactid_telephone1"]`) or comma-separated list. |
| **Ellipsis fields on card** | Text | Field **logical names** for which the value is shown with **text-overflow: ellipsis** (single line, overflow hidden with …). Other fields use multi-line clamp. **JSON array** or comma-separated list. |

### Filters & sorting

| Property | Type | Description |
|----------|------|-------------|
| **Quick filter fields** | Text | Field **logical names** to show as **quick filter dropdowns** above the board. All fields except **Boolean** are **multiselect** filters; Boolean fields remain single-select. Use the **exact column name** from the dataset (e.g. `ownerid` for the entity, or `a_xxx.ownerid` for linked-entity columns). **JSON array** (e.g. `["statuscode","ownerid","a_c66099806c8349a18e63498da795a1a6.ownerid"]`) or comma-separated list. Only fields present in the dataset can be used. Invalid JSON falls back to comma parsing. |
| **Quick filter fields in popup** | Text | Field **logical names** that are shown in a **popup** („Weitere Filter“) instead of inline, to save space and avoid wrapping. Must be a **subset** of **Quick filter fields**. **JSON array** (e.g. `["ownerid","statuscode"]`) or comma-separated list. Only fields listed in Quick filter fields can be used. |
| **Filter presets** | Text | **JSON array** of filter presets shown in a dropdown next to sorting. Each preset: `{"id":"unique-id","label":"Display name","filters":{"fieldLogicalName":"filterValue"}}`. For **multiselect** quick filter fields use an array: `"fieldLogicalName": ["value1","value2"]`; for Boolean use a single value. Filter values must match the values shown in the quick filter dropdowns. Use placeholder **`{{currentUser}}`** for the current user (e.g. `ownerid: "{{currentUser}}"` for "Meine Opportunities"); replaced at runtime by the user's display name (Dataverse systemuser.fullname). Invalid JSON is reported. **The Filter-Preset dropdown is only shown if this property is set** in the view/form control configuration. |
| **Sort fields** | Text | Field **logical names** available for **custom sorting** (dropdown next to search). **JSON array** (e.g. `["createdon","estimatedvalue"]`) or comma-separated list. Only fields present in the dataset can be used. Ascending/descending is selectable in the UI. Invalid JSON falls back to comma parsing. |

### Notifications

| Property | Type | Description |
|----------|------|-------------|
| **Notification Position** | Enum | Position where **toast messages** appear (e.g. after moving a card or on save failure). Options: **Top** (center), **Top Start** (left), **Top End** (right), **Bottom**, **Bottom Start**, **Bottom End**. Default: **Top End** (top-right). |

## View Types

The dropdown automatically adjusts to the associated dataset view. If a new **Choice** column is added, the control updates dynamically to reflect the new values.
Also, if the table has any active BPFs, they will appear as an option in the "View type" dropdown.

- Column Order: Card columns are reordered based on the dataset view’s column order.

⚠ **Note:** If the **Status Reason** column is included in the view, only **active statuses** will be displayed.

## Card Behavior

The columns displayed on each card are **not hardcoded**. They are dynamically pulled from the dataset view, ensuring real-time adaptation to the dataset’s structure.

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

If a JSON property contains invalid JSON, the control shows a **Configuration errors** banner above the board with the property name and error message. Properties that are validated as JSON: **Filter out Business Process Flows**, **Business Process Flow Step Order**, **Field display names on card**, **Field highlights**, **Field widths on card**, **Filter presets**. For **Quick filter fields** and **Sort fields**, an error is only reported when the value starts with `[` but is not valid JSON; otherwise comma-separated parsing is used. Fix the value in the control configuration to clear the banner.

### Examples – JSON configuration options

**Default View By** (plain text, not JSON)  
   Set to the exact label shown in the "View type" dropdown, e.g. `Priority - High` or `Lead to Opportunity`.

**Filter out Business Process Flows**
   ```json
   ["Old Sales Process", "Legacy BPF"]
   ```
   BPFs with these names are excluded from the "View type" dropdown.

**Business Process Flow Step Order**
   ```json
   [{"id":"Develop","order":2},{"id":"Propose","order":1},{"id":"Close","order":0}]
   ```
   Use the stage **display name** as `id`. Set in the control config: *View > Custom Controls > Kanban View Control > Business Process Flow Step Order > Edit > Bind to a static value > Paste JSON*.

**Filter presets** (dropdown next to sorting; selection persisted per view)
   ```json
   [
     {"id":"open","label":"Offen","filters":{"statuscode":"1"}},
     {"id":"my-opportunities","label":"Meine Opportunities","filters":{"ownerid":"{{currentUser}}"}},
     {"id":"multi-status","label":"Mehrere Status","filters":{"statuscode":["1","2","3"]}}
   ]
   ```
   - `filters`: field logical name → single value (Boolean/single-select) or **array of values** (multiselect quick filter fields). Values must match the quick filter dropdown labels.
   - **Placeholder `{{currentUser}}`**: use for the current user (e.g. `ownerid`). Replaced at runtime by the logged-in user's display name (Dataverse systemuser.fullname). Ideal for presets like "Meine Opportunities" or "Meine Fälle".

**Hidden fields on card** (loaded but not displayed)
   ```json
   ["estimatedvalue","createdon","ownerid"]
   ```
   Or comma-separated: `estimatedvalue, createdon, ownerid`

**HTML fields on card** (render content as HTML; use only with trusted data)
   ```json
   ["description","customhtmlfield"]
   ```

**Hide label for fields on card** (show value only, no label)
   ```json
   ["description","estimatedvalue"]
   ```
   Or comma-separated. Reduces visual clutter on the card.

**Field display names on card** (custom labels for fields)
   ```json
   [{"logicalName":"estimatedvalue","displayName":"Wert"},{"logicalName":"description","displayName":"Beschreibung"}]
   ```
   The display name is shown as the field label on the card.

**Field highlights** (highlight when field has a value; first match **per type** wins; any field type: boolean, text, lookup, etc.)
   ```json
   [{"logicalName":"ispriority","color":"#e81123","type":"left"},{"logicalName":"isblocked","color":"#ffaa00","type":"right"},{"logicalName":"isurgent","color":"#ff0","type":"cornerTopRight"}]
   ```
   Optional **type**: `left` (default), `right`, `cornerTopRight`, `cornerBottomRight`. Fields must be in the dataset columns. Supported colors: hex (`#ff0000`), rgb, or CSS color names.

**Field widths on card** (percentage width; 100 = full width, 50 = half)
   ```json
   [{"logicalName":"description","width":100},{"logicalName":"estimatedvalue","width":50}]
   ```
   Fields not listed keep the default width.

**Lookup fields as Persona on card** (show lookup as image/initials)
   ```json
   ["ownerid","primarycontactid"]
   ```
   Or comma-separated. Use **Lookup Persona icon only on card** for icon/initials only (no text).

**Ellipsis fields on card** (single line with …; other fields use multi-line clamp)
   ```json
   ["description","title"]
   ```
   Or comma-separated.

**E-Mail fields on card (as link)** / **Phone fields on card (as link)**
   ```json
   ["parentcontactid_emailaddress1"]
   ```
   ```json
   ["parentcontactid_telephone1"]
   ```
   Or comma-separated. Use for fields that display e-mail/phone but have type SingleLine.Text in the dataset.

**Minimum column width** (number as text)
   Set e.g. `300` or `400`. Leave empty for default (400).

**Maximum column width** (number as text)
   Set e.g. `500` or `800`. Valid range 200–2000. Leave empty for no limit.

**Quick filter fields** (dropdown filters above the board; multiselect except for Boolean fields)
   ```json
   ["statuscode","prioritycode","ownerid"]
   ```
   Or comma-separated. Only fields in the dataset can be used.

**Sort fields** (custom sort dropdown next to search)
   ```json
   ["createdon","estimatedvalue","title"]
   ```
   Or comma-separated. Ascending/descending is selectable in the UI.

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
