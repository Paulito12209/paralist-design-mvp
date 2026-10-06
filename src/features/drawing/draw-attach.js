/*
 * „Anhang“ in einer Zeichnung: ein Fenster mit zwei Reitern.
 *
 *   Medien          — die Bilder, die schon in der App liegen, als Raster;
 *                     anklicken wählt (auch mehrere), Doppelklick setzt sofort ein.
 *   Eigene Dateien  — Bilder vom Gerät: hineinziehen oder „Dateien auswählen“.
 *                     Sie werden dabei wie auf der Medien-Seite importiert
 *                     und liegen danach auch unter Medien.
 *
 * Das Fenster wird erst beim ersten Öffnen nachgeladen und gebaut.
 * Ziehen auf die Fläche und Einfügen aus der Zwischenablage nutzen
 * insertImageFiles() von hier, ohne das Fenster zu öffnen.
 * Pfad: src/features/drawing/draw-attach.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tabs        -> Name und Reihenfolge der zwei Reiter
 * importNote  -> Hinweis unter dem Ablagefeld, dass eigene Dateien auch in Medien landen
 *
 * Aussehen: styles/drawing-attach.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { addMediaFiles } from "../../data/media-add.js";
import { mediaEntries, mediaKindOf } from "../../data/queries.js";
import { thumbOf } from "../../data/thumbs.js";
import { showToast } from "../../ui/toast.js";
import { insertImages } from "./draw-insert.js";

const tabs = [
  { id: "media", label: "Medien" },
  { id: "files", label: "Eigene Dateien" },
];
const importNote = "Die Bilder werden dabei auch unter Medien abgelegt.";

let root = null;
let tab = "media";
let picked = [];

/** Bilder vom Gerät importieren und in die Zeichnung setzen. */
export async function insertImageFiles(files, point = null) {
  const images = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
  if (!images.length) {
    showToast({ icon: "info", title: "Nur Bilder lassen sich einfügen", accent: "var(--muted)" });
    return;
  }
  const added = await addMediaFiles(images, "import");
  await insertImages(
    added.map((entry) => entry.id),
    point
  );
}

function images() {
  return mediaEntries().filter((entry) => mediaKindOf(entry) === "image");
}

function tabsMarkup() {
  return tabs
    .map(
      (item) =>
        `<button class="draw-attach-tab${item.id === tab ? " is-active" : ""}" type="button" role="tab" aria-selected="${item.id === tab}" data-attach-tab="${item.id}">${escapeHtml(item.label)}</button>`
    )
    .join("");
}

function mediaMarkup() {
  const list = images();
  if (!list.length) {
    return `<div class="draw-attach-empty">${icon("photos")}<p>Noch keine Bilder unter Medien.</p>
      <button class="draw-attach-link" type="button" data-attach-tab="files">Eigene Dateien öffnen</button></div>`;
  }
  const tiles = list
    .map((entry) => {
      const thumb = thumbOf(entry.id);
      const chosen = picked.includes(entry.id);
      const img = thumb ? `<img src="${escapeHtml(thumb)}" alt="" loading="lazy" decoding="async" draggable="false">` : icon("image");
      return `<button class="draw-attach-tile${chosen ? " is-picked" : ""}" type="button" data-attach-pick="${entry.id}" aria-pressed="${chosen}" title="${escapeHtml(entry.title || "Bild")}">
        ${img}<span class="draw-attach-check">${icon("check")}</span></button>`;
    })
    .join("");
  return `<div class="draw-attach-grid">${tiles}</div>`;
}

function filesMarkup() {
  /* input type=file: nur darüber öffnet der Browser die Dateiauswahl des Systems */
  return `<label class="draw-attach-drop" data-attach-drop>
      ${icon("import")}
      <strong>Bilder hierher ziehen</strong>
      <span>oder</span>
      <span class="draw-attach-choose">Dateien auswählen</span>
      <input type="file" accept="image/*" multiple hidden data-attach-input>
    </label>
    <p class="draw-attach-note">${escapeHtml(importNote)}</p>`;
}

function render() {
  root.querySelector(".draw-attach-tabs").innerHTML = tabsMarkup();
  root.querySelector(".draw-attach-body").innerHTML = tab === "media" ? mediaMarkup() : filesMarkup();
  const foot = root.querySelector(".draw-attach-foot");
  foot.hidden = tab !== "media" || !images().length;
  const insert = root.querySelector("[data-attach-insert]");
  insert.disabled = !picked.length;
  insert.textContent = picked.length > 1 ? `${picked.length} einfügen` : "Einfügen";
}

/** Das Fenster schließen. */
export function closeAttach() {
  if (root) root.hidden = true;
  picked = [];
}

async function insertPicked(ids) {
  closeAttach();
  await insertImages(ids);
}

async function takeFiles(files) {
  closeAttach();
  await insertImageFiles(files);
}

function onClick(event) {
  if (event.target === root || event.target.closest("[data-attach-close]")) {
    closeAttach();
    return;
  }
  const tabButton = event.target.closest("[data-attach-tab]");
  if (tabButton) {
    tab = tabButton.dataset.attachTab;
    render();
    return;
  }
  const tile = event.target.closest("[data-attach-pick]");
  if (tile) {
    const id = Number(tile.dataset.attachPick);
    picked = picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id];
    render();
    return;
  }
  if (event.target.closest("[data-attach-insert]") && picked.length) insertPicked(picked);
}

function build() {
  root = document.createElement("div");
  root.className = "draw-attach-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="draw-attach" role="dialog" aria-modal="true" aria-labelledby="draw-attach-title">
      <div class="draw-attach-head">
        <h2 id="draw-attach-title">Anhang einfügen</h2>
        <button class="draw-attach-close" type="button" data-attach-close aria-label="Schließen">${icon("close")}</button>
      </div>
      <div class="draw-attach-tabs" role="tablist"></div>
      <div class="draw-attach-body"></div>
      <div class="draw-attach-foot">
        <button class="draw-attach-cancel" type="button" data-attach-close>Abbrechen</button>
        <button class="draw-attach-insert" type="button" data-attach-insert>Einfügen</button>
      </div>
    </div>`;
  dom.device.appendChild(root);
  root.addEventListener("click", onClick);
  root.addEventListener("dblclick", (event) => {
    const tile = event.target.closest("[data-attach-pick]");
    if (tile) insertPicked([Number(tile.dataset.attachPick)]);
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-attach-input]")) takeFiles(event.target.files);
  });
  root.addEventListener("dragover", (event) => {
    const drop = event.target.closest("[data-attach-drop]");
    if (!drop) return;
    event.preventDefault();
    drop.classList.add("is-over");
  });
  root.addEventListener("dragleave", (event) => {
    const drop = event.target.closest("[data-attach-drop]");
    if (drop && !drop.contains(event.relatedTarget)) drop.classList.remove("is-over");
  });
  root.addEventListener("drop", (event) => {
    if (!event.target.closest("[data-attach-drop]")) return;
    event.preventDefault();
    takeFiles(event.dataTransfer.files);
  });
  on(events.viewWillChange, closeAttach);
  /* Escape schließt hier, bevor die Tasten der Desktop-Fassung die Seite verlassen */
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || root.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      closeAttach();
    },
    true
  );
}

/** Das Fenster öffnen — mit „Medien“, solange es dort Bilder gibt, sonst mit „Eigene Dateien“. */
export function openAttach() {
  if (!root) build();
  picked = [];
  tab = images().length ? "media" : "files";
  render();
  root.hidden = false;
  root.querySelector(".draw-attach-tab.is-active").focus();
}
