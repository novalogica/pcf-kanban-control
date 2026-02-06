import { PersonaInitialsColor } from "@fluentui/react/lib/Persona";
import { CardInfo } from "../interfaces";

export const isNullOrEmpty = (value: unknown) => {
    if (value === '' || value == null || !value)
        return true;

    return false;
}

/**
 * Format for linked entities: column name = "Alias.AttributeName",
 * e.g. "a_c66099806c8349a18e63498da795a1a6.ownerid". The part before the dot is the
 * linked-entity alias (assigned by Dataverse/Power Apps, usually constant per view/relation).
 * Configuration (quick filter, sort, filter presets, field labels, etc.) uses
 * the full column name only, so e.g. ownerid and a_xxx.ownerid can be configured separately.
 */

/** PCF/Dataverse column data types for Boolean/Yes-No fields (single-select only, no multiselect). */
export const BOOLEAN_COLUMN_DATA_TYPES = ["Boolean", "boolean", "TwoOptions", "twooptions"];

/** PCF/Dataverse column data types for date/time fields (DateTime, DateOnly). Includes common string variants and AttributeTypeCode (2 = DateTime). */
export const DATE_COLUMN_DATA_TYPES = [
  "DateTime",
  "datetime",
  "DateOnly",
  "dateonly",
  "DateAndTime",
  "dateandtime",
  "Date and time",
  "Date only",
  "Date Only",
];

/** AttributeTypeCode for DateTime in Dataverse (PCF may pass dataType as number). */
const ATTRIBUTE_TYPE_CODE_DATETIME = 2;

/** PCF/Dataverse column data types for numeric/currency fields (Number, Currency, Decimal, Double, Integer). */
const NUMERIC_COLUMN_DATA_TYPES = [
  "Currency",
  "currency",
  "Decimal",
  "decimal",
  "Double",
  "double",
  "Integer",
  "integer",
  "Whole.Number",
  "whole.number",
  "FP",
  "fp",
];

/** True if the column dataType is numeric or currency; use for number filter UI (gt, lt, between). */
export function isNumberColumnDataType(dataType: string | number | undefined): boolean {
  if (dataType == null) return false;
  const normalized = String(dataType).trim().toLowerCase();
  return (
    NUMERIC_COLUMN_DATA_TYPES.some((t) => t.toLowerCase() === normalized) ||
    normalized === "currency" ||
    normalized === "decimal" ||
    normalized === "double" ||
    normalized === "integer" ||
    normalized === "number" ||
    normalized.startsWith("currency.") ||
    normalized.startsWith("decimal.") ||
    normalized.startsWith("double.") ||
    normalized.startsWith("integer.") ||
    normalized.startsWith("whole.")
  );
}

/** True if the column dataType is Boolean/TwoOptions (Yes-No); use for single-select vs multiselect (e.g. quick filters). */
export function isBooleanColumnDataType(dataType: string | undefined): boolean {
  return dataType != null && BOOLEAN_COLUMN_DATA_TYPES.includes(dataType);
}

/** True if the column dataType is DateTime or DateOnly; use for date-specific quick filter UI. Accepts string or number (AttributeTypeCode 2 = DateTime). PCF/Dataverse uses "DateAndTime.DateAndTime" and "DateAndTime.DateOnly". */
export function isDateColumnDataType(dataType: string | number | undefined): boolean {
  if (dataType == null) return false;
  if (typeof dataType === "number") return dataType === ATTRIBUTE_TYPE_CODE_DATETIME;
  const normalized = String(dataType).trim().toLowerCase();
  return (
    DATE_COLUMN_DATA_TYPES.some((t) => t.toLowerCase() === normalized) ||
    normalized === "dateandtime" ||
    normalized === "date only" ||
    normalized === "date and time" ||
    normalized === "date" ||
    normalized.startsWith("dateandtime.")
  );
}

