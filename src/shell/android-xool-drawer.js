/*
 * „Android (Xool-DB)“: das Menü, das der Reiter „Menü“ öffnet — die Seitenleiste
 * der Xool-App (Handy-Fassung), nur von rechts statt von links aufgezogen; links
 * bleiben 48px der Seite stehen. Oben mittig die Marke, rechts das Menü-Zeichen,
 * das sich beim Öffnen zum ✕ mit vier roten Punkten dreht; darunter mittig
 * Profilbild, Name und „Dabei seit“ (ein Tipp öffnet die Einstellungen), dann die
 * Bereiche der App als Zeilen (Übersicht, Kalender, Aufgaben, Medien; die offene
 * ist markiert) und Archiv. Unten die Fußleiste: links die Sprache, rechts „Nach
 * Updates suchen“ (mit blauem Punkt, wenn eine neuere Fassung bereitliegt),
 * Hell/Dunkel und Einstellungen. Schleier, ✕, Escape, Wischen nach rechts und
 * Browser-Zurück schließen es.
 * Pfad: src/shell/android-xool-drawer.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * brand        -> die Aufschrift im Kopf
 * areas        -> die Zeilen unter „Bereiche“: Name, Icon und Ziel
 * swipeClosePx -> wie weit man nach rechts wischen muss, damit es zugeht
 * languages    -> die Sprachen im Blatt der Fußleiste; nur Deutsch gibt es schon
 * updateNotes  -> was nach „Nach Updates suchen“ als Meldung kommt
 *
 * Breite, Farben und Schriften: styles/android-xool-drawer.css, Werte in styles/tokens-android-dark.css.
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { load } from "../core/lazy.js";
import { account } from "../data/account.js";
import { currentPhoto } from "../features/profile/avatar.js";
import { applyTheme, currentTheme, setTheme } from "../features/profile/theme.js";
import { isMobileVariant } from "../ui/platform.js";
import { openArchive, registerOverlay, showTab } from "../ui/router.js";
import { openSheet } from "../ui/sheet.js";
import { showToast } from "../ui/toast.js";
import { hasPendingUpdate } from "./update-prompt.js";
import { currentView } from "../ui/views.js";

const brand = "PARALIST";
const swipeClosePx = 56;
const languages = [
  { label: "Deutsch", active: true },
  { label: "English (demnächst)" },
  { label: "Español (demnächst)" },
];
const updateNotes = {
  current: { icon: "check-circle", title: "Du hast die neueste Version" },
  offline: { icon: "info", title: "Kein Netz — später noch einmal versuchen" },
};

const areas = [
  { label: "Übersicht", icon: "grid", tab: "home" },
  { label: "Kalender", icon: "calendar", tab: "calendar" },
  { label: "Aufgaben", icon: "checklist", tab: "tasks" },
  { label: "Medien", icon: "photos", tab: "media" },
  { label: "Archiv", icon: "archive", archive: true },
];

let layer = null;
let touchStart = null;

const isDark = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

function rowMarkup(area, index, active) {
  const on = area.tab && area.tab === active;
  return `
    <button class="xo-drawer-row${on ? " is-active" : ""}" type="button" data-xo-area="${index}"${on ? ' aria-current="page"' : ""}>
      ${icon(area.icon)}<span>${escapeHtml(area.label)}</span>
    </button>`;
}

function render() {
  const photo = currentPhoto();
  const face = photo ? `<img src="${photo}" alt="">` : escapeHtml(account.initials);
  const active = currentView();
  const since = account.since;
  layer.querySelector(".xo-drawer").innerHTML = `
    <header class="xo-drawer-head">
      <div class="xo-drawer-bar">
        <span class="xo-drawer-brand">${brand}</span>
        <button class="xo-drawer-close" type="button" data-xo-close aria-label="Menü schließen">${closeMarkup()}${hasPendingUpdate() ? '<span class="xo-dot" aria-hidden="true"></span>' : ""}</button>
      </div>
      <button class="xo-drawer-profile" type="button" data-xo-settings aria-label="Einstellungen öffnen">
        <span class="xo-drawer-avatar">${face}</span>
        <span class="xo-drawer-name">${escapeHtml(account.name)}</span>
        ${since ? `<span class="xo-drawer-since">${escapeHtml(since)}</span>` : ""}
      </button>
    </header>
    <div class="xo-drawer-scroll">
      <h2 class="xo-drawer-heading">Bereiche</h2>
      ${areas.map((area, index) => rowMarkup(area, index, active)).join("")}
    </div>
    <footer class="xo-drawer-foot">
      <button class="xo-drawer-lang" type="button" data-xo-lang aria-haspopup="dialog"><span>Deutsch</span>${icon("chevron", "xo-drawer-chevron")}</button>
      <div class="xo-drawer-tools">
        <button class="xo-drawer-tool xo-drawer-update" type="button" data-xo-update aria-label="Nach Updates suchen">${icon("refresh")}${hasPendingUpdate() ? '<span class="xo-dot" aria-hidden="true"></span>' : ""}</button>
        <button class="xo-drawer-tool" type="button" data-xo-theme aria-label="Hell oder Dunkel">${icon(isDark() ? "sun" : "moon")}</button>
        <button class="xo-drawer-tool" type="button" data-xo-settings aria-label="Einstellungen">${icon("settings")}</button>
      </div>
    </footer>`;
}

/* Das Menü-Zeichen der Xool-App: zwei Riegel, die sich im offenen Menü zum ✕ drehen;
   an den vier Enden des ✕ erscheinen rote Punkte (Stil: styles/android-xool-drawer.css) */
