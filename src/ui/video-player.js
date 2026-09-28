/*
 * Der Videoplayer für YouTube-Karten: ein Tipp auf die Karte spielt das Video
 * hier in der App ab statt in einem neuen Browser-Tab. Der Player kommt als
 * dunkler Block genau an die Stelle der Karte — im Text eines Eintrags über
 * die ganze Zeilenbreite, auf der Lesezeichen-Seite anstelle der Zeile —,
 * der Rest bleibt stehen. Oben das Video in seinem echten Seitenverhältnis
 * (auch hochkant, nichts wird abgeschnitten) mit YouTubes eigener Bedienung
 * (Abspielen, Spulen, Ton). Darunter, zwischen Bild und Titel, die eigene
 * Leiste: links das Tempo-Raster (SPEEDS, Vorgabe in der Mitte), rechts der
 * Vollbild-Knopf, der das Video in der Medien-Vorschau der App öffnet
 * (src/features/media/viewer.js), und daneben „×“, das den Player schließt
 * und die Karte bzw. Zeile zurückholt. Ganz unten der Titel. Auch Seiten-
 * und Pillenwechsel schließen ihn. Nachgeladen beim ersten Tipp
 * (src/core/lazy.js, Name „video“); es gibt immer nur einen.
 * Pfad: src/ui/video-player.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * SPEEDS        -> die Stufen des Tempo-Rasters, von links nach rechts
 * DEFAULT_SPEED -> die vorgewählte Stufe (steht in der Mitte des Rasters)
 *
 * Aussehen in styles/video-player.css; --video-ratio setzt diese Datei aus
 * dem gemeldeten Seitenverhältnis (Höhe geteilt durch Breite).
 */

import { events, on } from "../core/bus.js";
import { escapeHtml, icon } from "../core/html.js";
import { load } from "../core/lazy.js";
import { videoPreview } from "../core/link-preview.js";
import { createYouTubePlayer } from "../core/youtube.js";
import { youtubeId } from "../data/link-kinds.js";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const DEFAULT_SPEED = 1;

let pad = null;
/* Das Element, an dessen Stelle der Player steht; kommt beim Schließen zurück */
let replaced = null;
let player = null;
/* Was gerade läuft — die Medien-Vorschau bekommt dieselben Angaben */
let current = null;

/* „0.25x“, „1x“, „1.5x“ — ohne überflüssige Nullen */
const speedLabel = (rate) => `${String(rate).replace(/^0\./, "0.")}x`;

function speedsMarkup() {
  return SPEEDS.map(
    (rate) =>
      `<button class="video-speed${rate === DEFAULT_SPEED ? " is-active" : ""}" type="button" data-video-speed="${rate}" aria-pressed="${rate === DEFAULT_SPEED}">${speedLabel(rate)}</button>`
  ).join("");
}

function markup(name) {
  return `
    <div class="video-stage"><div class="video-host"></div></div>
    <div class="video-bar">
      <div class="video-speeds" role="group" aria-label="Tempo">${speedsMarkup()}</div>
      <span class="video-actions">
        <button class="video-round" type="button" data-video-full aria-label="Vollbild">${icon("expand")}</button>
        <button class="video-round" type="button" data-video-close aria-label="Player schließen">${icon("close")}</button>
      </span>
    </div>
    <div class="video-title">${escapeHtml(name || "Video")}</div>`;
}

function setSpeed(button) {
  const rate = Number(button.dataset.videoSpeed);
  player?.setPlaybackRate(rate);
  pad.querySelectorAll("[data-video-speed]").forEach((item) => {
    const active = item === button;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
}

/* Vollbild: das Video in der Medien-Vorschau der App zeigen (nachgeladen);
   der kleine Player hält solange an, sonst liefe der Ton doppelt */
function openFullscreen() {
  if (!current) return;
  player?.pauseVideo();
  load("viewer").then((module) => module.openVideoViewer(current));
}

function bindPad() {
  pad.addEventListener("click", (event) => {
    const target = event.target;
    /* Der Player steht mitten in einer Liste oder im Text: der Tipp gehört ihm allein */
    event.stopPropagation();
    const speed = target.closest("[data-video-speed]");
    if (speed) setSpeed(speed);
    else if (target.closest("[data-video-full]")) openFullscreen();
    else if (target.closest("[data-video-close]")) closeVideo();
  });
}

/* Titel und Seitenverhältnis kommen von YouTube (noembed); bis dahin gilt 16:9 */
function applyPreview(url, name) {
  const title = pad.querySelector(".video-title");
  const mine = pad;
  videoPreview(url).then((video) => {
    if (!video || pad !== mine) return;
    if (!name && video.name) {
      title.textContent = video.name;
      current.name = video.name;
    }
    if (video.ratio) {
      pad.style.setProperty("--video-ratio", String(video.ratio));
      current.ratio = video.ratio;
    }
  });
}

/**
 * Den Player für ein Video öffnen: { url, name } und das Element, an dessen
 * Stelle er kommt (die Karte bzw. die Zeile). entryId: der Eintrag, in dem das
 * Video steht — die Leiste der Medien-Vorschau gilt ihm. Löst auf, sobald der
 * Block steht.
 */
export async function openVideo({ url, name, entryId }, node) {
  const id = youtubeId(url);
  if (!id || !node) return;
  closeVideo();
  current = { url, name: name || "", ratio: 0, entryId: entryId ?? null };
  pad = document.createElement("div");
  pad.className = "video-pad";
  pad.innerHTML = markup(name);
  bindPad();

  replaced = node;
  node.after(pad);
  /* Direkt am Element statt hidden: Karte und Zeile haben display: flex im
     Stylesheet, das hidden überstimmen würde */
  node.style.display = "none";
  applyPreview(url, name);

  const host = pad.querySelector(".video-host");
  const created = await createYouTubePlayer(host, id);
  /* Inzwischen geschlossen oder ein anderes Video geöffnet */
  if (!pad || !pad.contains(created.getIframe())) {
    created.destroy();
    return;
  }
  player = created;
  player.setPlaybackRate(DEFAULT_SPEED);
  player.playVideo();
}

/** Player schließen; die Karte kommt an ihre Stelle zurück. */
export function closeVideo() {
  if (!pad) return;
  player?.destroy();
  player = null;
  pad.remove();
  pad = null;
  current = null;
  if (replaced) replaced.style.display = "";
  replaced = null;
}

/** Steht der Player gerade in `container`? (Wer neu zeichnet, schließt ihn vorher.) */
export function isVideoOpenIn(container) {
  return Boolean(pad && container.contains(pad));
}

/* Beim Verlassen der Seite verstummt das Video — auch beim Zurück aus der
   Medien-Vorschau: die Seite wird dann neu gezeichnet, und die Karte bzw.
   Zeile steht wieder da. */
on(events.viewWillChange, closeVideo);
