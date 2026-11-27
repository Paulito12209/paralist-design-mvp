/*
 * Karteikarten-Stapel der „OG Version“: Daten, Lesen des Textformats, Zählen.
 * Die Stapel liegen bewusst in einem eigenen Speicherschlüssel und nicht im
 * großen Zustand (src/data/state.js): so bleibt der Rest der App unberührt, und
 * die anderen Fassungen kennen keine Stapel. Kein Zugriff auf die Seite.
 * Pfad: src/data/decks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * cardSeparator -> Zeile zwischen zwei Karten im Text („---“)
 * frontBackMark -> Zeile zwischen Frage und Antwort („==“)
 * Aussehen steht in styles/og-cards.css und styles/og-study.css.
 *
 * Textformat wie in Organi7er (FlashcardTextFormat.swift), nur Standardkarten:
 *   Frage
 *   ==
 *   Antwort
 *   #tag #tag
 *   (Leerzeile, ---, Leerzeile) und die nächste Karte.
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";

const cardSeparator = "---";
const frontBackMark = "==";

/* Ein Stapel: { id, title, created, cards: [{ id, front, back, tags, reviewed, correct }] }.
   `reviewed` ist null, solange die Karte nie abgefragt wurde („neu“); `correct`
   ist das Ergebnis der letzten Antwort. */
function load() {
  const saved = readJson(storageKeys.decks, []);
  return Array.isArray(saved) ? saved : [];
}

let decks = load();

function save() {
  writeJson(storageKeys.decks, decks);
}

/** Alle Stapel, ältester zuerst (wie DeckListView). */
export function allDecks() {
  return decks;
}

/** Ein Stapel nach seiner Nummer, sonst `null`. */
export function findDeck(id) {
  return decks.find((deck) => deck.id === id) || null;
}

/** Zahlen für die Stapelkarte: alle, neue (nie abgefragt) und zuletzt falsch beantwortete. */
export function deckCounts(deck) {
  return {
    total: deck.cards.length,
    fresh: deck.cards.filter((card) => card.reviewed === null).length,
    wrong: deck.cards.filter((card) => card.correct === false).length,
  };
}

/**
 * Text im Kartenformat in Karten übersetzen. Blöcke ohne Antwort werden
 * übersprungen — eine Karte braucht Vorder- und Rückseite.
 */
export function parseCards(text) {
  return String(text)
    .split(/^\s*---\s*$/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const mark = lines.findIndex((line) => line.trim() === frontBackMark);
      if (mark < 1) return null;
      const front = lines.slice(0, mark).join("\n").trim();
      const rest = lines.slice(mark + 1);
      const last = rest.length ? rest[rest.length - 1].trim() : "";
      const tagLine = /^(#\S+\s*)+$/.test(last);
      const tags = tagLine ? last.split(/\s+/).map((tag) => tag.slice(1)) : [];
      const back = (tagLine ? rest.slice(0, -1) : rest).join("\n").trim();
      return front && back ? { front, back, tags } : null;
    })
    .filter(Boolean);
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/** Neuen Stapel anlegen; `cards` sind eingelesene Karten. Gibt den Stapel zurück. */
export function addDeck(title, cards) {
  const deck = {
    id: nextId(decks),
    title: title.trim() || "Neuer Stapel",
    created: Date.now(),
    cards: cards.map((card, index) => ({ ...card, id: index + 1, reviewed: null, correct: null })),
  };
  decks = [...decks, deck];
  save();
  return deck;
}

/** Stapel löschen. */
export function removeDeck(id) {
  decks = decks.filter((deck) => deck.id !== id);
  save();
}

/** Das Ergebnis einer Antwort merken: macht die Karte „nicht mehr neu“. */
export function recordAnswer(deckId, cardId, correct) {
  const card = findDeck(deckId)?.cards.find((item) => item.id === cardId);
  if (!card) return;
  card.reviewed = Date.now();
  card.correct = correct;
  save();
}
