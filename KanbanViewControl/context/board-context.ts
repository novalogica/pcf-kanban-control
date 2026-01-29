import { createContext } from "react";
import { ColumnItem, ViewEntity, ViewItem } from "../interfaces";
import { IInputs } from "../generated/ManifestTypes";

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
}

export const BoardContext = createContext<IBoardContext>(undefined!);