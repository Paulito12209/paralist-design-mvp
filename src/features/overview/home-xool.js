/*
 * „Android (Xool-DB)“, Übersicht: die zwei Reiter „Markiert · Listen“ über der
 * Liste, wie „Meine Ablage · Computer“ in Google Drive. Hinter jedem Reiter
 * steckt eine gewählte Liste: der ruhende Reiter zeigt ihr Icon, der aktive
 * einen Pfeil nach unten — ein Tipp darauf öffnet das Blatt „Liste wählen“
 * mit den Listen dieses Reiters: unter „Markiert“ Angepinnt und Favoriten,
 * unter „Listen“ die Listen der Seitenleiste in den Gruppen der Xool-App, die
 * gewählte allein ganz oben. Darunter folgt der
 * Kopf der Liste mit Name, Anzahl und den Knöpfen (src/features/overview/home-list.js).
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
  { id: "pinned", title: "Angepinnt", icon: "pin" },
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

/* Das Zeichen im Reiter: der aktive trägt den Pfeil, der ruhende das Icon seiner Liste. */
function tabMarkup(tab) {
  const on = xoolTab() === tab;
  const link = tab === "marked" ? chosenIn(markedLinks, storageKeys.homeMarked) : chosenIn(listedLinks, storageKeys.homeList);
  const glyph = on ? icon("chevron", "home-xool-chevron") : icon(link.icon, "home-xool-glyph");
  const label = on ? `${tabLabels[tab]} — Liste wechseln` : tabLabels[tab];
  return `
    <button class="home-xool-tab${on ? " is-on" : ""}" type="button" role="tab" aria-selected="${on}" data-home-xool-tab="${tab}" aria-label="${escapeHtml(label)}"${on ? ' aria-haspopup="dialog"' : ""}>
      <span class="home-xool-tab-label"><span>${tabLabels[tab]}</span>${glyph}</span>
    </button>`;
}

/** Die Reiterzeile „Markiert · Listen“. */
export function xoolTabsMarkup() {
  return `<div class="home-xool-tabs" role="tablist">${tabMarkup("marked")}${tabMarkup("lists")}</div>`;
}

/**
 * Der Kopf der Liste unter den Reitern, eine Karte wie in der Xool-App: links
 * der Name (ein Tipp öffnet die Seite der Liste, `openAttr` aus home-list.js)
 * mit der Anzahl, rechts der Regler — bei Projekten das Blatt „Ansicht“ mit
 * Layout, Sortierung, Filter und „Tabs anzeigen“.
 */
export function xoolBarMarkup(link, count, openAttr, toolsMarkup) {
  const number = count ? `<span class="home-xool-count">${count}</span>` : "";
  /* „Angepinnt“ hat keine eigene Seite: dort ist der Name nur Text */
  const name = openAttr
    ? `<button class="home-xool-open" type="button" ${openAttr} aria-label="${escapeHtml(link.title)} öffnen"><span>${escapeHtml(link.title)}</span></button>`
    : `<span class="home-xool-open"><span>${escapeHtml(link.title)}</span></span>`;
  return `
    <div class="home-xool-bar">
      <h2 class="home-xool-name">${name}${number}</h2>
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

/** Tipp auf einen Reiter: der aktive öffnet die Listenwahl, der ruhende wird gewählt. Gibt an, ob der Klick galt. */
export function handleXoolTabClick(event) {
  const button = event.target.closest("[data-home-xool-tab]");
  if (!button) return false;
  if (button.dataset.homeXoolTab === xoolTab()) openChooser();
  else {
    writeText(storageKeys.homeTab, button.dataset.homeXoolTab);
    emit(events.dataChanged);
  }
  return true;
}
