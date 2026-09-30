/*
 * Das Blatt „Filter“ der Sammlungen (src/ui/filter-sheet.js) und die Chips
 * darüber in der Karte „Ansicht“ (src/features/overview/collection-panel.js).
 * Welche Abschnitte eine Sammlung hat und was sie wegfiltern, steht in
 * src/data/collection-filters.js; hier werden sie fürs Blatt beschriftet.
 *
 * - Typ: Mehrfachwahl mit „ist | ist nicht“ wie Status auf der
 *   Aufgaben-Seite. Wechselt man das Segment, bleiben die Haken stehen und
 *   die Liste dreht sich um (Notion-Verhalten). Zur Wahl stehen die Typen,
 *   die in der Sammlung vorkommen, und die schon ausgeblendeten.
 * - Ort: alle Orte, Eingang (ohne Ort), dann jeder Ort, an dem etwas aus
 *   der Sammlung liegt.
 * - Website (Lesezeichen): alle Websites, dann jede vorkommende.
 * - Bearbeitet, Erledigte, Zeigen, Favoriten, Inhalt: Einfachwahl, die erste
 *   Zeile ist die Vorgabe.
 * Pfad: src/features/overview/collection-filter.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title       -> Überschrift des Blatts
 * labels      -> Name und Icon jedes Abschnitts (in der Übersicht und auf dem Chip)
 * allLabel / noneLabel / notLabel -> Zusammenfassung von „Typ“: „Alle“, „Keine“, „nicht …“
 * allPlaces / inboxLabel / allSites -> Namen der festen Werte von Ort und Website
 * notes       -> die Sätze unter der Typ-Liste
 *
 * Aussehen: styles/filter-sheet.css; die Chips in styles/tasks-settings.css.
 */

import { typeIcon, typeOrder, typePlurals } from "../../data/config.js";
import {
  bookmarkSites,
  choiceOptions,
  collectionFilter,
  collectionFilterSections,
  collectionPool,
  resetCollectionFilter,
  sectionActive,
  updateCollectionFilter,
} from "../../data/collection-filters.js";
import { findEntry, findWorkspace, parentName, workspaceIcon } from "../../data/queries.js";
import { isWorkspaceRef, refId } from "../../data/refs.js";
import { openFilterSheet } from "../../ui/filter-sheet.js";

const title = "Filter";
const labels = {
  type: { label: "Typ", icon: "tag" },
  place: { label: "Ort", icon: "layers" },
  site: { label: "Website", icon: "globe" },
  period: { label: "Bearbeitet", icon: "clock" },
  done: { label: "Erledigte", icon: "check-circle" },
  art: { label: "Zeigen", icon: "grid" },
  favorites: { label: "Favoriten", icon: "star" },
  content: { label: "Inhalt", icon: "folder" },
};
const allLabel = "Alle";
const noneLabel = "Keine";
const notLabel = "nicht";
const allPlaces = "Alle Orte";
const inboxLabel = "Eingang";
const allSites = "Alle Websites";
const notes = {
  only: (names) => `Zeigt nur ${names}.`,
  except: (names) => `Zeigt alles außer ${names}.`,
  none: "Zeigt nichts.",
  all: "Zeigt alle Typen.",
};

/* ---------- Typ: Mehrfachwahl ---------- */

/* Die Typen der Sammlung in fester Reihenfolge — dazu jeder schon
   ausgeblendete, damit man ihn wieder anhaken kann. */
function typeValues(kind, f) {
  const present = new Set(collectionPool(kind).map((entry) => entry.type));
  return typeOrder
    .filter((type) => present.has(type) || f.typeHidden.includes(type))
    .map((type) => ({ id: type, label: typePlurals[type] || type, icon: typeIcon(type) }));
}

/* Die Typen mit Haken: bei „ist“ die sichtbaren, bei „ist nicht“ die ausgeblendeten */
function checkedTypes(kind, f) {
  return typeValues(kind, f).filter((value) => f.typeHidden.includes(value.id) === f.typeNot);
}

const names = (values) => values.map((value) => value.label).join(", ");

function typeSummary(kind, f) {
  if (!sectionActive(f, "type")) return allLabel;
  const marked = checkedTypes(kind, f);
  if (f.typeNot) return `${notLabel} ${names(marked)}`;
  return marked.length ? names(marked) : noneLabel;
}

function typeNote(kind, f) {
  const marked = checkedTypes(kind, f);
  if (f.typeNot) return marked.length ? notes.except(names(marked)) : notes.all;
  return marked.length ? notes.only(names(marked)) : notes.none;
}

