/*
 * Sortierarten für Status und Dringlichkeit und die Sortierarten der Projekte.
 * Hier steht nur der Wortlaut — wie verglichen wird, steht je Liste in
 * src/data/collection-sorts.js (Sammlungen, Projekte) und `sortTasks` in
 * src/data/queries.js (Aufgaben).
 * Pfad: src/data/config-sorts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * statusSort    -> „Status“: Name, Icon und Wortlaut beider Richtungen („Offen zuerst“ / „Erledigt zuerst“)
 * prioritySort  -> „Dringlichkeit“: dasselbe; aufsteigend steht das Dringendste oben („Jetzt“)
 * projectSorts  -> wonach sich die Projekte sortieren lassen, samt Wortlaut beider Richtungen
 *
 * Eine Option ist { id, label, icon, up, down, asc }: `up` und `down` sind der
 * Wortlaut der beiden Richtungen im Blatt „Sortieren“ (src/ui/sort-sheet.js),
 * `asc` die Richtung, die beim Wechsel auf diese Option gilt.
 */

import { manualSort } from "./config.js";

/* Die Reihenfolge der Stufen steht in src/data/config-tasks.js (taskStatuses, docStatuses). */
export const statusSort = { id: "status", label: "Status", icon: "check-circle", up: "Offen zuerst", down: "Erledigt zuerst", asc: true };

/* Die Reihenfolge der Stufen steht in src/data/config-tasks.js (taskPriorities): „Jetzt“ ist die dringendste. */
export const prioritySort = { id: "prio", label: "Dringlichkeit", icon: "flame", up: "Dringendste zuerst", down: "Am wenigsten dringend zuerst", asc: true };

/* Die Regeln dahinter stehen in `sortProjects` in src/data/project-views.js. */
export const projectSorts = [
  { id: "name", label: "Name", icon: "text", up: "A bis Z", down: "Z bis A", asc: true },
  { id: "erstellt", label: "Erstellt", icon: "plus-circle", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geaendert", label: "Zuletzt geändert", icon: "pencil", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geoeffnet", label: "Zuletzt geöffnet", icon: "history", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  statusSort,
  prioritySort,
  { id: "eintraege", label: "Einträge", icon: "list", up: "Wenigste zuerst", down: "Meiste zuerst", asc: false },
  manualSort,
];
