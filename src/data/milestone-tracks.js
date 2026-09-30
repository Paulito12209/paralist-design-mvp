/*
 * Welche Abzeichen es gibt: je Kategorie ein Titel, ein Icon, eine Farbe, die
 * Schwellen der sechs Stufen und woher die Zahl kommt. Gezählt wird nur, was
 * in Paralist selbst passiert — kein Zugriff auf Galerie, Tastatur oder
 * andere Apps.
 * Pfad: src/data/milestone-tracks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * milestoneTiers        -> Namen der sechs Stufen, von der ersten bis zur höchsten
 * lockedName            -> was statt eines Stufennamens steht, solange keine Stufe erreicht ist
 * milestoneTracks[*].title -> Name des Abzeichens („Fotograf“)
 * milestoneTracks[*].unit  -> was gezählt wird, in Einzahl und Mehrzahl; steht unter dem Balken
 * milestoneTracks[*].hint  -> ein Satz, wie man das Abzeichen bekommt
 * milestoneTracks[*].icon  -> Icon in der Plakette (Name aus assets/icons/)
 * milestoneTracks[*].color -> Farbe der Plakette (verweist auf styles/tokens-pages.css)
 * milestoneTracks[*].steps -> ab welcher Zahl jede der sechs Stufen erreicht ist
 * photoKinds            -> welche Medienarten für „Fotograf“ zählen
 */

import { isTaskDone } from "./config-tasks.js";
import { charCount } from "./page-text.js";
import { state } from "./state.js";
import { usageStreaks } from "./usage.js";

/** Die sechs Stufen jeder Kategorie — Stufe 1 ist der Einstieg, Stufe 6 das Ende der Leiter. */
export const milestoneTiers = ["Padawan", "Junior", "Senior", "Meister", "Großmeister", "Ultra-Meister"];
export const lockedName = "Noch gesperrt";

/* Bilder und Videos zählen als Fotos; Aufnahmen und Dateien nicht. */
const photoKinds = ["image", "video"];

/* Wie oft ein Ereignis im XP-Protokoll steht. Sammelposten zählen mit ihrer Menge. */
function loggedCount(kind, item) {
  return state.xpLog.reduce((sum, row) => {
    if (row.kind !== kind || row.item !== item) return sum;
    return sum + (row.count || 1);
  }, 0);
}

/* Einträge eines Typs, auch archivierte — Archivieren nimmt kein Abzeichen weg. */
function entriesOfType(type) {
  return state.entries.filter((entry) => entry.type === type);
}

/*
 * Angelegte Einträge eines Typs: das Protokoll zählt auch Gelöschtes, die
 * Liste auch Einträge aus älteren Ständen ohne Protokoll — die größere Zahl gilt.
 */
function createdOfType(type) {
  return Math.max(loggedCount("created", type), entriesOfType(type).length);
}

/* Erledigt heißt abgehakt — unerledigt Archiviertes zählt nicht mit */
function doneTasks() {
  const listed = entriesOfType("aufgabe").filter((entry) => isTaskDone(entry)).length;
  return Math.max(loggedCount("done", "aufgabe"), listed);
}

/* Ein Projekt gilt als abgeschlossen, sobald es im Archiv liegt. */
function finishedProjects() {
  return entriesOfType("projekt").filter((entry) => entry.archived).length;
}

/* Alle Zeichen aller Seiten und Arbeitsbereiche — dieselbe Zählung wie unter „Details“. */
function writtenChars() {
  const inEntries = state.entries.reduce((sum, entry) => sum + charCount(entry), 0);
  const inWorkspaces = state.workspaces.reduce((sum, workspace) => sum + (workspace.body || "").trim().length, 0);
  return inEntries + inWorkspaces;
}

function photos() {
  return entriesOfType("medien").filter((entry) => entry.media && photoKinds.includes(entry.media.kind)).length;
}

/**
 * Die Kategorien. `count()` liefert die Zahl von heute; dass sie nie
 * zurückgeht (gelöschte Seiten, gerissene Serie), sorgt src/data/milestones.js.
 */
export const milestoneTracks = [
  {
    id: "aufgaben",
    title: "Task Master",
    unit: ["Aufgabe erledigt", "Aufgaben erledigt"],
    hint: "Hake Aufgaben ab — jede erledigte zählt.",
    icon: "check-circle",
    color: "var(--ms-tasks)",
    steps: [10, 50, 100, 250, 500, 1000],
    count: doneTasks,
  },
  {
    id: "projekte",
    title: "Ehrgeizling",
    unit: ["Projekt abgeschlossen", "Projekte abgeschlossen"],
    hint: "Ein Projekt ist abgeschlossen, sobald du es archivierst.",
    icon: "rocket",
    color: "var(--ms-projects)",
    steps: [1, 3, 5, 10, 25, 50],
    count: finishedProjects,
  },
  {
    id: "schreiben",
    title: "Dichter",
    unit: ["Zeichen geschrieben", "Zeichen geschrieben"],
    hint: "Zählt Titel und Text all deiner Seiten, wie unter „Details“.",
    icon: "pencil",
    color: "var(--ms-writing)",
    steps: [500, 2500, 10000, 25000, 50000, 100000],
    count: writtenChars,
  },
  {
    id: "fotos",
    title: "Fotograf",
    unit: ["Bild oder Video", "Bilder und Videos"],
    hint: "Hänge Fotos und Videos in Paralist an.",
    icon: "camera",
    color: "var(--ms-photos)",
    steps: [5, 25, 50, 100, 250, 500],
    count: photos,
  },
  {
    id: "notizen",
    title: "Denker",
    unit: ["Notiz angelegt", "Notizen angelegt"],
    hint: "Halte Gedanken als Notiz fest.",
    icon: "note",
    color: "var(--ms-notes)",
    steps: [5, 25, 50, 100, 250, 500],
    count: () => createdOfType("notiz"),
  },
  {
    id: "zeichnungen",
    title: "Künstler",
    unit: ["Zeichnung angelegt", "Zeichnungen angelegt"],
    hint: "Lege Zeichnungen an und skizziere drauflos.",
    icon: "scribble",
    color: "var(--ms-drawings)",
    steps: [3, 10, 25, 50, 100, 200],
    count: () => createdOfType("zeichnung"),
  },
  {
    id: "termine",
    title: "Planer",
    unit: ["Termin eingetragen", "Termine eingetragen"],
    hint: "Trage Termine in den Kalender ein.",
    icon: "calendar",
    color: "var(--ms-events)",
    steps: [5, 25, 50, 100, 250, 500],
    count: () => createdOfType("termin"),
  },
  {
    id: "serie",
    title: "Stammgast",
    unit: ["Tag am Stück", "Tage am Stück"],
    hint: "Öffne Paralist an vielen Tagen hintereinander.",
    icon: "flame",
    color: "var(--ms-streak)",
    steps: [3, 7, 14, 30, 100, 365],
    count: () => usageStreaks().longest,
  },
];

/** Die passende Einheit zu einer Zahl: „1 Tag am Stück“, aber „3 Tage am Stück“. */
export function unitFor(track, amount) {
  return amount === 1 ? track.unit[0] : track.unit[1];
}
