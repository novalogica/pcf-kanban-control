import * as React from "react";
import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { BoardContext } from "../../context/board-context";
import KanbanDropdown from "../dropdown/Dropdown";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { Callout } from "@fluentui/react/lib/Callout";
import { IconButton } from "@fluentui/react/lib/Button";
import type { SortDirection } from "../../context/board-context";
import type { QuickFilterFieldConfig } from "../../context/board-context";

const QUICK_FILTER_ALL_KEY = "__all__";
const SORT_NONE_KEY = "__sort_none__";
const FILTER_PRESET_NONE_KEY = "__filter_preset_none__";
const SORT_KEY_SEP = ":";
const SEARCH_DEBOUNCE_MS = 250;

function sortOptionKey(fieldKey: string, direction: SortDirection): string {
  return `${fieldKey}${SORT_KEY_SEP}${direction}`;
}

function renderFilterDropdown(
  cfg: QuickFilterFieldConfig,
  quickFilterOptions: Record<string, IDropdownOption[]>,
  quickFilterValues: Record<string, string | string[] | null>,
  setQuickFilterValue: (field: string, value: string | string[] | null) => void,
  options?: { labelOverride?: string; dropdownWidth?: number }
) {
  const label = options?.labelOverride !== undefined ? options.labelOverride : cfg.text;
  const dropdownWidth = options?.dropdownWidth;
  const rawOptions = quickFilterOptions[cfg.key] ?? [
    { key: QUICK_FILTER_ALL_KEY, text: "(Alle)" },
  ];
  const selectedValue = quickFilterValues[cfg.key] ?? null;

  if (cfg.isMultiselect) {
    const opts = rawOptions.filter((o) => o.key !== QUICK_FILTER_ALL_KEY);
    const selectedKeys = Array.isArray(selectedValue)
      ? selectedValue
      : selectedValue
        ? [String(selectedValue)]
        : [];
    return (
      <KanbanDropdown
        key={cfg.key}
        label={label}
        placeholder="(Alle)"
        options={opts}
        multiSelect
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          setQuickFilterValue(cfg.key, keys.length ? keys : null);
        }}
        dropdownWidth={dropdownWidth}
      />
    );
  }

  const selectedOption = selectedValue
    ? rawOptions.find((o) => o.key === selectedValue) ?? rawOptions[0]
    : rawOptions[0];
  return (
    <KanbanDropdown
      key={cfg.key}
      label={label}
      placeholder="(Alle)"
      options={rawOptions}
      selectedOption={selectedOption as IDropdownOption}
      onOptionSelected={(option) => {
        const key = option.key;
        setQuickFilterValue(
          cfg.key,
          key === QUICK_FILTER_ALL_KEY ? null : String(key)
        );
      }}
      dropdownWidth={dropdownWidth}
    />
  );
}

