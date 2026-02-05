import { CardInfo, ColumnItem } from "../interfaces";
import { useDataverse } from "./useDataverse";
import { DropResult } from "@hello-pangea/dnd";
import { BoardContext } from "../context/board-context";
import { useContext } from "react";
import toast from "react-hot-toast";
import { moveCard } from "../lib/card-drag";
import { getStrings } from "../lib/strings";

export type ColumnId = ColumnItem[][number]["id"];

export const useDnD = (columns: ColumnItem[]) => {
  const { context, locale, activeView, setColumns, openFormWithLoading } = useContext(BoardContext);
  const strings = getStrings(locale);
  const { updateRecord } = useDataverse(context);
  
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