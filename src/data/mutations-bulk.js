/*
 * Sammel-Änderungen: was die Auswahl auf der Aufgaben-Seite mit mehreren
 * Einträgen auf einmal tut — Status, Dringlichkeit, Datum, Archivieren,
 * Favorit, Ablageort, Duplizieren, Löschen. Jede Funktion ändert alle
 * Einträge und speichert erst am Ende EINMAL; so zeichnet sich die Liste nur
 * einmal neu, egal wie viele gewählt sind.
 *
 * Dazu der Schnappschuss für „Rückgängig“: er merkt sich die Felder, die
 * eine Sammel-Änderung anfassen kann, und stellt sie wieder her. Punkte, die
 * es beim Erledigen gab, bleiben — wie beim Rückgängig nach dem Abhaken
 * einer einzelnen Aufgabe (src/ui/task-status.js).
 * Pfad: src/data/mutations-bulk.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * snapFields -> welche Felder „Rückgängig“ zurückholt
 *
 * Keine anpassbaren visuellen Werte.
 */

import { sameId } from "../core/ids.js";
import { isTaskDone } from "./config-tasks.js";
import { dropLinksTo } from "./links.js";
import { commit, liftChildren, markEdited } from "./mutations.js";
import { applyTaskStatus } from "./mutations-tasks.js";
import { dropProjectFromViews } from "./project-views.js";
import { dueTime, followDue } from "./reminders.js";
import { isContainer } from "./queries.js";
import { entryRef, isEntryRef } from "./refs.js";
import { state } from "./state.js";
import { archiveEntry } from "./xp.js";

/* Die Felder, die eine Sammel-Änderung anfassen kann. Der Text gehört nicht
   dazu: den ändert keine Sammel-Aktion. */
const snapFields = ["status", "priority", "date", "time", "archived", "favorite", "places", "order", "doneAt", "editedAt"];

/** Die Felder der Einträge merken, bevor eine Sammel-Änderung sie ändert. */
export function snapshotEntries(entries) {
  return entries.map((entry) => {
    const fields = {};
    snapFields.forEach((key) => {
      if (key in entry) fields[key] = Array.isArray(entry[key]) ? [...entry[key]] : entry[key];
    });
    return { id: entry.id, fields };
  });
}

/** „Rückgängig“: die gemerkten Felder zurückschreiben; was vorher fehlte, fällt wieder weg. */
export function restoreSnapshot(snapshot) {
  snapshot.forEach(({ id, fields }) => {
    const entry = state.entries.find((item) => sameId(item.id, id));
    if (!entry) return;
    snapFields.forEach((key) => {
      if (key in fields) entry[key] = fields[key];
      else delete entry[key];
    });
  });
  commit();
}

/** Status aller gewählten Aufgaben setzen. */
export function setTasksStatus(entries, status) {
  entries.forEach((entry) => applyTaskStatus(entry, status));
  commit();
}

/** Dringlichkeit aller gewählten Aufgaben setzen. */
export function setTasksPriority(entries, priority) {
  entries.forEach((entry) => {
    entry.priority = priority;
  });
  commit();
}

/** Fälligkeit setzen (Tag als „JJJJ-MM-TT“); ohne Tag fallen Datum und Uhrzeit weg. */
export function setEntriesDate(entries, day) {
  entries.forEach((entry) => {
    const due = dueTime(entry);
    if (day) entry.date = day;
    else {
      delete entry.date;
      delete entry.time;
    }
    /* Eine Erinnerung an der Fälligkeit wandert mit (src/data/reminders.js) */
    followDue(entry, due);
    markEdited(entry);
  });
  commit();
}

/** Alle ins Archiv legen — mit denselben Punkten wie beim einzelnen Archivieren. */
export function archiveEntries(entries) {
  entries.forEach((entry) => {
    if (!entry.archived) archiveEntry(entry);
  });
  commit();
}

/**
 * Alle aus dem Archiv zurückholen. Eine erledigte Aufgabe gilt dabei als
 * heute erledigt — sonst räumte das nächste Aufräumen sie gleich wieder weg.
 */
export function restoreEntries(entries) {
  entries.forEach((entry) => {
    entry.archived = false;
    if (entry.type === "aufgabe" && isTaskDone(entry)) entry.doneAt = Date.now();
  });
  commit();
}

/** Alle als Favorit markieren (`on`) oder die Markierung wegnehmen. */
export function setFavorites(entries, on) {
  entries.forEach((entry) => {
    entry.favorite = Boolean(on);
  });
  commit();
}

/**
 * Alle an einen Ort legen; `ref` null heißt Eingang. Dieselbe Regel wie
 * beim einzelnen Ablegen: kein Projekt in einem Projekt, nichts in sich selbst.
 */
export function placeEntries(entries, ref) {
  entries.forEach((entry) => {
    if (ref && isEntryRef(ref) && (isContainer(entry) || ref === entryRef(entry.id))) return;
    entry.places = ref ? [ref] : [];
  });
  commit();
}

/**
 * Jeden gewählten Eintrag einmal kopieren. Die Kopie steht gleich hinter
 * dem Original; Verknüpfungen gehen nicht mit, weil sie auf beiden Seiten
 * stehen müssten. Gibt die Kopien zurück (für „Rückgängig“).
 */
export function duplicateEntries(entries) {
  const copies = entries.map((entry) => {
    const copy = structuredClone(entry);
    copy.id = state.nextEntryId++;
    copy.links = [];
    copy.createdAt = Date.now();
    copy.favorite = false;
    delete copy.doneAwarded;
    if (Number.isFinite(entry.order)) copy.order = entry.order + 0.5;
    state.entries.splice(state.entries.indexOf(entry) + 1, 0, copy);
    return copy;
  });
  commit();
  return copies;
}

/**
 * Alle gewählten Einträge endgültig löschen — wie deleteEntry in
 * src/data/mutations.js, nur mit einem Speichern am Ende. Was in einem
 * gelöschten Projekt lag, übernimmt dessen Orte.
 */
export function deleteEntries(entries) {
  const ids = new Set(entries.map((entry) => String(entry.id)));
  entries.forEach((entry) => {
    if (isContainer(entry)) liftChildren(entryRef(entry.id), entry.places);
    dropLinksTo(entry.id);
    dropProjectFromViews(entry.id);
  });
  state.entries = state.entries.filter((entry) => !ids.has(String(entry.id)));
  commit({ prunedEntries: true });
}
