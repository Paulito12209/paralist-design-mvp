/*
 * Daten einlesen: eine Datei (ZIP, Paralist-JSON oder Markdown) oder
 * eingefügten Text erkennen, in eine Zwischenform bringen und dann entweder
 * HINZUFÜGEN (alles bekommt neue Nummern, Vorhandenes bleibt unberührt,
 * Verknüpfungen innerhalb des Imports bleiben erhalten) oder ERSETZEN (der
 * Stand wird genau der aus der Datei — vorher wird der alte gesichert,
 * src/data/transfer-snapshot.js). Ersetzen geht nur mit einer Paralist-Datei
 * oder einem ZIP; eingefügter Text kennt weder Einstellungen noch Ansichten.
 *
 * Zwischenform: { source, name, snapshot?, workspaces, entries, thumbs, files }
 *   workspaces[*]  { id, name, body, tabName, favorite, archived, createdAt }
 *   entries[*]     Felder des Eintrags, dazu placeRefs [{ kind, id, name }] und
 *                  linkRefs [{ kind, id, name }] statt places/links
 *   thumbs         { "<alte Nummer>": "data:…" } Vorschaubilder und Striche
 *   files[*]       { id, name, mime, bytes } die Mediendateien (nur ZIP)
 * Pfad: src/data/transfer-import.js
 *
 * Keine anpassbaren Werte: Aufbau der Dateien in src/data/transfer-snapshot.js
 * und src/data/transfer-markdown.js.
 */

import { putBlob, pruneBlobs } from "../core/blobs.js";
import { nextId, sameId } from "../core/ids.js";
import { looksLikeZip, readZip } from "../core/zip.js";
import { types } from "./config.js";
import { adoptStatusFields, defaultTaskPriority, defaultTaskStatus } from "./config-tasks.js";
import { canLink, sanitizeLinks } from "./links.js";
import { commit } from "./mutations.js";
import { state } from "./state.js";
import { saveThumbs, setThumb } from "./thumbs.js";
import { parseMarkdown } from "./transfer-markdown-read.js";
import { backupBeforeImport, isSnapshot, thumbsOf, writeSnapshot } from "./transfer-snapshot.js";

const decoder = new TextDecoder();
const typeIds = types.map((type) => type.id);
const imageMimes = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/* Bytes als Data-URL — stückweise, btoa verträgt keine riesigen Zeichenketten am Stück */
function toDataUrl(bytes, mime) {
  let binary = "";
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return `data:${mime};base64,${btoa(binary)}`;
}

/* „w:3“ -> { kind: "w", id: "3", name: "" } */
function refOf(ref) {
  const match = /^([we]):(\d+)$/.exec(String(ref));
  return match ? { kind: match[1], id: match[2], name: "" } : null;
}

/* Aus einer Paralist-Datei die Zwischenform bauen */
function fromSnapshot(snapshot, source, name) {
  const tabs = new Map((snapshot.state.tabs || []).map((tab) => [String(tab.id), tab]));
  const workspaces = (snapshot.state.workspaces || []).map((workspace) => ({
    id: `w${workspace.id}`,
    name: String(workspace.name || workspace.placeholder || ""),
    body: typeof workspace.body === "string" ? workspace.body : "",
    tabName: String((tabs.get(String(workspace.tab)) || {}).name || ""),
    favorite: workspace.favorite === true,
    archived: workspace.archived === true,
    createdAt: workspace.createdAt,
  }));
  const entries = (snapshot.state.entries || [])
    .filter((entry) => entry && typeof entry === "object")
    .map(({ id, places, links, ...rest }) => ({
      ...rest,
      id: `e${id}`,
      placeRefs: (Array.isArray(places) ? places : []).map(refOf).filter(Boolean),
      linkRefs: (Array.isArray(links) ? links : []).map((linked) => ({ kind: "e", id: String(linked), name: "" })),
    }));
  return { source, name, snapshot, workspaces, entries, thumbs: thumbsOf(snapshot), files: [] };
}