const QuickFilters = () => {
  const {
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
  } = useContext(BoardContext);

  const [inputValue, setInputValue] = useState(searchKeyword);
  const [popupFilterOpen, setPopupFilterOpen] = useState(false);
  const popupFilterButtonRef = useRef<HTMLDivElement>(null);

  const inlineFilters = useMemo(
    () => quickFilterFieldsConfig?.filter((cfg) => !cfg.inPopup) ?? [],
    [quickFilterFieldsConfig]
  );
  const popupFilters = useMemo(
    () => quickFilterFieldsConfig?.filter((cfg) => cfg.inPopup) ?? [],
    [quickFilterFieldsConfig]
  );

  useEffect(() => {
    setInputValue(searchKeyword);
  }, [searchKeyword]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchKeyword(inputValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [inputValue, setSearchKeyword]);

  return (
    <div className="kanban-quick-filters" role="group" aria-label="Schnellfilter und Suche">
      <div className="kanban-quick-filters-inline">
        {inlineFilters.map((cfg) =>
          renderFilterDropdown(cfg, quickFilterOptions, quickFilterValues, setQuickFilterValue)
        )}
        {popupFilters.length > 0 && (
          <div className="kanban-quick-filters-popup-trigger" ref={popupFilterButtonRef}>
            <IconButton
              iconProps={{ iconName: "Filter" }}
              title="Weitere Filter"
              ariaLabel="Weitere Filter öffnen"
              onClick={() => setPopupFilterOpen((v) => !v)}
              className="kanban-quick-filters-more-btn"
            />
            {popupFilterOpen && popupFilterButtonRef.current && (
              <Callout
                target={popupFilterButtonRef.current}
                onDismiss={() => setPopupFilterOpen(false)}
                directionalHint={4}
                gapSpace={4}
                className="kanban-quick-filters-callout"
                setInitialFocus
              >
                <div className="kanban-quick-filters-popup-content">
                  <div className="kanban-quick-filters-popup-title">Weitere Filter</div>
                  {popupFilters.map((cfg) => (
                    <div key={cfg.key} className="kanban-quick-filters-popup-row">
                      <span className="kanban-quick-filters-popup-label">{cfg.text}</span>
                      <div className="kanban-quick-filters-popup-dropdown">
                        {renderFilterDropdown(
                          cfg,
                          quickFilterOptions,
                          quickFilterValues,
                          setQuickFilterValue,
                          { labelOverride: "" }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Callout>
            )}
          </div>
        )}
      </div>
      <div className="kanban-quick-filters-right">
        {sortFieldsConfig.length > 0 && (
          <div className="kanban-quick-filters-sort">
            <KanbanDropdown
              label="Sortieren nach"
              placeholder="(Keine)"
              options={[
                { key: SORT_NONE_KEY, text: "(Keine)" },
                ...sortFieldsConfig.flatMap((c) => [
                  { key: sortOptionKey(c.key, "asc"), text: `${c.text} (Aufsteigend)` },
                  { key: sortOptionKey(c.key, "desc"), text: `${c.text} (Absteigend)` },
                ]),
              ]}
              selectedOption={
                sortByField && sortDirection
                  ? {
                      key: sortOptionKey(sortByField, sortDirection),
                      text: `${sortFieldsConfig.find((c) => c.key === sortByField)?.text ?? sortByField} (${sortDirection === "asc" ? "Aufsteigend" : "Absteigend"})`,
                    }
                  : { key: SORT_NONE_KEY, text: "(Keine)" }
              }
              onOptionSelected={(option) => {
                const key = String(option.key);
                if (key === SORT_NONE_KEY) {
                  setSortByField(null);
                  setSortDirection("asc");
                  return;
                }
                const idx = key.indexOf(SORT_KEY_SEP);
                if (idx >= 0) {
                  const field = key.slice(0, idx);
                  const dir = key.slice(idx + 1) as SortDirection;
                  setSortByField(field);
                  setSortDirection(dir === "asc" || dir === "desc" ? dir : "asc");
                }
              }}
            />
          </div>
        )}
        {filterPresetsConfig.length > 0 && (
          <div className="kanban-quick-filters-preset">
            <KanbanDropdown
              label="Filter-Preset"
              placeholder="(Kein Preset)"
              options={[
                { key: FILTER_PRESET_NONE_KEY, text: "(Kein Preset)" },
                ...filterPresetsConfig.map((p) => ({ key: p.id, text: p.label })),
              ]}
              selectedOption={
                selectedFilterPresetId
                  ? filterPresetsConfig.find((p) => p.id === selectedFilterPresetId)
                    ? { key: selectedFilterPresetId, text: filterPresetsConfig.find((p) => p.id === selectedFilterPresetId)!.label }
                    : { key: FILTER_PRESET_NONE_KEY, text: "(Kein Preset)" }
                  : { key: FILTER_PRESET_NONE_KEY, text: "(Kein Preset)" }
              }
              onOptionSelected={(option) => {
                const key = String(option.key);
                applyFilterPreset(key === FILTER_PRESET_NONE_KEY ? null : key);
              }}
            />
          </div>
        )}
        <div className="kanban-quick-filters-search">
          <input
            type="search"
            className="kanban-quick-filters-search-input"
            placeholder="In allen Feldern suchen…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="Suche in allen Kartenfeldern"
          />
        </div>
      </div>
    </div>
  );
};

export default QuickFilters;
