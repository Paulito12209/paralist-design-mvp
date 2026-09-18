/*
 * Der Zustand der App und sein Speichern im Browser.
 * `state` sind die Daten (Tabs, Arbeitsbereiche, Einträge, Verlauf),
 * `ui` ist das Flüchtige (welche Seite offen ist, was gerade umbenannt wird).
 * Pfad: src/data/state.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dayKey } from "../core/dates.js";
import { readJson, storageKeys, writeJson } from "../core/storage.js";
import {
  calendarModes,
  calendarSegments,
  calendarSpans,
  mediaFilters,
  resourceFilters,
} from "./config.js";
import { normalizeRef, workspaceRef } from "./refs.js";
import { seedFirstStart, seedMedia, seedXpFromExisting } from "./seed.js";
import { pruneThumbs } from "./thumbs.js";

/** Gespeicherte Daten. Alles hier überlebt ein Neuladen der Seite. */
export const state = {
  tabs: [{ id: 1, name: "Meine", awarded: true }],
  activeTabId: 1,
  /* Ein Arbeitsbereich: { id, name, tab, favorite, icon, body, awarded }.
     `body` ist sein Schreibblock. Bleibt `name` leer, gilt `placeholder`. */
  workspaces: [{ id: 1, name: "Arbeitsbereich", tab: 1, favorite: false, body: "", awarded: true }],
  entries: [],
  nextEntryId: 1,
  xpLog: [],
  nextXpId: 1,
  /* Verlauf: was wurde wie oft und zuletzt wann geöffnet */
  opens: [],
  /* zuletzt getippte Suchbegriffe */
  recentSearches: [],
  prefs: {
    calendar: { span: 1, mode: "grid", seg: "termine" },
    media: { filter: "recent" },
    resources: { filter: "all" },
  },
};

/** Flüchtiger Zustand der Oberfläche. Wird bewusst nicht gespeichert. */
export const ui = {
  /* Ansicht, zu der der Zurück-Pfeil führt: "home", "search", "calendar", "media" oder "settings" */
  sourceView: "home",
  /* offene Unterseite: { title, parent, kind, isWorkspace } — parent ist ein Verweis aus refs.js */
  currentPage: null,
  /* Auf der Seite eines Arbeitsbereichs oder Projekts: "notes" (Schreibblock) oder "links" */
  pagePill: "notes",
  /* Eingeklappte Gruppen unter „Verknüpfte Inhalte“, als „<Verweis>|<Typ>“ */
  collapsedGroups: new Set(),
  currentEntryId: null,
  editingTabId: null,
  editingWorkspaceId: null,
  /* Was gerade ins Namensfeld eines Arbeitsbereichs getippt wurde: { id, value } */
  nameDraft: null,
  /* Im Kalender gewählter Tag als „JJJJ-MM-TT“. Steht hier und nicht im
     Kalender, weil das Eingabefeld ihn braucht: ein neuer Eintrag gehört an
     den Tag, den man ansieht. */
  calendarDay: dayKey(new Date()),
  /* Suchseite: getippter Begriff und welche Unterliste offen ist (null = Übersicht) */
  searchQuery: "",
  searchList: null,
  /* Fortschritt-Blatt: Zeitraum der Kurve und wie viele Historien-Zeilen sichtbar sind */
  progressRange: 30,
  historyLimit: 20,
  /* Profil-Blatt: Zeitraum der Balken */
  usageRange: 30,
};

/* Auf `true` gesetzt, sobald die Beispielmedien einmal angelegt wurden. */
let mediaSeeded = false;
let saveTimer = null;

function snapshot() {
  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    workspaces: state.workspaces,
    entries: state.entries,
    nextEntryId: state.nextEntryId,
    xpLog: state.xpLog,
    nextXpId: state.nextXpId,
    opens: state.opens,
    recentSearches: state.recentSearches,
    calendar: state.prefs.calendar,
    media: state.prefs.media,
    resources: state.prefs.resources,
    mediaSeeded,
  };
}

/** Sofort speichern. Für alles, was die Daten wirklich ändert (anlegen, löschen, markieren). */
export function saveState() {
  clearTimeout(saveTimer);
  saveTimer = null;
  writeJson(storageKeys.state, snapshot());
}

/**
 * Gleich mehrere Änderungen zusammenfassen und kurz danach einmal speichern.
 * Für Tippen im Titel oder Text: sonst würde bei jedem Buchstaben der ganze
 * Datenstand neu geschrieben und die Eingabe fängt an zu ruckeln.
 */
export function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(saveState, 400);
}

/**
 * Wartende Änderung sofort schreiben. Wird von src/shell/lifecycle.js gerufen,
 * bevor die Seite in den Hintergrund geht oder schließt.
 */
export function flushSave() {
  if (saveTimer) saveState();
}

