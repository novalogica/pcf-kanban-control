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

  const resolveValidationFunction = () => {
    if (!cardMoveValidationFunctionName) return undefined;
    const path = cardMoveValidationFunctionName.split(".").map((p) => p.trim()).filter(Boolean);
    if (path.length === 0) return undefined;
    let current: any = (window as any);
    for (const part of path) {
      if (current == null) return undefined;
      current = current[part];
    }
    return typeof current === "function" ? current : undefined;
  };

  const runCardMoveValidator = async (
    args: CardMoveValidationArgs
  ): Promise<{ allow: boolean; message?: string }> => {
    const fn = resolveValidationFunction();
    if (!fn) {
      if (cardMoveValidationFunctionName) {
        return {
          allow: false,
          message: strings.toastValidationFunctionNotFound,
        };
      }
      return { allow: true };
    }

    try {
      const result = fn(args);
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

  const onDragEnd = async (result: DropResult, record: any) => {
    if (result.destination == null) {
      return;
    }

    if(activeView?.type === "BPF"){
      try {
        await openFormWithLoading(record.entityName, record.id)
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        context.parameters.dataset.refresh();
      }
      return;
    }

    let movedCards: ColumnItem[] | undefined

    const itemId = result.draggableId;
    const sourceColumn = columns.find(c => c.id == result.source.droppableId);
    const destinationColumn = columns.find(c => c.id == result.destination?.droppableId);
    const sourceCard = sourceColumn?.cards?.find(i => i.id === itemId);

    if (sourceColumn?.id !== destinationColumn?.id) {
      const updateFieldName = Object.keys(record.update ?? {})[0];
      const newValue = updateFieldName ? record.update[updateFieldName] : undefined;

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
        return;
      }
    }

    // Do not save when the card was only moved within the same column
    if (sourceColumn?.id === destinationColumn?.id) {
      movedCards = await moveCard(columns, sourceCard, result);
      setColumns(movedCards ?? []);
      return movedCards;
    }

    movedCards = await moveCard(columns, sourceCard, result);
    setColumns(movedCards ?? [])

    const columnName = record.columnName ?? strings.toastUnallocated;
    const response = await toast.promise(
      updateRecord(record),
      {
        loading: strings.toastSaving,
        success: strings.toastSuccessMoved(columnName),
        error: (e) => e.message,
      }
    );
    
    if(!response) {
      const oldValue = sourceColumn?.title;
      (sourceCard![Object.keys(record.update)[0]] as CardInfo).value = oldValue as string
      movedCards = await moveCard(columns, sourceCard, result)
    } else {
      const updatedValue = destinationColumn?.title;
      (sourceCard![Object.keys(record.update)[0]] as CardInfo).value = updatedValue as string
      movedCards = await moveCard(columns, sourceCard, result)
    }

    setColumns(movedCards ?? [])
    return movedCards
  };

  return { 
    onDragEnd,
  }
}