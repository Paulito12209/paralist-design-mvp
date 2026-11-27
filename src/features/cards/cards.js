/*
 * Die Karteikarten-Seite der „OG Version“ nach DeckListView.swift: Titel, darunter
 * jeder Stapel als braune Glaskarte mit Namen und Kartenanzahl; ein Tipp startet
 * die Lernansicht (study.js). Neue Stapel entstehen aus Text im Kartenformat
 * (src/data/decks.js). Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/cards/cards.js
 *
 * Keine anpassbaren visuellen Werte in dieser Datei: Maße und Farben stehen in
 * styles/tokens-og-media.css (Werte der Stapelkarte) und styles/og-cards.css.
 */

import { events, on } from "../../core/bus.js";
import { el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { addDeck, allDecks, deckCounts, findDeck, parseCards, removeDeck } from "../../data/decks.js";
import { isViewActive } from "../../ui/views.js";
import { openStudy } from "./study.js";

/* Ob das Formular „Karten importieren“ offen ist — flüchtig, nicht gespeichert. */
let importOpen = false;
let importError = "";

/* Eine Stapelkarte: Symbol, Name, darunter Anzahl, neue und offene Karten. */
function deckCard(deck) {
  const { total, fresh, wrong } = deckCounts(deck);
  const extra = [
    fresh ? `<span class="og-deck-flag">${icon("star-outline")}${fresh} neu</span>` : "",
    wrong ? `<span class="og-deck-flag">${icon("refresh")}${wrong} offen</span>` : "",
  ].join("");
  return `
    <div class="og-deck" data-deck="${deck.id}">
      <button class="og-deck-open" type="button" data-deck-open="${deck.id}" aria-label="Stapel lernen: ${escapeHtml(deck.title)}">
        ${icon("cards", "og-deck-icon")}
        <span class="og-deck-title">${escapeHtml(deck.title)}</span>
        <span class="og-deck-meta"><span>${total} ${total === 1 ? "Karte" : "Karten"}</span>${extra}</span>
      </button>
      <button class="og-deck-delete" type="button" data-deck-delete="${deck.id}" aria-label="Stapel löschen">${icon("trash")}</button>
    </div>`;
}

/* Leerzustand wie ContentUnavailableView: Symbol, Überschrift, ein Satz. */
function emptyMarkup() {
  return `
    <div class="og-cards-empty">
      ${icon("cards", "og-cards-empty-icon")}
      <h2>Keine Stapel</h2>
      <p>Lege einen Stapel an oder importiere Karten als Text.</p>
    </div>`;
}

/* Formular: Name und Karten im Textformat. */
function importMarkup() {
  if (!importOpen) {
    return `<button class="og-cards-add" type="button" data-cards-import="open">${icon("plus")}Karten importieren</button>`;
  }
  return `
    <div class="og-cards-form" id="cards-form">
      <input class="og-cards-input" name="title" type="text" placeholder="Name des Stapels" aria-label="Name des Stapels" form="no-history" />
      <textarea class="og-cards-text" name="text" rows="9" placeholder="Frage&#10;==&#10;Antwort&#10;#tag&#10;&#10;---&#10;&#10;Nächste Frage&#10;==&#10;Nächste Antwort" aria-label="Karten als Text" form="no-history"></textarea>
      ${importError ? `<p class="og-cards-error">${importError}</p>` : ""}
      <div class="og-cards-form-row">
        <button class="og-cards-add" type="button" data-cards-import="cancel">Abbrechen</button>
        <button class="og-cards-add is-primary" type="button" data-cards-import="save">Stapel anlegen</button>
      </div>
    </div>`;
}

/** Die ganze Seite neu zeichnen. */
export function renderCards() {
  const decks = allDecks();
  el("cards-body").innerHTML = `${decks.length ? decks.map(deckCard).join("") : emptyMarkup()}${importMarkup()}`;
}

function onClick(event) {
  const open = event.target.closest("[data-deck-open]");
  if (open) {
    const deck = findDeck(Number(open.dataset.deckOpen));
    if (deck?.cards.length) openStudy(deck, renderCards);
    return;
  }
  const del = event.target.closest("[data-deck-delete]");
  if (del) {
    removeDeck(Number(del.dataset.deckDelete));
    renderCards();
    return;
  }
  const toggle = event.target.closest("[data-cards-import]");
  if (toggle) {
    if (toggle.dataset.cardsImport === "save") {
      saveImport();
      return;
    }
    importOpen = toggle.dataset.cardsImport === "open";
    importError = "";
    renderCards();
  }
}

/* Felder hängen am Formular „no-history“ (src/core/no-history.js), nicht an einem eigenen — deshalb liest diese Funktion sie über ihren Namen. */
function saveImport() {
  const form = el("cards-body").querySelector(".og-cards-form");
  const title = form.querySelector("[name=title]").value;
  const text = form.querySelector("[name=text]").value;
  const cards = parseCards(text);
  if (!cards.length) {
    importError = "Keine Karte gefunden. Jede Karte braucht Frage, eine Zeile „==“ und Antwort.";
    renderCards();
    const again = el("cards-body").querySelector(".og-cards-form");
    again.querySelector("[name=title]").value = title;
    again.querySelector("[name=text]").value = text;
    return;
  }
  addDeck(title, cards);
  importOpen = false;
  importError = "";
  renderCards();
}

function init() {
  const body = el("cards-body");
  /* true: vor der allgemeinen Listen-Behandlung, damit kein Klick anderswo landet */
  body.addEventListener("click", onClick, true);
  on(events.viewOpened, (name) => {
    if (name === "cards") renderCards();
  });
  on(events.tabReselected, (tab) => {
    if (tab !== "cards" || !importOpen) return;
    importOpen = false;
    renderCards();
  });
  if (isViewActive("cards")) renderCards();
}

init();
