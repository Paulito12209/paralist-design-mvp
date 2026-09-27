/*
 * Die zweite Kartenseite der Übersicht und die Sammlungen, die nicht an einer
 * der ersten vier Karten hängen: Lesezeichen, Archiv und Arbeitsbereiche. Die ersten vier
 * Karten stehen in src/data/config.js (overviewPages).
 * Pfad: src/data/collections.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * moreCards      -> die vier Karten rechts neben den ersten vier: Name, Icon
 *                   und ob sie schon gehen (`soon: true` = „Demnächst verfügbar“)
 * SOON_LABEL     -> Beschriftung des Schildchens oben rechts auf einer solchen Karte
 * archivePills   -> die Pillen oben im Archiv, von links nach rechts
 * workspacesPage -> Titel der Sammlung hinter dem Pfeil neben „Arbeitsbereiche“
 * bookmarksPage  -> Titel und Satz darunter auf der Lesezeichen-Seite
 *
 * Aussehen der Karten: styles/overview-more.css.
 */

import { typeOrder, typePlurals } from "./config.js";

/* Steht oben rechts auf jeder Karte, die noch nichts tut. */
export const SOON_LABEL = "Demnächst verfügbar";

/*
 * Reihenfolge wie im Raster: oben links, oben rechts, unten links, unten rechts.
 * Karten mit `soon` sind abgeschaltet; Lesezeichen und Archiv stehen unten
 * nebeneinander und öffnen je ihre Sammlung.
 */
export const moreCards = [
  { id: "people", title: "Personen", icon: "people", soon: true },
  { id: "plans", title: "Pläne", icon: "table", soon: true },
  { id: "bookmarks", title: "Lesezeichen", icon: "bookmark" },
  { id: "archive", title: "Archiv", icon: "archive" },
];

/*
 * Pillen im Archiv: „Alle“ zuerst, dann die Arbeitsbereiche, dann je Typ eine
 * Pille in der Reihenfolge der Gruppen unter „Verknüpfte Einträge“.
 */
export const archivePills = [
  { id: "all", label: "Alle" },
  { id: "workspaces", label: "Arbeitsbereiche" },
  ...typeOrder.map((type) => ({ id: type, label: typePlurals[type] })),
];

/* Sammlung hinter dem Pfeil neben „Arbeitsbereiche“: alle Arbeitsbereiche, je Tab eine Pille. */
export const workspacesPage = { title: "Arbeitsbereiche", kind: "workspaces" };

/* Die Lesezeichen-Seite: ihr Titel steht wie auf einer iOS-Infoseite unter
   einem großen Icon, der Satz darunter sagt, woher die Lesezeichen kommen. */
export const bookmarksPage = {
  title: "Lesezeichen",
  kind: "bookmarks",
  intro: "Websites, Videos und Orte aus all deinen Einträgen — an einem Ort gesammelt.",
};
