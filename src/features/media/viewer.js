/*
 * Die Dateiansicht: tippt man im Medien-Raster auf eine Kachel, geht die Datei
 * hier bildschirmfüllend auf — Foto, Video, Aufnahme oder PDF. Oben stehen der
 * Name zum Ändern und der Teilen-Knopf, unten in einer eigenen schwarzen
 * Leiste liegen Verknüpfen, „Zur Seite“ und das Drei-Punkte-Menü. Zur
 * vorigen und nächsten Datei geht es über Pfeile, Wischen oder Pfeiltasten
 * (viewer-nav.js). Gezoomt wird nur die Datei, Kopf und Leiste bleiben stehen
 * (viewer-zoom.js). Ein YouTube-Video aus dem Player einer Karte geht hier
 * ebenfalls auf (openVideoViewer), mit derselben Kopfzeile und Leiste: sie
 * gelten dem Eintrag, in dem das Video steht; Teilen gibt den Link weiter.
 * Wird erst beim ersten Öffnen einer Datei nachgeladen.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * VIDEO_ID -> Kennung, unter der ein YouTube-Video offen ist (kein Eintrag)
 * Pfad: src/features/media/viewer.js
 *
 * Flächen, Größen und Farben stehen in styles/viewer.css.
 */

import { events, on } from "../../core/bus.js";
import { dom, focusAtEnd } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { findEntry } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";
import { openEntry, registerOverlay } from "../../ui/router.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { openVideoMenu, openViewerMenu, shareEntry, shareVideo } from "./viewer-menu.js";
import { navMarkup, neighborId, updateNav } from "./viewer-nav.js";
import { releaseStage, renderStage, renderVideoStage, toggleVideo } from "./viewer-stage.js";
import { bindZoom, isZoomed, resetZoom, unbindZoom } from "./viewer-zoom.js";

const VIDEO_ID = "video";

/* Welche Datei gerade offen ist. 0 heißt: die Ansicht ist zu. */
let openId = 0;

/* Die IDs, durch die man blättern kann — die Reihe, aus der geöffnet wurde. */
let sequence = [];

/* Das offene YouTube-Video ({ url, name, ratio, entryId }), sonst null. */
let video = null;

/* Das Schließen ist angestoßen, der Verlaufsschritt zurück aber noch nicht
   angekommen. Ohne diese Merkung ginge die App beim Löschen zwei Schritte
   zurück — einmal, weil der Eintrag verschwindet, einmal durch das Menü. */
let closing = false;

/* Das Gerüst der Ansicht steht nicht in index.html, sondern entsteht beim
   ersten Öffnen — so kostet es nichts, solange niemand eine Datei ansieht. */
function mount() {
  dom.mediaViewer.innerHTML = `
    <div class="viewer" role="dialog" aria-modal="true" aria-label="Datei">
      <header class="viewer-head">
        <button class="viewer-btn" type="button" data-viewer="close" aria-label="Zurück">
          ${icon("back")}
        </button>
        <input class="viewer-title" type="text" aria-label="Name der Datei" placeholder="Ohne Titel" />
        <button class="viewer-btn" type="button" data-viewer="share" aria-label="Teilen">${icon("share")}</button>
      </header>
      <div class="viewer-main">
        <div class="viewer-stage"></div>
        ${navMarkup()}
      </div>
      <p class="viewer-hint" hidden></p>
      <footer class="viewer-foot">
        <button class="viewer-foot-btn viewer-foot-icon" type="button" data-viewer="link" aria-label="Verknüpfen">${icon("link")}</button>
        <button class="viewer-foot-btn viewer-foot-goto" type="button" data-viewer="goto">
          <span>Zur Seite</span>${icon("external")}
        </button>
        <button class="viewer-foot-btn viewer-foot-icon" type="button" data-viewer="menu" aria-label="Optionen">${icon("dots")}</button>
      </footer>
    </div>`;
  /* Ein Tipp auf die Datei: beim YouTube-Video abspielen bzw. anhalten */
  bindZoom(dom.mediaViewer.querySelector(".viewer"), () => {
    if (video) toggleVideo();
  });
}

