/*
 * Die Leiste über der Bildschirmtastatur beim Schreiben im Inhalt einer
 * Notiz, wie bei Notion — nur auf Touch-Geräten, wo ein Feld die Tastatur
 * öffnet. Links das Plus und die Icons aller Bausteine (Text, Stichpunkte,
 * Nummerierte Liste, Checkbox, Trennlinie, Standort, Video, Web-Lesezeichen),
 * rechts hinter einem Strich ein Knopf, der die Tastatur schließt.
 *
 * - Ein Icon wandelt die Zeile mit dem Cursor um (Stichpunkt auf Stichpunkt
 *   macht wieder Text); Trennlinie und Karten kommen als eigene Zeile dazu.
 *   Die Tastatur bleibt dabei offen.
 * - Das Plus — und ebenso ein getipptes „/“ (src/ui/slash-menu.js) — schließt
 *   die Tastatur und legt an ihre Stelle die Auswahl mit allen Bausteinen in
 *   Gruppen. Sie bleibt stehen, bis man etwas wählt; dann schließt sie ganz,
 *   und der Cursor steht im neuen Baustein. Rechts steht solange ✕: es
 *   schließt nur die Auswahl, die Tastatur kommt zurück, der Cursor steht
 *   wieder dort, wo er war.
 * - Ein Tipp neben Leiste und Auswahl schließt die Auswahl ebenfalls.
 * - In der Adresse einer neuen Karte (Standort, Video, Lesezeichen) steht nur
 *   „Tastatur schließen“ — dort gibt es nichts umzuwandeln.
 *
 * Die Leiste liegt über der Seite statt in ihr: sie schiebt nichts, und die
 * Karte „Details“ bleibt beim Öffnen und Schließen der Auswahl, wo sie war
 * (die Navigation tritt nur unsichtbar zurück, styles/navigation.css).
 * Verdeckt die Leiste die Zeile mit dem Cursor, rollt die Seite gerade so weit,
 * dass die Zeile darüber steht.
 * Pfad: src/ui/block-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TOUCH_QUERY  -> auf welchen Geräten die Leiste erscheint (wie in styles/navigation.css)
 * LINE_ROOM_PX -> so viel Luft bleibt mindestens zwischen der Zeile mit dem Cursor und der Leiste
 * pickLabel / hideKeyboardLabel / closePickerLabel -> Namen der Knöpfe für Vorlesehilfen
 * Welche Bausteine in Leiste und Auswahl stehen: blockGroups in src/ui/block-choices.js.
 *
 * Aussehen in styles/block-bar.css, die Kacheln der Auswahl in styles/slash-menu.css.
 */

import { events, on } from "../core/bus.js";
import { caretOffset } from "../core/caret.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { allChoices, applyChoice, blockGroups, choicesMarkup } from "./block-choices.js";

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";
const LINE_ROOM_PX = 8;
const pickLabel = "Baustein einfügen";
const hideKeyboardLabel = "Tastatur schließen";
const closePickerLabel = "Auswahl schließen";

let touch = null;
/* Die Leiste mit der Auswahl darunter, beide in einem Rahmen am unteren Rand */
let dock = null;
let endBtn = null;
let panel = null;
/* Der Editor, in dem zuletzt geschrieben wurde */
let current = null;
/* Offene Auswahl: Editor, Zeile, Cursorstelle und — nach einem getippten „/“ —
   dessen Stelle (start), damit es beim Wählen wegfällt. null: Auswahl zu. */
let picking = null;

/* Das Feld im aktuellen Editor mit dem Cursor: eine Zeile (.nb-edit) oder die
   Adresse einer neuen Karte (.nb-url), sonst null */
function focusedField() {
  const active = document.activeElement;
  return current && active?.matches(".nb-edit, .nb-url") && current.root.contains(active) ? active : null;
}

/* Nur eine Zeile mit Text lässt sich umwandeln */
function writingField() {
  const field = focusedField();
  return field?.classList.contains("nb-edit") ? field : null;
}

/** Steht die Leiste gerade über der Tastatur? (Dann öffnet „/“ ihre Auswahl.) */
export function barShown() {
  return Boolean(dock && !dock.hidden);
}

/* Leiste und Auswahl dem Zustand anpassen: zu sehen beim Schreiben und bei offener Auswahl */
function update() {
  const show = Boolean(touch.matches && (picking || focusedField()));
  dock.hidden = !show;
  dock.classList.toggle("is-picking", Boolean(picking));
  /* In der Adresse einer Karte gibt es nichts umzuwandeln: nur „Tastatur schließen“ */
  dock.classList.toggle("is-link", show && !picking && !writingField());
  panel.hidden = !picking;
  /* Klasse auf body: die Navigation tritt zurück, auch während die Tastatur
     für die Auswahl zu ist (styles/navigation.css) */
  document.body.classList.toggle("is-block-bar", show);
  const label = picking ? closePickerLabel : hideKeyboardLabel;
  if (endBtn.dataset.state !== label) {
    endBtn.dataset.state = label;
    endBtn.setAttribute("aria-label", label);
    endBtn.innerHTML = icon(picking ? "close" : "keyboard-down");
  }
}

