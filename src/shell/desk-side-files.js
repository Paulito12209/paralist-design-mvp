/*
 * Seitenfenster › Medien und › Datei vom Gerät. „Medien“ zeigt die Kacheln
 * aus Medien; ein Klick zeigt die Datei groß im Fenster — Bild, Video,
 * Aufnahme, PDF oder Text —, „In Medien öffnen“ führt in die Dateiansicht.
 * „Datei vom Gerät“ zeigt eine Datei an, ohne sie zu speichern (wählen oder
 * hineinziehen); „In Medien speichern“ übernimmt sie als Medien-Eintrag.
 * Die gewählte Datei vom Gerät überlebt kein Neuladen — sie lag nie in der App.
 * Pfad: src/shell/desk-side-files.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TEXT_LIMIT -> wie viele Zeichen einer Textdatei höchstens gezeigt werden
 *
 * Aussehen steht in styles/desk-side-views.css; die Kacheln selbst in styles/media.css.
 */

import { getBlob } from "../core/blobs.js";
import { formatBytes } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { addMediaFiles } from "../data/media-add.js";
import { findEntry, mediaEntries } from "../data/queries.js";
import { mediaCell } from "../ui/media-cell.js";
import { openEntry } from "../ui/router.js";
import { showToast } from "../ui/toast.js";

const TEXT_LIMIT = 200000;

/* Adresse der gerade gezeigten Datei — wird beim Wechsel freigegeben, sonst bliebe sie im Speicher. */
let shownUrl = "";
/* Die Datei vom Gerät, nur im Arbeitsspeicher. */
let deviceFile = null;

function release() {
  if (shownUrl) URL.revokeObjectURL(shownUrl);
  shownUrl = "";
}

function emptyMarkup(iconName, title, text) {
  return `
    <div class="side-empty">
      ${icon(iconName, "side-empty-icon")}
      <p class="side-empty-title">${title}</p>
      <p class="side-empty-text">${text}</p>
    </div>`;
}

/* Was sich nicht zeigen lässt: Icon, Name, Größe. */
function fileCard(name, size) {
  return `
    <div class="side-file-card">
      ${icon("doc", "side-empty-icon")}
      <p class="side-empty-title">${escapeHtml(name || "Datei")}</p>
      <p class="side-empty-text">${size ? `${formatBytes(size)} · ` : ""}Lässt sich hier nicht anzeigen.</p>
    </div>`;
}

/**
 * Eine Datei groß in `box` zeigen. Gebraucht von Medien, Datei vom Gerät und
 * der Vorschau eines Eintrags (src/shell/desk-side-pages.js).
 */
export async function showFile(box, file, name = "") {
  release();
  if (!file || !box.isConnected) return;
  const mime = file.type || "";
  if (mime.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(name)) {
    const text = (await file.text()).slice(0, TEXT_LIMIT);
    box.innerHTML = `<pre class="side-text"></pre>`;
    box.firstElementChild.textContent = text;
    return;
  }
  shownUrl = URL.createObjectURL(file);
  const src = escapeHtml(shownUrl);
  if (mime.startsWith("image/")) box.innerHTML = `<img class="side-media" src="${src}" alt="${escapeHtml(name)}" />`;
  /* video und audio: die Steuerleiste des Browsers zum Abspielen */
  else if (mime.startsWith("video/")) box.innerHTML = `<video class="side-media" src="${src}" controls playsinline></video>`;
  else if (mime.startsWith("audio/")) box.innerHTML = `<audio class="side-audio" src="${src}" controls></audio>`;
  /* iframe: der PDF-Betrachter des Browsers zeigt das Dokument mit Blättern und Zoom */
  else if (mime === "application/pdf") box.innerHTML = `<iframe class="side-frame" src="${src}" title="${escapeHtml(name || "PDF")}"></iframe>`;
  else box.innerHTML = fileCard(name, file.size);
}

/* Den Medien-Eintrag aus der Browser-Datenbank holen; Beispiele haben keine Datei. */
export async function showMediaEntry(box, entry) {
  const file = await getBlob(entry.id).catch(() => null);
  if (!box.isConnected) return;
  if (file) showFile(box, file, entry.media?.name || entry.title);
  else box.innerHTML = `<div class="side-sample">${mediaCell(entry, false)}</div><p class="side-note">Ein Beispiel ohne eigene Datei.</p>`;
}

