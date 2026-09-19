/*
 * Die Dateiansicht: tippt man im Medien-Raster auf eine Kachel, geht die Datei
 * hier bildschirmfüllend auf — Foto, Video, Aufnahme oder PDF. Oben stehen der
 * Name zum Ändern und der Teilen-Knopf, unten in einer eigenen schwarzen
 * Leiste liegen Verknüpfen, „Zur Seite“ und das Drei-Punkte-Menü.
 * Wird erst beim ersten Öffnen einer Datei nachgeladen.
 * Pfad: src/features/media/viewer.js
 *
 * Keine anpassbaren visuellen Werte: Flächen, Größen und Farben stehen in
 * styles/viewer.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { findEntry } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";
import { openEntry, registerOverlay } from "../../ui/router.js";
import { openLinkPicker } from "../../ui/pickers.js";
import { openViewerMenu, shareEntry } from "./viewer-menu.js";
import { releaseStage, renderStage } from "./viewer-stage.js";

/* Welche Datei gerade offen ist. 0 heißt: die Ansicht ist zu. */
let openId = 0;

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
      <div class="viewer-stage"></div>
      <p class="viewer-hint" hidden></p>
      <footer class="viewer-foot">
        <button class="viewer-foot-btn viewer-foot-icon" type="button" data-viewer="link" aria-label="Verknüpfen">${icon("link")}</button>
        <button class="viewer-foot-btn viewer-foot-goto" type="button" data-viewer="goto">
          <span>Zur Seite</span>${icon("external")}
        </button>
        <button class="viewer-foot-btn viewer-foot-icon" type="button" data-viewer="menu" aria-label="Optionen">${icon("dots")}</button>
      </footer>
    </div>`;
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
  closing = false;
  releaseStage();
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
 */
function open(push = true, entryOrState = null) {
  const entry = entryOrState && entryOrState.id !== undefined ? findEntry(entryOrState.id) : entryOrState;
  if (!entry) return;

  openId = entry.id;
  closing = false;
  mount();
  dom.mediaViewer.hidden = false;

  const { title, stage } = parts();
  title.value = entry.title || "";
  stage.dataset.entryId = String(entry.id);
  renderStage(stage, entry);

  if (push) history.pushState({ view: "file", id: entry.id, from: ui.sourceView }, "", `#/datei/${entry.id}`);
}

/** Von der Medien-Seite aus aufgerufen. */
export function openViewer(entry) {
  open(true, entry);
}

/* Der Eintrag, der gerade zu sehen ist — oder null, wenn er inzwischen weg ist. */
function currentEntry() {
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
  if (!entry) return;
  if (button.dataset.viewer === "share") {
    shareEntry(entry, parts().hint);
    return;
  }
  if (button.dataset.viewer === "link") {
    openLinkPicker(entry);
    return;
  }
  if (button.dataset.viewer === "goto") {
    goToEntryPage(entry);
    return;
  }
  openViewerMenu(entry, {
    onRename: () => {
      const { title } = parts();
      title.focus();
      title.select();
    },
    onClose: close,
  });
}

/* Tippen im Namensfeld speichert erst kurz nach dem letzten Buchstaben. */
function onInput(event) {
  if (!event.target.closest(".viewer-title")) return;
  const entry = currentEntry();
  if (!entry) return;
  entry.title = event.target.value;
  scheduleSave();
}

function init() {
  dom.mediaViewer.addEventListener("click", onClick);
  dom.mediaViewer.addEventListener("input", onInput);

  /* Ist der Eintrag weg (gelöscht, archiviert) oder änderte sich sein Name
     woanders, hört die Ansicht auf bzw. zieht nach. */
  on(events.dataChanged, () => {
    if (!openId) return;
    const entry = findEntry(openId);
    if (!entry || entry.archived) {
      close();
      return;
    }
    const { title } = parts();
    if (document.activeElement !== title) title.value = entry.title || "";
  });

  registerOverlay("file", { open, hide });
}

init();
