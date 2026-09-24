/*
 * Die kurze Meldung über der Navigation: „Notiz erstellt“, die Punkte dafür
 * und ein Knopf, der die neue Seite gleich öffnet. Ohne sie bekommt man beim
 * Anlegen gar keine Rückmeldung — nur die Zahl auf einer Karte springt hoch.
 * Sie geht von selbst wieder weg.
 * Pfad: src/ui/toast.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * VISIBLE_MS -> wie lange eine Meldung stehen bleibt, bevor sie verschwindet
 *
 * Aussehen und Maße stehen in styles/toast.css (--toast-radius, --toast-gap …).
 * Die Farbe des Icons gibt der Aufrufer mit (`accent`), sonst gilt --xp-done.
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";

/* Wie lange eine Meldung stehen bleibt. Lang genug, um den Knopf zu treffen,
   kurz genug, um nicht im Weg zu stehen. */
const VISIBLE_MS = 4200;

let host = null;
let hideTimer = 0;
let onAction = null;

/*
 * Der Platz für die Meldung entsteht beim ersten Mal und bleibt dann stehen.
 * Er sitzt als erstes Kind in der unteren Leiste, also über der Navigation:
 * so wandert er mit der Tastatur mit, ohne dass hier etwas gerechnet wird.
 */
function ensureHost() {
  if (host && host.isConnected) return host;
  host = document.createElement("div");
  host.className = "toast-host";
  host.hidden = true;
  host.addEventListener("click", (event) => {
    if (!event.target.closest(".toast-action")) return;
    const run = onAction;
    hideToast();
    if (run) run();
  });
  dom.bottomBar.prepend(host);
  return host;
}

/**
 * Eine Meldung zeigen. Eine neue löst die vorherige ab.
 * @param options.icon   Name des Icons links, z.B. "check-circle".
 * @param options.title  Was passiert ist, z.B. „Notiz erstellt“.
 * @param options.note   Kleiner Zusatz daneben, z.B. „+1 XP“; leer lässt ihn weg.
 * @param options.accent Farbe des Icons, am besten eine Variable aus
 *                       styles/tokens.css. Ohne Angabe das Grün des Hakens.
 * @param options.action { label, onSelect, icon } für den Knopf rechts; ohne Angabe keiner.
 *                       `icon` ist optional, ohne Angabe der Pfeil nach oben („öffnen“).
 */
export function showToast({ icon: iconName = "check-circle", title, note = "", accent = "", action = null }) {
  const element = ensureHost();
  onAction = action ? action.onSelect : null;
  /* role="status": Sprachausgaben lesen die Meldung vor, ohne dass der Finger
     dorthin muss — sie ist ja nach vier Sekunden wieder weg. */
  element.innerHTML = `
    <div class="toast" role="status"${accent ? ` style="--toast-icon:${accent}"` : ""}>
      ${icon(iconName, "toast-icon")}
      <span class="toast-title">${escapeHtml(title)}</span>
      ${note ? `<span class="toast-note">${escapeHtml(note)}</span>` : ""}
      ${
        action
          ? `<button class="toast-action" type="button">${escapeHtml(action.label)}${icon(action.icon || "arrow-up", "toast-action-icon")}</button>`
          : ""
      }
    </div>
  `;
  element.hidden = false;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideToast, VISIBLE_MS);
}

/** Die Meldung sofort wegnehmen. */
export function hideToast() {
  clearTimeout(hideTimer);
  onAction = null;
  if (host) host.hidden = true;
}
