/*
 * Den Typ nachträglich ändern: aus einer Notiz wird eine Aufgabe, aus einer
 * Aufgabe ein Projekt — und über die Grenze hinweg: ein Eintrag wird ein
 * Arbeitsbereich, ein Arbeitsbereich wird ein Eintrag.
 *
 * Die Regel dahinter in einem Satz: was zu einem Ding gehört, gehört danach
 * zum neuen Ding. Ein Projekt und ein Arbeitsbereich NEHMEN AUF, jeder andere
 * Eintrag VERKNÜPFT (src/data/links.js). Beim Wechsel wird darum aus
 * Verknüpfungen Inhalt und aus Inhalt Verknüpfungen — so geht nichts verloren
 * und die zweite Pille auf der Seite zeigt danach dieselben Einträge.
 * Pfad: src/data/convert.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * convertibleTypes -> welche Typen sich ineinander umwandeln lassen
 * workspaceKind    -> die Kennung des Arbeitsbereichs im Blatt „Typ ändern“
 * typeFields       -> welche Felder am Typ hängen und bei „Rückgängig“ zurückkommen
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dayKey, timeKey } from "../core/dates.js";
import { nextId } from "../core/ids.js";
import { defaultTaskPriority, defaultTaskStatus, workspaceDefaultName } from "./config.js";
import { connectEntries, disconnectEntries, dropLinksTo } from "./links.js";
import { commit, liftChildren } from "./mutations.js";
import { findEntry, findWorkspace, hasPlace, isContainer, workspaceLabel } from "./queries.js";
import { entryRef, isEntryRef, isWorkspaceRef, refId, workspaceRef } from "./refs.js";
import { state } from "./state.js";

/*
 * Nur die Typen, deren Inhalt ein Titel und ein Text ist. Zeichnung und Medium
 * fehlen bewusst: eine Zeichnung IST ihre Zeichenfläche, ein Medium IST seine
 * Datei — als Notiz wäre davon nichts mehr zu sehen.
 */
export const convertibleTypes = ["notiz", "aufgabe", "termin", "projekt", "dokument"];

/* Der Arbeitsbereich ist kein Eintragstyp, sondern die Ebene darüber. Im Blatt
   „Typ ändern“ steht er trotzdem — unter dieser Kennung. */
export const workspaceKind = "arbeitsbereich";

/* Die Felder, die am Typ hängen: Status, Dringlichkeit und Reihenfolge einer
   Aufgabe, der Zeitpunkt des Erledigens, Tag und Uhrzeit eines Termins.
   „Rückgängig“ stellt genau diese wieder her — nie Titel oder Text. */
const typeFields = ["status", "priority", "order", "doneAt", "date", "time"];

/** Lässt sich der Typ dieses Eintrags ändern? */
export function canChangeType(entry) {
  return Boolean(entry && convertibleTypes.includes(entry.type));
}

/**
 * Der Stand vor dem Wechsel, damit „Rückgängig“ ihn zurückholen kann. Ein
 * Wechsel zurück über den normalen Weg würde eine Aufgabe auf „Offen | Später“
 * zurücksetzen — der Schnappschuss bringt „In Arbeit | Jetzt“ zurück.
 */
export function typeSnapshot(entry) {
  const snap = { type: entry.type };
  typeFields.forEach((field) => {
    if (field in entry) snap[field] = entry[field];
  });
  return snap;
}

/* Aufgaben-Felder geben oder wegnehmen, je nachdem, wohin der Wechsel geht. */
function adoptTaskFields(entry, wasTask) {
  const isTask = entry.type === "aufgabe";
  if (isTask && !wasTask) {
    entry.status = defaultTaskStatus;
    entry.priority = defaultTaskPriority;
    entry.order = -(entry.createdAt || Date.now());
  }
  if (!isTask && wasTask) {
    delete entry.status;
    delete entry.priority;
    delete entry.order;
    delete entry.doneAt;
    /* `doneAwarded` bleibt stehen: sonst brächte Hin- und Herwandeln und
       erneutes Abhaken beliebig viele Punkte. */
  }
}

/*
 * Ein Termin braucht einen Tag: ohne eigenes Datum zählte der Tag des Anlegens
 * (entryDay in queries.js) — eine alte Notiz stünde als Termin irgendwo in
 * der Vergangenheit. Darum: heute, zur jetzigen Uhrzeit. Ein vorhandenes
 * Datum (im Kalender angelegt) bleibt.
 */
