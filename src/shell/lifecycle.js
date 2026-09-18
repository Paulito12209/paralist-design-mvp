/*
 * Die Ereignisse der Seite selbst: in den Hintergrund gehen, geschlossen
 * werden. Sie stehen hier gesammelt, damit die Datenschicht keine Zuhörer auf
 * dem Dokument anmelden muss.
 * Pfad: src/shell/lifecycle.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * usageTickSeconds -> wie oft die Nutzungszeit fortgeschrieben wird (Sekunden)
 */

import { flushSave } from "../data/state.js";
import { flushUsage, resetUsageTick, trackUsage } from "../data/usage.js";

const usageTickSeconds = 15;

/** Speichern und Zeitzählung an den Lebenszyklus der Seite hängen. */
export function initLifecycle() {
  setInterval(trackUsage, usageTickSeconds * 1000);

  document.addEventListener("visibilitychange", () => {
    /* Beim Verstecken alles sichern: danach kann die Seite jederzeit beendet werden. */
    trackUsage();
    flushUsage();
    flushSave();
    resetUsageTick();
  });

  window.addEventListener("pagehide", () => {
    trackUsage();
    flushUsage();
    flushSave();
  });
}
