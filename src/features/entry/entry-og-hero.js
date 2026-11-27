/*
 * Die geöffnete Seite der „OG Version“ (Nachbau von PageDetailView in
 * Organi7er): der Kopf als farbige Karte mit Wasserzeichen, den Verknüpfungen
 * oben rechts und der Kiste („Verknüpfungen“ + runder Anlege-Knopf) am Fuß,
 * darunter die Fläche für Reiter und Inhalt, und unten die kleine
 * Detail-Leiste statt der Hauptleiste.
 *
 * Alles hier ist nur Markup-Ergänzung: die Wrapper stehen in allen Fassungen
 * im Baum, sind aber ohne OG-Regeln unsichtbar (display: contents bzw. hidden,
 * siehe styles/og-detail.css). Titel, Icon, Pillen und Flächen bleiben die
 * vorhandenen Elemente — sie werden nur in die Wrapper gesetzt.
 * Pfad: src/features/entry/entry-og-hero.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * topRowHeight     -> ab so vielen Pixeln Scrollweg erscheint die Detail-Leiste mit dem Chevron (54 pt, detailTopRowHeight)
 * heroAddReach     -> so weit vor dem Ende des Kopfes gilt der Anlege-Knopf als weggescrollt; dann steht er in der Leiste
 * maxLinkPills     -> wie viele Verknüpfungs-Pillen oben rechts höchstens stehen
 * labels           -> Namen für Vorlesehilfen
 */

