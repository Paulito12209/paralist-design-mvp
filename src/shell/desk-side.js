/*
 * Das Seitenfenster rechts am Desktop — wie in T3 Code ein zweites Fenster
 * neben der Seite. Es geht über den Knopf ganz rechts in der Kopfzeile oder
 * ⇧⌘O auf. Zuerst steht die Auswahl „Öffnen“: Browser, Medien, Datei vom
 * Gerät, Seite, Projekt, Arbeitsbereich (mit den Buchstaben B, M, D, S, P, A,
 * solange der Fokus im Fenster steht). Solange es offen ist, weicht die
 * Spalte rechts mit den Details; unter 1280px klappt dazu die Seitenleiste
 * links zu und beim Schließen wieder auf. Oben rechts: Breiter/Schmaler,
 * Minimieren (zu, der Inhalt bleibt) und Schließen (zu, beim nächsten Mal
 * wieder die Auswahl). Offen, Breite und Inhalt merkt sich der Browser.
 * Wird erst beim ersten Öffnen nachgeladen (src/main.js, „deskSide“).
 * Pfad: src/shell/desk-side.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * choices -> die Zeilen der Auswahl, von oben nach unten: Icon, Name, Satz
 *            darunter und Buchstabe
 *
 * Breiten stehen in styles/tokens-desk.css (--desk-side-width, --desk-side-wide),
 * das Aussehen in styles/desk-side.css und styles/desk-side-views.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { readJson, storageKeys, writeJson } from "../core/storage.js";
import { isDesk, isRailShown, onDeskChange } from "../ui/desk-mode.js";
import { keyCap } from "../ui/key-caps.js";
import { isNavClosed, markSideOpen, setNavClosed } from "./desk-head.js";
import { browserView } from "./desk-side-browser.js";
import { deviceView, mediaView } from "./desk-side-files.js";
import { pageViews } from "./desk-side-pages.js";

const choices = [
  { mode: "browser", icon: "globe", label: "Browser", note: "Eine Website neben deiner Seite", key: "B" },
  { mode: "media", icon: "photos", label: "Medien", note: "Bilder, Videos und Dateien aus Medien", key: "M" },
  { mode: "device", icon: "import", label: "Datei vom Gerät", note: "Eine Datei ansehen, ohne sie zu speichern", key: "D" },
  { mode: "entry", icon: "note", label: "Seite", note: "Einen Eintrag daneben lesen", key: "S" },
  { mode: "project", icon: "rocket", label: "Projekt", note: "Ein Projekt mit allem, was darin liegt", key: "P" },
  { mode: "workspace", icon: "layers", label: "Arbeitsbereich", note: "Einen Arbeitsbereich daneben öffnen", key: "A" },
];

/* Die Auswahl selbst ist auch eine Ansicht — mit derselben Form wie die übrigen. */
const menuView = {
  title: () => "Öffnen",
  markup: () => `
    <p class="side-lead">Wähle aus, was hier neben deiner Seite erscheinen soll.</p>
    <div class="side-choices">${choices
      .map(
        (choice) => `
        <button class="side-choice" type="button" data-side-mode="${choice.mode}" aria-keyshortcuts="${choice.key}">
          ${icon(choice.icon, "side-choice-icon")}
          <span class="side-choice-text"><span class="side-choice-label">${choice.label}</span><span class="side-choice-note">${choice.note}</span></span>
          ${keyCap(choice.key)}
        </button>`
      )
      .join("")}</div>`,
};

const views = { menu: menuView, browser: browserView, media: mediaView, device: deviceView, ...pageViews };

/* Was gemerkt wird: offen, breit, welche Ansicht, deren Stand (Adresse, gewählter Eintrag …)
   und ob das Fenster die Seitenleiste zugeklappt hat (foldedNav) — dann klappt es sie
   beim Schließen wieder auf, auch nach einem Neuladen. */
let state = { open: false, wide: false, mode: "menu", foldedNav: false };
let root = null;
let parts = null;
/* Die zuletzt gezeichnete Ansicht — sie räumt auf (z.B. Datei-Adressen freigeben), bevor die nächste kommt. */
let shown = null;

function save() {
  writeJson(storageKeys.deskSide, state);
}

/* Was die Ansichten brauchen: den Stand, ihn ändern, zu einer Ansicht wechseln. */
const ctx = {
  get state() {
    return state;
  },
  set(patch) {
    state = { ...state, ...patch };
    save();
  },
  show(mode, patch = {}) {
    state = { ...state, ...patch, mode };
    save();
    render();
  },
  render: () => render(),
};

function view() {
  return views[state.mode] || menuView;
}

function headMarkup() {
  return `
    <div class="side-head">
      <button class="side-btn side-back" type="button" data-side="back" aria-label="Zurück" title="Zurück">${icon("back")}</button>
      <h2 class="side-title"></h2>
      <div class="side-tools">
        <button class="side-btn" type="button" data-side="wide">${icon("expand")}</button>
        <button class="side-btn" type="button" data-side="minimize" aria-label="Minimieren" title="Minimieren — der Inhalt bleibt">${icon("minus")}</button>
        <button class="side-btn" type="button" data-side="close" aria-label="Schließen" title="Schließen">${icon("close")}</button>
      </div>
    </div>
    <div class="side-body"></div>`;
}

/** Kopf und Inhalt der gewählten Ansicht zeichnen. */
function render() {
  if (!root) return;
  const current = view();
  parts.title.textContent = current.title(state);
  parts.back.hidden = state.mode === "menu";
  const wideLabel = state.wide ? "Schmaler" : "Breiter";
  parts.wide.setAttribute("aria-label", wideLabel);
  parts.wide.title = wideLabel;
  parts.wide.innerHTML = icon(state.wide ? "shrink" : "expand");
  shown?.leave?.();
  shown = current;
  parts.body.innerHTML = current.markup(state, ctx);
  parts.body.scrollTop = 0;
  current.enter?.(parts.body, ctx);
}

