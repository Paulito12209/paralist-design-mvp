/*
 * Status und Dringlichkeit einer Aufgabe — überall, wo eine Aufgabe auftaucht,
 * nicht nur auf der Aufgaben-Seite:
 *
 * - der runde Haken-Knopf auf der Aufgaben-Seite (Liste und Board); in allen
 *   anderen Listen trägt eine Aufgabe ihr Icon und wird über den grünen
 *   Wisch-Knopf abgehakt (src/ui/rows.js), der dieselbe Funktion ruft,
 * - auf der Seite der Aufgabe in der Karte „Details“: ein Tipp auf Status
 *   oder Dringlichkeit öffnet von unten das Blatt dazu — ebenso bei Termin
 *   und Projekt (Status und Dringlichkeit wie die Aufgabe) und beim Dokument
 *   (nur Status: Entwurf, Fertig, Geprüft),
 * - die kurze Meldung „Erledigt“ mit „Rückgängig“ — ein Tipp auf den
 *   Haken lässt die Zeile oft verschwinden (Filter „Erledigte ausblenden“), und
 *   ein versehentlicher Tipp soll sich ohne Suchen zurücknehmen lassen.
 * Pfad: src/ui/task-status.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * doneTitle   -> Text der Meldung nach dem Abhaken
 * undoLabel   -> Beschriftung des Knopfes in der Meldung
 * statusTitle -> Überschrift des Blatts „Status“
 * prioTitle   -> Überschrift des Blatts „Dringlichkeit“
 *
 * Aussehen steht in styles/tasks.css (Haken) und styles/task-status.css
 * (erledigter Titel in allgemeinen Listen, Kategorie-Pille der Kopfzeile).
 */

import { icon } from "../core/html.js";
import { xpKinds } from "../data/config.js";
import {
  isTaskDone,
  statusListFor,
  statusOf,
  taskPriorities,
  taskPriorityOf,
  taskStatusOf,
} from "../data/config-tasks.js";
import { setTaskPriority, setTaskStatus, toggleTaskDone } from "../data/mutations-tasks.js";
import { findEntry } from "../data/queries.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";

const doneTitle = "Erledigt";
const undoLabel = "Rückgängig";
const statusTitle = "Status";
const prioTitle = "Dringlichkeit";

/*
 * Die beiden Felder, die sich im Blatt wählen lassen: der Status aus der
 * Liste der Kategorie (Dokument: Entwurf/Fertig/Geprüft, sonst die der
 * Aufgabe) und die Dringlichkeit.
 */
function fieldSpec(entry, field) {
  return field === "status"
    ? { list: statusListFor(entry.type), current: statusOf(entry).id, set: setTaskStatus }
    : { list: taskPriorities, current: taskPriorityOf(entry.priority).id, set: setTaskPriority };
}

/**
 * Der runde Haken-Knopf. Er sitzt als eigener Knopf neben der Zeile, damit ein
 * Tipp darauf die Aufgabe abhakt und nicht die Seite öffnet. Der Ring zeigt
 * den Status (offen grau, in Arbeit blau, erledigt grün gefüllt — wie bei
 * Google Tasks). Die Dringlichkeit steht nie im Ring, sondern als Wort in der
 * Nebenzeile (src/features/tasks/tasks-parts.js).
 */
export function taskCheck(entry) {
  const done = isTaskDone(entry);
  return `
    <button class="task-check${done ? " is-done" : ""}" type="button" data-task-done="${entry.id}"
      style="--task-ring:${taskStatusOf(entry.status).color}"
      aria-pressed="${done}" aria-label="${done ? "Wieder öffnen" : "Erledigt"}">
      ${icon("check", "task-check-icon")}
    </button>
  `;
}

/* Die Optionen eines Feldes im Blatt; die gewählte Stufe ist markiert. Das
   Blatt bleibt offen (`stay`) und zeichnet sich nach jeder Wahl neu. */
function fieldOptions(entry, field) {
  const spec = fieldSpec(entry, field);
  return spec.list.map((item) => ({
    label: item.label,
    icon: item.icon,
    active: item.id === spec.current,
    stay: true,
    onSelect: () => {
      const wasDone = isTaskDone(entry);
      const firstTime = !entry.doneAwarded;
      const before = entry[field];
      spec.set(entry, item.id);
      if (field === "status" && !wasDone && isTaskDone(entry)) announceDone(entry, before, firstTime);
      openTaskSheet(entry, field);
    },
  }));
}

/**
 * Blatt von unten für Status oder Dringlichkeit: oben nur die Überschrift
 * („Status“ bzw. „Dringlichkeit“), darunter genau die Stufen zur Wahl — ohne
 * Namen des Eintrags und ohne Tabs. Jede Auswahl hat ihr eigenes Blatt; die
 * Typen zum Umwandeln liegen hinter der Kategorie im Kopf (src/ui/type-menu.js).
 * Die Karte „Details“ öffnet es beim angetippten Feld.
 * @param field "status" oder "priority"
 */
export function openTaskSheet(entry, field = "status") {
  openSheet(field === "status" ? statusTitle : prioTitle, fieldOptions(entry, field));
}

/* Meldung nach dem Abhaken; „Rückgängig“ stellt den Status von vorher wieder
   her. Die Punkte gibt es nur beim ersten Mal (doneAwarded in mutations.js),
   deshalb steht „+2 XP“ nur dann daneben. */
function announceDone(entry, before, awarded) {
  showToast({
    icon: "check-circle",
    accent: "var(--xp-done)",
    title: doneTitle,
    /* Punkte bringt nur die Aufgabe (noteDone in src/data/mutations-tasks.js) */
    note: awarded && entry.type === "aufgabe" ? `+${xpKinds.done.amount} XP` : "",
    action: {
      label: undoLabel,
      icon: "undo",
      onSelect: () => {
        const current = findEntry(entry.id);
        if (current) setTaskStatus(current, before);
      },
    },
  });
}

/**
 * Haken-Knopf gedrückt: erledigt setzen oder wieder öffnen. Beim Erledigen
 * erscheint die Meldung mit „Rückgängig“, beim Wieder-Öffnen nicht — dann
 * bleibt die Zeile ja sichtbar und der Haken ist die Rückmeldung.
 */
export function toggleTaskFromCheck(id) {
  const entry = findEntry(id);
  if (!entry) return;
  const before = entry.status;
  const firstTime = !entry.doneAwarded;
  toggleTaskDone(entry);
  if (isTaskDone(entry)) announceDone(entry, before, firstTime);
}
