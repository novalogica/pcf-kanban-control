import { DropResult, DraggableStateSnapshot, DraggableStyle } from "@hello-pangea/dnd";
import { ColumnItem, CardItem } from "../interfaces";

export const moveCard = async (columns: ColumnItem[], sourceCard: CardItem | undefined, result: DropResult) => {
  let copy = [...columns];

  const itemId = result.draggableId;
  const sourceColumn = columns.find(c => c.id == result.source.droppableId);
  const destinationColumn = columns.find(c => c.id == result.destination?.droppableId);
  const sourceColumnCardIndex = sourceColumn?.cards?.findIndex(i => i.id === itemId);

  if (sourceColumnCardIndex !== undefined && sourceColumnCardIndex !== -1 && sourceCard) {
    copy = copy.map(col => {
      if (col.id === sourceColumn?.id) {
        return {
          ...col,
          cards: col.cards?.filter((_, index) => index !== sourceColumnCardIndex),
        };
      }
      return col;
    });

    return copy.map(col => {
      if (col.id === destinationColumn?.id) {
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