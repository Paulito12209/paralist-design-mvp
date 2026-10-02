/*
 * Zeilen im Board der Aufgaben verschieben. Das Ziehen selbst (Griff,
 * Lücke, Mitrollen am Rand) steht in src/ui/board-drag.js und ist mit dem
 * Board der Projekte geteilt; hier steht nur, was beim Ablegen gespeichert
 * wird: die Aufgabe bekommt den Wert der Zielspalte und eine Sortiernummer
 * zwischen ihren neuen Nachbarn.
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

import { dom } from "../../core/dom.js";
import { restoreSnapshot, snapshotEntries } from "../../data/mutations-bulk.js";
import { moveTask, moveTasks } from "../../data/mutations-tasks.js";
import { findEntry } from "../../data/queries.js";
import { saveState } from "../../data/state.js";
import { activeTaskView } from "../../data/task-views.js";
import { consumeDragClick, initBoardDrag } from "../../ui/board-drag.js";
import { showToast } from "../../ui/toast.js";
import { isPicked, isSelecting } from "./tasks-pick.js";

const stackWords = { many: "Aufgaben", undo: "Rückgängig" };

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

/* Speichern, was der Zug bedeutet. */
function dropTasks({ card, stack, box, siblings, index }) {
  const above = entryOfCard(siblings[index - 1]);
  const below = entryOfCard(siblings[index + 1]);
  /* Von Hand gezogen heißt: diese Reihenfolge soll gelten. Sie lebt in der
     Sortierung „Erstellt“ — steht die Seite auf Fällig oder Titel, wechselt
     sie dafür zurück. Absteigend gezeigt ist die Zeile darüber die spätere. */
  const view = activeTaskView();
  if (view.sort !== "erstellt") {
    view.sort = "erstellt";
    saveState();
  }
  const [before, after] = view.sortAsc ? [above, below] : [below, above];
  if (stack.length > 1) dropStack(stack, box, before, after, view.sortAsc);
  else moveTask(entryOfCard(card), box.dataset.field, box.dataset.drop, before, after);
}

/**
 * Das Ziehen im Board aktivieren.
 * @param redraw zeichnet das Board nach dem Ablegen neu.
 */
export function initTaskDrag(redraw) {
  initBoardDrag({ hosts: [dom.tasksBody], redraw, drop: dropTasks, pick: { isSelecting, isPicked } });
}
