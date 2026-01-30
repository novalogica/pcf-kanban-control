import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";
import { Board } from "./components";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { BoardContext, ConfigError, QuickFilterFieldConfig } from "./context/board-context";
import { ColumnItem, ViewItem, ViewEntity } from "./interfaces";
import Loading from "./components/container/loading";
import { Toaster } from "react-hot-toast";
import { useDataverse } from "./hooks/useDataverse";
import { useNavigation } from "./hooks/useNavigation";
import { getColumnValue } from "./lib/utils";
import { unlocatedColumn } from "./lib/constants";
import { Spinner, SpinnerSize } from "@fluentui/react";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { CardInfo } from "./interfaces";

const QUICK_FILTER_ALL_KEY = "__all__";
const QUICK_FILTER_EMPTY_KEY = "__empty__";

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
  reportError: (property: string, message: string) => void
): string[] {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith("[")) {
      const arr = JSON.parse(trimmed) as unknown;
      return Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean) : [];
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    if (trimmed.startsWith("[")) {
      reportError("quickFilterFields", e instanceof Error ? e.message : String(e));
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewItem | undefined>();
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [views, setViews] = useState<ViewItem[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>();
  const [activeViewEntity, setActiveViewEntity] = useState<ViewEntity | undefined>();
  const [isOpeningEntity, setIsOpeningEntity] = useState(false);
  const [configErrors, setConfigErrors] = useState<ConfigError[]>([]);
  const [quickFilterValues, setQuickFilterValuesState] = useState<Record<string, string | null>>({});
  const [quickFilterOptions, setQuickFilterOptions] = useState<Record<string, IDropdownOption[]>>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const reportedConfigErrorsRef = useRef<Set<string>>(new Set());
  const draggingRef = useRef(false);
  const openingRef = useRef(false);

  const reportConfigError = useCallback((property: string, message: string) => {
    const key = `${property}\n${message}`;
    if (reportedConfigErrorsRef.current.has(key)) return;
    reportedConfigErrorsRef.current.add(key);
    setConfigErrors((prev) => [...prev, { property, message }]);
  }, []);

  const { getOptionSets, getBusinessProcessFlows } = useDataverse(context, reportConfigError);
  const { openForm } = useNavigation(context);
  const { dataset } = context.parameters;

  const quickFilterFieldsParam = (context.parameters as { quickFilterFields?: { raw?: string } }).quickFilterFields?.raw;
  const quickFilterFieldsParsed = useMemo(
    () => parseQuickFilterFieldsRaw(quickFilterFieldsParam, reportConfigError),
    [quickFilterFieldsParam, reportConfigError]
  );

  const quickFilterFieldsConfig = useMemo((): QuickFilterFieldConfig[] => {
    if (!dataset?.columns) return [];
    return quickFilterFieldsParsed
      .map((name) => {
        const col = dataset.columns.find((c) => c.name === name);
        return col ? { key: col.name, text: col.displayName ?? col.name } : null;
      })
      .filter((c): c is QuickFilterFieldConfig => c !== null);
  }, [dataset?.columns, quickFilterFieldsParsed]);

  const setQuickFilterValue = useCallback((field: string, value: string | null) => {
    setQuickFilterValuesState((prev) => ({ ...prev, [field]: value === QUICK_FILTER_ALL_KEY ? null : value }));
  }, []);

  useEffect(() => {
    reportedConfigErrorsRef.current.clear();
    setConfigErrors([]);
  }, [
    context.parameters.filteredBusinessProcessFlows?.raw,
    context.parameters.businessProcessFlowStepOrder?.raw,
    (context.parameters as { hiddenFieldsOnCard?: { raw?: string } }).hiddenFieldsOnCard?.raw,
    (context.parameters as { htmlFieldsOnCard?: { raw?: string } }).htmlFieldsOnCard?.raw,
    (context.parameters as { booleanFieldHighlights?: { raw?: string } }).booleanFieldHighlights?.raw,
    (context.parameters as { fieldWidthsOnCard?: { raw?: string } }).fieldWidthsOnCard?.raw,
    (context.parameters as { emailFieldsOnCard?: { raw?: string } }).emailFieldsOnCard?.raw,
    (context.parameters as { phoneFieldsOnCard?: { raw?: string } }).phoneFieldsOnCard?.raw,
    (context.parameters as { quickFilterFields?: { raw?: string } }).quickFilterFields?.raw,
  ]);

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
        if (selected == null || selected === "") continue;
        const cardVal = getQuickFilterComparableValue(card[cfg.key]);
        if (selected === QUICK_FILTER_EMPTY_KEY) {
          if (cardVal !== "") return false;
        } else if (cardVal !== selected) {
          return false;
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

    const columns = activeColumns.map((col) => {
      return {
        ...col,
        cards: filteredCards.filter((card: any) => card?.column == col.id),
      };
    });
    setColumns(columns);
  }, [
    activeView,
    quickFilterFieldsParsed,
    quickFilterFieldsConfig,
    quickFilterValues,
    searchKeyword,
    dataset.records,
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

  useMemo(() => {
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
          if (fieldName in cardData) continue;
          const col = dataset.columns.find((c) => c.name === fieldName);
          if (col) {
            cardData[fieldName] = getColumnValue(record, col);
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
        quickFilterFieldsConfig,
        quickFilterValues,
        setQuickFilterValue,
        quickFilterOptions,
        searchKeyword,
        setSearchKeyword,
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
