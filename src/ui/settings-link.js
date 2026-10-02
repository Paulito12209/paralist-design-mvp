/*
 * Springt aus einer Seite direkt in die Einstellungen › Tabs — z.B. aus dem
 * Hinweis, warum sich „Alle“ nicht filtern lässt. Lädt das Profil erst bei
 * Bedarf (src/core/lazy.js). Am Desktop geht die Seite mit dem Punkt „Tabs“
 * im Untermenü auf, am Handy als Unterseite „Tabs“ der Einstellungen.
 * Pfad: src/ui/settings-link.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { load } from "../core/lazy.js";
import { isDesk } from "./desk-mode.js";

/** Die Einstellungen auf der Unterseite „Tabs“ öffnen. */
export function openTabSettings() {
  load("profile").then((module) => {
    if (isDesk()) module.openPane("tabs");
    else module.open(true, { detail: "tabs" });
  });
}
