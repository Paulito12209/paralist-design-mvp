/*
 * Der Videoplayer für YouTube-Karten: ein Tipp auf die Karte spielt das Video
 * hier in der App ab statt in einem neuen Browser-Tab. Der Player kommt als
 * dunkler Block genau an die Stelle der Karte — im Text eines Eintrags über
 * die ganze Zeilenbreite, auf der Lesezeichen-Seite anstelle der Zeile —,
 * der Rest bleibt stehen. Der Pfeil oben links bringt die Karte zurück, oben
 * rechts öffnet das Video auf YouTube; unten liegen Tempo, Fortschritt
 * (ziehen springt) und Vollbild, darunter der Titel. Ein Tipp aufs Bild hält
 * an und spielt weiter (das macht YouTube). Nachgeladen beim ersten Tipp
 * (src/core/lazy.js, Name „video“); es gibt immer nur einen Player.
 * Pfad: src/ui/video-player.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * SPEEDS  -> die Tempo-Stufen, durch die der Knopf „1x“ der Reihe nach schaltet
 * TICK_MS -> so oft rücken Fortschritt und Zeit nach, solange das Video läuft
 *
 * Aussehen in styles/video-player.css.
 */

import { events, on } from "../core/bus.js";
import { formatClock } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { videoPreview } from "../core/link-preview.js";
import { createYouTubePlayer, playerState } from "../core/youtube.js";
import { youtubeId } from "../data/link-kinds.js";

const SPEEDS = [1, 1.25, 1.5, 2, 0.5, 0.75];
const TICK_MS = 250;

let pad = null;
/* Das Element, an dessen Stelle der Player steht; kommt beim Schließen zurück */
let replaced = null;
let player = null;
let timer = 0;
let speedIndex = 0;
/* Während man den Knopf auf der Leiste zieht, rückt der Fortschritt nicht von selbst nach */
let dragging = false;

function markup(name) {
  return `
    <div class="video-stage">
      <div class="video-host"></div>
      <button class="video-glass video-close" type="button" data-video-close aria-label="Player schließen">${icon("back")}</button>
      <button class="video-glass video-open" type="button" data-video-open aria-label="Auf YouTube öffnen">${icon("external")}</button>
      <div class="video-time"><span data-video-now>0:00</span> / <span data-video-total>0:00</span></div>
      <div class="video-bar">
        <button class="video-speed" type="button" data-video-speed aria-label="Tempo">1x</button>
        <div class="video-track" data-video-track role="slider" aria-label="Fortschritt" tabindex="-1"><span class="video-knob"></span></div>
        <button class="video-full" type="button" data-video-full aria-label="Vollbild">${icon("expand")}</button>
      </div>
    </div>
    <div class="video-title">${escapeHtml(name || "Video")}</div>`;
}

/* Fortschritt (0–1) auf die Leiste schreiben; die Zeit darüber mit */
function showProgress(fraction, now) {
  const track = pad.querySelector("[data-video-track]");
  track.style.setProperty("--video-progress", String(fraction));
  track.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
  pad.querySelector("[data-video-now]").textContent = formatClock(now);
}

function tick() {
  if (!player || dragging) return;
  const total = player.getDuration() || 0;
  const now = player.getCurrentTime() || 0;
  pad.querySelector("[data-video-total]").textContent = formatClock(total);
  showProgress(total ? now / total : 0, now);
}

/* Nur messen, solange das Video läuft — in der Pause steht die Leiste still */
function setTicking(running) {
  clearInterval(timer);
  timer = running ? setInterval(tick, TICK_MS) : 0;
}

function onState(state) {
  setTicking(state === playerState.playing);
  /* Auch nach Pause und Ende einmal nachrücken, damit die Zeit stimmt */
  if (state !== playerState.playing) tick();
}

function cycleSpeed(button) {
  speedIndex = (speedIndex + 1) % SPEEDS.length;
  const rate = SPEEDS[speedIndex];
  player?.setPlaybackRate(rate);
  button.textContent = `${rate}x`;
}

/* Auf der Leiste ziehen: der Fortschritt folgt dem Finger, losgelassen
   springt das Video dorthin. Die Breite der Leiste wird einmal beim Anfassen
   gemessen, nicht bei jeder Bewegung. */
function bindTrack(track) {
  let rect = null;
  let fraction = 0;
  const at = (event) => Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  track.addEventListener("pointerdown", (event) => {
    if (!player) return;
    dragging = true;
    rect = track.getBoundingClientRect();
    track.setPointerCapture(event.pointerId);
    fraction = at(event);
    showProgress(fraction, fraction * (player.getDuration() || 0));
  });
  track.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    fraction = at(event);
    showProgress(fraction, fraction * (player.getDuration() || 0));
  });
  const finish = () => {
    if (!dragging) return;
    dragging = false;
    player?.seekTo(fraction * (player.getDuration() || 0), true);
  };
  track.addEventListener("pointerup", finish);
  track.addEventListener("pointercancel", finish);
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (pad.requestFullscreen) pad.requestFullscreen();
}

function bindPad(url) {
  pad.addEventListener("click", (event) => {
    const target = event.target;
    /* Der Player steht mitten in einer Liste oder im Text: der Tipp gehört ihm allein */
    event.stopPropagation();
    if (target.closest("[data-video-close]")) closeVideo();
    else if (target.closest("[data-video-open]")) window.open(url, "_blank", "noopener");
    else if (target.closest("[data-video-speed]")) cycleSpeed(target.closest("[data-video-speed]"));
    else if (target.closest("[data-video-full]")) toggleFullscreen();
  });
  bindTrack(pad.querySelector("[data-video-track]"));
}

/**
 * Den Player für ein Video öffnen: { url, name } und das Element, an dessen
 * Stelle er kommt (die Karte bzw. die Zeile). Löst auf, sobald der Block steht.
 */
export async function openVideo({ url, name }, node) {
  const id = youtubeId(url);
  if (!id || !node) return;
  closeVideo();
  pad = document.createElement("div");
  pad.className = "video-pad";
  pad.innerHTML = markup(name);
  bindPad(url);
  speedIndex = 0;

  replaced = node;
  node.after(pad);
  /* Direkt am Element statt hidden: Karte und Zeile haben display: flex im
     Stylesheet, das hidden überstimmen würde */
  node.style.display = "none";
  /* Hat die Karte noch keinen Titel (Netz war beim Einfügen nicht da), hier nachschlagen */
  const title = pad.querySelector(".video-title");
  if (!name) videoPreview(url).then((video) => video && title.isConnected && (title.textContent = video.name));

  const host = pad.querySelector(".video-host");
  const created = await createYouTubePlayer(host, id, { onState });
  /* Inzwischen geschlossen oder ein anderes Video geöffnet */
  if (!pad || !pad.contains(created.getIframe())) {
    created.destroy();
    return;
  }
  player = created;
  tick();
  player.playVideo();
}

/** Player schließen; die Karte kommt an ihre Stelle zurück. */
export function closeVideo() {
  if (!pad) return;
  setTicking(false);
  if (document.fullscreenElement === pad) document.exitFullscreen();
  player?.destroy();
  player = null;
  pad.remove();
  pad = null;
  if (replaced) replaced.style.display = "";
  replaced = null;
}

/** Steht der Player gerade in `container`? (Wer neu zeichnet, schließt ihn vorher.) */
export function isVideoOpenIn(container) {
  return Boolean(pad && container.contains(pad));
}

/* Beim Verlassen der Seite verstummt das Video */
on(events.viewWillChange, closeVideo);