/* Die drei Teile, die beim Zeichnen und Bedienen gebraucht werden. */
function parts() {
  return {
    title: dom.mediaViewer.querySelector(".viewer-title"),
    stage: dom.mediaViewer.querySelector(".viewer-stage"),
    hint: dom.mediaViewer.querySelector(".viewer-hint"),
  };
}

/** Die Ansicht schließen und die Datei aus dem Speicher nehmen. */
function hide() {
  if (!openId) return;
  openId = 0;
  video = null;
  closing = false;
  releaseStage();
  unbindZoom();
  clearModalPull(dom.mediaViewer);
  /* Leeren, damit ein laufendes Video wirklich anhält und nicht weiterspielt. */
  dom.mediaViewer.innerHTML = "";
  dom.mediaViewer.hidden = true;
}

/* Schließen über den Pfeil: der Verlaufseintrag der Ansicht muss mit weg,
   sonst führte der nächste Browser-Zurück-Schritt ins Leere. */
function close() {
  if (!openId || closing) return;
  closing = true;
  if (history.state && history.state.view === "file") {
    history.back();
    return;
  }
  hide();
}

/**
 * Eine Datei öffnen.
 * @param entryOrState der Eintrag, oder beim Browser-Zurück der Verlaufseintrag.
 * @param push false, wenn der Verlauf schon stimmt (Browser-Zurück).
 * @param list die IDs der Reihe zum Blättern; beim Browser-Zurück steht sie im Verlaufseintrag.
 */
function open(push = true, entryOrState = null, list = null) {
  if (entryOrState && entryOrState.video) {
    openVideo(push, entryOrState.video);
    return;
  }
  video = null;
  const entry = entryOrState && entryOrState.id !== undefined ? findEntry(entryOrState.id) : entryOrState;
  if (!entry) return;

  openId = entry.id;
  sequence = list || (entryOrState && entryOrState.list) || [String(entry.id)];
  closing = false;
  mount();
  clearModalPull(dom.mediaViewer);
  dom.mediaViewer.hidden = false;

  show(entry);

  if (push) history.pushState({ view: "file", id: entry.id, list: sequence, from: ui.sourceView }, "", `#/datei/${entry.id}`);
}

/* Ein YouTube-Video ({ url, name, ratio, entryId }) bildschirmfüllend: Name
   nur zum Lesen, keine Pfeile. Die Leiste unten gilt dem Eintrag, in dem das
   Video steht (Lesezeichen oder Karte im Text). */
function openVideo(push, data) {
  openId = VIDEO_ID;
  video = data;
  sequence = [];
  closing = false;
  mount();
  clearModalPull(dom.mediaViewer);
  dom.mediaViewer.hidden = false;
  const { title, stage } = parts();
  title.value = data.name || "Video";
  title.readOnly = true;
  /* Ohne Eintrag (gelöscht) hätten Verknüpfen und „Zur Seite“ kein Ziel */
  dom.mediaViewer.querySelector(".viewer-foot").hidden = !currentEntry();
  renderVideoStage(stage, data);
  updateNav(dom.mediaViewer, sequence, VIDEO_ID);
  if (push) history.pushState({ view: "file", video: data, from: ui.sourceView }, "", "#/video");
}

/** Vom Player einer Karte aus (src/ui/video-player.js): das Video bildschirmfüllend. */
export function openVideoViewer(video) {
  openVideo(true, video);
}

/* Name, Datei und Pfeile für `entry` zeichnen — beim Öffnen und beim Blättern. */
function show(entry) {
  const { title, stage } = parts();
  title.value = entry.title || "";
  stage.dataset.entryId = String(entry.id);
  resetZoom();
  renderStage(stage, entry);
  updateNav(dom.mediaViewer, sequence, entry.id);
}

/* Zur vorigen (−1) oder nächsten (1) Datei. Der Verlaufseintrag wird ersetzt
   statt ergänzt: Zurück schließt die Ansicht, statt durch alle Bilder zu gehen. */
