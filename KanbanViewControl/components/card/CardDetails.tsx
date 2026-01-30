import * as React from "react";
import { useRef, useEffect } from "react";
import { CardInfo, UniqueIdentifier } from "../../interfaces";
import { Text } from "@fluentui/react/lib/Text";
import { isEntityReference, isNullOrEmpty } from "../../lib/utils";
import { Lookup } from "../lookup/Lookup";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";
import { MultiType } from "../../interfaces/card.type";

const SHADOW_HTML_SLOT_CLASS = "card-info-value--html-slot";

interface ICardInfoProps {
  id: UniqueIdentifier,
  fieldName?: string,
  info: CardInfo,
  /** When true, the field value is rendered as HTML (not escaped). */
  renderAsHtml?: boolean,
  /** When true, the field label is hidden. */
  hideLabel?: boolean,
  /** Percentage width of the field on the card (1–100). Applied via flex-basis to work with gap. */
  widthPercent?: number,
}

const CARD_INFO_GAP_PX = 16;

const CardDetails = ({ info, renderAsHtml = false, hideLabel = false, widthPercent }: ICardInfoProps) => {
  const { context, openFormWithLoading } = useContext(BoardContext);
  const htmlHostRef = useRef<HTMLDivElement>(null);

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
  const hasLabel = info.label != null && String(info.label).trim() !== "";
  const htmlContent = isEmpty ? "" : String(info.value ?? "");

  useEffect(() => {
    if (!renderAsHtml || !htmlHostRef.current) return;
    const host = htmlHostRef.current;
    // Mit mode: "open" liefert host.shadowRoot beim erneuten Effect-Lauf (z. B. nach Popup-Öffnung)
    // den bestehenden Shadow zurück – sonst würde attachShadow erneut aufgerufen und den Fehler auslösen.
    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: "open" });
      const slot = document.createElement("div");
      slot.className = SHADOW_HTML_SLOT_CLASS;
      shadow.appendChild(slot);
    }
    const slot = shadow.firstChild as HTMLDivElement;
    if (slot) {
      slot.innerHTML = htmlContent;
    }
  }, [renderAsHtml, htmlContent]);

  if (isEmpty && !hasLabel) {
    return null;
  }

  const flexStyle: React.CSSProperties | undefined = widthPercent != null
    ? widthPercent >= 100
      ? { flex: "0 0 100%", minWidth: 0 }
      : { flex: `0 0 calc(${widthPercent}% - ${CARD_INFO_GAP_PX * (1 - widthPercent / 100)}px)`, minWidth: 0 }
    : undefined;

  return ( 
    <div className="card-info" style={flexStyle}>
      {!hideLabel && (
        <Text className="card-info-label" variant="small">{info.label}</Text>
      )}
      {
        isEntityReference(info.value) ? <Lookup info={info} onOpenLookup={onLookupClicked} />
          : renderAsHtml
            ? (
                <div
                  ref={htmlHostRef}
                  className="card-text card-info-value card-info-value--html"
                  aria-label={info.label}
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