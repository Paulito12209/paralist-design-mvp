/*
 * Die Regel „Erledigte zeigen“ je Ansicht der Aufgaben-Seite.
 * Pfad: src/data/task-hide-done.js
 *
 * - An (Vorgabe): eine erledigte Aufgabe bleibt in dieser Ansicht stehen,
 *   mit grünem Haken und durchgestrichen, bis Mitternacht — dann liegt sie im
 *   Archiv (src/data/task-archive.js).
 * - Aus: in dieser Ansicht gilt eine erledigte Aufgabe sofort als archiviert.
 *   Sie steht hinter „Archiv (n)“, abgehakt. Gespeichert wird dafür nichts
 *   an der Aufgabe selbst: eine andere Ansicht mit „zeigen“ führt sie
 *   weiter in ihrer Liste.
 * Maßgeblich ist die Ansicht, die gerade gewählt ist (state.activeTaskViewId).
 *
 * Keine anpassbaren visuellen Werte. Ob eine Ansicht Erledigtes zeigt,
 * steht in taskDefaults in src/data/config-tasks.js (hideDone).
 */

import { isTaskDone } from "./config-tasks.js";
import { state } from "./state.js";

/* Die gewählte Ansicht — im Zweifel die feste „Alle“ (dieselbe Regel wie in src/data/task-views.js) */
function chosenView() {
  const views = state.taskViews;
  return views.find((view) => view.id === state.activeTaskViewId) || views.find((view) => view.fixed) || views[0];
}

/**
 * Gilt diese erledigte Aufgabe in der gewählten Ansicht schon als archiviert,
 * weil die Ansicht „Erledigte zeigen“ ausgeschaltet hat?
 */
export function doneHiddenInView(entry) {
  return entry.type === "aufgabe" && !entry.archived && isTaskDone(entry) && Boolean(chosenView()?.hideDone);
}