/** PCF/Dataverse column data types for E-Mail fields (SingleLine.Email). Used to render mailto links when showEmailAndPhoneAsLinks is enabled. */
const EMAIL_COLUMN_DATA_TYPES = ["Email", "email", "SingleLine.Email", "singleline.email"];

/** PCF/Dataverse column data types for Phone fields (SingleLine.Phone). Used to render tel links when showEmailAndPhoneAsLinks is enabled. */
const PHONE_COLUMN_DATA_TYPES = ["Phone", "phone", "SingleLine.Phone", "singleline.phone"];

/** True if the column dataType is E-Mail (SingleLine.Email); use for mailto link on card when showEmailAndPhoneAsLinks is on. */
export function isEmailColumnDataType(dataType: string | undefined): boolean {
  if (dataType == null) return false;
  const normalized = String(dataType).trim().toLowerCase();
  return (
    EMAIL_COLUMN_DATA_TYPES.some((t) => t.toLowerCase() === normalized) ||
    normalized.endsWith(".email") ||
    normalized === "email"
  );
}

/** True if the column dataType is Phone (SingleLine.Phone); use for tel link on card when showEmailAndPhoneAsLinks is on. */
export function isPhoneColumnDataType(dataType: string | undefined): boolean {
  if (dataType == null) return false;
  const normalized = String(dataType).trim().toLowerCase();
  return (
    PHONE_COLUMN_DATA_TYPES.some((t) => t.toLowerCase() === normalized) ||
    normalized.endsWith(".phone") ||
    normalized === "phone"
  );
}

/** Date filter value stored in quick filter: null | "today" | "last7" | "last30" | "custom:YYYY-MM-DD|YYYY-MM-DD" */
export type DateFilterValue = string | null;

const DATE_FILTER_PREFIX_CUSTOM = "custom:";

/** ISO week: Monday 00:00:00 of the week containing d. */
function getMondayOfWeek(d: Date): Date {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysToMonday = (day - 1 + 7) % 7;
  monday.setDate(monday.getDate() - daysToMonday);
  return monday;
}

