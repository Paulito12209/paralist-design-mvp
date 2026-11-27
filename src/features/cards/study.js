/*
 * Die Lernansicht der Karteikarten nach FlashcardStudyView.swift: oben
 * „n von m“ mit Fortschrittsbalken, in der Mitte eine große Glaskarte, die
 * beim Tippen umdreht (Frage → Antwort), darunter „Vergessen“ und „Gewusst“.
 * Am Ende steht „x von m richtig beantwortet“. Die Ansicht liegt als eigene
 * Fläche über der App und merkt sich jede Antwort (src/data/decks.js).
 * Pfad: src/features/cards/study.js
 *
 * Nicht umgesetzt (offener Punkt): Mehrfachauswahl-Karten, Wischen zum
 * Bewerten, Bilder auf Karten, Lernmodi „nur neue / nur falsche“.
 *
 * Keine anpassbaren visuellen Werte: Maße und Farben stehen in
 * styles/tokens-og-media.css (Werte der Lernansicht) und styles/og-study.css.
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { recordAnswer } from "../../data/decks.js";

let layer = null;

/* Die Fläche über der App; entsteht erst beim ersten Lernen. */
function ensureLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement("div");
  layer.className = "og-study";
  layer.setAttribute("role", "dialog");
  layer.setAttribute("aria-modal", "true");
  dom.device.appendChild(layer);
  return layer;
}

function tagsOf(card) {
  return card.tags.length ? `<span class="og-study-tags">${card.tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</span>` : "";
}

/**
 * Lernrunde über alle Karten eines Stapels starten.
 * @param onDone wird nach dem Schließen gerufen, damit die Stapelliste neu zählt.
 */
export function openStudy(deck, onDone) {
  const root = ensureLayer();
  const cards = deck.cards;
  let index = 0;
  let correct = 0;
  let revealed = false;

  const close = () => {
    root.hidden = true;
    root.innerHTML = "";
    onDone();
  };

  const head = (title) => `
    <header class="og-study-head">
      <h2>${escapeHtml(title)}</h2>
      <button class="og-study-close" type="button" data-study="close" aria-label="Schließen">${icon("close")}</button>
    </header>`;

  /* Unten: vor dem Umdrehen ein Hinweis, danach die beiden Knöpfe. */
  const bottomMarkup = () =>
    revealed
      ? `<div class="og-study-verdict">
           <button class="og-study-btn is-wrong" type="button" data-study="wrong">${icon("close")}Vergessen</button>
           <button class="og-study-btn is-right" type="button" data-study="right">${icon("check")}Gewusst</button>
         </div>`
      : `<p class="og-study-hint">Tippen zum Umdrehen</p>`;

  const draw = () => {
    if (index >= cards.length) {
      root.innerHTML = `${head(deck.title)}
        <div class="og-study-sum">
          <p class="og-study-sum-num">${correct} von ${cards.length}</p>
          <p class="og-study-sum-text">richtig beantwortet</p>
          <button class="og-cards-add is-primary" type="button" data-study="close">Schließen</button>
        </div>`;
      return;
    }
    const card = cards[index];
    root.innerHTML = `${head(deck.title)}
      <div class="og-study-progress">
        <span>${index + 1} von ${cards.length}</span>
        <progress value="${index}" max="${cards.length}"></progress>
      </div>
      <button class="og-study-card${revealed ? " is-revealed" : ""}" type="button" data-study="flip" aria-label="${revealed ? "Antwortseite" : "Frageseite"}, tippen zum Umdrehen">
        <span class="og-study-face og-study-front">${tagsOf(card)}<span class="og-study-text">${escapeHtml(card.front)}</span></span>
        <span class="og-study-face og-study-back">${tagsOf(card)}<span class="og-study-ask">${escapeHtml(card.front)}</span><span class="og-study-text is-answer">${escapeHtml(card.back)}</span></span>
      </button>
      ${bottomMarkup()}`;
  };

  const answer = (isRight) => {
    recordAnswer(deck.id, cards[index].id, isRight);
    if (isRight) correct += 1;
    index += 1;
    revealed = false;
    draw();
  };

  root.onclick = (event) => {
    const action = event.target.closest("[data-study]")?.dataset.study;
    if (action === "close") close();
    else if (action === "flip") {
      revealed = !revealed;
      /* Nur die Klasse umschalten, damit die Drehung als Übergang läuft statt neu aufgebaut zu werden */
      root.querySelector(".og-study-card").classList.toggle("is-revealed", revealed);
      const holder = document.createElement("div");
      holder.innerHTML = bottomMarkup();
      root.querySelector(".og-study-hint, .og-study-verdict")?.replaceWith(holder.firstElementChild);
    } else if (action === "right") answer(true);
    else if (action === "wrong") answer(false);
  };

  root.hidden = false;
  draw();
}
