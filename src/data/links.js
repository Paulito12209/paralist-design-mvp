/*
 * Verknüpfte Einträge: die Verbindung zwischen zwei Einträgen.
 *
 * Sie ist etwas anderes als der Ablageort (src/data/refs.js). Der Ablageort
 * sagt, WO ein Eintrag liegt, und zeigt nur in eine Richtung. Eine Verknüpfung
 * gilt in BEIDE Richtungen und ist gleichrangig: legt man auf der Seite einer
 * Notiz eine Aufgabe an, steht die Aufgabe bei der Notiz und die Notiz bei der
 * Aufgabe. Keines von beiden ist dem anderen über- oder untergeordnet.
 *
 * Gespeichert wird das je Eintrag in `links` — die Nummern der Einträge, mit
 * denen er verbunden ist. Dass auf beiden Seiten dasselbe steht, sichern die
 * Funktionen hier; `sanitizeLinks` bringt ältere Stände darauf.
 * Pfad: src/data/links.js
 *
 * ANPASSBARE WERTE (alle in src/data/config.js)
 * -----------------------------------
 * linkableTypes -> welche Typen sich verknüpfen lassen (Projekte nicht: Ort)
 * typeOrder     -> Reihenfolge der Gruppen unter „Verknüpfte Einträge“
 */

import { sameId } from "../core/ids.js";
import { linkableTypes } from "./config.js";
import { findEntry, groupByType } from "./queries.js";
import { state } from "./state.js";

/** Lässt sich dieser Eintrag verknüpfen? Ein Projekt nicht — es ist Ablageort. */
export function canLink(entry) {
  return Boolean(entry && linkableTypes.includes(entry.type));
}

/** Stehen die beiden schon miteinander in Verbindung? */
export function isLinked(entry, other) {
  return (entry.links || []).some((id) => sameId(id, other.id));
}

/**
 * Die verknüpften Einträge, die man wirklich sehen soll: Archiviertes bleibt
 * draußen, die Verbindung selbst bleibt aber bestehen — wer den Eintrag aus
 * dem Archiv zurückholt, findet ihn hier wieder.
 */
export function linkedEntries(entry) {
  return (entry.links || [])
    .map((id) => findEntry(id))
    .filter((other) => other && !other.archived);
}

/** Die verknüpften Einträge nach Typ gruppiert, wie der Inhalt eines Ablageorts. */
export function groupedLinks(entry) {
  return groupByType(linkedEntries(entry));
}

/**
 * Womit sich dieser Eintrag noch verknüpfen ließe: alles Sichtbare außer ihm
 * selbst und außer den Projekten. Die Reihenfolge ist die der Gruppen, damit
 * im Auswahl-Blatt Gleiches beieinandersteht.
 */
export function linkOptionsFor(entry) {
  const others = state.entries.filter(
    (item) => !item.archived && canLink(item) && !sameId(item.id, entry.id)
  );
  return groupByType(others).flatMap((group) => group.items);
}

/** Die Verbindung auf beiden Seiten eintragen. Speichert nicht — das tut der Aufrufer. */
export function connectEntries(entry, other) {
  if (!canLink(entry) || !canLink(other) || sameId(entry.id, other.id)) return;
  if (!Array.isArray(entry.links)) entry.links = [];
  if (!Array.isArray(other.links)) other.links = [];
  if (!isLinked(entry, other)) entry.links.push(other.id);
  if (!isLinked(other, entry)) other.links.push(entry.id);
}

/** Die Verbindung auf beiden Seiten lösen. Speichert nicht. */
export function disconnectEntries(entry, other) {
  entry.links = (entry.links || []).filter((id) => !sameId(id, other.id));
  other.links = (other.links || []).filter((id) => !sameId(id, entry.id));
}

/**
 * Einen Eintrag aus allen Verknüpfungen streichen. Nötig beim Löschen: sonst
 * bliebe auf der Gegenseite ein Verweis ins Leere stehen.
 */
export function dropLinksTo(id) {
  state.entries.forEach((entry) => {
    if (!Array.isArray(entry.links)) return;
    entry.links = entry.links.filter((linked) => !sameId(linked, id));
  });
}

/**
 * Ältere Speicherstände auf die heutige Form bringen.
 *
 * Früher gab es `attachments`: die Nummern der Medien, die beim Anlegen am
 * Eintrag hingen. Das zeigte nur in eine Richtung — das Foto wusste nichts von
 * seinem Eintrag. Daraus wird jetzt eine echte Verknüpfung.
 *
 * Danach wird aufgeräumt: doppelte Nummern, Verweise auf Gelöschtes, der
 * Verweis auf sich selbst und Verknüpfungen mit Projekten fallen weg. Zum
 * Schluss wird nachgetragen, was nur auf einer Seite steht.
 */
export function sanitizeLinks(entries) {
  const byId = new Map(entries.map((entry) => [String(entry.id), entry]));

  entries.forEach((entry) => {
    const stored = Array.isArray(entry.links) ? entry.links : [];
    const attached = Array.isArray(entry.attachments) ? entry.attachments : [];
    delete entry.attachments;
    const clean = new Set();
    if (canLink(entry)) {
      [...stored, ...attached].forEach((id) => {
        const other = byId.get(String(id));
        if (other && canLink(other) && !sameId(other.id, entry.id)) clean.add(other.id);
      });
    }
    entry.links = [...clean];
  });

  entries.forEach((entry) => {
    entry.links.forEach((id) => {
      const other = byId.get(String(id));
      if (other && !isLinked(other, entry)) other.links.push(entry.id);
    });
  });
}
