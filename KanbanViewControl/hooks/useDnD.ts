import { CardInfo, ColumnItem, CardItem } from "../interfaces";
import { useDataverse } from "./useDataverse";
import { DropResult } from "@hello-pangea/dnd";
import { BoardContext } from "../context/board-context";
import { useContext } from "react";
import toast from "react-hot-toast";
import { moveCard } from "../lib/card-drag";
import { getStrings } from "../lib/strings";

export type ColumnId = ColumnItem[][number]["id"];

export interface CardMoveValidationArgs {
  recordId: string;
  entityName: string;
  logicalName: string;
  fieldName: string;
  newValue: unknown;
  sourceColumnId: ColumnId | null;
  sourceColumnTitle: string | null;
  destinationColumnId: ColumnId | null;
  destinationColumnTitle: string | null;
  card: CardItem | undefined;
}

export const useDnD = (columns: ColumnItem[]) => {
  const {
    context,
    locale,
    activeView,
    setColumns,
    openFormWithLoading,
    cardMoveValidationFunctionName,
  } = useContext(BoardContext);
  const strings = getStrings(locale);
  const { updateRecord } = useDataverse(context);

  const resolveValidationFunction = (): { fn: (args: CardMoveValidationArgs) => unknown; owner: unknown } | undefined => {
    if (!cardMoveValidationFunctionName) return undefined;
    const path = cardMoveValidationFunctionName.split(".").map((p) => p.trim()).filter(Boolean);
    if (path.length === 0) return undefined;
    let current: any = (window as any);
    for (const part of path) {
      if (current == null) return undefined;
      current = current[part];
    }
    if (typeof current !== "function") return undefined;
    const fn = current as (args: CardMoveValidationArgs) => unknown;
    if (path.length === 1) {
      return { fn, owner: undefined };
    }
    let owner: any = (window as any);
    for (let i = 0; i < path.length - 1; i++) {
      if (owner == null) return { fn, owner: undefined };
      owner = owner[path[i]];
    }
    return { fn, owner };
  };

  const runCardMoveValidator = async (
    args: CardMoveValidationArgs
  ): Promise<{ allow: boolean; message?: string }> => {
    const resolved = resolveValidationFunction();
    if (!resolved) {
      if (cardMoveValidationFunctionName) {
        return {
          allow: false,
          message: strings.toastValidationFunctionNotFound,
        };
      }
      return { allow: true };
    }

    const { fn, owner } = resolved;
    try {
      const result = owner != null ? fn.call(owner, args) : fn(args);
      const awaited = result && typeof (result as Promise<unknown>).then === "function"
        ? await (result as Promise<unknown>)
        : result;

      if (awaited == null) {
        return { allow: true };
      }

      if (typeof awaited === "boolean") {
        return { allow: awaited };
      }

      if (typeof awaited === "object" && "allow" in (awaited as any)) {
        const allow = Boolean((awaited as any).allow);
        const message =
          typeof (awaited as any).message === "string" ? (awaited as any).message : undefined;
        return { allow, message };
      }

      return { allow: Boolean(awaited) };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        allow: false,
        message,
      };
    }
  };

  const onDragEnd = async (result: DropResult, record: any): Promise<{ shouldRefresh: boolean }> => {
    if (result.destination == null) {
      return { shouldRefresh: false };
    }

    if(activeView?.type === "BPF"){
      // BPF: Stage wird im Formular geaendert (kein optimistischer Move). Das einmalige
      // Neuladen uebernimmt der Aufrufer (Board) anhand von shouldRefresh -> kein doppeltes
      // dataset.refresh() mehr.
      try {
        await openFormWithLoading(record.entityName, record.id)
      } catch (e: any) {
        toast.error(e.message);
      }
      return { shouldRefresh: true };
    }

    const itemId = result.draggableId;
    const sourceColumn = columns.find(c => c.id == result.source.droppableId);
    const destinationColumn = columns.find(c => c.id == result.destination?.droppableId);
    const sourceCard = sourceColumn?.cards?.find(i => i.id === itemId);

    // SYNCHRON und als Erstes: optimistisches Verschieben, damit @hello-pangea/dnd die
    // Karte an der Zielposition einrasten lässt. Passiert der State-Update erst nach einem
    // await (Validierung/Speichern), animiert die Bibliothek die Karte sichtbar zurück.
    const movedCards = moveCard(columns, sourceCard, result);
    setColumns(movedCards ?? []);

    // Verschieben innerhalb derselben Spalte: nur Neuordnung, kein Speichern, kein Reload.
    if (sourceColumn?.id === destinationColumn?.id) {
      return { shouldRefresh: false };
    }

    const updateFieldName = Object.keys(record.update ?? {})[0];
    const newValue = updateFieldName ? record.update[updateFieldName] : undefined;

    // Optionale Validierung NACH dem optimistischen Move; bei Ablehnung Rollback.
    const validation = await runCardMoveValidator({
      recordId: record.id,
      entityName: record.entityName,
      logicalName: record.logicalName,
      fieldName: updateFieldName,
      newValue,
      sourceColumnId: (sourceColumn?.id ?? null) as ColumnId | null,
      sourceColumnTitle: sourceColumn?.title ?? null,
      destinationColumnId: (destinationColumn?.id ?? null) as ColumnId | null,
      destinationColumnTitle: destinationColumn?.title ?? null,
      card: sourceCard,
    });

    if (!validation.allow) {
      if (validation.message) {
        toast.error(validation.message);
      }
      setColumns(columns); // Rollback auf den Ausgangszustand
      return { shouldRefresh: false };
    }

    const columnName = record.columnName ?? strings.toastUnallocated;
    const response = await toast.promise(
      updateRecord(record),
      {
        loading: strings.toastSaving,
        success: strings.toastSuccessMoved(columnName),
        error: (e) => e.message,
      }
    );

    if (!response) {
      setColumns(columns); // Rollback: Karte zurück in die Ausgangsspalte
      return { shouldRefresh: false };
    }

    if (updateFieldName) {
      // Gruppierungsfeld auf der Karte auf den neuen Spaltenwert setzen
      // (bis dataset.refresh die serverseitige Wahrheit nachliefert).
      (sourceCard![updateFieldName] as CardInfo).value = destinationColumn?.title as string;
    }

    // Nur bei tatsaechlich persistiertem Spaltenwechsel neu laden (Server-Wahrheit /
    // ggf. Plugin-Nebeneffekte). Der optimistische Move steht bereits.
    return { shouldRefresh: true };
  };

  return { 
    onDragEnd,
  }
}