/*
 * Die Ziele der Desktop-Fassung an einer Stelle: die vier Seiten als Icons
 * oben in der Seitenleiste und die Sammlungen darunter, jeweils mit ihrer
 * Taste. Seitenleiste, Tastenkürzel und die Liste unter Profil › Kurzbefehle
 * lesen alle von hier — so können Schild, Kürzel und Liste nie
 * auseinanderlaufen. Liegt in src/ui/, weil Hülle und Profil sie brauchen.
 * Pfad: src/ui/desk-links.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pageLinks       -> die vier Seiten: Icon, Name, Buchstabe für ⇧⌘ (`letter`,
 *                    `code` ist dieselbe Taste ohne Rücksicht auf die
 *                    Tastaturbelegung), die alte Ziffer `key` und welche Zahl
 *                    die Vorlesehilfe dazu sagt
 * collectionLinks -> die Sammlungen links, von oben nach unten: welche Seite,
 *                    Taste nach „G“ und welche Farbe das Icon trägt (die Farben
 *                    selbst stehen in styles/desk-nav.css); `nav: false` hat
 *                    ein Kürzel, aber keine eigene Zeile (Projekte stehen als
 *                    Gruppe darunter); `num` ist die Ziffer für ⌃ (Strg-Ersatz
 *                    außerhalb des Macs: Alt)
 * sideLink        -> Buchstabe für ⇧⌘, der das Seitenfenster rechts auf- und zuklappt
 * chordKey        -> die Taste, nach der ein Buchstabe eine Sammlung öffnet
 * chordWindow     -> wie lange nach „G“ der Buchstabe noch zählt (Millisekunden)
 */

import { moreCards, projectsPage } from "../data/collections.js";
import { overviewPages } from "../data/config.js";

export const chordKey = "G";
export const chordWindow = 1200;

/* Die vier Seiten. `count` holt eine Zahl aus deskStats(); sie wird nur
   vorgelesen, damit die Icon-Zeile ruhig bleibt. ⌘K bleibt die Suche, darum
   tragen die Seiten ⇧⌘ — ⌘N, ⌘M und ⌘A fängt der Browser selbst ab. */
export const pageLinks = [
  { tab: "home", label: "Übersicht", icon: "grid", key: "1", letter: "Ü", code: "BracketLeft" },
  {
    tab: "calendar",
    label: "Kalender",
    icon: "calendar",
    key: "2",
    letter: "K",
    code: "KeyK",
    count: (stats) => stats.today,
    spoken: (value) => (value === 1 ? "1 Termin heute" : `${value} Termine heute`),
  },
  {
    tab: "tasks",
    label: "Aufgaben",
    icon: "checklist",
    key: "3",
    letter: "A",
    code: "KeyA",
    count: (stats) => stats.openTasks,
    spoken: (value) => (value === 1 ? "1 offene Aufgabe" : `${value} offene Aufgaben`),
  },
  { tab: "media", label: "Medien", icon: "photos", key: "4", letter: "M", code: "KeyM" },
];

/* Das Seitenfenster rechts (src/shell/desk-side.js): ⇧⌘O wie „Öffnen“. */
export const sideLink = { label: "Seitenfenster", letter: "O", code: "KeyO" };

function moreCard(id) {
  return moreCards.find((card) => card.id === id);
}

/*
 * Die Sammlungen. `overview` ist die Nummer aus overviewPages, `target` ein
 * eigener Weg (Lesezeichen, Archiv, Projekte). `tone` wählt die Icon-Farbe.
 */
export const collectionLinks = [
  { id: "1", overview: "1", key: "I", num: "1", tone: "inbox" },
  { id: "2", overview: "2", key: "F", num: "2", tone: "star" },
  { id: "3", overview: "3", key: "B", num: "3", tone: "workspace" },
  { id: "4", overview: "4", key: "R", num: "4", tone: "resource" },
  { id: "bookmarks", target: "bookmarks", key: "L", num: "5", tone: "bookmark" },
  { id: "archive", target: "archive", key: "A", num: "6", tone: "archive", quiet: true },
  { id: "projects", target: "projects", key: "P", num: "7", tone: "project", nav: false },
].map((link) => {
  const source = link.overview ? overviewPages[link.overview] : link.target === "projects" ? projectsPage : moreCard(link.id);
  return { ...link, title: source.title, icon: source.icon || "rocket" };
});

/* Was noch kommt: dieselben Karten, die am Handy „Demnächst verfügbar“ zeigen. */
export const soonLinks = moreCards.filter((card) => card.soon);

/* Mac-Tastaturen zeigen ⌘, alle anderen „Strg“. */
export const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Die Befehlstaste als Text fürs Schild: „⌘K“ am Mac, „Strg K“ sonst. */
export function withCommand(key) {
  return isMac ? `⌘${key}` : `Strg ${key}`;
}

/** Umschalt und Befehlstaste: „⇧⌘K“ am Mac, „Strg ⇧ K“ sonst. */
export function withShiftCommand(key) {
  return isMac ? `⇧⌘${key}` : `Strg ⇧ ${key}`;
}

/** Ctrl und Ziffer für die Sammlungen: „⌃1“ am Mac, „Alt 1“ sonst (Strg 1 wechselt dort den Browser-Tab). */
export function withControl(num) {
  return isMac ? `⌃${num}` : `Alt ${num}`;
}

/** Dasselbe als aria-keyshortcuts („Shift+Meta+K“, „Control+1“). */
export function spokenKeys(text) {
  return text.replace("⇧⌘", "Shift+Meta+").replace("⌘", "Meta+").replace("⌃", "Control+").replace("Strg ⇧ ", "Control+Shift+").replace("Strg ", "Control+").replace("Alt ", "Alt+");
}
