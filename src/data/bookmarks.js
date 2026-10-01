/*
 * Die Lesezeichen-Sammlung: jede Karte für Website, Video oder Standort aus
 * dem Inhalt irgendeines Eintrags — und die eigenen Einträge vom Typ
 * „Lesezeichen“. Hier steht nur, WAS dazugehört; gezeichnet wird die Seite in
 * src/features/bookmarks/bookmarks.js.
 * Pfad: src/data/bookmarks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * bookmarkPills -> die Pillen oben auf der Seite: Name, Icon und welche
 *                  Karten-Art darunter steht (`kind: null` = alle), von links nach rechts
 * BOOKMARK_TYPE -> der Eintragstyp, der selbst ein Lesezeichen ist
 */

import { hostOf, isShortMapsLink, normalizeUrl, placeFromUrl, youtubeId } from "./link-kinds.js";
import { blockLine, embedKinds, makeBlock, parseBlocks, serializeBlocks } from "./note-blocks.js";
import { state } from "./state.js";

export const BOOKMARK_TYPE = "lesezeichen";

/* `kind` ist die Karten-Art im Inhalt eines Eintrags (src/data/note-blocks.js).
   „Zuletzt erstellt“ zeigt wie auf der Medien-Seite alles, neueste zuerst. */
export const bookmarkPills = [
  { id: "recent", label: "Zuletzt erstellt", icon: "history", kind: null },
  { id: "web", label: "Web-Lesezeichen", icon: "bookmark", kind: "link" },
  { id: "video", label: "Videos", icon: "video", kind: "video" },
  { id: "place", label: "Standorte", icon: "pin", kind: "place" },
];

/** Die gewählte Pille — eine unbekannte (alter Verlaufseintrag) fällt auf die erste zurück. */
export function validBookmarkPill(id) {
  return bookmarkPills.some((pill) => pill.id === id) ? id : bookmarkPills[0].id;
}

/* Ist das ein Link auf eine Karte? Google Maps, seine Kurzlinks und Apple Maps. */
function isMapsLink(url) {
  const host = hostOf(url);
  if (isShortMapsLink(url) || host === "maps.apple.com") return true;
  return /(^|\.)google\.[a-z.]+$/.test(host) && (host.startsWith("maps.") || new URL(url).pathname.startsWith("/maps"));
}

/** Welche Karte ein Link wird: Video, Standort oder Website. */
export function embedKindOf(url) {
  if (youtubeId(url)) return "video";
  if (isMapsLink(url)) return "place";
  return "link";
}

/**
 * Alle Lesezeichen einer Karten-Art (`null` = alle Arten), neueste Einträge
 * zuerst. Jedes bringt mit, in welchem Eintrag es steht — die Seite nennt ihn
 * unter dem Namen. Ein eigener Lesezeichen-Eintrag ohne Link steht unter
 * „Web-Lesezeichen“ (und „Zuletzt erstellt“), damit er nicht verschwindet,
 * solange man den Link noch nicht eingefügt hat.
 */
export function bookmarkItems(kind) {
  const items = [];
  const entries = state.entries
    .filter((entry) => !entry.archived)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const fits = (block) => block.url && embedKinds.includes(block.kind) && (!kind || block.kind === kind);
  entries.forEach((entry) => {
    const blocks = parseBlocks(entry.body);
    blocks.filter(fits).forEach((block, index) => items.push({ key: `${entry.id}-${index}`, entry, block }));
    const bare = entry.type === BOOKMARK_TYPE && (!kind || kind === "link") && !blocks.some((block) => block.url);
    if (bare) items.push({ key: `${entry.id}-bare`, entry, block: makeBlock("link") });
  });
  return items;
}

/**
 * Gehört der Eintrag zur Lesezeichen-Sammlung — egal ob archiviert? Dieselbe
 * Regel wie in bookmarkItems: eine Link-Karte im Inhalt oder der Typ
 * „Lesezeichen“. Der Archiv-Knopf fragt damit, ob archivierte Lesezeichen da sind.
 */
export function holdsBookmark(entry) {
  if (entry.type === BOOKMARK_TYPE) return true;
  return parseBlocks(entry.body).some((block) => block.url && embedKinds.includes(block.kind));
}

/** Alle Lesezeichen zusammen — die Zahl auf der Karte der Startseite. */
export function bookmarkTotal() {
  return bookmarkItems(null).length;
}

/**
 * Ein neuer Lesezeichen-Eintrag, dessen Titel ein Link ist: der Link wird zur
 * Karte im Inhalt und der Titel zu etwas Lesbarem (Ort, Website). Ein Video
 * behält den Link als Titel, bis src/ui/bookmark-title.js den Videotitel holt.
 */
export function fillBookmarkEntry(entry) {
  const url = normalizeUrl(entry.title);
  if (!url) return;
  const kind = embedKindOf(url);
  const name = kind === "place" ? placeFromUrl(url).name : "";
  entry.body = blockLine(makeBlock(kind, { url, name }));
  if (kind === "place" && name) entry.title = name;
  else if (kind === "link") entry.title = hostOf(url);
}

/**
 * Die Adresse eines Lesezeichens ändern (Abschnitt „Link“ in den Details):
 * die Karte bekommt den neuen Link, ihre Art richtet sich danach, ihr Name
 * fällt weg (kommt aus dem Netz nach). Hieß der Eintrag wie der alte Link
 * oder wie die Karte, heißt er jetzt wie der neue. Ungültig: nichts passiert, false.
 */
export function setBookmarkUrl(entry, input) {
  const url = normalizeUrl(input);
  if (!url) return false;
  const blocks = parseBlocks(entry.body || "");
  const index = blocks.findIndex((block) => block.url);
  const old = index >= 0 ? blocks[index] : null;
  const kind = embedKindOf(url);
  const name = kind === "place" ? placeFromUrl(url).name : "";
  const card = makeBlock(kind, { url, name });
  if (old) blocks[index] = card;
  else blocks.unshift(card);
  entry.body = serializeBlocks(blocks);
  const stale = !entry.title || (old && (entry.title === old.url || entry.title === old.name));
  if (stale) entry.title = name || (kind === "link" ? hostOf(url) : url);
  return true;
}
