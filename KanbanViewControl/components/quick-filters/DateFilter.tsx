import * as React from "react";
import { useContext } from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { Callout } from "@fluentui/react/lib/Callout";
import { dropdownStyles } from "../dropdown/styles";
import { BoardContext } from "../../context/board-context";
import { getStrings } from "../../lib/strings";

const DATE_FILTER_ALL_KEY = "__all__";
const DATE_FILTER_TODAY = "today";
const DATE_FILTER_LAST_7 = "last7";
const DATE_FILTER_LAST_30 = "last30";
const DATE_FILTER_CURRENT_MONTH = "currentMonth";
const DATE_FILTER_CURRENT_YEAR = "currentYear";
const DATE_FILTER_CUSTOM = "custom";
const DATE_FILTER_PREFIX_CUSTOM = "custom:";

function formatDateForValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseCustomRange(value: string | null): { start: Date; end: Date } | null {
  if (!value || !value.startsWith(DATE_FILTER_PREFIX_CUSTOM)) return null;
  const part = value.slice(DATE_FILTER_PREFIX_CUSTOM.length);
  const [startStr, endStr] = part.split("|");
  if (!startStr || !endStr) return null;
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { start, end };
}

/** Format date for display in dropdown title (DD.MM.YYYY). */
function formatDateForDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function getDateFilterOptionsBase(strings: ReturnType<typeof getStrings>): IDropdownOption[] {
  return [
    { key: DATE_FILTER_ALL_KEY, text: strings.dateFilterAll },
    { key: DATE_FILTER_TODAY, text: strings.dateFilterToday },
    { key: DATE_FILTER_LAST_7, text: strings.dateFilterLast7 },
    { key: DATE_FILTER_LAST_30, text: strings.dateFilterLast30 },
    { key: DATE_FILTER_CURRENT_MONTH, text: strings.dateFilterCurrentMonth },
    { key: DATE_FILTER_CURRENT_YEAR, text: strings.dateFilterCurrentYear },
    { key: DATE_FILTER_CUSTOM, text: strings.dateFilterCustomRange },
  ];
}

