import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import IconButton from "../button/IconButton";
import { CardInfo, ColumnItem } from "../../interfaces";
import { useContext, useMemo } from "react";
import { BoardContext } from "../../context/board-context";
import SumInformation from "./SumInformation";
import { validateSumProperty } from "../../lib/utils";

interface IProps {
  column: ColumnItem
}

const ColumnHeader = ({ column }: IProps) => {
  const { context } = useContext(BoardContext);
  
  const count = useMemo(() => {
    return column.cards?.length ?? 0
  }, [column.cards])

  return ( 
    <div className="column-header-container">
      <div className="column-header">
        <Text variant="xLarge" nowrap>{column.title}</Text>
        <div className="column-actions">
          { count > 0 && <Text variant="small" className="column-counter">{count}</Text> }
          <IconButton iconName='Add' onClick={() => {}} noBorder/>
        </div>
      </div>
      {
        context.parameters.sumField.raw 
        && validateSumProperty(column.cards ?? [], context.parameters.sumField.raw as string)
        && <SumInformation column={column} />
      }
    </div>
  );
}

export default ColumnHeader;