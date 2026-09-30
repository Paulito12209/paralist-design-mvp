/*
 * Was die Karte „Details“ am Ende der Seite eines Eintrags zeigt
 * (src/features/entry/entry-details.js): oben drei Kennzahlen nebeneinander,
 * darunter Abschnitte mit Zeilen. Nur Angaben, die die App wirklich hat —
 * fehlt ein Wert, fällt die Zeile weg.
 *
 * „Zeit“ steht zuerst, weil man dort etwas tut: die Fälligkeit mit Uhrzeit
 * und die Erinnerung (src/data/reminders.js) lassen sich antippen.
 *
 * „Nutzung“ und „Verlauf“ sollen ein Gefühl dafür geben, wie viel Zeit und
 * Aufmerksamkeit eine Seite bekommt: wie oft man sie öffnet, wie lange man
 * darauf verbringt, wie lange eine Aufgabe schon offen ist. Gemessene Zeit
 * gibt es erst ab dem Stand, der sie misst (src/data/usage.js).
 * Pfad: src/data/entry-facts.js
 *
 * Keine anpassbaren Werte: welche drei Kennzahlen oben stehen, legt
 * src/data/entry-stats.js fest.
 */

import { MS_PER_DAY, parseDay, startOfDay } from "../core/dates.js";
import { dayClock, dayWord, formatNumber, formatSpan, relativeTime } from "../core/format.js";
import { isTaskDone, isTimeType } from "./config-tasks.js";
import { entryTypeName } from "./details.js";
import { statIdsOf, statsOf } from "./entry-stats.js";
import { linkedEntries } from "./links.js";
import { openStats } from "./opens.js";
import { charCount, hasPageBody, readingMinutes, wordCount } from "./page-text.js";
import { entriesOf, isContainer, placesLabel } from "./queries.js";
import { BOOKMARK_TYPE } from "./bookmarks.js";
import { parseBlocks } from "./note-blocks.js";
import { entryRef } from "./refs.js";
import { dueTime, hasReminder, reminderChoice } from "./reminders.js";
import { entryUsage } from "./usage.js";

/* Ganze Tage zwischen zwei Zeitpunkten, nach Kalendertagen gezählt */
function daysBetween(from, to) {
  return Math.max(0, Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY));
}

/* „in 3 Tagen“, „seit 1 Tag“ — nach in, vor, seit und nach heißt es Tagen, nicht Tage */
function daysAfterPreposition(days) {
  return days === 1 ? "1 Tag" : `${formatNumber(days)} Tagen`;
}

/* Gemessene Zeit in Worten; eine angefangene Minute heißt „unter 1 Min“ statt „0 Min“ */
function spentText(seconds) {
  return seconds < 60 ? "unter 1 Min" : formatSpan(seconds);
}

/* Alles, was die Kennzahlen und Zeilen brauchen — einmal berechnet */
function collect(entry) {
  const words = entry.type === "medien" ? 0 : wordCount(entry);
  /* Nur ein Titel ist kein Text: dann keine Lesezeit und kein Abschnitt „Text“ */
  const hasBody = hasPageBody(entry);
  const content = isContainer(entry) ? entriesOf(entryRef(entry.id)) : [];
  const tasks = content.filter((item) => item.type === "aufgabe");
  return {
    words,
    hasBody,
    chars: charCount(entry),
    minutes: hasBody ? readingMinutes(words) : 0,
    links: linkedEntries(entry).length,
    content,
    openTasks: tasks.filter((task) => !isTaskDone(task)).length,
    doneTasks: tasks.filter((task) => isTaskDone(task)).length,
    opens: openStats("entry", entry.id),
    seconds: entryUsage(entry.id),
  };
}

/*
 * Abschnitt „Zeit“: die Fälligkeit mit Uhrzeit (oben steht nur der Tag) und
 * die Erinnerung — beide antippbar (edit: "date" öffnet die Auswahl,
 * "remind" das Blatt „Erinnerung“). Bei Aufgabe, Projekt und Termin steht
 * die Erinnerung immer da, sonst gäbe es keinen Weg zu „1 Stunde vorher“;
 * bei den anderen nur, wenn eine gesetzt ist — gesetzt wird sie oben.
 */
function timeRows(entry) {
  const rows = [];
  const timed = isTimeType(entry.type);
  if (timed && entry.type !== "termin" && entry.date) {
    const due = dueTime(entry);
    rows.push({ label: "Fällig am", value: entry.time ? dayClock(due) : dayWord(due), edit: "date" });
  }
  if (!timed && !hasReminder(entry)) return rows;
  const choice = reminderChoice(entry);
  const value = choice ? choice.label : hasReminder(entry) ? dayClock(entry.remindAt) : "Keine";
  rows.push({ label: "Erinnerung", value, edit: "remind" });
  return rows;
}

