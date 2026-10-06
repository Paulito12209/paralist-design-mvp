/*
 * Was außer den Strichen in einer Zeichnung liegt: Text, Formen, Bilder und
 * Notizzettel. Die Striche bleiben ein Bild unter der Eintrags-ID
 * (src/data/thumbs.js); diese Dinge stehen als Liste im Eintrag selbst
 * (entry.drawItems), damit man sie später noch verschieben, vergrößern und
 * umschreiben kann.
 *
 * Lage und Größe zählen in Tausendsteln der Flächenbreite (refWidth). Wird
 * die Fläche breiter oder schmaler — Fenster ziehen, Leiste nach links —,
 * wachsen die Dinge mit, genau wie die Striche, die beim Laden auf die neue
 * Breite skaliert werden.
 *
 * Ein Notizzettel ist eine echte Notiz: sie entsteht als Eintrag, ist mit der
 * Zeichnung verknüpft (beidseitig, src/data/links.js) und der Zettel zeigt
 * nur ihren Text. Löscht man den Zettel, bleibt die Notiz.
 * Reine Daten ohne Zugriff auf die Seite.
 * Pfad: src/data/draw-items.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * refWidth      -> Bezugsbreite der Maße (alle Werte unten sind Tausendstel der Breite)
 * itemDefaults  -> Grundgröße neuer Dinge: Schriftgröße des Texts, Rahmen von Form und
 *                  Zettel, Schrift auf den Zetteln, Breite eines Bildes, Strichstärke der Formen
 * stickyColors  -> die vier Farben der Notizzettel (erste = Vorgabe)
 * noteFallback  -> Titel einer Notiz, solange auf dem Zettel nichts steht
 */

import { findEntry } from "./queries.js";
import { markEdited } from "./mutations.js";
import { createEntryInline } from "./mutations-inline.js";

export const refWidth = 1000;

export const itemDefaults = {
  text: { size: 30 },
  shape: { w: 220, h: 160, stroke: 4 },
  note: { w: 220, h: 190, font: 19 },
  image: { w: 380 },
};

export const stickyColors = ["#ffe58a", "#ffc6d9", "#bfe1ff", "#c9f0c2"];

const noteFallback = "Notiz";

/** Die Dinge einer Zeichnung — immer eine Liste, auch bei alten Einträgen ohne. */
export function drawItemsOf(entry) {
  return entry && Array.isArray(entry.drawItems) ? entry.drawItems : [];
}

/** Die Liste ersetzen (Rückgängig, Wiederholen). Speichert nicht — das tut der Aufrufer. */
export function setDrawItems(entry, items) {
  entry.drawItems = items;
  markEdited(entry);
}

/** Eine neue Nummer, die in dieser Zeichnung noch frei ist. */
export function nextItemId(entry) {
  return drawItemsOf(entry).reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}

/** Der Text eines Zettels: Titel der Notiz, darunter ihr Inhalt. */
export function noteText(note) {
  if (!note) return "";
  return note.body ? `${note.title || ""}\n${note.body}` : note.title || "";
}

/**
 * Was auf dem Zettel steht, in die Notiz zurückschreiben: die erste Zeile
 * wird ihr Titel, der Rest ihr Inhalt. Speichert nicht.
 */
export function setNoteText(note, text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  note.title = lines[0].trim();
  note.body = lines.slice(1).join("\n").replace(/\s+$/, "");
  markEdited(note);
}

/**
 * Eine neue Notiz für einen Zettel anlegen: sie liegt am selben Ort wie die
 * Zeichnung und ist mit ihr verknüpft. Speichert und meldet die Änderung.
 */
export function createStickyNote(drawing, text = "") {
  const note = createEntryInline({
    title: noteFallback,
    type: "notiz",
    place: (drawing.places || [])[0] || null,
    link: drawing.id,
  });
  if (text) setNoteText(note, text);
  return note;
}

/** Die Notiz hinter einem Zettel, oder null, wenn sie gelöscht wurde. */
export function noteOfItem(item) {
  return item && item.kind === "note" ? findEntry(item.noteId) || null : null;
}
