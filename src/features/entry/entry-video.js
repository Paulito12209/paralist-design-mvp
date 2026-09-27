/*
 * Der Videoplayer im Inhalt eines Eintrags: ein Tipp auf eine YouTube-Karte
 * spielt das Video hier in der App ab statt in einem neuen Browser-Tab. Der
 * Player steht wie die Zeichenfläche als eigener dunkler Block zwischen den
 * Pillen und der Karte „Details“ und ersetzt solange den Text; der Pfeil
 * oben links bringt den Text zurück. Oben rechts öffnet das Video auf
 * YouTube, unten liegen Tempo, Fortschritt (ziehen springt) und Vollbild,
 * darunter der Titel des Videos. Ein Tipp auf das Bild selbst hält an und
 * spielt weiter (das macht YouTube). Wird erst beim ersten Tipp auf eine
 * Video-Karte nachgeladen (src/core/lazy.js, Name „video“).
 * Pfad: src/features/entry/entry-video.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * SPEEDS  -> die Tempo-Stufen, durch die der Knopf „1x“ der Reihe nach schaltet
 * TICK_MS -> so oft rücken Fortschritt und Zeit nach, solange das Video läuft
 *
 * Aussehen in styles/video-player.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { formatClock } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { videoPreview } from "../../core/link-preview.js";
import { createYouTubePlayer, playerState } from "../../core/youtube.js";
import { youtubeId } from "../../data/link-kinds.js";
import { cardName } from "../../ui/block-markup.js";
import { foldFrame, layoutEntryFold } from "./entry-fold.js";

const SPEEDS = [1, 1.25, 1.5, 2, 0.5, 0.75];
const TICK_MS = 250;

let pad = null;
let player = null;
let timer = 0;
let speedIndex = 0;
/* Während man den Knopf auf der Leiste zieht, rückt der Fortschritt nicht von selbst nach */
let dragging = false;

function markup(block) {
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
    <div class="video-title">${escapeHtml(cardName(block))}</div>`;
}

/* Fortschritt (0–1) auf die Leiste schreiben; die Zeit links oben mit */
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

function bindPad(block) {
  pad.addEventListener("click", (event) => {
    const target = event.target;
    if (target.closest("[data-video-close]")) closeVideo();
    else if (target.closest("[data-video-open]")) window.open(block.url, "_blank", "noopener");
    else if (target.closest("[data-video-speed]")) cycleSpeed(target.closest("[data-video-speed]"));
    else if (target.closest("[data-video-full]")) toggleFullscreen();
  });
  bindTrack(pad.querySelector("[data-video-track]"));
}

/** Den Player für eine Video-Karte öffnen; der Text tritt solange zurück. */
export async function openVideo(block) {
  const id = youtubeId(block.url);
  if (!id) return;
  closeVideo();
  pad = document.createElement("div");
  pad.className = "video-pad";
  pad.innerHTML = markup(block);
  bindPad(block);
  speedIndex = 0;

  const fold = foldFrame();
  fold.append(pad);
  fold.classList.add("has-video");
  dom.entryBody.hidden = true;
  layoutEntryFold();
  /* Der Player steht oben auf der Seite — dorthin, auch wenn die Karte weit unten lag */
  dom.content.scrollTo({ top: 0, behavior: "smooth" });
  /* Hat die Karte noch keinen Titel (Netz war beim Einfügen nicht da), hier nachschlagen */
  const title = pad.querySelector(".video-title");
  if (!block.name) videoPreview(block.url).then((video) => video && title.isConnected && (title.textContent = video.name));

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

/** Player schließen und den Text wieder zeigen. */
export function closeVideo() {
  if (!pad) return;
  setTicking(false);
  if (document.fullscreenElement === pad) document.exitFullscreen();
  player?.destroy();
  player = null;
  pad.remove();
  pad = null;
  const fold = foldFrame();
  fold.classList.remove("has-video");
  dom.entryBody.hidden = false;
  layoutEntryFold();
}

/* Beim Verlassen der Seite verstummt das Video */
on(events.viewWillChange, closeVideo);
