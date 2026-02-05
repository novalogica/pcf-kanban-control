import * as React from "react";
import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { BoardContext } from "../../context/board-context";
import KanbanDropdown from "../dropdown/Dropdown";
import DateFilter from "./DateFilter";
import NumberFilter from "./NumberFilter";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { Callout } from "@fluentui/react/lib/Callout";
import { IconButton } from "@fluentui/react/lib/Button";
import type { SortDirection } from "../../context/board-context";
import type { QuickFilterFieldConfig } from "../../context/board-context";
import { getStrings } from "../../lib/strings";
import type { Strings } from "../../lib/strings";

const QUICK_FILTER_ALL_KEY = "__all__";
const SORT_NONE_KEY = "__sort_none__";
const FILTER_PRESET_NONE_KEY = "__filter_preset_none__";
const SORT_KEY_SEP = ":";
const SEARCH_DEBOUNCE_MS = 250;

function sortOptionKey(fieldKey: string, direction: SortDirection): string {
  return `${fieldKey}${SORT_KEY_SEP}${direction}`;
}

function renderFilterControl(
  cfg: QuickFilterFieldConfig,
  quickFilterOptions: Record<string, IDropdownOption[]>,
  quickFilterValues: Record<string, string | string[] | null>,
  setQuickFilterValue: (field: string, value: string | string[] | null) => void,
  strings: Strings,
  options?: { labelOverride?: string; dropdownWidth?: number }
) {
  const label = options?.labelOverride !== undefined ? options.labelOverride : cfg.text;
  const dropdownWidth = options?.dropdownWidth;
  const selectedValue = quickFilterValues[cfg.key] ?? null;

  if (cfg.isDateField) {
    return (
      <DateFilter
        key={cfg.key}
        fieldKey={cfg.key}
        label={label}
        value={selectedValue && typeof selectedValue === "string" ? selectedValue : null}
        onChange={(value) => setQuickFilterValue(cfg.key, value)}
        dropdownWidth={dropdownWidth}
        labelOverride={options?.labelOverride}
      />
    );
  }

  if (cfg.isNumberField) {
    return (
      <NumberFilter
        key={cfg.key}
        fieldKey={cfg.key}
        label={label}
        value={selectedValue && typeof selectedValue === "string" ? selectedValue : null}
        onChange={(value) => setQuickFilterValue(cfg.key, value)}
        dropdownWidth={dropdownWidth}
        labelOverride={options?.labelOverride}
        step={cfg.key.toLowerCase().includes("currency") || cfg.key.toLowerCase().includes("value") ? 0.01 : 1}
      />
    );
  }

  const rawOptions = quickFilterOptions[cfg.key] ?? [
    { key: QUICK_FILTER_ALL_KEY, text: strings.quickFilterAll },
  ];

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
        placeholder={strings.quickFilterAll}
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
      placeholder={strings.quickFilterAll}
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
    locale,
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
  const strings = getStrings(locale);

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
    <div className="kanban-quick-filters" role="group" aria-label={strings.quickFiltersAriaLabel}>
      <div className="kanban-quick-filters-inline">
        {inlineFilters.map((cfg) =>
          renderFilterControl(cfg, quickFilterOptions, quickFilterValues, setQuickFilterValue, strings)
        )}
        {popupFilters.length > 0 && (
          <div className="kanban-quick-filters-popup-trigger" ref={popupFilterButtonRef}>
            <IconButton
              iconProps={{ iconName: "Filter" }}
              title={strings.quickFiltersMoreFilters}
              ariaLabel={strings.quickFiltersMoreFiltersOpen}
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
                  <div className="kanban-quick-filters-popup-title">{strings.quickFiltersMoreFilters}</div>
                  {popupFilters.map((cfg) => (
                    <div key={cfg.key} className="kanban-quick-filters-popup-row">
                      <span className="kanban-quick-filters-popup-label">{cfg.text}</span>
                      <div className="kanban-quick-filters-popup-dropdown">
                        {renderFilterControl(
                          cfg,
                          quickFilterOptions,
                          quickFilterValues,
                          setQuickFilterValue,
                          strings,
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
              label={strings.sortByLabel}
              placeholder={strings.sortNone}
              options={[
                { key: SORT_NONE_KEY, text: strings.sortNone },
                ...sortFieldsConfig.flatMap((c) => [
                  { key: sortOptionKey(c.key, "asc"), text: `${c.text} (${strings.sortAscending})` },
                  { key: sortOptionKey(c.key, "desc"), text: `${c.text} (${strings.sortDescending})` },
                ]),
              ]}
              selectedOption={
                sortByField && sortDirection
                  ? {
                      key: sortOptionKey(sortByField, sortDirection),
                      text: `${sortFieldsConfig.find((c) => c.key === sortByField)?.text ?? sortByField} (${sortDirection === "asc" ? strings.sortAscending : strings.sortDescending})`,
                    }
                  : { key: SORT_NONE_KEY, text: strings.sortNone }
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
              label={strings.filterPresetLabel}
              placeholder={strings.filterPresetNone}
              options={[
                { key: FILTER_PRESET_NONE_KEY, text: strings.filterPresetNone },
                ...filterPresetsConfig.map((p) => ({ key: p.id, text: p.label })),
              ]}
              selectedOption={
                selectedFilterPresetId
                  ? filterPresetsConfig.find((p) => p.id === selectedFilterPresetId)
                    ? { key: selectedFilterPresetId, text: filterPresetsConfig.find((p) => p.id === selectedFilterPresetId)!.label }
                    : { key: FILTER_PRESET_NONE_KEY, text: strings.filterPresetNone }
                  : { key: FILTER_PRESET_NONE_KEY, text: strings.filterPresetNone }
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
            placeholder={strings.quickFiltersSearchPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label={strings.quickFiltersSearchAriaLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickFilters;
