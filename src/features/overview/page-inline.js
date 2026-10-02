/*
 * Welche Listen der Unterseiten per Tipp unter den letzten Eintrag anlegen
 * (Android, src/ui/inline-add.js): der Eingang eine Notiz, die Seite
 * Arbeitsbereiche einen Arbeitsbereich (mit Namensfeld wie über das
 * Ordner-Plus), ein Arbeitsbereich unter „Verknüpfte Einträge“ eine Notiz an
 * diesem Ort. Ressourcen und Lesezeichen melden sich in ihrem eigenen Modul
 * an, die Projekte haben src/features/overview/project-inline.js.
 * Favoriten und Archiv legen nichts an: ein Favorit entsteht durch Markieren,
 * ins Archiv kommt man durch Archivieren.
 * Pfad: src/features/overview/page-inline.js
 *
 * Keine anpassbaren visuellen Werte: welcher Typ entsteht, sagt `proposedType`
 * in src/data/config.js.
 */

import { dom } from "../../core/dom.js";
import { proposedType } from "../../data/config.js";
import { addWorkspace } from "../../data/mutations.js";
import { createEntryInline } from "../../data/mutations-inline.js";
import { ui } from "../../data/state.js";
import { addInlineList, initInlineAdd, openEntryRow, reopenIn } from "../../ui/inline-add.js";
import { isViewActive } from "../../ui/views.js";

/* Die offene Unterseite — nur, wenn die Ansicht sie gerade zeigt. */
function openPage() {
  return isViewActive("page") ? ui.currentPage : null;
}

/* Der Eingang ist die Unterseite ohne eigene Art und ohne Arbeitsbereich. */
const inbox = {
  area() {
    const page = openPage();
    if (!page || page.kind || page.isWorkspace) return null;
    return dom.pageBody.querySelector(":scope > .workspace-list");
  },
  open(area) {
    openEntryRow(area, {
      type: proposedType,
      onCommit: (title) => createEntryInline({ title, type: proposedType }),
      reopen: () => reopenIn(inbox),
    });
  },
};

/* Die Seite Arbeitsbereiche: erst, wenn im Tab schon einer steht. */
const workspaces = {
  area() {
    if (openPage()?.kind !== "workspaces") return null;
    const list = dom.pageBody.querySelector(':scope > .workspace-list[data-reorder="workspaces"]');
    return list?.querySelector("[data-open-workspace]") ? list : null;
  },
  open() {
    addWorkspace();
  },
};

/* Ein Arbeitsbereich unter „Verknüpfte Einträge“: die Gruppen stehen direkt
   in der Seite, darunter kommt die neue Zeile. */
const workspaceLinks = {
  area() {
    const page = openPage();
    if (!page?.isWorkspace || ui.pagePill !== "links") return null;
    return dom.pageBody.querySelector(":scope > .group") ? dom.pageBody : null;
  },
  open(area) {
    const place = ui.currentPage.parent;
    openEntryRow(area, {
      type: proposedType,
      onCommit: (title) => createEntryInline({ title, type: proposedType, place }),
      reopen: () => reopenIn(workspaceLinks),
    });
  },
};

/** Den Tipp unter die Listen einschalten und die drei Listen hier anmelden. */
export function initPageInline() {
  initInlineAdd();
  addInlineList(inbox);
  addInlineList(workspaces);
  addInlineList(workspaceLinks);
}
