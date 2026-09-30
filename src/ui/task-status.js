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
 * statusTitle -> Beschriftung des Tabs „Status“ im Blatt
 * prioTitle   -> Beschriftung des Tabs „Dringlichkeit“ im Blatt
 * typeTitle   -> Beschriftung des Tabs „Typ“ im Blatt
 *
 * Aussehen steht in styles/tasks.css (Haken) und styles/task-status.css
 * (erledigter Titel in allgemeinen Listen, Kategorie-Pille der Kopfzeile).
 */

import { icon } from "../core/html.js";
import { typeIcon, typeSingular, xpItemStyle, xpKinds } from "../data/config.js";
import {
  defaultTaskStatus,
  isTaskDone,
  isTimeType,
  statusListFor,
  statusOf,
  taskPriorities,
  taskPriorityOf,
  taskStatusOf,
} from "../data/config-tasks.js";
import { canChangeType } from "../data/convert.js";
import { setTaskPriority, setTaskStatus, toggleTaskDone } from "../data/mutations-tasks.js";
import { findEntry } from "../data/queries.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";
import { typeChangeOptions } from "./type-menu.js";

const doneTitle = "Erledigt";
const undoLabel = "Rückgängig";
const statusTitle = "Status";
const prioTitle = "Dringlichkeit";
const typeTitle = "Typ";

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
 * Tipp darauf die Aufgabe abhakt und nicht die Seite öffnet. Der Ring trägt
 * die Farbe der Dringlichkeit — dasselbe Motiv wie die Ringe im Kalender —,
 * „In Arbeit“ setzt einen Punkt hinein, erledigt füllt ihn grün.
 */
export function taskCheck(entry) {
  const done = isTaskDone(entry);
  /* Jede Stufe zwischen „Offen“ und „Erledigt“ gilt als angefangen */
  const busy = !done && taskStatusOf(entry.status).id !== defaultTaskStatus;
  const state = done ? " is-done" : busy ? " is-busy" : "";
  return `
    <button class="task-check${state}" type="button" data-task-done="${entry.id}"
      style="--task-ring:${taskPriorityOf(entry.priority).color}"
      aria-pressed="${done}" aria-label="${done ? "Wieder öffnen" : "Erledigt"}">
      ${icon("check", "task-check-icon")}
    </button>
  `;
}

/* Die Optionen eines Feldes im Blatt; die gewählte Stufe ist markiert. Das
   Blatt bleibt offen (`stay`), damit man Status und Dringlichkeit in einem
   Zug setzen kann, und zeichnet sich nach jeder Wahl im selben Tab neu. */
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

/*
 * Die Tabs des Blatts: Status, Dringlichkeit (nur Aufgabe, Projekt, Termin)
 * und die Typen zum Umwandeln (src/ui/type-menu.js). Ein Tipp auf einen Typ
 * schließt das Blatt — der Eintrag ist danach etwas anderes, oder es folgt
 * die Rückfrage.
 */
function sheetTabs(entry) {
  const tabs = [{ id: "status", label: statusTitle, options: (item) => fieldOptions(item, "status") }];
  if (isTimeType(entry.type)) tabs.push({ id: "priority", label: prioTitle, options: (item) => fieldOptions(item, "priority") });
  if (canChangeType(entry)) tabs.push({ id: "type", label: typeTitle, options: (item) => typeChangeOptions({ entry: item }) });
  return tabs;
}

/**
 * Blatt von unten für Aufgabe, Termin, Projekt oder Dokument: oben der Name
 * mit dem Icon der Kategorie, darunter die Tabs Status | Dringlichkeit | Typ
 * (beim Dokument Status | Typ) — antippen oder waagerecht wischen wechselt.
 * Die Karte „Details“ öffnet es beim angetippten Feld.
 */
export function openTaskSheet(entry, tab = "status") {
  const tabs = sheetTabs(entry);
  const current = tabs.find((item) => item.id === tab) || tabs[0];
  openSheet(entry.title || typeSingular(entry.type), current.options(entry), {
    icon: typeIcon(entry.type),
    iconColor: xpItemStyle(entry.type).color,
    tabs,
    tab: current.id,
    onTab: (id) => {
      const fresh = findEntry(entry.id);
      if (fresh) openTaskSheet(fresh, id);
    },
  });
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
