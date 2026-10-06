/*
 * Die Text-Einträge als Markdown — zum Lesen, Kopieren und für den Import
 * auf einem anderen Gerät (src/data/transfer-markdown-read.js liest genau
 * diese Form zurück). Zeichnungen und Medien bleiben draußen: ihre Striche
 * und Dateien passen nicht in Text; die Datei nennt am Ende, wie viele fehlen.
 *
 * Aufbau je Eintrag:
 *
 *   ## Titel ^e20                       <- die Marke ^e20 ist die Nummer des Eintrags,
 *   typ: aufgabe · status: offen · …       ^w3 die eines Arbeitsbereichs; der Import
 *   ort: Haushalt ^w2                      erkennt daran Orte und Verknüpfungen
 *   verknüpft: Exposé ^e44, Plan ^e63      auch dann, wenn zwei Einträge gleich heißen
 *
 *   der Inhalt, so wie er gespeichert ist (Haken, Listen, Trennlinie);
 *   Karten (::link …) stehen als [Name](URL)
 *
 * Arbeitsbereiche stehen genauso da, mit „typ: arbeitsbereich“ und ihrem Tab.
 * Pfad: src/data/transfer-markdown.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * textTypes -> welche Eintragstypen in den Text-Export gehören
 * words     -> die Schlüsselwörter der Angaben-Zeilen (der Leser kennt dieselben)
 */

import { dayKey, pad2 } from "../core/dates.js";
import { readableBody } from "./note-blocks.js";

export const textTypes = ["notiz", "aufgabe", "termin", "projekt", "dokument", "lesezeichen"];

export const words = {
  type: "typ",
  status: "status",
  priority: "dringlichkeit",
  due: "fällig",
  date: "datum",
  created: "erstellt",
  favorite: "favorit",
  archived: "archiviert",
  place: "ort",
  links: "verknüpft",
  tab: "tab",
  workspace: "arbeitsbereich",
};

/* Marke eines Eintrags („^e20“) oder Arbeitsbereichs („^w3“) */
export function entryMark(id) {
  return `^e${id}`;
}

export function workspaceMark(id) {
  return `^w${id}`;
}

/* „2026-10-06“ bzw. „2026-10-06 17:00“ */
function dayAndTime(entry) {
  if (!entry.date) return "";
  return entry.time ? `${entry.date} ${entry.time}` : entry.date;
}

function stampOf(ms) {
  if (!Number.isFinite(ms)) return "";
  const date = new Date(ms);
  return `${dayKey(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/* Eine Überschrift im Inhalt würde als neuer Eintrag gelesen — ein Backslash davor schützt sie */
function escapeBody(text) {
  return String(text || "")
    .split("\n")
    .map((line) => (/^#{1,6} /.test(line) ? `\\${line}` : line))
    .join("\n");
}

function titleLine(title, mark) {
  const clean = String(title || "").replace(/\s+/g, " ").trim() || "Ohne Titel";
  return `## ${clean} ${mark}`;
}

/* Name plus Marke eines Orts oder verknüpften Eintrags, oder leer, wenn es ihn nicht mehr gibt */
function refLabel(ref, lookup) {
  const [kind, id] = String(ref).split(":");
  const target = kind === "w" ? lookup.workspaces.get(String(id)) : lookup.entries.get(String(id));
  if (!target) return "";
  const name = String((kind === "w" ? target.name || target.placeholder : target.title) || "").replace(/\s+/g, " ").trim();
  return `${name} ${kind === "w" ? workspaceMark(id) : entryMark(id)}`;
}

function metaLine(parts) {
  const clean = parts.filter(Boolean);
  return clean.length ? clean.join(" · ") : "";
}

