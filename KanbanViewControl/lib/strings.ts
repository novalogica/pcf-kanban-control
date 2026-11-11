/**
 * Localized UI strings for the Kanban control.
 * The control uses the app language (context.userSettings.languageId) to pick the locale.
 */

export interface Strings {
  // Date filter
  dateFilterAll: string;
  dateFilterToday: string;
  dateFilterLast7: string;
  dateFilterLast30: string;
  dateFilterCurrentMonth: string;
  dateFilterCurrentYear: string;
  dateFilterCurrentWeek: string;
  dateFilterNextWeek: string;
  dateFilterNextMonth: string;
  dateFilterCustomRange: string;
  dateFilterFrom: string;
  dateFilterTo: string;
  dateFilterStartAria: string;
  dateFilterEndAria: string;

  // Number filter
  numberFilterAll: string;
  numberFilterGreaterThan: string;
  numberFilterLessThan: string;
  numberFilterGreaterOrEqual: string;
  numberFilterLessOrEqual: string;
  numberFilterBetween: string;
  numberFilterValuePlaceholder: string;
  numberFilterValueAriaLabel: string;
  numberFilterMinPlaceholder: string;
  numberFilterMinAriaLabel: string;
  numberFilterMaxPlaceholder: string;
  numberFilterMaxAriaLabel: string;

  // Quick filters & sort
  quickFilterAll: string;
  quickFilterEmpty: string;
  quickFiltersMoreFilters: string;
  quickFiltersMoreFiltersOpen: string;
  quickFiltersSearchPlaceholder: string;
  quickFiltersSearchAriaLabel: string;
  quickFiltersAriaLabel: string;
  sortByLabel: string;
  sortNone: string;
  sortAscending: string;
  sortDescending: string;
  filterPresetLabel: string;
  filterPresetNone: string;

  // Drag & drop toasts
  toastSaving: string;
  toastSuccessMoved: (columnName: string) => string;
  toastUnallocated: string;
  toastValidationFunctionNotFound: string;

  // Loading
  loadingLabel: string;
  openingRecordLabel: string;

  // Empty states
  noRecordsFound: string;
  noRecordsForFilters: string;
  noResultsInColumn: string;

  // Filter reset
  resetFilters: string;

  // Configuration errors banner
  configErrorsTitle: string;
  configErrorsHint: string;
  configErrorsDismiss: string;

  // Card action buttons (aria-label / title)
  cardActionCreateActivity: string;
  cardActionOpenSharePoint: string;
  cardActionOpenInNewTab: string;

  // Card field links (aria-label)
  cardAriaEmail: (value: string) => string;
  cardAriaPhone: (value: string) => string;
}

const en: Strings = {
  dateFilterAll: "(All)",
  dateFilterToday: "Today",
  dateFilterLast7: "Last 7 days",
  dateFilterLast30: "Last 30 days",
  dateFilterCurrentMonth: "Current month",
  dateFilterCurrentYear: "Current year",
  dateFilterCurrentWeek: "Current calendar week",
  dateFilterNextWeek: "Next calendar week",
  dateFilterNextMonth: "Next month",
  dateFilterCustomRange: "Custom range",
  dateFilterFrom: "From",
  dateFilterTo: "To",
  dateFilterStartAria: "Select start date",
  dateFilterEndAria: "Select end date",

  numberFilterAll: "(All)",
  numberFilterGreaterThan: "Greater than",
  numberFilterLessThan: "Less than",
  numberFilterGreaterOrEqual: "Greater or equal",
  numberFilterLessOrEqual: "Less or equal",
  numberFilterBetween: "Between",
  numberFilterValuePlaceholder: "Value",
  numberFilterValueAriaLabel: "Numeric value",
  numberFilterMinPlaceholder: "Min",
  numberFilterMinAriaLabel: "Minimum value",
  numberFilterMaxPlaceholder: "Max",
  numberFilterMaxAriaLabel: "Maximum value",

  quickFilterAll: "(All)",
  quickFilterEmpty: "(Empty)",
  quickFiltersMoreFilters: "More filters",
  quickFiltersMoreFiltersOpen: "Open more filters",
  quickFiltersSearchPlaceholder: "Search in all fields…",
  quickFiltersSearchAriaLabel: "Search in all card fields",
  quickFiltersAriaLabel: "Quick filters and search",
  sortByLabel: "Sort by",
  sortNone: "(None)",
  sortAscending: "Ascending",
  sortDescending: "Descending",
  filterPresetLabel: "Filter preset",
  filterPresetNone: "(No preset)",

  toastSaving: "Saving...",
  toastSuccessMoved: (columnName) => `Successfully moved to ${columnName} 🎉`,
  toastUnallocated: "Unallocated",
  toastValidationFunctionNotFound: "Card move validation function is not available. Check that the web resource is loaded and the function path is correct.",

  loadingLabel: "Loading...",
  openingRecordLabel: "Opening record...",

  noRecordsFound: "No records found",
  noRecordsForFilters: "No matches for the current filters",
  noResultsInColumn: "No results found",

  resetFilters: "Reset filters",

  configErrorsTitle: "Configuration errors:",
  configErrorsHint: "The control configuration is invalid. Please ask an administrator to review the affected properties.",
  configErrorsDismiss: "Dismiss",

  cardActionCreateActivity: "Create activity",
  cardActionOpenSharePoint: "Open SharePoint folder",
  cardActionOpenInNewTab: "Open in new tab",

  cardAriaEmail: (value) => `Email: ${value}`,
  cardAriaPhone: (value) => `Call: ${value}`,
};

