/*
 * Ein Arbeitsbereich aus dem Eingabefeld: im Blatt „Neu“ wählbar wie ein Typ,
 * angelegt mit dem getippten Namen — ohne Sprung auf die Seite Arbeitsbereiche.
 * Er steht auf derselben Ebene wie der Eingang; darum verschwindet der
 * Ort-Chip, solange er gewählt ist (styles/composer.css, `.composer.is-workspace`).
 * Angehängte Dateien werden Medien, die im neuen Arbeitsbereich liegen.
 * Pfad: src/features/composer/composer-workspace.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * workspaceDraft.label -> Name in Typ-Chip und Typ-Blatt
 * workspaceDraft.icon  -> Icon in Typ-Chip und Typ-Blatt
 * Die Platzhalter stehen in src/data/config.js (composerPlaceholders, sheetPlaceholders).
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { xpKinds } from "../../data/config.js";
import { addWorkspace } from "../../data/mutations.js";
import { workspaceRef } from "../../data/refs.js";
import { commitXp } from "../../data/xp.js";
import { openTarget } from "../../ui/router.js";
import { showToast } from "../../ui/toast.js";
import { createMediaEntries } from "./attachments.js";
import { composer } from "./composer-state.js";

/* Dieselbe Kennung wie im Plus-Menü (src/shell/create-menu.js) und in den XP-Posten */
export const workspaceDraft = { id: "arbeitsbereich", label: "Arbeitsbereich", icon: "layers" };

/** Ist im Eingabefeld gerade „Arbeitsbereich“ gewählt? */
export function isWorkspaceDraft() {
  return composer.type === workspaceDraft.id;
}

/** Den Ort-Chip aus- bzw. wieder einblenden. */
export function renderWorkspaceDraft() {
  dom.composer.classList.toggle("is-workspace", isWorkspaceDraft());
}

/**
 * Den Arbeitsbereich mit dem getippten Namen anlegen und melden. Er landet im
 * gewählten Tab der Seite Arbeitsbereiche; „Zur Seite“ öffnet ihn. Jeder
 * Anhang wird ein Medium mit dem Arbeitsbereich als Ablageort und heißt wie
 * seine Datei — der getippte Text ist der Name des Arbeitsbereichs.
 * Vor closeComposer aufrufen: das räumt die Anhänge weg.
 * @param name der Text aus dem Eingabefeld (nicht leer).
 */
export function createWorkspaceFromDraft(name) {
  let workspace = null;
  /* Erst die Meldung, dann anlegen (vergibt die Punkte): steigt dabei die
     Stufe, löst deren Meldung diese ab — wie in createEntry (composer.js). */
  showToast({
    title: `${workspaceDraft.label} erstellt`,
    /* Punkte für den Arbeitsbereich (nameWorkspace in src/data/mutations.js) und je Medium */
    note: `+${xpKinds.created.amount * (1 + composer.files.length)} XP`,
    action: { label: "Zur Seite", onSelect: () => openTarget("workspace", workspace.id) },
  });
  workspace = addWorkspace(name);
  if (!composer.files.length) return;
  createMediaEntries("", [workspaceRef(workspace.id)], null);
  commitXp();
  emit(events.dataChanged);
}
