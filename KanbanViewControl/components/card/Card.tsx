import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import CardHeader from "./CardHeader";
import CardBody from "./CardBody";
import { CardInfo, CardItem } from "../../interfaces";
import { CardDetails, CardDetailsList } from "./CardDetails";
import { useMemo, useCallback } from "react";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";

export interface BooleanFieldHighlightConfig {
  logicalName: string;
  color: string;
}

export interface FieldWidthConfig {
  logicalName: string;
  width: number;
}

interface IProps {
  item: CardItem;
  draggable?: boolean;
}

function isBooleanTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string" && /^(1|true|yes|ja)$/i.test(value.trim())) return true;
  return false;
}

const Card = ({ item, draggable = true }: IProps) => {
  const { context, activeView, openFormWithLoading, reportConfigError } = useContext(BoardContext);

  const onCardClick = useCallback(() => {
    openFormWithLoading(context.parameters.dataset.getTargetEntityType(), item.id.toString());
  }, [context, item.id, openFormWithLoading]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardClick();
      }
    },
    [onCardClick]
  );

  const hideColumnFieldOnCard = useMemo(() => {
    return context.parameters.hideColumnFieldOnCard?.raw === true;
  }, [context.parameters]);

  const hiddenFieldsOnCardSet = useMemo(() => {
    const raw = context.parameters.hiddenFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("hiddenFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters.hiddenFieldsOnCard, reportConfigError]);

  const htmlFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { htmlFieldsOnCard?: { raw?: string } }).htmlFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("htmlFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError]);

  const hideLabelForFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { hideLabelForFieldsOnCard?: { raw?: string } }).hideLabelForFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("hideLabelForFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError]);

  const booleanFieldHighlights = useMemo((): BooleanFieldHighlightConfig[] => {
    const raw = (context.parameters as { booleanFieldHighlights?: { raw?: string } }).booleanFieldHighlights?.raw?.trim();
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((e: unknown) => e && typeof e === "object" && "logicalName" in e && "color" in e)
        .map((e: { logicalName: string; color: string }) => ({
          logicalName: String(e.logicalName).trim(),
          color: String(e.color).trim(),
        }))
        .filter((e) => e.logicalName && e.color);
    } catch (e) {
      reportConfigError?.("booleanFieldHighlights", e instanceof Error ? e.message : String(e));
      return [];
    }
  }, [context.parameters, reportConfigError]);

  const fieldWidthsOnCardMap = useMemo((): Map<string, number> => {
    const raw = (context.parameters as { fieldWidthsOnCard?: { raw?: string } }).fieldWidthsOnCard?.raw?.trim();
    if (!raw) return new Map();
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Map();
      const map = new Map<string, number>();
      for (const e of arr) {
        if (e && typeof e === "object" && "logicalName" in e && "width" in e) {
          const name = String(e.logicalName).trim();
          const w = Number(e.width);
          if (name && !isNaN(w) && w > 0 && w <= 100) map.set(name, w);
        }
      }
      return map;
    } catch (e) {
      reportConfigError?.("fieldWidthsOnCard", e instanceof Error ? e.message : String(e));
      return new Map();
    }
  }, [context.parameters, reportConfigError]);

  const highlightColor = useMemo(() => {
    for (const { logicalName, color } of booleanFieldHighlights) {
      const field = item[logicalName];
      if (field == null) continue;
      const value = field && typeof field === "object" && "value" in field ? (field as CardInfo).value : field;
      if (isBooleanTruthy(value)) return color;
    }
    return undefined;
  }, [item, booleanFieldHighlights]);

  const columnFieldKey = activeView?.key;

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter((i) => {
      if (i[0] === "title" || i[0] === "tag" || i[0] === "id" || i[0] === "column") return false;
      if (hideColumnFieldOnCard && columnFieldKey && i[0] === columnFieldKey) return false;
      if (hiddenFieldsOnCardSet.has(i[0])) return false;
      return true;
    });
  }, [item, hideColumnFieldOnCard, columnFieldKey, hiddenFieldsOnCardSet]);

  const isClickable = !draggable;

  return (
    <div
      className={`card-container${draggable ? "" : " no-drag"}${highlightColor ? " card-container--highlight" : ""}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onCardClick : undefined}
      onKeyDown={isClickable ? onKeyDown : undefined}
      style={highlightColor ? { ["--card-highlight-color" as string]: highlightColor } : undefined}
    >
      <CardHeader>
        <Text className="card-title" nowrap>
          {item?.title?.value}
        </Text>
      </CardHeader>
      <CardBody>
        <CardDetailsList>
          {cardDetails?.map((info) => (
            <CardDetails
              key={`${info[0]}-${item.id}`}
              id={item.id}
              fieldName={info[0] as string}
              info={info[1] as CardInfo}
              renderAsHtml={htmlFieldsOnCardSet.has(info[0] as string)}
              hideLabel={hideLabelForFieldsOnCardSet.has(info[0] as string)}
              widthPercent={fieldWidthsOnCardMap.get(info[0] as string)}
            />
          ))}
        </CardDetailsList>
      </CardBody>
    </div>
  );
}

export default Card;