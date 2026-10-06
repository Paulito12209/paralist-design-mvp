/*
 * Die Desktop-Fassung: hängt Wortmarke (mit der Stufe) und Kopfzeile, die
 * Seitenleiste links (Icon-Zeile der Seiten, „Liste“, Fuß) und die Spalte rechts
 * ins Gerätefenster und hält alles aktuell. Das Seitenfenster rechts
 * (src/shell/desk-side.js) lädt erst beim ersten Öffnen. Das Modul wird erst
 * geladen, wenn das Fenster breit genug ist (src/main.js) — am Handy kommt
 * es gar nicht erst an.
 * Pfad: src/shell/desk.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * clockTick   -> wie oft die rechte Spalte „jetzt“ nachstellt und der Tageswechsel
 *                geprüft wird (Millisekunden)
 *
 *
 * Die Tastenkürzel selbst stehen in src/shell/desk-keys.js.
 */

import { emit, events, on } from "../core/bus.js";
import { dayKey } from "../core/dates.js";
import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { readJson, storageKeys } from "../core/storage.js";
import { hintPlaces, hintsShown } from "../data/shortcut-hints.js";
import { isDesk, isRailShown, onDeskChange } from "../ui/desk-mode.js";
import { mountDeskHead, placeLevelButton, renderDeskHead } from "./desk-head.js";
import { mountDeskFoot, renderDeskFoot } from "./desk-foot.js";
import { initDeskKeys } from "./desk-keys.js";
import { mountDeskNav, renderDeskNav } from "./desk-nav.js";
import { returnPageHeads } from "./desk-page-head.js";
import { mountDeskPages, renderDeskPages } from "./desk-pages.js";
import { mountDeskRail, registerRailCards, renderDeskRail } from "./desk-rail.js";
import { setSearchTakeover } from "./search-bar.js";
import { closePalette, takeOverSearchField } from "./search-palette.js";

const clockTick = 60000;

let mounted = false;
let clock = null;
/* Tag der letzten Zeichnung: wechselt er über Nacht, stimmen „heute“-Zahlen nicht mehr. */
let shownDay = dayKey(new Date());

/* Seitenleiste und Kopfzeile neu zeichnen — nur, wenn sie gerade zu sehen sind.
   Unter 1024px kehren die Kopfzeilen der Unterseiten an ihre Seite zurück. */
function refreshNav() {
  if (!isDesk()) {
    returnPageHeads();
    return;
  }
  renderDeskNav();
  renderDeskPages();
  renderDeskFoot();
  renderDeskHead();
}

/* Rechte Spalte neu zeichnen — nur, wenn sie gerade zu sehen ist. */
function refreshRail() {
  if (isRailShown()) renderDeskRail();
}

function refreshAll() {
  placeLevelButton(isDesk());
  refreshNav();
  refreshRail();
  syncClock();
  syncSearchField();
}

/*
 * Am Desktop tippt man nur in der Palette (Lupe oben in der Seitenleiste,
 * ⌘K, „/“); das Suchfeld des Handys ist dort ausgeblendet und nimmt keine
 * Zeichen an. Unter 1024px ist es wieder das gewohnte Suchfeld, und eine
 * offene Palette verschwindet.
 */
function syncSearchField() {
  dom.searchInput.readOnly = isDesk();
  if (!isDesk()) closePalette();
}

/*
 * Jede Minute: die rechte Spalte stellt „jetzt“ nach. Nach Mitternacht gilt
 * ein neuer Tag — das wird wie eine Datenänderung gemeldet, damit jede
 * sichtbare Zahl mit „heute“ neu zählt: Seitenleiste, rechte Spalte, der Kopf
 * der Übersicht und der Kalender. Ein Fenster bleibt am Rechner oft über
 * Nacht offen, ohne je in den Hintergrund zu gehen.
 */
function tick() {
  const today = dayKey(new Date());
  if (today === shownDay) {
    refreshRail();
    return;
  }
  shownDay = today;
  emit(events.dataChanged);
}

/*
 * Die Uhr läuft nur, solange die Desktop-Fassung zu sehen und die App im
 * Vordergrund ist — sonst tickte sie umsonst.
 */
