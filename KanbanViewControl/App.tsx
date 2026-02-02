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
import { getColumnValue, isBooleanColumnDataType } from "./lib/utils";
import { unlocatedColumn } from "./lib/constants";
import { Spinner, SpinnerSize } from "@fluentui/react";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { CardInfo } from "./interfaces";

const QUICK_FILTER_ALL_KEY = "__all__";
const QUICK_FILTER_EMPTY_KEY = "__empty__";
const QUICK_FILTERS_STORAGE_PREFIX = "pcf-kanban-quickfilters";

/**
 * Filter-Presets: JSON-Konfiguration über Komponenten-Property "Filter presets" (filterPresets).
 * Format: Array von { id: string, label: string, filters: Record<fieldLogicalName, filterValue> }.
 * filterValue muss den Werten in den Quick-Filter-Dropdowns entsprechen.
 *
 * Platzhalter für aktuellen Benutzer (z. B. bei ownerid für "Meine Opportunities"):
 * In filters den Wert "{{currentUser}}" verwenden – wird zur Laufzeit durch den Anzeigenamen
 * des eingeloggten Benutzers ersetzt (Dataverse systemuser.fullname).
 *
 * Beispiel für die Property im Formular-Editor:
 * [{"id":"open","label":"Offen","filters":{"statuscode":"1"}},{"id":"my-opportunities","label":"Meine Opportunities","filters":{"ownerid":"{{currentUser}}"}}]
 */

/** Platzhalter in Filter-Presets: wird durch den Anzeigenamen des aktuellen Benutzers ersetzt (z. B. für ownerid). */
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
  // View-ID für Local-Storage-Scope: Schnellfilter pro View getrennt speichern
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
  const [sortByField, setSortByField] = useState<string | null>(() =>
    quickFiltersStorageKey
      ? (loadStoredQuickFilters(quickFiltersStorageKey)?.sortByField ?? null)
      : null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(() =>
    quickFiltersStorageKey
      ? (loadStoredQuickFilters(quickFiltersStorageKey)?.sortDirection ?? "asc")
      : "asc"
  );
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
  const { openForm } = useNavigation(context);
  const { dataset } = context.parameters;

  // Schlüssel für Refresh: Bei jedem Render aus aktuellen Records ableiten, damit
  // nach dataset.refresh() die Anzeige aktualisiert wird (auch wenn PCF dieselbe Referenz liefert).
  const datasetRecordsKey =
    `${Object.keys(dataset.records).length}-${Object.keys(dataset.records).sort().slice(0, 100).join(",")}`;

  const quickFilterFieldsParam = (context.parameters as { quickFilterFields?: { raw?: string } }).quickFilterFields?.raw;
  const quickFilterFieldsParsed = useMemo(
    () => parseQuickFilterFieldsRaw(quickFilterFieldsParam, reportConfigError, clearConfigError, "quickFilterFields"),
    [quickFilterFieldsParam, reportConfigError, clearConfigError]
  );

  const sortFieldsParam = (context.parameters as { sortFields?: { raw?: string } }).sortFields?.raw;
  const sortFieldsParsed = useMemo(
    () => parseQuickFilterFieldsRaw(sortFieldsParam, reportConfigError, clearConfigError, "sortFields"),
    [sortFieldsParam, reportConfigError, clearConfigError]
  );

  // JSON-Konfiguration Filter-Presets: aus Komponenten-Property "Filter presets" (filterPresets).
  // Muss in der View-/Formular-Konfiguration der Komponente auf einen statischen Wert (JSON-Array) gesetzt werden.
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
                Object.entries(e.filters).map(([k, v]) => [
                  k,
                  Array.isArray(v)
                    ? (v as unknown[]).map((x) => (x != null ? String(x) : ""))
                    : v != null
                      ? String(v)
                      : "",
                ])
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
    const colWithType = dataset.columns as { name: string; displayName?: string; dataType?: string }[];
    return quickFilterFieldsParsed
      .map((name) => {
        const col = colWithType.find((c) => c.name === name);
        if (!col) return null;
        const displayName =
          fieldDisplayNamesOnCardMap.get(col.name) ?? col.displayName ?? col.name;
        const isMultiselect = !isBooleanColumnDataType(col.dataType);
        return { key: col.name, text: displayName, isMultiselect };
      })
      .filter((c): c is QuickFilterFieldConfig => c !== null);
  }, [dataset?.columns, quickFilterFieldsParsed, fieldDisplayNamesOnCardMap]);

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
        // Nur die im Preset definierten Filter setzen, alle anderen leeren
        setQuickFilterValuesState(() => {
          const next: Record<string, string | string[] | null> = {};
          for (const cfg of quickFilterFieldsConfig) {
            const raw = preset.filters[cfg.key];
            if (raw === undefined) {
              next[cfg.key] = null;
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

  // Anzeigenamen des aktuellen Benutzers laden (für Platzhalter {{currentUser}} in Filter-Presets)
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

  // Preset mit {{currentUser}} erneut anwenden, sobald der Benutzername geladen ist
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
      for (const key of Object.keys(preset.filters)) {
        const val = preset.filters[key];
        if (val === FILTER_PRESET_PLACEHOLDER_CURRENT_USER) {
          next[key] = currentUserDisplayName;
        } else if (Array.isArray(val) && val.includes(FILTER_PRESET_PLACEHOLDER_CURRENT_USER)) {
          const cfg = quickFilterFieldsConfig.find((c) => c.key === key);
          next[key] = val.map((v) => (v === FILTER_PRESET_PLACEHOLDER_CURRENT_USER ? currentUserDisplayName : v));
          if (!cfg?.isMultiselect && next[key] && Array.isArray(next[key])) {
            next[key] = (next[key] as string[])[0] ?? null;
          }
        }
      }
      return next;
    });
  }, [currentUserDisplayName, selectedFilterPresetId, filterPresetsConfig, quickFilterFieldsConfig]);

  // Bei View-Wechsel (andere Dataverse-View): gespeicherte Schnellfilter für diesen View laden
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

  // Schnellfilter bei Änderung in Local Storage speichern (nur für aktuellen View)
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
      // Local Storage voll oder nicht verfügbar
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
