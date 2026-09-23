/*
 * Das Blatt „Details“: oben der volle, ungekürzte Titel, darunter die Angaben
 * (Typ, Speicherort, …) — wie „Dateiinformationen“ in Google Drive.
 * Pfad: src/ui/details.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen steht in styles/details.css.
 */

import { openSheet } from "./sheet.js";

/**
 * @param title der volle Titel, wird nicht gekürzt
 * @param rows  Liste von { label, value } aus src/data/details.js
 */
export function openDetails(title, rows) {
  openSheet("Details", [
    { lead: true, label: title },
    ...rows.map((row) => ({ detail: true, label: row.label, value: row.value })),
  ]);
}