function workspaceBlock(workspace, tabs) {
  const tab = tabs.get(String(workspace.tab));
  const lines = [
    titleLine(workspace.name || workspace.placeholder, workspaceMark(workspace.id)),
    metaLine([
      `${words.type}: ${words.workspace}`,
      tab ? `${words.tab}: ${String(tab.name || tab.placeholder || "").trim()}` : "",
      workspace.createdAt ? `${words.created}: ${stampOf(workspace.createdAt)}` : "",
      workspace.favorite ? words.favorite : "",
      workspace.archived ? words.archived : "",
    ]),
  ];
  const body = escapeBody(workspace.body).replace(/\s+$/, "");
  if (body) lines.push("", body);
  return lines.join("\n");
}

function entryBlock(entry, lookup) {
  const dueWord = entry.type === "aufgabe" || entry.type === "projekt" ? words.due : words.date;
  const lines = [
    titleLine(entry.title, entryMark(entry.id)),
    metaLine([
      `${words.type}: ${entry.type}`,
      entry.status ? `${words.status}: ${entry.status}` : "",
      entry.priority ? `${words.priority}: ${entry.priority}` : "",
      entry.date ? `${dueWord}: ${dayAndTime(entry)}` : "",
      entry.createdAt ? `${words.created}: ${stampOf(entry.createdAt)}` : "",
      entry.favorite ? words.favorite : "",
      entry.archived ? words.archived : "",
    ]),
  ];
  const places = (entry.places || []).map((ref) => refLabel(ref, lookup)).filter(Boolean);
  if (places.length) lines.push(`${words.place}: ${places.join(", ")}`);
  const links = (entry.links || []).map((id) => refLabel(`e:${id}`, lookup)).filter(Boolean);
  if (links.length) lines.push(`${words.links}: ${links.join(", ")}`);
  const body = escapeBody(readableBody(entry.body)).replace(/\s+$/, "");
  if (body) lines.push("", body);
  return lines.join("\n");
}

/* Was nicht in den Text passt, als Satz: „2 Zeichnungen, 4 Medien“ */
function skippedNote(entries) {
  const drawings = entries.filter((entry) => entry.type === "zeichnung").length;
  const media = entries.filter((entry) => entry.type === "medien").length;
  const parts = [];
  if (drawings) parts.push(`${drawings} ${drawings === 1 ? "Zeichnung" : "Zeichnungen"}`);
  if (media) parts.push(`${media} ${media === 1 ? "Medium" : "Medien"}`);
  if (!parts.length) return "";
  return `_Nicht enthalten: ${parts.join(", ")} — die stecken nur in der Paralist-Datei oder im ZIP._`;
}

/**
 * Den ganzen Stand als Markdown. Zuerst die Arbeitsbereiche, dann Projekte,
 * dann alle übrigen Text-Einträge in der Reihenfolge ihres Anlegens.
 * @param state ein gespeicherter Zustand ({ tabs, workspaces, entries })
 */
export function stateToMarkdown(state) {
  const tabs = new Map((state.tabs || []).map((tab) => [String(tab.id), tab]));
  const workspaces = state.workspaces || [];
  const entries = state.entries || [];
  const lookup = {
    workspaces: new Map(workspaces.map((workspace) => [String(workspace.id), workspace])),
    entries: new Map(entries.map((entry) => [String(entry.id), entry])),
  };
  const byCreated = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
  const textEntries = entries.filter((entry) => textTypes.includes(entry.type));
  const projects = textEntries.filter((entry) => entry.type === "projekt").sort(byCreated);
  const others = textEntries.filter((entry) => entry.type !== "projekt").sort(byCreated);

  const today = new Date();
  const blocks = [
    `# Paralist · Export ${pad2(today.getDate())}.${pad2(today.getMonth() + 1)}.${today.getFullYear()}`,
    ...workspaces.map((workspace) => workspaceBlock(workspace, tabs)),
    ...projects.map((entry) => entryBlock(entry, lookup)),
    ...others.map((entry) => entryBlock(entry, lookup)),
  ];
  const note = skippedNote(entries);
  if (note) blocks.push(note);
  return `${blocks.join("\n\n")}\n`;
}

/** Wie viele Einträge in den Text-Export kämen. */
export function textEntryCount(state) {
  return (state.entries || []).filter((entry) => textTypes.includes(entry.type)).length;
}
