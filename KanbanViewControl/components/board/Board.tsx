import * as React from 'react';
import { useContext } from 'react';
import { CommandBar, Column } from '..';
import { DragDropContext, DropResult, ResponderProvided } from '@hello-pangea/dnd';
import { BoardContext } from '../../context/board-context';
import { useDnD } from '../../hooks/useDnD';
import { isNullOrEmpty, pluralizedLogicalNames } from '../../lib/utils';

const Board = () => {
  const { columns, setColumns, selectedEntity, activeView} = useContext(BoardContext);
  const { onDragEnd } = useDnD(columns);

  const handleCardDrag = async (result: DropResult, _: ResponderProvided) => {

    const field = activeView?.uniqueName
    const columnName = activeView?.columns?.find(column => column.id == result.destination?.droppableId)?.title
    const logicalName = pluralizedLogicalNames(selectedEntity as string)
    const record = {
      update: {
        [field as string]: result.destination?.droppableId
      },
      logicalName: logicalName,
      entityName: selectedEntity,
      id: result.draggableId,
      columnName
    }


    const updatedColumns = await onDragEnd(result, record);

    if(isNullOrEmpty(updatedColumns))
      return;
    
    setColumns(updatedColumns ?? []);
  }

  return (
    <div className='main-container'>
      <CommandBar />
      <div className='kanban-container'>
          <div className='columns-wrapper'>
            <DragDropContext onDragEnd={handleCardDrag}>
              {
                columns && columns.map((column) => (
                  <Column key={column.id} column={column} />
                ))
              }
            </DragDropContext>
          </div>
      </div>
    </div>
  )
}

export default Board;