/**
 * Zentrale Versions-/Build-Information für das KanbanViewControl.
 *
 * WICHTIG bei jeder Änderung, die deployed werden soll:
 *  1. BUILD_NUMBER um 1 erhöhen (monoton steigend, dient der Validierung in der Browser-Konsole).
 *  2. BUILD_DESCRIPTION auf den zuletzt umgesetzten Schritt setzen.
 *  3. Die <control version="..."> in ControlManifest.Input.xml angleichen (Cache-Busting in Dataverse).
 *
 * Beim Laden des Controls wird die Zeile einmal in die Konsole geloggt, z. B.:
 *   🗂️ KanbanViewControl v1.7.2 (build 1) — Build-/Versions-Logging eingeführt
 */

/** Semantische Version – muss mit ControlManifest.Input.xml übereinstimmen. */
export const CONTROL_VERSION = "1.7.27";

/** Monoton steigende Build-Nummer. Bei jedem umgesetzten Schritt um 1 erhöhen. */
export const BUILD_NUMBER = 26;

/** Kurzbeschreibung des zuletzt umgesetzten Schritts (erscheint im Konsolen-Log). */
export const BUILD_DESCRIPTION = "Filter: Storage-Key je Entity+View + Standardfilter-Preset (default:true)";

/** Formatierte Build-Kennung, z. B. "v1.7.2 (build 1)". */
export const BUILD_LABEL = `v${CONTROL_VERSION} (build ${BUILD_NUMBER})`;

let alreadyLogged = false;

/**
 * Loggt die aktuelle Build-Information genau einmal pro Seitenaufruf in die Browser-Konsole.
 * Mehrfachaufrufe (z. B. bei jedem updateView) werden ignoriert.
 */
export function logBuildInfo(): void {
  if (alreadyLogged) return;
  alreadyLogged = true;
  // eslint-disable-next-line no-console
  console.info(
    `%c🗂️ KanbanViewControl ${BUILD_LABEL}%c — ${BUILD_DESCRIPTION}`,
    "font-weight:bold;color:#0b6a0b",
    "color:inherit"
  );
}
