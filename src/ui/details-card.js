/*
 * Der Inhalt einer Karte „Details“: oben drei Kennzahlen nebeneinander,
 * darunter Abschnitte mit Zeilen — und was ein Tipp darauf tut. Gemeinsam
 * für die Seite eines Eintrags (src/features/entry/entry-details.js), die
 * Seite eines Arbeitsbereichs (src/features/overview/workspace-details.js)
 * und beide Karten in der rechten Spalte am Desktop. Was in der Karte steht,
 * stellen src/data/entry-facts.js und src/data/workspace-facts.js zusammen:
 * { stats: [{ value, label, color?, field? }], groups: [{ heading, rows }] }.
 *
 * Bei einem Lesezeichen steht oben der Abschnitt „Link“: ein Tipp auf die
 * Adresse macht sie zum Feld, Enter oder Wegtippen übernimmt den neuen Link
 * (und holt den Videotitel nach, src/ui/bookmark-title.js).
 * Pfad: src/ui/details-card.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen in styles/entry-details.css.
 */

import { events, emit } from "../core/bus.js";
import { escapeHtml, icon } from "../core/html.js";
import { setBookmarkUrl } from "../data/bookmarks.js";
import { markEdited } from "../data/mutations.js";
import { saveState } from "../data/state.js";
import { fillVideoTitle } from "./bookmark-title.js";
import { openDateField, openReminderField } from "./date-field.js";
import { openRemindSheet } from "./remind-sheet.js";
import { openTaskSheet } from "./task-status.js";

/* Eine Kennzahl: ein Knopf, wenn ein Tipp etwas öffnet, sonst reiner Text */
function statMarkup(stat) {
  const color = stat.color ? ` style="--stat-color:${stat.color}"` : "";
  const inner = `<span class="details-stat-value"${color}>${escapeHtml(stat.value)}</span><span class="details-stat-label">${escapeHtml(stat.label)}</span>`;
  return stat.field
    ? `<button class="details-stat" type="button" data-details-field="${stat.field}" aria-label="${escapeHtml(`${stat.label}: ${stat.value}. Ändern`)}">${inner}</button>`
    : `<div class="details-stat">${inner}</div>`;
}

/* Eine Zeile mit `edit` ist ein Knopf: der Tipp macht den Wert zum Feld
   (Adresse) oder öffnet die Auswahl (Fällig am) bzw. das Blatt (Erinnerung —
   dann steht ein Pfeil dahinter, weil sich etwas Neues öffnet) */
function rowMarkup(row) {
  const more = row.edit === "remind" ? icon("chevron", "details-row-more") : "";
  const value = `<span class="details-row-value">${escapeHtml(row.value)}${more}</span>`;
  if (row.edit) {
    return `<button class="details-row is-editable" type="button" data-details-edit="${row.edit}" aria-label="${escapeHtml(`${row.label} ändern`)}"><span class="details-row-label">${escapeHtml(row.label)}</span>${value}</button>`;
  }
  return `<div class="details-row"><span class="details-row-label">${escapeHtml(row.label)}</span>${value}</div>`;
}

function groupMarkup(group) {
  const rows = group.rows.map(rowMarkup).join("");
  return `<p class="details-heading">${escapeHtml(group.heading)}</p>${rows}`;
}

/** Kennzahlen und Abschnitte als HTML — für die Karten in der rechten Spalte. */
export function detailsMarkup(facts) {
  return `<div class="details-stats">${facts.stats.map(statMarkup).join("")}</div><div class="details-list">${facts.groups.map(groupMarkup).join("")}</div>`;
}

/** Kennzahlen und Abschnitte in die beiden Flächen einer Karte schreiben. */
export function fillDetails(statsBox, listBox, facts) {
  statsBox.innerHTML = facts.stats.map(statMarkup).join("");
  listBox.innerHTML = facts.groups.map(groupMarkup).join("");
}

/* Die Adresse an Ort und Stelle ändern: ein Feld statt des Werts. Enter oder
   Wegtippen übernimmt, Escape lässt alles wie es war. */
function editLink(entry, row, done) {
  const value = row.querySelector(".details-row-value");
  /* input type=url: die Tastatur am Handy zeigt „.“ und „/“; kein eigenes
     autocomplete, das Formular no-history hält Chromes Verlaufs-Chips fern */
  const input = document.createElement("input");
  input.className = "details-row-input";
  input.type = "url";
  input.inputMode = "url";
  input.enterKeyHint = "done";
  input.setAttribute("form", "no-history");
  input.setAttribute("aria-label", "Adresse");
  const before = value.textContent;
  input.value = before;
  value.replaceWith(input);
  input.focus();
  input.select();
  let finished = false;
  const finish = (apply) => {
    if (finished) return;
    finished = true;
    if (apply && input.value.trim() !== before && setBookmarkUrl(entry, input.value)) {
      markEdited(entry);
      saveState();
      emit(events.dataChanged);
      fillVideoTitle(entry);
    }
    /* Erst den Wert zurück an seinen Platz, dann neu zeichnen — so steht auch
       dort, wo nicht neu gezeichnet wird, kein verwaistes Feld mehr. */
    input.replaceWith(value);
    done(entry);
  };
  input.addEventListener("blur", () => finish(true));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
    if (event.key === "Escape") finish(false);
  });
}

/**
 * Tipps auf Kennzahlen und antippbare Zeilen einer Karte „Details“ — auf der
 * Seite und in der Spalte rechts am Desktop. Status und Dringlichkeit öffnen
 * das Blatt, Fälligkeit (bzw. Tag) und Erinnerung die Auswahl für Tag und
 * Uhrzeit; die Zeile „Fällig am“ ebenso, die Zeile „Erinnerung“ das Blatt
 * dazu, die Adresse eines Lesezeichens wird zum Feld. Alles andere mit
 * `field` geht an `actions` (z.B. „Einträge“ eines Arbeitsbereichs).
 * Gibt `true` zurück, wenn der Tipp etwas tat.
 * @param subject Eintrag oder Arbeitsbereich der Karte
 * @param options.done    nach dem Ändern des Links: die Karte neu zeichnen
 * @param options.actions { feld: () => … } für eigene Kennzahlen
 */
export function handleCardClick(event, subject, { done = () => {}, actions = {} } = {}) {
  const stat = event.target.closest("[data-details-field]");
  if (stat) {
    const field = stat.dataset.detailsField;
    if (field === "date") openDateField(subject, stat);
    else if (field === "remind") openReminderField(subject, stat);
    else if (field === "status" || field === "priority") openTaskSheet(subject, field);
    else if (actions[field]) actions[field]();
    return true;
  }
  const row = event.target.closest("[data-details-edit]");
  if (!row) return false;
  const edit = row.dataset.detailsEdit;
  if (edit === "date") openDateField(subject, row);
  else if (edit === "remind") openRemindSheet(subject, row);
  else if (edit === "link" && !row.querySelector("input")) editLink(subject, row, done);
  return true;
}
