/*
 * Die Felder des Filters „Verknüpft mit“ in einer Ansicht — für die Ansichten
 * der Aufgaben-Seite (src/data/state.js) und der Projekte
 * (src/data/project-views.js) gleich. Was daraus durchkommt, rechnet
 * src/data/link-filter.js.
 *
 *   linkKinds  Sammel-Kennungen: „any“ (hat irgendeine Verbindung), „inbox“
 *              (liegt nirgends), „space“ (liegt in einem Arbeitsbereich) oder
 *              ein Typ wie „medien“ (hängt an so einem Eintrag)
 *   linkRefs   bestimmte Einträge oder Arbeitsbereiche als Verweis („e:17“, „w:3“)
 *   linkNot    false = „enthält“ (der Eintrag muss passen), true = „enthält
 *              nicht“ (der Eintrag darf nicht passen)
 *
 * Nichts gewählt heißt: nicht gefiltert. Mehrere Werte gelten als ODER.
 * Ältere Stände kannten nur `place` („alle“, „inbox“ oder ein Verweis): das
 * wird hier einmal in die neuen Felder übernommen.
 * Womit eine Ansicht startet (nichts gefiltert), steht in src/data/config.js
 * (linkFilterDefaults).
 * Pfad: src/data/link-filter-fields.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * anyId / inboxId / spaceId -> die Kennungen der drei Sammel-Werte
 *
 * Wie die Werte im Blatt heißen, steht in src/ui/filter-link-section.js.
 */

import { types } from "./config.js";

export const anyId = "any";
export const inboxId = "inbox";
export const spaceId = "space";

/** Filtert die Ansicht nach Verknüpfungen? */
export function linkFilterOn(view) {
  return view.linkKinds.length + view.linkRefs.length > 0;
}

/** Alle Sammel-Werte und Typen, die in `linkKinds` stehen dürfen. */
function knownKinds() {
  return [anyId, inboxId, spaceId, ...types.map((type) => type.id)];
}

/**
 * Die Felder einer gespeicherten Ansicht auf gültige Werte bringen.
 * @param view      die gespeicherte Ansicht
 * @param validRefs Set aller Verweise, die es noch gibt („w:3“, „e:17“)
 */
export function cleanLinkFields(view, validRefs) {
  const kinds = knownKinds();
  const unique = (list, ok) => [...new Set((Array.isArray(list) ? list : []).filter((item) => typeof item === "string" && ok(item)))];
  const linkKinds = unique(view.linkKinds, (id) => kinds.includes(id));
  const linkRefs = unique(view.linkRefs, (ref) => validRefs.has(ref));
  /* Der frühere Ort-Filter: Eingang wird zum Sammel-Wert, ein Verweis zum Verweis */
  if (view.place === inboxId && !linkKinds.includes(inboxId)) linkKinds.push(inboxId);
  else if (typeof view.place === "string" && validRefs.has(view.place) && !linkRefs.includes(view.place)) linkRefs.push(view.place);
  return { linkKinds, linkRefs, linkNot: view.linkNot === true };
}