/** Returns [startDate, endDate] for "today" | "last7" | "last30" | "currentMonth" | "currentYear" | "currentWeek" | "nextWeek" | "nextMonth" | "custom:start|end". Uses local calendar; endDate is inclusive (end of day). */
export function getDateFilterRange(value: DateFilterValue): { start: Date; end: Date } | null {
  if (!value || value === "") return null;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  if (value === "today") {
    return { start: startOfToday, end: endOfToday };
  }
  if (value === "last7") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfToday };
  }
  if (value === "last30") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 29);
    return { start, end: endOfToday };
  }
  if (value === "currentMonth") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (value === "currentYear") {
    const start = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  // ISO week: Monday = start, Sunday = end
  if (value === "currentWeek") {
    const monday = getMondayOfWeek(today);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }
  if (value === "nextWeek") {
    const mondayThis = getMondayOfWeek(today);
    const mondayNext = new Date(mondayThis);
    mondayNext.setDate(mondayNext.getDate() + 7);
    const sundayNext = new Date(mondayNext);
    sundayNext.setDate(sundayNext.getDate() + 6);
    sundayNext.setHours(23, 59, 59, 999);
    return { start: mondayNext, end: sundayNext };
  }
  if (value === "nextMonth") {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (value.startsWith(DATE_FILTER_PREFIX_CUSTOM)) {
    const part = value.slice(DATE_FILTER_PREFIX_CUSTOM.length);
    const [startStr, endStr] = part.split("|");
    if (!startStr || !endStr) return null;
    const start = parseISODateToLocal(startStr);
    const end = parseISODateToLocal(endStr);
    if (!start || !end) return null;
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  return null;
}

function parseISODateToLocal(str: string): Date | null {
  const trimmed = str.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  const d = new Date(trimmed + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

/** Normalize a record date value to a Date for comparison (PCF: Date object or number/string). Returns null if not a valid date. */
export function toComparableDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    const v = (value as { value: unknown }).value;
    return toComparableDate(v);
  }
  return null;
}

/** Returns true if the record date falls within the date filter range (inclusive). */
export function isDateInFilterRange(recordDate: Date | null, filterValue: DateFilterValue): boolean {
  const range = getDateFilterRange(filterValue);
  if (!range) return true;
  if (!recordDate) return false;
  const t = recordDate.getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

/** Number filter value: null | "gt:123" | "lt:456" | "gte:123" | "lte:456" | "between:min|max" */
export type NumberFilterValue = string | null;

const NUM_PREFIX_GT = "gt:";
const NUM_PREFIX_LT = "lt:";
const NUM_PREFIX_GTE = "gte:";
const NUM_PREFIX_LTE = "lte:";
const NUM_PREFIX_BETWEEN = "between:";

/** Parse number filter value into operator and number(s). Returns null if no filter. */
export function parseNumberFilterValue(
  value: NumberFilterValue
): { op: "gt" | "lt" | "gte" | "lte"; num: number } | { op: "between"; min: number; max: number } | null {
  if (!value || value === "") return null;
  const trimmed = value.trim();
  if (trimmed.startsWith(NUM_PREFIX_GT)) {
    const num = parseFloat(trimmed.slice(NUM_PREFIX_GT.length));
    if (Number.isNaN(num)) return null;
    return { op: "gt", num };
  }
  if (trimmed.startsWith(NUM_PREFIX_LT)) {
    const num = parseFloat(trimmed.slice(NUM_PREFIX_LT.length));
    if (Number.isNaN(num)) return null;
    return { op: "lt", num };
  }
  if (trimmed.startsWith(NUM_PREFIX_GTE)) {
    const num = parseFloat(trimmed.slice(NUM_PREFIX_GTE.length));
    if (Number.isNaN(num)) return null;
    return { op: "gte", num };
  }
  if (trimmed.startsWith(NUM_PREFIX_LTE)) {
    const num = parseFloat(trimmed.slice(NUM_PREFIX_LTE.length));
    if (Number.isNaN(num)) return null;
    return { op: "lte", num };
  }
  if (trimmed.startsWith(NUM_PREFIX_BETWEEN)) {
    const part = trimmed.slice(NUM_PREFIX_BETWEEN.length);
    const [minStr, maxStr] = part.split("|");
    const min = parseFloat(String(minStr ?? "").trim());
    const max = parseFloat(String(maxStr ?? "").trim());
    if (Number.isNaN(min) || Number.isNaN(max)) return null;
    return { op: "between", min, max };
  }
  return null;
}

/** Normalize record value to number for comparison (PCF: number or formatted string like "1.234,56 €"). Returns null if not numeric. */
export function toComparableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s/g, "").replace(/[^\d.,-]/g, "");
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSep = lastComma > lastDot ? "," : ".";
    const thousandsSep = lastComma > lastDot ? "." : ",";
    const normalized = cleaned.replace(new RegExp("\\" + thousandsSep, "g"), "").replace(decimalSep, ".");
    const n = parseFloat(normalized);
    if (!Number.isNaN(n)) return n;
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    const v = (value as { value: unknown }).value;
    return toComparableNumber(v);
  }
  return null;
}

/** Returns true if the record number satisfies the number filter (gt, lt, gte, lte, between). */
export function isNumberInFilterRange(recordNum: number | null, filterValue: NumberFilterValue): boolean {
  const parsed = parseNumberFilterValue(filterValue);
  if (!parsed) return true;
  if (recordNum == null) return false;
  if (parsed.op === "gt") return recordNum > parsed.num;
  if (parsed.op === "lt") return recordNum < parsed.num;
  if (parsed.op === "gte") return recordNum >= parsed.num;
  if (parsed.op === "lte") return recordNum <= parsed.num;
  if (parsed.op === "between") return recordNum >= parsed.min && recordNum <= parsed.max;
  return true;
}

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