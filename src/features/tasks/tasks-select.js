/*
 * Der Auswahlmodus der Aufgaben-Seite — in der Liste wie im Board:
 *
 * - An: „Auswählen“ oben im Menü einer Zeile (gedrückt halten oder
 *   Rechtsklick), am Desktop auch Cmd- bzw. Strg-Klick auf eine Zeile.
 * - Im Modus: ein Tipp irgendwo auf die Zeile wählt an oder ab; der Haken
 *   hakt nicht ab, nichts öffnet sich, nichts wischt. Der Kreis im Kopf einer
 *   Gruppe bzw. Spalte wählt sie ganz. Wer den Finger über die Kreise zieht,
 *   wählt die ganze Strecke. Shift-Klick wählt von der zuletzt getippten bis
 *   hierher, Cmd-A bzw. Strg-A alles, was zu sehen ist.
 * - Aus: ✕, Escape, der Zurück-Pfeil des Browsers (der Modus hat einen
 *   eigenen Verlaufsschritt wie ein Blatt), ein Wechsel der Seite — und jede
 *   Aktion, die Zeilen aus der Liste nimmt.
 *
 * Neu gezeichnet wird nur beim An- und Ausschalten; ein einzelner Tipp setzt
 * nur Klassen an den betroffenen Zeilen (syncMarks).
 * Pfad: src/features/tasks/tasks-select.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * selectLabel -> Beschriftung von „Auswählen“ im Menü einer Zeile
 * selectIcon  -> Icon davor
 *
 * Aussehen: styles/tasks-select.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { setEntryMenuLead } from "../../ui/entry-menu.js";
import { addPopGuard } from "../../ui/router-restore.js";
import { isViewActive } from "../../ui/views.js";
import { isPicked, isSelecting, keepPicked, pickedCount, setPicked, setSelecting } from "./tasks-pick.js";
import { initSelectActions } from "./tasks-select-actions.js";
import { updateSelectBars } from "./tasks-select-bar.js";

const selectLabel = "Auswählen";
const selectIcon = "checklist";

/* Die Seite neu zeichnen — kommt aus tasks.js herein, damit sich die Dateien nicht gegenseitig laden. */
let redraw = () => {};
/* Zuletzt getippte Zeile: Anfang für Shift-Klick */
let anchorId = null;
/* Finger zieht über die Kreise: { on } ist, was jede überstrichene Zeile bekommt */
let paint = null;
/* Nach dem Ziehen über die Kreise kommt noch ein Klick — der darf nicht zurückschalten */
let paintedClick = false;
/* Der Modus hat seinen Verlaufsschritt gerade selbst verbraucht: der folgende Schritt zurück bleibt still */
let ownPop = false;

function rows() {
  return [...dom.tasksBody.querySelectorAll("[data-pick-row]")];
}

/** Kreise, Zeilen, Gruppenköpfe und beide Leisten auf den Stand bringen — ohne neu zu zeichnen. */
export function syncMarks() {
  const selecting = isSelecting();
  rows().forEach((row) => {
    const on = selecting && isPicked(row.dataset.pickRow);
    row.toggleAttribute("data-picked", on);
    row.querySelector(".task-pick")?.classList.toggle("is-on", on);
  });
  dom.tasksBody.querySelectorAll("[data-pick-group]").forEach((mark) => {
    const group = [...mark.closest(".task-section, .board-col").querySelectorAll("[data-pick-row]")];
    const count = group.filter((row) => isPicked(row.dataset.pickRow)).length;
    mark.classList.toggle("is-on", count > 0 && count === group.length);
    mark.classList.toggle("is-part", count > 0 && count < group.length);
  });
  updateSelectBars(selecting);
}

/** Nach jedem Zeichnen: nur behalten, was noch zu sehen ist, und die Leisten auffrischen. */
export function afterSelectRender() {
  const selecting = isSelecting();
  dom.tasksBody.toggleAttribute("data-selecting", selecting);
  document.body.classList.toggle("is-selecting", selecting);
  if (selecting) keepPicked(rows().map((row) => row.dataset.pickRow));
  syncMarks();
}

