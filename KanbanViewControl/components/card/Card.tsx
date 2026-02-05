import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import { OpenRegular } from "@fluentui/react-icons";
import CardHeader from "./CardHeader";
import CardBody from "./CardBody";
import { CardInfo, CardItem } from "../../interfaces";
import { CardDetails, CardDetailsList } from "./CardDetails";
import { useMemo, useCallback, useRef } from "react";
import { BoardContext } from "../../context/board-context";
import { useContext } from "react";

export type HighlightType = "left" | "right" | "cornerTopRight" | "cornerBottomRight" | "cornerTopLeft" | "cornerBottomLeft";

export interface BooleanFieldHighlightConfig {
  logicalName: string;
  color: string;
  /** Highlight type: left/right border or diagonal corner (top-left, top-right, bottom-left, bottom-right). Default "left". First match per type wins. */
  type?: HighlightType;
}

export interface FieldWidthConfig {
  logicalName: string;
  width: number;
}

interface IProps {
  item: CardItem;
  draggable?: boolean;
}

/** Only true for boolean-like truthy values. False, 0, "false", "no" etc. do not count as true. */
function isBooleanTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string" && /^(1|true|yes|ja)$/i.test(value.trim())) return true;
  return false;
}

/** True if value looks like a boolean (type or common string/number representations). */
function looksLikeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return true;
  if (value === 0 || value === 1) return true;
  if (typeof value === "string" && /^(0|1|true|false|yes|no|ja|nein)$/i.test(value.trim())) return true;
  return false;
}

/** True if the config set contains the field (by full column name). Use for all field-based config sets. */
function setMatchesField(set: Set<string>, fieldName: string): boolean {
  return set.has(fieldName);
}

/** Returns the value for the field from the map (by full column name). Use for all field-based config maps. */
function mapGetByField<K>(map: Map<string, K>, fieldName: string): K | undefined {
  return map.get(fieldName);
}

/** True if the value is non-empty (for non-boolean fields: "has a value" = highlight). */
function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (typeof value === "object" && "value" in value) return hasValue((value as CardInfo).value);
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/** Max mouse movement (px) below which an event still counts as a click. Above = text selection/drag, card does not open. */
const CLICK_MOVE_THRESHOLD_PX = 5;

