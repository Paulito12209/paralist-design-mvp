/*
 * Was beim Umwandeln passiert, in Sätzen: „Die 3 verknüpften Einträge liegen
 * dann im Projekt.“ Das Blatt „Typ ändern“ zeigt sie, bevor es etwas
 * verschiebt — aber nur, wenn es etwas zu sagen gibt. Wechselt nur der Name
 * des Typs (Notiz → Aufgabe), bleibt die Liste leer und der Wechsel passiert
 * sofort. Welche Regeln dahinterstehen, steht in src/data/convert.js.
 * Pfad: src/data/convert-notes.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * Die Sätze selbst — alle Texte, die das Blatt zeigt, stehen hier.
 * Die Artikel („ein Projekt“, „eine Notiz“) kommen aus typeArticles in
 * src/data/config.js.
 */

import { overviewPages, typeArticles, typeSingular } from "./config.js";
import { workspaceKind, workspaceTabFor } from "./convert.js";
import { findEntry, hasPlace, isContainer, parentName, placesLabel } from "./queries.js";
import { entryRef, isEntryRef, refId, workspaceRef } from "./refs.js";
import { state } from "./state.js";

const workspaceName = "Arbeitsbereich";

/* „Der Eintrag“ / „Die 3 Einträge“ — die Einzahl bringt ihren Artikel selbst mit. */
function theEntries(n, one = "Der Eintrag", many = "Einträge") {
  return n === 1 ? one : `Die ${n} ${many}`;
}

/* „im Eingang“, aber „in Marketing“ */
function inPlace(where) {
  return where === overviewPages[1].title ? `im ${where}` : `in ${where}`;
}

/* Wie viele davon nur an diesem einen Ort liegen — die rücken beim Wechsel um. */
function orphansOf(list) {
  return list.filter((item) => (item.places || []).length <= 1).length;
}

/* „… und liegen dann im Eingang“ bzw. „; 2 davon liegen dann in Marketing“ */
function whereOrphansGo(total, orphans, where) {
  if (!orphans) return ".";
  if (orphans === total) return ` und ${total === 1 ? "liegt" : "liegen"} dann ${inPlace(where)}.`;
  return `; ${orphans} davon ${orphans === 1 ? "liegt" : "liegen"} dann ${inPlace(where)}.`;
}

/* Wo der Eintrag liegt, wenn er aus seinen Projekten herausrückt. */
function liftedPlacesLabel(entry) {
  const places = new Set();
  (entry.places || []).forEach((place) => {
    if (!isEntryRef(place)) {
      places.add(place);
      return;
    }
    const project = findEntry(refId(place));
    (project ? project.places || [] : []).forEach((up) => places.add(up));
  });
  return places.size ? [...places].map(parentName).join(" · ") : overviewPages[1].title;
}

/* Ein Eintrag wird ein Projekt. */
function toProjectNotes(entry) {
  const notes = [];
  const inProjects = (entry.places || []).filter(isEntryRef);
  if (inProjects.length) {
    const from = inProjects.map(parentName).join(" · ");
    notes.push(`Liegt dann ${inPlace(liftedPlacesLabel(entry))} statt in „${from}“ — ein Projekt liegt nicht in einem Projekt.`);
  }
  const links = (entry.links || []).length;
  if (links) {
    notes.push(`${theEntries(links, "Der verknüpfte Eintrag", "verknüpften Einträge")} ${links === 1 ? "liegt" : "liegen"} dann im Projekt.`);
  }
  return notes;
}

/* Ein Projekt wird etwas anderes. */
function fromProjectNotes(entry) {
  const inside = state.entries.filter((item) => hasPlace(item, entryRef(entry.id)));
  if (!inside.length) return [];
  const n = inside.length;
  return [
    `${theEntries(n)} darin ${n === 1 ? "bleibt" : "bleiben"} verknüpft${whereOrphansGo(n, orphansOf(inside), placesLabel(entry))}`,
  ];
}

