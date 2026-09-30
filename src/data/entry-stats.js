/*
 * Die drei Kennzahlen oben in der Karte „Details“ eines Eintrags
 * (src/features/entry/entry-details.js). Die Zahlen dafür rechnet
 * src/data/entry-facts.js einmal aus und gibt sie als `facts` herein.
 * Pfad: src/data/entry-stats.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * statsByType -> welche drei Kennzahlen oben stehen, je Kategorie
 *                (Namen aus `stats` unten)
 */

import { dayMonth, formatNumber, shortDay } from "../core/format.js";
import { taskPriorityOf, taskStatusOf } from "./config-tasks.js";

/* Oben stehen bei einer Aufgabe Dringlichkeit, Datum und Status — wie
   gewünscht; die anderen Kategorien zeigen, was bei ihnen am meisten sagt. */
const statsByType = {
  aufgabe: ["priority", "date", "status"],
  termin: ["date", "time", "links"],
  projekt: ["entries", "openTasks", "doneTasks"],
  notiz: ["words", "reading", "opens"],
  dokument: ["words", "reading", "opens"],
  zeichnung: ["created", "links", "opens"],
  medien: ["created", "links", "opens"],
  lesezeichen: ["created", "links", "opens"],
};

/*
 * Die möglichen Kennzahlen: { value, label } und optional `color` (Farbe
 * des Wertes) und `field` (ein Tipp öffnet das Blatt bzw. die Datumsauswahl
 * dazu). Bei einer Aufgabe steht die Uhrzeit unter dem Datum, beim Termin hat
 * sie eine eigene Spalte — beide öffnen dieselbe Auswahl für Tag und Uhrzeit.
 */
const stats = {
  date: (entry) => ({
    value: entry.date ? shortDay(entry.date) : "—",
    label: entry.time && entry.type !== "termin" ? `${entry.time} Uhr` : entry.date ? "Datum" : "Kein Datum",
    field: "date",
  }),
  time: (entry) => ({ value: entry.time || "Ganztägig", label: "Uhrzeit", field: "date" }),
  status: (entry) => {
    const status = taskStatusOf(entry.status);
    return { value: status.label, label: "Status", color: status.color, field: "status" };
  },
  priority: (entry) => {
    const priority = taskPriorityOf(entry.priority);
    return { value: priority.label, label: "Dringlichkeit", color: priority.color, field: "priority" };
  },
  links: (entry, facts) => ({ value: formatNumber(facts.links), label: "Verknüpft" }),
  entries: (entry, facts) => ({ value: formatNumber(facts.content.length), label: "Einträge" }),
  openTasks: (entry, facts) => ({ value: formatNumber(facts.openTasks), label: "Offene Aufgaben" }),
  doneTasks: (entry, facts) => ({ value: formatNumber(facts.doneTasks), label: "Erledigt" }),
  words: (entry, facts) => ({ value: formatNumber(facts.words), label: facts.words === 1 ? "Wort" : "Wörter" }),
  reading: (entry, facts) => ({ value: facts.minutes ? `${facts.minutes} Min` : "—", label: "Lesezeit" }),
  opens: (entry, facts) => ({ value: formatNumber(facts.opens ? facts.opens.count : 0), label: "Mal geöffnet" }),
  created: (entry) => ({ value: entry.createdAt ? dayMonth(entry.createdAt) : "—", label: "Erstellt" }),
};

/** Die Namen der drei Kennzahlen eines Eintrags, von links nach rechts. */
export function statIdsOf(entry) {
  return statsByType[entry.type] || statsByType.notiz;
}

/** Die drei Kennzahlen als { value, label, color?, field? }. */
export function statsOf(entry, facts) {
  return statIdsOf(entry).map((id) => stats[id](entry, facts));
}
