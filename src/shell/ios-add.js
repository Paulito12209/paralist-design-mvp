/*
 * iOS-Fassung: der hervorgehobene runde Plus-Knopf rechts neben der
 * Tab-Leiste und sein Apple-Menü. Ein Tipp lässt über dem Knopf eine
 * Glas-Karte aufgehen; der erste Eintrag steht dem Knopf am nächsten (Liste und
 * Wirkung in src/shell/create-menu.js, dieselbe wie bei Android). Ein Tipp
 * daneben, Escape, Browser-Zurück oder ein Seitenwechsel schließt es.
 * Aussehen in styles/ios.css (Knopf) und styles/ios-menu.css (Menü).
 * Pfad: src/shell/ios-add.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuGap -> Luft zwischen Knopf und Menü (Pixel)
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { registerOverlay } from "../ui/router.js";
import { createFromMenu, createMenuItems } from "./create-menu.js";
import { expandTabBar, isIosMobile } from "./ios-bars.js";

const menuGap = 10;

let button = null;
let menu = null;

function buildButton() {
  const add = document.createElement("button");
  add.className = "ios-add";
  add.type = "button";
  add.setAttribute("aria-label", "Neu anlegen");
  add.setAttribute("aria-haspopup", "menu");
  add.setAttribute("aria-expanded", "false");
  add.innerHTML = icon("plus");
  return add;
}

/* Das Menü geht nach oben auf: der erste Eintrag gehört nach unten, an den
   Knopf — darum umgekehrt aufgebaut. */
function buildMenu() {
  const rows = createMenuItems()
    .reverse()
    .map(
      (item) => `
        <button class="ios-menu-row" type="button" role="menuitem" data-ios-create="${item.type}">
          <span>${escapeHtml(item.label)}</span>${icon(item.icon)}
        </button>`
    )
    .join("");
  const layer = document.createElement("div");
  layer.className = "ios-menu";
  layer.hidden = true;
  layer.innerHTML = `<div class="ios-menu-card" role="menu" aria-label="Neu anlegen">${rows}</div>`;
  return layer;
}

function isMenuOpen() {
  return Boolean(menu) && !menu.hidden;
}

function onKey(event) {
  if (event.key === "Escape") closeIosMenu();
}

function openMenu() {
  /* Einmal beim Öffnen gemessen: die Karte beginnt knapp über dem Knopf */
  const addBox = button.getBoundingClientRect();
  const deviceBox = dom.device.getBoundingClientRect();
  menu.style.setProperty("--ios-menu-bottom", `${Math.round(deviceBox.bottom - addBox.top + menuGap)}px`);
  menu.hidden = false;
  button.setAttribute("aria-expanded", "true");
  /* Erst im nächsten Bild: sonst wächst die Karte nicht, sondern ist sofort da */
  requestAnimationFrame(() => menu.classList.add("is-open"));
  document.addEventListener("keydown", onKey);
}

/** Das Menü ohne Verlaufsschritt schließen. */
export function closeIosMenu() {
  if (!isMenuOpen()) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  button.setAttribute("aria-expanded", "false");
  document.removeEventListener("keydown", onKey);
}

function onMenuClick(event) {
  const row = event.target.closest("[data-ios-create]");
  closeIosMenu();
  if (!row) return;
  expandTabBar();
  createFromMenu(row.dataset.iosCreate);
}

/** Knopf und Menü einhängen und anmelden. */
export function initIosAdd() {
  button = buildButton();
  menu = buildMenu();
  /* Der Knopf hängt an der unteren Leiste und verschwindet mit ihr beim Schreiben. */
  dom.bottomBar.append(button);
  dom.device.append(menu);

  button.addEventListener("click", () => {
    if (!isIosMobile()) return;
    if (isMenuOpen()) closeIosMenu();
    else openMenu();
  });
  menu.addEventListener("click", onMenuClick);

  on(events.viewWillChange, closeIosMenu);
  on(events.overlayOpened, closeIosMenu);
  /* Browser-Zurück schließt alle angemeldeten Blätter, das Menü mit */
  registerOverlay("ios-menu", { open: () => {}, hide: closeIosMenu });
}
