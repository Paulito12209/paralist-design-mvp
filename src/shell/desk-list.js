/*
 * Die Liste in der Seitenleiste am Desktop — nach dem Vorbild von T3 Code
 * und Codex: oben der Kopf „📥 Eingang 18 ˅“ (Icon und Name hell wie die
 * Gruppen-Köpfe in Raycast). Ein Klick darauf oder ⇧⌘L öffnet das Menü der
 * acht Listen („Liste wechseln“, der Hinweis erscheint beim Überfahren); die
 * Ziffer wählt. Rechts gegenüber legt das Plus in der Liste an. Darunter nur
 * die Zeilen dieser einen Liste; Arbeitsbereiche und Projekte klappen auf. Ein
 * Klick in die freie Fläche oder auf die blasse Zeile darunter legt in der
 * Liste an. Die Farbe der Liste färbt die Seitenleiste (data-desk-tone am
 * Gerätefenster). Ganz unten steht „Archiviert (n)“ und klappt bis zur
 * halben Höhe auf. Das Markup kommt aus src/shell/desk-list-rows.js, die
 * Klicks fängt src/shell/desk-nav.js.
 * Pfad: src/shell/desk-list.js
 *
 * Keine anpassbaren visuellen Werte: welche Listen es gibt, steht in
 * src/ui/desk-links.js (listLinks, listKey); Aussehen und Färbung in
 * styles/desk-nav-list.css und styles/desk-nav.css. Gemerkt werden die
 * gewählte Liste unter storageKeys.deskList und ob „Archiviert“ offen ist
 * unter storageKeys.deskArchive.
 */

import { emit, events, on } from "../core/bus.js";
import { formatNumber } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { readText, storageKeys, writeText } from "../core/storage.js";
import { listKey, listLink, listLinks, spokenKeys, withShiftCommand } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";
import { archiveCount, archiveRowsMarkup, listItems, listMenuMarkup, listRowsMarkup, toggleRowExpand } from "./desk-list-rows.js";

let parts = null;
/* Die gewählte Liste (listLinks). */
let chosen = listLinks[0];
let archiveOpen = false;
/* Zuletzt geschriebenes Markup je Behälter: Gleiches wird nicht neu gesetzt. */
const lastMarkup = new Map();

/*
 * Links „📥 Eingang 18 ˅“: Icon der Liste, Name, Zahl der Zeilen und der
 * Pfeil — ein Klick öffnet das Menü „Liste wechseln“, beim Überfahren steht
 * das Kürzel darunter. Rechts gegenüber das Plus: legt in der Liste an
 * („Neuer Arbeitsbereich“ …, sein Hinweis folgt der Liste).
 */
function headMarkup() {
  const keys = withShiftCommand(listKey);
  return `
    <div class="desk-list-head">
      <button class="desk-list-pick desk-hint-host desk-hint-start" type="button" data-list-menu="1" aria-haspopup="menu" aria-expanded="false" aria-controls="desk-list-menu" aria-keyshortcuts="${escapeHtml(spokenKeys(keys))}">
        <span class="desk-list-icon" data-list-slot="icon"></span>
        <span class="desk-list-name" data-list-slot="name"></span>
        <span class="desk-nav-count" data-list-slot="count"></span>
        ${icon("chevron", "desk-list-chevron")}
        <span class="desk-page-hint" aria-hidden="true">Liste wechseln ${keyCap(keys, " desk-kbd-inverse")}</span>
      </button>
      <button class="desk-list-new desk-hint-host desk-hint-end" type="button" data-list-add="1">
        ${icon("plus")}
        <span class="desk-page-hint" aria-hidden="true" data-list-slot="add-hint"></span>
      </button>
    </div>
    <div class="desk-list-menu" id="desk-list-menu" role="menu" aria-label="Liste wählen" hidden></div>`;
}

function archiveMarkup() {
  return `
    <button class="desk-nav-archive-toggle" type="button" data-archive-toggle="1" aria-expanded="false" aria-controls="desk-nav-archive">
      ${icon("chevron", "desk-nav-archive-chevron")}
      <span class="desk-nav-text">Archiviert</span>
      <span class="desk-nav-count" data-list-slot="archive-count"></span>
    </button>
    <div class="desk-nav-archive-list" id="desk-nav-archive" hidden></div>`;
}

