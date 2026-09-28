/*
 * Video in der Kachel: ein Tipp auf das Vorschaubild einer YouTube-Karte
 * spielt das Video genau dort ab, wo das Bild war — in der kleinen Kachel im
 * Inhalt eines Eintrags und in der Kachel einer Lesezeichen-Zeile. Kein
 * eigener Player, kein neuer Tab: das Bild wird gegen den eingebetteten
 * YouTube-Player getauscht, ein Tipp darauf hält an und spielt weiter (das
 * macht YouTube). Es läuft immer nur ein Video; beim Verlassen der Seite und
 * beim Neuzeichnen kommt das Bild zurück.
 * Pfad: src/ui/video-player.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * PLAYER_HOST -> Adresse des eingebetteten Players (nocookie: keine Cookies, bis das Video läuft)
 * playerArgs  -> was YouTube zeigt: autoplay 1 = sofort starten, controls 0 = keine
 *                eigenen Knöpfe, playsinline 1 = am Handy in der Kachel statt im Vollbild
 *
 * Wie der Player die Kachel füllt: styles/video-player.css.
 */

import { events, on } from "../core/bus.js";
import { escapeHtml } from "../core/html.js";
import { youtubeId } from "../data/link-kinds.js";

const PLAYER_HOST = "https://www.youtube-nocookie.com";
const playerArgs = "autoplay=1&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1";

/* Die Kachel, in der gerade ein Video läuft, und ihr Bild von vorher */
let active = null;

/** Läuft in dieser Kachel gerade ein Video? */
export function isPlayingIn(tile) {
  return Boolean(active && active.tile === tile);
}

/** Das Video anhalten und das Vorschaubild zurückholen. */
export function stopVideo() {
  if (!active) return;
  const { tile, html } = active;
  active = null;
  /* Die Kachel kann beim Neuzeichnen schon ersetzt worden sein */
  if (!tile.isConnected) return;
  tile.innerHTML = html;
  tile.classList.remove("is-playing");
}

/**
 * Das Video eines Links in `tile` abspielen (die Fläche, in der das
 * Vorschaubild steht). Kein YouTube-Link: nichts passiert, gibt false zurück.
 */
export function playInTile(tile, url) {
  const id = youtubeId(url);
  if (!id || !tile) return false;
  if (isPlayingIn(tile)) return true;
  stopVideo();
  active = { tile, html: tile.innerHTML };
  const src = `${PLAYER_HOST}/embed/${id}?${playerArgs}`;
  /* iframe: der Player von YouTube lässt sich nur so einbetten. allow autoplay:
     sonst startet das Video nach dem Tipp nicht von selbst. */
  tile.innerHTML = `<iframe src="${escapeHtml(src)}" title="Video" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  tile.classList.add("is-playing");
  return true;
}

/* Beim Verlassen der Seite verstummt das Video */
on(events.viewWillChange, stopVideo);
