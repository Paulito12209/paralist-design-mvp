/*
 * Die quadratische Medien-Kachel. Sie kommt auf der Medien-Seite, bei den
 * Anhängen eines Eintrags und im Eingabefeld vor.
 * Pfad: src/ui/media-cell.js
 *
 * Keine anpassbaren visuellen Werte: Größe, Fugen und Farben stehen in
 * styles/media.css (Klassen .media-cell, .media-grid, .media-badge).
 */

import { formatClock } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { mediaKindOf } from "../data/queries.js";
import { thumbOf } from "../data/thumbs.js";

/* Icon je Medienart, wenn es keine Bildvorschau gibt. */
const kindIcons = { image: "image", video: "video", audio: "wave", doc: "doc" };

/** Kachel-Inhalt für eine Datei ohne Bild: Icon oben, Name darunter. */
function docCell(iconName, title) {
  const name = title ? `<span class="media-doc-name">${title}</span>` : "";
  return `<div class="media-doc">${icon(iconName, "media-doc-icon")}${name}</div>`;
}

/**
 * Eine Kachel: Bild oder Videovorschau, sonst Icon mit Name.
 * Videos und Aufnahmen zeigen unten rechts ihre Dauer.
 * @param showName ob der Name in die Kachel gehört. In der Reihe unter
 *   „Verknüpfte Einträge“ steht er schon darunter — dort stünde er sonst
 *   zweimal untereinander.
 */
export function mediaCell(entry, showName = true) {
  const media = entry.media || {};
  const kind = mediaKindOf(entry);
  const thumb = thumbOf(entry.id);
  const title = escapeHtml(entry.title || media.name || "Ohne Titel");
  const isPicture = kind === "image" || kind === "video";
  let inner;

  if (isPicture && thumb) inner = `<img class="media-img" src="${thumb}" alt="" loading="lazy" decoding="async" />`;
  /* Beispielmedien haben kein Bild, sondern eine Farbfläche aus styles/media.css */
  else if (isPicture && media.sample) inner = `<div class="media-img media-sample-${media.sample}"></div>`;
  else inner = docCell(kindIcons[kind] || "doc", showName ? title : "");

  if (kind === "video") {
    inner += `<span class="media-badge">${icon("video")}${media.duration ? formatClock(media.duration) : ""}</span>`;
  } else if (kind === "audio" && media.duration) {
    inner += `<span class="media-badge">${formatClock(media.duration)}</span>`;
  }

  return `<button class="media-cell" type="button" data-open-entry="${entry.id}" aria-label="${title}">${inner}</button>`;
}

/** Kachel eines noch nicht angelegten Anhangs im Eingabefeld. */
export function attachmentThumb(item) {
  const title = escapeHtml(item.title);
  if (item.thumb) return `<img class="attach-img" src="${item.thumb}" alt="${title}" />`;
  return `<span class="attach-file">${icon(kindIcons[item.kind] || "doc", "attach-file-icon")}<span class="attach-file-name">${title}</span></span>`;
}
