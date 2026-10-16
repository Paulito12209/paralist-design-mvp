/*
 * „Android (Xool-DB)“, Übersicht: die zwei Reiter „Markiert · Listen“ über der
 * Liste, wie „Meine Ablage · Computer“ in Google Drive. Hinter jedem Reiter
 * steckt eine gewählte Liste: der ruhende Reiter zeigt ihr Icon, der aktive
 * einen Pfeil nach unten — ein Tipp darauf öffnet das Blatt „Liste wählen“
 * mit den Listen dieses Reiters. Markiert sind Favoriten und Lesezeichen,
 * unter Listen stehen die übrigen Listen der Seitenleiste. Darunter folgt der
 * Kopf der Liste mit Name, Anzahl und den Knöpfen (src/features/overview/home-list.js).
 * Gemerkt werden der Reiter und je Reiter die gewählte Liste.
 * Pfad: src/features/overview/home-xool.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuTitle   -> Überschrift des Blatts mit den Listen
 * tabLabels   -> Namen der beiden Reiter
 * markedLinks -> was unter „Markiert“ zur Wahl steht (die Liste Favoriten und die Lesezeichen)
 * markedIds   -> welche Listen aus der Seitenleiste nach „Markiert“ gewandert sind und
 *                deshalb unter „Listen“ fehlen
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
const markedIds = ["bookmarks"];

/* Favoriten sind keine Liste der Seitenleiste, haben aber eine Seite hinter der Kachel „Favoriten“ */
export const markedLinks = [
  { id: "favorites", title: overviewPages[2].title, icon: overviewPages[2].icon },
  ...listLinks.filter((link) => markedIds.includes(link.id)),
];
const listedLinks = listLinks.filter((link) => !markedIds.includes(link.id));

/** Ist gerade „Android (Xool-DB)“ am Handy zu sehen? */
export function isXoolHome() {
  return isMobileVariant("xool");
}

/** Der gewählte Reiter: „marked“ oder „lists“ (Vorgabe). */
export function xoolTab() {
  return readText(storageKeys.homeTab) === "marked" ? "marked" : "lists";
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
  return `
    <div class="home-xool-bar">
      <h2 class="home-xool-name">
        <button class="home-xool-open" type="button" ${openAttr} aria-label="${escapeHtml(link.title)} öffnen"><span>${escapeHtml(link.title)}</span></button>${number}
      </h2>
      ${toolsMarkup}
    </div>`;
}

/* Das Blatt mit den Listen des offenen Reiters. */
function openChooser() {
  const marked = xoolTab() === "marked";
  const links = marked ? markedLinks : listedLinks;
  const key = marked ? storageKeys.homeMarked : storageKeys.homeList;
  const chosen = xoolList().id;
  openSheet(
    menuTitle,
    links.map((link) => ({
      label: link.title,
      icon: link.icon,
      active: link.id === chosen,
      split: Boolean(link.cut),
      onSelect: () => {
        writeText(key, link.id);
        emit(events.dataChanged);
      },
    }))
  );
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
