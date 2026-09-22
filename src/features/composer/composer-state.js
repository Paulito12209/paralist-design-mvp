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

import { defaultType, resourcePick, types } from "../../data/config.js";

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

  if (pickId !== undefined) composer.pick = pickId;
  else if (typeId === defaultType || typeId === "zeichnung") composer.pick = resourcePick.id;
  else composer.pick = types.some((type) => type.pick && type.id === typeId) ? typeId : null;
}

/** Den Knopf abwählen: ohne Typ entsteht ein Dokument. */
export function clearComposerPick() {
  composer.pick = null;
  composer.type = defaultType;
}

/** Den Vorschlag der Seite festhalten, sobald das Eingabefeld aufgeht. */
export function rememberComposerPreset() {
  composer.preset = { type: composer.type, place: composer.place };
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
