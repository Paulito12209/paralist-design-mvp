/*
 * Demo-Daten zum Testen mit „vollem Speicher“: rund 30 Einträge aller Typen,
 * Projekte in jeder Board-Spalte, Arbeitsbereiche in zwei Tabs, Ressourcen,
 * Archiviertes, Favoriten und absichtlich überlange Titel. Geladen wird die
 * Datei nur über die Adresse „?demo=1“ (src/shell/demo-load.js) — im
 * normalen Betrieb holt sie niemand.
 *
 * Die Datei baut nur den gespeicherten Stand als Objekt; Felder, die hier
 * fehlen (Cover, Icon, Status-Vorgaben, XP), ergänzt die Migration beim
 * nächsten Start (src/data/migrate.js, loadState in src/data/state.js).
 * Pfad: src/data/demo-data.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * demoTabs        -> die Tabs der Übersicht
 * demoWorkspaces  -> die Arbeitsbereiche (Name, Tab, Favorit, archiviert)
 * demoEntries     -> die Einträge; „days“ = wie viele Tage vor heute angelegt,
 *                    „due“ = Fälligkeit bzw. Termintag in Tagen ab heute
 * longWord        -> Titel aus einem einzigen sehr langen Wort (prüft den Umbruch)
 */

import { MS_PER_DAY, dayKey } from "../core/dates.js";

const demoTabs = [
  { id: 1, name: "Meine", awarded: true },
  { id: 2, name: "Arbeit", awarded: true },
];

const demoWorkspaces = [
  { id: 1, name: "Studium", tab: 1, favorite: true, body: "Alles rund ums Semester." },
  { id: 2, name: "Haushalt", tab: 1 },
  { id: 3, name: "Fitness & Gesundheit", tab: 1 },
  { id: 4, name: "Website-Relaunch", tab: 2, favorite: true, body: "Neuer Auftritt bis Jahresende." },
  { id: 5, name: "Kundenprojekte mit sehr langem Namen, der in keine Zeile passt", tab: 2 },
  { id: 6, name: "Altes Ehrenamt", tab: 1, archived: true },
];

const longWord = "Donaudampfschifffahrtsgesellschaftskapitänsmützenreinigungsunternehmen";

/*
 * Kurzschreibweise: `in` sind die Ablageorte als Verweise („w:1“ =
 * Arbeitsbereich 1, „e:20“ = Projekt mit id 20), `link` die ids verknüpfter
 * Einträge — Projekte sind nur Ablageort und lassen sich nicht verknüpfen.
 * Die ids stehen fest, damit Verweise untereinander stimmen.
 */
