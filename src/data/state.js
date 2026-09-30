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
  defaultTaskPriority,
  defaultTaskStatus,
  isTaskDone,
  mediaFilters,
  resourceFilters,
  stageModes,
  taskDefaults,
  taskGroupings,
  taskLayouts,
  taskSorts,
} from "./config.js";
import { sanitizeLinks } from "./links.js";
import { entryRef, normalizeRef, workspaceRef } from "./refs.js";
import { seedMedia, seedXpFromExisting } from "./seed.js";
import { archiveFinishedTasks } from "./task-archive.js";
import { pruneThumbs } from "./thumbs.js";

/** Gespeicherte Daten. Alles hier überlebt ein Neuladen der Seite. */
export const state = {
  tabs: [{ id: 1, name: "Meine", awarded: true }],
  /* Ansichten der Aufgaben-Seite (src/data/task-views.js); die erste, „Alle“, ist fest */
  taskViews: [{ id: 1, name: "Alle", icon: null, fixed: true, ...taskDefaults }],
  activeTaskViewId: 1,
  activeTabId: 1,
  /* Ein Arbeitsbereich: { id, name, tab, favorite, icon, body, awarded }.
     `body` ist sein Inhalt (freier Text). Bleibt `name` leer, gilt `placeholder`. */
  workspaces: [],
  entries: [],
  nextEntryId: 1,
  xpLog: [],
  nextXpId: 1,
  /* Verlauf: was wurde wie oft und zuletzt wann geöffnet */
  opens: [],
  /* zuletzt getippte Suchbegriffe */
  recentSearches: [],
  prefs: {
    /* deskView: Tag, Woche oder Monat am Desktop (src/features/calendar/calendar-week.js) */
    calendar: { span: 1, mode: "grid", seg: "termine", deskView: "week" },
    /* deskLayout und tileSize: Raster | Liste und Kachelbreite am Desktop (src/features/media/media-desk.js) */
    media: { filter: "recent", deskLayout: "grid", tileSize: 150 },
    resources: { filter: "all" },
    /* Aufgaben-Seite: Ansicht, Gruppierung der Spalten, Sortierung und die Filter */
    /* Bühne der Übersicht am Desktop: welcher Modus gewählt ist (stageModes in config.js) */
    dashboard: { mode: "created" },
    /* Welche Sammlung ihren großen Kopf zeigt, z.B. { bookmarks: true }; fehlt = einfacher Titel */
    pageHeads: {},
  },
};