/* Markup nur tauschen, wenn es sich wirklich geändert hat — sonst flackerte die Liste bei jedem Seitenwechsel. */
function swapMarkup(container, html) {
  if (lastMarkup.get(container) === html) return;
  lastMarkup.set(container, html);
  container.innerHTML = html;
}

/** Die gerade gezeigte Liste. */
/** Ist das Menü „Liste wechseln“ offen? */
export function isListMenuOpen() {
  return parts ? !parts.menu.hidden : false;
}

/** Das Menü öffnen: die gewählte Liste bekommt die Tastatur-Auswahl. */
export function openListMenu() {
  if (!parts || isListMenuOpen()) return;
  swapMarkup(parts.menu, listMenuMarkup(chosen.id));
  parts.menu.hidden = false;
  parts.menuButton.setAttribute("aria-expanded", "true");
  parts.menu.querySelector(".is-active")?.focus({ preventScroll: true });
}

/** Das Menü schließen; die Auswahl kehrt zu „Liste wechseln“ zurück, wenn sie im Menü stand. */
export function closeListMenu() {
  if (!parts || !isListMenuOpen()) return;
  const hadFocus = parts.menu.contains(document.activeElement);
  parts.menu.hidden = true;
  parts.menuButton.setAttribute("aria-expanded", "false");
  if (hadFocus) parts.menuButton.focus({ preventScroll: true });
}

export function toggleListMenu() {
  if (isListMenuOpen()) closeListMenu();
  else openListMenu();
}

/** Eine Liste wählen (Menü, Ziffer, ⌃ und Ziffer); sie bleibt gemerkt. */
export function chooseList(id) {
  closeListMenu();
  const link = listLink(id);
  if (link === chosen) return;
  chosen = link;
  writeText(storageKeys.deskList, chosen.id);
  renderDeskList(parts.lastActive);
}

/**
 * In der gezeigten Liste anlegen: das Eingabefeld geht mit dem passenden Typ
 * auf (src/features/composer/composer.js hört auf createRequested). Listen
 * ohne `create` (Archiv) legen nichts an.
 */
export function addToList() {
  if (chosen.create) emit(events.createRequested, chosen.create);
}

/** Einen Arbeitsbereich oder ein Projekt in der Leiste auf- oder zuklappen. */
export function toggleListRow(key) {
  toggleRowExpand(key);
  renderDeskList(parts.lastActive);
}

/** „Archiviert“ auf- oder zuklappen und das merken. */
export function toggleArchive() {
  archiveOpen = !archiveOpen;
  writeText(storageKeys.deskArchive, archiveOpen ? "1" : "");
  renderDeskList(parts.lastActive);
}

/* Pfeile wandern durch das Menü, Ziffern wählen, Escape schließt. */
function moveFocus(step) {
  const options = [...parts.menu.querySelectorAll("[data-list-pick]")];
  const index = options.indexOf(document.activeElement);
  const next = (index + step + options.length) % options.length;
  options[next].focus({ preventScroll: true });
}

/*
 * Solange das Menü offen ist, gehören ihm die Tasten — vor allen anderen
 * Kürzeln (src/shell/desk-keys.js prüft defaultPrevented), darum in der
 * Fangphase. ⇧⌘L schließt es wieder; das regelt desk-keys.js selbst.
 */
function onKeyDown(event) {
  if (!isListMenuOpen() || event.metaKey || event.ctrlKey || event.altKey) return;
  const byDigit = listLinks.find((link) => link.num === event.key);
  if (byDigit) chooseList(byDigit.id);
  else if (event.key === "Escape") closeListMenu();
  else if (event.key === "ArrowDown") moveFocus(1);
  else if (event.key === "ArrowUp") moveFocus(-1);
  else if (event.key === "Tab") closeListMenu();
  else return;
  event.preventDefault();
  event.stopPropagation();
}

/* Ein Klick außerhalb von Kopf-Knopf und Menü schließt das Menü (auch einer aufs Plus daneben). */
function onPointerDown(event) {
  if (!isListMenuOpen()) return;
  if (event.target.closest(".desk-list-pick, .desk-list-menu")) return;
  closeListMenu();
}

