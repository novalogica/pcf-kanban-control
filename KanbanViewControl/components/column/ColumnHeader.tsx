import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import IconButton from "../button/IconButton";
import { ColumnItem } from "../../interfaces";
import { useContext, useMemo } from "react";
import { BoardContext } from "../../context/board-context";
import { useNavigation } from "../../hooks/useNavigation";
import { getCurrencySymbolFromFormatted } from "../../lib/utils";

interface IProps {
  column: ColumnItem
}

const ColumnHeader = ({ column }: IProps) => {
  const { context, activeView } = useContext(BoardContext);
  const { createNewRecord } = useNavigation(context);

  const allowCreateNew = (context.parameters as { allowCreateNew?: { raw?: boolean } }).allowCreateNew?.raw !== false;

  const onAddNewRecord = async (column: string) => {
    await createNewRecord(activeView?.key as string, column);
    context.parameters.dataset.refresh();
  };

  const count = useMemo(() => {
    return column.cards?.length ?? 0;
  }, [column.cards]);

  const estimatedValueSumAndSymbol = useMemo(() => {
    const cards = column.cards ?? [];
    const hasEstimatedValue = cards.some(
      (card) => "estimatedvalueRaw" in card && (card as { estimatedvalueRaw?: number }).estimatedvalueRaw != null
    );
    if (!hasEstimatedValue) return null;
    const sum = cards.reduce(
      (acc, card) => acc + (Number((card as { estimatedvalueRaw?: number }).estimatedvalueRaw) || 0),
      0
    );
    const firstFormatted = cards.find(
      (c) => (c as { estimatedvalue?: { value?: string } }).estimatedvalue?.value
    ) as { estimatedvalue?: { value?: string } } | undefined;
    const formattedStr = firstFormatted?.estimatedvalue?.value;
    const symbol = typeof formattedStr === "string"
      ? getCurrencySymbolFromFormatted(formattedStr)
      : "€";
    return { sum, symbol };
  }, [column.cards]);

  return (
    <div className="column-header-container">
      <div className="column-header">
        <Text variant="xLarge" nowrap>{column.title}</Text>
        <div className="column-actions">
          { estimatedValueSumAndSymbol != null && (
            <Text variant="small" className="column-sum">
              {context.formatting.formatCurrency(
                estimatedValueSumAndSymbol.sum,
                2,
                estimatedValueSumAndSymbol.symbol
              )}
            </Text>
          ) }
          { count > 0 && <Text variant="small" className="column-counter">{count}</Text> }
          { allowCreateNew && (
            <IconButton iconName='Add' onClick={() => { onAddNewRecord(column.id as string); }} noBorder />
          ) }
        </div>
      </div>
    </div>
  );
}

export default ColumnHeader;