function adoptTerminFields(entry) {
  if (entry.type !== "termin" || entry.date) return;
  const now = Date.now();
  entry.date = dayKey(new Date(now));
  entry.time = timeKey(now);
}

/* Alle Einträge, die an diesem Ort liegen — auch archivierte, die sollen ja mitkommen. */
function entriesAt(ref) {
  return state.entries.filter((item) => hasPlace(item, ref));
}

/*
 * Ein Projekt liegt nicht in einem Projekt: liegt der Eintrag in einem, rückt
 * er an dessen Orte — aus „Notiz im Projekt Website (in Marketing)“ wird
 * „Projekt in Marketing“. Hatte das Projekt keinen Ort, landet er im Eingang.
 */
function liftOutOfProjects(entry) {
  const places = [];
  (entry.places || []).forEach((place) => {
    if (!isEntryRef(place)) {
      places.push(place);
      return;
    }
    const project = findEntry(refId(place));
    (project ? project.places || [] : []).forEach((up) => places.push(up));
  });
  entry.places = [...new Set(places)];
}

/*
 * Aus Verknüpfungen wird Inhalt: jeder verknüpfte Eintrag bekommt den neuen
 * Ort dazu und die Verbindung wird auf beiden Seiten gelöst. Wo er sonst
 * schon lag, bleibt er. Über die rohe Liste, nicht linkedEntries(): die lässt
 * Archiviertes weg, und das soll genauso mitkommen.
 */
function linksIntoPlace(entry, ref) {
  const partners = (entry.links || []).map((id) => findEntry(id)).filter(Boolean);
  partners.forEach((other) => {
    disconnectEntries(entry, other);
    if (!hasPlace(other, ref)) other.places = [...(other.places || []), ref];
  });
}

/*
 * Aus Inhalt werden Verknüpfungen: was an diesem Ort lag, hängt danach am
 * Eintrag. Was nur hier lag, bekommt `fallback` als neuen Ort (leer = Eingang).
 * Projekte darunter lassen sich nicht verknüpfen — die verlieren nur den Ort.
 */
function contentsIntoLinks(entry, ref, fallback) {
  const contents = entriesAt(ref);
  liftChildren(ref, fallback);
  contents.forEach((item) => connectEntries(entry, item));
}

/* Der Merkposten der Suche („zuletzt geöffnet“) wandert mit auf das neue Ding. */
function moveOpen(fromKey, kind, id) {
  const open = state.opens.find((item) => item.key === fromKey);
  if (!open) return;
  open.key = `${kind}:${id}`;
  open.kind = kind;
  open.id = String(id);
}

/* Der Orts-Filter der Aufgaben-Seite folgt dem Ort — oder fällt auf „alle“ zurück. */
function movePlaceFilter(fromRef, toRef) {
  if (state.prefs.tasks.place === fromRef) state.prefs.tasks.place = toRef || "alle";
}

/* Der Typwechsel selbst, ohne zu speichern — Verknüpfungen und Inhalt wandern mit. */
function applyType(entry, type) {
  const ref = entryRef(entry.id);
  const wasTask = entry.type === "aufgabe";
  const wasContainer = isContainer(entry);
  /* Erst den Typ setzen: connectEntries verbindet nur, was sich verknüpfen
     lässt — und ein Projekt lässt sich nicht verknüpfen. */
  entry.type = type;
  adoptTaskFields(entry, wasTask);
  adoptTerminFields(entry);

  const nowContainer = isContainer(entry);
  if (nowContainer && !wasContainer) {
    liftOutOfProjects(entry);
    linksIntoPlace(entry, ref);
    /* Ein Projekt hat keine Verknüpfungen — auch kein Rest auf einen Eintrag,
       den es nicht mehr gibt. */
    dropLinksTo(entry.id);
    entry.links = [];
  } else if (wasContainer && !nowContainer) {
    contentsIntoLinks(entry, ref, entry.places || []);
    movePlaceFilter(ref, null);
  }
}

/**
 * Einem Eintrag einen anderen Typ geben. Titel, Text, Orte, Favorit und
 * Datum bleiben; Verknüpfungen und Inhalt wandern mit (siehe oben).
 */
export function changeEntryType(entry, type) {
  if (!canChangeType(entry) || !convertibleTypes.includes(type) || entry.type === type) return;
  applyType(entry, type);
  commit();
}

