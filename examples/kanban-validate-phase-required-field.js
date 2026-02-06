/**
 * Beispiel-Webressource für die Kanban-Validierung "Phasenwechsel":
 * Beim Verschieben von Phase 2 nach Phase 3 muss das Feld "estimatedvalue" (Umsatz) gepflegt sein.
 *
 * Verwendung:
 * 1. Diese Datei als Webressource in Dataverse hochladen (z. B. Name: kanban_validate_phase).
 * 2. Die Webressource auf der Form/Seite einbinden, auf der das Kanban-Control liegt.
 * 3. Beim Kanban-Control die Eigenschaft "Card move validation function" setzen auf:
 *    MyNamespace.Kanban.onBeforeMove
 *
 * Spaltennamen anpassen: Ersetzen Sie "Phase 2" und "Phase 3" durch die exakten Anzeigenamen
 * Ihrer Phasen-Spalten (so wie im View-By-Dropdown angezeigt).
 */

var MyNamespace = MyNamespace || {};

MyNamespace.Kanban = (function () {
  // Anpassen an Ihre View: exakte Anzeigenamen der Spalten (View By / Phasen)
  var SOURCE_PHASE_TITLE = "Phase 2";   // Von dieser Phase aus wird geprüft
  var TARGET_PHASE_TITLE = "Phase 3";   // In diese Phase darf nur mit gepflegtem estimatedvalue

  var REQUIRED_FIELD = "estimatedvalue";
  var REQUIRED_FIELD_RAW = "estimatedvalueRaw";

  function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === "number") return Number.isNaN(value);
    if (typeof value === "string") return value.trim() === "";
    return false;
  }

  function isMovingFromPhase2ToPhase3(args) {
    var src = args.sourceColumnTitle;
    var dst = args.destinationColumnTitle;
    return src === SOURCE_PHASE_TITLE && dst === TARGET_PHASE_TITLE;
  }

  function getEstimatedValue(card) {
    if (!card) return null;
    // Rohwert (Zahl) hat Priorität, falls im Dataset geladen
    if (REQUIRED_FIELD_RAW in card && !isEmpty(card[REQUIRED_FIELD_RAW])) {
      return card[REQUIRED_FIELD_RAW];
    }
    // Ansonsten Anzeigewert (z. B. { label: "...", value: "12.345 €" })
    var field = card[REQUIRED_FIELD];
    if (field && typeof field === "object" && "value" in field) {
      var v = field.value;
      if (!isEmpty(v)) return v;
    }
    return null;
  }

  /**
   * Von der Kanban-Control aufgerufen vor dem Spaltenwechsel.
   * @param {object} args - { recordId, entityName, sourceColumnTitle, destinationColumnTitle, card, ... }
   * @returns {boolean|{allow: boolean, message?: string}}
   */
  function onBeforeMove(args) {
    if (!isMovingFromPhase2ToPhase3(args)) {
      return true;
    }

    var estimated = getEstimatedValue(args.card);
    if (isEmpty(estimated)) {
      return {
        allow: false,
        message: "Bitte erfassen Sie zuerst den Umsatz (estimatedvalue), bevor Sie in Phase 3 wechseln."
      };
    }

    return true;
  }

  return {
    onBeforeMove: onBeforeMove
  };
})();
