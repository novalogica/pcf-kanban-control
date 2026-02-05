import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";
import { Board } from "./components";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { BoardContext, ConfigError, QuickFilterFieldConfig, SortFieldConfig, SortDirection, FilterPresetConfig } from "./context/board-context";
import { ColumnItem, ViewItem, ViewEntity } from "./interfaces";
import Loading from "./components/container/loading";
import { Toaster } from "react-hot-toast";
import { useDataverse } from "./hooks/useDataverse";
import { useNavigation } from "./hooks/useNavigation";
import { getColumnValue, isBooleanColumnDataType, isDateColumnDataType, isNumberColumnDataType, toComparableDate, toComparableNumber, isDateInFilterRange, isNumberInFilterRange } from "./lib/utils";
import { unlocatedColumn } from "./lib/constants";
import { Spinner, SpinnerSize } from "@fluentui/react";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { CardInfo } from "./interfaces";

const QUICK_FILTER_ALL_KEY = "__all__";
const QUICK_FILTER_EMPTY_KEY = "__empty__";
const QUICK_FILTERS_STORAGE_PREFIX = "pcf-kanban-quickfilters";

/**
 * Filter presets: JSON configuration via component property "Filter presets" (filterPresets).
 * Format: Array of { id: string, label: string, filters: Record<fieldLogicalName, filterValue> }.
 * filterValue must match the values in the quick filter dropdowns.
 *
 * Placeholder for current user (e.g. for ownerid in "My Opportunities"):
 * Use "{{currentUser}}" in filters – replaced at runtime by the display name
 * of the signed-in user (Dataverse systemuser.fullname).
 *
 * Example for the property in the form editor:
 * [{"id":"open","label":"Open","filters":{"statuscode":"1"}},{"id":"my-opportunities","label":"My Opportunities","filters":{"ownerid":"{{currentUser}}"}}]
 */

/** Placeholder in filter presets: replaced by the current user's display name (e.g. for ownerid). */
const FILTER_PRESET_PLACEHOLDER_CURRENT_USER = "{{currentUser}}";

interface StoredQuickFilters {
  quickFilterValues: Record<string, string | string[] | null>;
  searchKeyword: string;
  sortByField: string | null;
  sortDirection: SortDirection;
  selectedFilterPresetId: string | null;
}

function loadStoredQuickFilters(storageKey: string): StoredQuickFilters | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const qfv = parsed.quickFilterValues;
    const presetId =
      parsed.selectedFilterPresetId !== undefined && parsed.selectedFilterPresetId !== null
        ? String(parsed.selectedFilterPresetId)
        : null;
    return {
      quickFilterValues:
        qfv && typeof qfv === "object" && qfv !== null && !Array.isArray(qfv)
          ? (qfv as Record<string, string | string[] | null>)
          : {},
      searchKeyword: typeof parsed.searchKeyword === "string" ? parsed.searchKeyword : "",
      sortByField:
        parsed.sortByField !== undefined && parsed.sortByField !== null
          ? String(parsed.sortByField)
          : null,
      sortDirection:
        parsed.sortDirection === "asc" || parsed.sortDirection === "desc"
          ? (parsed.sortDirection as SortDirection)
          : "asc",
      selectedFilterPresetId: presetId,
    };
  } catch {
    return null;
  }
}

function getQuickFilterComparableValue(fieldValue: unknown): string {
  if (fieldValue == null || fieldValue === "") return "";
  if (typeof fieldValue === "object" && fieldValue !== null && "value" in fieldValue) {
    const v = (fieldValue as CardInfo).value;
    if (v == null) return "";
    if (typeof v === "object" && v !== null && "name" in v) return String((v as { name?: string }).name ?? "");
    return String(v);
  }
  return String(fieldValue);
}

interface DefaultSortConfig {
  field: string | null;
  direction: SortDirection;
}

function parseDefaultSort(raw: string | undefined): DefaultSortConfig {
  if (!raw?.trim()) return { field: null, direction: "asc" };
  try {
    const o = JSON.parse(raw.trim()) as { field?: string; direction?: string };
    const field =
      o?.field != null && typeof o.field === "string" && o.field.trim()
        ? o.field.trim()
        : null;
    const direction =
      o?.direction === "desc" || o?.direction === "asc" ? o.direction : "asc";
    return { field, direction };
  } catch {
    return { field: null, direction: "asc" };
  }
}

