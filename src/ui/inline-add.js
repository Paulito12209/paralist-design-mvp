/*
 * Anlegen per Tipp unter den letzten Eintrag einer Liste (Android-Fassungen):
 * Steht in einer Liste etwas, gibt es darunter keine Zeile „… hinzufügen“
 * mehr — ein Tipp in die freie Fläche unter dem letzten Eintrag, bis hinunter
 * zur Leiste, legt an, was die Liste vorschlägt. Im Eingang eine Notiz, unter
 * „Zeichnungen“ eine Zeichnung, in den Arbeitsbereichen ein Arbeitsbereich.
 * Ist die Liste leer, steht dort der Platzhalter mit seiner Pille — dann gibt
 * es keine Liste, unter die man tippen könnte.
 *
 * Jede Seite meldet ihre Liste mit `addInlineList` an: `area()` gibt die
 * sichtbare Liste zurück (oder null), `open(area)` legt an — meist über
 * `openEntryRow`, die eine leere Zeile mit Icon und Cursor öffnet. Enter
 * legt an und öffnet gleich die nächste Zeile; eine leere Zeile verschwindet
 * lautlos, sobald man sie verlässt.
 *
 * Nur ein echter Tipp zählt — wer scrollt, schreibt nicht; im Auswahlmodus
 * wählt ein Tipp nur aus; ist gerade eine Tastatur offen, schließt der Tipp
 * nur sie. Projekte (src/features/overview/project-inline.js) und Aufgaben
 * (src/features/tasks/tasks-inline.js) haben ihre eigene Fassung davon.
 * Pfad: src/ui/inline-add.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TAP_SLOP_PX -> so weit darf der Finger beim Tippen wandern; wer weiter zieht,
 *                scrollt und bekommt keine neue Zeile
 *
 * Der graue Text in der leeren Zeile steht bei `sheetPlaceholders` in
 * src/data/config.js („Neue Notiz“). Aussehen: eine gewöhnliche Zeile
 * (styles/rows.css), das Feld wie bei den Aufgaben (styles/tasks.css,
 * .task-inline-input), der Einzug in styles/android-list.css (.inline-add-row).
 */

import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { noHistoryForm } from "../core/no-history.js";
import { sheetPlaceholders, typeIcon, typeSingular } from "../data/config.js";
import { isDesk } from "./desk-mode.js";
import { isMobileOs } from "./platform.js";

const TAP_SLOP_PX = 20;

/* Die angemeldeten Listen: { area, open } */
const lists = [];
/* Die offene Zeile: { row, input, box, made, onCommit, reopen } — sonst null.
   `made` heißt: der Kasten um die Zeile ist eigens für sie entstanden. */
let editing = null;
/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Solange angelegt und neu gezeichnet wird, bedeutet der Fokusverlust der alten Zeile nichts. */
let committing = false;

/** Eine Liste anmelden: `area()` -> sichtbare Liste oder null, `open(area)` -> anlegen. */
export function addInlineList(spec) {
  lists.push(spec);
}

/* Die Liste, die gerade zu sehen ist — höchstens eine. */
function visibleArea() {
  for (const spec of lists) {
    const area = spec.area();
    if (area) return { spec, area };
  }
  return null;
}

function removeRow() {
  if (!editing) return;
  const { row, box, made } = editing;
  editing = null;
  if (made) box.remove();
  else row.remove();
}

/* Abschließen: mit Titel entsteht der Eintrag (die Liste zeichnet neu, die
   Zeile ist damit weg); `chain` öffnet danach gleich die nächste Zeile. */
function commitRow(chain) {
  if (!editing || committing) return;
  const title = editing.input.value.trim();
  if (!title) {
    removeRow();
    return;
  }
  const { onCommit, reopen } = editing;
  committing = true;
  editing = null;
  onCommit(title);
  committing = false;
  if (chain && reopen) reopen();
}

/* Wohin die Zeile kommt: ans Ende der Liste selbst — oder, wenn die Fläche
   aus mehreren Listen besteht (Monate, Gruppen), in einen eigenen Kasten darunter. */
function rowBox(area) {
  if (area.classList.contains("workspace-list")) return { box: area, made: false };
  const box = document.createElement("div");
  box.className = "workspace-list";
  area.append(box);
  return { box, made: true };
}

/**
 * Eine leere Zeile mit dem Icon des Typs und Cursor am Ende der Liste öffnen.
 * @param area      die Liste aus `area()`
 * @param type      Typ, der entsteht — bestimmt Icon und grauen Text
 * @param onCommit  (title) => legt an
 * @param reopen    () => öffnet nach Enter die nächste Zeile (die Liste ist dann neu gezeichnet)
 */
export function openEntryRow(area, { type, onCommit, reopen }) {
  if (editing) return;
  const placeholder = sheetPlaceholders[type] || typeSingular(type);
  const { box, made } = rowBox(area);
  const row = document.createElement("div");
  row.className = "workspace-row inline-add-row";
  /* form: gegen Chromes Verlaufs-Chips über der Tastatur (src/core/no-history.js);
     enterkeyhint: die Enter-Taste heißt „Fertig“, nicht „Weiter“;
     row-glyph: dieselbe Icon-Fläche wie in den Zeilen darüber */
  row.innerHTML = `
    <span class="row-glyph">${icon(typeIcon(type))}</span>
    <input class="task-inline-input" type="text" form="${noHistoryForm}" enterkeyhint="done"
      placeholder="${placeholder}" aria-label="${placeholder}" />`;
  box.append(row);
  const input = row.querySelector("input");
  editing = { row, input, box, made, onCommit, reopen };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRow(true);
    } else if (event.key === "Escape") {
      removeRow();
    }
  });
  input.addEventListener("blur", () => commitRow(false));
  input.focus();
}

/** Nach dem Neuzeichnen die nächste Zeile in derselben Liste öffnen. */
export function reopenIn(spec) {
  const area = spec.area();
  if (area) spec.open(area);
}

/* Schreibt man gerade irgendwo? Dann schließt ein Tipp nur die Tastatur. */
function isTyping() {
  const active = document.activeElement;
  return Boolean(active && (active.matches("input, textarea") || active.isContentEditable));
}

function onPointerDown(event) {
  down = { x: event.clientX, y: event.clientY, wasTyping: Boolean(editing) || isTyping() };
}

/* Tipp in die freie Fläche: nur unterhalb der Liste, nie auf einen Knopf. */
function onClick(event) {
  const start = down;
  down = null;
  if (!start || start.wasTyping || editing) return;
  if (!isMobileOs("android") || isDesk()) return;
  if (document.body.classList.contains("is-selecting")) return;
  if (event.target.closest("button, a, input, textarea, [data-grip], .swipe, .view-panel, .tab-pills-row")) return;
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  const hit = visibleArea();
  if (!hit || event.clientY < hit.area.getBoundingClientRect().bottom) return;
  hit.spec.open(hit.area);
}

/** Den Tipp unter die Listen einschalten — ein Empfänger am ganzen Scrollbereich:
    ist die Liste kurz, zählt auch die Fläche über Plus-Knopf und Leiste. */
export function initInlineAdd() {
  dom.content.addEventListener("pointerdown", onPointerDown);
  dom.content.addEventListener("click", onClick);
}
