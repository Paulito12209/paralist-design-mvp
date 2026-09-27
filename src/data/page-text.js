/*
 * Ein Eintrag als Text zum Kopieren: nur der Titel oder die ganze Seite im
 * Markdown-Format („# Titel“, Leerzeile, dann der Text). So lässt sich eine
 * Seite in jede andere App einfügen und behält ihre Überschrift.
 * Pfad: src/data/page-text.js
 *
 * Dazu die Zählungen für „Details“ am Ende einer Seite: Zeichen, Wörter und
 * die ungefähre Lesezeit.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * WORDS_PER_MINUTE -> Lesetempo, nach dem die Lesezeit geschätzt wird
 *
 * Zeichnung und Medien kommen nicht mit: sie lassen sich nicht als Text darstellen.
 */

import { readableBody } from "./note-blocks.js";

/* Übliches Lesetempo am Bildschirm; darüber entscheidet die Lesezeit in „Details“. */
const WORDS_PER_MINUTE = 200;

/* Ein Wort: Buchstaben oder Ziffern, auch mit Bindestrich oder Apostroph darin */
const WORD_PATTERN = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;

/** Der Titel ohne doppelte Leerzeichen; leer, wenn keiner vergeben ist. */
export function titleText(entry) {
  return (entry.title || "").replace(/\s+/g, " ").trim();
}

/** Die ganze Seite als Markdown. Ohne Titel bleibt nur der Text, ohne Text nur die Überschrift. */
export function pageMarkdown(entry) {
  const title = titleText(entry);
  /* Karten werden zu Markdown-Links, damit sie außerhalb der App lesbar sind */
  const body = entry.type === "zeichnung" ? "" : readableBody(entry.body || "").trim();
  return [title && `# ${title}`, body].filter(Boolean).join("\n\n");
}

/** Hat die Seite außer dem Titel noch Text? Entscheidet, ob „Seite“ oder „Titel kopiert“ gemeldet wird. */
export function hasPageBody(entry) {
  return entry.type !== "zeichnung" && Boolean((entry.body || "").trim());
}

/**
 * Wie viele Zeichen eine Seite hat: Titel und Text zusammen, Leerzeichen
 * mitgezählt wie in jedem Schreibprogramm. Zeichnungen haben keinen Text.
 * Dieselbe Zahl steht unter „Details“ und zählt für das Abzeichen „Dichter“.
 */
export function charCount(entry) {
  const body = entry.type === "zeichnung" ? "" : (entry.body || "").trim();
  return titleText(entry).length + body.length;
}

/** Wie viele Wörter Titel und Text zusammen haben; Karten zählen mit ihrem lesbaren Namen. */
export function wordCount(entry) {
  const body = entry.type === "zeichnung" ? "" : readableBody(entry.body || "");
  const text = `${titleText(entry)} ${body}`;
  return (text.match(WORD_PATTERN) || []).length;
}

/** Ungefähre Lesezeit in Minuten, mindestens eine, sobald es überhaupt Text gibt. */
export function readingMinutes(words) {
  return words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
}
