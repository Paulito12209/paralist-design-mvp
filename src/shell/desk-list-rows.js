/*
 * Markup der Liste in der Seitenleiste am Desktop: das Menü „Liste“ mit den
 * acht Listen und ihren Ziffern, die Zeilen der gewählten Liste (Einträge
 * oder Arbeitsbereiche), die blasse Zeile zum Anlegen darunter und die
 * Zeilen des Blocks „Archiviert“ ganz unten. Hier steht nur Markup und was
 * gerade gewählt ist — was ein Klick auslöst, entscheidet
 * src/shell/desk-list.js, den Klick selbst fängt src/shell/desk-nav.js.
 * Pfad: src/shell/desk-list-rows.js
 *
 * Keine anpassbaren visuellen Werte: welche Liste welche Ziffer, Farbe und
 * Zeile zum Anlegen hat, steht in src/ui/desk-links.js (listLinks); Aussehen
 * und Maße stehen in styles/desk-nav-list.css und styles/desk-nav.css.
 */

import { formatNumber, shortDay } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { sameId } from "../core/ids.js";
import { typeIcon } from "../data/config.js";
import {
  archivedEntries,
  archivedWorkspaces,
  entriesOf,
  entryDay,
  inboxEntries,
  projectEntries,
  resourceEntries,
  taskEntries,
  workspaceIcon,
  workspaceLabel,
} from "../data/queries.js";
import { entryRef, workspaceRef } from "../data/refs.js";
import { state } from "../data/state.js";
import { listLinks } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";

/* Einträge eines Typs, ohne archivierte, in der Reihenfolge des Anlegens. */
function entriesOfType(type) {
  return state.entries.filter((entry) => entry.type === type && !entry.archived);
}

/* Termine stehen nach ihrem Tag, der nächste zuerst. */
function eventEntries() {
  return entriesOfType("termin").sort((a, b) => entryDay(a).localeCompare(entryDay(b)));
}

/*
 * Was in einer Liste steht: Arbeitsbereiche als { workspace }, alles andere
 * als { entry }. Das Archiv zeigt erst die Bereiche, dann die Einträge.
 */
export function listItems(link) {
  if (link.id === "workspaces") return state.workspaces.filter((workspace) => !workspace.archived).map((workspace) => ({ workspace }));
  if (link.id === "archive") return [...archivedWorkspaces().map((workspace) => ({ workspace })), ...archivedEntries().map((entry) => ({ entry }))];
  const byList = {
    projects: projectEntries,
    resources: resourceEntries,
    inbox: inboxEntries,
    tasks: taskEntries,
    events: eventEntries,
    bookmarks: () => entriesOfType("lesezeichen"),
  };
  return (byList[link.id] || (() => []))().map((entry) => ({ entry }));
}

/* Rechts in der Zeile: bei Ablageorten die Zahl ihrer Einträge, bei Terminen der Tag. */
function rowAside(item) {
  if (item.workspace) {
    const count = entriesOf(workspaceRef(item.workspace.id)).length;
    return count ? `<span class="desk-nav-count">${formatNumber(count)}</span>` : "";
  }
  const entry = item.entry;
  if (entry.type === "projekt") {
    const count = entriesOf(entryRef(entry.id)).length;
    return count ? `<span class="desk-nav-count">${formatNumber(count)}</span>` : "";
  }
  if (entry.type === "termin") return `<span class="desk-nav-count">${escapeHtml(shortDay(entryDay(entry)))}</span>`;
  return "";
}

/*
 * Eine Zeile: Icon (eigenes oder das des Typs), Titel, Stern bei Favorit,
 * rechts Zahl oder Tag. Die offene Zeile ist markiert. `title`: lange Namen
 * enden mit „…“ — beim Überfahren steht der ganze Name da.
 */
function rowMarkup(item, active) {
  const workspace = item.workspace;
  const entry = item.entry;
  const chosen = workspace ? sameId(workspace.id, active.workspace) : sameId(entry.id, active.entry);
  const label = escapeHtml(workspace ? workspaceLabel(workspace) : entry.title || "Ohne Titel");
  const glyph = workspace ? workspaceIcon(workspace) : entry.icon || typeIcon(entry.type);
  const favorite = (workspace || entry).favorite ? icon("star", "desk-nav-star") : "";
  const target = workspace ? `data-open-workspace="${workspace.id}"` : `data-open-entry="${entry.id}"`;
  return `
    <button class="desk-nav-row${chosen ? " is-active" : ""}" type="button" ${target} title="${label}"${chosen ? ' aria-current="page"' : ""}>
      ${icon(glyph, "desk-nav-icon desk-nav-icon-space")}
      <span class="desk-nav-label"><span class="desk-nav-text">${label}</span>${favorite}</span>
      ${rowAside(item)}
    </button>`;
}

/* Die blasse Zeile unter der Liste: legt in dieser Liste an — wie ein Klick in die freie Fläche. */
function addRowMarkup(link) {
  if (!link.create) return "";
  return `
    <button class="desk-nav-row desk-list-add" type="button" data-list-add="1">
      ${icon("plus", "desk-nav-icon")}
      <span class="desk-nav-text">${escapeHtml(link.add)}</span>
    </button>`;
}

/**
 * Die Zeilen der gewählten Liste samt Zeile zum Anlegen.
 * @param link   die gewählte Liste (listLinks)
 * @param active { entry, workspace } — was gerade offen ist (src/shell/desk-nav-parts.js)
 */
export function listRowsMarkup(link, active) {
  const items = listItems(link);
  const rows = items.map((item) => rowMarkup(item, active)).join("");
  const empty = items.length ? "" : `<p class="desk-nav-empty">Nichts in „${escapeHtml(link.title)}“</p>`;
  return rows + empty + addRowMarkup(link);
}

/** Die Zeilen im Block „Archiviert“ ganz unten. */
export function archiveRowsMarkup(active) {
  const link = listLinks.find((item) => item.id === "archive");
  return listItems(link)
    .map((item) => rowMarkup(item, active))
    .join("");
}

/** Wie viel im Archiv liegt — Bereiche und Einträge zusammen. */
export function archiveCount() {
  return archivedWorkspaces().length + archivedEntries().length;
}

/*
 * Eine Zeile des Menüs „Liste“: Ziffer, Icon in seiner Farbe, Name; die
 * gewählte trägt den Haken. Vor „Eingang“ zieht ein Strich die Ablagen vom
 * Laufenden ab.
 */
function optionMarkup(link, chosenId) {
  const chosen = link.id === chosenId;
  const cut = link.cut ? '<hr class="desk-list-cut" />' : "";
  return `${cut}
    <button class="desk-list-option${chosen ? " is-active" : ""}" type="button" role="menuitemradio" aria-checked="${chosen}" data-list-pick="${link.id}">
      ${keyCap(link.num)}
      ${icon(link.icon, `desk-nav-icon desk-nav-tone desk-nav-icon-${link.tone}`)}
      <span class="desk-nav-text">${escapeHtml(link.title)}</span>
      ${icon("check", "desk-list-check")}
    </button>`;
}

/** Das ganze Menü „Liste“, `chosenId` ist die gerade gezeigte Liste. */
export function listMenuMarkup(chosenId) {
  return listLinks.map((link) => optionMarkup(link, chosenId)).join("");
}
