/*
 * Seitenfenster › Seite, Projekt, Arbeitsbereich: erst eine Liste mit
 * Suchfeld, dann die gewählte Seite zum Lesen neben der eigenen — Notizen mit
 * ihren Bausteinen, Zeichnungen als Bild, Medien als Datei, Projekte und
 * Arbeitsbereiche mit allem, was darin liegt (ein Klick zeigt den Eintrag,
 * „Zurück“ oben führt wieder hinaus). Links in Karten öffnen im Browser des
 * Fensters. Bearbeitet wird im Hauptfenster: „Öffnen“ bringt die Seite dorthin.
 * Pfad: src/shell/desk-side-pages.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * LIST_LIMIT -> wie viele Zeilen die Liste höchstens zeigt (die Suche findet alle)
 * kinds      -> je Art: Titel des Fensters, Platzhalter im Suchfeld, Text ohne Treffer
 *
 * Aussehen steht in styles/desk-side-views.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { noHistoryForm } from "../core/no-history.js";
import { typeSingular } from "../data/config.js";
import { hostOf } from "../data/link-kinds.js";
import { embedKinds, parseBlocks } from "../data/note-blocks.js";
import { entriesOf, findEntry, findWorkspace, placesLabel, workspaceIcon, workspaceLabel } from "../data/queries.js";
import { entryRef, workspaceRef } from "../data/refs.js";
import { state as data } from "../data/state.js";
import { thumbOf } from "../data/thumbs.js";
import { openEntry, openTarget } from "../ui/router.js";
import { entryGlyph } from "../ui/rows.js";
import { showMediaEntry } from "./desk-side-files.js";

const LIST_LIMIT = 80;

const kinds = {
  entry: { title: "Seite", search: "Seite suchen", none: "Keine Seite gefunden" },
  project: { title: "Projekt", search: "Projekt suchen", none: "Kein Projekt gefunden" },
  workspace: { title: "Arbeitsbereich", search: "Arbeitsbereich suchen", none: "Kein Arbeitsbereich gefunden" },
};

/* Das Suchwort gilt nur, solange die Liste offen ist. */
let query = "";

const byNewest = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);

/* Was zur Liste einer Art gehört, neueste zuerst. */
function candidates(kind) {
  if (kind === "workspace") return data.workspaces.filter((workspace) => !workspace.archived);
  const projects = kind === "project";
  return data.entries.filter((entry) => !entry.archived && (entry.type === "projekt") === projects).sort(byNewest);
}

function labelOf(kind, item) {
  return kind === "workspace" ? workspaceLabel(item) : item.title || "Ohne Titel";
}

/* Eine Zeile: Icon (bei Zeichnung und Foto die Vorschau), Name, darunter Art und Ort. */
function entryRowMarkup(entry) {
  return `
    <button class="side-row" type="button" data-side-pick="${entry.id}">
      <span class="side-row-glyph">${entryGlyph(entry)}</span>
      <span class="side-row-text"><span class="side-row-title">${escapeHtml(entry.title || "Ohne Titel")}</span><span class="side-row-note">${escapeHtml(`${typeSingular(entry.type)} · ${placesLabel(entry)}`)}</span></span>
    </button>`;
}

function workspaceRowMarkup(workspace) {
  const count = entriesOf(workspaceRef(workspace.id)).length;
  return `
    <button class="side-row" type="button" data-side-pick="${workspace.id}">
      <span class="side-row-glyph">${icon(workspaceIcon(workspace), "entry-type")}</span>
      <span class="side-row-text"><span class="side-row-title">${escapeHtml(workspaceLabel(workspace))}</span><span class="side-row-note">${count === 1 ? "1 Eintrag" : `${count} Einträge`}</span></span>
    </button>`;
}

function listRows(kind) {
  const needle = query.trim().toLowerCase();
  const items = candidates(kind).filter((item) => !needle || labelOf(kind, item).toLowerCase().includes(needle));
  if (!items.length) return `<p class="side-note">${kinds[kind].none}</p>`;
  const rows = items.slice(0, LIST_LIMIT);
  return rows.map((item) => (kind === "workspace" ? workspaceRowMarkup(item) : entryRowMarkup(item))).join("");
}

function listMarkup(kind) {
  return `
    <div class="side-search">
      ${icon("search", "side-address-icon")}
      <input class="side-address-input" type="text" form="${noHistoryForm}" enterkeyhint="search" placeholder="${kinds[kind].search}" aria-label="${kinds[kind].search}" value="${escapeHtml(query)}" />
    </div>
    <div class="side-rows" data-side-list>${listRows(kind)}</div>`;
}

/* Ein Baustein zum Lesen; Karten mit Link öffnen im Browser des Fensters. */
function blockMarkup(block) {
  const text = escapeHtml(block.text);
  if (embedKinds.includes(block.kind)) {
    const glyph = block.kind === "video" ? "video" : block.kind === "place" ? "pin" : "globe";
    return `<button class="side-doc-link" type="button" data-side-url="${escapeHtml(block.url)}">${icon(glyph)}<span>${escapeHtml(block.name || hostOf(block.url))}</span></button>`;
  }
  if (block.kind === "divider") return '<hr class="side-doc-rule" />';
  if (block.kind === "check") return `<p class="side-doc-item${block.done ? " is-done" : ""}">${icon(block.done ? "check-circle" : "circle")}<span>${text}</span></p>`;
  if (block.kind === "bullet" || block.kind === "number") return `<p class="side-doc-item"><span class="side-doc-dot" aria-hidden="true">•</span><span>${text}</span></p>`;
  return text ? `<p class="side-doc-text">${text}</p>` : "";
}

