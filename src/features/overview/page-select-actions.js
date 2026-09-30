/*
 * Die Leiste unten im Auswahlmodus der Sammlungen und was ihre Knöpfe tun
 * (die Auswahl selbst: src/features/overview/page-select.js). Je Art der
 * Seite eine eigene Leiste:
 *
 * - Einträge (Eingang, Favoriten, Ressourcen, Lesezeichen, Projekte, Seite
 *   eines Arbeitsbereichs): Favorit · Verknüpfen · Ablegen · Archivieren ·
 *   Mehr (Duplizieren, Löschen). Favoriten mischen Einträge und
 *   Arbeitsbereiche — Verknüpfen und Ablegen gehen dann nicht.
 * - Arbeitsbereiche: Favorit · Verschieben (in einen anderen Tab) ·
 *   Archivieren · Löschen.
 * - Archiv: Zurückholen · Löschen.
 *
 * Danach eine Meldung mit „Rückgängig“ für die ganze Gruppe; nur Löschen
 * fragt stattdessen vorher nach. Verknüpfen bleibt als Blatt offen: ein
 * Haken heißt „alle gewählten sind damit verbunden“, ein zweiter Tipp löst
 * die Verbindungen wieder.
 * Pfad: src/features/overview/page-select-actions.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * bars  -> Knöpfe je Art der Seite (Reihenfolge, Icon, Wort)
 * words -> Texte der Blätter und Meldungen
 * noCopyTypes -> Typen, die sich nicht duplizieren lassen (ihre Dateien hängen an der Nummer des Eintrags)
 *
 * Aussehen: styles/tasks-select.css, Blätter und Meldung wie überall.
 */

import { dom } from "../../core/dom.js";
import { typeIcon, typeSingular } from "../../data/config.js";
import { canLink } from "../../data/links.js";
import {
  archiveEntries,
  deleteEntries,
  duplicateEntries,
  placeEntries,
  restoreEntries,
  restoreSnapshot,
  setFavorites,
  snapshotEntries,
} from "../../data/mutations-bulk.js";
import {
  allLinkedWith,
  archiveSpaces,
  deleteSpaces,
  moveSpacesToTab,
  restoreSpaces,
  setSpacesFavorite,
  snapshotSpaces,
  toggleLinkAll,
} from "../../data/mutations-bulk-spaces.js";
import { groupByType, tabLabel } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { openPlacePicker } from "../../ui/pickers.js";
import { createSelectBar } from "../../ui/select-bar.js";
import { openSheet } from "../../ui/sheet.js";
import { showToast } from "../../ui/toast.js";

const bars = {
  entries: [
    { id: "favorite", icon: "star-outline", label: "Favorit" },
    { id: "link", icon: "link", label: "Verknüpfen" },
    { id: "place", icon: "folder-move", label: "Ablegen" },
    { id: "archive", icon: "archive", label: "Archivieren" },
    { id: "more", icon: "dots", label: "Mehr" },
  ],
  spaces: [
    { id: "favorite", icon: "star-outline", label: "Favorit" },
    { id: "move", icon: "folder-move", label: "Verschieben" },
    { id: "archive", icon: "archive", label: "Archivieren" },
    { id: "delete", icon: "trash", label: "Löschen" },
  ],
  archive: [
    { id: "restore", icon: "history", label: "Zurückholen" },
    { id: "delete", icon: "trash", label: "Löschen" },
  ],
};

const words = {
  entry: ["Eintrag", "Einträge"],
  space: ["Arbeitsbereich", "Arbeitsbereiche"],
  mixed: "Elemente",
  undo: "Rückgängig",
  favOn: "zu Favoriten",
  favOff: "aus Favoriten entfernt",
  link: "Verknüpfen",
  noLink: "Es gibt noch nichts, womit sich diese Einträge verknüpfen lassen.",
  place: "Ablegen in",
  placed: "abgelegt",
  archived: "archiviert",
  restored: "zurückgeholt",
  move: "Verschieben nach",
  moved: "verschoben",
  duplicate: "Duplizieren",
  duplicated: "dupliziert",
  remove: "Löschen",
  removeAsk: "löschen?",
  removeNote: "Gelöschtes lässt sich nicht zurückholen. Was nur in einem gelöschten Arbeitsbereich lag, kommt in den Eingang.",
  removed: "gelöscht",
};

