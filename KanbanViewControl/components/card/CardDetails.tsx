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
  fieldName?: string,
  info: CardInfo,
  /** When true, the field value is rendered as HTML (not escaped). */
  renderAsHtml?: boolean,
  /** Percentage width of the field on the card (1–100). Applied via flex-basis to work with gap. */
  widthPercent?: number,
}

const CARD_INFO_GAP_PX = 16;

const CardDetails = ({ info, renderAsHtml = false, widthPercent }: ICardInfoProps) => {
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

  const isEmpty = isNullOrEmpty(info.value) || info.value === "Unallocated";

  const flexStyle: React.CSSProperties | undefined = widthPercent != null
    ? widthPercent >= 100
      ? { flex: "0 0 100%", minWidth: 0 }
      : { flex: `0 0 calc(${widthPercent}% - ${CARD_INFO_GAP_PX * (1 - widthPercent / 100)}px)`, minWidth: 0 }
    : undefined;

  return ( 
    <div className="card-info" style={flexStyle}>
      {!renderAsHtml && (
        <Text className="card-info-label" variant="small">{info.label}</Text>
      )}
      {
        isEntityReference(info.value) ? <Lookup info={info} onOpenLookup={onLookupClicked} />
          : renderAsHtml
            ? (
                <div
                  className="card-text card-info-value card-info-value--html"
                  aria-label={info.label}
                  dangerouslySetInnerHTML={{
                    __html: isEmpty ? "" : String(info.value ?? ""),
                  }}
                />
              )
            : (
                <Text className="card-text card-info-value" variant="medium">
                  {handleInfoValue(info.value)}
                </Text>
              )
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