/*
 * Der Pfad oben in der Kopfzeile am Desktop. Auf einem Eintrag, einer
 * Sammlung oder einem Arbeitsbereich wandert die ganze Kopfzeile der Seite
 * (#entry-head, #page-head: Pfad, Kategorie, Favorit, Cover, Menü) dorthin —
 * dieselben Knöpfe an einem anderen Ort, ihre Klicks bleiben dieselben. Auf
 * der Suche steht nur ihr Name als Pfad, auf Profil und Fortschritt deren
 * Name. Die vier Seiten (Übersicht, Kalender, Aufgaben, Medien) tragen ihren
 * Namen schon groß auf der Seite — oben bleibt der Pfad dort leer, sonst
 * stünde er doppelt. Unter 1024px kehrt jede Kopfzeile an den Anfang ihrer
 * Seite zurück, wo sie am Handy steht.
 * Pfad: src/shell/desk-page-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * coverNames -> Name im Pfad, solange Profil oder Fortschritt über der Mitte liegt
 *
 * Aussehen steht in styles/desk-head.css (Zeile oben) und styles/entry-desk.css (Pfad).
 */

import { escapeHtml } from "../core/html.js";
import { isDesk } from "../ui/desk-mode.js";
import { currentView } from "../ui/views.js";
import { coveringPage } from "./desk-nav.js";

const coverNames = { profile: "Einstellungen", progress: "Fortschritt" };

/* Welche Ansicht welche Kopfzeile hat; beide stehen am Handy als erstes Kind ihrer Seite. */
const subpageHeads = { entry: "entry-head", page: "page-head" };
const tabNames = { search: "Suche" };

/* Der schlichte Pfad für Seiten ohne eigene Kopfzeile — einmal angelegt. */
let simple = null;

function simplePath(slot) {
  if (simple && simple.parentElement === slot) return simple;
  /* nav: auch der schlichte Pfad ist eine kleine Navigation („Brotkrumen“) */
  simple = document.createElement("nav");
  simple.className = "page-path desk-simple-path";
  simple.setAttribute("aria-label", "Pfad");
  slot.append(simple);
  return simple;
}

/* Die Kopfzeile zurück an den Anfang ihrer Seite. */
function sendHome(view, head) {
  const section = document.getElementById(`view-${view}`);
  if (section && head.parentElement !== section) section.prepend(head);
}

/**
 * Die passende Kopfzeile in `slot` holen, alle anderen heimschicken. Billig
 * genug für jeden Seitenwechsel: bewegt wird nur, was am falschen Ort steht.
 * @param slot der mittlere Teil der Kopfzeile oben (src/shell/desk-head.js)
 */
export function placePageHead(slot) {
  const covering = isDesk() ? coveringPage() : null;
  const view = currentView();
  const wanted = isDesk() && !covering ? subpageHeads[view] : null;

  Object.entries(subpageHeads).forEach(([name, id]) => {
    const head = document.getElementById(id);
    if (!head) return;
    if (id === wanted) {
      if (head.parentElement !== slot) slot.prepend(head);
    } else if (head.parentElement === slot) {
      sendHome(name, head);
    }
  });

  const label = wanted ? "" : covering ? coverNames[covering] : tabNames[view] || "";
  const path = simplePath(slot);
  path.hidden = !label;
  const markup = label ? `<span class="page-path-step is-current" aria-current="page">${escapeHtml(label)}</span>` : "";
  if (path.innerHTML !== markup) path.innerHTML = markup;
}

/** Unter 1024px: jede Kopfzeile zurück an ihre Seite. */
export function returnPageHeads() {
  Object.entries(subpageHeads).forEach(([name, id]) => {
    const head = document.getElementById(id);
    if (head) sendHome(name, head);
  });
}
