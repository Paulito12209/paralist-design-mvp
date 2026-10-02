/*
 * Das Blatt „Filtern“ der Aufgaben-Seite (src/ui/filter-sheet.js) und was
 * die Karte „Ansicht“ darüber sagt: rechts in der Zeile die Zahl der
 * gefilterten Abschnitte, darunter je Abschnitt ein Chip. Drei Abschnitte:
 *
 * - Status: Offen, In Arbeit, Erledigt, Archiviert. „Erledigt“ ist derselbe
 *   Schalter wie „Erledigte zeigen“ in der Karte, „Archiviert“ holt das
 *   Archiv auf die Seite (src/data/queries.js). Beide erklären sich per ⓘ.
 * - Dringlichkeit: die vier Stufen.
 * - Verknüpft mit (nur in eigenen Ansichten): irgendeine Verbindung, eine
 *   Kategorie oder ein bestimmter Eintrag — Ablageorte und Verknüpfungen
 *   zählen zusammen (src/ui/filter-link-section.js). „Alle“ filtert nie
 *   danach; nichts gewählt heißt: alles zu sehen.
 *
 * Status, Dringlichkeit und Verknüpft mit haben das Segment („ist | ist
 * nicht“ bzw. „enthält | enthält nicht“); wie es wirkt, steht in
 * src/ui/filter-multi.js. In der Android-Fassung zeigt das Blatt alle drei
 * Abschnitte als Chips auf einer Seite, unten mit der Zahl der Treffer.
 *
 * Als Filter zählt jeder Abschnitt, in dem etwas fehlt — auch das
 * ausgeblendete Erledigte und Archivierte einer frischen Ansicht, sonst
 * stünde „Keine“, obwohl etwas fehlt.
 * Pfad: src/features/tasks/tasks-filter.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title          -> Überschrift des Blatts
 * noun           -> Einzahl und Mehrzahl in den Sätzen und im Knopf unten („7 Aufgaben anzeigen“)
 * archivedLabel  -> Name des Werts „Archiviert“
 * infos          -> Überschrift und Text der Erklärungen hinter den ⓘ
 *
 * Die übrigen Wörter (Namen der Abschnitte, „Alle“, „Keine“, die Sätze unter
 * der Liste) stehen in src/ui/filter-multi.js und src/ui/filter-link-section.js.
 * Aussehen: styles/filter-sheet.css, in der Android-Fassung styles/android-filter-sheet.css;
 * der Dialog hinter dem ⓘ in styles/info-dialog.css; die Chips in styles/tasks-settings.css.
 */

import { linkFilterDefaults } from "../../data/config.js";
import { taskStatuses } from "../../data/config-tasks.js";
import { linkFilterOn } from "../../data/link-filter-fields.js";
import { visibleTasks } from "../../data/queries.js";
import { activeTaskView, updateTaskView } from "../../data/task-views.js";
import { doneText, filtered, multiSection, prioritySection, sectionChip } from "../../ui/filter-multi.js";
import { linkChip, linkSection } from "../../ui/filter-link-section.js";
import { openFilterSheet } from "../../ui/filter-sheet.js";

const title = "Filtern";
const noun = { one: "Aufgabe", many: "Aufgaben" };
const archivedLabel = "Archiviert";
const infos = {
  done: {
    title: "Erledigt",
    text: "Abgehakte Aufgaben bleiben bis Mitternacht stehen. Dieser Haken ist derselbe Schalter wie „Erledigte zeigen“ in der Karte.",
  },
  archived: {
    title: "Archiviert",
    text: "Ab dem Tag nach dem Erledigen liegt eine Aufgabe im Archiv. Mit Haken siehst du sie hier trotzdem, im Board als Spalte rechts neben „Erledigt“. Ziehst du sie heraus, holst du sie zurück.",
  },
};

/* ---------- Status: die vier Werte und ihr Feld in der Ansicht ---------- */

const doneId = "erledigt";
const archivedId = "archiviert";

/* Alle Werte des Abschnitts Status in der Reihenfolge des Blatts */
function statusValues() {
  const values = taskStatuses.map((status) => ({
    id: status.done ? doneId : status.id,
    label: status.label,
    icon: status.icon,
    color: status.color,
    info: status.done ? infos.done : undefined,
  }));
  values.push({ id: archivedId, label: archivedLabel, icon: "archive", info: infos.archived });
  return values;
}

/* Ist dieser Status in der Ansicht zu sehen? */
function statusShown(view, id) {
  if (id === doneId) return !view.hideDone;
  if (id === archivedId) return view.showArchived;
  return !view.hiddenStatuses.includes(id);
}

/* Die Änderung an der Ansicht, die diesen Status zeigt oder ausblendet — immer
   als neue Liste, weil sich Kopien einer Ansicht ihre Listen sonst teilen würden */
function statusChange(view, id, shown) {
  if (id === doneId) return { hideDone: !shown };
  if (id === archivedId) return { showArchived: shown };
  const rest = view.hiddenStatuses.filter((item) => item !== id);
  return { hiddenStatuses: shown ? rest : [...rest, id] };
}

/* ---------- Der Abschnitt Status dieser Seite ---------- */

/* Beschreibt, wie der Abschnitt aus der Ansicht liest und in sie schreibt (Form: src/ui/filter-multi.js) */
const statusSection = {
  id: "status",
  values: statusValues,
  shown: statusShown,
  change: statusChange,
  not: (view) => view.statusNot,
  notField: "statusNot",
};

/* ---------- Für die Karte „Ansicht“ ---------- */

/**
 * Was gefiltert ist, als Chips je Abschnitt: [{ page, label, icon, count?, not? }]
 * — leer ohne Filter. `page` öffnet die Unterseite, `count` zählt die Haken,
 * `not` heißt „ist nicht“.
 */
export function filterChips(view) {
  const chips = [];
  if (linkFilterOn(view)) chips.push(linkChip(view));
  for (const section of [statusSection, prioritySection]) {
    if (filtered(view, section)) chips.push(sectionChip(view, section));
  }
  return chips;
}

/* Speichern und das offene Blatt mit dem neuen Stand neu zeichnen */
function change(changes) {
  updateTaskView(changes);
  openTaskFilter();
}

/* Alle Filter der Ansicht zurücksetzen: jede Verknüpfung, jeder Status, jede Dringlichkeit */
function resetAll() {
  change({ ...linkFilterDefaults, hiddenStatuses: [], hiddenPriorities: [], hideDone: false, showArchived: true, statusNot: false, priorityNot: false });
}

/**
 * Das Blatt für die gewählte Ansicht öffnen oder mit neuem Stand neu zeichnen.
 * @param page id der Unterseite, die gleich offen sein soll (Chip in der Karte) — sonst weggelassen
 */
export function openTaskFilter(page) {
  const view = activeTaskView();
  const sections = [multiSection(view, statusSection, noun.many, change), multiSection(view, prioritySection, noun.many, change)];
  if (!view.fixed) sections.push(linkSection(view, "task", noun.many, activeTaskView, change));
  openFilterSheet({
    title,
    sections,
    resetActive: filterChips(view).length > 0,
    onReset: resetAll,
    page,
    chips: true,
    doneText: doneText(visibleTasks(view).length, noun),
  });
}
