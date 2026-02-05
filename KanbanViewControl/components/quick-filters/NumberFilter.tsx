import * as React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { Callout } from "@fluentui/react/lib/Callout";
import {
  parseNumberFilterValue,
} from "../../lib/utils";
import { dropdownStyles } from "../dropdown/styles";

const NUM_FILTER_ALL_KEY = "__all__";
const NUM_FILTER_GT = "gt";
const NUM_FILTER_LT = "lt";
const NUM_FILTER_GTE = "gte";
const NUM_FILTER_LTE = "lte";
const NUM_FILTER_BETWEEN = "between";

const PREFIX_GT = "gt:";
const PREFIX_LT = "lt:";
const PREFIX_GTE = "gte:";
const PREFIX_LTE = "lte:";
const PREFIX_BETWEEN = "between:";

function getMode(value: string | null): string {
  if (!value || value === "") return NUM_FILTER_ALL_KEY;
  if (value.startsWith(PREFIX_GT)) return NUM_FILTER_GT;
  if (value.startsWith(PREFIX_LT)) return NUM_FILTER_LT;
  if (value.startsWith(PREFIX_GTE)) return NUM_FILTER_GTE;
  if (value.startsWith(PREFIX_LTE)) return NUM_FILTER_LTE;
  if (value.startsWith(PREFIX_BETWEEN)) return NUM_FILTER_BETWEEN;
  return NUM_FILTER_ALL_KEY;
}

function parseValueForInput(value: string | null): { single: string; min: string; max: string } {
  const parsed = parseNumberFilterValue(value);
  if (!parsed) return { single: "", min: "", max: "" };
  if (parsed.op === "between") {
    return { single: "", min: String(parsed.min), max: String(parsed.max) };
  }
  return { single: String(parsed.num), min: "", max: "" };
}

