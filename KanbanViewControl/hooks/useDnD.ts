import { CardInfo, ColumnItem } from "../interfaces";
import {useDataverse} from "./useDataverse";
import { DropResult } from "@hello-pangea/dnd";
import { BoardContext } from '../context/board-context';
import { useContext } from 'react';
import toast from "react-hot-toast";
import { useNavigation } from "./useNavigation";
import { moveCard } from "../lib/card-drag";

export type ColumnId = ColumnItem[][number]["id"];

export const useDnD = (columns: ColumnItem[]) => {
  const { context, activeView, setColumns } = useContext(BoardContext);
  const { updateRecord } = useDataverse(context);
  const { openForm } = useNavigation(context);

  const uiTexts = {
      movedSuccess: context.parameters.successMessage?.raw ?? "Successfully moved to {columnName} 🎉",
      loadingText: context.parameters.savingText?.raw ?? "Saving...",
  }
  
  const onDragEnd = async (result: DropResult, record: any) => {
    if (result.destination == null) {
      return;
    }

    if(activeView?.type === "BPF"){
      try {
        await openForm(record.entityName, record.id)
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

    movedCards = await moveCard(columns, sourceCard, result);
    setColumns(movedCards ?? [])

    const successMessage = uiTexts.movedSuccess.replace("{columnName}", destinationColumn?.title ?? "Unallocated");

    const response = await toast.promise(
      updateRecord(record),
      {
        loading: uiTexts.loadingText,
        success: successMessage,
        error: (e) => e.message,
      }
    )
    
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