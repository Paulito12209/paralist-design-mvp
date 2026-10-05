/*
 * Das Blatt „Details“ in der Android-Fassung, aufgebaut wie die Seite einer
 * Aufgabe in Google Tasks und das Blatt eines Titels in der Sonos-App:
 *
 * - Kopf: links groß das Icon der Kategorie, daneben der Titel in einer
 *   Zeile mit „…“ und darunter klein die Kategorie. Ein Tipp auf den Titel
 *   klappt ihn ganz auf (das Icon bleibt oben links, die Kategorie rutscht
 *   nach unten); ein Tipp auf die Kategorie öffnet „Typ ändern“.
 * - „Verknüpfen mit“: alle Ablageorte (Arbeitsbereich, Projekt) und verknüpften
 *   Einträge als Chips; ohne Ablageort steht vorne „Eingang“ (bei Medien
 *   „Ressourcen“) — dort liegt der Eintrag dann. Die Reihenfolge ist fest:
 *   Arbeitsbereich, dann Projekt, dann alles andere (Notizen, Aufgaben,
 *   Bilder …) in der Reihenfolge des Verknüpfens — egal, was zuerst
 *   verknüpft wurde. Zu sehen sind die ersten zwei; darunter klappt
 *   „Mehr anzeigen“ den Rest auf. Ein Tipp auf die Zeile öffnet das Blatt
 *   „Verknüpfen“ mit Tabs (src/ui/link-sheet.js); wer dort einen Ort
 *   anhakt, holt ihn aus dem Eingang. Beim Arbeitsbereich steht hier sein Tab.
 * - Darunter die Angaben als Zeilen untereinander: erst Dringlichkeit und
 *   Status, dann zusammen das Zeitliche (Frist, Erinnerung) — Icon links, Wert, darunter
 *   klein die Bezeichnung. Fehlt ein Wert, steht dort „Frist hinzufügen“ bzw.
 *   „Erinnerung hinzufügen“. Ein Tipp tut, was die Kennzahl auf der Karte tut
 *   (src/ui/details-card.js, handleCardClick).
 * - Unten fest „Als erledigt markieren“ bei allem mit Status.
 *
 * Die Abschnitte darunter (Nutzung, Verlauf, Ablage) bleiben wie in den
 * übrigen Fassungen; nur „Zeit“ entfällt, weil Fälligkeit und Erinnerung
 * schon als Zeilen oben stehen.
 * Pfad: src/ui/details-rows.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowIcons    -> Icon je Zeile (Name des Felds bzw. der Beschriftung)
 * emptyLabels -> Text einer leeren Zeile, die sich antippen lässt
 * linkLabel   -> Beschriftung der Zeile mit den Verknüpfungen
 * timeFields  -> Zeilen für Zeitliches, die zusammen unten stehen (Frist, Erinnerung)
 * visibleChips -> wie viele Chips ohne „Mehr anzeigen“ zu sehen sind
 * moreLabels  -> Beschriftung des Knopfs unter den Chips (zu | auf)
 * doneLabels  -> Beschriftung des Knopfs unten (offen | erledigt)
 *
 * Aussehen: styles/android-details.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { overviewPages, typeIcon, typeSingular, xpItemStyle } from "../data/config.js";
import { hasStatus, isTaskDone } from "../data/config-tasks.js";
import { linkedEntries } from "../data/links.js";
import { moveWorkspaceToTab } from "../data/mutations.js";
import { isWorkspaceRef } from "../data/refs.js";
import { parentIcon, parentName, placesLabel, tabLabel, workspaceColor, workspaceIcon, workspaceLabel } from "../data/queries.js";
import { state } from "../data/state.js";
import { expandDetailsFully } from "./details-expand.js";
import { openLinkSheet } from "./link-sheet.js";
import { openSheet } from "./sheet.js";
import { toggleTaskFromCheck } from "./task-status.js";
import { openTypeChangeSheet } from "./type-menu.js";

const rowIcons = {
  priority: "flame",
  date: "calendar",
  remind: "clock",
  status: "status",
  entries: "list",
  Wörter: "text",
  Wort: "text",
  Erstellt: "history",
  Bearbeitet: "pencil",
  Verknüpft: "link",
  Aufrufe: "history",
  Website: "globe",
  Video: "video",
  Standort: "globe",
  Geändert: "pencil",
};
const emptyLabels = { date: "Frist hinzufügen", remind: "Erinnerung hinzufügen" };
const linkLabel = "Verknüpfen mit";
/* Zeilen für Zeitliches, in dieser Reihenfolge ganz unten */
const timeFields = ["date", "remind"];
const visibleChips = 2;
const moreLabels = { closed: "Mehr anzeigen", open: "Weniger anzeigen" };
/* Rang in der Reihe der Chips: Arbeitsbereich, Projekt, alles andere */
const rankWorkspace = 0;
const rankProject = 1;
const rankOther = 2;
/* Der Eintrag, dessen Chips aufgeklappt sind — ein anderer Eintrag fängt zugeklappt an */
let moreOpenId = null;
const doneLabels = { open: "Als erledigt markieren", done: "Wieder öffnen" };

