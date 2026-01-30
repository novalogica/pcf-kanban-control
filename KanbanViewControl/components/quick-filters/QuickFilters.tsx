import * as React from "react";
import { useContext, useState, useEffect } from "react";
import { BoardContext } from "../../context/board-context";
import KanbanDropdown from "../dropdown/Dropdown";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";

const QUICK_FILTER_ALL_KEY = "__all__";
const SEARCH_DEBOUNCE_MS = 250;

const QuickFilters = () => {
  const {
    quickFilterFieldsConfig,
    quickFilterValues,
    setQuickFilterValue,
    quickFilterOptions,
    searchKeyword,
    setSearchKeyword,
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
  );
};

export default QuickFilters;
