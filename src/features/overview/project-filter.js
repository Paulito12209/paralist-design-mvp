/*
 * Das Blatt „Filtern“ der Projekte (src/ui/filter-sheet.js) und was die Karte
 * „Ansicht“ darüber sagt — dieselben drei Abschnitte wie auf der Aufgaben-Seite
 * (src/features/tasks/tasks-filter.js):
 *
 * - Status: Offen, In Arbeit, Erledigt (anders als bei den Aufgaben ist
 *   Erledigtes hier schlicht ein Wert wie die anderen)
 * - Dringlichkeit: die vier Stufen
 * - Verknüpft mit: wo das Projekt liegt (Arbeitsbereiche, Eingang) und was in
 *   ihm liegt (Aufgaben, Notizen, Medien …), auch als bestimmter Eintrag
 *   (src/ui/filter-link-section.js)
 *
 * Wie Status und Dringlichkeit wirken, steht in src/ui/filter-multi.js. „Nur
 * Favoriten“ bleibt der Schalter in der Karte. In der Android-Fassung zeigt
 * das Blatt alle Abschnitte als Chips auf einer Seite, unten mit der Zahl der
 * Treffer.
 * Pfad: src/features/overview/project-filter.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title -> Überschrift des Blatts
 * noun  -> Einzahl und Mehrzahl in den Sätzen und im Knopf unten („3 Projekte anzeigen“)
 *
 * Die übrigen Wörter stehen in src/ui/filter-multi.js und src/ui/filter-link-section.js.
 * Aussehen: styles/filter-sheet.css, in der Android-Fassung styles/android-filter-sheet.css.
 */

import { linkFilterDefaults } from "../../data/config.js";
import { linkFilterOn } from "../../data/link-filter-fields.js";
import { activeProjectView, updateProjectView, visibleProjects } from "../../data/project-views.js";
import { doneText, filtered, multiSection, plainStatusSection, prioritySection, sectionChip } from "../../ui/filter-multi.js";
import { linkChip, linkSection } from "../../ui/filter-link-section.js";
import { openFilterSheet } from "../../ui/filter-sheet.js";

const title = "Filtern";
const noun = { one: "Projekt", many: "Projekte" };

/**
 * Was gefiltert ist, als Chips je Abschnitt: [{ page, label, icon, count?, not? }]
 * — leer ohne Filter. `page` öffnet die Unterseite, `count` zählt die Haken.
 */
export function projectFilterChips(view) {
  const chips = [];
  if (linkFilterOn(view)) chips.push(linkChip(view));
  for (const section of [plainStatusSection, prioritySection]) {
    if (filtered(view, section)) chips.push(sectionChip(view, section));
  }
  return chips;
}

/* Speichern und das offene Blatt mit dem neuen Stand neu zeichnen */
function change(changes) {
  updateProjectView(changes);
  openProjectFilterSheet();
}

/* Alle Filter der Ansicht zurücksetzen (der Schalter „Nur Favoriten“ bleibt, wie er ist) */
function resetAll() {
  change({ ...linkFilterDefaults, hiddenStatuses: [], hiddenPriorities: [], statusNot: false, priorityNot: false });
}

/**
 * Das Blatt für die gewählte Ansicht öffnen oder mit neuem Stand neu zeichnen.
 * @param page id der Unterseite, die gleich offen sein soll (Chip in der Karte) — sonst weggelassen
 */
export function openProjectFilterSheet(page) {
  const view = activeProjectView();
  openFilterSheet({
    title,
    sections: [
      multiSection(view, plainStatusSection, noun.many, change),
      multiSection(view, prioritySection, noun.many, change),
      linkSection(view, "project", noun.many, activeProjectView, change),
    ],
    resetActive: projectFilterChips(view).length > 0,
    onReset: resetAll,
    page,
    chips: true,
    doneText: doneText(visibleProjects(view).length, noun),
  });
}
