/*
 * Ein Lesezeichen mit YouTube-Link bekommt den Titel des Videos: die Karte
 * im Inhalt ihren Namen, und heißt der Eintrag selbst noch wie der Link, auch
 * er. Läuft nach dem Anlegen im Eingabefeld und beim Öffnen der Seite — tut
 * nichts, sobald die Karte einen Namen hat.
 * Pfad: src/ui/bookmark-title.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { events, emit } from "../core/bus.js";
import { videoPreview } from "../core/link-preview.js";
import { BOOKMARK_TYPE } from "../data/bookmarks.js";
import { normalizeUrl, youtubeId } from "../data/link-kinds.js";
import { parseBlocks, serializeBlocks } from "../data/note-blocks.js";
import { findEntry } from "../data/queries.js";
import { saveState } from "../data/state.js";

/* Die erste YouTube-Karte ohne Namen im Text */
function unnamedVideo(blocks) {
  return blocks.find((block) => block.kind === "video" && block.url && youtubeId(block.url) && !block.name) || null;
}

/**
 * Titel nachschlagen und eintragen. Löst mit true auf, wenn sich etwas
 * geändert hat (dann lohnt es sich, die Seite neu zu zeichnen).
 */
export async function fillVideoTitle(entry) {
  const block = unnamedVideo(parseBlocks(entry.body || ""));
  if (!block) return false;
  const video = await videoPreview(block.url);
  if (!video || !video.name) return false;
  /* Die Antwort kann kommen, nachdem sich der Eintrag schon geändert hat */
  const live = findEntry(entry.id);
  if (!live) return false;
  const blocks = parseBlocks(live.body || "");
  const target = blocks.find((item) => item.kind === "video" && item.url === block.url && !item.name);
  if (!target) return false;
  target.name = video.name;
  live.body = serializeBlocks(blocks);
  if (live.type === BOOKMARK_TYPE && normalizeUrl(live.title) === block.url) live.title = video.name;
  saveState();
  emit(events.dataChanged);
  return true;
}