function syncClock() {
  const wanted = isDesk() && !document.hidden;
  if (wanted && !clock) clock = setInterval(tick, clockTick);
  if (!wanted && clock) {
    clearInterval(clock);
    clock = null;
  }
}

/*
 * Die Tasten-Schilder ausblenden, wo Profil › Kurzbefehle sie abgeschaltet
 * hat: .hide-nav-kbd (Seitenleiste samt Suchfeld) und .hide-tabs-kbd
 * (Reiterzeile) wirken in styles/desk-kbd.css.
 */
function applyHints() {
  hintPlaces.forEach((place) => dom.device.classList.toggle(`hide-${place}-kbd`, !hintsShown(place)));
}

/* aside: eine Spalte neben dem Hauptinhalt, für Vorlesehilfen als Nebenbereich erkennbar. */
function createColumn(className, label) {
  const column = document.createElement("aside");
  column.className = className;
  column.setAttribute("aria-label", label);
  return column;
}

/**
 * Seitenleiste und rechte Spalte einhängen. Darf mehrmals aufgerufen werden —
 * etwa bei jedem Wechsel über die Breitengrenze; eingehängt wird nur einmal,
 * danach hält onDeskChange unten alles aktuell.
 * @param handlers { railCards, theme } aus den Seiten,
 *   von src/main.js hereingegeben; `railCards` ordnet einer Ansicht die
 *   Funktion zu, die ihre Karten für die rechte Spalte lädt, `theme` ist
 *   { current, set } für den Schalter Hell/Dunkel im Fuß.
 */
export function initDesk(handlers = {}) {
  if (mounted) return;
  mounted = true;

  const nav = createColumn("desk-nav", "Seitenleiste");
  const rail = createColumn("desk-rail", "Heute und zuletzt");
  /* Reihenfolge im Gerätefenster: Wortmarke, Suche, Seitenleiste, Kopfzeile,
     Inhalt, rechte Spalte — so springt die Tab-Taste in derselben Folge, in
     der man liest. Die Kopfzeile hängt sich selbst vor den Inhalt. */
  document.querySelector(".top-bar").after(nav);
  dom.content.after(rail);

  mountDeskHead();
  mountDeskNav(nav);
  mountDeskPages(nav.querySelector('[data-nav-slot="pages"]'));
  mountDeskFoot(nav.querySelector('[data-nav-slot="foot"]'), handlers.theme || null);
  mountDeskRail(rail);
  Object.entries(handlers.railCards || {}).forEach(([view, importFn]) => registerRailCards(view, importFn));
  /* Anderer Tag im Kalender, anderer markierter Treffer: nur die Spalte rechts. */
  on(events.contextChanged, refreshRail);
  on(events.shortcutHintsChanged, applyHints);
  applyHints();
  on(events.profileChanged, refreshNav);
  /* Profil und Fortschritt liegen am Desktop über der Mitte: der Pfad oben nennt sie */
  on(events.overlayOpened, refreshNav);

  on(events.dataChanged, refreshAll);
  on(events.xpChanged, refreshAll);
  /* Auch die rechte Spalte: „Zuletzt geöffnet“ soll den eben geöffneten
     Eintrag sofort zeigen — Öffnen allein meldet keine Datenänderung. */
  on(events.viewOpened, () => {
    refreshNav();
    refreshRail();
  });
  onDeskChange(refreshAll);
  /* Zurück im Vordergrund — vielleicht erst am nächsten Morgen: gleich
     nachstellen, statt bis zum nächsten Minutentakt zu warten. */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
    syncClock();
  });
  initDeskKeys();
  setSearchTakeover((event) => takeOverSearchField(event, isDesk()));
  /* Die Palette hat keinen Verlaufsschritt. Geht es im Verlauf zurück oder
     vor, wechselt die Seite darunter — die Palette gehört nicht mehr dazu. */
  window.addEventListener("popstate", closePalette);

  refreshAll();
  /* War das Seitenfenster beim letzten Mal offen, geht es wieder auf. */
  if (readJson(storageKeys.deskSide, {})?.open) load("deskSide").then((module) => module.initSide());
}
