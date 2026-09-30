/*
 * Ein kleiner Erklär-Dialog in der Mitte des Geräts: Überschrift, ein paar
 * Sätze und „Verstanden“. Er liegt über allem, auch über einem offenen
 * Auswahl-Blatt — so erklärt das ⓘ neben einer Option (src/ui/sheet.js),
 * was sie bedeutet, ohne das Blatt zu schließen.
 * Pfad: src/ui/info-dialog.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * okLabel -> Aufschrift des Knopfs, der den Dialog schließt
 *
 * Aussehen: styles/info-dialog.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml } from "../core/html.js";

const okLabel = "Verstanden";

let root = null;

/** Den Dialog schließen. */
export function closeInfoDialog() {
  if (root) root.hidden = true;
}

/* Einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "info-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="info-dialog" role="alertdialog" aria-modal="true" aria-labelledby="info-dialog-title" aria-describedby="info-dialog-text">
      <h2 class="info-dialog-title" id="info-dialog-title"></h2>
      <p class="info-dialog-text" id="info-dialog-text"></p>
      <button class="info-dialog-ok" type="button" data-info-close>${escapeHtml(okLabel)}</button>
    </div>`;
  dom.device.appendChild(root);
  /* Der Tipp endet hier: sonst läse das Blatt darunter ihn als „daneben getippt“ */
  root.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.target === root || event.target.closest("[data-info-close]")) closeInfoDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.hidden) closeInfoDialog();
  });
  on(events.viewWillChange, closeInfoDialog);
}

/**
 * Den Dialog öffnen.
 * @param title Überschrift, z.B. „Erledigt“
 * @param text  die Erklärung in ein, zwei Sätzen
 */
export function openInfoDialog(title, text) {
  if (!root) build();
  root.querySelector(".info-dialog-title").textContent = title;
  root.querySelector(".info-dialog-text").textContent = text;
  root.hidden = false;
  root.querySelector("[data-info-close]").focus();
}
