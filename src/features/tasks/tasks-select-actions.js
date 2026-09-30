/*
 * Was die Knöpfe der Auswahl-Leiste mit den gewählten Aufgaben tun
 * (src/features/tasks/tasks-select-bar.js): Status, Dringlichkeit und Datum
 * über ein Blatt von unten, Archivieren sofort, „Mehr“ mit Favorit, Ablegen,
 * Duplizieren und Löschen. Danach eine kurze Meldung mit „Rückgängig“ für
 * die ganze Gruppe — nur Löschen fragt stattdessen vorher nach, weil sich
 * gelöschte Dateien nicht zurückholen lassen.
 *
 * Bei gemischten Werten zeigt das Blatt statt des Hakens, wie viele der
 * gewählten den Wert schon haben; ein Haken steht nur, wenn alle gleich sind.
 * Was Zeilen aus der Liste nimmt (Archivieren, Ablegen, Duplizieren,
 * Löschen), beendet den Auswahlmodus; was sie stehen lässt, behält die
 * Auswahl — so geht „erst In Arbeit, dann Datum“ in einem Rutsch.
 * Pfad: src/features/tasks/tasks-select-actions.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * words -> alle Beschriftungen der Blätter und Meldungen
 *
 * Keine anpassbaren visuellen Werte: Blatt und Meldung sehen aus wie überall
 * (styles/overlays.css, styles/sheet-tabs.css, styles/toast.css).
 */

import { dayKey } from "../../core/dates.js";
import { shortDay } from "../../core/format.js";
import { taskPriorities, taskPriorityOf, taskStatuses, taskStatusOf } from "../../data/config-tasks.js";
import {
  archiveEntries,
  deleteEntries,
  duplicateEntries,
  placeEntries,
  restoreEntries,
  restoreSnapshot,
  setEntriesDate,
  setFavorites,
  setTasksPriority,
  setTasksStatus,
  snapshotEntries,
} from "../../data/mutations-bulk.js";
import { openDayPicker } from "../../ui/date-field.js";
import { openPlacePicker } from "../../ui/pickers.js";
import { openSheet } from "../../ui/sheet.js";
import { showToast } from "../../ui/toast.js";
import { pickedEntries } from "./tasks-pick.js";

const words = {
  one: "Aufgabe",
  many: "Aufgaben",
  undo: "Rückgängig",
  status: "Status",
  priority: "Dringlichkeit",
  date: "Fällig",
  today: "Heute",
  tomorrow: "Morgen",
  nextWeek: "Nächste Woche",
  otherDay: "Anderer Tag …",
  noDate: "Datum entfernen",
  dateCleared: "Datum entfernt",
  archived: "archiviert",
  restored: "zurückgeholt",
  favOn: "Zu Favoriten",
  favOff: "Aus Favoriten entfernen",
  favDone: "Favoriten",
  place: "Ablegen in …",
  placeTitle: "Ablegen in",
  placed: "abgelegt",
  duplicate: "Duplizieren",
  duplicated: "dupliziert",
  remove: "Löschen",
  removeAsk: "löschen?",
  removeNote: "Gelöschte Aufgaben lassen sich nicht zurückholen.",
  removed: "gelöscht",
};

/* „1 Aufgabe“, „3 Aufgaben“ */
function countLabel(count) {
  return `${count} ${count === 1 ? words.one : words.many}`;
}

/* Die Hooks aus tasks-select.js: exit beendet den Modus, settle prüft danach, ob noch etwas gewählt ist. */
let hooks = { exit: () => {}, settle: () => {} };

/** Die Hooks einmal hereingeben (aus src/features/tasks/tasks-select.js). */
export function initSelectActions(next) {
  hooks = next;
}

/*
 * Eine Sammel-Änderung ausführen: vorher merken, ändern, Modus beenden oder
 * behalten, Meldung mit „Rückgängig“ zeigen. `change(entries)` ändert und
 * gibt optional eine eigene Rücknahme zurück (Duplizieren löscht die Kopien).
 */
function run(entries, change, { removing = false, title, note = "", icon = "check-circle", accent = "" }) {
  if (!entries.length) return;
  const snap = snapshotEntries(entries);
  const undo = change(entries) || (() => restoreSnapshot(snap));
  if (removing) hooks.exit();
  else hooks.settle();
  showToast({ icon, accent, title, note, action: { label: words.undo, icon: "undo", onSelect: undo } });
}

