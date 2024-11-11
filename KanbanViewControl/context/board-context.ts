import { createContext } from "react";
import { ColumnItem, ViewItem } from "../interfaces";
import { IInputs } from "../generated/ManifestTypes";

interface IBoardContext {
  context: ComponentFramework.Context<IInputs>,
  
  activeView: ViewItem | undefined,
  setActiveView: React.Dispatch<React.SetStateAction<ViewItem | undefined>>,
  
  views: ViewItem[],

  columns: ColumnItem[],
  setColumns: React.Dispatch<React.SetStateAction<ColumnItem[]>>
}

export const BoardContext = createContext<IBoardContext>(undefined!);