const demoEntries = [
  /* Projekte: Status-Spalten und Dringlichkeiten verteilt, eins archiviert */
  { id: 20, type: "projekt", title: "Umzug nach Leipzig", status: "inArbeit", priority: "jetzt", due: 21, in: ["w:2"], favorite: true, days: 20 },
  { id: 21, type: "projekt", title: "Bachelorarbeit", status: "offen", priority: "next", due: 60, in: ["w:1"], days: 40 },
  { id: 22, type: "projekt", title: "Neue Startseite gestalten", status: "inArbeit", priority: "next", in: ["w:4"], days: 12 },
  { id: 23, type: "projekt", title: "Marathon-Vorbereitung", status: "offen", priority: "spaeter", in: ["w:3"], days: 30 },
  { id: 24, type: "projekt", title: "Fotobuch Sommerurlaub", status: "offen", priority: "irgendwann", days: 50 },
  { id: 25, type: "projekt", title: "Steuererklärung 2025", status: "erledigt", priority: "jetzt", days: 70 },
  { id: 26, type: "projekt", title: "Ein Projekt mit einem sehr langen Titel, damit man sieht, wie Karten im Board und Zeilen in der Liste damit umgehen", status: "offen", priority: "next", in: ["w:5"], days: 8 },
  { id: 27, type: "projekt", title: "Altes Vereinsfest", status: "erledigt", priority: "spaeter", in: ["w:6"], archived: true, days: 200 },

  /* Aufgaben: mit und ohne Fälligkeit, überfällig, erledigt, archiviert */
  { id: 1, type: "aufgabe", title: "Umzugskartons besorgen", status: "offen", priority: "jetzt", due: 0, time: "17:00", in: ["e:20"], days: 6 },
  { id: 2, type: "aufgabe", title: "Nachsendeauftrag stellen", status: "offen", priority: "next", due: 3, in: ["e:20"], days: 5 },
  { id: 3, type: "aufgabe", title: "Gliederung mit Betreuerin abstimmen", status: "inArbeit", priority: "jetzt", due: -2, in: ["e:21"], days: 14 },
  { id: 4, type: "aufgabe", title: "Literaturliste ergänzen", status: "offen", priority: "spaeter", in: ["e:21", "w:1"], days: 10 },
  { id: 5, type: "aufgabe", title: "Farben und Schriften für die Startseite festlegen", status: "erledigt", priority: "next", in: ["e:22"], days: 4, doneToday: true },
  { id: 6, type: "aufgabe", title: "Bad putzen", status: "offen", priority: "irgendwann", in: ["w:2"], days: 2 },
  { id: 7, type: "aufgabe", title: "Laufschuhe zur Reparatur bringen", status: "offen", priority: "spaeter", due: 7, in: ["e:23"], days: 1 },
  { id: 8, type: "aufgabe", title: "Eine Aufgabe mit sehr langem Titel, der über mehrere Zeilen geht und zeigt, ob Haken, Fälligkeit und Menü noch Platz haben", status: "offen", priority: "next", due: 1, days: 3 },
  { id: 9, type: "aufgabe", title: longWord, status: "offen", priority: "spaeter", days: 2 },
  { id: 10, type: "aufgabe", title: "Rechnung vom Elektriker bezahlen", status: "erledigt", priority: "jetzt", archived: true, days: 25 },

  /* Termine */
  { id: 30, type: "termin", title: "Zahnarzt", due: 0, time: "15:30", days: 9 },
  { id: 31, type: "termin", title: "Kolloquium", due: 2, time: "10:00", in: ["w:1"], link: [44, 63], days: 15 },
  { id: 32, type: "termin", title: "Übergabe alte Wohnung", due: 18, time: "09:00", in: ["e:20"], days: 7 },
  { id: 33, type: "termin", title: "Abstimmung mit der Agentur über Bildsprache, Texte und den Zeitplan für den Start im Dezember", due: 1, time: "14:00", in: ["w:4"], days: 4 },

  /* Notizen, Dokumente, Zeichnung — zugleich die Ressourcen */
  { id: 40, type: "notiz", title: "Einkaufsliste", body: "- [ ] Hafermilch\n- [x] Brot\n- [ ] Tomaten", favorite: true, days: 0 },
  { id: 41, type: "notiz", title: "Ideen für die Startseite", body: "Großes Bild oben, darunter drei Kacheln.", in: ["e:22"], link: [5, 50], days: 11 },
  { id: 42, type: "notiz", title: "Trainingsplan Woche 1–4", body: "Mo Intervall, Mi locker, Sa lang.", in: ["e:23"], days: 29 },
  { id: 43, type: "notiz", title: longWord + "Notizbuch", days: 1 },
  { id: 44, type: "dokument", title: "Exposé Bachelorarbeit", status: "fertig", body: "Fragestellung, Methode, Zeitplan.", in: ["e:21"], days: 35 },
  { id: 45, type: "dokument", title: "Mietvertrag Leipzig", status: "geprueft", in: ["e:20"], favorite: true, days: 16 },
  { id: 46, type: "dokument", title: "Protokoll Teamtreffen", status: "entwurf", in: ["w:5"], archived: true, days: 90 },
  { id: 47, type: "zeichnung", title: "Skizze Wohnzimmer", in: ["e:20"], days: 13 },

  /* Lesezeichen: Link, Video, Ort */
  { id: 50, type: "lesezeichen", title: "MDN Web Docs", body: "::link https://developer.mozilla.org | MDN Web Docs", in: ["w:4"], days: 17 },
  { id: 51, type: "lesezeichen", title: "Laufband-Tutorial", body: "::video https://www.youtube.com/watch?v=M7lc1UVf-VE | Laufband-Tutorial", in: ["w:3"], days: 22 },
  { id: 52, type: "lesezeichen", title: "Leipzig Hauptbahnhof", body: "::ort https://maps.google.com/?q=Leipzig+Hauptbahnhof | Leipzig Hauptbahnhof", favorite: true, days: 19 },

  /* Medien ohne echte Datei: Farbfläche bzw. Platzhalter aus styles/media.css */
  { id: 60, type: "medien", title: "Foto Balkon", media: { kind: "image", sample: 1 }, days: 0 },
  { id: 61, type: "medien", title: "Foto Wohnzimmer", media: { kind: "image", sample: 3 }, in: ["e:20"], days: 1 },
  { id: 62, type: "medien", title: "Video Probelauf", media: { kind: "video", sample: 8, duration: 42 }, in: ["w:3"], days: 6 },
  { id: 63, type: "medien", title: "Sprachmemo Kolloquium", media: { kind: "audio", duration: 95 }, in: ["w:1"], days: 3 },
  { id: 64, type: "medien", title: "Lebenslauf.pdf", media: { kind: "doc" }, days: 33 },
];