/* Leer heißt: kein Wert („—“), bei der Erinnerung auch „Keine“ */
function isEmpty(row) {
  return row.value === "—" || (row.field === "remind" && row.value === "Keine");
}

/* Kopf: Icon, Titel (eine Zeile, Tipp klappt auf), Kategorie (Tipp: Typ ändern) */
function headMarkup(subject, kind) {
  const isEntry = kind === "entry";
  const glyph = isEntry ? subject.icon || typeIcon(subject.type) : workspaceIcon(subject);
  const color = isEntry ? xpItemStyle(subject.type).color : workspaceColor();
  const title = isEntry ? subject.title || "Ohne Titel" : workspaceLabel(subject);
  const category = isEntry ? typeSingular(subject.type) : "Arbeitsbereich";
  return `
    <div class="details-m3-head">
      <span class="details-m3-head-icon" style="color:${color}">${icon(glyph)}</span>
      <div class="details-m3-head-text">
        <button class="details-m3-title" type="button" data-details-title aria-expanded="false">${escapeHtml(title)}</button>
        <button class="details-m3-kind" type="button" data-details-kind aria-label="${escapeHtml(category)}. Typ ändern">${escapeHtml(category)}${icon("chevron", "details-m3-kind-chevron")}</button>
      </div>
    </div>`;
}

function chipMarkup(chip) {
  return `<span class="details-m3-chip">${icon(chip.icon)}<span>${escapeHtml(chip.label)}</span></span>`;
}

/* Zeile „Verknüpfen mit“: Arbeitsbereich, Projekt, dann der Rest. sort ist
   stabil — gleicher Rang bleibt in der Reihenfolge des Verknüpfens. */
function linkRowMarkup(entry) {
  const refs = entry.places || [];
  /* Ohne Ort: der Eingang bzw. bei Medien die Ressourcen (wie placesLabel) */
  const home = { label: placesLabel(entry), icon: entry.type === "medien" ? overviewPages[4].icon : overviewPages[1].icon, rank: rankWorkspace };
  const places = refs.length
    ? refs.map((ref) => ({ label: parentName(ref), icon: parentIcon(ref), rank: isWorkspaceRef(ref) ? rankWorkspace : rankProject }))
    : [home];
  const links = linkedEntries(entry).map((other) => ({
    label: other.title || "Ohne Titel",
    icon: other.icon || typeIcon(other.type),
    rank: other.type === "projekt" ? rankProject : rankOther,
  }));
  const chips = [...places, ...links].sort((a, b) => a.rank - b.rank);
  const open = String(moreOpenId) === String(entry.id);
  const shown = open ? chips : chips.slice(0, visibleChips);
  const more = chips.length > visibleChips
    ? `<button class="details-m3-more" type="button" data-details-more aria-expanded="${open}">${open ? moreLabels.open : `${moreLabels.closed} (${chips.length - visibleChips})`}</button>`
    : "";
  const body = chips.length ? `<span class="details-m3-chips">${shown.map(chipMarkup).join("")}</span>${more}` : "";
  /* Eine Fläche mit Knopf für die Beschriftung statt eines Knopfs um alles:
     „Mehr anzeigen“ darf kein Knopf im Knopf sein */
  return `<div class="details-m3-row is-links" data-details-links>${icon("link")}<span class="details-m3-text"><button class="details-m3-primary details-m3-link-label${chips.length ? "" : " is-empty"}" type="button">${linkLabel}</button>${body}</span></div>`;
}

/* Beim Arbeitsbereich: sein Tab, ein Tipp wechselt ihn */
function tabRowMarkup(workspace) {
  const tab = state.tabs.find((item) => String(item.id) === String(workspace.tab));
  return `<button class="details-m3-row" type="button" data-details-tab>${icon("tag")}<span class="details-m3-text"><span class="details-m3-primary">${escapeHtml(tab ? tabLabel(tab) : "Tab")}</span><span class="details-m3-secondary">Tab</span></span></button>`;
}

/* Eine Zeile: antippbar als Knopf (data-details-field), sonst reiner Text */
function rowMarkup(row) {
  const empty = isEmpty(row);
  const glyph = icon(rowIcons[row.field] || rowIcons[row.label] || "info");
  const text = empty
    ? `<span class="details-m3-primary is-empty">${escapeHtml(emptyLabels[row.field] || "—")}</span>`
    : `<span class="details-m3-primary"${row.color ? ` style="color:${row.color}"` : ""}>${escapeHtml(row.value)}</span><span class="details-m3-secondary">${escapeHtml(row.label)}</span>`;
  const inner = `${glyph}<span class="details-m3-text">${text}</span>`;
  if (!row.field) return `<div class="details-m3-row">${inner}</div>`;
  return `<button class="details-m3-row" type="button" data-details-field="${row.field}" aria-label="${escapeHtml(`${row.label}: ${empty ? "keine" : row.value}. Ändern`)}">${inner}</button>`;
}

