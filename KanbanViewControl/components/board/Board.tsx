import * as React from "react";
import { useContext, useMemo } from "react";
import { CommandBar, Column } from "..";
import {
  DragDropContext,
  DropResult,
  ResponderProvided,
} from "@hello-pangea/dnd";
import { BoardContext } from "../../context/board-context";
import { useDnD } from "../../hooks/useDnD";
import { pluralizedLogicalNames } from "../../lib/utils";

const Board = () => {
  const { context, columns, selectedEntity, activeView } =
    useContext(BoardContext);
  const { onDragEnd } = useDnD(columns);

  const handleCardDrag = async (result: DropResult, _: ResponderProvided) => {
    const field = activeView?.uniqueName;
    const columnName = activeView?.columns?.find(
      (column) => column.id == result.destination?.droppableId
    )?.title;
    const logicalName = pluralizedLogicalNames(selectedEntity as string);
    const record = {
      update: {
        [field as string]:
          result.destination?.droppableId == "unallocated"
            ? null
            : result.destination?.droppableId,
      },
      logicalName: logicalName,
      entityName: selectedEntity,
      id: result.draggableId,
      columnName,
    };

    await onDragEnd(result, record);
    context.parameters.dataset.refresh();
  };

  const hideViews = useMemo(() => {
    return context.parameters.hideViewBy?.raw;
  }, [context.parameters.hideViewBy]);

  return (
    <div className="main-container">
      {!hideViews && columns && columns.length > 0 && <CommandBar />}
      <div className="kanban-container">
        <div className="columns-wrapper">
          {columns && columns.length > 0 && (
            <DragDropContext onDragEnd={handleCardDrag}>
              {columns &&
                columns.map((column) => (
                  <Column key={column.id} column={column} />
                ))}
            </DragDropContext>
          )}
          {(!columns || columns.length === 0) && (
            <div className="no-columns">
              <div className="no-data-content">
                <span className="no-data-text">No records found</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
