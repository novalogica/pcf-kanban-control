import { createContext } from "react";
import { ViewItem } from "../interfaces";
import { IInputs } from "../generated/ManifestTypes";

/**
 * Context mit den (überwiegend stabilen) Werten, die Karten und Karten-Felder brauchen:
 * Navigations-Callbacks, Anzeige-Flags und das PCF-Context-Objekt.
 *
 * Bewusst getrennt vom BoardContext: Der BoardContext enthält häufig wechselnde Werte
 * (columns, quickFilterValues, searchKeyword, ...), die bei jeder Filter-/Sortier-/
 * Sucheingabe neu sind. Konsumierten die Karten diesen Context, würden sie bei jeder
 * solchen Interaktion neu rendern. Da CardActionsContext bei diesen Interaktionen stabil
 * bleibt (nur context/activeView/Callbacks), greift React.memo an den Karten.
 */
export interface ICardActionsContext {
  /** App-Locale (z. B. "en", "de") für lokalisierte UI-Strings auf der Karte. */
  locale: string;
  context: ComponentFramework.Context<IInputs>;
  activeView: ViewItem | undefined;
  openFormWithLoading: (entityName: string, id?: string) => Promise<void>;
  openEntityInNewTab: (entityName: string, id: string) => void;
  showOpenInNewTabButton: boolean;
  showCreateActivityButton: boolean;
  createActivityEntityType: string;
  openCreateActivityForm: (activityEntityName: string, parentEntityName: string, parentId: string, parentName?: string) => Promise<void>;
  showSharePointFolderButton: boolean;
  openSharePointFolderInNewTab: (entityName: string, id: string, recordDisplayName?: string | null) => Promise<void>;
}

export const CardActionsContext = createContext<ICardActionsContext>(undefined!);