async function fromZip(buffer, name) {
  const files = readZip(buffer);
  const main = files.find((file) => file.name === "paralist.json");
  if (!main) throw new Error("Im ZIP fehlt die Datei paralist.json");
  const snapshot = JSON.parse(decoder.decode(await main.bytes()));
  if (!isSnapshot(snapshot)) throw new Error("paralist.json ist keine Paralist-Datei");
  const parsed = fromSnapshot(snapshot, "zip", name);
  const mediaInfo = new Map((snapshot.media || []).map((media) => [String(media.id), media]));

  for (const file of files) {
    const match = /^(zeichnungen|vorschau|medien)\/(\d+)\.([a-z0-9]+)$/i.exec(file.name);
    if (!match) continue;
    const [, folder, id, ext] = match;
    if (folder === "medien") {
      const info = mediaInfo.get(id) || {};
      parsed.files.push({ id, name: info.name || `${id}.${ext}`, mime: info.mime || "", bytes: await file.bytes() });
    } else {
      parsed.thumbs[id] = toDataUrl(await file.bytes(), imageMimes[ext.toLowerCase()] || "image/png");
    }
  }
  return parsed;
}

function fromText(text, name) {
  const trimmed = String(text || "").trim();
  if (trimmed.startsWith("{")) {
    let snapshot = null;
    try {
      snapshot = JSON.parse(trimmed);
    } catch (error) {
      throw new Error("Die Datei sieht nach JSON aus, lässt sich aber nicht lesen");
    }
    if (!isSnapshot(snapshot)) throw new Error("Das ist keine Paralist-Datei");
    return fromSnapshot(snapshot, "json", name);
  }
  const { workspaces, entries } = parseMarkdown(trimmed);
  if (!workspaces.length && !entries.length) throw new Error("Im Text steht kein Eintrag");
  return { source: "markdown", name, snapshot: null, workspaces, entries, thumbs: {}, files: [] };
}

/** Eine gewählte Datei lesen und erkennen. Wirft einen Fehler mit lesbarem Satz, wenn nichts passt. */
export async function readImportFile(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (looksLikeZip(bytes)) return fromZip(buffer, file.name);
  return fromText(decoder.decode(bytes), file.name);
}

/** Eingefügten Text lesen und erkennen (Paralist-JSON oder Markdown). */
export function readImportText(text) {
  return fromText(text, "Eingefügter Text");
}

/** Was in der Datei steckt, als Zahlen für die Rückfrage. */
export function importSummary(parsed) {
  const entries = parsed.entries;
  return {
    entries: entries.filter((entry) => entry.type !== "zeichnung" && entry.type !== "medien").length,
    workspaces: parsed.workspaces.length,
    drawings: entries.filter((entry) => entry.type === "zeichnung").length,
    media: entries.filter((entry) => entry.type === "medien").length,
    files: parsed.files.length,
    canReplace: Boolean(parsed.snapshot),
  };
}

/* ---------- Hinzufügen ---------- */

function sameName(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase() && String(a || "").trim() !== "";
}

/* Tab zu einem Namen: der vorhandene, sonst ein neuer; ohne Namen der gewählte Tab */
function tabFor(name) {
  if (!name) return state.activeTabId;
  const found = state.tabs.find((tab) => sameName(tab.name, name));
  if (found) return found.id;
  const tab = { id: nextId(state.tabs), name: String(name).trim(), awarded: true };
  state.tabs.push(tab);
  return tab.id;
}

/* Einen Ort auflösen: über die Marke, sonst über den Namen eines vorhandenen Arbeitsbereichs oder Projekts */
function resolvePlace(ref, idMap) {
  const mapped = ref.id !== null ? idMap.get(`${ref.kind}${ref.id}`) : undefined;
  if (mapped !== undefined) return `${ref.kind}:${mapped}`;
  if (ref.kind === "e" && ref.id !== null && !ref.name) return null;
  const workspace = ref.kind !== "e" ? state.workspaces.find((item) => !item.archived && sameName(item.name, ref.name)) : null;
  if (workspace) return `w:${workspace.id}`;
  const project = ref.kind !== "w" ? state.entries.find((item) => item.type === "projekt" && !item.archived && sameName(item.title, ref.name)) : null;
  return project ? `e:${project.id}` : null;
}

/* Eine Verknüpfung auflösen: Marke, sonst Titel eines vorhandenen Eintrags */
function resolveLink(ref, idMap) {
  const mapped = idMap.get(`e${ref.id}`);
  if (mapped !== undefined) return mapped;
  if (!ref.name) return null;
  const found = state.entries.find((item) => canLink(item) && sameName(item.title, ref.name));
  return found ? found.id : null;
}

/* Die Dinge einer Zeichnung: Zettel und Bilder zeigen auf neue Nummern, Verwaistes fällt weg */
function remapDrawItems(items, idMap) {
  if (!Array.isArray(items)) return undefined;
  return items
    .map((item) => {
      if (item.kind === "note") {
        const noteId = idMap.get(`e${item.noteId}`);
        return noteId === undefined ? null : { ...item, noteId };
      }
      if (item.kind === "image") {
        const mediaId = idMap.get(`e${item.mediaId}`);
        return mediaId === undefined ? null : { ...item, mediaId };
      }
      return item;
    })
    .filter(Boolean);
}

