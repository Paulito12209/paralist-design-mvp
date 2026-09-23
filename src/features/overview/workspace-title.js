/*
 * Der große Titel auf der Seite eines Arbeitsbereichs lässt sich direkt
 * antippen und umbenennen — wie der Titel einer Eintragsseite. Enter oder
 * Wegtippen übernimmt den Namen, Escape bricht ab, ein leerer Titel behält
 * den bisherigen Namen.
 * Pfad: src/features/overview/workspace-title.js
 *
 * Keine anpassbaren visuellen Werte: das Aussehen beim Bearbeiten steht in
 * styles/rows.css (Klasse .page-title.is-editable).
 */

import { dom } from "../../core/dom.js";
import { nameWorkspace } from "../../data/mutations.js";
import { findWorkspace } from "../../data/queries.js";
import { ui } from "../../data/state.js";

/* Der gerade offene Arbeitsbereich, oder null auf allen anderen Unterseiten. */
function openWorkspace() {
  const page = ui.currentPage;
  return page && page.isWorkspace ? findWorkspace(page.workspaceId) : null;
}

/**
 * Den Titel bearbeitbar machen, wenn die Seite ein Arbeitsbereich ist —
 * sonst wieder festen Text daraus machen. Aufgerufen nach jedem Zeichnen
 * der Kopfzeile.
 */
export function setupWorkspaceTitle(page) {
  const title = dom.pageTitle;
  const editable = Boolean(page && page.isWorkspace);
  title.classList.toggle("is-editable", editable);
  if (editable) {
    title.contentEditable = "plaintext-only";
    title.spellcheck = false;
    title.setAttribute("role", "textbox");
    title.setAttribute("aria-label", "Name des Arbeitsbereichs");
    title.setAttribute("enterkeyhint", "done");
  } else {
    title.removeAttribute("contenteditable");
    title.removeAttribute("role");
    title.removeAttribute("aria-label");
    title.removeAttribute("enterkeyhint");
  }
}

/**
 * Umbenennen von außen starten (z.B. aus dem Seitenmenü): Titel fokussieren
 * und den ganzen Namen markieren, damit man gleich drüberschreiben kann.
 */
export function beginRenameWorkspaceTitle() {
  if (!openWorkspace()) return;
  const title = dom.pageTitle;
  title.focus();
  const range = document.createRange();
  range.selectNodeContents(title);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/* Den getippten Namen übernehmen; leer oder unverändert lässt alles, wie es ist. */
function commitTitle() {
  const workspace = openWorkspace();
  if (!workspace) return;
  const typed = dom.pageTitle.textContent.replace(/\s+/g, " ").trim();
  if (typed && typed !== workspace.name) {
    nameWorkspace(workspace, typed);
    ui.currentPage.title = workspace.name;
  }
  dom.pageTitle.textContent = ui.currentPage.title;
}

/** Tastatur und Fokusverlust am Titel anmelden. */
export function initWorkspaceTitle() {
  const title = dom.pageTitle;
  title.addEventListener("keydown", (event) => {
    if (!openWorkspace()) return;
    if (event.key === "Enter") {
      event.preventDefault();
      title.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      title.textContent = ui.currentPage.title;
      title.blur();
    }
  });
  title.addEventListener("blur", commitTitle);
}