function typeSection(kind, f) {
  const values = typeValues(kind, f);
  return {
    id: "type",
    ...labels.type,
    summary: typeSummary(kind, f),
    active: sectionActive(f, "type"),
    mode: f.typeNot ? "not" : "is",
    items: values.map((value) => ({ ...value, active: f.typeHidden.includes(value.id) === f.typeNot })),
    note: typeNote(kind, f),
    /* Die Haken bleiben, die Liste dreht sich um: ausgeblendet wird, was eben zu sehen war */
    onMode: (mode) =>
      change(kind, {
        typeNot: mode === "not",
        typeHidden: values.map((value) => value.id).filter((id) => !f.typeHidden.includes(id)),
      }),
    onToggle: (id) => {
      const hidden = f.typeHidden.includes(id);
      change(kind, { typeHidden: hidden ? f.typeHidden.filter((item) => item !== id) : [...f.typeHidden, id] });
    },
  };
}

/* ---------- Ort und Website: Einfachwahl mit Werten aus der Sammlung ---------- */

/* Name und Icon eines Orts; ein Ort, den es nicht mehr gibt, zeigt den Namen seines Verweises */
function placeOption(ref) {
  if (ref === "alle") return { id: ref, label: allPlaces, icon: "layers" };
  if (ref === "inbox") return { id: ref, label: inboxLabel, icon: "inbox" };
  if (isWorkspaceRef(ref)) {
    const workspace = findWorkspace(refId(ref));
    return { id: ref, label: parentName(ref), icon: workspace ? workspaceIcon(workspace) : "folder" };
  }
  const entry = findEntry(refId(ref));
  return { id: ref, label: parentName(ref), icon: entry ? entry.icon || typeIcon(entry.type) : "rocket" };
}

function placeValues(kind, f) {
  const used = new Set();
  collectionPool(kind).forEach((entry) => (entry.places || []).forEach((ref) => used.add(ref)));
  if (!["alle", "inbox"].includes(f.place)) used.add(f.place);
  const places = [...used].map(placeOption).sort((a, b) => a.label.localeCompare(b.label, "de"));
  return [placeOption("alle"), placeOption("inbox"), ...places];
}

function siteValues(f) {
  const sites = bookmarkSites();
  if (f.site !== "alle" && !sites.includes(f.site)) sites.push(f.site);
  return [{ id: "alle", label: allSites, icon: "globe" }, ...sites.map((host) => ({ id: host, label: host, icon: "link" }))];
}

/* Die Werte einer Einfachwahl */
function choiceValues(kind, f, id) {
  if (id === "place") return placeValues(kind, f);
  if (id === "site") return siteValues(f);
  return choiceOptions[id];
}

function choiceSection(kind, f, id) {
  const values = choiceValues(kind, f, id);
  const chosen = values.find((value) => value.id === f[id]) || values[0];
  return {
    id,
    ...labels[id],
    summary: chosen.label,
    active: sectionActive(f, id),
    items: values.map((value) => ({ ...value, active: value.id === chosen.id })),
    onToggle: (value) => {
      if (value !== f[id]) change(kind, { [id]: value });
    },
  };
}

/* ---------- Für die Karte „Ansicht“ ---------- */

/**
 * Die Chips der gefilterten Abschnitte: [{ page, label, icon, count?, not? }].
 * Typ zeigt die Zahl seiner Haken, Ort und Website den Namen der Wahl, die
 * übrigen ihr Wort vom Chip („Letzte 7 Tage“).
 */
export function collectionFilterChips(kind) {
  const f = collectionFilter(kind);
  return (collectionFilterSections[kind] || [])
    .filter((id) => sectionActive(f, id))
    .map((id) => {
      if (id === "type") return { page: id, ...labels.type, count: checkedTypes(kind, f).length, not: f.typeNot };
      const chosen = choiceValues(kind, f, id).find((value) => value.id === f[id]);
      const label = chosen ? chosen.chip || chosen.label : String(f[id]);
      return { page: id, label, icon: chosen?.icon || labels[id].icon };
    });
}

/* Speichern und das offene Blatt mit dem neuen Stand neu zeichnen */
function change(kind, changes) {
  updateCollectionFilter(kind, changes);
  openCollectionFilter(kind);
}

/**
 * Das Blatt einer Sammlung öffnen oder mit neuem Stand neu zeichnen.
 * @param page id der Unterseite, die gleich offen sein soll (Chip in der Karte) — sonst weggelassen
 */
export function openCollectionFilter(kind, page) {
  const f = collectionFilter(kind);
  const sections = (collectionFilterSections[kind] || []).map((id) =>
    id === "type" ? typeSection(kind, f) : choiceSection(kind, f, id)
  );
  openFilterSheet({
    title,
    sections,
    resetActive: sections.some((section) => section.active),
    onReset: () => {
      resetCollectionFilter(kind);
      openCollectionFilter(kind);
    },
    page,
  });
}