const de: Strings = {
  dateFilterAll: "(Alle)",
  dateFilterToday: "Heute",
  dateFilterLast7: "Letzte 7 Tage",
  dateFilterLast30: "Letzte 30 Tage",
  dateFilterCurrentMonth: "Aktueller Monat",
  dateFilterCurrentYear: "Aktuelles Jahr",
  dateFilterCurrentWeek: "Aktuelle Kalenderwoche",
  dateFilterNextWeek: "Nächste Kalenderwoche",
  dateFilterNextMonth: "Nächster Monat",
  dateFilterCustomRange: "Benutzerdefinierter Bereich",
  dateFilterFrom: "Von",
  dateFilterTo: "Bis",
  dateFilterStartAria: "Startdatum auswählen",
  dateFilterEndAria: "Enddatum auswählen",

  numberFilterAll: "(Alle)",
  numberFilterGreaterThan: "Größer als",
  numberFilterLessThan: "Kleiner als",
  numberFilterGreaterOrEqual: "Größer oder gleich",
  numberFilterLessOrEqual: "Kleiner oder gleich",
  numberFilterBetween: "Zwischen",
  numberFilterValuePlaceholder: "Wert",
  numberFilterValueAriaLabel: "Zahlenwert",
  numberFilterMinPlaceholder: "Min",
  numberFilterMinAriaLabel: "Mindestwert",
  numberFilterMaxPlaceholder: "Max",
  numberFilterMaxAriaLabel: "Höchstwert",

  quickFilterAll: "(Alle)",
  quickFilterEmpty: "(Leer)",
  quickFiltersMoreFilters: "Weitere Filter",
  quickFiltersMoreFiltersOpen: "Weitere Filter öffnen",
  quickFiltersSearchPlaceholder: "In allen Feldern suchen…",
  quickFiltersSearchAriaLabel: "Suche in allen Kartenfeldern",
  quickFiltersAriaLabel: "Schnellfilter und Suche",
  sortByLabel: "Sortieren nach",
  sortNone: "(Keine)",
  sortAscending: "Aufsteigend",
  sortDescending: "Absteigend",
  filterPresetLabel: "Filter-Preset",
  filterPresetNone: "(Kein Preset)",

  toastSaving: "Speichern...",
  toastSuccessMoved: (columnName) => `Erfolgreich verschoben nach ${columnName} 🎉`,
  toastUnallocated: "Nicht zugeordnet",
  toastValidationFunctionNotFound: "Die Validierungsfunktion für Kartenverschiebungen ist nicht verfügbar. Prüfen Sie, ob die Webressource geladen ist und der Funktionspfad stimmt.",

  loadingLabel: "Laden...",
  openingRecordLabel: "Datensatz wird geöffnet...",

  noRecordsFound: "Keine Datensätze gefunden",
  noRecordsForFilters: "Keine Treffer für die aktuellen Filter",
  noResultsInColumn: "Keine Treffer",

  resetFilters: "Filter zurücksetzen",

  configErrorsTitle: "Konfigurationsfehler:",
  configErrorsHint: "Die Konfiguration des Steuerelements ist ungültig. Bitte lassen Sie die betroffenen Eigenschaften von einem Administrator prüfen.",
  configErrorsDismiss: "Ausblenden",

  cardActionCreateActivity: "Aktivität anlegen",
  cardActionOpenSharePoint: "SharePoint-Ordner öffnen",
  cardActionOpenInNewTab: "In neuem Tab öffnen",

  cardAriaEmail: (value) => `E-Mail: ${value}`,
  cardAriaPhone: (value) => `Anrufen: ${value}`,
};

const stringsByLocale: Record<string, Strings> = {
  en,
  "en-US": en,
  "en-GB": en,
  de,
  "de-DE": de,
};

/**
 * Maps Power Apps / Dataverse languageId (LCID) to a locale string for getStrings.
 * Common LCIDs: 1033 = en-US, 1031 = de-DE, 1034 = es-ES, 1036 = fr-FR, 1040 = it-IT.
 */
const LCID_TO_LOCALE: Record<number, string> = {
  1025: "ar",
  1026: "bg",
  1027: "ca",
  1028: "zh-TW",
  1029: "cs",
  1030: "da",
  1031: "de",
  1032: "el",
  1033: "en",
  1034: "es",
  1035: "fi",
  1036: "fr",
  1037: "he",
  1038: "hu",
  1039: "is",
  1040: "it",
  1041: "ja",
  1042: "ko",
  1043: "nl",
  1044: "nb",
  1045: "pl",
  1046: "pt",
  1048: "ro",
  1049: "ru",
  1050: "hr",
  1051: "sk",
  1052: "sq",
  1053: "sv",
  1054: "th",
  1055: "tr",
  2052: "zh-CN",
};

/**
 * Returns the locale string (e.g. "en", "de") for a given languageId (LCID).
 * Unknown IDs fall back to "en".
 */
export function getLocaleFromLanguageId(languageId: number | undefined): string {
  if (languageId == null) return "en";
  const locale = LCID_TO_LOCALE[languageId];
  if (locale) return locale;
  // Fallback: try first two digits (e.g. 1033 -> 10 -> not in map; use "en")
  return "en";
}

/**
 * Returns localized strings for the given locale.
 * Unknown locales fall back to English.
 */
export function getStrings(locale: string): Strings {
  const normalized = locale?.split("-")[0]?.toLowerCase() ?? "en";
  return stringsByLocale[locale] ?? stringsByLocale[normalized] ?? en;
}
