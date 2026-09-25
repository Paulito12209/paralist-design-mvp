/*
 * Das Blatt „Typ ändern“ und alles, was danach passiert. Aus einer Notiz wird
 * sofort eine Aufgabe — mit „Rückgängig“ in der Meldung darunter. Wandert
 * dabei etwas (aus Verknüpfungen wird Inhalt, ein Eintrag wird ein
 * Arbeitsbereich), steht vorher in Sätzen da, was passiert, und erst
 * „Umwandeln“ tut es (src/data/convert.js, src/data/convert-notes.js).
 * Geöffnet wird das Blatt aus dem Menü eines Eintrags oder Arbeitsbereichs,
 * und über die graue Kategorie mitten in der Kopfzeile; bei einer Aufgabe
 * stehen dieselben Typen im Tab „Typ“ neben Status und Dringlichkeit.
 * Pfad: src/ui/type-menu.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuLabel / sheetTitle        -> Menüpunkt und Überschrift des Blatts
 * confirmLabel / cancelLabel    -> die beiden Knöpfe unter den Sätzen
 * undoLabel                     -> der Knopf in der Meldung nach einem sofortigen Wechsel
 * openLabel                     -> der Knopf in der Meldung, wenn man aus einer Liste kam
 *
 * Aussehen: Blatt in styles/overlays.css und styles/details.css (.sheet-note),
 * Meldung in styles/toast.css, die Kategorie als Knopf in styles/entry.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { sameId } from "../core/ids.js";
import { typeArticles, typeIcon, typeSingular, xpItemStyle } from "../data/config.js";
import {
  canChangeType,
  changeEntryType,
  convertibleTypes,
  entryToWorkspace,
  restoreTypeSnapshot,
  typeSnapshot,
  workspaceKind,
  workspaceToEntry,
} from "../data/convert.js";
import { typeChangeHeadline, typeChangeNotes } from "../data/convert-notes.js";
import { findEntry, workspaceLabel } from "../data/queries.js";
import { ui } from "../data/state.js";
import { openEntry, openTarget } from "./router.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";
import { isViewActive } from "./views.js";

const menuLabel = "Typ ändern";
const sheetTitle = "Typ ändern";
const confirmLabel = "Umwandeln";
const cancelLabel = "Abbrechen";
const undoLabel = "Rückgängig";
const openLabel = "Zur Seite";

/* Der Arbeitsbereich ist kein Eintragstyp — Name und Icon kommen aus xpItems (src/data/config.js). */
const workspaceName = xpItemStyle(workspaceKind).label;

/* Ein „subject“ ist { entry } oder { workspace }: dasselbe Blatt für beide. */
function currentKind(subject) {
  return subject.entry ? subject.entry.type : workspaceKind;
}

function subjectTitle(subject) {
  return subject.entry ? subject.entry.title || "Ohne Titel" : workspaceLabel(subject.workspace);
}

function kindName(kind) {
  return kind === workspaceKind ? workspaceName : typeSingular(kind);
}

function kindIcon(kind) {
  return kind === workspaceKind ? xpItemStyle(workspaceKind).icon : typeIcon(kind);
}

/* Ist gerade die Seite dieses Dings offen? Dann geht es danach auf die neue Seite. */
function isEntryPageOf(entry) {
  return isViewActive("entry") && sameId(ui.currentEntryId, entry.id);
}

function isWorkspacePageOf(workspace) {
  const page = ui.currentPage;
  return isViewActive("page") && Boolean(page && page.isWorkspace && sameId(page.workspaceId, workspace.id));
}

/*
 * Die Meldung danach: der neue Typ mit seinem Icon in seiner Farbe; bekam
 * ein Termin gerade sein Datum, steht klein daneben seine Uhrzeit — er ist
 * heute, mehr passt neben „Rückgängig“ nicht in die Zeile. Immer NACH einem
 * Seitenwechsel zeigen: der Wechsel räumt die Meldung sonst gleich wieder
 * weg (src/features/composer/composer.js).
 */
function announce(kind, note, action = null) {
  showToast({
    icon: kindIcon(kind),
    accent: xpItemStyle(kind).color,
    title: `Jetzt ${typeArticles[kind]} ${kindName(kind)}`,
    note,
    action,
  });
}

/* Die Uhrzeit, wenn ein Termin gerade sein Datum (heute) bekam — sonst nichts. */
function noteFor(entry, hadDate) {
  return entry.type === "termin" && !hadDate ? entry.time : "";
}

/*
 * Ein Eintrag bekommt einen anderen Typ. Ohne Bestätigung davor gibt es
 * „Rückgängig“, das den Stand von vorher zurückholt (Status, Dringlichkeit,
 * Datum — nicht den Text, der darf inzwischen weitergetippt sein). Nach einer
 * Bestätigung nicht: da waren die Sätze davor die Sicherung.
 */