/* Felder eines Eintrags auf die heutige Form bringen — Fehlendes bekommt Vorgaben */
function cleanEntry(raw, id) {
  const now = Date.now();
  const entry = {
    ...raw,
    id,
    type: typeIds.includes(raw.type) ? raw.type : "notiz",
    title: String(raw.title || "").slice(0, 2000),
    body: typeof raw.body === "string" ? raw.body : "",
    archived: raw.archived === true,
    favorite: raw.favorite === true,
    cover: raw.cover === true,
    icon: typeof raw.icon === "string" ? raw.icon : "",
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : now,
  };
  delete entry.placeRefs;
  delete entry.linkRefs;
  delete entry.tabName;
  if (entry.type !== "medien") delete entry.media;
  if (entry.type !== "zeichnung") delete entry.drawItems;
  if (entry.type === "aufgabe") {
    if (typeof entry.status !== "string") entry.status = defaultTaskStatus;
    if (typeof entry.priority !== "string") entry.priority = defaultTaskPriority;
    if (!Number.isFinite(entry.order)) entry.order = entry.createdAt;
  } else adoptStatusFields(entry);
  return entry;
}

/**
 * Alles aus der Datei zum vorhandenen Stand hinzufügen. Speichert und meldet
 * die Änderung. Gibt zurück, wie viele Einträge und Arbeitsbereiche dazukamen.
 */
export async function mergeImport(parsed) {
  const idMap = new Map();
  const added = { entries: 0, workspaces: 0 };

  parsed.workspaces.forEach((raw) => {
    const id = nextId(state.workspaces);
    idMap.set(raw.id, id);
    state.workspaces.push({
      id,
      name: String(raw.name || "").trim() || "Arbeitsbereich",
      tab: tabFor(raw.tabName),
      favorite: raw.favorite === true,
      archived: raw.archived === true,
      cover: false,
      body: typeof raw.body === "string" ? raw.body : "",
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      awarded: true,
    });
    added.workspaces += 1;
  });

  /* Erst alle Nummern vergeben, dann auflösen — eine Verknüpfung kann nach vorn zeigen */
  parsed.entries.forEach((raw) => idMap.set(raw.id, state.nextEntryId++));
  parsed.entries.forEach((raw) => {
    const id = idMap.get(raw.id);
    const entry = cleanEntry(raw, id);
    entry.places = [...new Set(raw.placeRefs.map((ref) => resolvePlace(ref, idMap)).filter(Boolean))];
    /* Kein Projekt in einem Projekt, nichts in sich selbst */
    if (entry.type === "projekt") entry.places = entry.places.filter((ref) => ref.startsWith("w:"));
    entry.places = entry.places.filter((ref) => ref !== `e:${id}`);
    entry.links = [...new Set(raw.linkRefs.map((ref) => resolveLink(ref, idMap)).filter((other) => other !== null && !sameId(other, id)))];
    if (entry.type === "zeichnung") entry.drawItems = remapDrawItems(raw.drawItems, idMap) || [];
    state.entries.push(entry);
    added.entries += 1;
    if (parsed.thumbs[String(raw.id).slice(1)]) setThumb(id, parsed.thumbs[String(raw.id).slice(1)]);
  });

  for (const file of parsed.files) {
    const id = idMap.get(`e${file.id}`);
    if (id !== undefined) await putBlob(id, new File([file.bytes], file.name, { type: file.mime }));
  }

  sanitizeLinks(state.entries);
  saveThumbs();
  commit();
  return added;
}

/* ---------- Ersetzen ---------- */

/**
 * Den Stand durch den aus der Datei ersetzen. Sichert vorher den alten Stand
 * (so weit der Speicher reicht) und schreibt Zustand, Vorschaubilder,
 * Einstellungen und Mediendateien. Danach muss die Seite neu laden.
 * @returns { ok, backedUp } — ok false, wenn der Speicher den neuen Stand nicht fasst
 */
export async function replaceImport(parsed) {
  if (!parsed.snapshot) return { ok: false, backedUp: false };
  const backedUp = backupBeforeImport();
  if (!writeSnapshot(parsed.snapshot, parsed.thumbs)) return { ok: false, backedUp };
  await pruneBlobs([]);
  for (const file of parsed.files) {
    await putBlob(file.id, new File([file.bytes], file.name, { type: file.mime }));
  }
  return { ok: true, backedUp };
}
