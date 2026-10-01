/*
 * Die drei Kennzahlen oben in der Karte „Details“ eines Eintrags
 * (src/features/entry/entry-details.js). Die Zahlen dafür rechnet
 * src/data/entry-facts.js einmal aus und gibt sie als `facts` herein.
 *
 * Die Regel: links, was der Eintrag ist (Umfang, Herkunft), in der Mitte
 * die Zeit, rechts wie es um ihn steht. Aufgabe, Projekt und Termin haben
 * eine Zeit, bis zu der sie dran sind — links Dringlichkeit, in der Mitte
 * die Fälligkeit (beim Termin sein Tag mit Uhrzeit), rechts der Status.
 * Alle anderen tragen in der Mitte die Erinnerung. Warum welche Kategorie
 * links und rechts was zeigt, steht in docs/details-faelligkeit-erinnerung-plan.md.
 * Pfad: src/data/entry-stats.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * statsByType -> welche drei Kennzahlen oben stehen, je Kategorie
 *                (Namen aus `stats` unten), von links nach rechts
 * siteLabels  -> Beschriftung unter der Website eines Lesezeichens, je Karten-Art
 * overdueColor -> Farbe einer überfälligen Fälligkeit (wie die Dringlichkeit „Jetzt“)
 * quietColor   -> Farbe von „—“ und einer erledigten Fälligkeit: gedämpft
 */

import { dayKey, dayShift, startOfDay } from "../core/dates.js";
import { dayMonth, formatNumber, shortDay } from "../core/format.js";
import { isTaskDone, statusOf, taskPriorityOf } from "./config-tasks.js";
import { hostOf } from "./link-kinds.js";
import { parseBlocks } from "./note-blocks.js";

const statsByType = {
  aufgabe: ["priority", "due", "status"],
  projekt: ["priority", "due", "status"],
  termin: ["priority", "day", "status"],
  notiz: ["words", "remind", "edited"],
  dokument: ["words", "remind", "status"],
  zeichnung: ["created", "remind", "edited"],
  medien: ["created", "remind", "links"],
  lesezeichen: ["site", "remind", "opens"],
};

const siteLabels = { link: "Website", video: "Video", place: "Standort" };
const overdueColor = "var(--prio-jetzt)";
const quietColor = "var(--muted)";

const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;

/** Ist die Fälligkeit vorbei? Erst am Tag danach — am Tag selbst ist nichts überfällig. */
export function isOverdue(entry) {
  return Boolean(entry.date) && !isTaskDone(entry) && entry.date < dayKey(new Date());
}

/*
 * Wie frisch etwas ist (auch für „Geändert“ eines Arbeitsbereichs), so knapp, dass es in die rechte Spalte passt (rund
 * zehn Zeichen auf 375 px): „jetzt“, „vor 5 Min“, „vor 3 Std“, „gestern“,
 * danach der Tag wie „26. Sept.“.
 */
export function freshness(ts) {
  const ago = Date.now() - ts;
  if (ago < MS_PER_MINUTE) return "jetzt";
  if (ago < MS_PER_HOUR) return `vor ${Math.floor(ago / MS_PER_MINUTE)} Min`;
  const day = startOfDay(ts);
  const today = startOfDay(Date.now());
  if (day === today) return `vor ${Math.floor(ago / MS_PER_HOUR)} Std`;
  if (day === dayShift(today, -1)) return "gestern";
  return dayMonth(ts);
}

/** Kennzahl „Erinnerung“ — auch für den Arbeitsbereich (src/data/workspace-facts.js). */
export function remindStat(subject) {
  const set = Number.isFinite(subject.remindAt);
  return {
    value: set ? shortDay(dayKey(new Date(subject.remindAt))) : "—",
    label: "Erinnerung",
    color: set ? "" : quietColor,
    field: "remind",
  };
}

/* Die erste Karte mit Adresse im Inhalt eines Lesezeichens */
function siteBlock(entry) {
  return parseBlocks(entry.body || "").find((block) => block.url) || null;
}

/*
 * Die möglichen Kennzahlen: { value, label } und optional `color` (Farbe
 * des Wertes) und `field` (ein Tipp öffnet das Blatt bzw. die Auswahl
 * dazu — "status", "priority", "date" oder "remind").
 */
const stats = {
  priority: (entry) => {
    const priority = taskPriorityOf(entry.priority);
    return { value: priority.label, label: "Dringlichkeit", color: priority.color, field: "priority" };
  },
  /* Fälligkeit: nur der Tag — die Uhrzeit steht im Abschnitt „Zeit“ darunter */
  due: (entry) => {
    const overdue = isOverdue(entry);
    const quiet = !entry.date || isTaskDone(entry);
    return {
      value: entry.date ? shortDay(entry.date) : "—",
      label: overdue ? "Überfällig" : "Fälligkeit",
      color: overdue ? overdueColor : quiet ? quietColor : "",
      field: "date",
    };
  },
  /* Ein Termin ist nicht fällig, er findet statt: der Tag oben, die Uhrzeit darunter */
  day: (entry) => ({
    value: entry.date ? shortDay(entry.date) : "—",
    label: entry.time ? `${entry.time} Uhr` : "Ganztägig",
    field: "date",
  }),
  status: (entry) => {
    const status = statusOf(entry);
    return { value: status.label, label: "Status", color: status.color, field: "status" };
  },
  remind: (entry) => remindStat(entry),
  words: (entry, facts) => ({ value: formatNumber(facts.words), label: facts.words === 1 ? "Wort" : "Wörter" }),
  created: (entry) => ({ value: entry.createdAt ? dayMonth(entry.createdAt) : "—", label: "Erstellt" }),
  /* Nie bearbeitet heißt: so frisch wie beim Anlegen */
  edited: (entry) => {
    const at = entry.editedAt || entry.createdAt;
    return { value: at ? freshness(at) : "—", label: "Bearbeitet" };
  },
  links: (entry, facts) => ({ value: formatNumber(facts.links), label: "Verknüpft" }),
  opens: (entry, facts) => {
    const count = facts.opens ? facts.opens.count : 0;
    return { value: `${formatNumber(count)}-mal`, label: "Geöffnet" };
  },
  site: (entry) => {
    const block = siteBlock(entry);
    return {
      value: (block && hostOf(block.url)) || "—",
      label: (block && siteLabels[block.kind]) || siteLabels.link,
    };
  },
};

/** Die Namen der drei Kennzahlen eines Eintrags, von links nach rechts. */
export function statIdsOf(entry) {
  return statsByType[entry.type] || statsByType.notiz;
}

/** Die drei Kennzahlen als { value, label, color?, field? }. */
export function statsOf(entry, facts) {
  return statIdsOf(entry).map((id) => stats[id](entry, facts));
}
