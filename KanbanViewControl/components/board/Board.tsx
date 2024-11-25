import * as React from 'react';
import { useContext } from 'react';
import { CommandBar, Column } from '..';
import { DragDropContext, DropResult, ResponderProvided } from '@hello-pangea/dnd';
import toast from "react-hot-toast";
import { BoardContext } from '../../context/board-context';
import { useDnD } from '../../hooks/useDnD';
import { isNullOrEmpty } from '../../lib/utils';

const Board = () => {
  const { columns, setColumns, selectedEntity, activeView} = useContext(BoardContext);
  const { onDragEnd } = useDnD(columns);

  const handleCardDrag = async (result: DropResult, _: ResponderProvided) => {
    console.log("drag", result);
    console.log("view", activeView)
    console.log("entity", selectedEntity)

    const field = activeView?.uniqueName
    const columnName = activeView?.columns?.find(column => column.id == result.destination?.droppableId)?.title
    //const pluralize = (word) => word.endsWith('y') ? word.slice(0, -1) + 'ies' : word + 's';
    const logicalName = selectedEntity?.endsWith('y') ? selectedEntity.slice(0, -1) + 'ies' : selectedEntity + 's';
    const record = {
      update: {
        [field as string]: result.destination?.droppableId
      },
      logicalName: logicalName,
      id: result.draggableId,
      columnName
    }

    const updatedColumns = await onDragEnd(result, record);
    console.log(updatedColumns)

    if(isNullOrEmpty(updatedColumns))
      return;
    
    setColumns(updatedColumns ?? []);

    //toast.success("Card moved successfully");
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