function mediaMarkup(state) {
  const entry = state.mediaId ? findEntry(state.mediaId) : null;
  if (entry) {
    return `
      <div class="side-preview-head">
        <p class="side-preview-title">${escapeHtml(entry.title || entry.media?.name || "Datei")}</p>
        <button class="side-pill" type="button" data-files="open" data-id="${entry.id}">${icon("external")}In Medien öffnen</button>
      </div>
      <div class="side-preview" data-preview></div>`;
  }
  const items = mediaEntries();
  if (!items.length) return emptyMarkup("photos", "Noch keine Medien", "Bilder, Videos und Dateien aus Medien erscheinen hier.");
  return `<div class="side-media-grid">${items.map((item) => mediaCell(item)).join("")}</div>`;
}

export const mediaView = {
  title: (state) => (state.mediaId && findEntry(state.mediaId) ? "Medien · Vorschau" : "Medien"),
  markup: mediaMarkup,
  /* Neue oder gelöschte Medien sollen gleich in den Kacheln stehen — eine offene Datei bleibt stehen */
  live: (state) => !state.mediaId,
  enter(body, ctx) {
    const box = body.querySelector("[data-preview]");
    const entry = ctx.state.mediaId ? findEntry(ctx.state.mediaId) : null;
    if (box && entry) showMediaEntry(box, entry);
  },
  leave: release,
  back(ctx) {
    if (!ctx.state.mediaId) return false;
    ctx.show("media", { mediaId: null });
    return true;
  },
  handle(event, ctx) {
    if (event.type !== "click") return;
    const open = event.target.closest('[data-files="open"]');
    if (open) {
      openEntry(Number(open.dataset.id));
      return;
    }
    const cell = event.target.closest("[data-open-entry]");
    if (cell) ctx.show("media", { mediaId: Number(cell.dataset.openEntry) });
  },
};

function deviceMarkup() {
  /* input type=file: der Dateidialog des Systems; versteckt, der Knopf daneben öffnet ihn */
  const picker = '<input class="side-file-input" type="file" data-files="input" hidden />';
  if (!deviceFile) {
    return `
      <div class="side-drop" data-files="drop">
        ${icon("import", "side-empty-icon")}
        <p class="side-empty-title">Datei hierher ziehen</p>
        <p class="side-empty-text">Sie wird nur angezeigt, nicht gespeichert.</p>
        <button class="side-pill" type="button" data-files="pick">Datei wählen</button>
        ${picker}
      </div>`;
  }
  return `
    <div class="side-preview-head">
      <p class="side-preview-title">${escapeHtml(deviceFile.name)}</p>
      <button class="side-pill" type="button" data-files="pick">Andere Datei</button>
      <button class="side-pill" type="button" data-files="keep">${icon("photos")}In Medien speichern</button>
      ${picker}
    </div>
    <div class="side-preview" data-preview></div>`;
}

function takeFile(file, ctx) {
  if (!file) return;
  deviceFile = file;
  ctx.render();
}

async function keepFile(ctx) {
  if (!deviceFile) return;
  const [entry] = await addMediaFiles([deviceFile], "import");
  if (!entry) return;
  showToast({ icon: "photos", title: "In Medien gespeichert", note: entry.title });
  ctx.show("media", { mediaId: entry.id });
}

export const deviceView = {
  title: () => "Datei vom Gerät",
  markup: deviceMarkup,
  enter(body) {
    const box = body.querySelector("[data-preview]");
    if (box && deviceFile) showFile(box, deviceFile, deviceFile.name);
  },
  leave: release,
  handle(event, ctx) {
    if (event.type === "change" && event.target.matches('[data-files="input"]')) takeFile(event.target.files[0], ctx);
    else if (event.type === "dragover" && event.target.closest('[data-files="drop"]')) event.preventDefault();
    else if (event.type === "drop" && event.target.closest('[data-files="drop"]')) {
      event.preventDefault();
      takeFile(event.dataTransfer.files[0], ctx);
    } else if (event.type === "click") {
      const action = event.target.closest("[data-files]")?.dataset.files;
      if (action === "pick") event.currentTarget.querySelector('[data-files="input"]')?.click();
      else if (action === "keep") keepFile(ctx);
    }
  },
};
