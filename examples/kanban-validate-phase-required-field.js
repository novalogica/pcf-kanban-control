/**
 * Example web resource for Kanban phase-change validation:
 * When moving from Phase 2 to Phase 3, the "estimatedvalue" (revenue) field must have a value.
 *
 * Usage:
 * 1. Upload this file to Dataverse as a web resource (for example, kanban_validate_phase).
 * 2. Add the web resource to the form or page that contains the Kanban control.
 * 3. Set the Kanban control's "Card move validation function" property to:
 *    MyNamespace.Kanban.onBeforeMove
 *
 * Customize the column names: Replace "Phase 2" and "Phase 3" with the exact display names
 * of your phase columns, as shown in the View By dropdown.
 */

var MyNamespace = MyNamespace || {};

MyNamespace.Kanban = (function () {
  // Customize for your view: exact column display names (View By / phases)
  var SOURCE_PHASE_TITLE = "Phase 2";   // Validation starts from this phase
  var TARGET_PHASE_TITLE = "Phase 3";   // estimatedvalue is required to move here

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
    // Prefer the raw numeric value when it is loaded in the dataset
    if (REQUIRED_FIELD_RAW in card && !isEmpty(card[REQUIRED_FIELD_RAW])) {
      return card[REQUIRED_FIELD_RAW];
    }
    // Otherwise, use the formatted display value (for example, { label: "...", value: "$12,345" })
    var field = card[REQUIRED_FIELD];
    if (field && typeof field === "object" && "value" in field) {
      var v = field.value;
      if (!isEmpty(v)) return v;
    }
    return null;
  }

  /**
   * Called by the Kanban control before changing columns.
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
        message: "Enter a revenue value (estimatedvalue) before moving to Phase 3."
      };
    }

    return true;
  }

  return {
    onBeforeMove: onBeforeMove
  };
})();
