/*
 * Der Zustand des Eingabefelds, solange es offen ist: gewählter Typ,
 * gewählter Knopf, Ablageort und die noch nicht angelegten Anhänge.
 * Eigene Datei, damit Eingabefeld, Anhänge und Diktat denselben Stand sehen,
 * ohne sich gegenseitig zu kennen.
 * Pfad: src/features/composer/composer-state.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { defaultType, overviewPages, resourcePick, types } from "../../data/config.js";

export const composer = {
  /* Typ des Eintrags, der entstehen würde */
  type: types[0].id,
  /* Welcher Knopf unten hervorgehoben ist; `null` heißt: keiner, es entsteht ein Dokument */
  pick: types[0].id,
  /* Ablageort; `null` ist die Inbox */
  parent: null,
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

  /* Ein Projekt gehört auf die Projekte-Karte, nicht in die Inbox. */
  if (typeId === "projekt") composer.parent = overviewPages[3].parent;
}

/** Den Knopf abwählen: ohne Typ entsteht ein Dokument. */
export function clearComposerPick() {
  composer.pick = null;
  composer.type = defaultType;
}

/** Nach dem Anlegen oder Schließen zurücksetzen. */
export function resetComposerDraft() {
  composer.files = [];
  composer.slot = null;
}