/*
 * Steht die Zeile unter der Leiste, die Seite so weit rollen, dass sie gerade
 * darüber steht. Nur rollen, nie die Lage von etwas ändern.
 */
function keepLineVisible(node) {
  if (!node || dock.hidden) return;
  const hidden = node.getBoundingClientRect().bottom + LINE_ROOM_PX - dock.getBoundingClientRect().top;
  if (hidden > 0) dom.content.scrollBy({ top: hidden });
}

/**
 * Die Auswahl an Stelle der Tastatur öffnen. start ist die Stelle eines eben
 * getippten „/“ (fällt beim Wählen weg), sonst null.
 */
export function openPicker({ start = null } = {}) {
  const field = writingField();
  if (!field) return;
  const ed = current;
  picking = { ed, index: ed.indexOf(field), caret: caretOffset(field), start };
  panel.innerHTML = choicesMarkup(blockGroups);
  panel.scrollTop = 0;
  update();
  /* Tastatur zu: die Auswahl steht an ihrer Stelle */
  field.blur();
  requestAnimationFrame(() => keepLineVisible(ed.nodeAt(picking?.index)));
}

/* Auswahl schließen; mit refocus kommt die Tastatur zurück und der Cursor steht, wo er war */
function closePicker(refocus) {
  if (!picking) return;
  const { ed, index, caret } = picking;
  picking = null;
  update();
  if (refocus) ed.focusBlock(index, Math.max(0, caret));
}

/* Ein Baustein wurde gewählt — aus der Auswahl oder direkt in der Leiste */
function choose(kind) {
  if (picking) {
    const { ed, index, caret, start } = picking;
    picking = null;
    update();
    applyChoice(ed, index, kind, { cut: start === null ? null : { start, length: 1 }, caret });
    return;
  }
  const field = writingField();
  if (!field) return;
  applyChoice(current, current.indexOf(field), kind, { caret: caretOffset(field) });
}

function buildDock() {
  touch = window.matchMedia(TOUCH_QUERY);
  dock = document.createElement("div");
  dock.className = "block-dock";
  dock.hidden = true;
  /* Tippen in Leiste oder Auswahl nimmt der Zeile nicht den Cursor und
     schließt nicht die Tastatur (mousedown setzt den Fokus) */
  dock.addEventListener("mousedown", (event) => event.preventDefault());
  const choices = allChoices
    .map((item, index) => `<button class="block-bar-btn" type="button" data-choice="${index}" aria-label="${escapeHtml(item.label)}">${icon(item.icon)}</button>`)
    .join("");
  dock.innerHTML = `<div class="block-bar" role="toolbar" aria-label="Bausteine"><div class="block-bar-row"><button class="block-bar-btn block-bar-pick" type="button" data-bar="pick" aria-label="${pickLabel}">${icon("plus")}</button>${choices}</div><button class="block-bar-btn block-bar-end" type="button" data-bar="end"></button></div><div class="block-picker" role="listbox" aria-label="Bausteine" hidden></div>`;
  endBtn = dock.querySelector(".block-bar-end");
  panel = dock.querySelector(".block-picker");

  dock.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.choice) {
      choose(allChoices[Number(button.dataset.choice)].kind);
      return;
    }
    if (button.dataset.bar === "pick") {
      if (picking) closePicker(true);
      else openPicker();
      return;
    }
    if (button.dataset.bar === "end") {
      if (picking) closePicker(true);
      else focusedField()?.blur();
    }
  });
  dom.device.append(dock);

  document.addEventListener("focusin", () => {
    /* Der Finger ist zurück im Text (oder in einem anderen Feld): die Tastatur kommt, die Auswahl geht */
    if (picking) picking = null;
    update();
  });
  /* focusout: wohin der Fokus geht, steht erst danach fest */
  document.addEventListener("focusout", () => setTimeout(update));
  /* Ein Tipp neben Leiste und Auswahl schließt die Auswahl */
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (picking && !dock.contains(event.target)) closePicker(false);
    },
    true
  );
  on(events.viewWillChange, () => closePicker(false));
  on(events.overlayOpened, () => closePicker(false));
  /* Tastatur da: die Zeile mit dem Cursor über die Leiste holen */
  on(events.keyboardOpened, () => keepLineVisible(focusedField()?.closest(".nb")));
  touch.addEventListener("change", update);
}

/** Einen Baustein-Editor anmelden (src/ui/block-editor.js). */
export function attachBlockBar(ed) {
  if (!dock) buildDock();
  ed.root.addEventListener("focusin", () => {
    current = ed;
    update();
  });
  /* Beim Tippen am unteren Rand: die Zeile nicht unter die Leiste rutschen lassen */
  ed.root.addEventListener("input", (event) => {
    if (barShown()) keepLineVisible(event.target.closest(".nb"));
  });
}
