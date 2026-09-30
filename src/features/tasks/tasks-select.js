/*
 * Der Auswahlmodus der Aufgaben-Seite — in der Liste wie im Board. Was jede
 * Auswahl kann (Tippen, Shift-Klick, Ziehen über die Kreise, Cmd-A, Escape,
 * Browser-Zurück, eigener Verlaufsschritt), steht in src/ui/selection.js.
 * Hier nur, was die Aufgaben-Seite dazugibt:
 *
 * - „Auswählen“ oben im Menü einer Aufgaben-Zeile (gedrückt halten oder
 *   Rechtsklick, auch im Board),
 * - an der Stelle der Pillen die Zählzeile (✕, Zahl, Alle/Keine),
 * - unten die Leiste Status · Dringlichkeit · Datum · Archivieren · Mehr
 *   (src/features/tasks/tasks-select-bar.js).
 *
 * Die Auswahl endet, sobald eine andere Ansicht aufgeht.
 * Pfad: src/features/tasks/tasks-select.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * selectLabel -> Beschriftung von „Auswählen“ im Menü einer Zeile
 * selectIcon  -> Icon davor
 *
 * Aussehen: styles/tasks-select.css.
 */

import { dom } from "../../core/dom.js";
import { addEntryMenuLead } from "../../ui/entry-menu.js";
import { taskSelection } from "./tasks-pick.js";
import { initSelectActions } from "./tasks-select-actions.js";
import { updateSelectBars } from "./tasks-select-bar.js";

const selectLabel = "Auswählen";
const selectIcon = "checklist";

/** Nach jedem Zeichnen der Seite: nur behalten, was noch zu sehen ist, Leisten auffrischen. */
export function afterSelectRender() {
  taskSelection.afterRender();
}

/** Klicks im Inhalt, bevor Liste und Board sie bekommen (Tippen wählt, Cmd-Klick beginnt). */
export function handleSelectClick(event) {
  return taskSelection.handleClick(event);
}

/**
 * Einmal beim Laden der Aufgaben-Seite anmelden.
 * @param draw zeichnet die ganze Seite neu (renderTasks aus tasks.js).
 */
export function initTaskSelect(draw) {
  taskSelection.listen({ redraw: draw, onSync: updateSelectBars });
  initSelectActions({ exit: () => taskSelection.exit(), settle: () => taskSelection.settle() });

  /* „Auswählen“ oben im Menü einer Zeile — nur für Aufgaben auf dieser Seite */
  addEntryMenuLead((entry, row) =>
    entry.type === "aufgabe" && row.closest("#tasks-body")
      ? [{ label: selectLabel, icon: selectIcon, onSelect: () => taskSelection.enter(entry.id) }]
      : []
  );

  dom.tasksTools.addEventListener("click", (event) => {
    if (event.target.closest("[data-select-exit]")) taskSelection.exit();
    else if (event.target.closest("[data-select-all]")) taskSelection.toggleAll();
  });
}
