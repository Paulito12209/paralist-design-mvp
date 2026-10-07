/*
 * Die Ziele der Desktop-Fassung an einer Stelle: die vier Seiten als Kacheln
 * oben in der Seitenleiste und die Listen, die man unter „Liste wechseln“ wählen kann,
 * jeweils mit ihrer Taste. Seitenleiste, Tastenkürzel und die Liste unter
 * Profil › Kurzbefehle lesen alle von hier — so können Schild, Kürzel und
 * Liste nie auseinanderlaufen. Liegt in src/ui/, weil Hülle und Profil sie brauchen.
 * Pfad: src/ui/desk-links.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pageLinks       -> die vier Seiten: Icon, Name, Buchstabe für ⇧⌘ (`letter`,
 *                    `code` ist dieselbe Taste ohne Rücksicht auf die
 *                    Tastaturbelegung), die alte Ziffer `key` und welche Zahl
 *                    die Vorlesehilfe dazu sagt
 * listLinks       -> die Listen unter „Liste wechseln“ in der Seitenleiste, in der
 *                    Reihenfolge des Menüs: `num` ist die Ziffer im Menü und
 *                    für ⌃ (Strg-Ersatz außerhalb des Macs: Alt), `key` die
 *                    Taste nach „G“, `tone` die Farbe des Icons und der
 *                    Färbung der Seitenleiste (die Icon-Farben stehen in
 *                    styles/desk-nav.css), `create` was ein
 *                    Klick in die freie Fläche anlegt (fehlt es, legt die Liste
 *                    nichts an), `add` die Beschriftung der blassen Zeile dafür
 *                    unter dem letzten Eintrag („Neues Projekt“, wie „New Tab“ in Arc);
 *                    `cut: true` zieht vor der Zeile den Strich im Menü
 * listKey         -> Buchstabe für ⇧⌘, der das Menü „Liste wechseln“ öffnet
 *                    (nur ⌘L übernähme in manchen Browsern die Adresszeile)
 * sideLink        -> Buchstabe für ⇧⌘, der das Seitenfenster rechts auf- und zuklappt
 * chordKey        -> die Taste, nach der ein Buchstabe eine Liste wählt
 * chordWindow     -> wie lange nach „G“ der Buchstabe noch zählt (Millisekunden)
 */

import { bookmarksPage, projectsPage } from "../data/collections.js";
import { archivePage, inboxPick, overviewPages, resourcePick } from "../data/config.js";

export const chordKey = "G";
export const chordWindow = 1200;

/* Die vier Seiten. `count` holt eine Zahl aus deskStats(); sie wird nur
   vorgelesen, damit die Kacheln ruhig bleiben. ⌘K bleibt die Suche, darum
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

/* Das Menü „Liste wechseln“ öffnet ⇧⌘L; darin wählt die Ziffer. */
export const listKey = "L";
/* Dieselbe Taste in der Form, die src/shell/desk-combos.js prüft. */
export const listSwitch = { letter: listKey, code: `Key${listKey}` };

/*
 * Die Listen unter „Liste wechseln“: oben die vier Ablagen (Projekte, Arbeitsbereiche,
 * Ressourcen, Archiv), nach dem Strich das Laufende (Eingang, Aufgaben,
 * Termine, Lesezeichen). `overview` ist die Nummer aus overviewPages,
 * `target` ein eigener Weg (Seite Projekte, Archiv, Lesezeichen) oder der
 * Reiter (Aufgaben, Kalender).
 */
export const listLinks = [
  { id: "projects", num: "1", key: "P", tone: "project", target: "projects", title: projectsPage.title, icon: "rocket", create: "projekt", add: "Neues Projekt" },
  { id: "workspaces", num: "2", key: "B", tone: "workspace", overview: "3", create: "arbeitsbereich", add: "Neuer Arbeitsbereich" },
  { id: "resources", num: "3", key: "R", tone: "resource", overview: "4", create: resourcePick.id, add: "Neue Ressource" },
  { id: "archive", num: "4", key: "A", tone: "archive", target: "archive", title: archivePage.title, icon: "archive", quiet: true },
  { id: "inbox", num: "5", key: "I", tone: "inbox", overview: "1", create: inboxPick, add: "Neuer Eintrag", cut: true },
  { id: "tasks", num: "6", key: "U", tone: "task", target: "tasks", title: "Aufgaben", icon: "task", create: "aufgabe", add: "Neue Aufgabe" },
  { id: "events", num: "7", key: "T", tone: "event", target: "calendar", title: "Termine", icon: "calendar", create: "termin", add: "Neuer Termin" },
  { id: "bookmarks", num: "8", key: "L", tone: "bookmark", target: "bookmarks", title: bookmarksPage.title, icon: "bookmark", create: "lesezeichen", add: "Neues Lesezeichen" },
].map((link) => {
  const source = link.overview ? overviewPages[link.overview] : link;
  return { ...link, title: source.title, icon: source.icon };
});

/** Eine Liste nach ihrer Kennung; ohne Treffer die erste (Projekte). */
export function listLink(id) {
  return listLinks.find((link) => link.id === id) || listLinks[0];
}

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
