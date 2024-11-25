/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockColumns } from "../mock/data";
import { ColumnItem } from "../interfaces";
import {useDataverse} from "./useDataverse";
import { DraggableStateSnapshot, DraggableStyle, DropResult } from "@hello-pangea/dnd";
import { BoardContext } from '../context/board-context';
import { useContext } from 'react';
import toast from "react-hot-toast";

export type ColumnId = (typeof mockColumns)[number]["id"];

export const useDnD = (columns: ColumnItem[]) => {
  const { context } = useContext(BoardContext);
  const { updateRecord } = useDataverse(context);
  
  const onDragEnd = async (result: DropResult, record: any) => {
    if (result.destination == null) {
      return;
    }


    toast.promise(
      updateRecord(record),
      {
        loading: 'Saving...',
        success: `Successfully moved to "${record.columnName}" 🎉`,
        error: (e) => e.message,
      }
    )

    console.log("columns", columns)

    const itemId = result.draggableId;
    const sourceColumn = columns.find(c => c.id == result.source.droppableId);
    const destinationColumn = columns.find(c => c.id == result.destination?.droppableId);

    let copy = [...columns];

    if (!sourceColumn || !destinationColumn) {
      return;
    }

    const sourceCard = sourceColumn.cards?.find(i => i.id === itemId);
    const sourceColumnCardIndex = sourceColumn.cards?.findIndex(i => i.id === itemId);

    if (sourceColumnCardIndex !== undefined && sourceColumnCardIndex !== -1 && sourceCard) {
      copy = copy.map(col => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            cards: col.cards?.filter((_, index) => index !== sourceColumnCardIndex),
          };
        }
        return col;
      });

      return copy.map(col => {
        if (col.id === destinationColumn.id) {
          return {
            ...col,
            cards: [
              ...col.cards?.slice(0, result.destination!.index) ?? [],
              sourceCard,
              ...col.cards?.slice(result.destination!.index) ?? [],
            ],
          };
        }
        return col;
      });
    }
  };

  return { 
    onDragEnd,
  }
}

export const getListStyle = (isDraggingOver: boolean): React.CSSProperties => ({
  background: isDraggingOver ? 'rgba(206, 242, 206, 0.25)' : undefined,
  borderRadius: isDraggingOver ? 10 : 0,
});

export const getItemStyle = (snapshot: DraggableStateSnapshot, style?: DraggableStyle) => {
  if (!snapshot.isDragging || !snapshot.dropAnimation) {
    return style;
  }

  const { moveTo, curve, duration } = snapshot.dropAnimation;
  const translate = `translate(${moveTo.x}px, ${moveTo.y}px)`;
  const scale = 'scale(0.90)';
  const rotate = 'rotate(-0.004turn)';

  return {
    ...style,
    transform: `${translate} ${scale} ${rotate}`,
    transition: `all ${curve} ${duration + 0.25}s`,
  };
};