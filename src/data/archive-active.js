/*
 * Das Gegenstück zu „Archiv (n)“: im Archiv steht links über der Liste, wie
 * viele Dinge der gewählten Pille noch aktiv sind („Aktive Projekte (2)“).
 * Ein Tipp führt zur Liste dieser Sammlung zurück (src/features/overview/archive-active.js).
 * Hier steht nur das Zählen und Benennen — kein Zeichnen, keine Navigation.
 * Pfad: src/data/archive-active.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * allWords    -> Beschriftung und Symbol der Pille „Alle“ (dort sind es alle aktiven Einträge)
 * activePrefix -> Vorsatz vor dem Namen der Sammlung („Aktive“ + „Projekte“)
 */

import { archivePills } from "./collections.js";
import { state } from "./state.js";

const allWords = { label: "Aktive Einträge", icon: "grid" };
const activePrefix = "Aktive";

/** Alle aktiven Dinge einer Pille: Arbeitsbereiche, ein Typ oder (bei „Alle“) alles. */
export function activeCount(pill) {
  const spaces = state.workspaces.filter((workspace) => !workspace.archived).length;
  if (pill === "workspaces") return spaces;
  const entries = state.entries.filter((entry) => !entry.archived && (pill === "all" || entry.type === pill));
  return entries.length + (pill === "all" ? spaces : 0);
}

/** Beschriftung und Symbol des Knopfs für eine Pille — „Aktive Projekte“ bzw. bei „Alle“ „Aktive Einträge“. */
export function activeWords(pill) {
  if (pill === "all") return allWords;
  const found = archivePills.find((item) => item.id === pill);
  return { label: `${activePrefix} ${found?.label || ""}`.trim(), icon: found?.icon || allWords.icon };
}

/** Die Ziele des Blatts bei „Alle“: jede Pille außer „Alle“ mit Name, Symbol und Zahl der aktiven Dinge. */
export function activeGroups() {
  return archivePills
    .filter((pill) => pill.id !== "all")
    .map((pill) => ({ id: pill.id, label: pill.label, icon: pill.icon, count: activeCount(pill.id) }));
}
