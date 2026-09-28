/*
 * Die Unterseite „Kontoeinstellungen“ hinter „Konto → Kontoeinstellungen“ im
 * Einstellungs-Blatt. Oben die Angaben zum Konto, ganz unten und für sich
 * allein „Konto löschen“ — eine Ebene tiefer, damit man es nicht beim
 * Herunterrollen der Einstellungen aus Versehen antippt.
 * Pfad: src/features/profile/account.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * dangerNote -> der Satz unter „Konto löschen“, der sagt, was dabei verloren geht
 *
 * Name, Mailadresse und Plan kommen aus `profile` in profile-cards.js.
 * Aussehen der Zeilen und des Hinweises: styles/profile.css.
 */

import { escapeHtml } from "../../core/html.js";
import { accountInfo, sectionMarkup } from "./profile-cards.js";

const dangerNote =
  "Dein Konto und alle Einträge, Arbeitsbereiche und Dateien werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.";

/** Die ganze Seite. Im MVP zeigen die Zeilen nur den Aufbau. */
export function accountCard() {
  const info = accountInfo();
  const details = sectionMarkup("Angaben", [
    { icon: "person", label: "Name", value: info.name },
    { icon: "globe", label: "E-Mail", value: info.mail },
    { icon: "arrow-up-circle", label: "Plan", value: info.plan },
  ]);
  const security = sectionMarkup("Sicherheit", [{ icon: "settings", label: "Passwort ändern", trail: "chevron" }]);
  const danger = sectionMarkup("Gefahrenzone", [{ icon: "trash", label: "Konto löschen", danger: true }]);
  return `${details}${security}${danger}<p class="account-note">${escapeHtml(dangerNote)}</p>`;
}