/** „Rückgängig“: den Typ und seine Felder aus dem Schnappschuss zurückholen. */
export function restoreTypeSnapshot(entry, snap) {
  if (!canChangeType(entry) || !convertibleTypes.includes(snap.type)) return;
  if (entry.type !== snap.type) applyType(entry, snap.type);
  typeFields.forEach((field) => {
    if (field in snap) entry[field] = snap[field];
    else delete entry[field];
  });
  commit();
}

/*
 * In welchem Tab ein neuer Arbeitsbereich erscheint: dort, wo der Eintrag
 * schon lag — auch über sein Projekt hinweg. Sonst im gerade gewählten Tab.
 */
export function workspaceTabFor(entry) {
  const places = entry.places || [];
  const home = places.find(isWorkspaceRef) || places.filter(isEntryRef).flatMap((place) => {
    const project = findEntry(refId(place));
    return project ? (project.places || []).filter(isWorkspaceRef) : [];
  })[0];
  const workspace = home ? findWorkspace(refId(home)) : null;
  return workspace ? workspace.tab : state.activeTabId;
}

/**
 * Aus einem Eintrag wird ein Arbeitsbereich. Der Eintrag selbst verschwindet;
 * was in ihm lag (Projekt) oder mit ihm verknüpft war, liegt danach im neuen
 * Arbeitsbereich. Seine eigenen Orte fallen weg — ein Arbeitsbereich liegt
 * nirgends, er steht ganz oben.
 * @returns der neue Arbeitsbereich, oder null.
 */
export function entryToWorkspace(entry) {
  if (!canChangeType(entry)) return null;
  const ref = entryRef(entry.id);
  const id = nextId(state.workspaces);
  const target = workspaceRef(id);
  const workspace = {
    id,
    name: (entry.title || "").trim() || workspaceDefaultName,
    tab: workspaceTabFor(entry),
    favorite: Boolean(entry.favorite),
    body: entry.body || "",
    archived: Boolean(entry.archived),
    /* Punkte gab es schon beim Anlegen des Eintrags — nicht noch einmal. */
    awarded: true,
  };
  /* Die Punkte-Sperre einer erledigten Aufgabe reist mit — sonst brächte der
     Umweg über den Arbeitsbereich ein zweites „Erledigt“. */
  if (entry.doneAwarded) workspace.doneAwarded = true;
  state.workspaces.push(workspace);

  entriesAt(ref).forEach((item) => {
    item.places = [...new Set(item.places.map((place) => (place === ref ? target : place)))];
  });
  linksIntoPlace(entry, target);
  dropLinksTo(entry.id);
  moveOpen(`entry:${entry.id}`, "workspace", id);
  movePlaceFilter(ref, target);
  state.entries = state.entries.filter((item) => item !== entry);
  commit({ prunedEntries: true });
  return workspace;
}

/**
 * Aus einem Arbeitsbereich wird ein Eintrag. Wird er ein Projekt, liegt sein
 * Inhalt danach im Projekt — nur Projekte darin nicht, die können nicht in
 * einem Projekt liegen und rücken in den Eingang. Wird er etwas anderes, ist
 * sein Inhalt danach mit ihm verknüpft und liegt im Eingang. Der neue Eintrag
 * selbst liegt nirgends: ein Arbeitsbereich hatte ja keinen Ort.
 * @returns der neue Eintrag, oder null.
 */
export function workspaceToEntry(workspace, type) {
  if (!workspace || !convertibleTypes.includes(type)) return null;
  const source = workspaceRef(workspace.id);
  const entry = {
    id: state.nextEntryId++,
    type,
    title: workspaceLabel(workspace),
    body: workspace.body || "",
    places: [],
    links: [],
    archived: Boolean(workspace.archived),
    favorite: Boolean(workspace.favorite),
    createdAt: Date.now(),
  };
  if (workspace.doneAwarded) entry.doneAwarded = true;
  adoptTaskFields(entry, false);
  adoptTerminFields(entry);
  state.entries.push(entry);

  const target = entryRef(entry.id);
  if (isContainer(entry)) {
    entriesAt(source).forEach((item) => {
      item.places = item.places.filter((place) => place !== source);
      if (!isContainer(item) && !hasPlace(item, target)) item.places.push(target);
    });
    movePlaceFilter(source, target);
  } else {
    contentsIntoLinks(entry, source, []);
    movePlaceFilter(source, null);
  }
  state.workspaces = state.workspaces.filter((item) => item !== workspace);
  moveOpen(`workspace:${workspace.id}`, "entry", entry.id);
  commit();
  return entry;
}