/** Den Modus einschalten, optional gleich mit einer gewählten Aufgabe. */
export function enterSelection(id = null) {
  if (!isSelecting()) {
    setSelecting(true);
    /* Eigener Verlaufsschritt: Browser-Zurück beendet die Auswahl statt die Seite zu verlassen */
    history.pushState({ ...(history.state || { view: "tasks" }), select: true }, "");
  }
  if (id != null) {
    setPicked(id, true);
    anchorId = String(id);
  }
  redraw();
}

/**
 * Den Modus beenden. `fromHistory`: der Verlaufsschritt ist schon weg
 * (Browser-Zurück); sonst wird er hier verbraucht, damit Zurück danach die
 * Seite verlässt und nicht nur eine leere Auswahl schließt.
 */
export function exitSelection({ fromHistory = false } = {}) {
  if (!isSelecting()) return;
  setSelecting(false);
  anchorId = null;
  paint = null;
  if (!fromHistory && history.state?.select) {
    ownPop = true;
    history.back();
  }
  if (isViewActive("tasks")) redraw();
  else afterSelectRender();
}

/* Nach einer Aktion, die Zeilen stehen lässt: war das die letzte sichtbare, endet die Auswahl. */
function settle() {
  if (isSelecting() && !pickedCount()) exitSelection();
  else syncMarks();
}

/* Eine Zeile an- oder abwählen; mit Shift die ganze Strecke seit der letzten. */
function toggleRow(row, range) {
  const id = row.dataset.pickRow;
  const on = !isPicked(id);
  const list = rows().map((item) => item.dataset.pickRow);
  if (range && anchorId && list.includes(anchorId)) {
    const [from, to] = [list.indexOf(anchorId), list.indexOf(id)].sort((a, b) => a - b);
    list.slice(from, to + 1).forEach((item) => setPicked(item, true));
  } else setPicked(id, on);
  anchorId = id;
  syncMarks();
}

/* Kreis im Kopf: ist die Gruppe schon ganz gewählt, wird sie abgewählt, sonst ganz gewählt. */
function toggleGroup(mark) {
  const group = [...mark.closest(".task-section, .board-col").querySelectorAll("[data-pick-row]")];
  const all = group.every((row) => isPicked(row.dataset.pickRow));
  group.forEach((row) => setPicked(row.dataset.pickRow, !all));
  syncMarks();
}

/** „Alle“ bzw. „Keine“ in der Zählzeile. */
export function toggleAllRows() {
  const list = rows();
  const all = list.length > 0 && list.every((row) => isPicked(row.dataset.pickRow));
  list.forEach((row) => setPicked(row.dataset.pickRow, !all));
  syncMarks();
}

/**
 * Klicks im Inhalt, bevor Liste und Board sie bekommen. Gibt `true` zurück,
 * wenn der Klick zur Auswahl gehörte — dann tut er sonst nichts.
 */
export function handleSelectClick(event) {
  const row = event.target.closest("[data-pick-row]");
  if (!isSelecting()) {
    /* Cmd- bzw. Strg-Klick auf eine Zeile beginnt die Auswahl mit ihr */
    if (!row || !(event.metaKey || event.ctrlKey) || event.target.closest("[data-grip]")) return false;
    event.preventDefault();
    event.stopPropagation();
    enterSelection(row.dataset.pickRow);
    return true;
  }
  event.preventDefault();
  event.stopPropagation();
  if (paintedClick) {
    paintedClick = false;
    return true;
  }
  const group = event.target.closest("[data-pick-group]");
  if (group) toggleGroup(group);
  else if (row && !event.target.closest("[data-grip]")) toggleRow(row, event.shiftKey);
  return true;
}

