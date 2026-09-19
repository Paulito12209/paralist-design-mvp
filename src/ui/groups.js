/*
 * Listen, die nach Typ gruppiert sind, jede Gruppe mit Überschrift zum Auf-
 * und Zuklappen. Zwei Arten kommen vor:
 *
 * - der INHALT eines Ablageorts (Arbeitsbereich, Projekt) — was dort liegt,
 * - die VERKNÜPFTEN Einträge eines Eintrags — womit er verbunden ist.
 *
 * Beide sehen gleich aus, meinen aber Verschiedenes: der Ablageort zeigt in
 * eine Richtung, die Verknüpfung gilt auf beiden Seiten (src/data/links.js).
 * Pfad: src/ui/groups.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyPlace -> Emblem, Überschrift, Satz und Pille, solange hier nichts liegt
 * emptyLinks -> dasselbe für einen Eintrag ohne Verknüpfungen
 *
 * Aussehen von Überschrift und Pfeil steht in styles/rows.css
 * (Klassen .group-head, .group-body), das des Platzhalters in
 * styles/empty-state.css.
 */

import { icon } from "../core/html.js";
import { groupedLinks } from "../data/links.js";
import { groupedEntriesOf } from "../data/queries.js";
import { ui } from "../data/state.js";
import { emptyState } from "./empty-state.js";
import { mediaStripsMarkup } from "./media-strip.js";
import { entryRow } from "./rows.js";

/* Platzhalter, solange in diesem Arbeitsbereich oder Projekt nichts liegt. */
const emptyPlace = {
  icon: "layers",
  accent: "var(--prio-irgendwann)",
  title: "Noch nichts abgelegt",
  text: "Was du hier anlegst, bleibt an diesem Ort — Aufgaben, Notizen und Termine.",
  /* Ohne `pick`: was hier entsteht, schlägt die Seite vor — in einem Projekt
     eine Aufgabe, in einem Arbeitsbereich eine Notiz. */
  action: { label: "Eintrag hinzufügen" },
};

/* Platzhalter, solange dieser Eintrag mit nichts verknüpft ist. */
const emptyLinks = {
  icon: "link",
  accent: "var(--prio-next)",
  title: "Noch nichts verknüpft",
  text: "Verknüpfe Aufgaben, Notizen, Termine oder Medien. Die Verbindung gilt auf beiden Seiten — du findest diesen Eintrag also auch dort wieder.",
  action: { label: "Eintrag hinzufügen" },
};

/** Schlüssel einer Gruppe im Merkzettel der eingeklappten Gruppen. */
export function groupKey(scope, type) {
  return `${scope || "inbox"}|${type}`;
}

/* Merkzettel-Schlüssel der verknüpften Einträge. Das „v:“ hält sie von den
   Ablageorten auseinander, die „w:“ und „e:“ benutzen (src/data/refs.js) —
   sonst klappte das Zuklappen beim Projekt auch die Notiz mit zu. */
function linkScope(entry) {
  return `v:${entry.id}`;
}

/** Eine Gruppe: Überschrift mit Anzahl und Pfeil, darunter ihr Inhalt. */
function groupMarkup(scope, group, body, bodyClass) {
  const key = groupKey(scope, group.type);
  const open = !ui.collapsedGroups.has(key);
  return `
    <div class="group${open ? "" : " is-collapsed"}" data-group="${key}">
      <button class="group-head" type="button" data-toggle-group="${key}" aria-expanded="${open}">
        ${icon(group.icon, "group-icon")}
        <span class="group-label">${group.label}</span>
        <span class="group-count">${group.items.length}</span>
        ${icon("chevron", "group-chevron")}
      </button>
      <div class="group-body ${bodyClass}"${open ? "" : " hidden"}>
        ${body}
      </div>
    </div>
  `;
}

/* Eine Gruppe als Zeilen — so sieht jede Liste in der App aus. */
function rowGroup(scope, group) {
  return groupMarkup(scope, group, group.items.map((entry) => entryRow(entry)).join(""), "workspace-list");
}

/* Medien stehen nicht als Zeilen da: unter der Überschrift „Medien“ folgen
   Bilder, Videos, Audio und Dokumente je als Kachelreihe — man erkennt ein
   Foto am Bild, nicht am Dateinamen. */
function mediaGroup(scope, group) {
  return groupMarkup(scope, group, mediaStripsMarkup(group.items), "media-kinds");
}

/* Die Gruppen einer fertigen Liste zeichnen. */
function groupsMarkup(scope, groups) {
  return groups
    .map((group) => (group.type === "medien" ? mediaGroup(scope, group) : rowGroup(scope, group)))
    .join("");
}

/** Was an einem Ablageort liegt; leer, wenn dort nichts liegt. */
export function groupedListMarkup(ref) {
  const groups = groupedEntriesOf(ref);
  if (!groups.length) return emptyState(emptyPlace);
  return groupsMarkup(ref, groups);
}

/** Womit ein Eintrag verknüpft ist; leer, solange das nichts ist. */
export function linkedListMarkup(entry) {
  const groups = groupedLinks(entry);
  if (!groups.length) return emptyState(emptyLinks);
  return groupsMarkup(linkScope(entry), groups);
}

/** Eine Gruppe auf- oder zuklappen, ohne die Seite neu zu zeichnen. */
export function toggleGroup(button) {
  const key = button.dataset.toggleGroup;
  const wrap = button.closest(".group");
  const body = wrap && wrap.querySelector(".group-body");
  if (!body) return;
  const open = body.hidden;
  body.hidden = !open;
  wrap.classList.toggle("is-collapsed", !open);
  button.setAttribute("aria-expanded", String(open));
  if (open) ui.collapsedGroups.delete(key);
  else ui.collapsedGroups.add(key);
}
