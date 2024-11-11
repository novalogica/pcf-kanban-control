import * as React from 'react';
import { useContext } from 'react';
import { CommandBar, Column } from '..';
import { DragDropContext, DropResult, ResponderProvided } from '@hello-pangea/dnd';
import toast from "react-hot-toast";
import { BoardContext } from '../../context/board-context';
import { useDnD } from '../../hooks/useDnD';
import { isNullOrEmpty } from '../../lib/utils';

const Board = () => {
  const { columns, setColumns } = useContext(BoardContext);
  const { onDragEnd } = useDnD(columns);

  const handleCardDrag = (result: DropResult, _: ResponderProvided) => {
    const updatedColumns = onDragEnd(result);

    if(isNullOrEmpty(updatedColumns))
      return;
    
    setColumns(updatedColumns ?? []);

    toast.success("Card moved successfully");
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