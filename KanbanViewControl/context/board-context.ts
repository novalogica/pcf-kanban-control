import { createContext } from "react";
import { ColumnItem, ViewEntity, ViewItem } from "../interfaces";
import { IInputs } from "../generated/ManifestTypes";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";

export interface ConfigError {
  property: string;
  message: string;
}

export interface QuickFilterFieldConfig {
  key: string;
  text: string;
  /** true = multiselect filter (all except Boolean); false = single select (Boolean) */
  isMultiselect: boolean;
  /** true = filter is shown in a popup (e.g. "Weitere Filter") to save space; false = inline */
  inPopup?: boolean;
  /** true = DateTime/DateOnly field: use date filter UI (today, last 7/30 days, custom range) */
  isDateField?: boolean;
  /** true = numeric/currency field: use number filter UI (gt, lt, between) */
  isNumberField?: boolean;
}

export interface SortFieldConfig {
  key: string;
  text: string;
}

/** Filter preset from JSON config: id, display label, field -> filter value(s). Value per field: string (single) or string[] (multiselect). */
export interface FilterPresetConfig {
  id: string;
  label: string;
  filters: Record<string, string | string[]>;
}

export type SortDirection = "asc" | "desc";

interface IBoardContext {
  context: ComponentFramework.Context<IInputs>,
  activeView: ViewItem | undefined,
  setActiveView: React.Dispatch<React.SetStateAction<ViewItem | undefined>>,
  views: ViewItem[],
  columns: ColumnItem[],
  setColumns: React.Dispatch<React.SetStateAction<ColumnItem[]>>,
  activeViewEntity: ViewEntity | undefined,
  setActiveViewEntity: React.Dispatch<React.SetStateAction<ViewEntity | undefined>>,
  selectedEntity: string | undefined,
  /** Ref: true while dragging; used to avoid opening form on card click after a drag */
  draggingRef: React.MutableRefObject<boolean>,
  /** true while an entity form is being opened (popup); blocks further clicks and shows loading */
  isOpeningEntity: boolean,
  /** Opens entity form with loading state; prevents multiple opens */
  openFormWithLoading: (entityName: string, id?: string) => Promise<void>,
  /** Opens entity record in a new browser tab (_blank). Only used when showOpenInNewTabButton is true. */
  openEntityInNewTab: (entityName: string, id: string) => void,
  /** When true, show the "open in new tab" button on each card (top right). */
  showOpenInNewTabButton: boolean,
  /** Reported JSON/configuration validation errors (property name + message) */
  configErrors: ConfigError[],
  /** Reports a configuration error (e.g. invalid JSON); stored only once per property/message */
  reportConfigError: (property: string, message: string) => void,
  /** Clears reported errors for a property (e.g. when parse succeeds after fix) */
  clearConfigError: (property: string) => void,
  /** Quick filter: fields configured for filtering (from backend) */
  quickFilterFieldsConfig: QuickFilterFieldConfig[],
  /** Quick filter: current value per field. Multiselect fields: string[] | null; Boolean: string | null */
  quickFilterValues: Record<string, string | string[] | null>,
  /** Quick filter: set value for a field; null = no filter. Multiselect: string[] | null, otherwise string | null */
  setQuickFilterValue: (field: string, value: string | string[] | null) => void,
  /** Quick filter: options per field (distinct values from data) */
  quickFilterOptions: Record<string, IDropdownOption[]>,
  /** Custom full-text search: search term for all card fields */
  searchKeyword: string,
  /** Set search term; empty string = no search */
  setSearchKeyword: (value: string) => void,
  /** Sort: configured fields to choose from */
  sortFieldsConfig: SortFieldConfig[],
  /** Currently selected sort field (logicalName) or null = no sort */
  sortByField: string | null,
  /** Set sort field */
  setSortByField: (field: string | null) => void,
  /** Sort direction: ascending / descending */
  sortDirection: SortDirection,
  /** Set sort direction */
  setSortDirection: (dir: SortDirection) => void,
  /** Filter presets from config (JSON) */
  filterPresetsConfig: FilterPresetConfig[],
  /** Currently selected filter preset (id) or null = no preset */
  selectedFilterPresetId: string | null,
  /** Select preset and apply filters; null = deselect preset (filters remain unchanged) */
  applyFilterPreset: (presetId: string | null) => void,
}

export const BoardContext = createContext<IBoardContext>(undefined!);