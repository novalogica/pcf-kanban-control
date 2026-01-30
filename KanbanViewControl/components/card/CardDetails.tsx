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
  /** When true and value is a lookup, render as Persona (image/initials); otherwise as simple link. */
  lookupAsPersona?: boolean,
  /** When true, render value as clickable mailto link (e.g. for related contact email with SingleLine.Text). */
  asEmailLink?: boolean,
  /** When true, render value as clickable tel link (e.g. for related contact phone with SingleLine.Text). */
  asPhoneLink?: boolean,
}

const CARD_INFO_GAP_PX = 16;

/** PCF/Dataverse column data types that should be rendered as clickable mailto/tel links. */
const EMAIL_DATA_TYPES = ["Email", "email"];
const PHONE_DATA_TYPES = ["Phone", "phone"];

function getColumnDataType(dataset: { columns?: { name: string; dataType?: string }[] } | undefined, fieldName: string | undefined): string | undefined {
  if (!fieldName || !dataset?.columns) return undefined;
  const col = dataset.columns.find((c) => c.name === fieldName);
  return col?.dataType;
}

const CardDetails = ({ id, fieldName, info, renderAsHtml = false, hideLabel = false, widthPercent, lookupAsPersona = false, asEmailLink = false, asPhoneLink = false }: ICardInfoProps) => {
  const { context, openFormWithLoading } = useContext(BoardContext);
  const htmlHostRef = useRef<HTMLDivElement>(null);
  const columnDataType = getColumnDataType(context.parameters?.dataset as { columns?: { name: string; dataType?: string }[] }, fieldName);
  const isEmailField = asEmailLink || (columnDataType != null && EMAIL_DATA_TYPES.includes(columnDataType));
  const isPhoneField = asPhoneLink || (columnDataType != null && PHONE_DATA_TYPES.includes(columnDataType));

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
  const displayText = isEntityReference(info.value) ? "" : (renderAsHtml ? "" : String(handleInfoValue(info.value)));
  const rawValue = typeof info.value === "string" ? info.value.trim() : String(info.value ?? "").trim();
  const linkHref = rawValue !== "" && (isEmailField || isPhoneField)
    ? (isEmailField ? `mailto:${rawValue}` : `tel:${rawValue}`)
    : undefined;
  const onLinkClick = (e: React.MouseEvent) => e.stopPropagation();

  useEffect(() => {
    if (!renderAsHtml || !htmlHostRef.current) return;
    const host = htmlHostRef.current;
    // With mode: "open", host.shadowRoot returns the existing shadow on re-run (e.g. after popup open);
    // otherwise attachShadow would be called again and trigger an error.
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
        isEntityReference(info.value) ? <Lookup info={info} onOpenLookup={onLookupClicked} displayAsPersona={lookupAsPersona} />
          : renderAsHtml
            ? (
                <div
                  ref={htmlHostRef}
                  className="card-text card-info-value card-info-value--html"
                  aria-label={info.label}
                />
              )
            : linkHref
              ? (
                  <a
                    className="card-text card-info-value card-info-value--link"
                    href={linkHref}
                    onClick={onLinkClick}
                    rel="noopener noreferrer"
                    aria-label={info.label ? (isEmailField ? `E-Mail: ${displayText}` : `Anrufen: ${displayText}`) : undefined}
                  >
                    {displayText}
                  </a>
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