/* Breite und Raster: .is-side-open und .is-side-wide wirken in styles/desk-side.css. */
function applyLayout() {
  const open = state.open && isDesk();
  root.hidden = !state.open;
  dom.device.classList.toggle("is-side-open", open);
  dom.device.classList.toggle("is-side-wide", open && state.wide);
  markSideOpen(state.open);
}

/* Unter 1280px ist für Seitenleiste, Seite und Fenster zu wenig Platz. */
function foldNavIfNarrow() {
  if (isRailShown() || isNavClosed()) return;
  setNavClosed(true);
  ctx.set({ foldedNav: true });
}

function unfoldNav() {
  if (!state.foldedNav) return;
  ctx.set({ foldedNav: false });
  if (isNavClosed()) setNavClosed(false);
}

function openSide() {
  ctx.set({ open: true });
  /* Breit genug: eine beim letzten Mal zugeklappte Seitenleiste kommt zurück */
  if (isRailShown()) unfoldNav();
  else foldNavIfNarrow();
  applyLayout();
  render();
  parts.body.querySelector("button, input")?.focus({ preventScroll: true });
}

/* Minimieren: zu, beim nächsten Öffnen steht dasselbe da. Schließen: zurück zur Auswahl. */
function hideSide(reset = false) {
  shown?.leave?.();
  shown = null;
  parts.body.innerHTML = "";
  ctx.set(reset ? { open: false, mode: "menu" } : { open: false });
  applyLayout();
  unfoldNav();
  if (parts.body.contains(document.activeElement)) document.activeElement.blur();
}

/* Zurück: erst innerhalb der Ansicht (z.B. vom Eintrag zur Liste), sonst zur Auswahl. */
function goBackInside() {
  if (view().back?.(ctx)) return;
  ctx.show("menu");
}

function onHeadClick(event) {
  const action = event.target.closest("[data-side]")?.dataset.side;
  if (action === "back") goBackInside();
  else if (action === "minimize") hideSide(false);
  else if (action === "close") hideSide(true);
  else if (action === "wide") {
    ctx.set({ wide: !state.wide });
    applyLayout();
    parts.wide.innerHTML = icon(state.wide ? "shrink" : "expand");
    render();
  }
}

/* Tippt man gerade in ein Feld? Dann gehören die Buchstaben dem Feld. */
function isTyping(target) {
  return target instanceof Element && (target.matches("input, textarea, select") || target.isContentEditable);
}

/* Die Buchstaben der Auswahl — nur, solange sie zu sehen ist und der Fokus im Fenster steht. */
function onKeyDown(event) {
  if (event.key === "Escape" && state.mode !== "menu" && !isTyping(event.target)) {
    event.preventDefault();
    goBackInside();
    return;
  }
  if (state.mode !== "menu" || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
  const choice = choices.find((item) => item.key === event.key.toUpperCase());
  if (!choice) return;
  event.preventDefault();
  /* Kürzel wie N oder G dürfen hier nicht zusätzlich greifen */
  event.stopPropagation();
  ctx.show(choice.mode, { inner: null, mediaId: null });
  parts.body.querySelector("input, button")?.focus({ preventScroll: true });
}

/* Klicks im Inhalt: die Auswahl selbst, alles andere an die Ansicht. */
function onBodyEvent(event) {
  const choice = event.type === "click" && event.target.closest("[data-side-mode]");
  if (choice) {
    ctx.show(choice.dataset.sideMode, { inner: null, mediaId: null });
    parts.body.querySelector("input")?.focus({ preventScroll: true });
    return;
  }
  view().handle?.(event, ctx);
}

function mount() {
  if (root) return;
  state = { ...state, ...readJson(storageKeys.deskSide, {}) };
  /* aside: ein Nebenbereich neben der Seite, für Vorlesehilfen als solcher erkennbar */
  root = document.createElement("aside");
  root.className = "desk-side";
  root.setAttribute("aria-label", "Seitenfenster");
  root.hidden = true;
  root.innerHTML = headMarkup();
  dom.content.after(root);
  parts = {
    title: root.querySelector(".side-title"),
    back: root.querySelector('[data-side="back"]'),
    wide: root.querySelector('[data-side="wide"]'),
    body: root.querySelector(".side-body"),
  };
  root.querySelector(".side-head").addEventListener("click", onHeadClick);
  root.addEventListener("keydown", onKeyDown);
  ["click", "change", "input", "keydown", "dragover", "drop"].forEach((type) => parts.body.addEventListener(type, onBodyEvent));
  /* Geänderte Einträge: Listen zeichnen neu — der Browser und laufende Videos nie (sie begännen von vorn). */
  /* Fenster schmaler oder breiter gezogen, Tablet gedreht: Platz neu verteilen */
  onDeskChange(() => {
    if (!state.open) return;
    applyLayout();
    if (isRailShown()) unfoldNav();
    else if (isDesk()) foldNavIfNarrow();
  });
  on(events.dataChanged, () => {
    if (!state.open || root.hidden || isTyping(document.activeElement)) return;
    if (view().live?.(state)) render();
  });
}

/** Beim Start: war das Fenster offen, steht es wieder da (src/shell/desk.js). */
export function initSide() {
  mount();
  if (state.open) openSide();
}

/** Auf- und zuklappen (Knopf in der Kopfzeile, ⇧⌘O). Zu heißt hier minimieren. */
export function toggleSide() {
  mount();
  if (state.open && !root.hidden) hideSide(false);
  else openSide();
}