function step(direction) {
  const next = openId ? findEntry(neighborId(sequence, openId, direction)) : null;
  if (!next || closing) return;
  openId = next.id;
  show(next);
  history.replaceState({ ...history.state, id: next.id }, "", `#/datei/${next.id}`);
}

/** Von der Medien-Seite aus aufgerufen, mit allen Kacheln der gewählten Pille als Reihe. */
export function openViewer(entry, list) {
  open(true, entry, list);
}

/* Der Eintrag, der gerade zu sehen ist — beim YouTube-Video der, in dem es
   steht —, oder null, wenn er inzwischen weg ist. */
function currentEntry() {
  if (video) return video.entryId ? findEntry(video.entryId) : null;
  return openId ? findEntry(openId) : null;
}

/* „Zur Seite“: von der bildschirmfüllenden Datei zu ihrer eigenen Eintragsseite
   (Titel, Inhalt, Verknüpfte Einträge). Die Ansicht schließt dafür ohne
   Verlaufsschritt zurück, die Eintragsseite öffnet stattdessen einen neuen
   Schritt nach vorn — Browser-Zurück führt so zur Datei zurück. */
function goToEntryPage(entry) {
  hide();
  openEntry(entry.id);
}

function onClick(event) {
  const button = event.target.closest("[data-viewer]");
  if (!button) return;
  const entry = currentEntry();

  if (button.dataset.viewer === "close") {
    close();
    return;
  }
  if (button.dataset.viewer === "prev" || button.dataset.viewer === "next") {
    step(button.dataset.viewer === "prev" ? -1 : 1);
    return;
  }
  if (video && button.dataset.viewer === "share") {
    shareVideo(video, parts().hint);
    return;
  }
  if (!entry) return;
  if (button.dataset.viewer === "share") {
    shareEntry(entry, parts().hint);
    return;
  }
  if (button.dataset.viewer === "link") {
    openLinkSheet(entry);
    return;
  }
  if (button.dataset.viewer === "goto") {
    goToEntryPage(entry);
    return;
  }
  if (video) {
    openVideoMenu(video, parts().hint);
    return;
  }
  openViewerMenu(entry, {
    onRename: () => {
      focusAtEnd(parts().title);
    },
    onClose: close,
  });
}

/* Tippen im Namensfeld speichert erst kurz nach dem letzten Buchstaben. */
function onInput(event) {
  if (!event.target.closest(".viewer-title") || video) return;
  const entry = currentEntry();
  if (!entry) return;
  entry.title = event.target.value;
  scheduleSave();
}

function init() {
  dom.mediaViewer.addEventListener("click", onClick);
  dom.mediaViewer.addEventListener("input", onInput);

  /* Wischen blättert: der Wisch-Baustein der Pillen erkennt Richtung und
     Bildschirmrand, „vorher/nachher“ um die offene Datei genügen als Reihe. */
  initPillSwipe(dom.mediaViewer, {
    order: ["prev", "open", "next"],
    current: () => "open",
    select: (id) => step(id === "prev" ? -1 : 1),
    enabled: () => Boolean(openId) && !isZoomed(),
  });

  /* Pfeiltasten am Rechner — außer beim Tippen im Namensfeld. */
  document.addEventListener("keydown", (event) => {
    if (!openId || isZoomed() || dom.mediaViewer.hidden || event.target.closest("input, textarea")) return;
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });

  /* Ist der Eintrag gelöscht oder änderte sich sein Name woanders, hört die
     Ansicht auf bzw. zieht nach. Ein archivierter bleibt offen — man kommt
     aus dem Archiv hierher; Archivieren aus dem Menü schließt selbst. */
  on(events.dataChanged, () => {
    if (!openId || openId === VIDEO_ID) return;
    const entry = findEntry(openId);
    if (!entry) {
      close();
      return;
    }
    const { title } = parts();
    if (document.activeElement !== title) title.value = entry.title || "";
  });

  bindModalPull(dom.mediaViewer, close);
  registerOverlay("file", { open, hide });
}

init();
