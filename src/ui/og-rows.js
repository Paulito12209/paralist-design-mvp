/*
 * Zeilen der „OG Version“ nachträglich auszeichnen (Nachbau von PageRow und
 * PageLinkRow in Organi7er): die Art als Attribut für die Kategoriefarbe,
 * Titel und Zusatz in einem Block — bei Aufgaben Dringlichkeit und Status als
 * Pillen und vorn die runde Checkbox, sonst die Art unter dem Titel — und
 * das Zielscheiben-Symbol für Projekte. Die Zeilen selbst zeichnet
 * src/ui/rows.js für alle Fassungen; hier kommt nur Markup dazu, das ohne die
 * OG-Regeln (styles/og-detail-sections.css, styles/og-list-page.css)
 * unsichtbar bleibt bzw. gar nicht erst angelegt wird.
 * Pfad: src/ui/og-rows.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * labels       -> Name der Checkbox für Vorlesehilfen
 * rowSubLabels -> was unter dem Titel steht, wenn nicht der Typname (z. B. „Ressource“ für Dokumente)
 */

import { icon } from "../core/html.js";
import { typeSingular } from "../data/config.js";
import { isTaskDone, statusOf, taskPriorityOf } from "../data/config-tasks.js";
import { findEntry } from "../data/queries.js";
import { ogEntryIcon } from "./og-type-icon.js";

const labels = { done: "Abhaken" };
const rowSubLabels = { dokument: "Ressource", zeichnung: "Ressource", medien: "Ressource" };

/** Nur die OG Version bekommt die Auszeichnung; alle anderen Fassungen bleiben unberührt. */
export function isOgVersion() {
  const root = document.documentElement.dataset;
  return root.mobileOs === "ios" && root.mobileVariant === "og";
}

function pillMarkup(item, className) {
  return `<span class="og-row-pill ${className}" style="--og-pill: ${item.color}">${icon(item.icon)}<span>${item.label}</span></span>`;
}

/** Unter dem Titel: bei Aufgaben Dringlichkeit und Status als Pillen, sonst die Art. */
function subMarkup(entry) {
  if (entry.type !== "aufgabe") return `<span class="og-row-sub">${rowSubLabels[entry.type] || typeSingular(entry.type)}</span>`;
  return `<span class="og-row-pills">${pillMarkup(taskPriorityOf(entry.priority), "is-priority")}${pillMarkup(statusOf(entry), "is-status")}</span>`;
}

/** Eine Zeile (.swipe mit data-entry): Titel und Zusatz in einen Block, Aufgaben bekommen vorn die runde Checkbox. */
export function tagOgRow(row) {
  const entry = findEntry(Number(row.dataset.entry));
  if (!entry || row.dataset.ogType) return;
  row.dataset.ogType = entry.type;
  const line = row.querySelector(".entry-row");
  const title = line?.querySelector(".row-title");
  if (!line || !title) return;
  const text = document.createElement("span");
  text.className = "og-row-text";
  title.before(text);
  text.append(title);
  text.insertAdjacentHTML("beforeend", subMarkup(entry));
  line.querySelector(".entry-type use")?.setAttribute("href", `#icon-${ogEntryIcon(entry)}`);
  if (entry.type === "aufgabe") {
    const state = isTaskDone(entry) ? " is-on" : "";
    line.insertAdjacentHTML("afterbegin", `<span class="og-row-check${state}" data-og-check role="checkbox" aria-checked="${state ? "true" : "false"}" aria-label="${labels.done}">${icon("check")}</span>`);
  }
}

/** Alle noch nicht ausgezeichneten Zeilen in einem Behälter auszeichnen. */
export function tagOgRows(container) {
  container.querySelectorAll(".swipe[data-entry]:not([data-og-type])").forEach(tagOgRow);
}

/** Einen Behälter beobachten, dessen Liste bei jeder Änderung neu gezeichnet wird. */
export function watchOgRows(container) {
  new MutationObserver(() => tagOgRows(container)).observe(container, { childList: true, subtree: true });
}

/** Die runde Checkbox löst denselben Wisch-Knopf „Abhaken“ aus, bevor die Zeile sich öffnet. */
export function bindOgCheck(container) {
  container.addEventListener(
    "click",
    (event) => {
      const check = event.target.closest("[data-og-check]");
      if (!check) return;
      event.stopPropagation();
      event.preventDefault();
      check.closest(".swipe")?.querySelector('[data-swipe="done"]')?.click();
    },
    true
  );
}
