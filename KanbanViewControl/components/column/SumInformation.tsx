import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import { BoardContext } from "../../context/board-context";
import { useContext, useMemo } from "react";
import { CardInfo, CardItem, ColumnItem } from "../../interfaces";

const SumInformation = ({ column }: { column: ColumnItem }) => {
  const { context } = useContext(BoardContext);
  
  const sum = useMemo(() => {
    const fieldName = context.parameters.sumField.raw;

    if(fieldName == null)
      return 0;

    return column.cards?.reduce((acc, item) => acc + ((item[fieldName] as CardInfo).value as number), 0) ?? 0
  }, [column.cards])

  return ( 
    <div className="column-header-sum">
      <Text className="card-info-label" variant="small">Est. Amount</Text>
      <Text className="sum-value" variant="small">{context.formatting.formatCurrency(sum)}</Text>
    </div>
  );
}

export default SumInformation;