/*
 * Markdown zurück in Einträge lesen — die Gegenseite von
 * src/data/transfer-markdown.js. Liest den Export der App mit seinen Marken
 * (^e20, ^w3) und erkennt daran Orte und Verknüpfungen; eine fremde
 * Markdown-Datei ohne Marken geht auch: jede Überschrift „## …“ (oder „# …“,
 * wenn es keine zweite Ebene gibt) wird eine Notiz, ihr Text der Inhalt. Ohne
 * jede Überschrift wird der ganze Text eine Notiz mit der ersten Zeile als Titel.
 *
 * Ergebnis ist die Zwischenform, die src/data/transfer-import.js übernimmt:
 * Orte und Verknüpfungen stehen noch als { kind, id, name } bzw. { id, title }
 * — erst beim Übernehmen wird daraus ein Verweis auf etwas Vorhandenes.
 * Pfad: src/data/transfer-markdown-read.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * typeNames    -> wie ein Typ in der Angaben-Zeile heißen darf (Kürzel und Namen)
 * maxTitle     -> längster Titel, der aus der ersten Zeile eines Texts ohne Überschrift wird
 */

import { statusListFor, taskPriorities } from "./config-tasks.js";
import { embedKindOf } from "./bookmarks.js";
import { normalizeUrl } from "./link-kinds.js";
import { blockLine, makeBlock } from "./note-blocks.js";
import { words } from "./transfer-markdown.js";

const typeNames = {
  notiz: "notiz",
  note: "notiz",
  aufgabe: "aufgabe",
  task: "aufgabe",
  termin: "termin",
  projekt: "projekt",
  projekte: "projekt",
  dokument: "dokument",
  lesezeichen: "lesezeichen",
  arbeitsbereich: words.workspace,
  /* Striche und Dateien kommen nicht aus Text — ein Rest davon wird Notiz */
  zeichnung: "notiz",
  medien: "notiz",
};
const maxTitle = 80;

const flagWords = [words.favorite, words.archived];
const metaKeys = [words.type, words.status, words.priority, words.due, words.date, words.created, words.tab, words.place, words.links];

/* „Titel ^e20“ -> { title, kind: "e", id: "20" }; ohne Marke kind null */
function splitMark(text) {
  const match = /^(.*?)\s*\^([ew])(\d+)\s*$/.exec(text);
  if (!match) return { title: text.trim(), kind: null, id: null };
  return { title: match[1].trim(), kind: match[2], id: match[3] };
}

/* „Haushalt ^w2, Umzug ^e20“ -> Liste von { kind, id, name } */
function splitRefs(text) {
  /* Mit Marken zählt die Marke als Ende eines Namens — so bleibt ein Komma im Namen stehen */
  const marked = [...text.matchAll(/(.*?)\s*\^([ew])(\d+)\s*(?:,\s*|$)/g)];
  if (marked.length) return marked.map((match) => ({ kind: match[2], id: match[3], name: match[1].trim() }));
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((name) => ({ kind: null, id: null, name }));
}

/* „2026-10-06 17:00“ oder „06.10.2026“ -> { date, time } */
function parseWhen(text) {
  let match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(text.trim());
  if (match) return { date: `${match[1]}-${match[2]}-${match[3]}`, time: match[4] || "" };
  match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?: (\d{2}:\d{2}))?/.exec(text.trim());
  if (match) return { date: `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`, time: match[4] || "" };
  return null;
}

/* Ist diese Zeile eine Angaben-Zeile („typ: …“, „ort: …“, „favorit“)? */
function isMetaLine(line) {
  if (!line.trim()) return false;
  return line.split(" · ").every((part) => {
    const trimmed = part.trim().toLowerCase();
    if (flagWords.includes(trimmed)) return true;
    const key = /^([^\s:]+):\s/.exec(trimmed);
    return Boolean(key && metaKeys.includes(key[1]));
  });
}

