/*
 * Der Zustand des Eingabefelds, solange es offen ist: gewählter Typ, gewählter
 * Knopf, Ablageort, die Seite, von der aus angelegt wird, und die noch nicht
 * angelegten Anhänge.
 * Eigene Datei, damit Eingabefeld, Anhänge und Diktat denselben Stand sehen,
 * ohne sich gegenseitig zu kennen.
 * Pfad: src/features/composer/composer-state.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { defaultType, fileDraftTypes, resourcePick, resourceTypes, types } from "../../data/config.js";

export const composer = {
  /* Typ des Eintrags, der entstehen würde */
  type: types[0].id,
  /* Welcher Knopf unten hervorgehoben ist; `null` heißt: keiner, es entsteht ein Dokument */
  pick: types[0].id,
  /* Ablageort des neuen Eintrags; `null` ist der Eingang */
  place: null,
  /* Nummer des Eintrags, von dessen Seite aus angelegt wird — mit ihm wird der
     neue Eintrag verknüpft. `null` heißt: von nirgends her, also keine
     Verknüpfung. Nicht mit `place` verwechseln: der sagt, WO der neue Eintrag
     liegt, das hier, WOMIT er verbunden ist. */
  link: null,
  /* Der Eintrag, von dessen Seite aus das Eingabefeld aufging — auch dann
     noch, wenn man im Blatt „Ablegen in“ einen anderen Ort gewählt und damit
     `link` geleert hat. So steht er dort weiter oben zur Wahl und man kann
     zu ihm zurück. `null`, wenn man nicht von einer Eintragsseite kommt. */
  origin: null,
  /* Was die Seite beim Öffnen vorgeschlagen hat. Steht in einer Pille noch
     genau das, bleibt sie nur angedeutet; weicht sie ab, füllt sie sich —
     so sieht man auf einen Blick, wo man selbst eingegriffen hat. */
  preset: { type: types[0].id, place: null, link: null },
  /* Anhänge des offenen Eingabefelds; erst beim Anlegen werden daraus Medien */
  files: [],
  /* Hat man in diesem Entwurf selbst einen Typ gewählt? Dann stellen weder
     Anhang noch Text ihn mehr von sich aus um. */
  typeChosen: false,
  /* Typ und Knopf von vorher, solange der Typ von selbst einer Datei folgt
     (followFileDraft) — ohne Datei springt er dorthin zurück. `null` heißt:
     nichts von selbst umgestellt. */
  mediaSwitch: null,
  nextFileId: 1,
  /* Angetippte Stunde im Kalender: { date, time } — der neue Termin landet dort */
  slot: null,
};

/** Die Knöpfe unten im Eingabefeld: die Typen mit `pick` und der Ressourcen-Knopf. */
export function composerPickButtons() {
  return [
    ...types
      .filter((type) => type.pick)
      .map((type) => ({ id: type.id, label: type.label, icon: type.icon, typeId: type.id })),
    resourcePick,
  ];
}

/**
 * Typ wählen.
 * @param typeId der Typ, der entstehen soll.
 * @param pickId welcher Knopf hervorgehoben wird; ohne Angabe wird er abgeleitet.
 */
export function chooseComposerType(typeId, pickId) {
  composer.type = typeId;

  /* Ein Typ mit eigenem Knopf leuchtet selbst; Dokument, Zeichnung und Medium
     haben keinen und gehören unter den Ressourcen-Knopf. */
  if (pickId !== undefined) composer.pick = pickId;
  else if (types.some((type) => type.pick && type.id === typeId)) composer.pick = typeId;
  else composer.pick = resourceTypes.includes(typeId) ? resourcePick.id : null;
}

/** Einen Typ von Hand wählen, über Knopf oder Blatt — ab dann gilt diese Wahl. */
export function chooseTypeByHand(typeId, pickId) {
  chooseComposerType(typeId, pickId);
  composer.typeChosen = true;
  composer.mediaSwitch = null;
}

/** Den Knopf abwählen: ohne Typ entsteht ein Dokument. */
export function clearComposerPick() {
  chooseTypeByHand(defaultType, null);
}

/**
 * Der Typ eines Entwurfs mit Datei, solange man keinen selbst gewählt hat.
 * Aufgerufen nach jeder Änderung an Anhängen oder Text:
 *
 * - Datei dran, Feld leer → Medium: die Datei selbst ist der Eintrag. Das Foto
 *   landet als EIN Medium am Ort und bei der offenen Seite — statt als Notiz
 *   „IMG_2968“ mit einem gleichnamigen Foto daneben.
 * - Text dazu → Dokument, an dem die Datei als Medium hängt; Text wieder weg
 *   → wieder Medium.
 * - letzte Datei weg → zurück zum Vorschlag der Seite.
 *
 * Wer schon getippt hatte, bevor die Datei kam, meint seinen Eintrag (etwa
 * eine Aufgabe): der Typ bleibt, die Datei hängt als Medium daran. Schlägt die
 * Seite selbst ein Medium vor (Medien-Reiter), bleibt es eins — Text ist dort
 * sein Titel. Welche Typen es sind, steht in src/data/config.js (fileDraftTypes).
 * @param hasText ob im Feld etwas steht.
 * @returns true, wenn sich der Typ geändert hat.
 */
export function followFileDraft(hasText) {
  const before = composer.type;
  const previous = composer.mediaSwitch;
  if (!composer.files.length) {
    if (previous) chooseComposerType(previous.type, previous.pick);
    composer.mediaSwitch = null;
  } else if (previous) {
    chooseComposerType(hasText ? fileDraftTypes.withText : fileDraftTypes.bare);
  } else if (!hasText && !composer.typeChosen && composer.type !== fileDraftTypes.bare) {
    composer.mediaSwitch = { type: composer.type, pick: composer.pick };
    chooseComposerType(fileDraftTypes.bare);
  }
  return composer.type !== before;
}

/** Den Vorschlag der Seite festhalten, sobald das Eingabefeld aufgeht. */
export function rememberComposerPreset() {
  composer.preset = { type: composer.type, place: composer.place, link: composer.link };
  /* Ein frischer Vorschlag: noch hat niemand selbst gewählt. */
  composer.typeChosen = false;
  composer.mediaSwitch = null;
}

/**
 * Steht in dieser Pille noch der Vorschlag der Seite?
 * @param field "type" für die Typ-Pille, "place" für die Ablageort-Pille.
 */
export function isComposerPreset(field) {
  /* Die Ablageort-Pille zeigt Ort UND Verknüpfung — beide müssen noch stimmen. */
  if (field === "place" && composer.link !== composer.preset.link) return false;
  return composer[field] === composer.preset[field];
}

/** Nach dem Anlegen oder Schließen zurücksetzen. */
export function resetComposerDraft() {
  composer.files = [];
  composer.slot = null;
  composer.link = null;
  composer.origin = null;
}
