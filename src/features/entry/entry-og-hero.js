/*
 * Die geöffnete Seite der „OG Version“ (Nachbau von PageDetailView in
 * Organi7er): der Kopf als farbige Karte mit Wasserzeichen, darunter Ablageort,
 * Titel, die Pillen für Datum, Dringlichkeit und Status und die Kiste
 * („Verknüpfungen“ als Punktkette + runder Anlege-Knopf) am Fuß, dann die
 * Fläche mit den Reitern „Schreibblock“ und „Inhalte“, und unten die kleine
 * Detail-Leiste statt der Hauptleiste. Die Abschnitte unter „Inhalte“ stehen
 * in src/features/entry/entry-og-sections.js.
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
 * labels           -> Namen für Vorlesehilfen und der Platzhalter der Schreibfläche (writeHint), dazu die Namen der beiden Reiter (tabNames) und der Platzhalter der Datums-Pille (noDate)
 */

import { dom, el } from "../../core/dom.js";
import { icon, escapeHtml } from "../../core/html.js";
import { shortDay } from "../../core/format.js";
import { hasStatus, isTimeType, statusOf, taskPriorityOf } from "../../data/config-tasks.js";
import { linkedEntries } from "../../data/links.js";
import { entriesOf, isContainer, mainPlace, parentIcon, parentName } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { openDetailsSheet } from "../../ui/details-sheet.js";
import { ogEntryIcon, ogTypeIcon } from "../../ui/og-type-icon.js";
import { initEntryOgSections } from "./entry-og-sections.js";

const topRowHeight = 54;
const labels = {
  links: "Verknüpfungen",
  add: "Hinzufügen",
  close: "Seite schließen",
  top: "Zum Seitenanfang",
  more: "Mehr",
  writeHint: "Schreibe hier deine Notiz …",
  tabNames: { notes: "Schreibblock", links: "Inhalte" },
  noDate: "Datum",
};

let hero = null;
let watermark = null;
let place = null;
let meta = null;
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

