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
| **Filter out Business Process Flows** | Text | Provide an array of strings with the business process flow names to filter out. Those BPFs will not appear in the "View type" dropdown. |
| **Business Process Flow Step Order** | Text | JSON array to control the order of business process flow stages (e.g. `[{"id":"Develop","order":2},{"id":"Propose","order":1}]`). |
| **Hide View By if default View By set?** | Yes/No | When **Yes**, the "View type" dropdown is hidden if a default view is configured. Use this for a fixed view without switching. |
| **Allow moving cards** | Yes/No | When **No**, drag-and-drop is disabled; cards cannot be moved between columns. Clicking a card still opens the record. Default: **Yes**. |
| **Hide empty columns** | Yes/No | When **Yes**, columns that contain no cards are not shown. Default: **No**. |
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


### Example - Business Process Flow Step Order (JSON string)
   ```sh
   [{"id":"Develop","order":2},{"id":"Propose","order":1},{"id":"Close","order":0}]
   ```
You can set the JSON data in the input using the old interface 
##### (View > Custom Controls > Kanban View Control > Business Process Flow Steps > Edit > Bind to a static value > Paste JSON)

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
