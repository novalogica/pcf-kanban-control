import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import IconButton from "../button/IconButton";
import { ColumnItem } from "../../interfaces";
import { useContext, useMemo } from "react";
import { BoardContext } from "../../context/board-context";
import { useNavigation } from "../../hooks/useNavigation";

interface IProps {
  column: ColumnItem
}

const ColumnHeader = ({ column }: IProps) => {
  const { context, activeView } = useContext(BoardContext);
  const { createNewRecord } = useNavigation(context);

  const onAddNewRecord = async (column: string) => {
    await createNewRecord(activeView?.key as string, column);
    context.parameters.dataset.refresh();
  };
  
  const count = useMemo(() => {
    return column.cards?.length ?? 0
  }, [column.cards])

  return ( 
    <div className="column-header-container">
      <div className="column-header">
        <Text variant="xLarge" nowrap>{column.title}</Text>
        <div className="column-actions">
          { count > 0 && <Text variant="small" className="column-counter">{count}</Text> }
          <IconButton iconName='Add' onClick={() => {onAddNewRecord(column.id as string)}} noBorder/>
        </div>
      </div>
    </div>
  );
}

export default ColumnHeader;