/* Die Angaben einer Zeile in den Eintrag schreiben */
function applyMeta(item, line) {
  line.split(" · ").forEach((part) => {
    const trimmed = part.trim();
    const lower = trimmed.toLowerCase();
    if (lower === words.favorite) item.favorite = true;
    if (lower === words.archived) item.archived = true;
    const match = /^([^\s:]+):\s+(.*)$/.exec(trimmed);
    if (!match) return;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === words.type) item.type = typeNames[value.toLowerCase()] || item.type;
    else if (key === words.status) item.status = value;
    else if (key === words.priority) item.priority = value;
    else if (key === words.due || key === words.date) Object.assign(item, parseWhen(value) || {});
    else if (key === words.created) {
      const when = parseWhen(value);
      if (when) item.createdAt = new Date(`${when.date}T${when.time || "12:00"}`).getTime();
    } else if (key === words.tab) item.tabName = value;
    else if (key === words.place) item.placeRefs = splitRefs(value);
    else if (key === words.links) item.linkRefs = splitRefs(value);
  });
}

/* „[Name](URL)“ als ganze Zeile wird wieder eine Karte; bei Lesezeichen auch eine nackte Adresse */
function bodyLine(line, type) {
  const unescaped = line.replace(/^\\(#)/, "$1");
  const link = /^\[([^\]]*)\]\((\S+)\)$/.exec(unescaped.trim());
  if (link) return blockLine(makeBlock(embedKindOf(link[2]), { url: link[2], name: link[1] }));
  if (type === "lesezeichen") {
    const url = normalizeUrl(unescaped.trim());
    if (url && !/\s/.test(unescaped.trim())) return blockLine(makeBlock(embedKindOf(url), { url }));
  }
  return unescaped;
}

/* Leere Zeilen am Anfang und Ende weg */
function trimLines(lines) {
  const copy = [...lines];
  while (copy.length && !copy[0].trim()) copy.shift();
  while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
  return copy;
}

/* Status und Dringlichkeit nur behalten, wenn es sie für den Typ gibt */
function cleanFields(item) {
  if (item.status && !statusListFor(item.type).some((status) => status.id === item.status)) delete item.status;
  if (item.priority && !taskPriorities.some((priority) => priority.id === item.priority)) delete item.priority;
  return item;
}

/* Einen Block (Überschrift plus Zeilen bis zur nächsten) in einen Eintrag oder Arbeitsbereich wandeln */
function readBlock(heading, lines, index) {
  const mark = splitMark(heading);
  const item = {
    id: mark.id ? `${mark.kind}${mark.id}` : `n${index}`,
    type: "notiz",
    title: mark.title.slice(0, maxTitle * 3) || "Ohne Titel",
    body: "",
    placeRefs: [],
    linkRefs: [],
    favorite: false,
    archived: false,
  };
  if (mark.kind === "w") item.type = words.workspace;
  let at = 0;
  while (at < lines.length && isMetaLine(lines[at])) {
    applyMeta(item, lines[at]);
    at += 1;
  }
  const body = trimLines(lines.slice(at));
  item.body = body.map((line) => bodyLine(line, item.type)).join("\n");
  return cleanFields(item);
}

/**
 * Markdown lesen.
 * @returns { workspaces, entries } in der Zwischenform (siehe oben); beides leer, wenn nichts darin steht
 */
export function parseMarkdown(text) {
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  const level = lines.some((line) => /^## /.test(line)) ? 2 : lines.some((line) => /^# /.test(line)) ? 1 : 0;
  const items = [];

  if (!level) {
    const content = trimLines(lines);
    if (!content.length) return { workspaces: [], entries: [] };
    const title = content[0].replace(/^#+\s*/, "").trim();
    items.push(readBlock(title.slice(0, maxTitle), content.slice(1), 1));
  } else {
    const head = new RegExp(`^#{${level}} (.+)$`);
    let heading = null;
    let block = [];
    const flush = () => {
      if (heading !== null) items.push(readBlock(heading, block, items.length + 1));
      block = [];
    };
    lines.forEach((line) => {
      const match = head.exec(line);
      if (match) {
        flush();
        heading = match[1];
      } else if (heading !== null) block.push(line);
    });
    flush();
  }

  return {
    workspaces: items
      .filter((item) => item.type === words.workspace)
      .map(({ id, title, body, tabName, favorite, archived, createdAt }) => ({ id, name: title, body, tabName, favorite, archived, createdAt })),
    entries: items.filter((item) => item.type !== words.workspace),
  };
}
