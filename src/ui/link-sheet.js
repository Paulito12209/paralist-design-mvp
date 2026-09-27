/*
 * Das Blatt „Verknüpfen“ mit Tabs. Es öffnet sich über das Ketten-Symbol in
 * der Karte „Details“ am Ende der Seite eines Eintrags
 * (src/features/entry/entry-details.js), über das Plus unter „Verknüpfte
 * Einträge“, über „Verknüpfen“ in den Menüs und nach dem Wischen einer Zeile.
 *
 * Oben stehen Icon und Name des Eintrags, darunter die Pillen — wie im Blatt
 * einer Aufgabe (src/ui/sheet.js): „Zuletzt“ zeigt, was zuletzt geöffnet
 * wurde (src/data/opens.js), „Ablageort“ wo der Eintrag liegt, und dann je
 * eine Pille für jede Kategorie, in der es Einträge gibt (Aufgaben, Notizen,
 * …). Antippen oder waagerecht wischen wechselt. Ein Haken markiert, was
 * schon verbunden ist; das Blatt bleibt dabei offen, damit man mehreres
 * nacheinander an- und abwählen kann — die Liste bleibt dabei dort stehen,
 * wo sie gescrollt war.
 *
 * Für einen gewöhnlichen Eintrag ist das Anhaken die beidseitige Verknüpfung
 * (src/data/links.js). Auf der Seite eines Projekts bedeutet dasselbe Anhaken
 * das Umgekehrte: ein Projekt lässt sich nicht verknüpfen, es nimmt auf — der
 * angehakte Eintrag bekommt dieses Projekt als Ablageort.
 * Pfad: src/ui/link-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * RECENT_MAX  -> wie viele zuletzt geöffnete Einträge die erste Pille zeigt
 * recentTitle -> Beschriftung der ersten Pille
 * placeTitle  -> Beschriftung der Pille mit dem Ablageort
 * emptyRecent -> Satz unter „Zuletzt“, solange noch kein passender Eintrag geöffnet wurde
 *
 * Aussehen: styles/overlays.css (Blatt) und styles/sheet-tabs.css (Kopf, Pillen, Haken).
 */

import { dom } from "../core/dom.js";
import { typeIcon, typeLabel, typeSingular, xpItemStyle } from "../data/config.js";
import { canLink, isLinked, linkOptionsFor } from "../data/links.js";
import { clearPlaces, togglePlace, toggleLink } from "../data/mutations.js";
import { findEntry, groupByType, hasPlace, placeOptionsFor } from "../data/queries.js";
import { entryRef } from "../data/refs.js";
import { state } from "../data/state.js";
import { openSheet } from "./sheet.js";

const RECENT_MAX = 12;
const recentTitle = "Zuletzt";
const placeTitle = "Ablageort";
const emptyRecent = "Noch nichts Passendes geöffnet — hier stehen dann die Einträge, die du zuletzt aufgemacht hast.";

/* Die erste Pille; mit ihr geht das Blatt auf. */
const RECENT = "recent";
const PLACE = "place";

/* Die Ablageorte: „Eingang“ nimmt alle Orte weg. */
function placeOptions(entry, rerender) {
  const places = entry.places || [];
  return placeOptionsFor(entry).map((option) => ({
    label: option.label,
    icon: option.icon,
    active: option.ref === null ? places.length === 0 : places.includes(option.ref),
    stay: true,
    onSelect: () => {
      if (option.ref === null) clearPlaces(entry);
      else togglePlace(entry, option.ref);
      rerender();
    },
  }));
}

/* Ein anderer Eintrag als Option: verknüpfen oder — auf der Seite eines
   Projekts — aufnehmen. */
function entryOption(entry, other, rerender) {
  const takesIn = !canLink(entry);
  return {
    label: other.title || typeLabel(other.type),
    icon: typeIcon(other.type),
    active: takesIn ? hasPlace(other, entryRef(entry.id)) : isLinked(entry, other),
    stay: true,
    onSelect: () => {
      if (takesIn) togglePlace(other, entryRef(entry.id));
      else toggleLink(entry, other);
      rerender();
    },
  };
}

/* Was zuletzt geöffnet wurde und sich mit diesem Eintrag verbinden lässt —
   das Jüngste zuerst. Sammlungen und Arbeitsbereiche stehen nicht dabei:
   sie sind kein Eintrag. */
function recentEntries(entry) {
  const allowed = new Set(linkOptionsFor(entry).map((other) => String(other.id)));
  return [...state.opens]
    .filter((open) => open.kind === "entry" && allowed.has(String(open.id)))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, RECENT_MAX)
    .map((open) => findEntry(open.id))
    .filter(Boolean);
}

/* Die Pillen: Zuletzt, Ablageort, dann jede Kategorie mit Einträgen. */
function sheetTabs(entry) {
  return [
    { id: RECENT, label: recentTitle },
    { id: PLACE, label: placeTitle },
    ...groupByType(linkOptionsFor(entry)).map((group) => ({ id: group.type, label: group.label })),
  ];
}

/* Die Liste unter der gewählten Pille. */
function tabOptions(entry, tab, rerender) {
  if (tab === PLACE) return placeOptions(entry, rerender);
  if (tab === RECENT) {
    const recent = recentEntries(entry);
    if (!recent.length) return [{ note: true, label: emptyRecent }];
    return recent.map((other) => entryOption(entry, other, rerender));
  }
  const group = groupByType(linkOptionsFor(entry)).find((item) => item.type === tab);
  return (group ? group.items : []).map((other) => entryOption(entry, other, rerender));
}

/*
 * Blatt zeichnen. Nach einem Haken zeichnet es sich in derselben Pille neu
 * und behält seine Scroll-Lage (`keepScroll`) — sonst spränge die Liste bei
 * jedem Haken zurück nach oben. Ein Pillenwechsel fängt oben an.
 */
function show(entry, tab, keepScroll) {
  const fresh = findEntry(entry.id) || entry;
  const tabs = sheetTabs(fresh);
  const current = tabs.some((item) => item.id === tab) ? tab : RECENT;
  const scrolled = keepScroll && !dom.sheet.hidden ? dom.sheetOptions.scrollTop : 0;
  const rerender = () => show(fresh, current, true);
  openSheet(fresh.title || typeSingular(fresh.type), tabOptions(fresh, current, rerender), {
    icon: typeIcon(fresh.type),
    iconColor: xpItemStyle(fresh.type).color,
    tabs,
    tab: current,
    onTab: (id) => show(fresh, id, false),
  });
  if (scrolled) dom.sheetOptions.scrollTop = scrolled;
}

/**
 * „Verknüpfen“ für einen Eintrag öffnen — bei „Zuletzt“, oder bei der Pille
 * `tab` („place“ oder eine Kategorie wie „aufgabe“).
 */
export function openLinkSheet(entry, tab = RECENT) {
  show(entry, tab, false);
}
