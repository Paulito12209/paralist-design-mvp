/*
 * Die Karten eines Arbeitsbereichs in der rechten Spalte am Desktop (ab
 * 1280px): „Details“ — dieselben Kennzahlen und Abschnitte wie die Karte
 * unter dem Text (workspace-details.js), die dort solange entfällt —,
 * „Zuletzt geändert“ und „Gestaltung“ (Cover, Favorit). Nur auf der Seite eines Arbeitsbereichs —
 * Sammlungen wie Eingang oder Favoriten teilen sich die Ansicht „page“ mit
 * ihm und behalten die Karten der Übersicht (railApplies). Geladen über
 * registerRailCards in src/main.js.
 * Pfad: src/features/overview/workspace-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * recentLimit -> wie viele Einträge „Zuletzt geändert“ zeigt
 *
 * Aussehen in styles/desk-rail-views.css und styles/entry-desk.css (Gestaltung).
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { relativeTime } from "../../core/format.js";
import { typeIcon } from "../../data/config.js";
import { setCover, toggleFavorite } from "../../data/mutations.js";
import { entriesOf, findWorkspace } from "../../data/queries.js";
import { workspaceRef } from "../../data/refs.js";
import { ui } from "../../data/state.js";
import { workspaceFacts } from "../../data/workspace-facts.js";
import { detailsMarkup, handleCardClick } from "../../ui/details-card.js";
import { cardHead, railTitle } from "../../ui/rail-parts.js";

const recentLimit = 5;

function currentWorkspace() {
  const page = ui.currentPage;
  return page && page.isWorkspace ? findWorkspace(page.workspaceId) : null;
}

/** Nur auf der Seite eines Arbeitsbereichs gelten diese Karten. */
export function railApplies() {
  return Boolean(currentWorkspace());
}

/** Karte „Details“: dieselben Kennzahlen und Abschnitte wie die Karte unter dem Text. */
function detailsCard() {
  const workspace = currentWorkspace();
  if (!workspace) return "";
  return `${cardHead("Details")}<div class="rail-entry-details">${detailsMarkup(workspaceFacts(workspace))}</div>`;
}

/** Karte „Zuletzt geändert“ — leer (und ausgeblendet), solange nichts darin liegt. */
function recentCard() {
  const workspace = currentWorkspace();
  if (!workspace) return "";
  const stamp = (entry) => entry.editedAt || entry.createdAt || 0;
  const recent = entriesOf(workspaceRef(workspace.id))
    .sort((a, b) => stamp(b) - stamp(a))
    .slice(0, recentLimit);
  if (!recent.length) return "";
  const rows = recent
    .map(
      (entry) => `
      <li>
        <button class="rail-day-row" type="button" data-rail="entry" data-id="${escapeHtml(entry.id)}">
          ${icon(typeIcon(entry.type))}<span class="rail-day-title">${railTitle(entry)}</span>
          <span class="rail-day-time">${escapeHtml(relativeTime(stamp(entry)))}</span>
        </button>
      </li>`
    )
    .join("");
  return `${cardHead("Zuletzt geändert")}<ul class="rail-day-list">${rows}</ul>`;
}

/** Karte „Gestaltung“: Cover und Favorit. */
function designCard() {
  const workspace = currentWorkspace();
  if (!workspace) return "";
  return `
    ${cardHead("Gestaltung")}
    <div class="rail-entry-design">
      <button class="rail-pill${workspace.cover ? " is-on" : ""}" type="button" data-rail="ws-cover" aria-pressed="${Boolean(workspace.cover)}">${icon("image")}Cover</button>
      <button class="rail-pill${workspace.favorite ? " is-on" : ""}" type="button" data-rail="ws-favorite" aria-pressed="${Boolean(workspace.favorite)}">${icon(workspace.favorite ? "star" : "star-outline")}Favorit</button>
    </div>`;
}

/** Die Plätze der Spalte auf der Seite eines Arbeitsbereichs (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [
  { name: "details", className: "rail-card", render: detailsCard },
  { name: "recent", className: "rail-card", render: recentCard },
  { name: "design", className: "rail-card", render: designCard },
];

/** Cover und Favorit — beides speichert und meldet die Änderung selbst. */
export const railActions = {
  "ws-cover": () => {
    const workspace = currentWorkspace();
    if (workspace) setCover(workspace, !workspace.cover);
  },
  "ws-favorite": () => {
    const workspace = currentWorkspace();
    if (workspace) toggleFavorite(workspace);
  },
};

/** Tipps auf die Kennzahlen und die Zeile „Erinnerung“ in „Details“ — wie in der Karte unter dem Text. */
export function railClick(event) {
  const workspace = currentWorkspace();
  if (!workspace || !event.target.closest(".rail-entry-details")) return false;
  /* „Einträge“: derselbe Weg wie ein Klick auf die Pille, sie zeichnet die Seite passend neu */
  const showEntries = () => dom.pageBody.querySelector('[data-page-pill="links"]')?.click();
  return handleCardClick(event, workspace, { actions: { entries: showEntries } });
}
