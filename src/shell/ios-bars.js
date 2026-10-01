/*
 * iOS-Fassung, Verhalten beim Scrollen und die Kopfzeile:
 * - sobald der Inhalt unter die Kopfzeile läuft, bekommt sie die harte
 *   Scrollkante (is-scroll-edge),
 * - ist der große Titel ganz darunter verschwunden, steht er klein in ihrer
 *   Mitte (is-title-collapsed),
 * - beim Scrollen nach unten schrumpft die Tab-Leiste auf den gewählten
 *   Reiter, beim Scrollen nach oben oder einem Tipp auf sie wächst sie wieder
 *   (is-tabbar-min).
 * Dazu legt die Datei den runden Such-Knopf oben rechts und den kleinen Titel
 * in die Kopfzeile. Aussehen in styles/ios.css.
 * Pfad: src/shell/ios-bars.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * edgeFrom -> ab so vielen Pixeln Scrollhöhe erscheint die Scrollkante
 * Wie früh die Leiste schrumpft, steht in src/shell/scroll-direction.js.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { showSearch } from "../ui/router.js";
import { isMobileOs } from "./platform.js";
import { directionTracker } from "./scroll-direction.js";

const edgeFrom = 2;

const direction = directionTracker();
let topBar = null;
let inlineTitle = null;
/* Ab welcher Scrollhöhe der große Titel ganz unter der Kopfzeile liegt;
   null heißt: für diese Seite noch nicht gemessen. */
let titleLimit = null;

/** Ist gerade die iOS-Fassung am Handy oder Tablet zu sehen? */
export function isIosMobile() {
  return isMobileOs("ios");
}

/** Die Tab-Leiste wieder ganz zeigen — beim Anlegen und nach einem Tipp auf sie. */
export function expandTabBar() {
  dom.device.classList.remove("is-tabbar-min");
  direction.reset(dom.content.scrollTop);
}

/* Der große Titel der offenen Reiterseite; Unterseiten haben ihre eigene Kopfzeile. */
function activeTitle() {
  if (document.body.classList.contains("is-subpage")) return null;
  return document.querySelector(".view:not([hidden]) > .screen-title");
}

/* Nur das erste Wort-Stück: neben „Medien“ steht noch der Knopf „Ressourcen“. */
function titleText(title) {
  const first = [...title.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  return first ? first.textContent.trim() : title.textContent.trim();
}

/* Einmal je Seite gemessen, nicht bei jedem Scrollschritt. offsetTop zählt
   ab der Inhaltsfläche (.content ist der Bezugsrahmen). */
function measureTitle() {
  const title = activeTitle();
  if (!title) {
    titleLimit = Infinity;
    inlineTitle.textContent = "";
    return;
  }
  inlineTitle.textContent = titleText(title);
  titleLimit = title.offsetTop + title.offsetHeight - topBar.offsetHeight;
}

/* Neue Seite: alles zurück in den Ruhezustand, gemessen wird beim ersten Scrollen. */
function resetBars() {
  dom.device.classList.remove("is-scroll-edge", "is-title-collapsed", "is-tabbar-min");
  titleLimit = null;
  direction.reset(dom.content.scrollTop);
}

/* Beim Suchen und Anlegen bleibt die Leiste ganz: dort stehen Knöpfe darin. */
function barPinned() {
  return document.body.classList.contains("is-search") || !dom.composer.hidden;
}

function onScroll() {
  if (!isIosMobile()) return;
  const y = dom.content.scrollTop;
  const classes = dom.device.classList;
  classes.toggle("is-scroll-edge", y > edgeFrom);
  if (titleLimit === null) measureTitle();
  classes.toggle("is-title-collapsed", y > titleLimit);
  if (barPinned()) return;
  const turn = direction.step(y, classes.contains("is-tabbar-min"));
  if (turn === "away") classes.add("is-tabbar-min");
  else if (turn === "back") classes.remove("is-tabbar-min");
}

/* Tipp auf die geschrumpfte Leiste: erst wachsen, nicht gleich den Reiter wechseln.
   capture: kommt vor dem Klick-Empfänger des Reiters an. */
function onNavTap(event) {
  if (!isIosMobile() || !dom.device.classList.contains("is-tabbar-min")) return;
  if (dom.navShell.classList.contains("is-composing")) return;
  event.preventDefault();
  event.stopPropagation();
  expandTabBar();
}

/* Der runde Such-Knopf steht vor dem Profil; er öffnet die Suchseite, auf der
   dann das Feld an seiner Stelle erscheint. */
function buildSearchButton() {
  const button = document.createElement("button");
  button.className = "ios-search-btn";
  button.type = "button";
  button.setAttribute("aria-label", "Suchen");
  button.innerHTML = icon("search");
  button.addEventListener("click", () => showSearch());
  return button;
}

/** Such-Knopf und kleinen Titel einhängen, Zuhörer anmelden. */
export function initIosBars() {
  topBar = document.querySelector(".top-bar");
  inlineTitle = document.createElement("span");
  inlineTitle.className = "ios-inline-title";
  inlineTitle.setAttribute("aria-hidden", "true");
  topBar.insertBefore(buildSearchButton(), dom.profileBtn);
  topBar.append(inlineTitle);

  /* passive: der Zuhörer hält das Scrollen nie auf */
  dom.content.addEventListener("scroll", onScroll, { passive: true });
  dom.navShell.addEventListener("click", onNavTap, true);
  on(events.viewOpened, resetBars);
  on(events.overlayOpened, expandTabBar);
  /* Andere Breite, anderer Umbruch: der Titel wird beim nächsten Scrollen neu gemessen */
  window.addEventListener("resize", () => {
    titleLimit = null;
  });
}