/* Über die Kreise ziehen: die erste Zeile legt fest, ob gewählt oder abgewählt wird. */
function onPaintStart(event) {
  const mark = isSelecting() && event.target.closest("[data-pick]");
  if (!mark || !event.isPrimary) return;
  paintedClick = false;
  const id = mark.dataset.pick;
  paint = { on: !isPicked(id), last: id, moved: false, pointerId: event.pointerId };
}

function onPaintMove(event) {
  if (!paint || event.pointerId !== paint.pointerId) return;
  const row = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-pick-row]");
  if (!row || row.dataset.pickRow === paint.last) return;
  if (!paint.moved) setPicked(paint.last, paint.on);
  paint.moved = true;
  paint.last = row.dataset.pickRow;
  setPicked(paint.last, paint.on);
  syncMarks();
}

function onPaintEnd() {
  if (paint?.moved) paintedClick = true;
  paint = null;
}

/* Tastatur am Desktop: Escape beendet, Cmd-A bzw. Strg-A wählt alles. Nicht, solange ein Blatt oder Menü offen ist. */
function onKey(event) {
  if (!isSelecting() || !isViewActive("tasks")) return;
  if (!dom.sheet.hidden || !dom.ctxMenu.hidden) return;
  /* Escape während eines Zuges im Board bricht nur den Zug ab (src/features/tasks/tasks-drag.js) */
  if (document.body.classList.contains("is-dragging-task")) return;
  if (event.target.closest?.("input, textarea, [contenteditable]")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    exitSelection();
  } else if (event.key.toLowerCase() === "a" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    const list = rows();
    list.forEach((row) => setPicked(row.dataset.pickRow, true));
    syncMarks();
  }
}

/**
 * Einmal beim Laden der Aufgaben-Seite anmelden.
 * @param draw zeichnet die ganze Seite neu (renderTasks aus tasks.js).
 */
export function initTaskSelect(draw) {
  redraw = draw;
  initSelectActions({ exit: () => exitSelection(), settle });

  /* „Auswählen“ oben im Menü einer Zeile — nur für Aufgaben auf dieser Seite */
  setEntryMenuLead((entry, row) =>
    entry.type === "aufgabe" && row.closest("#tasks-body")
      ? [{ label: selectLabel, icon: selectIcon, onSelect: () => enterSelection(entry.id) }]
      : []
  );

  /* Im Modus gehört der Rechtsklick der Auswahl, nicht dem Menü der Zeile */
  dom.tasksBody.addEventListener("contextmenu", (event) => {
    if (!isSelecting()) return;
    event.preventDefault();
    event.stopPropagation();
  });
  dom.tasksTools.addEventListener("click", (event) => {
    if (event.target.closest("[data-select-exit]")) exitSelection();
    else if (event.target.closest("[data-select-all]")) toggleAllRows();
  });

  dom.tasksBody.addEventListener("pointerdown", onPaintStart);
  window.addEventListener("pointermove", onPaintMove);
  window.addEventListener("pointerup", onPaintEnd);
  window.addEventListener("pointercancel", onPaintEnd);
  /* Aufnahmephase: läuft vor dem Zuhörer des Ziehens, der die Klasse is-dragging-task gleich wegnimmt */
  window.addEventListener("keydown", onKey, true);

  /* Den eigenen Schritt zurück nicht als Seitenwechsel behandeln — sonst
     schlösse er die Meldung mit „Rückgängig“ gleich wieder */
  addPopGuard(() => {
    if (!ownPop) return false;
    ownPop = false;
    return true;
  });
  /* Browser-Zurück aus dem Modus: der Verlaufsschritt ist schon verbraucht */
  window.addEventListener("popstate", (event) => {
    if (isSelecting() && !event.state?.select) exitSelection({ fromHistory: true });
  });
  /* Eine andere Seite geht auf: die Auswahl gehört zu dieser und endet */
  on(events.viewOpened, (name) => {
    if (name !== "tasks") exitSelection({ fromHistory: true });
  });
}