const noCopyTypes = ["medien", "zeichnung"];

/* Die Hooks aus page-select.js: exit, settle und picked (die gewählten Einträge und Arbeitsbereiche). */
let hooks = { exit: () => {}, settle: () => {}, picked: () => ({ entries: [], spaces: [] }) };

/** Die Hooks einmal hereingeben. */
export function initPageActions(next) {
  hooks = next;
}

/* „3 Einträge“, „1 Arbeitsbereich“, gemischt „4 Elemente“ */
function countLabel({ entries, spaces }) {
  const count = entries.length + spaces.length;
  const [one, many] = spaces.length ? words.space : words.entry;
  if (entries.length && spaces.length) return `${count} ${words.mixed}`;
  return `${count} ${count === 1 ? one : many}`;
}

/* Welche Leiste passt zur offenen Seite? */
function barKind() {
  const kind = ui.currentPage?.kind;
  return kind === "archive" ? "archive" : kind === "workspaces" ? "spaces" : "entries";
}

/*
 * Eine Sammel-Änderung ausführen: vorher merken, ändern, Modus beenden
 * (`removing`) oder behalten, Meldung mit „Rückgängig“ zeigen.
 */
function run(items, change, { removing = false, title, icon }) {
  const entrySnap = snapshotEntries(items.entries);
  const spaceSnap = snapshotSpaces(items.spaces);
  change(items);
  if (removing) hooks.exit();
  else hooks.settle();
  showToast({
    icon,
    title,
    action: {
      label: words.undo,
      icon: "undo",
      onSelect: () => {
        if (entrySnap.length) restoreSnapshot(entrySnap);
        if (spaceSnap.length) restoreSpaces(spaceSnap);
      },
    },
  });
}

function toggleFavorites(items) {
  const all = [...items.entries, ...items.spaces];
  const on = !all.every((item) => item.favorite);
  run(
    items,
    ({ entries, spaces }) => {
      if (entries.length) setFavorites(entries, on);
      if (spaces.length) setSpacesFavorite(spaces, on);
    },
    { title: `${countLabel(items)} ${on ? words.favOn : words.favOff}`, icon: on ? "star" : "star-outline" }
  );
}

/* Verknüpfen: jeder andere Eintrag nach Art gruppiert; das Blatt bleibt offen und zeigt die Haken frisch. */
function openLinkSheet(items) {
  const entries = items.entries.filter(canLink);
  const chosen = new Set(entries.map((entry) => String(entry.id)));
  const others = state.entries.filter((item) => !item.archived && canLink(item) && !chosen.has(String(item.id)));
  const options = groupByType(others).flatMap((group) => [
    { heading: true, label: group.label },
    ...group.items.map((other) => ({
      label: other.title || typeSingular(other.type),
      icon: other.icon || typeIcon(other.type),
      active: allLinkedWith(entries, other),
      stay: true,
      onSelect: () => {
        toggleLinkAll(entries, other);
        const top = dom.sheetOptions.scrollTop;
        openLinkSheet(items);
        dom.sheetOptions.scrollTop = top;
      },
    })),
  ]);
  openSheet(`${words.link} · ${countLabel({ entries, spaces: [] })}`, options.length ? options : [{ note: true, label: words.noLink }]);
}

function openPlaceSheet(items) {
  const places = new Set(items.entries.map((entry) => (entry.places || [])[0] || ""));
  /* Gemischte Orte: ein Wert, der zu keinem Ort passt, damit nichts leuchtet */
  const current = places.size === 1 ? [...places][0] || null : "\u0000";
  openPlacePicker(`${words.place} · ${countLabel(items)}`, current, (ref) =>
    run(items, ({ entries }) => placeEntries(entries, ref), { title: `${countLabel(items)} ${words.placed}`, icon: "folder-move" })
  );
}

