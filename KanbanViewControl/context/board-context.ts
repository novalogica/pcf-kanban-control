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
}

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
  /** Reported JSON/configuration validation errors (property name + message) */
  configErrors: ConfigError[],
  /** Reports a configuration error (e.g. invalid JSON); stored only once per property/message */
  reportConfigError: (property: string, message: string) => void,
  /** Quick filter: fields configured for filtering (from backend) */
  quickFilterFieldsConfig: QuickFilterFieldConfig[],
  /** Quick filter: current selected value per field (display value for comparison) */
  quickFilterValues: Record<string, string | null>,
  /** Quick filter: set selected value for a field; null = no filter */
  setQuickFilterValue: (field: string, value: string | null) => void,
  /** Quick filter: options per field (distinct values from data) */
  quickFilterOptions: Record<string, IDropdownOption[]>,
}

export const BoardContext = createContext<IBoardContext>(undefined!);