/*
 * Zeilen im Board der Aufgaben verschieben. Das Ziehen selbst (Griff,
 * Lücke, Mitrollen am Rand) steht in src/ui/board-drag.js und ist mit dem
 * Board der Projekte geteilt; hier steht nur, was beim Ablegen gespeichert
 * wird: die Aufgabe bekommt den Wert der Zielspalte und eine Sortiernummer
 * zwischen ihren neuen Nachbarn.
 *
 * In der Liste (Android) verschiebt gedrückt Halten eine Zeile innerhalb
 * ihrer Gruppe (src/ui/row-reorder.js); gespeichert wird dieselbe
 * Sortiernummer wie im Board, nur der Wert der Gruppe bleibt.
 *
 * Im Auswahlmodus zieht der Griff einer gewählten Zeile alle gewählten
 * mit: Loslassen gibt allen den Wert der Zielspalte, in ihrer bisherigen
 * Reihenfolge an der Stelle der Lücke — mit „Rückgängig“ in der Meldung.
 * Pfad: src/features/tasks/tasks-drag.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * stackWords -> Texte der Meldung nach dem Ablegen eines Stapels
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { restoreSnapshot, snapshotEntries } from "../../data/mutations-bulk.js";
import { moveTask, moveTasks, reorderTask } from "../../data/mutations-tasks.js";
import { findEntry } from "../../data/queries.js";
import { saveState } from "../../data/state.js";
import { activeTaskView } from "../../data/task-views.js";
import { consumeDragClick, initBoardDrag } from "../../ui/board-drag.js";
import { setReorderSaver } from "../../ui/row-reorder.js";
import { showToast } from "../../ui/toast.js";
import { isPicked, isSelecting } from "./tasks-pick.js";

const stackWords = { many: "Aufgaben", undo: "Rückgängig" };
/** Schlüssel der Liste (data-reorder in src/features/tasks/tasks-list.js). */
export const listScope = "tasks";

export { consumeDragClick };

/* Der Eintrag zu einer Zeile im Board. */
function entryOfCard(card) {
  return card ? findEntry(card.dataset.boardRow) : null;
}

/*
 * Einen Stapel ablegen: alle bekommen den Wert der Zielspalte und stehen in
 * ihrer bisherigen Reihenfolge an der Stelle der Lücke. Absteigend gezeigt
 * steht die oberste Zeile mit der höchsten Sortiernummer — deshalb umgedreht.
 */
function dropStack(stack, box, before, after, ascending) {
  const entries = stack.map(entryOfCard).filter(Boolean);
  const snap = snapshotEntries(entries);
  moveTasks(ascending ? entries : [...entries].reverse(), box.dataset.field, box.dataset.drop, before, after);
  const column = box.closest(".board-col")?.querySelector(".board-head-name")?.textContent || "";
  showToast({
    icon: "board",
    title: `${entries.length} ${stackWords.many} → ${column}`,
    action: { label: stackWords.undo, icon: "undo", onSelect: () => restoreSnapshot(snap) },
  });
}

/*
 * Von Hand gezogen heißt: diese Reihenfolge soll gelten. Sie lebt in der
 * Sortierung „Erstellt“ — steht die Seite auf Fällig oder Titel, wechselt
 * sie dafür zurück. Absteigend gezeigt ist die Zeile darüber die spätere.
 * Liefert die Nachbarn in Reihenfolge der Sortiernummer.
 */
function neighbours(above, below) {
  const view = activeTaskView();
  if (view.sort !== "erstellt") {
    view.sort = "erstellt";
    saveState();
  }
  return { asc: view.sortAsc, pair: view.sortAsc ? [above, below] : [below, above] };
}

/* Speichern, was der Zug im Board bedeutet. */
function dropTasks({ card, stack, box, siblings, index }) {
  const { asc, pair } = neighbours(entryOfCard(siblings[index - 1]), entryOfCard(siblings[index + 1]));
  const [before, after] = pair;
  if (stack.length > 1) dropStack(stack, box, before, after, asc);
  else moveTask(entryOfCard(card), box.dataset.field, box.dataset.drop, before, after);
}

/* Die Aufgabe einer Zeile der Liste (.swipe mit data-entry). */
const entryOfRow = (wrap) => (wrap?.classList.contains("swipe") ? findEntry(wrap.dataset.entry) : null);

/* In der Liste verschoben: die Nachbarn sind die Zeilen darüber und darunter in derselben Gruppe. */
function saveListOrder(wrap) {
  const entry = findEntry(wrap.dataset.entry);
  if (!entry) return;
  const { pair } = neighbours(entryOfRow(wrap.previousElementSibling), entryOfRow(wrap.nextElementSibling));
  reorderTask(entry, ...pair);
  emit(events.dataChanged);
}

/**
 * Das Ziehen im Board aktivieren.
 * @param redraw zeichnet das Board nach dem Ablegen neu.
 */
export function initTaskDrag(redraw) {
  initBoardDrag({ hosts: [dom.tasksBody], redraw, drop: dropTasks, pick: { isSelecting, isPicked } });
  setReorderSaver(listScope, saveListOrder);
}
