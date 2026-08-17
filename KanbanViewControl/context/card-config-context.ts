import * as React from "react";

/** Highlight-Position auf der Karte: linker/rechter Rand oder diagonale Ecke. */
export type HighlightType =
  | "left"
  | "right"
  | "cornerTopRight"
  | "cornerBottomRight"
  | "cornerTopLeft"
  | "cornerBottomLeft";

export interface BooleanFieldHighlightConfig {
  logicalName: string;
  color: string;
  /** Highlight-Typ: linker/rechter Rand oder diagonale Ecke. Default "left". Erster Treffer pro Typ gewinnt. */
  type?: HighlightType;
}

export interface FieldWidthConfig {
  logicalName: string;
  width: number;
}

/**
 * Gebündelte, einmal geparste Karten-Konfiguration (aus den Komponenten-Properties).
 * Wird zentral in App.tsx via useCardConfig() erzeugt und über den Context an alle
 * Karten verteilt, damit die JSON-Parsings nicht pro Karte wiederholt werden.
 */
export interface CardConfig {
  hideColumnFieldOnCard: boolean;
  hiddenFieldsOnCardSet: Set<string>;
  fieldsVisiblePerStageMap: Map<string, string[]>;
  htmlFieldsOnCardSet: Set<string>;
  hideLabelForFieldsOnCardSet: Set<string>;
  booleanFieldHighlights: BooleanFieldHighlightConfig[];
  fieldWidthsOnCardMap: Map<string, number>;
  lookupFieldsAsPersonaOnCardSet: Set<string>;
  lookupFieldsPersonaIconOnlyOnCardSet: Set<string>;
  showEmailAndPhoneAsLinks: boolean;
  ellipsisFieldsOnCardSet: Set<string>;
  lineBreakFieldsOnCardSet: Set<string>;
  fieldMaxHeightOnCardMap: Map<string, number>;
  fieldDisplayNamesOnCardMap: Map<string, string>;
}

/** Leere Default-Konfiguration (keine Sonderbehandlung für Felder). */
export const emptyCardConfig: CardConfig = {
  hideColumnFieldOnCard: false,
  hiddenFieldsOnCardSet: new Set(),
  fieldsVisiblePerStageMap: new Map(),
  htmlFieldsOnCardSet: new Set(),
  hideLabelForFieldsOnCardSet: new Set(),
  booleanFieldHighlights: [],
  fieldWidthsOnCardMap: new Map(),
  lookupFieldsAsPersonaOnCardSet: new Set(),
  lookupFieldsPersonaIconOnlyOnCardSet: new Set(),
  showEmailAndPhoneAsLinks: false,
  ellipsisFieldsOnCardSet: new Set(),
  lineBreakFieldsOnCardSet: new Set(),
  fieldMaxHeightOnCardMap: new Map(),
  fieldDisplayNamesOnCardMap: new Map(),
};

export const CardConfigContext = React.createContext<CardConfig>(emptyCardConfig);
