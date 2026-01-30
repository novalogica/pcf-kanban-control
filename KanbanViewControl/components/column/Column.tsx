import * as React from "react";
import { useContext, useCallback } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import Card from "../card/Card";
import ColumnHeader from "./ColumnHeader";
import { ColumnItem } from "../../interfaces";
import { isNullOrEmpty } from "../../lib/utils";
import NoResults from "../container/no-results";
import { getItemStyle, getListStyle } from "../../lib/card-drag";
import { BoardContext } from "../../context/board-context";

const Column = ({ column }: { column: ColumnItem }) => {
  const { context, draggingRef, openFormWithLoading } = useContext(BoardContext);
  const allowCardMove = ((context.parameters as unknown) as { allowCardMove?: { raw?: boolean } }).allowCardMove?.raw !== false;
  const hasCards = !isNullOrEmpty(column.cards) && column.cards!.length > 0;

  const handleCardWrapperClick = useCallback(
    (itemId: string | number) => () => {
      if (!draggingRef.current) {
        openFormWithLoading(context.parameters.dataset.getTargetEntityType(), String(itemId));
      }
    },
    [context.parameters.dataset, draggingRef, openFormWithLoading]
  );

  if (!allowCardMove) {
    return (
      <div className="column-container">
        <ColumnHeader column={column} />
        <div className="cards-wrapper">
          {hasCards && column.cards?.map((item) => (
            <div key={item.id}>
              <Card item={item} draggable={false} />
            </div>
          ))}
          {(isNullOrEmpty(column.cards) || column.cards!.length <= 0) && <NoResults />}
        </div>
      </div>
    );
  }

  return (
    <div className="column-container">
      <ColumnHeader column={column} />
      <Droppable key={column.id.toString()} droppableId={column.id.toString()}>
        {(provided, snapshot) => (
            <div 
              ref={provided.innerRef} 
              className="cards-wrapper" 
              style={getListStyle(snapshot.isDraggingOver)}
              {...provided.droppableProps}
            >
              {
                hasCards && column.cards?.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id.toString()}
                    index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.dragHandleProps}
                          {...provided.draggableProps}
                          style={getItemStyle(snapshot, provided.draggableProps.style)}
                          onClick={handleCardWrapperClick(item.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && !draggingRef.current) {
                              e.preventDefault();
                              openFormWithLoading(context.parameters.dataset.getTargetEntityType(), String(item.id));
                            }
                          }}
                        >
                          <Card key={item.id} item={item} />
                        </div>
                      )}
                  </Draggable>
                ))
              }
              {
                (isNullOrEmpty(column.cards) || column.cards!.length <= 0) && <NoResults />
              }
              {provided.placeholder}
            </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column;