const Card = ({ item, draggable = true }: IProps) => {
  const { context, activeView, openFormWithLoading, openEntityInNewTab, showOpenInNewTabButton, reportConfigError, clearConfigError } = useContext(BoardContext);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const onCardClick = useCallback(() => {
    openFormWithLoading(context.parameters.dataset.getTargetEntityType(), item.id.toString());
  }, [context, item.id, openFormWithLoading]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) {
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [draggable]);

  const onCardClickWithMoveCheck = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable && mouseDownPosRef.current) {
        const dx = e.clientX - mouseDownPosRef.current.x;
        const dy = e.clientY - mouseDownPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        mouseDownPosRef.current = null;
        if (distance > CLICK_MOVE_THRESHOLD_PX) {
          return;
        }
      }
      onCardClick();
    },
    [draggable, onCardClick]
  );

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
        clearConfigError?.("hiddenFieldsOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("hiddenFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters.hiddenFieldsOnCard, reportConfigError, clearConfigError]);

  const htmlFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { htmlFieldsOnCard?: { raw?: string } }).htmlFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("htmlFieldsOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("htmlFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const hideLabelForFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { hideLabelForFieldsOnCard?: { raw?: string } }).hideLabelForFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("hideLabelForFieldsOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("hideLabelForFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const booleanFieldHighlights = useMemo((): BooleanFieldHighlightConfig[] => {
    const raw = (context.parameters as { booleanFieldHighlights?: { raw?: string } }).booleanFieldHighlights?.raw?.trim();
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      clearConfigError?.("booleanFieldHighlights");
      const validTypes: HighlightType[] = ["left", "right", "cornerTopRight", "cornerBottomRight", "cornerTopLeft", "cornerBottomLeft"];
      return arr
        .filter((e: unknown) => e && typeof e === "object" && "logicalName" in e && "color" in e)
        .map((e: { logicalName: string; color: string; type?: string }) => {
          const typeRaw = e.type != null ? String(e.type).trim() : "left";
          const type = validTypes.includes(typeRaw as HighlightType) ? (typeRaw as HighlightType) : "left";
          return {
            logicalName: String(e.logicalName).trim(),
            color: String(e.color).trim(),
            type,
          };
        })
        .filter((e) => e.logicalName && e.color);
    } catch (e) {
      reportConfigError?.("booleanFieldHighlights", e instanceof Error ? e.message : String(e));
      return [];
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const fieldWidthsOnCardMap = useMemo((): Map<string, number> => {
    const raw = (context.parameters as { fieldWidthsOnCard?: { raw?: string } }).fieldWidthsOnCard?.raw?.trim();
    if (!raw) return new Map();
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Map();
      clearConfigError?.("fieldWidthsOnCard");
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
  }, [context.parameters, reportConfigError, clearConfigError]);

  const lookupFieldsAsPersonaOnCardSet = useMemo(() => {
    const raw = (context.parameters as { lookupFieldsAsPersonaOnCard?: { raw?: string } }).lookupFieldsAsPersonaOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("lookupFieldsAsPersonaOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("lookupFieldsAsPersonaOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const lookupFieldsPersonaIconOnlyOnCardSet = useMemo(() => {
    const raw = (context.parameters as { lookupFieldsPersonaIconOnlyOnCard?: { raw?: string } }).lookupFieldsPersonaIconOnlyOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("lookupFieldsPersonaIconOnlyOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("lookupFieldsPersonaIconOnlyOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const emailFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { emailFieldsOnCard?: { raw?: string } }).emailFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("emailFieldsOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("emailFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const phoneFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { phoneFieldsOnCard?: { raw?: string } }).phoneFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("phoneFieldsOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("phoneFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const ellipsisFieldsOnCardSet = useMemo(() => {
    const raw = (context.parameters as { ellipsisFieldsOnCard?: { raw?: string } }).ellipsisFieldsOnCard?.raw?.trim();
    if (!raw) return new Set<string>();
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        const arr = JSON.parse(trimmed) as string[];
        clearConfigError?.("ellipsisFieldsOnCard");
        return new Set(Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : []);
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    } catch (e) {
      if (raw.trim().startsWith("[")) {
        reportConfigError?.("ellipsisFieldsOnCard", e instanceof Error ? e.message : String(e));
      }
      return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const fieldDisplayNamesOnCardMap = useMemo((): Map<string, string> => {
    const raw = (context.parameters as { fieldDisplayNamesOnCard?: { raw?: string } }).fieldDisplayNamesOnCard?.raw?.trim();
    if (!raw) return new Map();
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Map();
      clearConfigError?.("fieldDisplayNamesOnCard");
      const map = new Map<string, string>();
      for (const e of arr) {
        if (e && typeof e === "object" && "logicalName" in e && "displayName" in e) {
          const name = String(e.logicalName).trim();
          const displayName = String(e.displayName).trim();
          if (name) map.set(name, displayName);
        }
      }
      return map;
    } catch (e) {
      reportConfigError?.("fieldDisplayNamesOnCard", e instanceof Error ? e.message : String(e));
      return new Map();
    }
  }, [context.parameters, reportConfigError, clearConfigError]);

  const highlights = useMemo(() => {
    const result: { left?: string; right?: string; cornerTopRight?: string; cornerBottomRight?: string; cornerTopLeft?: string; cornerBottomLeft?: string } = {};
    const done = { left: false, right: false, cornerTopRight: false, cornerBottomRight: false, cornerTopLeft: false, cornerBottomLeft: false };
    const itemKeys = Object.keys(item);
    for (const { logicalName, color, type = "left" } of booleanFieldHighlights) {
      if (done[type]) continue;
      const itemKey = itemKeys.find((k) => k === logicalName);
      if (itemKey == null) continue;
      const field = item[itemKey];
      if (field == null) continue;
      const value = field && typeof field === "object" && "value" in field ? (field as CardInfo).value : field;
      const matches = looksLikeBoolean(value) ? isBooleanTruthy(value) : hasValue(value);
      if (!matches) continue;
      result[type] = color;
      done[type] = true;
    }
    return result;
  }, [item, booleanFieldHighlights]);

  const columnFieldKey = activeView?.key;

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter((i) => {
      if (i[0] === "title" || i[0] === "tag" || i[0] === "id" || i[0] === "column") return false;
      if (hideColumnFieldOnCard && columnFieldKey && i[0] === columnFieldKey) return false;
      if (setMatchesField(hiddenFieldsOnCardSet, i[0])) return false;
      return true;
    });
  }, [item, hideColumnFieldOnCard, columnFieldKey, hiddenFieldsOnCardSet]);

  const isClickable = !draggable;

  const hasAnyHighlight = highlights.left ?? highlights.right ?? highlights.cornerTopRight ?? highlights.cornerBottomRight ?? highlights.cornerTopLeft ?? highlights.cornerBottomLeft;
  const highlightClass =
    (highlights.left ? " card-container--highlight-left" : "") +
    (highlights.right ? " card-container--highlight-right" : "") +
    (highlights.cornerTopRight ? " card-container--highlight-corner-top-right" : "") +
    (highlights.cornerBottomRight ? " card-container--highlight-corner-bottom-right" : "") +
    (highlights.cornerTopLeft ? " card-container--highlight-corner-top-left" : "") +
    (highlights.cornerBottomLeft ? " card-container--highlight-corner-bottom-left" : "");
  const highlightStyle = hasAnyHighlight
    ? {
        ...(highlights.left && { ["--card-highlight-left" as string]: highlights.left }),
        ...(highlights.right && { ["--card-highlight-right" as string]: highlights.right }),
        ...(highlights.cornerTopRight && { ["--card-highlight-corner-top-right" as string]: highlights.cornerTopRight }),
        ...(highlights.cornerBottomRight && { ["--card-highlight-corner-bottom-right" as string]: highlights.cornerBottomRight }),
        ...(highlights.cornerTopLeft && { ["--card-highlight-corner-top-left" as string]: highlights.cornerTopLeft }),
        ...(highlights.cornerBottomLeft && { ["--card-highlight-corner-bottom-left" as string]: highlights.cornerBottomLeft }),
      }
    : undefined;

  return (
    <div
      className={`card-container${draggable ? "" : " no-drag"}${highlightClass}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onMouseDown={isClickable ? onMouseDown : undefined}
      onClick={isClickable ? onCardClickWithMoveCheck : undefined}
      onKeyDown={isClickable ? onKeyDown : undefined}
      style={highlightStyle}
    >
      {(highlights.cornerTopRight ?? highlights.cornerBottomRight ?? highlights.cornerTopLeft ?? highlights.cornerBottomLeft) && (
        <>
          {highlights.cornerTopRight && <span className="card-corner-highlight card-corner-highlight--top-right" aria-hidden />}
          {highlights.cornerBottomRight && <span className="card-corner-highlight card-corner-highlight--bottom-right" aria-hidden />}
          {highlights.cornerTopLeft && <span className="card-corner-highlight card-corner-highlight--top-left" aria-hidden />}
          {highlights.cornerBottomLeft && <span className="card-corner-highlight card-corner-highlight--bottom-left" aria-hidden />}
        </>
      )}
      <CardHeader>
        <Text className="card-title" nowrap>
          {item?.title?.value}
        </Text>
        {showOpenInNewTabButton && (
          <button
            type="button"
            className="card-open-new-tab-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              openEntityInNewTab(context.parameters.dataset.getTargetEntityType(), item.id.toString());
            }}
            aria-label="In neuem Tab öffnen"
            title="In neuem Tab öffnen"
          >
            <OpenRegular />
          </button>
        )}
      </CardHeader>
      <CardBody>
        <CardDetailsList>
          {cardDetails?.map((info) => {
            const fieldKey = info[0] as string;
            return (
              <CardDetails
                key={`${fieldKey}-${item.id}`}
                id={item.id}
                fieldName={fieldKey}
                info={info[1] as CardInfo}
                displayLabelOverride={mapGetByField(fieldDisplayNamesOnCardMap, fieldKey)}
                renderAsHtml={setMatchesField(htmlFieldsOnCardSet, fieldKey)}
                hideLabel={setMatchesField(hideLabelForFieldsOnCardSet, fieldKey)}
                widthPercent={mapGetByField(fieldWidthsOnCardMap, fieldKey)}
                lookupAsPersona={setMatchesField(lookupFieldsAsPersonaOnCardSet, fieldKey)}
                lookupPersonaIconOnly={setMatchesField(lookupFieldsPersonaIconOnlyOnCardSet, fieldKey)}
                asEmailLink={setMatchesField(emailFieldsOnCardSet, fieldKey)}
                asPhoneLink={setMatchesField(phoneFieldsOnCardSet, fieldKey)}
                textEllipsis={setMatchesField(ellipsisFieldsOnCardSet, fieldKey)}
              />
            );
          })}
        </CardDetailsList>
      </CardBody>
    </div>
  );
}

export default Card;