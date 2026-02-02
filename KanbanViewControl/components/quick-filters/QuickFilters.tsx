import * as React from "react";
import { useContext, useState, useEffect } from "react";
import { BoardContext } from "../../context/board-context";
import KanbanDropdown from "../dropdown/Dropdown";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import type { SortDirection } from "../../context/board-context";

const QUICK_FILTER_ALL_KEY = "__all__";
const SORT_NONE_KEY = "__sort_none__";
const FILTER_PRESET_NONE_KEY = "__filter_preset_none__";
const SORT_KEY_SEP = ":";
const SEARCH_DEBOUNCE_MS = 250;

function sortOptionKey(fieldKey: string, direction: SortDirection): string {
  return `${fieldKey}${SORT_KEY_SEP}${direction}`;
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
      {quickFilterFieldsConfig?.map((cfg) => {
        const options = quickFilterOptions[cfg.key] ?? [
          { key: QUICK_FILTER_ALL_KEY, text: "(Alle)" },
        ];
        const selectedValue = quickFilterValues[cfg.key] ?? null;
        const selectedOption = selectedValue
          ? options.find((o) => o.key === selectedValue) ?? options[0]
          : options[0];

        return (
          <KanbanDropdown
            key={cfg.key}
            label={cfg.text}
            placeholder="(Alle)"
            options={options}
            selectedOption={selectedOption as IDropdownOption}
            onOptionSelected={(option) => {
              const key = option.key;
              setQuickFilterValue(
                cfg.key,
                key === QUICK_FILTER_ALL_KEY ? null : String(key)
              );
            }}
          />
        );
      })}
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