/* Was ein Eintrag immer hat — wie beim Anlegen in src/data/mutations-inline.js */
function toEntry(item, now) {
  const { in: places = [], link = [], days = 0, due, doneToday, ...fields } = item;
  const createdAt = now - days * MS_PER_DAY;
  /* `links` nur in eine Richtung: die Rückseite ergänzt sanitizeLinks (src/data/links.js) beim Start */
  const entry = { body: "", archived: false, favorite: false, ...fields, places, links: link, createdAt };
  if (Number.isFinite(due)) entry.date = dayKey(new Date(now + due * MS_PER_DAY));
  if (entry.type === "aufgabe") entry.order = createdAt;
  /* Heute Erledigtes bleibt sichtbar, älter Erledigtes wäre beim Start gleich im Archiv */
  if (entry.status === "erledigt") entry.doneAt = doneToday ? now : createdAt + MS_PER_DAY;
  if (entry.media) entry.media = { sample: 0, duration: 0, ...entry.media };
  return entry;
}

/* Ein paar Öffnungen, damit „Zuletzt geöffnet“ und „Am häufigsten“ etwas zeigen */
function demoOpens(now) {
  const picks = [[20, 9], [40, 6], [21, 4], [22, 3], [45, 2], [31, 1]];
  return picks.map(([id, count], index) => ({ key: `entry:${id}`, kind: "entry", id: String(id), count, ts: now - index * 3600000 }));
}

/**
 * Der komplette gespeicherte Stand mit Demo-Daten, in der Form von
 * snapshot() in src/data/state.js. Kein XP-Protokoll: loadState trägt das
 * Vorhandene dann als Sammelposten nach.
 */
export function buildDemoState(now = Date.now()) {
  const entries = demoEntries.map((item) => toEntry(item, now));
  const workspaces = demoWorkspaces.map((item) => ({ favorite: false, icon: "", body: "", awarded: true, archived: false, ...item }));
  return {
    tabs: demoTabs,
    activeTabId: 1,
    workspaces,
    entries,
    nextEntryId: Math.max(...entries.map((entry) => entry.id)) + 1,
    opens: demoOpens(now),
    recentSearches: ["Umzug", "Startseite"],
    /* Zweite Ansicht je Seite als Board, damit die Spalten sofort zu sehen sind */
    taskViews: [{ id: 1, name: "Alle", fixed: true }, { id: 2, name: "Board", layout: "board", group: "priority" }],
    activeTaskViewId: 1,
    projectViews: [{ id: 1, fixed: true }, { id: 2, name: "Board", layout: "board", group: "status" }],
    activeProjectViewId: 1,
    /* Beispielmedien nicht zusätzlich nachlegen — die Demo bringt eigene mit */
    mediaSeeded: true,
  };
}

/** Kurzbeschreibung für die Rückfrage vor dem Laden. */
export function demoSummary() {
  return `${demoEntries.length} Einträge, ${demoWorkspaces.length} Arbeitsbereiche`;
}