function closeMarkup() {
  return `<svg class="xo-x" viewBox="0 0 32 24" width="24" height="24" aria-hidden="true">
    <g class="xo-x-bar xo-x-top"><rect x="2" y="2" width="28" height="8" rx="4" /><circle cx="6" cy="6" r="2" /><circle cx="26" cy="6" r="2" /></g>
    <g class="xo-x-bar xo-x-bottom"><rect x="2" y="14" width="28" height="8" rx="4" /><circle cx="6" cy="18" r="2" /><circle cx="26" cy="18" r="2" /></g>
  </svg>`;
}

/* Die Sprache: es gibt nur Deutsch; die anderen stehen schon da, sind aber noch nicht wählbar */
function openLanguages() {
  openSheet("Sprache", languages.map((language) => ({ label: language.label, icon: "globe", active: Boolean(language.active), onSelect: () => {} })));
}

/* „Nach Updates suchen“: die Hülle (src/shell/update-prompt.js) sieht nach und lädt eine
   neuere Fassung gleich; hier steht nur, was sie zurückmeldet */
function checkUpdate(button) {
  if (button.dataset.busy === "1") return;
  button.dataset.busy = "1";
  button.classList.add("is-busy");
  emit(events.updateRequested, {
    report: (status) => {
      if (status === "checking" || status === "loading") return;
      button.dataset.busy = "";
      button.classList.remove("is-busy");
      if (updateNotes[status]) showToast(updateNotes[status]);
    },
  });
}

/** Ist das Menü offen? */
export function isXoolDrawerOpen() {
  return Boolean(layer) && !layer.hidden;
}

/** Das Menü schließen. */
export function closeXoolDrawer() {
  if (!isXoolDrawerOpen()) return;
  layer.classList.remove("is-open");
  layer.hidden = true;
  dom.device.classList.remove("is-xo-drawer");
  document.getElementById("tab-menu")?.setAttribute("aria-expanded", "false");
}

/** Das Menü öffnen. */
export function openXoolDrawer() {
  if (!isMobileVariant("xool")) return;
  render();
  layer.hidden = false;
  dom.device.classList.add("is-xo-drawer");
  document.getElementById("tab-menu")?.setAttribute("aria-expanded", "true");
  /* Erst im nächsten Bild die Klasse: sonst gleitet das Blatt nicht herein */
  requestAnimationFrame(() => layer.classList.add("is-open"));
}

function onClick(event) {
  if (event.target.closest("[data-xo-close]") || !event.target.closest(".xo-drawer")) {
    closeXoolDrawer();
    return;
  }
  const row = event.target.closest("[data-xo-area]");
  if (row) {
    const area = areas[Number(row.dataset.xoArea)];
    closeXoolDrawer();
    if (area.archive) openArchive();
    else showTab(area.tab);
    return;
  }
  if (event.target.closest("[data-xo-settings]")) {
    closeXoolDrawer();
    load("profile").then((module) => module.open());
  } else if (event.target.closest("[data-xo-lang]")) {
    openLanguages();
  } else if (event.target.closest("[data-xo-update]")) {
    checkUpdate(event.target.closest("[data-xo-update]"));
  } else if (event.target.closest("[data-xo-theme]")) {
    const next = isDark() ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    render();
  }
}

/** Das Menü anlegen und anmelden. */
export function initXoolDrawer() {
  layer = document.createElement("div");
  layer.className = "xo-drawer-layer";
  layer.hidden = true;
  layer.innerHTML = '<aside class="xo-drawer" role="dialog" aria-modal="true" aria-label="Menü"></aside>';
  dom.device.append(layer);
  layer.addEventListener("click", onClick);
  layer.addEventListener("touchstart", (event) => {
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  layer.addEventListener("touchend", (event) => {
    const start = touchStart;
    touchStart = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    /* Nur ein überwiegend waagerechter Zug nach rechts schließt, Scrollen nicht */
    if (dx > swipeClosePx && Math.abs(dx) > Math.abs(dy) * 1.5) closeXoolDrawer();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeXoolDrawer();
  });
  /* Der blaue Punkt am Menü-Reiter, sobald eine neuere Fassung bereitliegt */
  const markUpdate = () => document.getElementById("tab-menu")?.classList.toggle("has-update", hasPendingUpdate());
  on(events.updateFound, () => {
    markUpdate();
    if (isXoolDrawerOpen()) render();
  });
  markUpdate();
  on(events.viewWillChange, closeXoolDrawer);
  on(events.overlayOpened, closeXoolDrawer);
  registerOverlay("xool-drawer", { open: () => {}, hide: closeXoolDrawer });
}
