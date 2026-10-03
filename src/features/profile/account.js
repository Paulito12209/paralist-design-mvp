/*
 * Die Konto-Unterseiten aus Phase 2 (mit Cloud-Sync), je eine Ebene unter
 * Einstellungen › Konto: „Passwort ändern“ und „Synchronisierung“, dazu der
 * Kopier-Knopf. „Persönliche Daten“ steht in account-personal.js, die
 * Löschen-Seiten in account-delete.js, welche Stufe gilt, in account-phase.js.
 * Pfad: src/features/profile/account.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * COPIED_MS     -> wie lange nach dem Kopieren der Haken statt des Kopier-Symbols steht
 * passwordNote  -> der graue Satz unter den Passwort-Feldern
 * syncNote      -> der graue Satz unter den Geräten
 *
 * Die Geräte stehen in src/data/account.js, Name, Mail, Telefon und Links in src/data/profile.js.
 * Aussehen der Kopier-Zeilen und Felder: styles/account.css.
 */

import { copyText } from "../../core/clipboard.js";
import { escapeHtml, icon } from "../../core/html.js";
import { account } from "../../data/account.js";
import { onPersonalClick } from "./account-personal.js";
import { sectionMarkup } from "./profile-cards.js";

export { personalCard } from "./account-personal.js";

/* Lang genug, um den Haken zu sehen; danach ist der Knopf wieder bereit. */
const COPIED_MS = 1500;
const passwordNote = "Mindestens 8 Zeichen. Nach dem Ändern bleibst du nur auf diesem Gerät angemeldet.";
const syncNote = "Einträge, Arbeitsbereiche und Dateien gleichen sich auf allen Geräten ab, sobald sie online sind.";

/* Ein Passwort-Feld mit Beschriftung darüber. */
function passwordField(label, autocomplete) {
  return `
    <label class="account-field">
      <span class="account-field-label">${label}</span>
      <input class="account-input" type="password" autocomplete="${autocomplete}" />
    </label>`;
}

/** Seite „Passwort ändern“: drei Felder und der Knopf. Im MVP ohne Wirkung. */
export function passwordCard() {
  return `
    <section class="account-form">
      ${passwordField("Aktuelles Passwort", "current-password")}
      ${passwordField("Neues Passwort", "new-password")}
      ${passwordField("Neues Passwort wiederholen", "new-password")}
    </section>
    <p class="settings-note">${escapeHtml(passwordNote)}</p>
    <button class="account-button" type="button">Passwort ändern</button>`;
}

/** Seite „Synchronisierung“: Stand des Cloud-Sync und die angemeldeten Geräte. */
export function syncCard() {
  const status = sectionMarkup("Status", [
    { icon: "swap-vert", label: "Cloud-Sync", value: "An" },
    { icon: "history", label: "Zuletzt abgeglichen", value: account.devices[0]?.synced || "" },
  ]);
  const devices = sectionMarkup(
    "Geräte",
    account.devices.map((device) => ({ icon: device.icon, label: device.name, value: device.synced }))
  );
  return `${status}${devices}<p class="settings-note">${escapeHtml(syncNote)}</p>`;
}

/** Klick auf einen Kopier-Knopf. Gibt true zurück, wenn er hierher gehörte. */
export function onAccountClick(event) {
  if (onPersonalClick(event)) return true;
  const button = event.target.closest("[data-account-copy]");
  if (!button) return false;
  /* Rückmeldung direkt am Knopf: eine Meldung unten läge hinter dem Blatt.
     Natives Android ab Version 13 meldet das Kopieren zusätzlich selbst —
     dort keine eigene Snackbar, sonst stünde der Hinweis doppelt da. */
  copyText(button.dataset.accountCopy).then((done) => {
    if (!done) return;
    button.innerHTML = icon("check");
    button.classList.add("is-done");
    setTimeout(() => {
      button.innerHTML = icon("copy");
      button.classList.remove("is-done");
    }, COPIED_MS);
  });
  return true;
}