/*
 * Der Kopf zeigt die gewählte Liste: Icon in ihrer Farbe, Name und Zahl der
 * Zeilen; das Plus sagt, was es anlegt (im Archiv fehlt es). Die Seitenleiste
 * nimmt ihre Farbe an.
 */
function renderHead(count) {
  swapMarkup(parts.icon, icon(chosen.icon, `desk-nav-icon desk-nav-tone desk-nav-icon-${chosen.tone}`));
  if (parts.name.textContent !== chosen.title) parts.name.textContent = chosen.title;
  const shown = count ? formatNumber(count) : "";
  if (parts.count.textContent !== shown) parts.count.textContent = shown;
  parts.menuButton.setAttribute("aria-label", `${chosen.title}${count ? `, ${count === 1 ? "1 Zeile" : `${count} Zeilen`}` : ""} — Liste wechseln`);
  parts.add.hidden = !chosen.create;
  parts.add.setAttribute("aria-label", chosen.add || "");
  if (parts.addHint.textContent !== (chosen.add || "")) parts.addHint.textContent = chosen.add || "";
  parts.device.dataset.deskTone = chosen.tone;
  if (isListMenuOpen()) swapMarkup(parts.menu, listMenuMarkup(chosen.id));
}

/* „Archiviert (n)“: nur, wenn etwas drin liegt und die Liste nicht selbst das Archiv ist. */
function renderArchive(active) {
  const count = archiveCount();
  const shown = count > 0 && chosen.id !== "archive";
  parts.archive.hidden = !shown;
  if (!shown) return;
  parts.archiveCount.textContent = `(${formatNumber(count)})`;
  parts.archiveToggle.setAttribute("aria-expanded", String(archiveOpen));
  parts.archiveList.hidden = !archiveOpen;
  parts.archive.classList.toggle("is-open", archiveOpen);
  swapMarkup(parts.archiveList, archiveOpen ? archiveRowsMarkup(active) : "");
}

/**
 * Kopf, Zeilen und „Archiviert“ auffrischen.
 * @param active { collection, entry, workspace } aus activeTargets() (src/shell/desk-nav-parts.js)
 */
export function renderDeskList(active = {}) {
  if (!parts) return;
  parts.lastActive = active;
  const rows = listRowsMarkup(chosen, active);
  swapMarkup(parts.list, rows);
  /* Gezählt wird die Liste selbst — aufgeklappte Einträge darunter nicht */
  renderHead(listItems(chosen).length);
  renderArchive(active);
}

/**
 * Kopf, Liste und Archiv-Block einmal in ihre Plätze der Seitenleiste
 * schreiben (src/shell/desk-nav-parts.js) und die Tasten des Menüs anmelden.
 * @param nav das <aside class="desk-nav">
 */
export function mountDeskList(nav) {
  if (parts) return;
  const head = nav.querySelector('[data-nav-slot="list-head"]');
  const archive = nav.querySelector('[data-nav-slot="archive"]');
  head.innerHTML = headMarkup();
  archive.innerHTML = archiveMarkup();
  parts = {
    device: nav.closest(".device") || document.documentElement,
    menuButton: head.querySelector("[data-list-menu]"),
    menu: head.querySelector(".desk-list-menu"),
    add: head.querySelector(".desk-list-new"),
    addHint: head.querySelector('[data-list-slot="add-hint"]'),
    icon: head.querySelector('[data-list-slot="icon"]'),
    name: head.querySelector('[data-list-slot="name"]'),
    count: head.querySelector('[data-list-slot="count"]'),
    list: nav.querySelector('[data-nav-slot="list"]'),
    archive,
    archiveToggle: archive.querySelector("[data-archive-toggle]"),
    archiveCount: archive.querySelector('[data-list-slot="archive-count"]'),
    archiveList: archive.querySelector(".desk-nav-archive-list"),
    lastActive: {},
  };
  chosen = listLink(readText(storageKeys.deskList));
  archiveOpen = readText(storageKeys.deskArchive) === "1";
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  /* Ein Seitenwechsel schließt das Menü — es gehört zur verlassenen Lage */
  on(events.viewWillChange, closeListMenu);
}
