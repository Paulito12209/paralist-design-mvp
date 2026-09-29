/*
 * Die Ziele der Desktop-Fassung an einer Stelle: die vier Reiter oben und die
 * Sammlungen in der Seitenleiste, jeweils mit ihrer Taste. Reiterzeile,
 * Seitenleiste und die Tastenkürzel lesen alle von hier — so können Schild und
 * Kürzel nie auseinanderlaufen.
 * Pfad: src/shell/desk-links.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pageLinks       -> die vier Reiter oben: Icon, Name, Taste und welche Zahl
 *                    die Vorlesehilfe dazu sagt
 * collectionLinks -> die Sammlungen links, von oben nach unten: welche Seite,
 *                    Taste nach „G“ und welche Farbe das Icon trägt (die Farben
 *                    selbst stehen in styles/desk-nav.css)
 * chordKey        -> die Taste, nach der ein Buchstabe eine Sammlung öffnet
 * chordWindow     -> wie lange nach „G“ der Buchstabe noch zählt (Millisekunden)
 */

import { moreCards } from "../data/collections.js";
import { overviewPages } from "../data/config.js";

export const chordKey = "G";
export const chordWindow = 1200;

/* Die vier Reiter. `count` holt eine Zahl aus deskStats(); sie wird nur
   vorgelesen, damit die Reiterzeile ruhig bleibt. */
export const pageLinks = [
  { tab: "home", label: "Übersicht", icon: "grid", key: "1" },
  {
    tab: "calendar",
    label: "Kalender",
    icon: "calendar",
    key: "2",
    count: (stats) => stats.today,
    spoken: (value) => (value === 1 ? "1 Termin heute" : `${value} Termine heute`),
  },
  {
    tab: "tasks",
    label: "Aufgaben",
    icon: "checklist",
    key: "3",
    count: (stats) => stats.openTasks,
    spoken: (value) => (value === 1 ? "1 offene Aufgabe" : `${value} offene Aufgaben`),
  },
  { tab: "media", label: "Medien", icon: "photos", key: "4" },
];

function moreCard(id) {
  return moreCards.find((card) => card.id === id);
}

/*
 * Die Sammlungen. `overview` ist die Nummer aus overviewPages, `target` ein
 * eigener Weg (Lesezeichen, Archiv). `tone` wählt die Icon-Farbe.
 */
export const collectionLinks = [
  { id: "1", overview: "1", key: "I", tone: "inbox" },
  { id: "2", overview: "2", key: "F", tone: "star" },
  { id: "3", overview: "3", key: "P", tone: "project" },
  { id: "4", overview: "4", key: "R", tone: "resource" },
  { id: "bookmarks", target: "bookmarks", key: "L", tone: "bookmark" },
  { id: "archive", target: "archive", key: "A", tone: "archive", quiet: true },
].map((link) => {
  const source = link.overview ? overviewPages[link.overview] : moreCard(link.id);
  return { ...link, title: source.title, icon: source.icon };
});

/* Was noch kommt: dieselben Karten, die am Handy „Demnächst verfügbar“ zeigen. */
export const soonLinks = moreCards.filter((card) => card.soon);

/* Mac-Tastaturen zeigen ⌘, alle anderen „Strg“. */
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Die Befehlstaste als Text fürs Schild: „⌘K“ am Mac, „Strg K“ sonst. */
export function withCommand(key) {
  return isMac ? `⌘${key}` : `Strg ${key}`;
}
