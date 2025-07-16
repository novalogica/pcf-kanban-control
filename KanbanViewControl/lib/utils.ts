import { PersonaInitialsColor } from "@fluentui/react/lib/Persona";
import { CardInfo } from "../interfaces";

export const isNullOrEmpty = (value: unknown) => {
    if (value === '' || value == null || !value)
        return true;

    return false;
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