export interface DateFilterProps {
  fieldKey: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  dropdownWidth?: number;
  labelOverride?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  fieldKey,
  label,
  value,
  onChange,
  dropdownWidth,
  labelOverride,
}) => {
  const { locale } = useContext(BoardContext);
  const strings = getStrings(locale);
  const displayLabel = labelOverride !== undefined ? labelOverride : label;
  const dateFilterOptionsBase = React.useMemo(() => getDateFilterOptionsBase(strings), [strings]);
  const mode =
    !value || value === ""
      ? DATE_FILTER_ALL_KEY
      : value === DATE_FILTER_TODAY
        ? DATE_FILTER_TODAY
        : value === DATE_FILTER_LAST_7
          ? DATE_FILTER_LAST_7
          : value === DATE_FILTER_LAST_30
            ? DATE_FILTER_LAST_30
            : value === DATE_FILTER_CURRENT_MONTH
              ? DATE_FILTER_CURRENT_MONTH
              : value === DATE_FILTER_CURRENT_YEAR
                ? DATE_FILTER_CURRENT_YEAR
                : value.startsWith(DATE_FILTER_PREFIX_CUSTOM)
                  ? DATE_FILTER_CUSTOM
                  : DATE_FILTER_ALL_KEY;

  const customRange = parseCustomRange(value);
  const [customStart, setCustomStart] = React.useState<Date | undefined>(
    customRange?.start
  );
  const [customEnd, setCustomEnd] = React.useState<Date | undefined>(
    customRange?.end
  );

  React.useEffect(() => {
    const range = parseCustomRange(value);
    if (range) {
      setCustomStart(range.start);
      setCustomEnd(range.end);
    }
  }, [value]);

  const dateFilterOptions = React.useMemo((): IDropdownOption[] => {
    const customRangeParsed = parseCustomRange(value);
    const now = new Date();
    return dateFilterOptionsBase.map((opt: IDropdownOption) => {
      if (opt.key === DATE_FILTER_CUSTOM && customRangeParsed) {
        return { ...opt, text: `${formatDateForDisplay(customRangeParsed.start)} – ${formatDateForDisplay(customRangeParsed.end)}` };
      }
      if (opt.key === DATE_FILTER_CURRENT_MONTH && value === DATE_FILTER_CURRENT_MONTH) {
        return { ...opt, text: now.toLocaleDateString(locale, { month: "long", year: "numeric" }) };
      }
      if (opt.key === DATE_FILTER_CURRENT_YEAR && value === DATE_FILTER_CURRENT_YEAR) {
        return { ...opt, text: String(now.getFullYear()) };
      }
      return opt;
    });
  }, [value, dateFilterOptionsBase, locale]);

  const selectedOption = dateFilterOptions.find((o) => o.key === mode) ?? dateFilterOptions[0];

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

  const handleDropdownChange = (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (!option) return;
    const key = String(option.key);
    if (key === DATE_FILTER_ALL_KEY) {
      onChange(null);
      return;
    }
    if (
      key === DATE_FILTER_TODAY ||
      key === DATE_FILTER_LAST_7 ||
      key === DATE_FILTER_LAST_30 ||
      key === DATE_FILTER_CURRENT_MONTH ||
      key === DATE_FILTER_CURRENT_YEAR
    ) {
      onChange(key);
      return;
    }
    if (key === DATE_FILTER_CUSTOM) {
      const end = new Date();
      const start = new Date(end);
      start.setMonth(start.getMonth() - 1);
      const startStr = formatDateForValue(start);
      const endStr = formatDateForValue(end);
      setCustomStart(start);
      setCustomEnd(end);
      onChange(`${DATE_FILTER_PREFIX_CUSTOM}${startStr}|${endStr}`);
      return;
    }
  };

  const handleCustomStartChange = (date: Date | null | undefined) => {
    if (!date) return;
    setCustomStart(date);
    const end = customEnd ?? date;
    const startStr = formatDateForValue(date);
    const endStr = formatDateForValue(end);
    onChange(
      date <= end
        ? `${DATE_FILTER_PREFIX_CUSTOM}${startStr}|${endStr}`
        : `${DATE_FILTER_PREFIX_CUSTOM}${endStr}|${startStr}`
    );
  };

  const handleCustomEndChange = (date: Date | null | undefined) => {
    if (!date) return;
    setCustomEnd(date);
    const start = customStart ?? date;
    const startStr = formatDateForValue(start);
    const endStr = formatDateForValue(date);
    onChange(
      start <= date
        ? `${DATE_FILTER_PREFIX_CUSTOM}${startStr}|${endStr}`
        : `${DATE_FILTER_PREFIX_CUSTOM}${endStr}|${startStr}`
    );
  };

  const detailsAnchorRef = React.useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    if (mode === DATE_FILTER_CUSTOM) setDetailsOpen(true);
    else setDetailsOpen(false);
  }, [mode]);

  return (
    <div key={fieldKey} className="kanban-date-filter">
      <div ref={detailsAnchorRef} className="kanban-date-filter-dropdown-wrap">
        <Dropdown
          className="kanban-dropdown"
          styles={styles}
          label={displayLabel}
          placeholder={strings.dateFilterAll}
          options={dateFilterOptions}
          selectedKey={selectedOption.key}
          onChange={handleDropdownChange}
        />
      </div>
      {mode === DATE_FILTER_CUSTOM && detailsOpen && detailsAnchorRef.current && (
        <Callout
          target={detailsAnchorRef.current}
          onDismiss={() => setDetailsOpen(false)}
          directionalHint={4}
          gapSpace={2}
          className="kanban-date-filter-callout"
          setInitialFocus
        >
          <div className="kanban-date-filter-range kanban-date-filter-callout-content">
            <DatePicker
              label={strings.dateFilterFrom}
              value={customStart}
              onSelectDate={handleCustomStartChange}
              formatDate={(d) => (d ? formatDateForValue(d) : "")}
              parseDateFromString={(s) => {
                const d = new Date(s + "T00:00:00");
                return isNaN(d.getTime()) ? null : d;
              }}
              allowTextInput
              ariaLabel={strings.dateFilterStartAria}
            />
            <DatePicker
              label={strings.dateFilterTo}
              value={customEnd}
              onSelectDate={handleCustomEndChange}
              formatDate={(d) => (d ? formatDateForValue(d) : "")}
              parseDateFromString={(s) => {
                const d = new Date(s + "T00:00:00");
                return isNaN(d.getTime()) ? null : d;
              }}
              allowTextInput
              ariaLabel={strings.dateFilterEndAria}
            />
          </div>
        </Callout>
      )}
    </div>
  );
};

export default DateFilter;
