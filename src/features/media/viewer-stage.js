/*
 * Die Fläche der Dateiansicht: je nach Art ein Bild, ein Video mit Bedienung,
 * ein Audio-Spieler oder ein PDF. Die Datei kommt aus der Browser-Datenbank
 * (src/core/blobs.js) und bekommt für die Dauer der Ansicht eine kurze Adresse.
 * Pfad: src/features/media/viewer-stage.js
 *
 * Keine anpassbaren visuellen Werte: Größen, Flächen und Abstände stehen in
 * styles/viewer.css (Klassen .viewer-stage, .viewer-img, .viewer-player).
 */

import { getBlob } from "../../core/blobs.js";
import { escapeHtml, icon } from "../../core/html.js";
import { mediaKindOf } from "../../data/queries.js";
import { thumbOf } from "../../data/thumbs.js";

/* Icon je Art, wenn es nichts anzuzeigen gibt. */
const kindIcons = { image: "image", video: "video", audio: "wave", doc: "doc" };

/* Die Adresse der gerade gezeigten Datei — sie wird beim Schließen freigegeben. */
let openUrl = null;

/** Die kurze Adresse der letzten Datei freigeben, damit der Speicher frei wird. */
export function releaseStage() {
  if (!openUrl) return;
  URL.revokeObjectURL(openUrl);
  openUrl = null;
}

/* Hinweis statt Spieler: die Datei liegt nicht (mehr) im Browser. */
function missing(entry, text) {
  const kind = mediaKindOf(entry);
  const thumb = thumbOf(entry.id);
  const preview = thumb
    ? `<img class="viewer-img" src="${thumb}" alt="" />`
    : `<div class="viewer-missing-icon">${icon(kindIcons[kind] || "doc")}</div>`;
  return `${preview}<p class="viewer-note">${escapeHtml(text)}</p>`;
}

/* Bild: füllt die Fläche, ohne verzerrt zu werden. */
function imageMarkup(url, title) {
  return `<img class="viewer-img" src="${url}" alt="${escapeHtml(title)}" />`;
}

/* Video und Audio nutzen die Bedienleiste des Browsers — sie kann Abspielen,
   Spulen und Lautstärke schon und sieht auf jedem Gerät vertraut aus. */
function videoMarkup(url) {
  /* video: nur dieses Element kann ein Video abspielen; playsinline hält es im Bildschirm */
  return `<video class="viewer-video" src="${url}" controls playsinline preload="metadata"></video>`;
}

function audioMarkup(url, title) {
  /* audio: der Tonspieler des Browsers, darüber Icon und Name der Aufnahme */
  return `
    <div class="viewer-player">
      <div class="viewer-player-icon">${icon("wave")}</div>
      <p class="viewer-player-name">${escapeHtml(title)}</p>
      <audio class="viewer-audio" src="${url}" controls preload="metadata"></audio>
    </div>`;
}

function docMarkup(url, title, isPdf) {
  /* iframe: ein PDF zeigt der Browser nur in einem eigenen kleinen Fenster an */
  if (isPdf) return `<iframe class="viewer-pdf" src="${url}" title="${escapeHtml(title)}"></iframe>`;
  return `
    <div class="viewer-player">
      <div class="viewer-player-icon">${icon("doc")}</div>
      <p class="viewer-player-name">${escapeHtml(title)}</p>
      <a class="viewer-open" href="${url}" download="${escapeHtml(title)}">Datei öffnen</a>
    </div>`;
}

/**
 * Die Fläche mit der Datei des Eintrags füllen.
 * Fehlt die Datei (Beispielmedien, geleerter Speicher), steht dort ein Hinweis
 * mit dem Vorschaubild.
 */
export async function renderStage(stage, entry) {
  releaseStage();
  const kind = mediaKindOf(entry);
  const title = entry.title || (entry.media && entry.media.name) || "Ohne Titel";
  stage.innerHTML = `<p class="viewer-note">Wird geladen …</p>`;

  const file = await getBlob(entry.id);
  /* Zwischenzeitlich wurde schon etwas anderes geöffnet: dieses Ergebnis verwerfen. */
  if (stage.dataset.entryId !== String(entry.id)) return;

  if (!file) {
    stage.innerHTML = missing(entry, "Diese Datei liegt nicht in diesem Browser — sie lässt sich nur als Vorschau zeigen.");
    return;
  }

  openUrl = URL.createObjectURL(file);
  const mime = file.type || (entry.media && entry.media.mime) || "";

  if (kind === "image") stage.innerHTML = imageMarkup(openUrl, title);
  else if (kind === "video") stage.innerHTML = videoMarkup(openUrl);
  else if (kind === "audio") stage.innerHTML = audioMarkup(openUrl, title);
  else stage.innerHTML = docMarkup(openUrl, title, mime === "application/pdf");
}