/* Was ein Eintrag verliert, wenn er kein Eintrag mehr ist. */
function lostFieldsNotes(entry) {
  if (entry.type === "aufgabe") return ["Status und Dringlichkeit gehen verloren."];
  if (entry.type === "termin") return ["Tag und Uhrzeit gehen verloren."];
  return [];
}

/* Ein Eintrag wird ein Arbeitsbereich. */
function toWorkspaceNotes(entry) {
  const notes = [];
  const tab = state.tabs.find((item) => String(item.id) === String(workspaceTabFor(entry)));
  if (tab) notes.push(`Erscheint auf der Übersicht im Tab „${tab.name}“.`);
  const container = isContainer(entry);
  const inside = container
    ? state.entries.filter((item) => hasPlace(item, entryRef(entry.id))).length
    : (entry.links || []).length;
  if (inside) {
    const who = container ? theEntries(inside) : theEntries(inside, "Der verknüpfte Eintrag", "verknüpften Einträge");
    notes.push(`${who}${container ? " darin" : ""} ${inside === 1 ? "liegt" : "liegen"} dann im ${workspaceName}.`);
  }
  if ((entry.places || []).length) {
    notes.push(`Liegt dann nicht mehr in ${placesLabel(entry)} — ein ${workspaceName} steht ganz oben.`);
  }
  return notes.concat(lostFieldsNotes(entry));
}

/* Ein Arbeitsbereich wird ein Eintrag. */
function fromWorkspaceNotes(workspace, type) {
  const inside = state.entries.filter((item) => hasPlace(item, workspaceRef(workspace.id)));
  const projects = inside.filter(isContainer);
  const others = inside.filter((item) => !isContainer(item));
  const inbox = overviewPages[1].title;
  const notes = [];
  const m = projects.length;
  const n = others.length;

  if (type === "projekt") {
    if (n) notes.push(`${theEntries(n)} darin ${n === 1 ? "liegt" : "liegen"} dann im Projekt.`);
    if (m) {
      const where = whereOrphansGo(m, orphansOf(projects), inbox).slice(0, -1);
      notes.push(
        `${theEntries(m, "Das Projekt", "Projekte")} darin ${m === 1 ? "kommt" : "kommen"} nicht mit${where} — ein Projekt liegt nicht in einem Projekt.`
      );
    }
  } else {
    if (n) notes.push(`${theEntries(n)} darin ${n === 1 ? "bleibt" : "bleiben"} verknüpft${whereOrphansGo(n, orphansOf(others), inbox)}`);
    if (m) {
      notes.push(
        `${theEntries(m, "Das Projekt", "Projekte")} darin ${m === 1 ? "verliert" : "verlieren"} die Verbindung${whereOrphansGo(m, orphansOf(projects), inbox)}`
      );
    }
  }
  notes.push(`Liegt dann im ${inbox}.`);
  if (type === "termin") notes.push("Steht dann heute im Kalender.");
  return notes;
}

/**
 * Die Sätze zu einem Wechsel. Leer, wenn außer dem Typnamen nichts passiert.
 * @param subject { entry } oder { workspace }
 * @param target  ein Typ aus convertibleTypes oder workspaceKind
 */
export function typeChangeNotes(subject, target) {
  if (subject.workspace) return fromWorkspaceNotes(subject.workspace, target);
  const entry = subject.entry;
  if (target === workspaceKind) return toWorkspaceNotes(entry);
  if (target === "projekt" && !isContainer(entry)) return toProjectNotes(entry);
  if (isContainer(entry) && target !== "projekt") return fromProjectNotes(entry);
  return [];
}

/** Die Zeile über den Sätzen: „Wird ein Arbeitsbereich“ — ohne Titel, damit sie nie umbricht. */
export function typeChangeHeadline(target) {
  const name = target === workspaceKind ? workspaceName : typeSingular(target);
  return `Wird ${typeArticles[target]} ${name}`;
}
