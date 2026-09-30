/*
 * Ältere Speicherstände auf die heutige Form bringen. Gerufen von loadState
 * in src/data/state.js, direkt nach dem Einlesen. Jede Regel sagt, wie es
 * früher war — genau das ist hier die Aufgabe.
 * Pfad: src/data/migrate.js
 *
 * Keine anpassbaren Werte: die Vorgaben für Status und Dringlichkeit stehen
 * in src/data/config-tasks.js.
 */

import { adoptStatusFields, defaultTaskPriority, defaultTaskStatus, isTaskDone } from "./config-tasks.js";
import { sanitizeLinks } from "./links.js";
import { normalizeRef, workspaceRef } from "./refs.js";

/**
 * Ältere Speicherstände auf die heutige Form bringen. Bekommt den Zustand
 * hereingegeben, damit diese Datei src/data/state.js nicht importieren muss.
 * Gibt zurück, ob sich etwas geändert hat.
 */
export function migrate(state) {
  const before = JSON.stringify({ workspaces: state.workspaces, entries: state.entries, tabs: state.tabs, opens: state.opens });
  /* Die Sortiernummer einer Aufgabe war früher der negative Zeitpunkt des
     Anlegens (Neuestes zuerst); jetzt zählt sie aufsteigend, Neues hängt unten. */
  state.entries.forEach((entry) => {
    if (entry.type === "aufgabe" && Number.isFinite(entry.order) && entry.order < 0) entry.order = -entry.order;
  });
  /* Der erste Tab hieß früher „Privat“. */
  state.tabs.forEach((tab) => {
    if (tab.name === "Privat") tab.name = "Meine";
    if (typeof tab.awarded !== "boolean") tab.awarded = true;
  });
  state.workspaces.forEach((workspace) => {
    if (typeof workspace.favorite !== "boolean") workspace.favorite = false;
    /* Das Cover kam später dazu: ohne Angabe hat ein Arbeitsbereich keins. */
    if (typeof workspace.cover !== "boolean") workspace.cover = false;
  });
  state.workspaces.forEach((workspace) => {
    if (typeof workspace.body !== "string") workspace.body = "";
    if (typeof workspace.awarded !== "boolean") workspace.awarded = true;
    /* Der frühere Vorgabename „Platzhalter N“ heißt jetzt „Arbeitsbereich“ bzw. „Arbeitsbereich N“. */
    const old = /^Platzhalter (\d+)$/.exec(workspace.name || "");
    if (old) workspace.name = old[1] === "1" ? "Arbeitsbereich" : `Arbeitsbereich ${old[1]}`;
  });
  state.entries.forEach((entry) => {
    if (typeof entry.favorite !== "boolean") entry.favorite = false;
    /* Cover (Farbverlauf oben) und eigenes Icon kamen später dazu: ohne
       Angabe hat ein Eintrag keins von beiden. */
    if (typeof entry.cover !== "boolean") entry.cover = false;
    if (typeof entry.icon !== "string") entry.icon = "";
    /* Früher hatte ein Eintrag EINEN Ablageort `parent` — als nackte Nummer,
       als „o3“/„o4“ für zwei Karten oder als Verweis. Heute ist es die Liste
       `places`; alles wird darauf gebracht und auf Verweise aus refs.js normiert. */
    if (!Array.isArray(entry.places)) {
      const home = normalizeRef(entry.parent);
      entry.places = home ? [home] : [];
    }
    delete entry.parent;
    entry.places = [...new Set(entry.places.map(normalizeRef).filter(Boolean))];
  });
  /* Aufgaben hatten früher weder Status noch Priorität noch eine eigene
     Reihenfolge. Die Sortiernummer zählt aufwärts von oben nach unten; der
     negative Zeitpunkt des Anlegens stellt die neueste Aufgabe nach oben. */
  state.entries.forEach((entry) => {
    if (entry.type !== "aufgabe") return;
    if (typeof entry.status !== "string") entry.status = defaultTaskStatus;
    if (typeof entry.priority !== "string") entry.priority = defaultTaskPriority;
    if (!Number.isFinite(entry.order)) entry.order = -(entry.createdAt || Date.now());
    /* Erledigte Aufgaben hatten früher keinen Zeitpunkt des Erledigens. Sie
       gelten als heute erledigt, damit sie nicht ohne Vorwarnung auf einen
       Schlag im Archiv verschwinden — ab Mitternacht greift die Regel. */
    if (isTaskDone(entry) && !Number.isFinite(entry.doneAt)) entry.doneAt = Date.now();
  });
  /* Termin, Projekt und Dokument hatten früher weder Status noch
     Dringlichkeit — nur die Aufgabe. Sie starten auf den Vorgaben. */
  state.entries.forEach((entry) => {
    if (entry.type !== "aufgabe") adoptStatusFields(entry);
  });
  /* Ein Verweis auf etwas, das es nicht mehr gibt, fällt weg; ohne Ort heißt Eingang. */
  const workspaceRefs = new Set(state.workspaces.map((workspace) => workspaceRef(workspace.id)));
  const projectRefs = new Set(state.entries.filter((entry) => entry.type === "projekt").map((entry) => `e:${entry.id}`));
  state.entries.forEach((entry) => {
    entry.places = entry.places.filter((ref) => workspaceRefs.has(ref) || projectRefs.has(ref));
  });
  /* Verknüpfte Einträge standen früher gar nicht in den Daten — die Liste
     „Verknüpfte Einträge“ war nur die Rückseite des Ablageorts. Was ein
     Eintrag beim Anlegen an Medien mitbrachte, stand einseitig in
     `attachments`. Beides bringt src/data/links.js auf die heutige Form. */
  sanitizeLinks(state.entries);
  /* Ein Arbeitsbereich ohne gültigen Tab wäre unerreichbar: zurück in den ersten Tab. */
  const tabIds = state.tabs.map((tab) => String(tab.id));
  state.workspaces.forEach((workspace) => {
    if (!tabIds.includes(String(workspace.tab))) workspace.tab = state.tabs[0].id;
  });
  /* Früher zählte die Suche auch Sammlungen (Eingang, Favoriten, Projekte,
     Ressourcen) als „geöffnet“. Das ist weggefallen, die alten Posten auch. */
  state.opens = state.opens.filter((open) => open.kind === "entry" || open.kind === "workspace");
  return JSON.stringify({ workspaces: state.workspaces, entries: state.entries, tabs: state.tabs, opens: state.opens }) !== before;
}
