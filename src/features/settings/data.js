/*
 * Einstellungen, Abschnitt „Daten“: alle Einträge auf einmal löschen.
 * Arbeitsbereiche, Tabs und das Profil (Name, E-Mail, Bild) bleiben stehen —
 * nur was in Inbox, Favoriten, Projekten, Ressourcen und Arbeitsbereichen liegt.
 * Pfad: src/features/settings/data.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { deleteAllEntries } from "../../data/mutations.js";
import { openSheet } from "../../ui/sheet.js";

/** Die eine Zeile des Abschnitts zeichnen. */
export function renderDataOptions() {
  dom.dataOptions.innerHTML = `
    <button class="settings-row" type="button" data-clear-entries="1">
      ${icon("trash")}
      <span>Alle Einträge löschen</span>
    </button>
  `;
}

/* Das Blatt selbst ist die Bestätigung: erst mit dem zweiten Antippen löscht es wirklich. */
function confirmDeleteAllEntries() {
  openSheet("Alle Einträge löschen?", [
    {
      label: "Alle Einträge endgültig löschen",
      icon: "trash",
      danger: true,
      onSelect: deleteAllEntries,
    },
  ]);
}

/** Den Abschnitt „Daten“ anmelden. */
export function initDataSettings() {
  renderDataOptions();
  dom.dataOptions.addEventListener("click", (event) => {
    if (event.target.closest("[data-clear-entries]")) confirmDeleteAllEntries();
  });
}