/** Platzhalter der leeren Schreibfläche; in den anderen Fassungen undefined, dann gilt der gewohnte. */
export function ogEmptyHint() {
  return isOgVersion() ? labels.writeHint : undefined;
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

/** Ein Glied der Punktkette: Symbol im gepunkteten Ring, dahinter die Anzahl. */
function nodeMarkup(type, count) {
  return `<span class="og-chain-node" data-og-type="${type}"><i class="og-chain-ring">${icon(ogTypeIcon(type))}</i><b>${count}</b></span>`;
}

function metaPill(ico, text, tone = "", color = "") {
  const style = color ? ` style="--og-pill: ${color}"` : "";
  return `<button class="og-meta-pill ${tone}" type="button" data-og-meta${style}>${icon(ico)}<span>${text}</span></button>`;
}

/** Datum, Dringlichkeit und Status — wie die Pillen unter dem Titel in der Vorlage; ein Tipp öffnet die Angaben. */
function renderMeta(entry) {
  const pills = [];
  if (isTimeType(entry.type)) {
    pills.push(metaPill("calendar", entry.date ? shortDay(entry.date) : labels.noDate));
    const priority = taskPriorityOf(entry.priority);
    pills.push(metaPill(priority.icon, priority.label, "is-priority", priority.color));
  }
  if (hasStatus(entry.type)) {
    const status = statusOf(entry);
    pills.push(metaPill(status.icon, status.label));
  }
  meta.innerHTML = pills.join("");
  meta.hidden = !pills.length;
}

/** Ablageort über dem Titel: Symbol und Name des Arbeitsbereichs oder Projekts. */
function renderPlace(entry) {
  const ref = mainPlace(entry);
  place.hidden = !ref;
  place.innerHTML = ref ? `${icon(parentIcon(ref))}<span>${escapeHtml(parentName(ref))}</span>` : "";
}

/** Oben mittig: das Symbol der Art vor dem Namen, statt des Auswahlpfeils (der steht in CSS aus). */
function renderCrumb(entry) {
  const crumb = dom.entryCrumb.querySelector(".type-crumb") || dom.entryCrumb;
  crumb.querySelector(".og-crumb-icon")?.remove();
  crumb.insertAdjacentHTML("afterbegin", icon(ogTypeIcon(entry.type), "og-crumb-icon"));
  const small = el("entry-head").querySelector(".head-title");
  small?.querySelector(".og-head-icon")?.remove();
  small?.insertAdjacentHTML("afterbegin", icon(ogEntryIcon(entry), "og-head-icon"));
}

/** Reiter „Schreibblock“ und „Inhalte“ statt „Inhalt“ und „Verknüpfungen“. */
function renameTabs() {
  dom.entryPills.querySelectorAll("[data-entry-pill]").forEach((button) => {
    const word = button.querySelector(".tab-pill-label");
    if (word) word.textContent = labels.tabNames[button.dataset.entryPill];
  });
}

/** Wasserzeichen, Ablageort, Pillen und Kiste passend zum offenen Eintrag füllen. */
export function renderEntryOgHero(entry) {
  if (!hero) return;
  el("view-entry").dataset.entryType = entry.type;
  watermark.innerHTML = icon(ogEntryIcon(entry));
  renderPlace(entry);
  renderMeta(entry);
  renderCrumb(entry);
  renameTabs();
  const groups = groupByType(relatedEntries(entry));
  chain.innerHTML = groups.map(([type, items]) => nodeMarkup(type, items.length)).join('<i class="og-chain-link"></i>');
  /* Eine neu geöffnete Seite beginnt oben, ohne dass ein Scroll-Ereignis kommt: Leiste und Kopfzeile danach abgleichen */
  requestAnimationFrame(syncNav);
}

/** Die Leiste zeigt sich erst, wenn der Chevron oben weggescrollt ist; beim Kopf-Ende kommen Plus und Pfeil dazu. */
function syncNav() {
  if (!nav) return;
  const away = scroller.scrollTop > topRowHeight;
  nav.classList.toggle("is-shown", away);
  /* Ab hier läuft Text unter die Kopfzeile: sie bekommt ihre Glasfläche */
  el("entry-head").classList.toggle("is-scrolled", away);
}

/* Das bunte Plus der Vorlage: vier Arme in Rot, Gelb, Grün und Blau */
const colorPlus = `<svg class="og-color-plus" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke-width="3.4" stroke-linecap="round">
  <path d="M4 12h6" stroke="#ff453a"/><path d="M12 4v6" stroke="#ffd60a"/><path d="M14 12h6" stroke="#30d158"/><path d="M12 14v6" stroke="#0a84ff"/></svg>`;

function buildNav() {
  nav = make(
    "div",
    "og-detail-nav",
    `<button class="og-nav-btn og-nav-close" type="button" aria-label="${labels.close}">${icon("chevron")}</button>
     <button class="og-nav-btn og-nav-top" type="button" aria-label="${labels.top}">${icon("arrow-up")}</button>
     <button class="og-nav-btn og-nav-add" type="button" aria-label="${labels.add}">${colorPlus}</button>`
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
  place = make("div", "og-place");
  meta = make("div", "og-meta");
  chain = make("span", "og-chain");
  const box = make(
    "div",
    "og-kiste",
    `<div class="og-kiste-text"><span class="og-kiste-label">${labels.links}</span></div>
     <button class="og-add" type="button" aria-label="${labels.add}">${icon("plus")}</button>`
  );
  box.querySelector(".og-kiste-text").append(chain);
  hero.append(make("span", "og-art-foot"), watermark, dom.entryIcon, place, dom.entryTitle, meta, box);

  const canvas = make("div", "og-canvas");
  const pillsRow = dom.entryPills.parentElement;
  view.insertBefore(hero, pillsRow);
  view.insertBefore(canvas, pillsRow);
  /* „•••“ rechts neben den Reitern öffnet das Seitenmenü, das in der Kopfzeile erst beim kleinen Titel steht */
  const more = make("button", "og-more", icon("dots"));
  more.type = "button";
  more.setAttribute("aria-label", labels.more);
  more.addEventListener("click", () => dom.entryMenu.click());
  pillsRow.append(more);
  canvas.append(pillsRow, dom.entryPanelNotes, dom.entryPanelLinks);

  /* Tipp auf den Namen „Verknüpfungen“ oder die Kette öffnet „Inhalte“; das Plus legt wie das Plus dort an */
  hero.addEventListener("click", (event) => {
    if (event.target.closest(".og-kiste-label, .og-chain")) dom.entryPills.querySelector('[data-entry-pill="links"]')?.click();
    if (event.target.closest("[data-og-meta]")) openDetailsSheet("entry");
  });
  box.querySelector(".og-add").addEventListener("click", () => {
    dom.entryPills.querySelector('[data-entry-pill="links"]')?.click();
    dom.entryTools.querySelector("[data-link-add]")?.click();
  });
  buildNav();
  initEntryOgSections();
  /* Die Reiter werden bei jedem Wechsel neu gezeichnet: danach umbenennen (der Beobachter ändert nur Text, keine Knoten) */
  new MutationObserver(renameTabs).observe(dom.entryPills, { childList: true });
}
