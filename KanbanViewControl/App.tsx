import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";
import { Board } from "./components";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { BoardContext, ConfigError } from "./context/board-context";
import { ColumnItem, ViewItem, ViewEntity } from "./interfaces";
import Loading from "./components/container/loading";
import { Toaster } from "react-hot-toast";
import { useDataverse } from "./hooks/useDataverse";
import { useNavigation } from "./hooks/useNavigation";
import { getColumnValue } from "./lib/utils";
import { unlocatedColumn } from "./lib/constants";
import { Spinner, SpinnerSize } from "@fluentui/react";

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
  const reportedConfigErrorsRef = useRef<Set<string>>(new Set());
  const draggingRef = useRef(false);
  const openingRef = useRef(false);

  const reportConfigError = useCallback((property: string, message: string) => {
    const key = `${property}\n${message}`;
    if (reportedConfigErrorsRef.current.has(key)) return;
    reportedConfigErrorsRef.current.add(key);
    setConfigErrors((prev) => [...prev, { property, message }]);
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
  ]);

  const { getOptionSets, getBusinessProcessFlows } = useDataverse(context, reportConfigError);
  const { openForm } = useNavigation(context);
  const { dataset } = context.parameters;

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

  const handleViewChange = () => {
    if (activeView === undefined || activeView.columns === undefined) return;

    const cards: any[] = filterRecords(activeView);

    let activeColumns = activeView?.columns ?? [];

    if (
      activeView.type != "BPF" &&
      (cards.some((card) => !(activeView.key in card)) ||
        cards.some((card) => card[activeView.key]?.value === ""))
    ) {
      activeColumns = [unlocatedColumn, ...activeColumns];
    }

    const columns = activeColumns.map((col) => {
      return {
        ...col,
        cards: cards.filter((card: any) => card?.column == col.id),
      };
    });
    setColumns(columns);
  };

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

  const filterRecords = (activeView: ViewItem) => {
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

      return { id, ...columnValues };
    });
  };

  useMemo(handleViewChange, [activeView]);

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
      }}
    >
      <div className="app-content-wrapper">
        {configErrors.length > 0 && (
          <div className="config-errors-banner" role="alert">
            <strong>Konfigurationsfehler:</strong>
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
            <Spinner label="Datensatz wird geöffnet..." size={SpinnerSize.large} />
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
