/*
 * Die zweite Kartenseite der Übersicht und die Sammlungen, die nicht an einer
 * der ersten vier Karten hängen: Lesezeichen, Archiv und Projekte — dazu die
 * Seite Arbeitsbereiche (Karte 3) und der große Kopf, den jede Sammlung zeigen
 * kann. Die ersten vier Karten stehen in src/data/config.js (overviewPages).
 * Pfad: src/data/collections.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * moreCards      -> die vier Karten rechts neben den ersten vier: Name, Icon
 *                   und ob sie schon gehen (`soon: true` = „Demnächst verfügbar“)
 * SOON_LABEL     -> Beschriftung des Schildchens oben rechts auf einer solchen Karte
 * archivePills   -> die Pillen oben im Archiv, von links nach rechts
 * workspacesPage -> Titel der Seite Arbeitsbereiche (Karte 3 der Übersicht)
 * projectsPage   -> Titel der Seite Projekte hinter „Projekte ↗“ auf der Übersicht
 * bookmarksPage  -> Titel der Lesezeichen-Seite
 * collectionHeads -> großer Kopf je Sammlung: Icon, seine Farbe und der Satz unter dem Titel
 *
 * Aussehen der Karten: styles/overview-more.css.
 */

import { typeIcon, typeOrder, typePlurals } from "./config.js";

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
  { id: "all", label: "Alle", icon: "archive" },
  { id: "workspaces", label: "Arbeitsbereiche", icon: "layers" },
  ...typeOrder.map((type) => ({ id: type, label: typePlurals[type], icon: typeIcon(type) })),
];

/* Die Seite Arbeitsbereiche (Karte 3): alle Arbeitsbereiche, je Tab eine Pille. */
export const workspacesPage = { title: "Arbeitsbereiche", kind: "workspaces" };

/* Die Seite Projekte hinter „Projekte ↗“: dieselben Ansichten und dieselbe Liste wie auf der Übersicht. */
export const projectsPage = { title: "Projekte", kind: "projects" };

/* Die Lesezeichen-Seite: Web-Lesezeichen, Videos und Orte aus allen Einträgen. */
export const bookmarksPage = { title: "Lesezeichen", kind: "bookmarks" };

/*
 * Der große Kopf einer Sammlung, wenn man ihn im Menü oben rechts einschaltet:
 * Icon mittig, darunter Titel und ein Satz — wie auf einer iOS-Infoseite.
 * Schlüssel ist die Art der Sammlung, der Eingang heißt „inbox“. Der Satz
 * endet nach drei Zeilen mit „…“ — so kurz wie möglich halten, damit er
 * auch auf kleinen Geräten nie an diese Grenze stößt.
 */
export const collectionHeads = {
  inbox: { icon: "inbox", color: "var(--inbox-icon-color)", intro: "Alles, was du erfasst hast und noch nicht eingeordnet ist." },
  favorites: { icon: "star", color: "var(--star-color)", intro: "Alles, was du markiert hast." },
  projects: { icon: "rocket", color: "var(--project-icon-color)", intro: "Eine Reihe von Aufgaben, die auf ein Ziel mit Termin hinführt." },
  resources: { icon: "cube", color: "var(--resource-icon-color)", intro: "Themen und Material, das dir später nützen kann." },
  archive: { icon: "archive", color: "var(--archive-color)", intro: "Alles Inaktive aus Projekten, Bereichen und Ressourcen." },
  workspaces: { icon: "layers", color: "var(--prio-next)", intro: "Verantwortungsbereiche ohne Enddatum, in denen du einen Standard halten willst." },
  bookmarks: { icon: "bookmark", color: "var(--bookmark-color)", intro: "Websites, Videos und Orte aus deinen Einträgen." },
};