function changeType(entry, type, undoable) {
  const snap = typeSnapshot(entry);
  const hadDate = Boolean(entry.date);
  changeEntryType(entry, type);
  const undo = () => {
    const current = findEntry(entry.id);
    if (current) restoreTypeSnapshot(current, snap);
  };
  announce(type, noteFor(entry, hadDate), undoable ? { label: undoLabel, icon: "undo", onSelect: undo } : null);
}

/* Aus dem Eintrag wird ein Arbeitsbereich; seine Seite wird durch die neue ersetzt. */
function becomeWorkspace(entry) {
  const onPage = isEntryPageOf(entry);
  const workspace = entryToWorkspace(entry);
  if (!workspace) return;
  if (onPage) openTarget("workspace", workspace.id, true);
  announce(workspaceKind, "", onPage ? null : { label: openLabel, onSelect: () => openTarget("workspace", workspace.id) });
}

/* Aus dem Arbeitsbereich wird ein Eintrag; seine Seite wird durch die neue ersetzt. */
function becomeEntry(workspace, type) {
  const onPage = isWorkspacePageOf(workspace);
  const entry = workspaceToEntry(workspace, type);
  if (!entry) return;
  /* Auch wenn die Desktop-Seitenleiste beim Speichern schon zurückgesprungen
     ist (src/shell/desk-nav.js): war die Seite offen, soll die neue offen
     sein — der Verlauf steht danach genauso da wie am Handy. */
  if (onPage) openEntry(entry.id, true, true);
  announce(type, noteFor(entry, false), onPage ? null : { label: openLabel, onSelect: () => openEntry(entry.id) });
}

function perform(subject, target, undoable) {
  if (subject.workspace) becomeEntry(subject.workspace, target);
  else if (target === workspaceKind) becomeWorkspace(subject.entry);
  else changeType(subject.entry, target, undoable);
}

/*
 * Erst sagen, was passiert, dann tun — nur, wenn etwas wandert. Oben der
 * Name wie in jedem Menü, darunter „Wird ein Arbeitsbereich“ und je ein Satz
 * pro Folge; der Knopf trägt das Icon des Ziels. Kein Rot: es wird nichts gelöscht.
 */
function confirmChange(subject, target, notes) {
  openSheet(subjectTitle(subject), [
    { lead: true, label: typeChangeHeadline(target) },
    ...notes.map((label) => ({ note: true, label })),
    { label: confirmLabel, icon: kindIcon(target), split: true, onSelect: () => perform(subject, target, false) },
    { label: cancelLabel, icon: "close", onSelect: () => {} },
  ]);
}

function pick(subject, target) {
  if (target === currentKind(subject)) return;
  const notes = typeChangeNotes(subject, target);
  if (notes.length) confirmChange(subject, target, notes);
  else perform(subject, target, true);
}

/**
 * Alle Typen als Optionen, gegliedert wie „Typ wählen“ im Eingabefeld
 * (src/features/composer/composer-types.js): der aktuelle ist markiert, der
 * Arbeitsbereich steht abgesetzt darunter — er ist die Ebene über den Einträgen.
 * Auch der Tab „Typ“ im Blatt einer Aufgabe (src/ui/task-status.js) nutzt sie.
 * @param subject { entry } oder { workspace }
 */
export function typeChangeOptions(subject) {
  const current = currentKind(subject);
  const options = convertibleTypes.map((type) => ({
    label: typeSingular(type),
    icon: typeIcon(type),
    active: type === current,
    gap: type === "termin" || type === "projekt",
    split: type === "dokument",
    onSelect: () => pick(subject, type),
  }));
  options.push({
    label: workspaceName,
    icon: kindIcon(workspaceKind),
    active: current === workspaceKind,
    split: true,
    onSelect: () => pick(subject, workspaceKind),
  });
  return options;
}

/** Das Blatt „Typ ändern“ mit allen Typen öffnen. */
export function openTypeChangeSheet(subject) {
  openSheet(sheetTitle, typeChangeOptions(subject));
}

/**
 * Der Menüpunkt „Typ ändern“ für das Menü eines Eintrags oder Arbeitsbereichs.
 * `null`, wenn sich der Typ nicht ändern lässt (Zeichnung, Medium).
 */
export function typeChangeAction(subject) {
  if (subject.entry && !canChangeType(subject.entry)) return null;
  return { label: menuLabel, icon: "convert", onSelect: () => openTypeChangeSheet(subject) };
}

/**
 * Die graue Kategorie mitten in der Kopfzeile als schmale Pille: ein Tipp
 * darauf öffnet „Typ ändern“. Der kleine Pfeil sagt, dass sich hier etwas
 * wählen lässt — wie bei „Aufgabe“ über „Offen · Jetzt“ (src/ui/task-status.js).
 */
export function typeCrumbMarkup(label) {
  return `
    <button class="type-crumb" type="button" data-type-sheet aria-label="${escapeHtml(label)}. Typ ändern">
      <span>${escapeHtml(label)}</span>
      ${icon("chevron", "type-crumb-chevron")}
    </button>
  `;
}