/** Format number for display in dropdown title (locale-aware, e.g. 10.000 or 1.234,56). */
function formatNumForDisplay(n: number): string {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

const numberFilterOptionsBase: IDropdownOption[] = [
  { key: NUM_FILTER_ALL_KEY, text: "(Alle)" },
  { key: NUM_FILTER_GT, text: "Größer als" },
  { key: NUM_FILTER_LT, text: "Kleiner als" },
  { key: NUM_FILTER_GTE, text: "Größer oder gleich" },
  { key: NUM_FILTER_LTE, text: "Kleiner oder gleich" },
  { key: NUM_FILTER_BETWEEN, text: "Zwischen" },
];

export interface NumberFilterProps {
  fieldKey: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  dropdownWidth?: number;
  labelOverride?: string;
  /** Optional: step for number input (e.g. 0.01 for currency). */
  step?: number;
}

const NumberFilter: React.FC<NumberFilterProps> = ({
  fieldKey,
  label,
  value,
  onChange,
  dropdownWidth,
  labelOverride,
  step = 1,
}) => {
  const displayLabel = labelOverride !== undefined ? labelOverride : label;
  const mode = getMode(value);
  const parsed = parseValueForInput(value);
  const [singleVal, setSingleVal] = React.useState(parsed.single);
  const [minVal, setMinVal] = React.useState(parsed.min);
  const [maxVal, setMaxVal] = React.useState(parsed.max);

  React.useEffect(() => {
    const p = parseValueForInput(value);
    setSingleVal(p.single);
    setMinVal(p.min);
    setMaxVal(p.max);
  }, [value]);

  const numberFilterOptions = React.useMemo((): IDropdownOption[] => {
    const p = parseNumberFilterValue(value);
    return numberFilterOptionsBase.map((opt) => {
      if (!p) return opt;
      if (opt.key === NUM_FILTER_GT && p.op === "gt") return { ...opt, text: `Größer als ${formatNumForDisplay(p.num)}` };
      if (opt.key === NUM_FILTER_LT && p.op === "lt") return { ...opt, text: `Kleiner als ${formatNumForDisplay(p.num)}` };
      if (opt.key === NUM_FILTER_GTE && p.op === "gte") return { ...opt, text: `≥ ${formatNumForDisplay(p.num)}` };
      if (opt.key === NUM_FILTER_LTE && p.op === "lte") return { ...opt, text: `≤ ${formatNumForDisplay(p.num)}` };
      if (opt.key === NUM_FILTER_BETWEEN && p.op === "between") return { ...opt, text: `${formatNumForDisplay(p.min)} – ${formatNumForDisplay(p.max)}` };
      return opt;
    });
  }, [value]);

  const selectedOption = numberFilterOptions.find((o) => o.key === mode) ?? numberFilterOptions[0];

  const styles =
    typeof dropdownWidth === "number"
      ? {
          ...dropdownStyles,
          dropdown: { width: dropdownWidth, minWidth: dropdownWidth },
          title: {
            width: dropdownWidth,
            minWidth: dropdownWidth,
            boxSizing: "border-box" as const,
          },
        }
      : dropdownStyles;

  const applySingle = (op: string, numStr: string) => {
    const n = parseFloat(numStr);
    if (numStr === "" || Number.isNaN(n)) {
      onChange(null);
      return;
    }
    const prefix = op === "gt" ? PREFIX_GT : op === "lt" ? PREFIX_LT : op === "gte" ? PREFIX_GTE : PREFIX_LTE;
    onChange(prefix + n);
  };

  const applyBetween = (minStr: string, maxStr: string) => {
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    if (minStr === "" || maxStr === "" || Number.isNaN(min) || Number.isNaN(max)) {
      onChange(null);
      return;
    }
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    onChange(PREFIX_BETWEEN + lo + "|" + hi);
  };

  const handleDropdownChange = (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (!option) return;
    const key = String(option.key);
    if (key === NUM_FILTER_ALL_KEY) {
      onChange(null);
      return;
    }
    if (key === NUM_FILTER_BETWEEN) {
      const min = minVal === "" ? "0" : minVal;
      const max = maxVal === "" ? "0" : maxVal;
      applyBetween(min, max);
      return;
    }
    const single = singleVal === "" ? "0" : singleVal;
    if (key === NUM_FILTER_GT) applySingle("gt", single);
    else if (key === NUM_FILTER_LT) applySingle("lt", single);
    else if (key === NUM_FILTER_GTE) applySingle("gte", single);
    else if (key === NUM_FILTER_LTE) applySingle("lte", single);
  };

  const showDetails =
    mode === NUM_FILTER_GT ||
    mode === NUM_FILTER_LT ||
    mode === NUM_FILTER_GTE ||
    mode === NUM_FILTER_LTE ||
    mode === NUM_FILTER_BETWEEN;
  const detailsAnchorRef = React.useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    if (showDetails) setDetailsOpen(true);
    else setDetailsOpen(false);
  }, [showDetails]);

  return (
    <div key={fieldKey} className="kanban-number-filter">
      <div ref={detailsAnchorRef} className="kanban-number-filter-dropdown-wrap">
        <Dropdown
          className="kanban-dropdown"
          styles={styles}
          label={displayLabel}
          placeholder="(Alle)"
          options={numberFilterOptions}
          selectedKey={selectedOption.key}
          onChange={handleDropdownChange}
        />
      </div>
      {showDetails && detailsOpen && detailsAnchorRef.current && (
        <Callout
          target={detailsAnchorRef.current}
          onDismiss={() => setDetailsOpen(false)}
          directionalHint={4}
          gapSpace={2}
          className="kanban-number-filter-callout"
          setInitialFocus
        >
          <div className="kanban-number-filter-callout-content">
            {(mode === NUM_FILTER_GT ||
              mode === NUM_FILTER_LT ||
              mode === NUM_FILTER_GTE ||
              mode === NUM_FILTER_LTE) && (
              <div className="kanban-number-filter-input">
                <TextField
                  type="number"
                  value={singleVal}
                  onChange={(_, newValue) => {
                    setSingleVal(newValue ?? "");
                    if (newValue !== undefined && newValue !== "") {
                      const n = parseFloat(newValue);
                      if (!Number.isNaN(n)) {
                        const op =
                          mode === NUM_FILTER_GT
                            ? "gt"
                            : mode === NUM_FILTER_LT
                              ? "lt"
                              : mode === NUM_FILTER_GTE
                                ? "gte"
                                : "lte";
                        applySingle(op, newValue);
                      }
                    } else {
                      onChange(null);
                    }
                  }}
                  placeholder="Wert"
                  ariaLabel="Zahlenwert"
                  step={step}
                />
              </div>
            )}
            {mode === NUM_FILTER_BETWEEN && (
              <div className="kanban-number-filter-range">
                <TextField
                  type="number"
                  value={minVal}
                  onChange={(_, newValue) => {
                    setMinVal(newValue ?? "");
                    applyBetween(newValue ?? "", maxVal);
                  }}
                  placeholder="Min"
                  ariaLabel="Mindestwert"
                  step={step}
                />
                <TextField
                  type="number"
                  value={maxVal}
                  onChange={(_, newValue) => {
                    setMaxVal(newValue ?? "");
                    applyBetween(minVal, newValue ?? "");
                  }}
                  placeholder="Max"
                  ariaLabel="Höchstwert"
                  step={step}
                />
              </div>
            )}
          </div>
        </Callout>
      )}
    </div>
  );
};

export default NumberFilter;