import { dom, el } from "../../core/dom.js";
import { icon, escapeHtml } from "../../core/html.js";
import { typeIcon, typeSingular } from "../../data/config.js";
import { linkedEntries } from "../../data/links.js";
import { entriesOf, findEntry, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";

const topRowHeight = 54;
const heroAddReach = 60;
const maxLinkPills = 2;
const labels = {
  links: "Verknüpfungen",
  add: "Hinzufügen",
  close: "Seite schließen",
  top: "Zum Seitenanfang",
  done: "Abhaken",
};

let hero = null;
let watermark = null;
let linkPills = null;
let chain = null;
let nav = null;
/* Der Scrollbereich der Seite (.content), nicht das Fenster */
let scroller = null;

function make(tag, className, html = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.innerHTML = html;
  return node;
}

/** Nur die OG Version bekommt den Aufbau; alle anderen Fassungen bleiben unberührt. */
function isOgVersion() {
  const root = document.documentElement.dataset;
  return root.mobileOs === "ios" && root.mobileVariant === "og";
}

/** Was unter der zweiten Pille steht: bei einem Projekt sein Inhalt, sonst die Verknüpfungen. */
function relatedEntries(entry) {
  return isContainer(entry) ? entriesOf(entryRef(entry.id)) : linkedEntries(entry);
}

function groupByType(entries) {
  const groups = new Map();
  entries.forEach((entry) => {
    if (!groups.has(entry.type)) groups.set(entry.type, []);
    groups.get(entry.type).push(entry);
  });
  return [...groups.entries()];
}

function nodeMarkup(type, count) {
  return `<span class="og-chain-node" data-og-type="${type}">${icon(typeIcon(type))}<b>${count}</b></span>`;
}

function pillMarkup([type, items]) {
  const first = items[0];
  const extra = items.length > 1 ? `<b>+${items.length - 1}</b>` : "";
  const title = escapeHtml(first.title || typeSingular(type));
  return `<button class="og-link-pill" type="button" data-og-type="${type}" data-og-links>${icon(first.icon || typeIcon(type))}<span>${title}</span>${extra}</button>`;
}

/** Wasserzeichen, Verknüpfungen und Kiste passend zum offenen Eintrag füllen. */
export function renderEntryOgHero(entry) {
  if (!hero) return;
  el("view-entry").dataset.entryType = entry.type;
  watermark.innerHTML = icon(entry.icon || typeIcon(entry.type));
  const groups = groupByType(relatedEntries(entry));
  linkPills.innerHTML = groups.slice(0, maxLinkPills).map(pillMarkup).join("");
  chain.innerHTML = groups.map(([type, items]) => nodeMarkup(type, items.length)).join("");
  syncNav();
}

/** Jede Zeile der Liste bekommt ihre Kategorie (für die Farbe der Kachel) und Aufgaben eine runde Checkbox. */
function tagRows() {
  dom.entryLinks.querySelectorAll(".swipe[data-entry]").forEach((row) => {
    const entry = findEntry(Number(row.dataset.entry));
    if (!entry || row.dataset.ogType) return;
    row.dataset.ogType = entry.type;
    if (entry.type === "aufgabe") row.querySelector(".entry-row")?.insertAdjacentHTML("beforeend", `<span class="og-row-check" data-og-check role="checkbox" aria-label="${labels.done}">${icon("check")}</span>`);
  });
}

/** Die Leiste zeigt sich erst, wenn der Chevron oben weggescrollt ist; beim Kopf-Ende kommen Plus und Pfeil dazu. */
function syncNav() {
  if (!nav) return;
  const y = scroller.scrollTop;
  const heroHeight = hero.getBoundingClientRect().bottom - scroller.getBoundingClientRect().top + y;
  nav.classList.toggle("is-shown", y > topRowHeight);
  nav.classList.toggle("has-add", y > heroHeight - heroAddReach);
  nav.classList.toggle("has-top", y > heroHeight);
}

function buildNav() {
  nav = make(
    "div",
    "og-detail-nav",
    `<button class="og-nav-btn og-nav-close" type="button" aria-label="${labels.close}">${icon("chevron")}</button>
     <button class="og-nav-btn og-nav-add" type="button" aria-label="${labels.add}">${icon("plus")}</button>
     <button class="og-nav-btn og-nav-top" type="button" aria-label="${labels.top}">${icon("chevron")}</button>`
  );
  dom.bottomBar.append(nav);
  nav.querySelector(".og-nav-close").addEventListener("click", () => dom.entryBack.click());
  nav.querySelector(".og-nav-add").addEventListener("click", () => hero.querySelector(".og-add").click());
  nav.querySelector(".og-nav-top").addEventListener("click", () => scroller.scrollTo({ top: 0, behavior: "smooth" }));
  scroller.addEventListener("scroll", syncNav, { passive: true });
}

/** Wrapper um Titel und Pillen anlegen und den Kopf bauen — einmal beim Start. */
export function initEntryOgHero() {
  if (!isOgVersion()) return;
  const view = el("view-entry");
  scroller = view.closest(".content");
  hero = make("div", "og-hero");
  watermark = make("span", "og-watermark");
  linkPills = make("div", "og-link-pills");
  chain = make("span", "og-chain");
  const box = make(
    "div",
    "og-kiste",
    `<div class="og-kiste-text"><span class="og-kiste-label">${labels.links}</span></div>
     <button class="og-add" type="button" aria-label="${labels.add}">${icon("plus")}</button>`
  );
  box.querySelector(".og-kiste-text").append(chain);
  hero.append(make("span", "og-art-foot"), watermark, linkPills, dom.entryIcon, dom.entryTitle, box);

  const canvas = make("div", "og-canvas");
  const pillsRow = dom.entryPills.parentElement;
  view.insertBefore(hero, pillsRow);
  view.insertBefore(canvas, pillsRow);
  canvas.append(pillsRow, dom.entryPanelNotes, dom.entryPanelLinks);

  /* Tipp auf eine Pille oder den Namen „Verknüpfungen“ öffnet die zweite Pille; das Plus legt wie das Plus dort an */
  hero.addEventListener("click", (event) => {
    if (event.target.closest("[data-og-links], .og-kiste-label, .og-chain")) {
      dom.entryPills.querySelector('[data-entry-pill="links"]')?.click();
    }
  });
  box.querySelector(".og-add").addEventListener("click", () => {
    dom.entryPills.querySelector('[data-entry-pill="links"]')?.click();
    dom.entryTools.querySelector("[data-link-add]")?.click();
  });
  buildNav();
  /* Die Liste wird bei jeder Änderung neu gezeichnet: Zeilen nachträglich auszeichnen */
  new MutationObserver(tagRows).observe(dom.entryLinks, { childList: true, subtree: true });
  /* Die runde Checkbox löst denselben Wisch-Knopf „Abhaken“ aus, bevor die Zeile sich öffnet */
  dom.entryLinks.addEventListener(
    "click",
    (event) => {
      const check = event.target.closest("[data-og-check]");
      if (!check) return;
      event.stopPropagation();
      event.preventDefault();
      check.closest(".swipe")?.querySelector('[data-swipe="done"]')?.click();
    },
    true
  );
}
