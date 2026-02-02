import { PersonaInitialsColor } from "@fluentui/react/lib/Persona";
import { CardInfo } from "../interfaces";

export const isNullOrEmpty = (value: unknown) => {
    if (value === '' || value == null || !value)
        return true;

    return false;
}

/**
 * Format bei verknüpften Entitäten (Linked Entity): Spaltenname = "Alias.Attributname",
 * z. B. "a_c66099806c8349a18e63498da795a1a6.ownerid". Der Teil vor dem Punkt ist der
 * Linked-Entity-Alias (von Dataverse/Power Apps vergeben, i. d. R. pro View/Relation
 * konstant). Konfiguration (Quick filter, Sort, Filter presets, Feld-Labels etc.) erfolgt
 * ausschließlich über den vollen Spaltennamen, damit z. B. ownerid und a_xxx.ownerid
 * getrennt konfigurierbar sind.
 */

/** Returns the part before the last dot (linked-entity alias), or null if there is no dot. Use to inspect or distinguish columns that share the same attribute name (e.g. ownerid vs a_xxx.ownerid). */
export function getFieldNamePrefixBeforeDot(fieldName: string): string | null {
    const lastDot = fieldName.lastIndexOf(".");
    if (lastDot <= 0) return null;
    return fieldName.slice(0, lastDot);
}

export const getColumnValue = (
    record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
    column: ComponentFramework.PropertyHelper.DataSetApi.Column
): string | CardInfo => {
    const value = record.getValue(column.name);

    if (value === null || value === undefined) {
        return { label: column.displayName, value: "" };
    }

    if (isEntityReference(value) || isLookupValue(value)) {
        return { label: column.displayName, value: record.getValue(column.name) as ComponentFramework.EntityReference }
    }

    if (Array.isArray(value) && value.length > 0) {
        if (isEntityReference(value[0])) {
            return { label: column.displayName, value: record.getValue(column.name) as ComponentFramework.EntityReference[] };
        }

        if (isLookupValue(value[0])) {
            return { label: column.displayName, value: record.getValue(column.name) as ComponentFramework.LookupValue[] };
        }
    }

    return { label: column.displayName, value: record.getFormattedValue(column.name) };
};

export const isEntityReference = (value: any): value is ComponentFramework.EntityReference => {
    return value && typeof value === 'object' && 'id' in value && 'etn' in value && 'name' in value;
}

const isLookupValue = (value: any): value is ComponentFramework.LookupValue => {
    return value && typeof value === 'object' && 'id' in value && 'name' in value && 'entityType' in value;
}

export const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getColorFromInitials = (initials: string, colorPalette: PersonaInitialsColor[]) => {
    const charSum = initials
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return colorPalette[charSum % colorPalette.length];
}

/**
 * Extracts the currency symbol from a formatted currency string (e.g. "1.234,56 €" or "$1,234.56").
 * Used to display the sum in the same currency as the tiles.
 */
export const getCurrencySymbolFromFormatted = (formatted: string): string => {
  if (!formatted || typeof formatted !== "string") return "€";
  const trimmed = formatted.trim();
  const atEnd = trimmed.match(/\s*([€$£¥¢]|\bEUR\b|\bUSD\b|\bGBP\b|\bCHF\b)\s*$/i);
  if (atEnd?.[1]) return atEnd[1];
  const atStart = trimmed.match(/^\s*([€$£¥¢]|\bEUR\b|\bUSD\b|\bGBP\b|\bCHF\b)\s*/i);
  if (atStart?.[1]) return atStart[1];
  return "€";
};

export const pluralizedLogicalNames = (logicalName: string) => {
    if (!logicalName) return '';

    if (logicalName.endsWith('y')) {
        return logicalName.slice(0, -1) + 'ies';
    } else if (logicalName.endsWith('s')) {
        return logicalName + 'es';
    } else {
        return logicalName + 's';
    }
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        results.push(array.slice(i, i + chunkSize));
    }
    return results;
}

export function orderStages(entities: BusinessProcessFlowEntity[]): BusinessProcessFlowEntity[] {
    const stageMap = new Map<string, BusinessProcessFlowEntity>();
    const nextStageIds = new Set<string>();

    for (const entity of entities) {
        const stageId = entity.Stage.StageId;
        const nextStageId = entity.Stage.NextStageId;

        stageMap.set(stageId, entity);
        if (nextStageId) {
            nextStageIds.add(nextStageId);
        }
    }

    const firstStage = Array.from(stageMap.values()).find(
        entity => !nextStageIds.has(entity.Stage.StageId)
    );

    if (!firstStage) {
        throw new Error("Could not find the first stage.");
    }

    const orderedEntities: BusinessProcessFlowEntity[] = [];
    let currentStage: BusinessProcessFlowEntity | undefined = firstStage;

    while (currentStage) {
        orderedEntities.push(currentStage);

        const nextId: string | null | undefined = currentStage.Stage.NextStageId;
        currentStage = nextId ? stageMap.get(nextId) : undefined;
    }

    return orderedEntities;
}