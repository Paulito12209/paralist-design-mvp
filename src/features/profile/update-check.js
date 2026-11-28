/*
 * „Nach Updates suchen“ im Einstellungs-Blatt: bittet die Hülle, nach einer
 * neueren Fassung zu sehen, und zeigt rechts in der Zeile, was sie meldet.
 * Pfad: src/features/profile/update-check.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * updateStatus -> die Wörter, die rechts in der Zeile erscheinen
 *                 (gesucht, geladen, aktuell, kein Netz)
 */

import { emit, events } from "../../core/bus.js";

const updateStatus = {
  checking: "Wird gesucht …",
  loading: "Wird geladen …",
  current: "Aktuell",
  offline: "Kein Netz",
};

/* Die Hülle (src/shell/update-prompt.js) sieht nach und lädt eine neuere
   Fassung sofort; hier steht nur, was sie zurückmeldet. */
export function checkForUpdateNow(row) {
  if (row.dataset.busy === "1") return;
  const status = row.querySelector(".plist-status");
  const show = (key) => {
    status.textContent = updateStatus[key] || "";
    row.dataset.busy = key === "checking" || key === "loading" ? "1" : "";
  };
  show("checking");
  emit(events.updateRequested, { report: show });
}
