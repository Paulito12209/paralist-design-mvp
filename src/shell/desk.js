/*
 * Die Desktop-Fassung: hängt die Seitenleiste links und die Spalte rechts ins
 * Gerätefenster, hält beide aktuell und kennt die Tastenkürzel. Das Modul wird
 * erst geladen, wenn das Fenster breit genug ist (src/main.js) — am Handy
 * kommt es gar nicht erst an.
 * Pfad: src/shell/desk.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * clockTick   -> wie oft die rechte Spalte „jetzt“ nachstellt und der Tageswechsel
 *                geprüft wird (Millisekunden)
 *
 * Welche Zifferntaste welche Hauptseite öffnet, steht bei den Zeilen der
 * Seitenleiste (pageLinks in src/shell/desk-nav-parts.js) — so können Taste
 * und Hinweis-Schild daneben nie auseinanderlaufen.
 *
 * Tastenkürzel (nur, solange nicht in ein Feld getippt wird und kein Blatt offen ist):
 *   N            -> Eingabefeld zum Anlegen öffnen
 *   /  oder ⌘K   -> ins Suchfeld springen
 *   1 bis 4      -> Übersicht, Kalender, Aufgaben, Medien
 *   Escape       -> schließt, was obenauf liegt: Menü, Auswahl-Blatt, Dialog,
 *                   Dateiansicht, zuletzt das Eingabefeld — auch beim Tippen darin
 */

import { emit, events, on } from "../core/bus.js";
import { dayKey } from "../core/dates.js";
import { dom, el } from "../core/dom.js";
import { closeCtxMenu } from "../ui/ctx-menu.js";
import { isDesk, isRailShown, onDeskChange } from "../ui/desk-mode.js";
import { showTab } from "../ui/router.js";
import { closeSheet } from "../ui/sheet.js";
import { pageLinks } from "./desk-nav-parts.js";
import { mountDeskNav, renderDeskNav } from "./desk-nav.js";
import { mountDeskRail, renderDeskRail } from "./desk-rail.js";

const clockTick = 60000;
const navKeys = Object.fromEntries(pageLinks.map((link) => [link.key, link.tab]));

/* Offene Ebenen, über denen kein Kürzel etwas auslösen darf. */
const openLayers =
  ".modal-backdrop:not([hidden]), .sheet-backdrop:not([hidden]), .ctx-backdrop:not([hidden]), .viewer-backdrop:not([hidden]), .update-backdrop:not([hidden])";

let mounted = false;
let clock = null;
/* Tag der letzten Zeichnung: wechselt er über Nacht, stimmen „heute“-Zahlen nicht mehr. */
let shownDay = dayKey(new Date());

/* Seitenleiste neu zeichnen — nur, wenn sie gerade zu sehen ist. */
function refreshNav() {
  if (isDesk()) renderDeskNav();
}

/* Rechte Spalte neu zeichnen — nur, wenn sie gerade zu sehen ist. */
function refreshRail() {
  if (isRailShown()) renderDeskRail();
}

function refreshAll() {
  refreshNav();
  refreshRail();
  syncClock();
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

/* Tippt man gerade in ein Feld? Dann gehört jede Taste dem Feld. */
function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/*
 * Escape schließt die oberste Ebene über ihren eigenen Knopf — so läuft alles
 * über denselben Weg wie ein Klick, samt Verlauf und Zurück-Pfeil.
 * Gibt `true` zurück, wenn es etwas zu schließen gab.
 */
function closeTopLayer() {
  if (document.querySelector(".update-backdrop:not([hidden])")) return false;
  if (!dom.ctxMenu.hidden) {
    closeCtxMenu();
    return true;
  }
  if (!dom.sheet.hidden) {
    closeSheet();
    return true;
  }
  const viewerClose = document.querySelector(".viewer-backdrop:not([hidden]) [data-viewer='close']");
  /* Mehrere Blätter können offen sein (Profilbild über dem Profil): das
     zuletzt eingehängte liegt oben. */
  const modals = document.querySelectorAll(".modal-backdrop:not([hidden]) .modal-close");
  const closeButton = viewerClose || modals[modals.length - 1];
  if (closeButton) {
    closeButton.click();
    return true;
  }
  if (!dom.composer.hidden) {
    el("composer-close").click();
    return true;
  }
  return false;
}

/* Nach einem Seitenwechsel per Taste steht der Fokus sonst weiter auf einem
   Knopf der alten Seite — und zeigt dort seinen Tastatur-Rahmen. */
function dropStaleFocus() {
  const active = document.activeElement;
  if (active && active !== document.body && !isTyping(active)) active.blur();
}

function onKeyDown(event) {
  if (!isDesk() || event.defaultPrevented) return;
  if (event.key === "Escape") {
    /* Das Update-Fenster schließt sich bei Escape selbst, noch bevor die Taste
       hier ankommt — sie darf dann nicht auch noch die Ebene darunter zumachen
       (ein offener Entwurf im Eingabefeld ginge verloren). */
    if (event.target instanceof Element && event.target.closest(".update-backdrop")) return;
    if (closeTopLayer()) event.preventDefault();
    return;
  }
  const commandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (!commandK && (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target))) return;
  if (document.querySelector(openLayers)) return;

  if (commandK || event.key === "/") {
    event.preventDefault();
    dom.searchInput.focus();
    return;
  }
  if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    emit(events.createRequested);
    return;
  }
  if (navKeys[event.key]) {
    event.preventDefault();
    dropStaleFocus();
    showTab(navKeys[event.key]);
  }
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
 * @param handlers { openWorkspaceMenu } aus den Seiten, von src/main.js hereingegeben.
 */
export function initDesk(handlers = {}) {
  if (mounted) return;
  mounted = true;

  const nav = createColumn("desk-nav", "Seitenleiste");
  const rail = createColumn("desk-rail", "Heute und zuletzt");
  /* Reihenfolge im Gerätefenster: Kopfzeile, Seitenleiste, Inhalt, rechte
     Spalte — so springt die Tab-Taste in derselben Folge, in der man liest. */
  document.querySelector(".top-bar").after(nav);
  dom.content.after(rail);

  mountDeskNav(nav, handlers);
  mountDeskRail(rail);

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
  document.addEventListener("keydown", onKeyDown);

  refreshAll();
}
