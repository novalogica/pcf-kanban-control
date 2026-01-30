import * as React from "react";
import { useContext } from "react";
import { BoardContext } from "../../context/board-context";
import KanbanDropdown from "../dropdown/Dropdown";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";

const QUICK_FILTER_ALL_KEY = "__all__";

const QuickFilters = () => {
  const {
    quickFilterFieldsConfig,
    quickFilterValues,
    setQuickFilterValue,
    quickFilterOptions,
  } = useContext(BoardContext);

  if (!quickFilterFieldsConfig?.length) return null;

  return (
    <div className="kanban-quick-filters" role="group" aria-label="Schnellfilter">
      {quickFilterFieldsConfig.map((cfg) => {
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
    </div>
  );
};

export default QuickFilters;