function parseQuickFilterFieldsRaw(
  raw: string | undefined,
  reportError: (property: string, message: string) => void,
  clearError: (property: string) => void,
  propertyName: string
): string[] {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith("[")) {
      const arr = JSON.parse(trimmed) as unknown;
      clearError(propertyName);
      return Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : [];
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    if (trimmed.startsWith("[")) {
      reportError(propertyName, e instanceof Error ? e.message : String(e));
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

interface IProps {
  context: ComponentFramework.Context<IInputs>;
  notificationPosition:
    | "top-center"
    | "top-left"
    | "top-right"
    | "bottom-center"
    | "bottom-left"
    | "bottom-right";
}

const App = ({ context, notificationPosition }: IProps) => {
  // View ID for local storage scope: store quick filters per view separately
  const viewId = (context.parameters?.dataset as { getViewId?: () => string })?.getViewId?.() ?? "";
  const quickFiltersStorageKey =
    viewId ? `${QUICK_FILTERS_STORAGE_PREFIX}-${viewId}` : null;

  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewItem | undefined>();
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [views, setViews] = useState<ViewItem[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>();
  const [activeViewEntity, setActiveViewEntity] = useState<ViewEntity | undefined>();
  const [isOpeningEntity, setIsOpeningEntity] = useState(false);
  const [configErrors, setConfigErrors] = useState<ConfigError[]>([]);
  const [quickFilterValues, setQuickFilterValuesState] = useState<Record<string, string | string[] | null>>(
    () =>
      quickFiltersStorageKey
        ? (loadStoredQuickFilters(quickFiltersStorageKey)?.quickFilterValues ?? {})
        : {}
  );
  const [quickFilterOptions, setQuickFilterOptions] = useState<Record<string, IDropdownOption[]>>({});
  const [searchKeyword, setSearchKeyword] = useState(() =>
    quickFiltersStorageKey
      ? (loadStoredQuickFilters(quickFiltersStorageKey)?.searchKeyword ?? "")
      : ""
  );
  const defaultSortConfig = useMemo(
    () =>
      parseDefaultSort(
        (context.parameters as { defaultSort?: { raw?: string } }).defaultSort?.raw
      ),
    [(context.parameters as { defaultSort?: { raw?: string } }).defaultSort?.raw]
  );

  const sortFieldsParamForInit = (context.parameters as { sortFields?: { raw?: string } })
    .sortFields?.raw;
  const defaultSortFieldValid = useMemo(() => {
    if (!defaultSortConfig.field) return null;
    const list = parseQuickFilterFieldsRaw(
      sortFieldsParamForInit,
      () => {},
      () => {},
      "sortFields"
    );
    return list.includes(defaultSortConfig.field!) ? defaultSortConfig.field : null;
  }, [defaultSortConfig.field, sortFieldsParamForInit]);

  const [sortByField, setSortByField] = useState<string | null>(() => {
    const stored = quickFiltersStorageKey
      ? loadStoredQuickFilters(quickFiltersStorageKey)
      : null;
    if (stored?.sortByField != null) return stored.sortByField;
    return defaultSortFieldValid;
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const stored = quickFiltersStorageKey
      ? loadStoredQuickFilters(quickFiltersStorageKey)
      : null;
    if (stored?.sortByField != null) return stored.sortDirection;
    return defaultSortFieldValid ? defaultSortConfig.direction : "asc";
  });
  const [selectedFilterPresetId, setSelectedFilterPresetId] = useState<string | null>(() =>
    quickFiltersStorageKey
      ? (loadStoredQuickFilters(quickFiltersStorageKey)?.selectedFilterPresetId ?? null)
      : null
  );
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string | null>(null);
  const reportedConfigErrorsRef = useRef<Set<string>>(new Set());
  const prevViewIdRef = useRef<string | null>(null);
  const draggingRef = useRef(false);
  const openingRef = useRef(false);

  const reportConfigError = useCallback((property: string, message: string) => {
    const key = `${property}\n${message}`;
    if (reportedConfigErrorsRef.current.has(key)) return;
    reportedConfigErrorsRef.current.add(key);
    setConfigErrors((prev) => [...prev.filter((e) => e.property !== property), { property, message }]);
  }, []);

  const clearConfigError = useCallback((property: string) => {
    setConfigErrors((prev) => prev.filter((e) => e.property !== property));
    for (const key of reportedConfigErrorsRef.current) {
      if (key.startsWith(`${property}\n`)) reportedConfigErrorsRef.current.delete(key);
    }
  }, []);

  const { getOptionSets, getBusinessProcessFlows } = useDataverse(context, reportConfigError, clearConfigError);
  const { openForm, openEntityInNewTab } = useNavigation(context);
  const { dataset } = context.parameters;
  const showOpenInNewTabButton = (context.parameters as { showOpenInNewTabButton?: { raw?: boolean } }).showOpenInNewTabButton?.raw === true;

  // Key for refresh: derived from current records on each render so that
  // after dataset.refresh() the display updates (even when PCF returns the same reference).
  const datasetRecordsKey =
    `${Object.keys(dataset.records).length}-${Object.keys(dataset.records).sort().slice(0, 100).join(",")}`;

  const quickFilterFieldsParam = (context.parameters as { quickFilterFields?: { raw?: string } }).quickFilterFields?.raw;
  const quickFilterFieldsParsed = useMemo(
    () => parseQuickFilterFieldsRaw(quickFilterFieldsParam, reportConfigError, clearConfigError, "quickFilterFields"),
    [quickFilterFieldsParam, reportConfigError, clearConfigError]
  );

  const quickFilterFieldsInPopupParam = (context.parameters as { quickFilterFieldsInPopup?: { raw?: string } }).quickFilterFieldsInPopup?.raw;
  const quickFilterFieldsInPopupSet = useMemo((): Set<string> => {
    const list = parseQuickFilterFieldsRaw(
      quickFilterFieldsInPopupParam,
      reportConfigError,
      clearConfigError,
      "quickFilterFieldsInPopup"
    );
    return new Set(list);
  }, [quickFilterFieldsInPopupParam, reportConfigError, clearConfigError]);

  const sortFieldsParam = (context.parameters as { sortFields?: { raw?: string } }).sortFields?.raw;
  const sortFieldsParsed = useMemo(
    () => parseQuickFilterFieldsRaw(sortFieldsParam, reportConfigError, clearConfigError, "sortFields"),
    [sortFieldsParam, reportConfigError, clearConfigError]
  );

  // Filter presets JSON config: from component property "Filter presets" (filterPresets).
  // Must be set to a static value (JSON array) in the view/form configuration of the component.
  const params = context.parameters as unknown as Record<string, { raw?: string } | undefined>;
  const filterPresetsParamRaw =
    params.filterPresets?.raw ?? params["filterPresets"]?.raw;
  const filterPresetsParam =
    typeof filterPresetsParamRaw === "string" ? filterPresetsParamRaw.trim() : "";
  const filterPresetsConfig = useMemo((): FilterPresetConfig[] => {
    if (!filterPresetsParam) return [];
    try {
      const arr = JSON.parse(filterPresetsParam) as unknown;
      if (!Array.isArray(arr)) return [];
      clearConfigError("filterPresets");
      return arr
        .filter((e): e is FilterPresetConfig => {
          if (!e || typeof e !== "object") return false;
          const id = (e as Record<string, unknown>).id;
          const label = (e as Record<string, unknown>).label;
          const filters = (e as Record<string, unknown>).filters;
          if (typeof id !== "string" || !String(id).trim()) return false;
          if (typeof label !== "string") return false;
          if (filters == null || typeof filters !== "object" || Array.isArray(filters)) return false;
          return true;
        })
        .map((e) => ({
          id: String(e.id).trim(),
          label: String(e.label),
          filters: typeof e.filters === "object" && e.filters !== null && !Array.isArray(e.filters)
            ? Object.fromEntries(
                Object.entries(e.filters).map(([k, v]) => {
                  if (Array.isArray(v)) {
                    return [k, (v as unknown[]).map((x) => (x != null ? String(x) : ""))];
                  }
                  if (v != null && typeof v === "object" && "start" in v && "end" in v) {
                    const start = String((v as { start: unknown }).start).trim();
                    const end = String((v as { end: unknown }).end).trim();
                    return [k, start && end ? `custom:${start}|${end}` : ""];
                  }
                  if (v != null) return [k, String(v)];
                  return [k, ""];
                })
              )
            : {},
        }));
    } catch (e) {
      reportConfigError("filterPresets", e instanceof Error ? e.message : String(e));
      return [];
    }
  }, [filterPresetsParam, reportConfigError, clearConfigError]);

  const fieldDisplayNamesOnCardMap = useMemo((): Map<string, string> => {
    const raw = (context.parameters as { fieldDisplayNamesOnCard?: { raw?: string } }).fieldDisplayNamesOnCard?.raw?.trim();
    if (!raw) return new Map();
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Map();
      clearConfigError("fieldDisplayNamesOnCard");
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
      reportConfigError("fieldDisplayNamesOnCard", e instanceof Error ? e.message : String(e));
      return new Map();
    }
  }, [(context.parameters as { fieldDisplayNamesOnCard?: { raw?: string } }).fieldDisplayNamesOnCard?.raw, reportConfigError, clearConfigError]);

  const quickFilterFieldsConfig = useMemo((): QuickFilterFieldConfig[] => {
    if (!dataset?.columns) return [];
    const colWithType = dataset.columns as { name: string; displayName?: string; dataType?: string | number }[];
    const records = dataset.records;
    const firstRecord = records && Object.keys(records).length > 0
      ? records[Object.keys(records)[0]]
      : undefined;
    const result = quickFilterFieldsParsed
      .map((name): QuickFilterFieldConfig | null => {
        const col = colWithType.find((c) => c.name === name);
        if (!col) return null;
        const displayName =
          fieldDisplayNamesOnCardMap.get(col.name) ?? col.displayName ?? col.name;
        let isDateField = isDateColumnDataType(col.dataType);
        if (!isDateField && firstRecord) {
          try {
            const raw = firstRecord.getValue(col.name);
            isDateField = raw instanceof Date || (typeof raw === "number" && raw > 1000000000000);
          } catch {
            // ignore
          }
        }
        let isNumberField = isNumberColumnDataType(col.dataType);
        if (!isNumberField && firstRecord) {
          try {
            const raw = firstRecord.getValue(col.name);
            isNumberField = typeof raw === "number" && !Number.isNaN(raw) && raw < 1000000000000;
          } catch {
            // ignore
          }
        }
        const dataTypeStr = typeof col.dataType === "string" ? col.dataType : undefined;
        const isMultiselect = !isBooleanColumnDataType(dataTypeStr);
        const inPopup = quickFilterFieldsInPopupSet.has(col.name);
        return {
          key: col.name,
          text: displayName,
          isMultiselect,
          ...(inPopup ? { inPopup: true as const } : {}),
          ...(isDateField ? { isDateField: true as const } : {}),
          ...(isNumberField ? { isNumberField: true as const } : {}),
        };
      })
      .filter((c): c is QuickFilterFieldConfig => c !== null);
    return result;
  }, [dataset?.columns, dataset?.records, quickFilterFieldsParsed, fieldDisplayNamesOnCardMap, quickFilterFieldsInPopupSet]);

  const sortFieldsConfig = useMemo((): SortFieldConfig[] => {
    if (!dataset?.columns) return [];
    return sortFieldsParsed
      .map((name) => {
        const col = dataset.columns.find((c) => c.name === name);
        if (!col) return null;
        const displayName =
          fieldDisplayNamesOnCardMap.get(col.name) ?? col.displayName ?? col.name;
        return { key: col.name, text: displayName };
      })
      .filter((c): c is SortFieldConfig => c !== null);
  }, [dataset?.columns, sortFieldsParsed, fieldDisplayNamesOnCardMap]);

  const setQuickFilterValue = useCallback((field: string, value: string | string[] | null) => {
    setSelectedFilterPresetId(null);
    const normalized =
      value === QUICK_FILTER_ALL_KEY
        ? null
        : Array.isArray(value) && value.length === 0
          ? null
          : value;
    setQuickFilterValuesState((prev) => ({ ...prev, [field]: normalized }));
  }, []);

  const applyFilterPreset = useCallback(
    (presetId: string | null) => {
      setSelectedFilterPresetId(presetId);
      if (!presetId) {
        // "(Kein Preset)": alle Quick-Filter leeren
        setQuickFilterValuesState(() => {
          const next: Record<string, string | string[] | null> = {};
          for (const cfg of quickFilterFieldsConfig) {
            next[cfg.key] = null;
          }
          return next;
        });
        return;
      }
      const preset = filterPresetsConfig.find((p) => p.id === presetId);
      if (preset) {
        setQuickFilterValuesState(() => {
          const next: Record<string, string | string[] | null> = {};
          for (const cfg of quickFilterFieldsConfig) {
            const logicalName = cfg.key.includes(".") ? cfg.key.slice(cfg.key.lastIndexOf(".") + 1) : cfg.key;
            const raw = preset.filters[cfg.key] ?? preset.filters[logicalName];
            if (raw === undefined) {
              next[cfg.key] = null;
            } else if (cfg.isDateField) {
              const val = Array.isArray(raw) ? raw[0] : raw;
              next[cfg.key] = val != null && String(val).trim() !== "" ? String(val).trim() : null;
            } else if (cfg.isNumberField) {
              const val = Array.isArray(raw) ? raw[0] : raw;
              next[cfg.key] = val != null && String(val).trim() !== "" ? String(val).trim() : null;
            } else {
              const arr = Array.isArray(raw) ? raw : [raw];
              const withPlaceholder = arr.map((v) =>
                v === FILTER_PRESET_PLACEHOLDER_CURRENT_USER ? (currentUserDisplayName ?? "") : String(v)
              );
              if (cfg.isMultiselect) {
                next[cfg.key] = withPlaceholder.filter(Boolean).length ? withPlaceholder.filter(Boolean) : null;
              } else {
                next[cfg.key] = withPlaceholder[0] ?? null;
              }
            }
          }
          return next;
        });
      }
    },
    [filterPresetsConfig, quickFilterFieldsConfig, currentUserDisplayName]
  );

  useEffect(() => {
    reportedConfigErrorsRef.current.clear();
  }, [
    context.parameters.filteredBusinessProcessFlows?.raw,
    context.parameters.businessProcessFlowStepOrder?.raw,
    (context.parameters as { hiddenFieldsOnCard?: { raw?: string } }).hiddenFieldsOnCard?.raw,
    (context.parameters as { htmlFieldsOnCard?: { raw?: string } }).htmlFieldsOnCard?.raw,
    (context.parameters as { allowedHtmlTagsOnCard?: { raw?: string } }).allowedHtmlTagsOnCard?.raw,
    (context.parameters as { allowedHtmlAttributesOnCard?: { raw?: string } }).allowedHtmlAttributesOnCard?.raw,
    (context.parameters as { booleanFieldHighlights?: { raw?: string } }).booleanFieldHighlights?.raw,
    (context.parameters as { fieldWidthsOnCard?: { raw?: string } }).fieldWidthsOnCard?.raw,
    (context.parameters as { emailFieldsOnCard?: { raw?: string } }).emailFieldsOnCard?.raw,
    (context.parameters as { phoneFieldsOnCard?: { raw?: string } }).phoneFieldsOnCard?.raw,
    (context.parameters as { ellipsisFieldsOnCard?: { raw?: string } }).ellipsisFieldsOnCard?.raw,
    (context.parameters as { fieldDisplayNamesOnCard?: { raw?: string } }).fieldDisplayNamesOnCard?.raw,
    (context.parameters as { quickFilterFields?: { raw?: string } }).quickFilterFields?.raw,
    (context.parameters as { sortFields?: { raw?: string } }).sortFields?.raw,
    filterPresetsParam,
  ]);

  // Load current user display name (for {{currentUser}} placeholder in filter presets)
  useEffect(() => {
    const userSettings = (context as { userSettings?: { userId?: string } }).userSettings;
    const userId = userSettings?.userId;
    if (!userId || !context.webAPI) return;
    context.webAPI
      .retrieveRecord("systemuser", userId, "?$select=fullname")
      .then((user: { fullname?: string }) => {
        const name = user?.fullname;
        setCurrentUserDisplayName(typeof name === "string" ? name : null);
      })
      .catch(() => setCurrentUserDisplayName(null));
  }, [context]);

  // Re-apply preset with {{currentUser}} once the user name is loaded
  useEffect(() => {
    if (!currentUserDisplayName || !selectedFilterPresetId) return;
    const preset = filterPresetsConfig.find((p) => p.id === selectedFilterPresetId);
    if (!preset) return;
    const hasPlaceholder = (v: string | string[]) =>
      v === FILTER_PRESET_PLACEHOLDER_CURRENT_USER ||
      (Array.isArray(v) && v.includes(FILTER_PRESET_PLACEHOLDER_CURRENT_USER));
    if (!Object.values(preset.filters).some(hasPlaceholder)) return;
    setQuickFilterValuesState((prev) => {
      const next = { ...prev };
      for (const cfg of quickFilterFieldsConfig) {
        const logicalName = cfg.key.includes(".") ? cfg.key.slice(cfg.key.lastIndexOf(".") + 1) : cfg.key;
        const val = preset.filters[cfg.key] ?? preset.filters[logicalName];
        if (val === FILTER_PRESET_PLACEHOLDER_CURRENT_USER) {
          next[cfg.key] = cfg.isMultiselect ? [currentUserDisplayName] : currentUserDisplayName;
        } else if (Array.isArray(val) && val.includes(FILTER_PRESET_PLACEHOLDER_CURRENT_USER)) {
          next[cfg.key] = val.map((v) => (v === FILTER_PRESET_PLACEHOLDER_CURRENT_USER ? currentUserDisplayName : v));
          if (!cfg.isMultiselect && next[cfg.key] && Array.isArray(next[cfg.key])) {
            next[cfg.key] = (next[cfg.key] as string[])[0] ?? null;
          }
        }
      }
      return next;
    });
  }, [currentUserDisplayName, selectedFilterPresetId, filterPresetsConfig, quickFilterFieldsConfig]);

  // On view change (different Dataverse view): load stored quick filters for this view
  useEffect(() => {
    if (!quickFiltersStorageKey) return;
    if (prevViewIdRef.current !== null && prevViewIdRef.current !== viewId) {
      const stored = loadStoredQuickFilters(quickFiltersStorageKey);
      if (stored) {
        setQuickFilterValuesState(stored.quickFilterValues);
        setSearchKeyword(stored.searchKeyword);
        setSortByField(stored.sortByField);
        setSortDirection(stored.sortDirection);
        setSelectedFilterPresetId(stored.selectedFilterPresetId);
      }
    }
    prevViewIdRef.current = viewId;
  }, [viewId, quickFiltersStorageKey]);

  // Persist quick filters to local storage on change (only for current view)
  useEffect(() => {
    if (!quickFiltersStorageKey) return;
    try {
      localStorage.setItem(
        quickFiltersStorageKey,
        JSON.stringify({
          quickFilterValues,
          searchKeyword,
          sortByField,
          sortDirection,
          selectedFilterPresetId,
        })
      );
    } catch {
      // Local storage full or not available
    }
  }, [quickFiltersStorageKey, quickFilterValues, searchKeyword, sortByField, sortDirection, selectedFilterPresetId]);

  const openFormWithLoading = useCallback(async (entityName: string, id?: string) => {
    if (openingRef.current) return;
    openingRef.current = true;
    setIsOpeningEntity(true);
    try {
      await openForm(entityName, id);
    } finally {
      openingRef.current = false;
      setIsOpeningEntity(false);
    }
  }, [openForm]);

  const handleViewChange = useCallback(() => {
    if (activeView === undefined || activeView.columns === undefined) return;

    const allCards: any[] = filterRecords(activeView, quickFilterFieldsParsed);

    const optionsByField: Record<string, IDropdownOption[]> = {};
    for (const cfg of quickFilterFieldsConfig) {
      if (cfg.isDateField || cfg.isNumberField) continue;
      const values = new Set<string>();
      let hasEmpty = false;
      for (const card of allCards) {
        const v = getQuickFilterComparableValue(card[cfg.key]);
        if (v === "") hasEmpty = true;
        else values.add(v);
      }
      const valueOptions = Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((val) => ({ key: val, text: val }));
      optionsByField[cfg.key] = [
        { key: QUICK_FILTER_ALL_KEY, text: "(Alle)" },
        ...(hasEmpty ? [{ key: QUICK_FILTER_EMPTY_KEY, text: "(Leer)" }] : []),
        ...valueOptions,
      ];
    }
    setQuickFilterOptions(optionsByField);

    let filteredCards = allCards.filter((card: any) => {
      for (const cfg of quickFilterFieldsConfig) {
        const selected = quickFilterValues[cfg.key];
        if (cfg.isDateField) {
          const dateFilterVal = selected == null || Array.isArray(selected) ? null : selected;
          if (dateFilterVal === null || dateFilterVal === "") continue;
          const recordDate = toComparableDate(card[`${cfg.key}Raw`] ?? card[cfg.key]);
          if (!isDateInFilterRange(recordDate, dateFilterVal)) return false;
          continue;
        }
        if (cfg.isNumberField) {
          const numFilterVal = selected == null || Array.isArray(selected) ? null : selected;
          if (numFilterVal === null || numFilterVal === "") continue;
          const recordNum = toComparableNumber(card[`${cfg.key}Raw`] ?? card[cfg.key]);
          if (!isNumberInFilterRange(recordNum, numFilterVal)) return false;
          continue;
        }
        const cardVal = getQuickFilterComparableValue(card[cfg.key]);
        if (cfg.isMultiselect) {
          const arr = Array.isArray(selected) ? selected : null;
          if (!arr || arr.length === 0) continue;
          if (arr.includes(QUICK_FILTER_EMPTY_KEY)) {
            if (cardVal !== "") return false;
          } else if (!arr.includes(cardVal)) {
            return false;
          }
        } else {
          if (selected == null || selected === "") continue;
          if (selected === QUICK_FILTER_EMPTY_KEY) {
            if (cardVal !== "") return false;
          } else if (cardVal !== selected) {
            return false;
          }
        }
      }
      return true;
    });

    const searchTrimmed = searchKeyword.trim().toLowerCase();
    if (searchTrimmed) {
      filteredCards = filteredCards.filter((card: any) => {
        const parts: string[] = [];
        for (const key of Object.keys(card)) {
          if (key === "id" || key === "column") continue;
          parts.push(getQuickFilterComparableValue(card[key]));
        }
        const searchableText = parts.join(" ").toLowerCase();
        return searchableText.includes(searchTrimmed);
      });
    }

    let activeColumns = activeView?.columns ?? [];
    if (
      activeView.type != "BPF" &&
      (filteredCards.some((card: any) => !(activeView.key in card)) ||
        filteredCards.some((card: any) => card[activeView.key]?.value === ""))
    ) {
      activeColumns = [unlocatedColumn, ...activeColumns];
    }

    let columns = activeColumns.map((col) => {
      return {
        ...col,
        cards: filteredCards.filter((card: any) => card?.column == col.id),
      };
    });

    if (sortByField) {
      const useEstimatedValueRaw = sortByField === "estimatedvalue";
      columns = columns.map((col) => {
        const sortedCards = [...(col.cards ?? [])].sort((a: any, b: any) => {
          let cmp: number;
          if (useEstimatedValueRaw) {
            const aNum =
              typeof a.estimatedvalueRaw === "number" && !Number.isNaN(a.estimatedvalueRaw)
                ? a.estimatedvalueRaw
                : null;
            const bNum =
              typeof b.estimatedvalueRaw === "number" && !Number.isNaN(b.estimatedvalueRaw)
                ? b.estimatedvalueRaw
                : null;
            if (aNum !== null && bNum !== null) {
              cmp = aNum - bNum;
            } else if (aNum !== null) {
              cmp = -1;
            } else if (bNum !== null) {
              cmp = 1;
            } else {
              cmp = 0;
            }
          } else {
            const va = getQuickFilterComparableValue(a[sortByField]);
            const vb = getQuickFilterComparableValue(b[sortByField]);
            const aEmpty = va == null || String(va).trim() === "";
            const bEmpty = vb == null || String(vb).trim() === "";
            if (aEmpty && bEmpty) {
              cmp = 0;
            } else if (aEmpty) {
              cmp = 1;
            } else if (bEmpty) {
              cmp = -1;
            } else {
              cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
            }
          }
          return sortDirection === "asc" ? cmp : -cmp;
        });
        return { ...col, cards: sortedCards };
      });
    }

    setColumns(columns);
  }, [
    activeView,
    quickFilterFieldsParsed,
    quickFilterFieldsConfig,
    quickFilterValues,
    searchKeyword,
    sortByField,
    sortDirection,
    dataset.records,
    datasetRecordsKey,
    context,
  ]);

  useEffect(() => {
    handleViewChange();
  }, [handleViewChange]);

  const handleColumnsChange = async () => {
    const options = await getOptionSets(undefined);
    const recordIds = Object.keys(dataset.records);
    if (Object.keys(dataset.records).length <= 0) {
      setIsLoading(false);
      return;
    }

    if (
      context.parameters.dataset.paging != null &&
      context.parameters.dataset.paging.hasNextPage == true &&
      Object.keys(dataset.records).length < 2500
    ) {
      context.parameters.dataset.paging.loadNextPage();
      return;
    }

    const process = await getBusinessProcessFlows(
      dataset.getTargetEntityType(),
      recordIds
    );
    const allViews = [...(options ?? []), ...(process ?? [])];

    if (allViews === undefined) {
      setIsLoading(false);
      return;
    }

    setViews(allViews);

    const defaultView = context.parameters.defaultView?.raw;

    if (defaultView && !activeView) {
      const view = allViews.find((view) => view.text == defaultView);
      setActiveView(view ?? allViews[0]);
    } else {
      if (activeView != undefined) {
        setActiveView(allViews.find((view) => view.key === activeView.key));
        handleViewChange();
      } else {
        setActiveView(allViews[0] ?? []);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setSelectedEntity(dataset.getTargetEntityType());
    handleColumnsChange();
  }, [context.parameters.dataset.columns]);

  const filterRecords = useCallback(
    (activeView: ViewItem, quickFilterFieldsList: string[]) => {
      return Object.entries(dataset.records).map(([id, record]) => {
        const columnValues = dataset.columns.reduce((acc, col, index) => {
          if (col.name === activeView.key) {
            const targetColumn =
              activeView.columns !== undefined
                ? activeView.columns.find(
                    (column) =>
                      column.title === record.getFormattedValue(col.name)
                  )
                : { id: null };
            const key = targetColumn ? targetColumn.id : "unallocated";
            acc = { ...acc, column: key };
          }

          if (activeView.type === "BPF") {
            const key =
              activeView.records?.find((val) => val.id === id)?.stageName ?? "";
            acc = { ...acc, column: key };
          }

          const name = index === 0 ? "title" : col.name;
          const hasDisplayName = col.displayName != null && String(col.displayName).trim() !== "";

          if (!hasDisplayName) {
            return { ...acc };
          }

          const columnValue = getColumnValue(record, col);
          let result: Record<string, unknown> = { ...acc, [name]: columnValue };
          if (col.name === "estimatedvalue") {
            const rawValue = record.getValue(col.name);
            if (rawValue !== null && rawValue !== undefined) {
              result = { ...result, estimatedvalueRaw: rawValue };
            }
          }
          const rawColVal = record.getValue(col.name);
          const isDateValue =
            rawColVal instanceof Date ||
            (typeof rawColVal === "number" && rawColVal > 1000000000000);
          const isNumericValue =
            typeof rawColVal === "number" && !Number.isNaN(rawColVal) && rawColVal < 1000000000000;
          if (
            isDateValue ||
            isDateColumnDataType((col as { dataType?: string | number }).dataType)
          ) {
            if (rawColVal !== null && rawColVal !== undefined) {
              result = { ...result, [`${col.name}Raw`]: rawColVal };
            }
          }
          if (
            isNumericValue ||
            isNumberColumnDataType((col as { dataType?: string | number }).dataType)
          ) {
            if (rawColVal !== null && rawColVal !== undefined) {
              result = { ...result, [`${col.name}Raw`]: rawColVal };
            }
          }
          return result;
        }, {} as Record<string, unknown>);

        const cardData = { id, ...columnValues } as Record<string, unknown>;
        for (const fieldName of quickFilterFieldsList) {
          const col = dataset.columns.find((c) => c.name === fieldName);
          if (col && !(col.name in cardData)) {
            cardData[col.name] = getColumnValue(record, col);
          }
        }
        return cardData;
      });
    },
    [dataset.records, dataset.columns]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <BoardContext.Provider
      value={{
        context,
        views,
        activeView,
        setActiveView,
        columns,
        setColumns,
        activeViewEntity,
        setActiveViewEntity,
        selectedEntity,
        draggingRef,
        isOpeningEntity,
        openFormWithLoading,
        openEntityInNewTab,
        showOpenInNewTabButton,
        configErrors,
        reportConfigError,
        clearConfigError,
        quickFilterFieldsConfig,
        quickFilterValues,
        setQuickFilterValue,
        quickFilterOptions,
        searchKeyword,
        setSearchKeyword,
        sortFieldsConfig,
        sortByField,
        setSortByField,
        sortDirection,
        setSortDirection,
        filterPresetsConfig,
        selectedFilterPresetId,
        applyFilterPreset,
      }}
    >
      <div className="app-content-wrapper">
        {configErrors.length > 0 && (
          <div className="config-errors-banner" role="alert">
            <strong>Configuration errors:</strong>
            <ul>
              {configErrors.map((err, i) => (
                <li key={i}>
                  <strong>{err.property}</strong>: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Board />
        {isOpeningEntity && (
          <div className="opening-entity-overlay" aria-busy="true" aria-live="polite">
            <Spinner label="Opening record..." size={SpinnerSize.large} />
          </div>
        )}
      </div>
      <Toaster
        position={notificationPosition}
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: 4, padding: 16 },
          duration: 5000,
        }}
      />
    </BoardContext.Provider>
  );
};

export default App;
