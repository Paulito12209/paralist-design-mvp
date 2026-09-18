/*
 * Das kleine weiße Menü, das beim gedrückt Halten eines Tabs oder
 * Arbeitsbereichs neben dem Element aufgeht.
 * Pfad: src/ui/ctx-menu.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * edgeGap  -> Mindestabstand des Menüs zum Rand des Geräts (Pixel)
 * anchorGap -> Abstand zwischen Element und Menü (Pixel)
 *
 * Aussehen und Rundung stehen in styles/overlays.css (Klasse .ctx-card).
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";

const edgeGap = 12;
const anchorGap = 6;

let actions = [];

/** Menü schließen. */
export function closeCtxMenu() {
  dom.ctxMenu.hidden = true;
  actions = [];
}

/* Das Menü soll immer ganz sichtbar bleiben: passt es unten nicht,
   klappt es über das Element; passt es rechts nicht, rutscht es nach links. */
function placeCard(anchor) {
  const deviceRect = dom.device.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const cardRect = dom.ctxCard.getBoundingClientRect();

  let top = anchorRect.bottom - deviceRect.top + anchorGap;
  let left = anchorRect.left - deviceRect.left;
  if (left + cardRect.width > deviceRect.width - edgeGap) {
    left = Math.max(edgeGap, deviceRect.width - cardRect.width - edgeGap);
  }
  if (left < edgeGap) left = edgeGap;
  if (top + cardRect.height > deviceRect.height - edgeGap) {
    top = Math.max(edgeGap, anchorRect.top - deviceRect.top - cardRect.height - anchorGap);
  }
  /* position: absolute in styles/overlays.css — die Stelle kennt nur der Browser zur Laufzeit */
  dom.ctxCard.style.top = `${top}px`;
  dom.ctxCard.style.left = `${left}px`;
}

/** Menü neben `anchor` öffnen. Optionen sind { label, icon, onSelect, danger }. */
export function openCtxMenu(anchor, options) {
  dom.sheet.hidden = true;
  dom.ctxCard.innerHTML = options
    .map(
      (option, index) => `
        <button class="ctx-item${option.danger ? " is-danger" : ""}" type="button" data-ctx="${index}">
          ${icon(option.icon)}
          <span>${escapeHtml(option.label)}</span>
        </button>
      `
    )
    .join("");
  actions = options.map((option) => option.onSelect);
  dom.ctxMenu.hidden = false;
  placeCard(anchor);
}

/** Klicks im Menü: Option ausführen, Klick daneben schließt. */
export function initCtxMenu() {
  dom.ctxMenu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-ctx]");
    if (!option) {
      closeCtxMenu();
      return;
    }
    const run = actions[Number(option.dataset.ctx)];
    closeCtxMenu();
    if (run) run();
  });
}