function docMarkup(entry) {
  if (entry.type === "zeichnung") {
    const thumb = thumbOf(entry.id);
    return thumb ? `<img class="side-media side-drawing" src="${thumb}" alt="Zeichnung ${escapeHtml(entry.title || "")}" />` : '<p class="side-note">Noch nichts gezeichnet.</p>';
  }
  if (entry.type === "medien" && entry.media) return '<div class="side-preview" data-preview></div>';
  const blocks = parseBlocks(entry.body).map(blockMarkup).join("");
  return blocks ? `<div class="side-doc">${blocks}</div>` : "";
}

function headMarkup(glyph, title, meta, openAttr) {
  return `
    <div class="side-preview-head">
      <span class="side-row-glyph">${glyph}</span>
      <span class="side-row-text"><span class="side-preview-title">${escapeHtml(title)}</span><span class="side-row-note">${escapeHtml(meta)}</span></span>
      <button class="side-pill" type="button" ${openAttr}>${icon("external")}Öffnen</button>
    </div>`;
}

/* Die Einträge in einem Projekt oder Arbeitsbereich. */
function childrenMarkup(ref) {
  const children = entriesOf(ref).sort(byNewest);
  if (!children.length) return '<p class="side-note">Hier liegt noch nichts.</p>';
  return `<p class="side-section">Darin</p><div class="side-rows">${children.map(entryRowMarkup).join("")}</div>`;
}

function entryPreview(entry) {
  const doc = docMarkup(entry);
  const children = entry.type === "projekt" ? childrenMarkup(entryRef(entry.id)) : "";
  const empty = !doc && !children ? '<p class="side-note">Noch kein Inhalt.</p>' : "";
  const meta = `${typeSingular(entry.type)} · ${placesLabel(entry)}`;
  return headMarkup(entryGlyph(entry), entry.title || "Ohne Titel", meta, `data-side-open="entry:${entry.id}"`) + doc + children + empty;
}

function workspacePreview(workspace) {
  const ref = workspaceRef(workspace.id);
  return headMarkup(icon(workspaceIcon(workspace), "entry-type"), workspaceLabel(workspace), "Arbeitsbereich", `data-side-open="workspace:${workspace.id}"`) + childrenMarkup(ref);
}

/* Was gerade gezeigt wird: ein Eintrag aus dem Inneren, sonst die Wahl selbst — oder nichts. */
function shownItem(kind, state) {
  const inner = state.inner ? findEntry(state.inner) : null;
  if (inner && !inner.archived) return { entry: inner };
  const id = state.picked?.[kind];
  if (id == null) return null;
  if (kind === "workspace") {
    const workspace = findWorkspace(id);
    return workspace && !workspace.archived ? { workspace } : null;
  }
  const entry = findEntry(id);
  return entry && !entry.archived ? { entry } : null;
}

function makeView(kind) {
  return {
    title: () => kinds[kind].title,
    markup(state) {
      const item = shownItem(kind, state);
      if (!item) return listMarkup(kind);
      return item.workspace ? workspacePreview(item.workspace) : entryPreview(item.entry);
    },
    /* Umbenannt, abgehakt, verschoben: Liste und Vorschau zeigen gleich den neuen Stand —
       nur eine offene Datei bleibt stehen, sonst begänne ein Video von vorn */
    live(state) {
      const entry = shownItem(kind, state)?.entry;
      return !(entry && entry.type === "medien" && entry.media);
    },
    enter(body, ctx) {
      const item = shownItem(kind, ctx.state);
      const box = body.querySelector("[data-preview]");
      if (box && item?.entry) showMediaEntry(box, item.entry);
      if (!item) body.querySelector(".side-address-input")?.focus({ preventScroll: true });
    },
    back(ctx) {
      if (ctx.state.inner) ctx.show(kind, { inner: null });
      else if (shownItem(kind, ctx.state)) ctx.show(kind, { picked: { ...ctx.state.picked, [kind]: null } });
      else return false;
      return true;
    },
    handle(event, ctx) {
      if (event.type === "input" && event.target.matches(".side-address-input")) {
        query = event.target.value;
        const list = event.currentTarget.querySelector("[data-side-list]");
        if (list) list.innerHTML = listRows(kind);
        return;
      }
      if (event.type !== "click") return;
      onClick(event, ctx, kind);
    },
  };
}

function onClick(event, ctx, kind) {
  const url = event.target.closest("[data-side-url]")?.dataset.sideUrl;
  if (url) {
    ctx.show("browser", { url });
    return;
  }
  const open = event.target.closest("[data-side-open]")?.dataset.sideOpen;
  if (open) {
    const [target, id] = open.split(":");
    if (target === "workspace") openTarget("workspace", Number(id));
    else openEntry(Number(id));
    return;
  }
  const pick = event.target.closest("[data-side-pick]")?.dataset.sidePick;
  if (pick == null) return;
  /* In einer Wahl (Projekt, Arbeitsbereich) öffnet ein Klick den Eintrag darin */
  if (shownItem(kind, ctx.state)) ctx.show(kind, { inner: Number(pick) });
  else {
    query = "";
    ctx.show(kind, { picked: { ...ctx.state.picked, [kind]: Number(pick) }, inner: null });
  }
}

/** Die drei Ansichten für src/shell/desk-side.js. */
export const pageViews = { entry: makeView("entry"), project: makeView("project"), workspace: makeView("workspace") };
