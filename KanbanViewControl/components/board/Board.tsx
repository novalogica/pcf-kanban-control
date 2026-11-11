import * as React from "react";
import { useContext, useMemo } from "react";
import { CommandBar, Column, QuickFilters } from "..";
import {
  DragDropContext,
  DropResult,
  ResponderProvided,
} from "@hello-pangea/dnd";
import { BoardContext } from "../../context/board-context";
import { useDnD } from "../../hooks/useDnD";
import { pluralizedLogicalNames, hasActiveFilters } from "../../lib/utils";
import { getStrings } from "../../lib/strings";

const Board = () => {
  const { locale, context, columns, selectedEntity, activeView, draggingRef, quickFilterValues, searchKeyword, selectedFilterPresetId } =
    useContext(BoardContext);
  const strings = getStrings(locale);
  const filtersActive = hasActiveFilters(quickFilterValues, searchKeyword, selectedFilterPresetId);
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

      const outcome = await onDragEnd(result, record);
      // Nur neu laden, wenn onDragEnd es signalisiert (persistierter OptionSet-Wechsel
      // oder BPF-Formular). Kein Refresh bei Reorder, Ablehnung oder Fehler; im BPF-Fall
      // refresht onDragEnd nicht mehr selbst -> kein doppeltes dataset.refresh().
      if (outcome?.shouldRefresh) {
        context.parameters.dataset.refresh();
      }
    } finally {
      setTimeout(() => {
        draggingRef.current = false;
      }, 150);
    }
  };

  const hideViews = useMemo(() => {
    return context.parameters.hideViewBy?.raw;
  }, [context.parameters.hideViewBy]);

  const hideEmptyColumns = useMemo(() => {
    return (context.parameters as { hideEmptyColumns?: { raw?: boolean } }).hideEmptyColumns?.raw === true;
  }, [context.parameters]);

  const expandBoardToFullWidth = useMemo(() => {
    return (context.parameters as { expandBoardToFullWidth?: { raw?: boolean } }).expandBoardToFullWidth?.raw === true;
  }, [context.parameters]);

  const minColumnWidthPx = useMemo(() => {
    const raw = (context.parameters as { minColumnWidth?: { raw?: string } }).minColumnWidth?.raw;
    if (raw == null || String(raw).trim() === "") return undefined;
    const n = parseInt(String(raw).trim(), 10);
    if (Number.isNaN(n) || n < 200 || n > 1200) return undefined;
    return n;
  }, [context.parameters]);

  const maxColumnWidthPx = useMemo(() => {
    const raw = (context.parameters as { maxColumnWidth?: { raw?: string } }).maxColumnWidth?.raw;
    if (raw == null || String(raw).trim() === "") return undefined;
    const n = parseInt(String(raw).trim(), 10);
    if (Number.isNaN(n) || n < 200 || n > 2000) return undefined;
    return n;
  }, [context.parameters]);

  const columnWidthsMap = useMemo(() => {
    const raw = (context.parameters as { columnWidths?: { raw?: string } }).columnWidths?.raw;
    if (raw == null || String(raw).trim() === "") return new Map<string, number>();
    try {
      const arr = JSON.parse(raw) as { id?: string; width?: number }[];
      if (!Array.isArray(arr)) return new Map<string, number>();
      const map = new Map<string, number>();
      for (const item of arr) {
        if (item?.id != null && typeof item.width === "number") {
          const w = Math.min(1200, Math.max(200, item.width));
          map.set(String(item.id), w);
        }
      }
      return map;
    } catch {
      return new Map<string, number>();
    }
  }, [context.parameters]);

  const visibleColumns = useMemo(() => {
    if (!columns) return [];
    if (!hideEmptyColumns) return columns;
    return columns.filter((col) => (col.cards?.length ?? 0) > 0);
  }, [columns, hideEmptyColumns]);

  const columnsContent = visibleColumns.map((column) => (
    <Column
      key={column.id}
      column={column}
      widthPx={columnWidthsMap.get(column.id.toString())}
    />
  ));

  return (
    <div className="main-container">
      <QuickFilters />
      {!hideViews && <CommandBar />}
      <div className="kanban-container">
        <div
          className={`columns-wrapper${expandBoardToFullWidth ? " columns-wrapper--full-width" : ""}`}
          style={{
            ...(minColumnWidthPx != null ? { "--min-column-width": `${minColumnWidthPx}px` } : {}),
            ...(maxColumnWidthPx != null ? { "--max-column-width": `${maxColumnWidthPx}px` } : {}),
          } as React.CSSProperties}
        >
          {allowCardMove ? (
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleCardDrag}>
              {columnsContent}
            </DragDropContext>
          ) : (
            columnsContent
          )}
          {visibleColumns.length === 0 && (
            <div className="no-columns">
              <div className="no-data-content">
                <span className="no-data-text">{filtersActive ? strings.noRecordsForFilters : strings.noRecordsFound}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
