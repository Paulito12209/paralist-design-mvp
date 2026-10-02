/*
 * Die beiden Löschen-Seiten, je eine Ebene tiefer, damit niemand sie beim
 * Herunterrollen aus Versehen antippt:
 * - Phase 1 (ohne Konto): „Alle Daten löschen“ — nur auf diesem Gerät.
 * - Phase 2 (mit Cloud): „Konto löschen“ — Konto und Cloud-Daten auf allen
 *   Geräten. Google Play verlangt diesen Weg in der App, sobald man darin ein
 *   Konto anlegen kann.
 * Beide bieten vorher „Daten exportieren“ an. Im MVP lösen die Knöpfe nichts aus.
 * Pfad: src/features/profile/account-delete.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * deletePages[*].intro   -> der Satz über der Liste
 * deletePages[*].items   -> was alles gelöscht wird
 * deletePages[*].note    -> der graue Satz unter der Liste
 * deletePages[*].confirm -> Text des roten Knopfs
 *
 * Aussehen in styles/account.css.
 */

import { escapeHtml } from "../../core/html.js";

const deletePages = {
  data: {
    intro: "Folgendes wird von diesem Gerät gelöscht:",
    items: ["Alle Einträge, Aufgaben und Notizen", "Alle Arbeitsbereiche und Tabs", "Alle Fotos, Dateien und Zeichnungen"],
    note: "Andere Geräte und dein Plan bei Google Play sind nicht betroffen. Das lässt sich nicht rückgängig machen.",
    confirm: "Alle Daten löschen",
  },
  account: {
    intro: "Folgendes wird endgültig gelöscht:",
    items: [
      "Dein Konto und deine Anmeldedaten",
      "Alle Einträge, Arbeitsbereiche und Dateien in der Cloud",
      "Die Daten auf allen angemeldeten Geräten",
    ],
    note: "Ein laufendes Abo kündigst du separat in Google Play. Das lässt sich nicht rückgängig machen.",
    confirm: "Konto endgültig löschen",
  },
};

/* Gerüst beider Seiten: Liste, Hinweis, Export und der rote Knopf. */
function deleteMarkup(page) {
  const items = page.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `
    <section class="account-delete">
      <p class="account-delete-intro">${escapeHtml(page.intro)}</p>
      <ul class="account-delete-list">${items}</ul>
    </section>
    <p class="settings-note">${escapeHtml(page.note)}</p>
    <button class="account-button" type="button">Vorher Daten exportieren</button>
    <button class="account-button is-danger" type="button">${escapeHtml(page.confirm)}</button>`;
}

/** Phase 1: „Alle Daten löschen“. */
export function deleteDataCard() {
  return deleteMarkup(deletePages.data);
}

/** Phase 2: „Konto löschen“. */
export function deleteAccountCard() {
  return deleteMarkup(deletePages.account);
}
