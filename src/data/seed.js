/*
 * Beispieldaten für den allerersten Start, damit keine Seite leer aussieht:
 * Projekte, Medien und der Arbeitsbereich „Entwicklung“ mit dem Projekt
 * „Paralist (Android App)“ und seinen Aufgaben.
 * Pfad: src/data/seed.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sampleMedia    -> die Beispielmedien (Art, Titel, wie viele Tage zurück)
 * androidTasks   -> die Aufgaben im Projekt „Paralist (Android App)“
 */

import { MS_PER_DAY, dayKey } from "../core/dates.js";
import { nextId } from "../core/ids.js";
import { projectParent, types, xpKinds } from "./config.js";
import { state } from "./state.js";
import { logXp } from "./xp.js";

/** Legt einen Eintrag an und gibt ihn zurück. */
function addEntry(fields) {
  const entry = {
    id: state.nextEntryId++,
    type: "notiz",
    title: "",
    body: "",
    parent: null,
    archived: false,
    favorite: false,
    createdAt: Date.now(),
    ...fields,
  };
  state.entries.push(entry);
  return entry;
}

/* Fünf Beispiel-Projekte auf der Projekte-Karte, je Eintrag ein anderer Typ. */
function seedProjects() {
  for (let n = 1; n <= 5; n += 1) {
    const type = types[(n - 1) % types.length].id;
    const entry = addEntry({ type, title: `Eintrag ${n}`, parent: projectParent });
    logXp("created", type, entry.title);
  }
}

/*
 * Aufgaben des Projekts „Paralist (Android App)“.
 * `days` sagt, wie viele Tage der Termin in der Zukunft liegt (nur bei Terminen).
 */
const androidTasks = [
  { type: "aufgabe", title: "Übersichtsseite: alle Flows durchklicken" },
  { type: "aufgabe", title: "Karten Inbox, Favoriten, Projekte, Ressourcen prüfen" },
  { type: "aufgabe", title: "Tabs anlegen, umbenennen, löschen" },
  { type: "aufgabe", title: "Arbeitsbereiche anlegen, umbenennen, wischen" },
  { type: "aufgabe", title: "Eingabefeld: jeden Typ einmal anlegen" },
  { type: "aufgabe", title: "Anhänge im Eingabefeld hinzufügen und entfernen" },
  { type: "aufgabe", title: "Wisch-Knöpfe: Favorit, Archivieren, Verknüpfen, Löschen" },
  { type: "aufgabe", title: "Zurück-Pfeil und Browser-Zurück auf jeder Seite" },
  { type: "aufgabe", title: "Hell- und Dunkelmodus vergleichen" },
  { type: "notiz", title: "Material 3: Navigationsleiste bleibt 80 dp hoch" },
  { type: "notiz", title: "Ziel ist eine native Android-App, das Web ist nur die Probe" },
  { type: "termin", title: "Design-Abnahme Übersichtsseite", days: 2, time: "10:00" },
];

/* Arbeitsbereich „Entwicklung“ im ersten Tab, darin das Projekt und seine Aufgaben. */
function seedDevelopment() {
  const workspace = { id: nextId(state.workspaces), name: "Entwicklung", tab: state.tabs[0].id, favorite: false, icon: "briefcase" };
  state.workspaces.push(workspace);

  const project = addEntry({
    type: "projekt",
    title: "Paralist (Android App)",
    parent: workspace.id,
    favorite: true,
    body: androidTasks.map((task) => `• ${task.title}`).join("\n"),
  });
  logXp("created", "projekt", project.title);

  androidTasks.forEach((task, index) => {
    const entry = addEntry({
      type: task.type,
      title: task.title,
      parent: workspace.id,
      createdAt: Date.now() - index * 60000,
      ...(task.time ? { time: task.time } : {}),
    });
    if (task.days) entry.date = dayKey(new Date(Date.now() + task.days * MS_PER_DAY));
    logXp("created", task.type, entry.title);
  });
}

/*
 * Beispielmedien: „sample“ wählt eine Farbfläche aus styles/media.css,
 * „days“ sagt, wie viele Tage der Eintrag zurückliegt — so entstehen mehrere Monatsblöcke.
 */
const sampleMedia = [
  { kind: "image", sample: 1, title: "Foto 1", days: 0 },
  { kind: "doc", title: "Lebenslauf", days: 0 },
  { kind: "image", sample: 2, title: "Foto 2", days: 0 },
  { kind: "video", sample: 8, title: "Video 1", days: 1, duration: 12 },
  { kind: "image", sample: 3, title: "Foto 3", days: 1 },
  { kind: "image", sample: 4, title: "Foto 4", days: 2 },
  { kind: "audio", title: "Sprachmemo", days: 3, duration: 38 },
  { kind: "image", sample: 5, title: "Foto 5", days: 5 },
  { kind: "doc", title: "Skript Statistik", days: 6 },
  { kind: "image", sample: 6, title: "Foto 6", days: 9 },
  { kind: "video", sample: 9, title: "Video 2", days: 24, duration: 47 },
  { kind: "image", sample: 7, title: "Foto 7", days: 26 },
  { kind: "doc", title: "Mietvertrag", days: 30 },
];

/** Beispielmedien landen in der Inbox und zählen nicht als „angelegt“ — darum kein XP-Eintrag. */
export function seedMedia() {
  sampleMedia.forEach((sample, index) => {
    addEntry({
      type: "medien",
      title: sample.title,
      createdAt: Date.now() - sample.days * MS_PER_DAY - index * 60000,
      media: { kind: sample.kind, sample: sample.sample || 0, duration: sample.duration || 0 },
    });
  });
}

/** Alles, was beim allerersten Start entsteht. */
export function seedFirstStart() {
  seedProjects();
  seedDevelopment();
  seedMedia();
}

/**
 * Ältere Speicherstände kennen noch kein XP-Protokoll: alles Vorhandene
 * wird als ein Sammelposten ohne Zeitpunkte nachgetragen.
 */
export function seedXpFromExisting() {
  const count = state.entries.length + state.workspaces.length + state.tabs.length;
  if (!count) return;
  state.xpLog.push({
    id: state.nextXpId++,
    ts: null,
    kind: "created",
    item: "sammel",
    title: "",
    amount: count * xpKinds.created.amount,
    count,
  });
}
