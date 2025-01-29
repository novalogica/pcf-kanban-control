import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { ColumnItem } from "./column.type";

export interface ViewItem extends IDropdownOption {
    type?: string
    uniqueName?: string,
    columns?: ColumnItem[],
    records?: any[]
  }