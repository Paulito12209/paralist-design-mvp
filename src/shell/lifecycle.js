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

import { pauseNoHistoryForm, resumeNoHistoryForm } from "../core/no-history.js";
import { flushSave } from "../data/state.js";
import { flushUsage, resetUsageTick, trackUsage } from "../data/usage.js";

const usageTickSeconds = 15;

/**
 * Speichern und Zeitzählung an den Lebenszyklus der Seite hängen.
 * @param hooks.onShow läuft, wenn die App wieder sichtbar wird — z.B. um nach
 *                     einer neuen Fassung zu sehen. Kommt aus src/main.js.
 */
export function initLifecycle({ onShow = () => {} } = {}) {
  setInterval(trackUsage, usageTickSeconds * 1000);

  document.addEventListener("visibilitychange", () => {
    /* Beim Verstecken alles sichern: danach kann die Seite jederzeit beendet werden. */
    trackUsage();
    flushUsage();
    flushSave();
    resetUsageTick();
    if (!document.hidden) onShow();
  });

  window.addEventListener("pagehide", () => {
    trackUsage();
    flushUsage();
    flushSave();
    /* Muss hier im pagehide stehen: der Browser legt die Seite erst danach weg
       und merkt sich dabei, welche Formulare er beim Zurückkommen leert
       (Erklärung in src/core/no-history.js). */
    pauseNoHistoryForm();
  });

  /* Läuft beim ersten Laden und nach jedem Zurückkommen aus dem Zurück-Speicher. */
  window.addEventListener("pageshow", resumeNoHistoryForm);
}