/** Eine Auswahl auf gültige Werte prüfen; unbekannte Werte fallen auf den ersten zurück. */
function pickValid(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/* Ältere Speicherstände auf die heutige Form bringen. Gibt zurück, ob sich etwas geändert hat. */
function migrate() {
  const before = JSON.stringify({ workspaces: state.workspaces, entries: state.entries, tabs: state.tabs });
  /* Der erste Tab hieß früher „Privat“. */
  state.tabs.forEach((tab) => {
    if (tab.name === "Privat") tab.name = "Meine";
    if (typeof tab.awarded !== "boolean") tab.awarded = true;
  });
  state.workspaces.forEach((workspace) => {
    if (typeof workspace.favorite !== "boolean") workspace.favorite = false;
  });
  state.workspaces.forEach((workspace) => {
    if (typeof workspace.body !== "string") workspace.body = "";
    if (typeof workspace.awarded !== "boolean") workspace.awarded = true;
    /* Der frühere Vorgabename „Platzhalter N“ heißt jetzt „Arbeitsbereich“ bzw. „Arbeitsbereich N“. */
    const old = /^Platzhalter (\d+)$/.exec(workspace.name || "");
    if (old) workspace.name = old[1] === "1" ? "Arbeitsbereich" : `Arbeitsbereich ${old[1]}`;
  });
  state.entries.forEach((entry) => {
    if (typeof entry.favorite !== "boolean") entry.favorite = false;
    /* Ablageorte waren früher nackte Nummern oder „o3“/„o4“ für zwei Karten,
       die heute Sammlungen sind: alles auf die Verweise aus refs.js bringen. */
    entry.parent = normalizeRef(entry.parent);
  });
  /* Ein Verweis auf etwas, das es nicht mehr gibt, zeigt in die Inbox. */
  const workspaceRefs = new Set(state.workspaces.map((workspace) => workspaceRef(workspace.id)));
  const projectRefs = new Set(state.entries.filter((entry) => entry.type === "projekt").map((entry) => `e:${entry.id}`));
  state.entries.forEach((entry) => {
    if (entry.parent && !workspaceRefs.has(entry.parent) && !projectRefs.has(entry.parent)) entry.parent = null;
  });
  /* Ein Arbeitsbereich ohne gültigen Tab wäre unerreichbar: zurück in den ersten Tab. */
  const tabIds = state.tabs.map((tab) => String(tab.id));
  state.workspaces.forEach((workspace) => {
    if (!tabIds.includes(String(workspace.tab))) workspace.tab = state.tabs[0].id;
  });
  return JSON.stringify({ workspaces: state.workspaces, entries: state.entries, tabs: state.tabs }) !== before;
}

/* Gespeicherte Auswahl der drei Seiten prüfen, damit kein alter Wert die Seite lahmlegt. */
function adoptPrefs(saved) {
  if (saved.calendar && typeof saved.calendar === "object") {
    state.prefs.calendar = { ...state.prefs.calendar, ...saved.calendar };
  }
  if (saved.media && typeof saved.media === "object") {
    state.prefs.media = { ...state.prefs.media, ...saved.media };
  }
  if (saved.resources && typeof saved.resources === "object") {
    state.prefs.resources = { ...state.prefs.resources, ...saved.resources };
  }
  const calendar = state.prefs.calendar;
  calendar.span = pickValid(Number(calendar.span), calendarSpans.map((span) => span.id), 1);
  calendar.mode = pickValid(calendar.mode, calendarModes, "grid");
  calendar.seg = pickValid(calendar.seg, calendarSegments.map((seg) => seg.id), "termine");
  state.prefs.media.filter = pickValid(state.prefs.media.filter, mediaFilters.map((item) => item.id), "recent");
  state.prefs.resources.filter = pickValid(state.prefs.resources.filter, resourceFilters.map((item) => item.id), "all");
}

/** Liest den gespeicherten Stand; beim allerersten Start entstehen die Beispieldaten. */
export function loadState() {
  const saved = readJson(storageKeys.state);

  if (!saved) {
    seedFirstStart();
    mediaSeeded = true;
    saveState();
    return;
  }

  if (Array.isArray(saved.tabs) && saved.tabs.length) state.tabs = saved.tabs;
  if (Number(saved.activeTabId)) state.activeTabId = Number(saved.activeTabId);
  if (Array.isArray(saved.workspaces)) state.workspaces = saved.workspaces;
  if (Array.isArray(saved.entries)) state.entries = saved.entries;
  if (Number(saved.nextEntryId)) state.nextEntryId = Number(saved.nextEntryId);
  if (Number(saved.nextXpId)) state.nextXpId = Number(saved.nextXpId);
  if (Array.isArray(saved.opens)) state.opens = saved.opens;
  if (Array.isArray(saved.recentSearches)) state.recentSearches = saved.recentSearches;
  if (!state.tabs.some((tab) => tab.id === state.activeTabId)) state.activeTabId = state.tabs[0].id;

  adoptPrefs(saved);
  /* Was die Migration geändert hat, wird sofort zurückgeschrieben — sonst
     bliebe der Speicher in der alten Form und müsste bei jedem Start erneut
     übersetzt werden. */
  let needsSave = migrate();

  /* Ältere Stände kennen noch kein XP-Protokoll: alles Vorhandene als Sammelposten nachtragen. */
  if (Array.isArray(saved.xpLog)) state.xpLog = saved.xpLog;
  else {
    seedXpFromExisting();
    needsSave = true;
  }

  /* Ältere Stände haben noch keine Beispielmedien: einmalig nachlegen. */
  mediaSeeded = Boolean(saved.mediaSeeded);
  if (!mediaSeeded) {
    seedMedia();
    mediaSeeded = true;
    needsSave = true;
  }

  pruneThumbs(state.entries);
  if (needsSave) saveState();
}
