/*
 * Der Pfad oben links in der Kopfzeile einer Unterseite am Desktop, wie bei
 * Google Drive: „Übersicht › Marketing › Design-System Notizen“. Jedes Glied
 * ist klickbar, das letzte ist die Seite selbst. Sammlungen und
 * Arbeitsbereiche gehören zur Übersicht und beginnen immer dort. Ein Eintrag
 * beginnt beim Reiter (oder der Suche), aus dem er direkt geöffnet wurde —
 * kam man von einer Sammlung oder einem Arbeitsbereich, bei der Übersicht;
 * ein verknüpfter Eintrag erbt den Anfang des vorigen. Dazwischen steht der
 * Ablageort des Eintrags — bei mehreren der erste, die übrigen nennt
 * „Details“ rechts. Am Handy ist der Pfad ausgeblendet (styles/entry-desk.css).
 * Pfad: src/ui/page-path.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rootLabels -> Name des ersten Glieds je Reiter, von dem aus man kam
 *              („home“ ist die Übersicht)
 * separator  -> Zeichen zwischen den Gliedern
 */

import { events, on } from "../core/bus.js";
import { escapeHtml } from "../core/html.js";
import { overviewPages } from "../data/config.js";
import { findEntry, findWorkspace, mainPlace, workspaceLabel } from "../data/queries.js";
import { isEntryRef, isWorkspaceRef, refId } from "../data/refs.js";
import { openEntry, openTarget, showSearch, showTab } from "./router.js";

const rootLabels = { home: "Übersicht", calendar: "Kalender", tasks: "Aufgaben", media: "Medien", search: "Suche" };
const separator = "›";

/* Die gerade offene Ansicht und der Anfang des Pfads für Einträge. Beides
   wird beim Öffnen jeder Ansicht nachgeführt — vor dem Zeichnen der
   Eintragsseite, weil dieses Modul seinen Zuhörer früher anmeldet. */
let shownView = "home";
let entryRoot = "home";

on(events.viewOpened, (name) => {
  if (name === "entry" && shownView !== "entry") entryRoot = rootLabels[shownView] ? shownView : "home";
  shownView = name;
});

/* Das erste Glied: ein Reiter oder die Suche. */
function rootStep(from = "home") {
  return { label: rootLabels[from], target: from === "search" ? "search" : `tab:${from}` };
}

/* Ein Ablageort als Glied: Arbeitsbereich, Projekt oder — ohne Ort — der Eingang. */
function placeStep(ref) {
  if (isWorkspaceRef(ref)) {
    const workspace = findWorkspace(refId(ref));
    return workspace ? { label: workspaceLabel(workspace), target: `workspace:${workspace.id}` } : null;
  }
  if (isEntryRef(ref)) {
    const project = findEntry(refId(ref));
    return project ? { label: project.title || "Projekt", target: `entry:${project.id}` } : null;
  }
  return { label: overviewPages[1].title, target: "overview:1" };
}

/** Die Glieder für einen Eintrag. */
export function entrySteps(entry) {
  return [rootStep(entryRoot), placeStep(mainPlace(entry)), { label: entry.title || "Ohne Titel" }].filter(Boolean);
}

/** Die Glieder für eine Sammlung oder einen Arbeitsbereich. */
export function pageSteps(page) {
  return [rootStep(), { label: page.title }];
}

/** Den Pfad in `nav` neu setzen. */
export function renderPath(nav, steps) {
  nav.innerHTML = steps
    .map((step, index) => {
      const sep = index ? `<span class="page-path-sep" aria-hidden="true">${separator}</span>` : "";
      const label = escapeHtml(step.label);
      const item = step.target
        ? `<button class="page-path-step" type="button" data-path="${escapeHtml(step.target)}">${label}</button>`
        : `<span class="page-path-step is-current" aria-current="page">${label}</span>`;
      return sep + item;
    })
    .join("");
}

/* Ein Glied anklicken: dorthin gehen, als hätte man den Ort selbst geöffnet. */
function onClick(event) {
  const step = event.target.closest("[data-path]");
  if (!step) return;
  const [kind, id] = step.dataset.path.split(":");
  if (kind === "search") showSearch();
  else if (kind === "tab") showTab(id);
  else if (kind === "entry") openEntry(Number(id));
  else openTarget(kind, kind === "workspace" ? Number(id) : id);
}

/**
 * Einen leeren Pfad in eine Kopfzeile hängen — gleich hinter den Zurück-Pfeil.
 * @param head die Kopfzeile (.page-head) der Unterseite.
 */
export function mountPath(head) {
  /* nav: der Pfad ist eine eigene kleine Navigation („Brotkrumen“) */
  const nav = document.createElement("nav");
  nav.className = "page-path";
  nav.setAttribute("aria-label", "Pfad");
  head.querySelector(".back-btn").after(nav);
  nav.addEventListener("click", onClick);
  return nav;
}
