/*
 * Die Daten für das Dashboard der „OG Version“ (Übersicht unter den Listen):
 * „Im Blick“ mit Angepinnt, Heute und Morgen, dazu „Zuletzt erstellt“,
 * „Zuletzt geöffnet“ und „Zuletzt bearbeitet“. Hier steht nur, WAS gezeigt
 * wird — Aussehen und Markup stehen in src/features/overview/home-og*.js.
 * Pfad: src/data/home-dash.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * stripLimit  -> wie viele Kacheln eine Reihe „Zuletzt …“ höchstens zeigt (12 wie in der App)
 * countLimit  -> wie viele Zähler-Ringe oben rechts auf einer großen Karte stehen
 * kinds       -> Name, Symbol und Kategoriefarbe je Art; die Farben stehen in styles/tokens-og.css
 * relevanceFilters -> die Pillen neben „Im Blick“ (Name, Symbol, Abstand in Tagen)
 * stripSections    -> die drei Reihen unten: Titel, Art des Zeitstempels, Symbol davor
 */

import { dayKey, timeKey } from "../core/dates.js";
import { typeOrder } from "./config.js";
import { openStats } from "./opens.js";
import { entriesOf, entryDay, entryTime, groupByType, parentIcon, parentName, workspaceLabel } from "./queries.js";
import { entryRef, workspaceRef } from "./refs.js";
import { state } from "./state.js";

const stripLimit = 12;
const countLimit = 3;
const MS_PER_DAY = 86400000;
const weekMs = 7 * MS_PER_DAY;

/* Art → Anzeige. Dokument, Zeichnung und Medien heißen in der App alle „Ressource“. */
const resourceKind = { label: "Ressource", icon: "doc", color: "var(--og-resource)" };
const kinds = {
  aufgabe: { label: "Aufgabe", icon: "task", color: "var(--og-task)" },
  notiz: { label: "Notiz", icon: "note", color: "var(--og-note)" },
  termin: { label: "Termin", icon: "calendar", color: "var(--og-event)" },
  projekt: { label: "Projekt", icon: "target", color: "var(--og-project)" },
  dokument: resourceKind,
  zeichnung: resourceKind,
  medien: resourceKind,
  lesezeichen: { label: "Lesezeichen", icon: "bookmark", color: "var(--og-bookmark)" },
  arbeitsbereich: { label: "Arbeitsbereich", icon: "layers", color: "var(--og-area)" },
};

/** Die Pillen neben „Im Blick“; `days` ist der Abstand zu heute, `null` heißt „Angepinnt“. */
export const relevanceFilters = [
  { id: "pinned", label: "Angepinnt", icon: "pin", days: null },
  { id: "today", label: "Heute", icon: "calendar", days: 0 },
  { id: "tomorrow", label: "Morgen", icon: "sun", days: 1 },
];

/** Die drei Reihen unten: welcher Zeitstempel steht und welches Symbol davor. */
export const stripSections = [
  { id: "created", title: "Zuletzt erstellt", stamp: "created", symbol: "pencil" },
  { id: "opened", title: "Zuletzt geöffnet", stamp: "opened", symbol: "eye" },
  { id: "edited", title: "Zuletzt bearbeitet", stamp: "edited", symbol: "pencil" },
];

/* Ein Eintrag oder Arbeitsbereich in der Form, die das Dashboard braucht. */
function describe(item, isWorkspace) {
  const key = isWorkspace ? "arbeitsbereich" : item.type;
  const kind = kinds[key] || kinds.notiz;
  const ref = isWorkspace ? workspaceRef(item.id) : entryRef(item.id);
  const opened = openStats(isWorkspace ? "workspace" : "entry", item.id);
  return {
    ref,
    id: item.id,
    isWorkspace,
    item,
    kind,
    title: isWorkspace ? workspaceLabel(item) : item.title,
    favorite: Boolean(item.favorite),
    createdAt: item.createdAt || 0,
    editedAt: item.editedAt || 0,
    openedAt: opened ? opened.ts : 0,
  };
}

const everything = () => [
  ...state.entries.filter((entry) => !entry.archived).map((entry) => describe(entry, false)),
  ...state.workspaces.filter((workspace) => !workspace.archived).map((workspace) => describe(workspace, true)),
];

/** Die angepinnten Einträge, zuletzt Bearbeitetes zuerst. */
export function pinnedPages() {
  return state.entries
    .filter((entry) => entry.pinned && !entry.archived)
    .map((entry) => describe(entry, false))
    .sort((a, b) => Math.max(b.editedAt, b.createdAt) - Math.max(a.editedAt, a.createdAt));
}

/** Termine, Aufgaben und Projekte mit Datum an diesem Tag, nach Uhrzeit sortiert. */
export function datedPages(days) {
  const key = dayKey(new Date(Date.now() + days * MS_PER_DAY));
  const order = ["termin", "aufgabe", "projekt"];
  return state.entries
    .filter((entry) => !entry.archived && order.includes(entry.type) && entry.date && entryDay(entry) === key)
    .map((entry) => ({ ...describe(entry, false), time: entryTime(entry) }))
    .sort((a, b) => {
      if (a.time !== b.time) return (a.time || "") < (b.time || "") ? -1 : 1;
      return order.indexOf(a.item.type) - order.indexOf(b.item.type);
    });
}

/** Die Seiten einer Reihe „Zuletzt …“, jeweils mit dem Zeitpunkt, den die Kachel zeigt. */
export function stripPages(stamp) {
  const field = { created: "createdAt", opened: "openedAt", edited: "editedAt" }[stamp];
  return everything()
    .filter((page) => page[field] > 0)
    .sort((a, b) => b[field] - a[field])
    .slice(0, stripLimit)
    .map((page) => ({ ...page, stampAt: page[field] }));
}

/** Zähler der Inhalte einer Seite — je Art ein Ring: [{ kind, count }], die häufigsten drei. */
export function contentCounts(page) {
  const groups = groupByType(entriesOf(page.ref));
  return groups
    .map((group) => ({ kind: kinds[group.type] || kinds.notiz, count: group.items.length, type: group.type }))
    .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type))
    .slice(0, countLimit);
}

/** Wo die Seite abgelegt ist: Name und Symbol des ersten Ortes, sonst nichts. */
export function parentOf(page) {
  const ref = page.isWorkspace ? null : (page.item.places || [])[0];
  return ref ? { name: parentName(ref), icon: parentIcon(ref) } : null;
}

/** „21:33“ — die Uhrzeit, zu der etwas zuletzt geschah. */
export const clockOf = (ms) => timeKey(ms);

const relative = new Intl.RelativeTimeFormat("de", { numeric: "auto", style: "short" });

/**
 * Der Zeitstempel einer Kachel: binnen einer Woche als Abstand („vor 2 Std.“,
 * „gestern“), danach als Datum („17. Sept.“) — wie RecentPageStamp.formatted in der App.
 */
export function stampLabel(ms, now = Date.now()) {
  const age = Math.max(0, now - ms);
  if (age < weekMs) {
    if (age < 60 * 60000) return relative.format(-Math.max(1, Math.floor(age / 60000)), "minute");
    if (age < MS_PER_DAY) return relative.format(-Math.floor(age / 3600000), "hour");
    return relative.format(-Math.floor(age / MS_PER_DAY), "day");
  }
  return new Date(ms).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