/* Abschnitt „Text“: Zeichen, Wörter, Lesezeit — nur mit Text und nur, was oben noch fehlt */
function textRows(facts, shown) {
  if (!facts.hasBody) return [];
  const rows = [{ label: "Zeichen", value: formatNumber(facts.chars) }];
  if (!shown.has("words")) rows.push({ label: "Wörter", value: formatNumber(facts.words) });
  if (!shown.has("reading") && facts.minutes) rows.push({ label: "Lesezeit", value: `etwa ${facts.minutes} Min` });
  return rows;
}

/* Abschnitt „Nutzung“: Zeit auf der Seite, Besuche, Bearbeitung */
function usageRows(entry, facts, shown) {
  const rows = [];
  const count = facts.opens ? facts.opens.count : 0;
  if (facts.seconds) rows.push({ label: "Zeit auf dieser Seite", value: spentText(facts.seconds) });
  if (count && !shown.has("opens")) rows.push({ label: "Geöffnet", value: count === 1 ? "1-mal" : `${formatNumber(count)}-mal` });
  if (count > 1 && facts.seconds >= 60) rows.push({ label: "Im Schnitt je Besuch", value: spentText(facts.seconds / count) });
  if (facts.opens && facts.opens.prev) rows.push({ label: "Besuch davor", value: relativeTime(facts.opens.prev) });
  if (entry.editedAt && !shown.has("edited")) rows.push({ label: "Zuletzt bearbeitet", value: relativeTime(entry.editedAt) });
  return rows;
}

/* Abschnitt „Verlauf“: seit wann es den Eintrag gibt, wie lange eine Aufgabe dauert */
function historyRows(entry) {
  const rows = [];
  if (entry.createdAt) rows.push({ label: "Erstellt", value: relativeTime(entry.createdAt) });
  if (entry.type === "aufgabe" && entry.createdAt) {
    if (isTaskDone(entry) && entry.doneAt) {
      const days = daysBetween(entry.createdAt, entry.doneAt);
      rows.push({ label: "Erledigt nach", value: days ? daysAfterPreposition(days) : "am selben Tag" });
    } else {
      const days = daysBetween(entry.createdAt, Date.now());
      rows.push({ label: "Offen seit", value: days ? daysAfterPreposition(days) : "heute" });
    }
  }
  if (entry.type === "termin" && entry.date) {
    const days = Math.round((parseDay(entry.date).getTime() - startOfDay(Date.now())) / MS_PER_DAY);
    const value = days === 0 ? "heute" : days > 0 ? `in ${daysAfterPreposition(days)}` : `vor ${daysAfterPreposition(-days)}`;
    rows.push({ label: days < 0 ? "Termin war" : "Bis zum Termin", value });
  }
  return rows;
}

/* Abschnitt „Ablage“: wo der Eintrag liegt und womit er verbunden ist */
function placeRows(entry, facts, shown) {
  const rows = [
    { label: "Typ", value: entryTypeName(entry) },
    { label: "Speicherort", value: placesLabel(entry) },
  ];
  if (isContainer(entry) && !shown.has("entries")) rows.push({ label: "Einträge", value: formatNumber(facts.content.length) });
  /* Beim Projekt stehen oben Dringlichkeit, Fälligkeit und Status — wie weit
     es ist, sagen hier seine Aufgaben */
  if (facts.openTasks || facts.doneTasks) {
    rows.push({ label: "Offene Aufgaben", value: formatNumber(facts.openTasks) });
    rows.push({ label: "Erledigte Aufgaben", value: formatNumber(facts.doneTasks) });
  }
  if (!isContainer(entry) && !shown.has("links")) rows.push({ label: "Verknüpfungen", value: formatNumber(facts.links) });
  if (entry.favorite) rows.push({ label: "Favorit", value: "Ja" });
  return rows;
}

/* Abschnitt „Link“ eines Lesezeichens: die Adresse seiner Karte, zum Ändern
   antippbar (edit: "link", siehe src/features/entry/entry-details.js) */
function linkRows(entry) {
  if (entry.type !== BOOKMARK_TYPE) return [];
  const block = parseBlocks(entry.body || "").find((item) => item.url);
  return block ? [{ label: "Adresse", value: block.url, edit: "link" }] : [];
}

/**
 * Alles für die Karte „Details“ eines Eintrags.
 * @returns { stats: [{ value, label, color?, field? }] (immer drei),
 *            groups: [{ heading, rows: [{ label, value, edit? }] }] (leere fallen weg) }
 */
export function entryFacts(entry) {
  const facts = collect(entry);
  const ids = statIdsOf(entry);
  const shown = new Set(ids);
  const groups = [
    { heading: "Link", rows: linkRows(entry) },
    { heading: "Zeit", rows: timeRows(entry) },
    { heading: "Text", rows: textRows(facts, shown) },
    { heading: "Nutzung", rows: usageRows(entry, facts, shown) },
    { heading: "Verlauf", rows: historyRows(entry) },
    { heading: "Ablage", rows: placeRows(entry, facts, shown) },
  ].filter((group) => group.rows.length);
  return { stats: statsOf(entry, facts), groups };
}
