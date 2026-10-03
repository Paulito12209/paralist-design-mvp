/*
 * Die Seite „Persönliche Daten“: Name, E-Mail, Telefon und Links. Ein Tipp auf
 * eine Zeile macht den Wert zum Eingabefeld; Enter oder Wegtippen speichert,
 * Esc bricht ab. Das Kopier-Symbol rechts erscheint erst, wenn etwas drinsteht.
 * Pfad: src/features/profile/account-personal.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyValue -> was in einer leeren Zeile steht
 * fieldKinds -> je Feld Icon, Beschriftung und Tastatur (type, inputmode)
 *
 * Name, Mail, Telefon und Links werden in src/data/profile.js gespeichert.
 * Aussehen der Zeilen und Felder: styles/account.css.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { noHistoryForm } from "../../core/no-history.js";
import {
  addLink,
  defaultName,
  profileFields,
  setLinkUrl,
  setProfileField,
  setSince,
  shownName,
  sinceMonth,
} from "../../data/profile.js";
import { openDayPicker } from "../../ui/date-field.js";
import { metaLine } from "./profile-cards.js";

const emptyValue = "Hinzufügen";

/* Kein eigenes autocomplete an den Feldern: sie hängen am Formular „no-history“ (src/core/no-history.js). */
const fieldKinds = {
  name: { icon: "person", label: "Name", type: "text", inputmode: "text" },
  mail: { icon: "globe", label: "E-Mail", type: "email", inputmode: "email" },
  phone: { icon: "smartphone", label: "Telefon", type: "tel", inputmode: "tel" },
  link: { icon: "chain", type: "url", inputmode: "url" },
};

/* Eine Zeile als Daten: Schlüssel „name“, „mail“, „phone“ oder „link:3“. */
function rowSpec(key) {
  const data = profileFields();
  if (key.startsWith("link:")) {
    const link = data.links[Number(key.slice(5))];
    if (!link) return null;
    return { key, ...fieldKinds.link, label: link.label, stored: link.url, shown: link.url, placeholder: emptyValue };
  }
  const kind = fieldKinds[key];
  const shown = key === "name" ? shownName() : data[key];
  return { key, ...kind, stored: data[key], shown, placeholder: key === "name" ? defaultName : emptyValue };
}

function rowMarkup(spec) {
  const copy = spec.stored
    ? `<button class="account-copy" type="button" data-account-copy="${escapeHtml(spec.stored)}" aria-label="${escapeHtml(spec.label)} kopieren">${icon("copy")}</button>`
    : "";
  return `
    <div class="plist-row account-row" data-account-field="${spec.key}">
      ${icon(spec.icon)}
      <span class="account-label">${escapeHtml(spec.label)}</span>
      <span class="plist-value${spec.shown ? "" : " is-empty"}">${escapeHtml(spec.shown || emptyValue)}</span>
      ${copy}
    </div>`;
}

function groupMarkup(title, keys, tail = "") {
  const rows = keys.map((key) => rowMarkup(rowSpec(key))).join("");
  return `<p class="psection">${escapeHtml(title)}</p><section class="plist">${rows}${tail}</section>`;
}

/** Seite „Persönliche Daten“: Angaben und eigene Links, je mit Kopier-Knopf. */
export function personalCard() {
  const linkKeys = profileFields().links.map((link, index) => `link:${index}`);
  const add = `<button class="plist-row account-add" type="button" data-account-add="1">${icon("plus")}<span>Link hinzufügen</span></button>`;
  const since = `
    <div class="plist-row account-row" data-account-since="row">
      ${icon("calendar")}
      <span class="account-label">Dabei seit</span>
      <span class="plist-value account-since-value">${escapeHtml(sinceMonth())}</span>
    </div>`;
  return `${groupMarkup("Angaben", ["name", "mail", "phone"], since)}${groupMarkup("Links", linkKeys, add)}`;
}

/* Den Wert speichern; eine Namensänderung sehen auch Profilkopf und Seitenleiste. */
function save(key, value) {
  if (key.startsWith("link:")) setLinkUrl(Number(key.slice(5)), value);
  else setProfileField(key, value);
  if (key === "name") emit(events.dataChanged);
}

/* Die Zeile wieder als Text zeichnen — nur diese, damit ein Tipp auf die
   nächste Zeile nicht ins Leere geht, weil sie mitten im Tipp ersetzt wurde. */
function closeEdit(row, input, cancelled) {
  if (input.dataset.done) return;
  input.dataset.done = "1";
  const key = row.dataset.accountField;
  if (!cancelled) save(key, input.value);
  const spec = rowSpec(key);
  if (spec) row.outerHTML = rowMarkup(spec);
  else row.remove();
}

function startEdit(row) {
  if (row.querySelector(".account-input-inline")) return;
  const spec = rowSpec(row.dataset.accountField);
  if (!spec) return;
  row.querySelector(".plist-value").outerHTML = `
    <input class="account-input-inline" type="${spec.type}" inputmode="${spec.inputmode}" form="${noHistoryForm}" enterkeyhint="done"
      value="${escapeHtml(spec.stored)}" placeholder="${escapeHtml(spec.placeholder)}" aria-label="${escapeHtml(spec.label)}" />`;
  const input = row.querySelector(".account-input-inline");
  input.addEventListener("blur", () => closeEdit(row, input, input.dataset.cancel === "1"));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") input.dataset.cancel = "1";
    if (event.key === "Enter" || event.key === "Escape") input.blur();
  });
  input.focus();
}

/* Den Kalender über der angetippten Stelle öffnen; die Wahl erscheint in Zeile und Profilkopf. */
function pickSince(anchor) {
  openDayPicker(anchor, profileFields().since.slice(0, 10), (day) => {
    setSince(day);
    document.querySelectorAll("[data-account-since]").forEach((spot) => {
      if (spot.dataset.accountSince === "head") spot.textContent = metaLine();
      else spot.querySelector(".plist-value").textContent = sinceMonth();
    });
  });
}

/** Tipp auf eine Zeile oder auf „Link hinzufügen“. Gibt true zurück, wenn er hierher gehörte. */
export function onPersonalClick(event) {
  const since = event.target.closest("[data-account-since]");
  if (since) {
    pickSince(since);
    return true;
  }
  const add = event.target.closest("[data-account-add]");
  if (add) {
    const key = `link:${addLink()}`;
    add.insertAdjacentHTML("beforebegin", rowMarkup(rowSpec(key)));
    startEdit(add.previousElementSibling);
    return true;
  }
  const row = event.target.closest("[data-account-field]");
  if (!row || event.target.closest("[data-account-copy]")) return false;
  startEdit(row);
  return true;
}
