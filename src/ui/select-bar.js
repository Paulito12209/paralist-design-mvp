/*
 * Die beiden Leisten des Auswahlmodus (src/ui/selection.js), gemeinsam für
 * die Aufgaben-Seite und alle Sammlungen:
 *
 * - die Zählzeile an der Stelle der Pillen: ✕ beendet die Auswahl, in der
 *   Mitte „3 ausgewählt“, rechts „Alle“ bzw. „Keine“,
 * - die Aktionsleiste an der Stelle der Navigation: je Seite eigene Knöpfe
 *   (Icon über dem Wort), am Desktop eine schwebende Glaspille.
 *
 * Solange nichts gewählt ist, sind die Knöpfe blass und tun nichts; ein
 * Knopf, der zur Auswahl nicht passt (Ablegen bei einem Arbeitsbereich),
 * ebenso.
 * Pfad: src/ui/select-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * labels -> Texte der Zählzeile
 *
 * Aussehen: styles/tasks-select.css (.select-row, .select-bar, .select-act).
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";

const labels = {
  none: "Auswählen",
  picked: "ausgewählt",
  all: "Alle",
  clear: "Keine",
  exit: "Auswahl beenden",
};

/** Die Zählzeile; den Text setzt updateSelectRow. */
export function selectRowMarkup() {
  return `
    <div class="tab-pills-row select-row">
      <button class="select-exit" type="button" data-select-exit aria-label="${labels.exit}" title="${labels.exit} (Esc)">
        ${icon("close")}
      </button>
      <span class="select-count" data-select-count aria-live="polite"></span>
      <button class="select-all" type="button" data-select-all></button>
    </div>
  `;
}

/**
 * Text der Zählzeile in `root` setzen.
 * @param count wie viele gewählt sind
 * @param extra Zusatz hinter der Zahl, z.B. „2 Spalten“
 * @param none  was ohne Auswahl dasteht
 * @param allPicked true: rechts steht „Keine“
 */
export function updateSelectRow(root, { count, extra = "", none = labels.none, allPicked }) {
  const text = root.querySelector("[data-select-count]");
  if (text) text.textContent = count ? `${count} ${labels.picked}${extra ? ` · ${extra}` : ""}` : none;
  const all = root.querySelector("[data-select-all]");
  if (all) all.textContent = allPicked ? labels.clear : labels.all;
}

/**
 * Eine Aktionsleiste anlegen; sie hängt versteckt an der Stelle der
 * Navigation, bis update(true) sie zeigt.
 * @param name     Vorlesename der Leiste
 * @param actions  [{ id, icon, label }] von links nach rechts
 * @param onAction (id, knopf) — ein Tipp auf einen wachen Knopf
 */
export function createSelectBar(name, actions, onAction) {
  const bar = document.createElement("div");
  bar.className = "select-bar";
  bar.hidden = true;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", name);
  bar.innerHTML = actions
    .map(
      (action) => `
      <button class="select-act" type="button" data-select-act="${action.id}">
        <span class="select-act-icon">${icon(action.icon)}</span>
        <span class="select-act-label">${escapeHtml(action.label)}</span>
      </button>`
    )
    .join("");
  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-act]");
    if (button && !button.disabled) onAction(button.dataset.selectAct, button);
  });
  /* An die Stelle der Navigation: im selben Behälter, direkt davor */
  dom.navShell.before(bar);

  return {
    /**
     * Zeigen oder verstecken und die Knöpfe auf den Stand bringen.
     * @param disabled (id) -> true, wenn der Knopf gerade nichts tun kann
     * @param shown    (action) -> { icon, label } — erlaubt „Archivieren“ ↔ „Zurückholen“
     */
    update(on, { disabled = () => false, shown = (action) => action } = {}) {
      bar.hidden = !on;
      if (!on) return;
      actions.forEach((action) => {
        const button = bar.querySelector(`[data-select-act="${action.id}"]`);
        const look = shown(action);
        button.disabled = disabled(action.id);
        button.querySelector(".select-act-icon").innerHTML = icon(look.icon);
        button.querySelector(".select-act-label").textContent = look.label;
      });
    },
  };
}
