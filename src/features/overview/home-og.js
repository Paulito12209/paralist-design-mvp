/*
 * Das Dashboard der „OG Version“ unter den Listen der Übersicht (HomeView in
 * Organi7er): „Im Blick“ mit den Pillen Angepinnt, Heute und Morgen und einem
 * waagerechten Band großer Karten, darunter „Zuletzt erstellt“, „Zuletzt
 * geöffnet“ und „Zuletzt bearbeitet“ als Reihen mittlerer Kacheln und am Ende
 * der Knopf „Dashboard anpassen“. Es erscheint nur in der OG Version — in jeder
 * anderen Fassung bleibt der Behälter leer und ausgeblendet.
 * Pfad: src/features/overview/home-og.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyTexts   -> die Sätze, wenn eine Reihe oder ein Filter nichts zeigt
 * customizeLabel -> Beschriftung des Knopfes am Ende der Seite und Überschrift des Blatts
 * sheetHint    -> Wort vor dem Hinweis unter der Überschrift des Blatts
 * Karten, Abstände und Schrift: styles/og-dash.css, Werte in styles/tokens-og-home.css.
 */

import { on, events } from "../../core/bus.js";
import { el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { dashSections, datedPages, homeLayout, pinnedPages, relevanceFilters, setHomeLayout, stripPages, stripSections } from "../../data/home-dash.js";
import { openColumnsSheet } from "../../ui/columns-sheet.js";
import { isDesk } from "../../ui/desk-mode.js";
import { isViewActive } from "../../ui/views.js";
import { largeCardMarkup, tileMarkup } from "./home-og-cards.js";

const customizeLabel = "Dashboard anpassen";
const sheetHint = "Übersicht";
const emptyTexts = {
  pinned: { title: "Nichts angepinnt", text: "Wähle bei einem Eintrag „Anpinnen“, dann steht er hier." },
  today: { title: "Heute nichts geplant", text: "Termine, Aufgaben und Projekte mit heutigem Datum erscheinen hier." },
  tomorrow: { title: "Morgen nichts geplant", text: "Termine, Aufgaben und Projekte mit morgigem Datum erscheinen hier." },
  created: "Noch nichts angelegt.",
  opened: "Geöffnete Seiten erscheinen hier automatisch.",
  edited: "Bearbeitete Seiten erscheinen hier automatisch.",
};

/* Der gewählte Filter neben „Im Blick“ — nach einem Neuladen wieder „Angepinnt“ */
let filterId = "pinned";

/** Läuft gerade die OG Version am Handy oder Tablet? */
export function isOgHome() {
  const root = document.documentElement.dataset;
  return root.mobileOs === "ios" && root.mobileVariant === "og" && !isDesk();
}

const dash = () => el("og-dash");

function filtersMarkup() {
  return relevanceFilters
    .map(
      (filter) => `
      <button class="og-filter${filter.id === filterId ? " is-active" : ""}" type="button" data-og-filter="${filter.id}" aria-pressed="${filter.id === filterId}">
        ${icon(filter.icon)}<span>${filter.label}</span>
      </button>`
    )
    .join("");
}

/* Das Band der großen Karten, darunter die Seitenpunkte; leer ein Hinweis mit Symbol */
function relevanceMarkup() {
  const filter = relevanceFilters.find((item) => item.id === filterId);
  const pages = filter.days === null ? pinnedPages() : datedPages(filter.days);
  if (!pages.length) {
    const empty = emptyTexts[filter.id];
    return `<div class="og-empty">${icon(filter.id === "pinned" ? "pin" : "calendar")}<strong>${empty.title}</strong><span>${empty.text}</span></div>`;
  }
  const mode = filter.days === null ? "pinned" : "dated";
  const dots = pages.length > 1 ? pages.map((_, index) => `<span class="og-dot${index === 0 ? " is-active" : ""}"></span>`).join("") : "";
  return `
    <div class="og-band" data-og-band>${pages.map((page) => largeCardMarkup(page, mode)).join("")}</div>
    <div class="og-dots-row" aria-hidden="true">${dots}</div>`;
}

function stripMarkup(section) {
  const pages = stripPages(section.stamp);
  const body = pages.length
    ? `<div class="og-strip">${pages.map((page) => tileMarkup(page, section.symbol)).join("")}</div>`
    : `<p class="og-empty-line">${emptyTexts[section.id]}</p>`;
  return `
    <section class="og-section">
      <h2 class="og-h">${section.title}${icon("chevron")}</h2>
      ${body}
    </section>`;
}

/** Das Dashboard neu zeichnen — nur in der OG Version und nur bei sichtbarer Übersicht. */
export function renderOgDash() {
  const root = dash();
  if (!root) return;
  if (!isOgHome()) {
    root.innerHTML = "";
    return;
  }
  /* Die Schiebestellung der Reihen halten, damit ein Speichern nicht zurückspringen lässt */
  const scrolls = [...root.querySelectorAll(".og-strip")].map((strip) => strip.scrollLeft);
  const parts = {
    relevance: `
    <section class="og-section og-relevance">
      <div class="og-relevance-head">
        <h2 class="og-h og-h-plain">Im Blick</h2>
        <div class="og-filters" role="group" aria-label="Im Blick">${filtersMarkup()}</div>
      </div>
      ${relevanceMarkup()}
    </section>`,
    ...Object.fromEntries(stripSections.map((section) => [section.id, stripMarkup(section)])),
  };
  const layout = homeLayout();
  const shown = layout.order.filter((id) => !layout.hidden.includes(id));
  root.innerHTML = `
    ${shown.map((id) => parts[id]).join("")}
    <button class="og-customize" type="button" data-og-customize>${icon("tune")}<span>${customizeLabel}</span></button>`;
  root.querySelectorAll(".og-strip").forEach((strip, index) => {
    strip.scrollLeft = scrolls[index] || 0;
  });
}

/* Der Punkt unter dem Band, der zur sichtbaren Karte gehört */
function syncDots(band) {
  const first = band.firstElementChild;
  if (!first) return;
  const step = first.offsetWidth + Number.parseFloat(getComputedStyle(band).columnGap || "0");
  const index = Math.min(band.children.length - 1, Math.max(0, Math.round(band.scrollLeft / step)));
  const dots = band.nextElementSibling ? [...band.nextElementSibling.children] : [];
  dots.forEach((dot, at) => dot.classList.toggle("is-active", at === index));
}

/* Das Blatt „Dashboard anpassen“: Reihenfolge ziehen, Auge blendet aus; jede Änderung gilt sofort */
function openCustomize() {
  openColumnsSheet({
    title: customizeLabel,
    subtitle: sheetHint,
    columns: dashSections,
    layout: homeLayout(),
    onChange: (layout) => {
      setHomeLayout(layout);
      renderOgDash();
    },
  });
}

function onClick(event) {
  if (event.target.closest("[data-og-customize]")) {
    openCustomize();
    return;
  }
  const pill = event.target.closest("[data-og-filter]");
  if (!pill) return;
  filterId = pill.dataset.ogFilter;
  renderOgDash();
}

/** Anmelden: das Dashboard zeichnet sich neu, wenn sich Daten ändern oder die Übersicht aufgeht. */
export function initHomeOg() {
  const root = dash();
  root.addEventListener("click", onClick);
  /* scroll steigt nicht auf, deshalb im Abfangen (capture) am Behälter lauschen */
  root.addEventListener(
    "scroll",
    (event) => {
      if (event.target.matches?.("[data-og-band]")) syncDots(event.target);
    },
    { capture: true, passive: true }
  );
  on(events.dataChanged, () => {
    if (isViewActive("home")) renderOgDash();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderOgDash();
  });
}

