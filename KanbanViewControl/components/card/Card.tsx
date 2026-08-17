import * as React from "react";
import { Text } from "@fluentui/react/lib/Text";
import { OpenRegular, CalendarRegular, FolderRegular } from "@fluentui/react-icons";
import CardHeader from "./CardHeader";
import CardBody from "./CardBody";
import { CardInfo, CardItem } from "../../interfaces";
import { CardDetails, CardDetailsList } from "./CardDetails";
import { useMemo, useCallback, useRef, useState } from "react";
import { CardActionsContext } from "../../context/card-actions-context";
import { CardConfigContext } from "../../context/card-config-context";
import { getStrings } from "../../lib/strings";
import { useContext } from "react";
import { Spinner, SpinnerSize } from "@fluentui/react";

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
  const {
    locale,
    context,
    activeView,
    openFormWithLoading,
    openEntityInNewTab,
    showOpenInNewTabButton,
    showCreateActivityButton,
    createActivityEntityType,
    openCreateActivityForm,
    showSharePointFolderButton,
    openSharePointFolderInNewTab,
  } = useContext(CardActionsContext);
  const strings = getStrings(locale);
  const {
    hideColumnFieldOnCard,
    hiddenFieldsOnCardSet,
    fieldsVisiblePerStageMap,
    htmlFieldsOnCardSet,
    hideLabelForFieldsOnCardSet,
    booleanFieldHighlights,
    fieldWidthsOnCardMap,
    lookupFieldsAsPersonaOnCardSet,
    lookupFieldsPersonaIconOnlyOnCardSet,
    showEmailAndPhoneAsLinks,
    ellipsisFieldsOnCardSet,
    lineBreakFieldsOnCardSet,
    fieldMaxHeightOnCardMap,
    fieldDisplayNamesOnCardMap,
  } = useContext(CardConfigContext);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isSharePointLoading, setIsSharePointLoading] = useState(false);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

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

  const currentStageName = useMemo(() => {
    const col = item.column;
    return col != null ? String(col).trim() : "";
  }, [item.column]);

  const cardDetails = useMemo(() => {
    return Object.entries(item)?.filter((i) => {
      if (i[0] === "title" || i[0] === "tag" || i[0] === "id" || i[0] === "column") return false;
      if (hideColumnFieldOnCard && columnFieldKey && i[0] === columnFieldKey) return false;
      if (setMatchesField(hiddenFieldsOnCardSet, i[0])) return false;
      const allowedStages = fieldsVisiblePerStageMap.get(i[0]);
      if (allowedStages !== undefined && allowedStages.length > 0) {
        if (!currentStageName || !allowedStages.includes(currentStageName)) return false;
      }
      return true;
    });
  }, [item, hideColumnFieldOnCard, columnFieldKey, hiddenFieldsOnCardSet, fieldsVisiblePerStageMap, currentStageName]);

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
        {(showOpenInNewTabButton || showCreateActivityButton || showSharePointFolderButton) && (
          <span className="card-header-actions">
            {showCreateActivityButton && (
              <button
                type="button"
                className="card-create-activity-btn"
                disabled={isCreatingActivity}
                aria-busy={isCreatingActivity}
                aria-label={strings.cardActionCreateActivity}
                title={strings.cardActionCreateActivity}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isCreatingActivity) return;
                  setIsCreatingActivity(true);
                  openCreateActivityForm(
                    createActivityEntityType,
                    context.parameters.dataset.getTargetEntityType(),
                    item.id.toString(),
                    typeof item?.title?.value === "string" ? item.title.value : undefined
                  ).finally(() => setIsCreatingActivity(false));
                }}
              >
                {isCreatingActivity ? (
                  <Spinner size={SpinnerSize.small} />
                ) : (
                  <CalendarRegular />
                )}
              </button>
            )}
            {showSharePointFolderButton && (
              <button
                type="button"
                className="card-open-sharepoint-folder-btn"
                disabled={isSharePointLoading}
                aria-busy={isSharePointLoading}
                aria-label={strings.cardActionOpenSharePoint}
                title={strings.cardActionOpenSharePoint}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isSharePointLoading) return;
                  setIsSharePointLoading(true);
                  openSharePointFolderInNewTab(
                    context.parameters.dataset.getTargetEntityType(),
                    item.id.toString(),
                    typeof item?.title?.value === "string" ? item.title.value : undefined
                  ).finally(() => setIsSharePointLoading(false));
                }}
              >
                {isSharePointLoading ? (
                  <Spinner size={SpinnerSize.small} />
                ) : (
                  <FolderRegular />
                )}
              </button>
            )}
            {showOpenInNewTabButton && (
              <button
                type="button"
                className="card-open-new-tab-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  openEntityInNewTab(context.parameters.dataset.getTargetEntityType(), item.id.toString());
                }}
                aria-label={strings.cardActionOpenInNewTab}
                title={strings.cardActionOpenInNewTab}
              >
                <OpenRegular />
              </button>
            )}
          </span>
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
                showEmailAndPhoneAsLinks={showEmailAndPhoneAsLinks}
                textEllipsis={setMatchesField(ellipsisFieldsOnCardSet, fieldKey)}
                preserveLineBreaks={setMatchesField(lineBreakFieldsOnCardSet, fieldKey)}
                maxHeightPx={mapGetByField(fieldMaxHeightOnCardMap, fieldKey)}
              />
            );
          })}
        </CardDetailsList>
      </CardBody>
    </div>
  );
}

// React.memo: Karte rendert nur neu, wenn sich item/draggable ändern. Da Card jetzt nur
// noch CardActionsContext + CardConfigContext (beide stabil bei Filter/Sort/Suche) und
// referenzstabile item-Objekte (P4) konsumiert, entfallen Re-Renders bei diesen Interaktionen.
export default React.memo(Card);