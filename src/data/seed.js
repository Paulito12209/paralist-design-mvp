/*
 * Nachträgliches Auffüllen für ältere Speicherstände: Beispielmedien und ein
 * XP-Sammelposten für Daten, die es schon vor dem jeweiligen Feature gab.
 * Der allererste Start bleibt seit dem Entfernen der Beispieldaten leer.
 * Pfad: src/data/seed.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sampleMedia -> die Beispielmedien (Art, Titel, wie viele Tage zurück)
 */

import { MS_PER_DAY } from "../core/dates.js";
import { xpKinds } from "./config.js";
import { state } from "./state.js";

/** Legt einen Eintrag an und gibt ihn zurück. */
function addEntry(fields) {
  const entry = {
    id: state.nextEntryId++,
    type: "notiz",
    title: "",
    body: "",
    places: [],
    links: [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
    ...fields,
  };
  state.entries.push(entry);
  return entry;
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

/**
 * Beispielmedien für ältere Speicherstände, die das Medien-Feature noch nicht
 * kannten. Landen in der Inbox und zählen nicht als „angelegt“ — darum kein
 * XP-Eintrag.
 */
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
