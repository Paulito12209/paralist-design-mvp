/*
 * Die Karte „Details“ am Ende des Reiters „Inhalt“ einer Eintragsseite —
 * bei jeder Kategorie. Aufgebaut wie der Kopf eines Profils: oben „Details“
 * und rechts das Ketten-Symbol „Verknüpfen“ (src/ui/link-sheet.js) und das
 * Symbol zum Hochklappen (entry-lift.js), darunter drei Kennzahlen
 * nebeneinander (bei einer Aufgabe Dringlichkeit | Datum | Status — ein Tipp
 * auf Status oder Dringlichkeit öffnet das Blatt dazu, einer auf das Datum
 * die Auswahl für Tag und Uhrzeit, src/ui/date-field.js), nach einer
 * Trennlinie die übrigen Angaben in Abschnitten. Was dort
 * steht, stellt src/data/entry-facts.js zusammen. Bei einem Lesezeichen
 * steht oben der Abschnitt „Link“: ein Tipp auf die Adresse macht sie zum
 * Feld, Enter oder Wegtippen übernimmt den neuen Link (und holt den
 * Videotitel nach, src/ui/bookmark-title.js).
 *
 * Die Karte gehört zur Seite, nicht zur Navigation: sie scrollt mit dem Text
 * und liegt unter der Navigation. Wie weit sie beim Öffnen hervorschaut,
 * regelt entry-fold.js. Ein Tipp auf „Details“ oder das Symbol rechts klappt
 * die Karte über den Text hoch, ohne die Seite zu bewegen (entry-lift.js).
 * Pfad: src/features/entry/entry-details.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * detailsLabel  -> Überschrift der Karte
 * linkLabel     -> Name des Ketten-Symbols für Vorlesehilfen und Tooltip
 * liftLabel     -> Name des Symbols zum Hochklappen
 *
 * Aussehen in styles/entry-details.css.
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { setBookmarkUrl } from "../../data/bookmarks.js";
import { entryFacts } from "../../data/entry-facts.js";
import { markEdited } from "../../data/mutations.js";
import { saveState } from "../../data/state.js";
import { events, emit } from "../../core/bus.js";
import { fillVideoTitle } from "../../ui/bookmark-title.js";
import { findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { openTaskSheet } from "../../ui/task-status.js";
import { openDateField } from "../../ui/date-field.js";
import { initEntryLift, refreshLift, toggleLift } from "./entry-lift.js";

const detailsLabel = "Details";
const linkLabel = "Verknüpfen";
const liftLabel = "Details hochklappen";

/* Die Karte und ihre beiden Flächen, die sich je Eintrag neu füllen */
let card = null;
let statsBox = null;
let listBox = null;

/** Die Karte — entry-fold.js misst an ihr, wie weit sie hervorschaut. */
export function detailsCard() {
  return card;
}

/* Eine Kennzahl: ein Knopf, wenn ein Tipp etwas öffnet, sonst reiner Text */
function statMarkup(stat) {
  const color = stat.color ? ` style="--stat-color:${stat.color}"` : "";
  const inner = `<span class="details-stat-value"${color}>${escapeHtml(stat.value)}</span><span class="details-stat-label">${escapeHtml(stat.label)}</span>`;
  return stat.field
    ? `<button class="details-stat" type="button" data-details-field="${stat.field}" aria-label="${escapeHtml(`${stat.label}: ${stat.value}. Ändern`)}">${inner}</button>`
    : `<div class="details-stat">${inner}</div>`;
}

/* Eine Zeile mit `edit` ist ein Knopf: der Tipp macht den Wert zum Feld */
function rowMarkup(row) {
  const value = `<span class="details-row-value">${escapeHtml(row.value)}</span>`;
  if (row.edit) {
    return `<button class="details-row is-editable" type="button" data-details-edit="${row.edit}" aria-label="${escapeHtml(`${row.label} ändern`)}"><span class="details-row-label">${escapeHtml(row.label)}</span>${value}</button>`;
  }
  return `<div class="details-row"><span class="details-row-label">${escapeHtml(row.label)}</span>${value}</div>`;
}

function groupMarkup(group) {
  const rows = group.rows.map(rowMarkup).join("");
  return `<p class="details-heading">${escapeHtml(group.heading)}</p>${rows}`;
}

/**
 * Kennzahlen und Abschnitte als HTML — für die Karte hier und für die
 * Karte „Details“ in der rechten Spalte am Desktop (entry-rail.js).
 */
export function detailsBodyMarkup(entry) {
  const facts = entryFacts(entry);
  return `<div class="details-stats">${facts.stats.map(statMarkup).join("")}</div><div class="details-list">${facts.groups.map(groupMarkup).join("")}</div>`;
}

/** Kennzahlen und Abschnitte für den offenen Eintrag neu schreiben. */
export function renderEntryDetails(entry) {
  if (!card || !entry) return;
  const facts = entryFacts(entry);
  statsBox.innerHTML = facts.stats.map(statMarkup).join("");
  listBox.innerHTML = facts.groups.map(groupMarkup).join("");
  refreshLift();
}

/* Die Adresse an Ort und Stelle ändern: ein Feld statt des Werts. Enter oder
   Wegtippen übernimmt, Escape lässt alles wie es war. */
function editLink(entry, row, done = renderEntryDetails) {
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

/** Karte ans Ende des Reiters „Inhalt“ hängen und ihre Tipps anmelden. */
export function initEntryDetails() {
  card = document.createElement("section");
  card.className = "details-card";
  card.setAttribute("aria-label", detailsLabel);
  card.innerHTML = `
    <div class="details-head">
      <button class="details-title" type="button">${detailsLabel}</button>
      <button class="details-link" type="button" aria-label="${linkLabel}" title="${linkLabel}">${icon("link")}</button>
      <button class="details-link details-toggle" type="button" aria-label="${liftLabel}" title="${liftLabel}" aria-expanded="false">${icon("panel-open")}</button>
    </div>
    <div class="details-stats"></div>
    <div class="details-list"></div>`;
  statsBox = card.querySelector(".details-stats");
  listBox = card.querySelector(".details-list");
  dom.entryPanelNotes.append(card);
  initEntryLift(card);

  card.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    if (event.target.closest(".details-title, .details-toggle")) {
      /* Frisch rechnen: die Zeit auf der Seite ist seit dem Öffnen gewachsen */
      renderEntryDetails(entry);
      toggleLift();
      return;
    }
    if (event.target.closest(".details-link")) {
      openLinkSheet(entry);
      return;
    }
    handleDetailsClick(event, entry);
  });
}

/**
 * Tipps auf Kennzahlen (Status, Dringlichkeit, Datum) und die Link-Zeile — hier und
 * in der Karte rechts am Desktop. Gibt `true` zurück, wenn der Tipp etwas tat.
 * @param done nach dem Ändern des Links: die Karte, in der er stand, neu zeichnen.
 */
export function handleDetailsClick(event, entry, done = renderEntryDetails) {
  const stat = event.target.closest("[data-details-field]");
  if (stat) {
    const field = stat.dataset.detailsField;
    if (field === "date") openDateField(entry, stat);
    else openTaskSheet(entry, field);
    return true;
  }
  const row = event.target.closest("[data-details-edit]");
  if (!row) return false;
  if (!row.querySelector("input")) editLink(entry, row, done);
  return true;
}