function openMoveSheet(items) {
  const tabs = new Set(items.spaces.map((space) => String(space.tab)));
  openSheet(
    `${words.move} · ${countLabel(items)}`,
    state.tabs.map((tab) => ({
      label: tabLabel(tab),
      icon: "folder",
      active: tabs.size === 1 && tabs.has(String(tab.id)),
      onSelect: () =>
        run(items, ({ spaces }) => moveSpacesToTab(spaces, tab.id), {
          title: `${countLabel(items)} ${words.moved}`,
          icon: "folder-move",
        }),
    }))
  );
}

function archiveAll(items, on) {
  run(
    items,
    ({ entries, spaces }) => {
      if (entries.length) (on ? archiveEntries : restoreEntries)(entries);
      if (spaces.length) archiveSpaces(spaces, on);
    },
    { removing: true, title: `${countLabel(items)} ${on ? words.archived : words.restored}`, icon: on ? "archive" : "history" }
  );
}

/* Löschen erst nach Rückfrage: gelöschte Dateien kommen nicht zurück. */
function confirmDelete(items) {
  openSheet(`${countLabel(items)} ${words.removeAsk}`, [
    { note: true, label: words.removeNote },
    {
      label: words.remove,
      icon: "trash",
      danger: true,
      onSelect: () => {
        if (items.entries.length) deleteEntries(items.entries);
        if (items.spaces.length) deleteSpaces(items.spaces);
        hooks.exit();
        showToast({ icon: "trash", title: `${countLabel(items)} ${words.removed}` });
      },
    },
  ]);
}

function openMoreSheet(items) {
  const options = [];
  const canCopy = !items.spaces.length && items.entries.every((entry) => !noCopyTypes.includes(entry.type));
  if (canCopy) {
    options.push({
      label: words.duplicate,
      icon: "copy",
      onSelect: () => {
        const copies = duplicateEntries(items.entries);
        hooks.exit();
        showToast({
          icon: "copy",
          title: `${countLabel(items)} ${words.duplicated}`,
          action: { label: words.undo, icon: "undo", onSelect: () => deleteEntries(copies) },
        });
      },
    });
  }
  options.push({ label: words.remove, icon: "trash", danger: true, split: canCopy, onSelect: () => confirmDelete(items) });
  openSheet(countLabel(items), options);
}

/* Ein Knopf der Leiste */
function runAction(id) {
  const items = hooks.picked();
  if (!items.entries.length && !items.spaces.length) return;
  if (id === "favorite") toggleFavorites(items);
  else if (id === "link") openLinkSheet(items);
  else if (id === "place") openPlaceSheet(items);
  else if (id === "move") openMoveSheet(items);
  else if (id === "archive") archiveAll(items, true);
  else if (id === "restore") archiveAll(items, false);
  else if (id === "delete") confirmDelete(items);
  else if (id === "more") openMoreSheet(items);
}

/* Je Art eine Leiste, angelegt beim ersten Bedarf */
const made = {};

/* Was ein Knopf gerade nicht kann: nichts gewählt, oder die Auswahl passt nicht dazu. */
function isDisabled(id, items, count) {
  if (!count) return true;
  if (id === "link") return items.spaces.length > 0 || !items.entries.some(canLink);
  if (id === "place") return items.spaces.length > 0;
  if (id === "move") return state.tabs.length < 2;
  return false;
}

/** Die Leiste der offenen Seite zeigen und auf den Stand der Auswahl bringen; die übrigen verstecken. */
export function updatePageBar(on, count) {
  const kind = barKind();
  const items = on ? hooks.picked() : { entries: [], spaces: [] };
  const allFav = count > 0 && [...items.entries, ...items.spaces].every((item) => item.favorite);
  Object.keys(bars).forEach((name) => {
    if (!made[name] && !(on && name === kind)) return;
    if (!made[name]) made[name] = createSelectBar("Gewählte Einträge", bars[name], runAction);
    made[name].update(on && name === kind, {
      disabled: (id) => isDisabled(id, items, count),
      shown: (action) => (action.id === "favorite" && allFav ? { ...action, icon: "star" } : action),
    });
  });
}