/* Blatt für Status oder Dringlichkeit: gleiche Werte mit Haken, gemischte mit Zahl. */
function openFieldSheet(field) {
  const entries = pickedEntries();
  const spec =
    field === "status"
      ? { title: words.status, list: taskStatuses, of: taskStatusOf, set: setTasksStatus }
      : { title: words.priority, list: taskPriorities, of: taskPriorityOf, set: setTasksPriority };
  const counts = new Map();
  entries.forEach((entry) => {
    const id = spec.of(entry[field]).id;
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  const uniform = counts.size === 1;
  const options = spec.list.map((item) => ({
    label: item.label,
    icon: item.icon,
    active: uniform && counts.has(item.id),
    count: uniform ? 0 : counts.get(item.id) || 0,
    onSelect: () =>
      run(entries, (list) => spec.set(list, item.id), {
        title: `${spec.title}: ${item.label}`,
        note: countLabel(entries.length),
        icon: item.icon,
        accent: item.color,
      }),
  }));
  openSheet(`${spec.title} · ${countLabel(entries.length)}`, options);
}

/* Heute, morgen und der nächste Montag als Tages-Schlüssel. */
function dayFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

function nextMonday() {
  const today = new Date().getDay();
  return dayFromNow((8 - today) % 7 || 7);
}

/* Das Datum für alle setzen (oder mit leerem Tag wegnehmen). */
function applyDay(entries, day) {
  run(entries, (list) => setEntriesDate(list, day), {
    title: day ? `${words.date} ${shortDay(day)}` : words.dateCleared,
    note: countLabel(entries.length),
    icon: "calendar",
  });
}

/* Blatt „Fällig“: drei schnelle Tage, ein freier Tag über die Auswahl des Systems, Entfernen. */
function openDateSheet(anchor) {
  const entries = pickedEntries();
  const days = new Set(entries.map((entry) => entry.date || ""));
  const shared = days.size === 1 ? [...days][0] : null;
  const quick = [
    [words.today, dayFromNow(0)],
    [words.tomorrow, dayFromNow(1)],
    [words.nextWeek, nextMonday()],
  ].map(([label, day]) => ({ label, icon: "calendar", active: shared === day, onSelect: () => applyDay(entries, day) }));
  const options = [
    ...quick,
    {
      label: words.otherDay,
      icon: "pencil",
      onSelect: () => openDayPicker(anchor, shared, (day) => applyDay(entries, day)),
    },
  ];
  if (entries.some((entry) => entry.date)) {
    options.push({ label: words.noDate, icon: "close", split: true, onSelect: () => applyDay(entries, "") });
  }
  openSheet(`${words.date} · ${countLabel(entries.length)}`, options);
}

/* Archivieren — oder, wenn alle schon im Archiv liegen, zurückholen. */
function archiveOrRestore() {
  const entries = pickedEntries();
  const back = entries.length && entries.every((entry) => entry.archived);
  run(entries, back ? restoreEntries : archiveEntries, {
    removing: true,
    title: `${countLabel(entries.length)} ${back ? words.restored : words.archived}`,
    icon: back ? "history" : "archive",
  });
}

/** Sind alle gewählten schon im Archiv? Dann heißt der Knopf „Zurückholen“. */
export function allArchived() {
  const entries = pickedEntries();
  return entries.length > 0 && entries.every((entry) => entry.archived);
}

/* Löschen erst nach Rückfrage: gelöschte Dateien kommen nicht zurück. */
function confirmDelete() {
  const entries = pickedEntries();
  openSheet(`${countLabel(entries.length)} ${words.removeAsk}`, [
    { note: true, label: words.removeNote },
    {
      label: words.remove,
      icon: "trash",
      danger: true,
      onSelect: () => {
        deleteEntries(entries);
        hooks.exit();
        showToast({ icon: "trash", title: `${countLabel(entries.length)} ${words.removed}` });
      },
    },
  ]);
}

/* „Ablegen in …“: der gewohnte Ort-Wähler; hervorgehoben nur, wenn alle am selben Ort liegen. */
function openPlaceSheet() {
  const entries = pickedEntries();
  const places = new Set(entries.map((entry) => (entry.places || [])[0] || ""));
  /* Gemischte Orte: ein Wert, der zu keinem Ort passt, damit nichts leuchtet */
  const current = places.size === 1 ? [...places][0] || null : "\u0000";
  openPlacePicker(`${words.placeTitle} · ${countLabel(entries.length)}`, current, (ref) =>
    run(entries, (list) => placeEntries(list, ref), {
      removing: true,
      title: `${countLabel(entries.length)} ${words.placed}`,
      icon: "folder-move",
    })
  );
}

/* Blatt „Mehr“: was seltener gebraucht wird als die vier Knöpfe der Leiste. */
function openMoreSheet() {
  const entries = pickedEntries();
  const allFav = entries.length && entries.every((entry) => entry.favorite);
  openSheet(countLabel(entries.length), [
    {
      label: allFav ? words.favOff : words.favOn,
      icon: allFav ? "star-outline" : "star",
      onSelect: () =>
        run(entries, (list) => setFavorites(list, !allFav), {
          title: `${words.favDone}: ${countLabel(entries.length)}`,
          icon: allFav ? "star-outline" : "star",
        }),
    },
    { label: words.place, icon: "folder-move", onSelect: openPlaceSheet },
    {
      label: words.duplicate,
      icon: "copy",
      onSelect: () =>
        run(
          entries,
          (list) => {
            const copies = duplicateEntries(list);
            return () => deleteEntries(copies);
          },
          { removing: true, title: `${countLabel(entries.length)} ${words.duplicated}`, icon: "copy" }
        ),
    },
    { label: words.remove, icon: "trash", danger: true, split: true, onSelect: confirmDelete },
  ]);
}

/** Einen Knopf der Leiste ausführen; `button` ist der Knopf selbst (Anker für die Tag-Auswahl). */
export function runSelectAction(kind, button) {
  if (!pickedEntries().length) return;
  if (kind === "status" || kind === "priority") openFieldSheet(kind);
  else if (kind === "date") openDateSheet(button);
  else if (kind === "archive") archiveOrRestore();
  else if (kind === "more") openMoreSheet();
}
