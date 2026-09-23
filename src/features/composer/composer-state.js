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

import { defaultType, resourcePick, resourceTypes, types } from "../../data/config.js";

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
  /* Was die Seite beim Öffnen vorgeschlagen hat. Steht in einer Pille noch
     genau das, bleibt sie nur angedeutet; weicht sie ab, füllt sie sich —
     so sieht man auf einen Blick, wo man selbst eingegriffen hat. */
  preset: { type: types[0].id, place: null },
  /* Anhänge des offenen Eingabefelds; erst beim Anlegen werden daraus Medien */
  files: [],
  /* Hat man in diesem Entwurf selbst einen Typ gewählt? Dann stellt ein
     Anhang ihn nicht mehr von sich aus um. */
  typeChosen: false,
  /* Typ und Knopf von vorher, wenn das Eingabefeld beim ersten Anhang von
     selbst auf „Medium“ umgestellt hat — ohne Datei springt es dorthin zurück.
     `null` heißt: nichts von selbst umgestellt. */
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
 * Die Datei selbst wird der Eintrag. Kommt ein Anhang, solange noch nichts
 * getippt und kein Typ von Hand gewählt ist, stellt sich das Eingabefeld auf
 * „Medium“ um: das Foto landet dann als EIN Medium am Ort und bei der offenen
 * Seite — statt als Notiz „IMG_2968“ mit einem gleichnamigen Foto daneben.
 * Wer zuerst tippt oder selbst einen Typ wählt, meint den Eintrag: dann hängt
 * die Datei als Medium an ihm.
 * @param hasText ob im Feld schon etwas steht.
 */
export function adoptMediaType(hasText) {
  if (hasText || composer.typeChosen || composer.type === "medien") return;
  const before = { type: composer.type, pick: composer.pick };
  chooseComposerType("medien");
  composer.mediaSwitch = before;
}

/** Ist die letzte Datei wieder weg, gilt der Typ von vor dem Umstellen. */
export function releaseMediaType() {
  const before = composer.mediaSwitch;
  if (composer.files.length || !before) return;
  chooseComposerType(before.type, before.pick);
  composer.mediaSwitch = null;
}

/** Den Vorschlag der Seite festhalten, sobald das Eingabefeld aufgeht. */
export function rememberComposerPreset() {
  composer.preset = { type: composer.type, place: composer.place };
  /* Ein frischer Vorschlag: noch hat niemand selbst gewählt. */
  composer.typeChosen = false;
  composer.mediaSwitch = null;
}

/**
 * Steht in dieser Pille noch der Vorschlag der Seite?
 * @param field "type" für die Typ-Pille, "place" für die Ablageort-Pille.
 */
export function isComposerPreset(field) {
  return composer[field] === composer.preset[field];
}

/** Nach dem Anlegen oder Schließen zurücksetzen. */
export function resetComposerDraft() {
  composer.files = [];
  composer.slot = null;
  composer.link = null;
}
