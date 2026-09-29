/*
 * Die Karte der Suchseite in der rechten Spalte am Desktop: die Vorschau des
 * markierten Treffers — Art, Titel, Ablageort, Datum, der Anfang des Texts und
 * „Öffnen“. Markiert ist der Treffer unter der Maus oder mit dem
 * Tastatur-Fokus; sonst der erste der Liste. Ein Wechsel der Markierung wird
 * über events.contextChanged gemeldet, die Spalte zeichnet sich dann neu.
 * Geladen über registerRailCards in src/main.js.
 * Pfad: src/features/search/search-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * excerptLength -> wie viele Zeichen vom Text die Vorschau höchstens zeigt
 *
 * Aussehen in styles/desk-rail-views.css (.rail-preview, .rail-facts), die
 * Tönung der markierten Zeile ebenda (.search-row.is-marked).
 */

import { emit, events } from "../../core/bus.js";
import { dayKey } from "../../core/dates.js";
import { el } from "../../core/dom.js";
import { formatNumber, shortDay } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { overviewPages, typeIcon, typeLabel } from "../../data/config.js";
import { entriesOf, entryTime, findEntry, findWorkspace, pageCount, placesLabel, workspaceIcon } from "../../data/queries.js";
import { workspaceRef } from "../../data/refs.js";
import { cardHead, railTitle } from "../../ui/rail-parts.js";
import { openEntryOrFile, openTarget } from "../../ui/router.js";

const excerptLength = 220;

/* Die Zeilen, die etwas öffnen — nur sie lassen sich markieren. */
const ROWS = "[data-open-entry], [data-open-workspace], [data-open-overview]";

/* Der markierte Treffer als { kind, id }, oder null: dann gilt der erste der Liste. */
let marked = null;

/* Art und Nummer einer Ergebniszeile, aus ihren data-Angaben. */
function targetOf(row) {
  if (row.dataset.openEntry) return { kind: "entry", id: row.dataset.openEntry };
  if (row.dataset.openWorkspace) return { kind: "workspace", id: row.dataset.openWorkspace };
  return { kind: "overview", id: row.dataset.openOverview };
}

/* Zeile markieren: getönt in der Liste und in der Spalte als Vorschau. */
function mark(row) {
  const next = targetOf(row);
  if (marked && marked.kind === next.kind && marked.id === next.id) return;
  el("view-search").querySelector(".search-row.is-marked")?.classList.remove("is-marked");
  row.classList.add("is-marked");
  marked = next;
  emit(events.contextChanged);
}

function onPointer(event) {
  const row = event.target.closest?.(ROWS);
  if (row) mark(row);
}

/* Der Treffer, den die Vorschau zeigt: der markierte, wenn er noch in der Liste steht. */
function shownTarget() {
  const rows = [...el("search-results").querySelectorAll(ROWS)];
  if (!rows.length) return null;
  const stillThere = marked && rows.some((row) => {
    const target = targetOf(row);
    return target.kind === marked.kind && target.id === marked.id;
  });
  return stillThere ? marked : targetOf(rows[0]);
}

/* Der Anfang des Texts ohne Markdown-Zeichen, auf eine Länge gekürzt. */
function excerptOf(entry) {
  if (entry.type === "zeichnung") return "";
  const plain = String(entry.body || "")
    .replace(/[#>*_`~[\]()|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > excerptLength ? `${plain.slice(0, excerptLength).trim()} …` : plain;
}

/* Zwei Spalten „Angabe | Wert“; leere Werte fallen weg. */
function facts(pairs) {
  const rows = pairs
    .filter(([, value]) => value)
    .map(([label, value]) => `<span class="rail-muted">${label}</span><span>${escapeHtml(value)}</span>`)
    .join("");
  return rows ? `<div class="rail-facts">${rows}</div>` : "";
}

function entryPreview(entry) {
  const when = entry.date ? [shortDay(entry.date), entry.type === "termin" ? entryTime(entry) : ""].filter(Boolean).join(", ") : "";
  const created = entry.createdAt ? shortDay(dayKey(new Date(entry.createdAt))) : "";
  const excerpt = excerptOf(entry);
  return {
    icon: typeIcon(entry.type),
    title: railTitle(entry),
    body:
      facts([
        ["Typ", typeLabel(entry.type)],
        ["Wann", when],
        ["Ablageort", placesLabel(entry)],
        ["Angelegt", created],
      ]) + (excerpt ? `<p class="rail-preview-text">${escapeHtml(excerpt)}</p>` : ""),
  };
}

function workspacePreview(workspace) {
  const count = entriesOf(workspaceRef(workspace.id)).length;
  return {
    icon: workspaceIcon(workspace),
    title: escapeHtml(workspace.name || "Ohne Namen"),
    body: facts([["Typ", "Arbeitsbereich"], ["Einträge", formatNumber(count)]]),
  };
}

function overviewPreview(page) {
  return {
    icon: page.icon,
    title: escapeHtml(page.title),
    body: facts([["Typ", "Sammlung"], ["Einträge", formatNumber(pageCount(page))]]),
  };
}

/* Die Vorschau zum Treffer; null, wenn es ihn nicht mehr gibt. */
function previewOf(target) {
  if (target.kind === "entry") {
    const entry = findEntry(target.id);
    return entry ? entryPreview(entry) : null;
  }
  if (target.kind === "workspace") {
    const workspace = findWorkspace(target.id);
    return workspace ? workspacePreview(workspace) : null;
  }
  const page = overviewPages[target.id];
  return page ? overviewPreview(page) : null;
}

/** Karte „Vorschau“: der markierte Treffer, ohne Treffer ein kurzer Hinweis. */
function previewCard() {
  const target = shownTarget();
  const preview = target && previewOf(target);
  if (!preview) return `${cardHead("Vorschau")}<p class="rail-empty">Treffer erscheinen hier, sobald du suchst.</p>`;
  const open = `<button class="rail-pill rail-head-end" type="button" data-rail="search-open" data-kind="${target.kind}" data-id="${escapeHtml(target.id)}">Öffnen${icon("arrow-right")}</button>`;
  return `
    ${cardHead("Vorschau", open)}
    <div class="rail-preview">
      ${icon(preview.icon, "rail-preview-icon")}
      <h3 class="rail-preview-title">${preview.title}</h3>
    </div>
    ${preview.body}`;
}

/** Die Plätze der Spalte auf der Suchseite (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [{ name: "preview", className: "rail-card", render: previewCard }];

/** „Öffnen“: derselbe Weg wie ein Klick auf die Zeile in der Liste. */
export const railActions = {
  "search-open": (button) => {
    const { kind, id } = button.dataset;
    if (kind === "entry") openEntryOrFile(id);
    else openTarget(kind, id);
  },
};

/* Einmal beim Laden: Maus und Tastatur-Fokus markieren Treffer. */
el("view-search").addEventListener("pointerover", onPointer);
el("view-search").addEventListener("focusin", onPointer);