/** Flüchtiger Zustand der Oberfläche. Wird bewusst nicht gespeichert. */
export const ui = {
  /* Ansicht, zu der der Zurück-Pfeil führt: "home", "search", "calendar", "tasks" oder "media" */
  sourceView: "home",
  /* offene Unterseite: { title, parent, kind, isWorkspace } — parent ist ein Verweis aus refs.js */
  currentPage: null,
  /* Auf der Seite eines Arbeitsbereichs: "notes" (Inhalt) oder "links" (Verknüpfte Einträge) */
  pagePill: "notes",
  /* Eingeklappte Gruppen unter „Verknüpfte Einträge“, als „<Verweis>|<Typ>“ */
  collapsedGroups: new Set(),
  currentEntryId: null,
  /* Auf der Seite eines Eintrags: "notes" (Inhalt) oder "links" (Verknüpfte Einträge) */
  entryPill: "notes",
  editingTabId: null,
  /* Ansicht der Aufgaben-Seite, deren Name gerade getippt wird */
  editingTaskViewId: null,
  editingWorkspaceId: null,
  /* Was gerade ins Namensfeld eines Arbeitsbereichs getippt wurde: { id, value } */
  nameDraft: null,
  /* Im Kalender gewählter Tag als „JJJJ-MM-TT“. Steht hier und nicht im
     Kalender, weil das Eingabefeld ihn braucht: ein neuer Eintrag gehört an
     den Tag, den man ansieht. */
  calendarDay: dayKey(new Date()),
  /* Spalte, in der eine neue Aufgabe landen soll: { field, value }. Setzt der
     Knopf „Aufgabe hinzufügen“ am Ende einer Board-Spalte; das Eingabefeld
     liest es beim Anlegen einmal aus und vergisst es wieder. */
  taskDraftColumn: null,
  /* Suchseite: getippter Begriff und welche Unterliste offen ist (null = Übersicht) */
  searchQuery: "",
  searchList: null,
  /* Gewählte Pille der Suchübersicht: "recent" (Zuletzt geöffnet), "most"
     (Am häufigsten) oder "searched" (Zuletzt gesucht) */
  searchTab: "recent",
  /* Filter und Sortierung der Treffer: { type, sort, place, period, titleOnly,
     showDone } — Vorgabe und Bedeutung in src/features/search/search-refine.js.
     null, bis die Suchseite geladen ist; jede neue Suche setzt sie zurück. */
  searchRefine: null,
  /* true, solange die Bildschirmtastatur im Suchfeld offen ist: dann bleibt die
     Navigation stehen; ein Tipp auf eine Zeile öffnet sie und schließt die Tastatur */
  searchTyping: false,
  /* true, solange die Bildschirmtastatur einen Teil des Fensters verdeckt —
     gesetzt von src/shell/keyboard-inset.js. Dann schließt ein Tipp auf die
     Seite eines Eintrags oder Arbeitsbereichs nur die Tastatur (src/ui/write-tap.js). */
  keyboardOpen: false,
  /* Fortschritt-Blatt: Zeitraum der Kurve und wie viele Historien-Zeilen sichtbar sind */
  progressRange: 30,
  historyLimit: 20,
  /* Profil-Blatt: Zeitraum der Balken */
  usageRange: 30,
  /* Einstellungs-Blatt: welche Kachel aufgeklappt ist — null, "usage" oder "streak" */
  settingsDetail: null,
  /* Profilseite am Desktop: welcher Punkt des Untermenüs gewählt ist (src/features/profile/settings-nav.js) */
  settingsPane: "konto",
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
    dashboard: state.prefs.dashboard,
    taskViews: state.taskViews,
    activeTaskViewId: state.activeTaskViewId,
    pageHeads: state.prefs.pageHeads,
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
  const before = JSON.stringify({ workspaces: state.workspaces, entries: state.entries, tabs: state.tabs, opens: state.opens });
  /* Die Sortiernummer einer Aufgabe war früher der negative Zeitpunkt des
     Anlegens (Neuestes zuerst); jetzt zählt sie aufsteigend, Neues hängt unten. */
  state.entries.forEach((entry) => {
    if (entry.type === "aufgabe" && Number.isFinite(entry.order) && entry.order < 0) entry.order = -entry.order;
  });
  /* Der erste Tab hieß früher „Privat“. */
  state.tabs.forEach((tab) => {
    if (tab.name === "Privat") tab.name = "Meine";
    if (typeof tab.awarded !== "boolean") tab.awarded = true;
  });
  state.workspaces.forEach((workspace) => {
    if (typeof workspace.favorite !== "boolean") workspace.favorite = false;
    /* Das Cover kam später dazu: ohne Angabe hat ein Arbeitsbereich keins. */
    if (typeof workspace.cover !== "boolean") workspace.cover = false;
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
    /* Cover (Farbverlauf oben) und eigenes Icon kamen später dazu: ohne
       Angabe hat ein Eintrag keins von beiden. */
    if (typeof entry.cover !== "boolean") entry.cover = false;
    if (typeof entry.icon !== "string") entry.icon = "";
    /* Früher hatte ein Eintrag EINEN Ablageort `parent` — als nackte Nummer,
       als „o3“/„o4“ für zwei Karten oder als Verweis. Heute ist es die Liste
       `places`; alles wird darauf gebracht und auf Verweise aus refs.js normiert. */
    if (!Array.isArray(entry.places)) {
      const home = normalizeRef(entry.parent);
      entry.places = home ? [home] : [];
    }
    delete entry.parent;
    entry.places = [...new Set(entry.places.map(normalizeRef).filter(Boolean))];
  });
  /* Aufgaben hatten früher weder Status noch Priorität noch eine eigene
     Reihenfolge. Die Sortiernummer zählt aufwärts von oben nach unten; der
     negative Zeitpunkt des Anlegens stellt die neueste Aufgabe nach oben. */
  state.entries.forEach((entry) => {
    if (entry.type !== "aufgabe") return;
    if (typeof entry.status !== "string") entry.status = defaultTaskStatus;
    if (typeof entry.priority !== "string") entry.priority = defaultTaskPriority;
    if (!Number.isFinite(entry.order)) entry.order = -(entry.createdAt || Date.now());
    /* Erledigte Aufgaben hatten früher keinen Zeitpunkt des Erledigens. Sie
       gelten als heute erledigt, damit sie nicht ohne Vorwarnung auf einen
       Schlag im Archiv verschwinden — ab Mitternacht greift die Regel. */
    if (isTaskDone(entry) && !Number.isFinite(entry.doneAt)) entry.doneAt = Date.now();
  });
  /* Ein Verweis auf etwas, das es nicht mehr gibt, fällt weg; ohne Ort heißt Eingang. */
  const workspaceRefs = new Set(state.workspaces.map((workspace) => workspaceRef(workspace.id)));
  const projectRefs = new Set(state.entries.filter((entry) => entry.type === "projekt").map((entry) => `e:${entry.id}`));
  state.entries.forEach((entry) => {
    entry.places = entry.places.filter((ref) => workspaceRefs.has(ref) || projectRefs.has(ref));
  });
  /* Verknüpfte Einträge standen früher gar nicht in den Daten — die Liste
     „Verknüpfte Einträge“ war nur die Rückseite des Ablageorts. Was ein
     Eintrag beim Anlegen an Medien mitbrachte, stand einseitig in
     `attachments`. Beides bringt src/data/links.js auf die heutige Form. */
  sanitizeLinks(state.entries);
  /* Ein Arbeitsbereich ohne gültigen Tab wäre unerreichbar: zurück in den ersten Tab. */
  const tabIds = state.tabs.map((tab) => String(tab.id));
  state.workspaces.forEach((workspace) => {
    if (!tabIds.includes(String(workspace.tab))) workspace.tab = state.tabs[0].id;
  });
  /* Früher zählte die Suche auch Sammlungen (Eingang, Favoriten, Projekte,
     Ressourcen) als „geöffnet“. Das ist weggefallen, die alten Posten auch. */
  state.opens = state.opens.filter((open) => open.kind === "entry" || open.kind === "workspace");
  return JSON.stringify({ workspaces: state.workspaces, entries: state.entries, tabs: state.tabs, opens: state.opens }) !== before;
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
  if (saved.pageHeads && typeof saved.pageHeads === "object") {
    state.prefs.pageHeads = Object.fromEntries(Object.entries(saved.pageHeads).filter(([, on]) => on === true));
  }
  const calendar = state.prefs.calendar;
  calendar.span = pickValid(Number(calendar.span), calendarSpans.map((span) => span.id), 1);
  calendar.mode = pickValid(calendar.mode, calendarModes, "grid");
  calendar.seg = pickValid(calendar.seg, calendarSegments.map((seg) => seg.id), "termine");
  state.prefs.media.filter = pickValid(state.prefs.media.filter, mediaFilters.map((item) => item.id), "recent");
  state.prefs.resources.filter = pickValid(state.prefs.resources.filter, resourceFilters.map((item) => item.id), "all");
  /* Von der Bühne nur `mode` übernehmen; alles andere darin verwirft die App, fehlt es, gilt „Zuletzt erstellt“ */
  const savedMode = saved.dashboard && saved.dashboard.mode;
  state.prefs.dashboard = { mode: pickValid(savedMode, stageModes.map((item) => item.id), "created") };

  /* Ansichten der Aufgaben-Seite: die erste ist immer „Alle“ (fest,
     ungefiltert); jede Angabe fällt auf die Vorgabe zurück, wenn sie nichts
     Gültiges enthält. Ein Ort, den es nicht mehr gibt, wird zu „alle“ — sonst
     bliebe die Ansicht leer, ohne dass man sähe, warum. */
  const places = ["alle", "inbox"]
    .concat(state.workspaces.map((workspace) => workspaceRef(workspace.id)))
    .concat(state.entries.map((entry) => entryRef(entry.id)));
  const views = Array.isArray(saved.taskViews) ? saved.taskViews.filter((view) => view && typeof view === "object") : [];
  if (!views.length || !views[0].fixed) views.unshift({ ...state.taskViews[0] });
  state.taskViews = views.map((view, index) => ({
    id: Number(view.id) || index + 1,
    name: index === 0 ? "Alle" : String(view.name || ""),
    placeholder: typeof view.placeholder === "string" ? view.placeholder : undefined,
    icon: typeof view.icon === "string" ? view.icon : null,
    fixed: index === 0,
    layout: pickValid(view.layout, taskLayouts, taskDefaults.layout),
    group: pickValid(view.group, ["none", ...taskGroupings.map((item) => item.id)], taskDefaults.group),
    sort: pickValid(view.sort, taskSorts.map((item) => item.id), taskDefaults.sort),
    sortAsc: typeof view.sortAsc === "boolean" ? view.sortAsc : taskDefaults.sortAsc,
    place: index === 0 ? "alle" : pickValid(view.place, places, taskDefaults.place),
    hideDone: typeof view.hideDone === "boolean" ? view.hideDone : taskDefaults.hideDone,
  }));
  const active = Number(saved.activeTaskViewId);
  state.activeTaskViewId = state.taskViews.some((view) => view.id === active) ? active : state.taskViews[0].id;
}

/** Liest den gespeicherten Stand; beim allerersten Start entstehen die Beispieldaten. */
export function loadState() {
  const saved = readJson(storageKeys.state);

  if (!saved) {
    /* Allererster Start: keine Beispieldaten mehr, App beginnt leer. */
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

  /* Was vor heute erledigt wurde, gehört ins Archiv (src/data/task-archive.js). */
  if (archiveFinishedTasks(state.entries)) needsSave = true;

  pruneThumbs(state.entries);
  if (needsSave) saveState();
}
