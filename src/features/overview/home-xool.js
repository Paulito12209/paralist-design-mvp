/*
 * „Android (Xool-DB)“, Übersicht: die zwei Reiter „Markiert · Listen“ über der
 * Liste, wie „Meine Ablage · Computer“ in Google Drive. Hinter jedem Reiter
 * steckt eine gewählte Liste: der ruhende Reiter zeigt ihr Icon, der aktive nur
 * seinen Namen. Die Listenwahl öffnen der Name im Kopf der Liste darunter
 * und der Pfeil rechts daneben als Blatt „Liste wählen“ mit den Listen dieses
 * Reiters: unter „Markiert“ Angepinnt und Favoriten, unter „Listen“ die Listen der
 * Seitenleiste in den Gruppen der Xool-App, die gewählte allein ganz oben. Der
 * Regler (nur Projekte) ist ein Knopf über der Leiste
 * (src/features/overview/home-list.js, styles/android-xool-pages.css).
 * Gemerkt werden der Reiter und je Reiter die gewählte Liste.
 * Pfad: src/features/overview/home-xool.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuTitle   -> Überschrift des Blatts mit den Listen
 * tabLabels   -> Namen der beiden Reiter
 * markedLinks -> was unter „Markiert“ zur Wahl steht, die erste ist die Vorgabe
 * listGroups  -> die Gruppen im Blatt unter „Listen“ (zwischen ihnen ein Strich);
 *                die erste Liste der ersten Gruppe ist die Vorgabe
 * defaultTab  -> welcher Reiter ohne gespeicherte Wahl offen ist
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { readText, storageKeys, writeText } from "../../core/storage.js";
import { overviewPages } from "../../data/config.js";
import { listLinks } from "../../ui/desk-links.js";
import { isMobileVariant } from "../../ui/platform.js";
import { openSheet } from "../../ui/sheet.js";

const menuTitle = "Liste wählen";
const tabLabels = { marked: "Markiert", lists: "Listen" };
const defaultTab = "marked";
const listGroups = [
  ["inbox", "tasks", "events"],
  ["bookmarks"],
  ["projects", "workspaces", "resources", "archive"],
];

/* Angepinnt und Favoriten sind keine Listen der Seitenleiste; Favoriten haben die Seite hinter der Kachel */
export const markedLinks = [
  { id: "pinned", title: "Angepinnt", icon: "pinned" },
  { id: "favorites", title: overviewPages[2].title, icon: overviewPages[2].icon },
];
const listedLinks = listGroups.flat().map((id) => listLinks.find((link) => link.id === id));

/** Ist gerade „Android (Xool-DB)“ am Handy zu sehen? */
export function isXoolHome() {
  return isMobileVariant("xool");
}

/** Der gewählte Reiter: „marked“ oder „lists“. */
export function xoolTab() {
  const saved = readText(storageKeys.homeTab);
  return saved === "marked" || saved === "lists" ? saved : defaultTab;
}

/* Die Liste, die unter dem Reiter gemerkt ist; ohne gültige Wahl die erste. */
function chosenIn(links, key) {
  const saved = readText(key);
  return links.find((link) => link.id === saved) || links[0];
}

/** Die Liste, die gerade unter den Kacheln steht: die gewählte des offenen Reiters. */
export function xoolList() {
  return xoolTab() === "marked" ? chosenIn(markedLinks, storageKeys.homeMarked) : chosenIn(listedLinks, storageKeys.homeList);
}

/* Das Zeichen im Reiter: der ruhende trägt das Icon seiner gewählten Liste, der aktive nur seinen
   Namen — die Listenwahl steht im Kopf der Liste darunter (xoolBarMarkup). */
function tabMarkup(tab) {
  const on = xoolTab() === tab;
  const link = tab === "marked" ? chosenIn(markedLinks, storageKeys.homeMarked) : chosenIn(listedLinks, storageKeys.homeList);
  const glyph = on ? "" : icon(link.icon, "home-xool-glyph");
  return `
    <button class="home-xool-tab${on ? " is-on" : ""}" type="button" role="tab" aria-selected="${on}" data-home-xool-tab="${tab}">
      <span class="home-xool-tab-label"><span>${tabLabels[tab]}</span>${glyph}</span>
    </button>`;
}

/** Die Reiterzeile „Markiert · Listen“. */
export function xoolTabsMarkup() {
  return `<div class="home-xool-tabs" role="tablist">${tabMarkup("marked")}${tabMarkup("lists")}</div>`;
}

/**
 * Der Kopf der Liste unter den Reitern, eine Karte wie in der Xool-App: links Name und Anzahl,
 * rechts der Pfeil nach unten — ein Tipp auf Name oder Pfeil öffnet die Listenwahl. Die Seite der
 * Liste öffnen die Kacheln oben bzw. die Listen im Menü; der Regler (`toolsMarkup`, nur bei
 * Projekten) steht als Knopf über der Leiste (styles/android-xool-pages.css).
 */
export function xoolBarMarkup(link, count, toolsMarkup) {
  const number = count ? `<span class="home-xool-count">${count}</span>` : "";
  return `
    <div class="home-xool-bar">
      <h2 class="home-xool-name">
        <button class="home-xool-pick" type="button" data-home-xool-pick aria-haspopup="dialog" aria-label="${escapeHtml(link.title)} — Liste wechseln"><span>${escapeHtml(link.title)}</span>${number}</button>
      </h2>
      <button class="home-xool-chevron-btn" type="button" data-home-xool-pick aria-haspopup="dialog" aria-label="Liste wechseln">${icon("chevron", "home-xool-chevron")}</button>
      ${toolsMarkup}
    </div>`;
}

/* Die Listen im Blatt: unter „Markiert“ beide; unter „Listen“ die gewählte allein
   oben, darunter die Gruppen ohne sie, vor jedem Block ein Strich (wie in Xool). */
function chooserBlocks(marked, chosen) {
  if (marked) return [markedLinks];
  const find = (id) => listedLinks.find((link) => link.id === id);
  const groups = listGroups.map((ids) => ids.filter((id) => id !== chosen).map(find));
  return [[find(chosen)], ...groups].filter((block) => block.length);
}

/* Das Blatt mit den Listen des offenen Reiters. */
function openChooser() {
  const marked = xoolTab() === "marked";
  const key = marked ? storageKeys.homeMarked : storageKeys.homeList;
  const chosen = xoolList().id;
  const options = chooserBlocks(marked, chosen).flatMap((block, blockIndex) =>
    block.map((link, index) => ({
      label: link.title,
      icon: link.icon,
      active: link.id === chosen,
      split: blockIndex > 0 && index === 0,
      onSelect: () => {
        writeText(key, link.id);
        emit(events.dataChanged);
      },
    }))
  );
  openSheet(menuTitle, options);
}

/** Tipp auf einen Reiter (der ruhende wird gewählt) oder auf den Namen im Kopf (Listenwahl). Gibt an, ob der Klick galt. */
export function handleXoolTabClick(event) {
  if (event.target.closest("[data-home-xool-pick]")) {
    openChooser();
    return true;
  }
  const button = event.target.closest("[data-home-xool-tab]");
  if (!button) return false;
  if (button.dataset.homeXoolTab !== xoolTab()) {
    writeText(storageKeys.homeTab, button.dataset.homeXoolTab);
    emit(events.dataChanged);
  }
  return true;
}
