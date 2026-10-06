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
 * Auf einem Eintrag ist das letzte Glied sein Titel und lässt sich direkt
 * umbenennen (Enter fertig, Escape zurück) — am Desktop steht der große
 * Titel darunter nicht mehr, der Pfad oben nennt die Seite schon.
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

/** Die Glieder für einen Eintrag; das letzte ist sein Titel zum Umbenennen. */
export function entrySteps(entry) {
  return [rootStep(entryRoot), placeStep(mainPlace(entry)), { label: entry.title || "", edit: true }].filter(Boolean);
}

/** Die Glieder für eine Sammlung oder einen Arbeitsbereich. */
export function pageSteps(page) {
  return [rootStep(), { label: page.title }];
}

/* Das Titel-Glied: ein Textfeld (contenteditable), damit es so aussieht wie die übrigen Glieder. */
function titleStep(label) {
  return `<span class="page-path-step is-current is-editable" contenteditable="plaintext-only" role="textbox" aria-label="Titel" data-placeholder="Ohne Titel" spellcheck="false" enterkeyhint="done" data-path-title>${label}</span>`;
}

/** Den Pfad in `nav` neu setzen — nicht, während man darin den Titel tippt. */
export function renderPath(nav, steps) {
  if (nav.contains(document.activeElement) && document.activeElement.matches("[data-path-title]")) return;
  nav.innerHTML = steps
    .map((step, index) => {
      const sep = index ? `<span class="page-path-sep" aria-hidden="true">${separator}</span>` : "";
      const label = escapeHtml(step.label);
      const item = step.target
        ? `<button class="page-path-step" type="button" data-path="${escapeHtml(step.target)}">${label}</button>`
        : step.edit
        ? titleStep(label)
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

/*
 * Umbenennen im Titel-Glied: jedes Zeichen geht an `onTitle`, Enter beendet,
 * Escape stellt den Titel von vorher wieder her.
 */
function bindTitle(nav, onTitle) {
  let before = "";
  const typed = (node) => node.textContent.replace(/\s+/g, " ");
  nav.addEventListener("focusin", (event) => {
    if (event.target.matches("[data-path-title]")) before = typed(event.target).trim();
  });
  nav.addEventListener("input", (event) => {
    if (event.target.matches("[data-path-title]")) onTitle(typed(event.target).trim());
  });
  nav.addEventListener("keydown", (event) => {
    const field = event.target.closest("[data-path-title]");
    if (!field) return;
    if (event.key === "Escape") {
      field.textContent = before;
      onTitle(before);
    }
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    /* Escape schließt sonst auch noch, was darunter offen ist */
    event.stopPropagation();
    field.blur();
  });
  /* Leer zeigt das Feld den grauen Platzhalter (:empty in styles/entry-desk.css) */
  nav.addEventListener("focusout", (event) => {
    if (event.target.matches("[data-path-title]") && !typed(event.target).trim()) event.target.textContent = "";
  });
}

/**
 * Einen leeren Pfad in eine Kopfzeile hängen — gleich hinter den Zurück-Pfeil.
 * @param head    die Kopfzeile (.page-head) der Unterseite.
 * @param onTitle optional: bekommt den getippten Titel, wenn das letzte Glied umbenannt wird.
 */
export function mountPath(head, onTitle = null) {
  /* nav: der Pfad ist eine eigene kleine Navigation („Brotkrumen“) */
  const nav = document.createElement("nav");
  nav.className = "page-path";
  nav.setAttribute("aria-label", "Pfad");
  head.querySelector(".back-btn").after(nav);
  nav.addEventListener("click", onClick);
  if (onTitle) bindTitle(nav, onTitle);
  return nav;
}
