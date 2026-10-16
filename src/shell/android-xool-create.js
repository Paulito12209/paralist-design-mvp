/*
 * „Android (Xool-DB)“: das Blatt, das das Plus in der Leiste öffnet. Statt der
 * Spalte mit Knöpfen („Neu“ in „Android“) ein Blatt von unten nach dem
 * Vorbild von „Erstellen“ in Spotify: Abschnitte mit einer Überschrift und
 * darunter Chips. Ganz unten, am Daumen, steht „Schnell erfassen“ (Aufgabe,
 * Notiz, Termin), darüber Ressourcen, Medien, PARA und ganz oben Lernen.
 * Ein Chip schließt das Blatt und öffnet das Eingabefeld mit dieser Art
 * (src/shell/create-menu.js, createFromMenu). Lernen (Karteikarte, Kartendeck)
 * gibt es im MVP noch nicht: die Chips stehen da, sind aber abgeblendet.
 * Pfad: src/shell/android-xool-create.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sections -> die Abschnitte von oben nach unten: Überschrift und Chips
 *             (type = Art aus src/data/config.js, label = Name auf dem Chip,
 *             soon = noch nicht verfügbar)
 *
 * Maße und Farben: styles/android-xool-create.css, Werte in styles/tokens-android-dark.css.
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { typeIcon } from "../data/config.js";
import { registerOverlay } from "../ui/router.js";
import { isMobileVariant } from "../ui/platform.js";
import { events, on } from "../core/bus.js";
import { showBars } from "./android-bars.js";
import { createFromMenu } from "./create-menu.js";

const sections = [
  {
    title: "Lernen",
    chips: [
      { type: "karteikarte", label: "Karteikarte", icon: "note", soon: true },
      { type: "kartendeck", label: "Kartendeck", icon: "layers", soon: true },
    ],
  },
  {
    title: "PARA",
    chips: [
      { type: "projekt", label: "Projekt" },
      { type: "arbeitsbereich", label: "Arbeitsbereich", icon: "layers" },
    ],
  },
  { title: "Medien", chips: [{ type: "medien", label: "Medium" }] },
  {
    title: "Ressourcen",
    chips: [
      { type: "dokument", label: "Dokument" },
      { type: "zeichnung", label: "Zeichnung" },
      { type: "lesezeichen", label: "Lesezeichen" },
    ],
  },
  {
    title: "Schnell erfassen",
    chips: [
      { type: "aufgabe", label: "Aufgabe" },
      { type: "notiz", label: "Notiz" },
      { type: "termin", label: "Termin" },
    ],
  },
];

let layer = null;

function chipMarkup(chip) {
  const name = chip.icon || typeIcon(chip.type);
  const attrs = chip.soon ? 'disabled aria-label="' + escapeHtml(chip.label) + ', demnächst"' : `data-xo-create="${chip.type}"`;
  return `<button class="xo-chip" type="button" ${attrs}>${icon(name)}<span>${escapeHtml(chip.label)}</span></button>`;
}

function build() {
  const block = (section) => `
    <section class="xo-section">
      <h3 class="xo-title">${escapeHtml(section.title)}</h3>
      <div class="xo-chips">${section.chips.map(chipMarkup).join("")}</div>
    </section>`;
  const el = document.createElement("div");
  el.className = "xo-create";
  el.hidden = true;
  el.innerHTML = `<div class="xo-sheet" role="dialog" aria-label="Neu anlegen">${sections.map(block).join("")}</div>`;
  return el;
}

/** Ist das Blatt offen? */
export function isXoolCreateOpen() {
  return Boolean(layer) && !layer.hidden;
}

/** Das Blatt schließen. */
export function closeXoolCreate() {
  if (!isXoolCreateOpen()) return;
  layer.hidden = true;
  layer.classList.remove("is-open");
  dom.device.classList.remove("is-xo-create");
  document.getElementById("tab-add")?.setAttribute("aria-expanded", "false");
}

/** Das Blatt öffnen oder schließen. */
export function toggleXoolCreate() {
  if (!isMobileVariant("xool")) return;
  if (isXoolCreateOpen()) {
    closeXoolCreate();
    return;
  }
  layer.hidden = false;
  dom.device.classList.add("is-xo-create");
  document.getElementById("tab-add")?.setAttribute("aria-expanded", "true");
  /* Erst im nächsten Bild die Klasse: sonst blendet der Schleier nicht ein */
  requestAnimationFrame(() => layer.classList.add("is-open"));
}

/** Das Blatt anlegen und anmelden. */
export function initXoolCreate() {
  layer = build();
  dom.device.append(layer);
  layer.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-xo-create]");
    if (!chip) {
      /* Schleier: zu */
      if (!event.target.closest(".xo-sheet")) closeXoolCreate();
      return;
    }
    closeXoolCreate();
    showBars();
    createFromMenu(chip.dataset.xoCreate);
  });
  on(events.viewWillChange, closeXoolCreate);
  on(events.overlayOpened, closeXoolCreate);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeXoolCreate();
  });
  /* Browser-Zurück schließt das Blatt wie jedes andere */
  registerOverlay("xool-create", { open: () => {}, hide: closeXoolCreate });
}
