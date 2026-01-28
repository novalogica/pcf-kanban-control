import * as React from 'react';
import { useContext, useMemo } from 'react';
import { CommandBar, Column } from '..';
import { DragDropContext, DropResult, ResponderProvided } from '@hello-pangea/dnd';
import { BoardContext } from '../../context/board-context';
import { useDnD } from '../../hooks/useDnD';
import { pluralizedLogicalNames } from '../../lib/utils';

const Board = () => {
  const { context, columns, selectedEntity, activeView, draggingRef } = useContext(BoardContext);
  const { onDragEnd } = useDnD(columns);

  const allowCardMove = useMemo(() => {
    const raw = (context.parameters as { allowCardMove?: { raw?: boolean } }).allowCardMove?.raw;
    return raw !== false;
  }, [context.parameters]);

  const handleDragStart = () => {
    draggingRef.current = true;
  };

  const handleCardDrag = async (result: DropResult, _: ResponderProvided) => {
    try {
      const field = activeView?.uniqueName
      const columnName = activeView?.columns?.find(column => column.id == result.destination?.droppableId)?.title
      const logicalName = pluralizedLogicalNames(selectedEntity as string)
      const record = {
        update: {
          [field as string]: result.destination?.droppableId == "unallocated" ? null : result.destination?.droppableId
        },
        logicalName: logicalName,
        entityName: selectedEntity,
        id: result.draggableId,
        columnName
      }

      await onDragEnd(result, record);
      context.parameters.dataset.refresh();
    } finally {
      setTimeout(() => { draggingRef.current = false; }, 150);
    }
  }

  const hideViews = useMemo(() => {
    return context.parameters.hideViewBy?.raw
  },[context.parameters.hideViewBy])

  const columnsContent = columns?.map((column) => (
    <Column key={column.id} column={column} />
  ));

  return (
    <div className='main-container'>
      {
        !hideViews && <CommandBar />
      }
      <div className='kanban-container'>
          <div className='columns-wrapper'>
            {allowCardMove ? (
              <DragDropContext onDragStart={handleDragStart} onDragEnd={handleCardDrag}>
                {columnsContent}
              </DragDropContext>
            ) : (
              columnsContent
            )}
          </div>
      </div>
    </div>
  )
}

export default Board;