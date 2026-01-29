import * as React from "react";
import { CardInfo, UniqueIdentifier } from "../../interfaces";
import { Text } from "@fluentui/react/lib/Text";
import { isEntityReference, isNullOrEmpty } from "../../lib/utils";
import { Lookup } from "../lookup/Lookup";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";
import { MultiType } from "../../interfaces/card.type";

interface ICardInfoProps {
  id: UniqueIdentifier,
  info: CardInfo
}

const CardDetails = ({ info }: ICardInfoProps) => {
  const { context, openFormWithLoading } = useContext(BoardContext);

  const onLookupClicked = (entityName: string, id: string) => {
    openFormWithLoading(entityName, id);
  };

  const handleInfoValue = (value: MultiType) => {
    switch(typeof value) {
      case "number":
        return isNullOrEmpty(value) ? context.formatting.formatCurrency(0) : context.formatting.formatCurrency(value)
      default: 
        return isNullOrEmpty(value) || value == "Unallocated" ? "-" : value;
    }
  }

  return ( 
    <div className="card-info">
      <Text className="card-info-label" variant="small">{info.label}</Text>
      {
        isEntityReference(info.value) ? <Lookup info={info} onOpenLookup={onLookupClicked} />
          : <Text className="card-text card-info-value" variant="medium">
              {handleInfoValue(info.value)}
            </Text>
      }
    </div>
  );
}

interface IProps {
  children: React.ReactNode
}

const CardDetailsList = ({ children }: IProps) => {
  return ( 
    <div className="card-info-container">
      {children}
    </div>
  );
}

export { CardDetailsList, CardDetails };