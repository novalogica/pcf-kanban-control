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
- Lookup column support.
- Toast notifications for value updates.

## 🚀 Usage

After adding the control, configure the following properties:

## ⚙️ Configuration

All configurable properties from the Control Manifest:

| Property | Type | Description |
|----------|------|-------------|
| **Default View By** | Text | Pre-selects a view in the "View type" dropdown by matching this value to the view label (e.g. view name or choice label). If set, the board loads with this view applied. |
| **Filter out Business Process Flows** | Text | Array of strings with the business process flow names to filter out. Those BPFs will not appear in the "View type" dropdown. |
| **Business Process Flow Step Order** | Text | JSON array to control the order of business process flow stages (e.g. `[{"id":"Develop","order":2},{"id":"Propose","order":1}]`). |
| **Hide View By if default View By set?** | Yes/No | When **Yes**, the "View type" dropdown is hidden if a default view is configured. Use this for a fixed view without switching. |
| **Allow moving cards** | Yes/No | When **No**, drag-and-drop is disabled; cards cannot be moved between columns. Clicking a card still opens the record. Default: **Yes**. |
| **Hide empty columns** | Yes/No | When **Yes**, columns that contain no cards are not shown. Default: **No**. |
| **Hide column field on card** | Yes/No | When **Yes**, the field used for column grouping (View By) is not displayed on the card to save space. Default: **No**. |
| **Hidden fields on card** | Text | Field logical names that are loaded but not displayed on cards. JSON array (e.g. `["field1","field2"]`) or comma-separated list. |
| **HTML fields on card** | Text | Field logical names whose content is rendered as HTML (not escaped). JSON array (e.g. `["field1","field2"]`). |
| **Boolean field highlights** | Text | JSON array of objects with `logicalName` and `color`. Cards get a colored top border when the boolean field is **true**; the first matching option wins. The field must be included in the dataset columns. Example: `[{"logicalName":"ispriority","color":"#e81123"}]`. |
| **Field widths on card** | Text | JSON array to set percentage width of fields on the card (e.g. `[{"logicalName":"description","width":100},{"logicalName":"estimatedvalue","width":50}]`). Width 100 = full width, 50 = half. Fields not listed use default width. |
| **Expand board to full width** | Yes/No | When **Yes**, the board uses the full view width and columns scale proportionally. Default: **No**. |
| **Allow creating new records from board** | Yes/No | When **No**, the add (+) button on each column header is hidden and new records cannot be created from the board. Default: **Yes**. |
| **Notification Position** | Enum | Position where toast messages (e.g. save success/failure) appear. Options: **Top**, **Top Start**, **Top End**, **Bottom**, **Bottom Start**, **Bottom End**. Default: **Top End** (top-right). |

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


### Examples – JSON configuration options

**Business Process Flow Step Order**
   ```json
   [{"id":"Develop","order":2},{"id":"Propose","order":1},{"id":"Close","order":0}]
   ```
   You can set the JSON in the control config: *View > Custom Controls > Kanban View Control > Business Process Flow Step Order > Edit > Bind to a static value > Paste JSON*.

**Hidden fields on card** (field logical names not shown on cards)
   ```json
   ["estimatedvalue","createdon","ownerid"]
   ```
   Or comma-separated: `estimatedvalue, createdon, ownerid`

**Boolean field highlights** (colored top border when boolean is true; first match wins)
   ```json
   [{"logicalName":"ispriority","color":"#e81123"},{"logicalName":"isblocked","color":"#ffaa00"}]
   ```
   The boolean fields must be included in the dataset columns. Supported color formats: hex (e.g. `#ff0000`), rgb, or CSS color names.

**Field widths on card** (percentage width per field; 100 = full width, 50 = half)
   ```json
   [{"logicalName":"description","width":100},{"logicalName":"estimatedvalue","width":50}]
   ```

**HTML fields on card** (render field content as HTML)
   ```json
   ["description","customhtmlfield"]
   ```

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