/*
 * Die Zeilen aus den drei Kennzahlen und dem Abschnitt „Zeit“: die Fälligkeit
 * nimmt den Wert mit Uhrzeit aus „Zeit“, die Erinnerung kommt von dort, wenn
 * sie oben noch nicht steht. Eine überfällige Fälligkeit behält ihre Farbe.
 */
function rowsOf(facts) {
  const time = facts.groups.find((group) => group.heading === "Zeit");
  const timeRows = time ? time.rows : [];
  const rows = facts.stats.map((stat) => {
    const better = stat.field === "date" ? timeRows.find((row) => row.edit === "date") : null;
    return better ? { ...stat, value: better.value, color: stat.color === "var(--muted)" ? "" : stat.color } : { ...stat };
  });
  if (!rows.some((row) => row.field === "remind")) {
    const remind = timeRows.find((row) => row.edit === "remind");
    if (remind) rows.push({ value: remind.value, label: remind.label, field: "remind" });
  }
  /* Zeitliches (Frist, Erinnerung) steht zusammen ganz unten, nach Dringlichkeit und Status;
     sort ist stabil, der Rest behält seine Reihenfolge */
  return rows.sort((a, b) => timeFields.indexOf(a.field) + 1 - (timeFields.indexOf(b.field) + 1));
}

/** Beim Öffnen des Blatts: die Chips wieder auf die ersten zwei einklappen. */
export function collapseDetailsLinks() {
  moreOpenId = null;
}

/** Kopf über der scrollenden Fläche. @param kind "entry" oder "workspace" */
export function detailsHeadMarkup(subject, kind) {
  return headMarkup(subject, kind);
}

/** Verknüpfen bzw. Tab und die Zeilen als HTML. */
export function detailsRowsMarkup(subject, kind, facts) {
  const first = kind === "workspace" ? tabRowMarkup(subject) : linkRowMarkup(subject);
  return `<div class="details-m3-rows">${first}${rowsOf(facts).map(rowMarkup).join("")}</div>`;
}

/** Der Knopf unten — leer, wenn der Eintrag keinen Status hat. */
export function detailsDoneMarkup(subject, kind) {
  if (kind !== "entry" || !hasStatus(subject.type)) return "";
  const label = isTaskDone(subject) ? doneLabels.done : doneLabels.open;
  return `<button class="details-m3-done" type="button" data-details-done>${escapeHtml(label)}</button>`;
}

/** Die Abschnitte ohne „Zeit“ — der steht schon in den Zeilen. */
export function groupsWithoutTime(facts) {
  return { ...facts, groups: facts.groups.filter((group) => group.heading !== "Zeit") };
}

/* Die Tabs zur Wahl, Haken links wie in Google Tasks */
function openTabSheet(workspace, refresh) {
  openSheet(
    "Tab",
    state.tabs.map((tab) => ({
      label: tabLabel(tab),
      leadCheck: true,
      active: String(tab.id) === String(workspace.tab),
      onSelect: () => {
        moveWorkspaceToTab(workspace, tab.id);
        refresh();
      },
    }))
  );
}

/**
 * Tipps auf Kopf, Verknüpfen, Tab und den Knopf unten. Gibt true zurück, wenn
 * einer davon getroffen war; Zeilen gehen weiter an handleCardClick.
 * @param kind "entry" oder "workspace"
 */
export function handleRowsClick(event, subject, kind, refresh) {
  const title = event.target.closest("[data-details-title]");
  if (title) {
    const open = title.getAttribute("aria-expanded") !== "true";
    title.setAttribute("aria-expanded", String(open));
    return true;
  }
  if (event.target.closest("[data-details-kind]")) {
    openTypeChangeSheet(kind === "entry" ? { entry: subject } : { workspace: subject });
    return true;
  }
  if (event.target.closest("[data-details-more]")) {
    const open = String(moreOpenId) !== String(subject.id);
    moreOpenId = open ? subject.id : null;
    refresh();
    /* Halb offen rollt nichts: mit dem Rest der Chips ginge das Blatt sonst abgeschnitten auf */
    if (open) expandDetailsFully();
    return true;
  }
  if (event.target.closest("[data-details-links]")) {
    openLinkSheet(subject);
    return true;
  }
  if (event.target.closest("[data-details-tab]")) {
    openTabSheet(subject, refresh);
    return true;
  }
  if (event.target.closest("[data-details-done]")) {
    toggleTaskFromCheck(subject.id);
    return true;
  }
  return false;
}
