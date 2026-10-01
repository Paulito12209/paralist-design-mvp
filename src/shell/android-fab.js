/*
 * Android-Fassung: der Plus-Knopf rechts über der Navigationsleiste und sein
 * Menü. Ein Tipp legt einen Schleier über die App und stapelt rechts die
 * Arten zum Anlegen übereinander, von unten nach oben in der Reihenfolge von
 * `menuItems`. Ein Eintrag öffnet das Eingabefeld mit dieser Art — der
 * Arbeitsbereich entsteht wie auf seiner Seite gleich mit Namensfeld.
 * Knopf und Menü gibt es immer im Dokument; zu sehen sind sie nur in der
 * Android-Fassung (styles/android-fab.css).
 * Pfad: src/shell/android-fab.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * fabLabel  -> das Wort auf dem Knopf, solange er breit ist
 * menuItems -> was das Menü anbietet, von unten nach oben: Art, Name und
 *              (beim Arbeitsbereich) eigenes Icon; sonst kommt das Icon der Art
 *              aus src/data/config.js
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { typeIcon } from "../data/config.js";
import { addWorkspace } from "../data/mutations.js";
import { openWorkspacesPage, registerOverlay } from "../ui/router.js";
import { isAndroidMobile, showBars } from "./android-bars.js";

const fabLabel = "Neu";

/* Die Arbeitsbereiche sind keine Einträge und haben darum keinen Typ — sie
   bekommen ihr Icon hier. */
const workspaceItem = "arbeitsbereich";

const menuItems = [
  { type: "termin", label: "Termin" },
  { type: "aufgabe", label: "Aufgabe" },
  { type: "notiz", label: "Notiz" },
  { type: "projekt", label: "Projekt" },
  { type: workspaceItem, label: "Arbeitsbereich", icon: "layers" },
  { type: "dokument", label: "Dokument" },
  { type: "zeichnung", label: "Zeichnung" },
  { type: "lesezeichen", label: "Lesezeichen" },
  { type: "medien", label: "Medium" },
];

let fab = null;
let menu = null;

/* Der Knopf: Plus und Wort; das Wort fährt beim Scrollen ein (styles/android-fab.css). */
function buildFab() {
  const button = document.createElement("button");
  button.className = "m3-fab";
  button.type = "button";
  button.setAttribute("aria-label", "Neu anlegen");
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = `${icon("plus")}<span class="m3-fab-label">${escapeHtml(fabLabel)}</span>`;
  return button;
}

/* Das Menü: oben steht der letzte Eintrag, deshalb umgekehrt aufgebaut.
   --i zählt von unten, damit der unterste zuerst hereingleitet. */
function buildMenu() {
  const items = menuItems
    .map((item, index) => ({ ...item, index }))
    .reverse()
    .map(
      (item) => `
        <button class="m3-fab-menu-item" type="button" role="menuitem" data-fab-create="${item.type}" style="--i:${item.index}">
          ${icon(item.icon || typeIcon(item.type))}<span>${escapeHtml(item.label)}</span>
        </button>`
    )
    .join("");
  const layer = document.createElement("div");
  layer.className = "m3-fab-menu";
  layer.hidden = true;
  layer.innerHTML = `
    <div class="m3-fab-menu-list" role="menu" aria-label="Neu anlegen">${items}</div>
    <button class="m3-fab-close" type="button" aria-label="Menü schließen">${icon("close")}</button>`;
  return layer;
}

function isMenuOpen() {
  return Boolean(menu) && !menu.hidden;
}

/* Escape schließt das Menü wie ein Tipp auf den Schleier */
function onKey(event) {
  if (event.key === "Escape") closeFabMenu();
}

function openFabMenu() {
  /* Der Schließen-Knopf steht genau dort, wo der Plus-Knopf steht — einmal
     beim Öffnen gemessen, danach bewegt sich nichts mehr. */
  const fabBox = fab.getBoundingClientRect();
  const deviceBox = dom.device.getBoundingClientRect();
  menu.style.setProperty("--m3-menu-bottom", `${Math.round(deviceBox.bottom - fabBox.bottom)}px`);
  menu.hidden = false;
  dom.device.classList.add("is-fab-open");
  fab.setAttribute("aria-expanded", "true");
  /* Erst im nächsten Bild die Klasse: sonst blendet der Schleier nicht ein, sondern ist sofort da. */
  requestAnimationFrame(() => menu.classList.add("is-open"));
  document.addEventListener("keydown", onKey);
}

/** Das Menü ohne Verlaufsschritt schließen. */
export function closeFabMenu() {
  if (!isMenuOpen()) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  dom.device.classList.remove("is-fab-open");
  fab.setAttribute("aria-expanded", "false");
  document.removeEventListener("keydown", onKey);
}

/* Ein Eintrag gewählt: Arbeitsbereich direkt auf seiner Seite, sonst das Eingabefeld. */
function create(type) {
  closeFabMenu();
  showBars();
  if (type === workspaceItem) {
    openWorkspacesPage();
    addWorkspace();
    return;
  }
  emit(events.createRequested, type);
}

function onMenuClick(event) {
  const item = event.target.closest("[data-fab-create]");
  if (item) {
    create(item.dataset.fabCreate);
    return;
  }
  /* Schleier oder ✕: zu */
  closeFabMenu();
}

/** Knopf und Menü einhängen und anmelden. */
export function initAndroidFab() {
  fab = buildFab();
  menu = buildMenu();
  /* Der Knopf hängt an der Leiste, damit er beim Wegscrollen mit ihr nach unten rückt. */
  dom.navShell.append(fab);
  dom.device.append(menu);

  fab.addEventListener("click", () => {
    if (!isAndroidMobile()) return;
    if (isMenuOpen()) closeFabMenu();
    else openFabMenu();
  });
  menu.addEventListener("click", onMenuClick);

  on(events.viewWillChange, closeFabMenu);
  on(events.overlayOpened, closeFabMenu);
  /* Browser-Zurück schließt alle angemeldeten Blätter, das Menü mit */
  registerOverlay("fab-menu", { open: () => {}, hide: closeFabMenu });
}
